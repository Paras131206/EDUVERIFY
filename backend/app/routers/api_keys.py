"""
API key management router for institution-scoped ingestion and read keys.
Complies with contracts/openapi.yaml, agents.md §9, and prompt B1.
"""

import hashlib
import secrets
from datetime import UTC, datetime

from app.db import get_db
from app.models.auth import ApiKey
from app.schemas.auth import ApiKeyCreatedResponse, ApiKeyMetadata, CreateApiKeyRequest
from app.security.deps import (
    Principal,
    require_roles,
    require_same_institution,
)
from app.services.audit import append_audit_log
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/v1/api-keys", tags=["API Keys"])


@router.post(
    "",
    response_model=ApiKeyCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate scoped API key for institution",
)
def create_api_key(
    request: Request,
    body: CreateApiKeyRequest,
    principal: Principal = Depends(require_roles("INSTITUTION_ADMIN")),
    db: Session = Depends(get_db),
) -> ApiKeyCreatedResponse:
    """
    Creates an API key scoped to the authenticated INSTITUTION_ADMIN's institution.
    Returns the raw unhashed key once only. Format: evk_<prefix>_<secret>.
    """
    if not principal.institution_aicte_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": "Admin has no associated institution", "code": "INVALID_STATE"},
        )

    # Prefix is 8 chars, secret is 32 chars
    prefix = secrets.token_hex(4)
    secret = secrets.token_urlsafe(24)
    raw_key = f"evk_{prefix}_{secret}"
    key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    key_record = ApiKey(
        institution_aicte_id=principal.institution_aicte_id,
        name=body.name,
        prefix=prefix,
        key_hash=key_hash,
        scopes=list(body.scopes),
        created_by=principal.id,
    )
    db.add(key_record)

    ip_addr = request.client.host if request.client else None
    append_audit_log(
        db,
        action="API_KEY_CREATED",
        actor_type="USER",
        actor_id=principal.id,
        role=principal.role,
        resource="API_KEY",
        payload={
            "key_name": body.name,
            "prefix": prefix,
            "scopes": list(body.scopes),
            "institution_id": principal.institution_aicte_id,
        },
        ip_address=ip_addr,
    )
    db.commit()

    return ApiKeyCreatedResponse(
        id=key_record.id,
        name=key_record.name,
        prefix=key_record.prefix,
        raw_key=raw_key,
        scopes=key_record.scopes,
    )


@router.get(
    "",
    response_model=list[ApiKeyMetadata],
    summary="List active API keys for institution",
)
def list_api_keys(
    principal: Principal = Depends(require_roles("INSTITUTION_ADMIN", "AICTE_ADMIN")),
    db: Session = Depends(get_db),
) -> list[ApiKeyMetadata]:
    """Lists active (non-revoked) API keys for the principal's institution."""
    query = db.query(ApiKey).filter(ApiKey.revoked_at.is_(None))

    if principal.role != "AICTE_ADMIN":
        query = query.filter(ApiKey.institution_aicte_id == principal.institution_aicte_id)

    keys = query.order_by(ApiKey.created_at.desc()).all()
    return [ApiKeyMetadata.model_validate(k) for k in keys]


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke an API key",
)
def revoke_api_key(
    id: str,
    request: Request,
    principal: Principal = Depends(require_roles("INSTITUTION_ADMIN", "AICTE_ADMIN")),
    db: Session = Depends(get_db),
) -> None:
    """Revokes an API key belonging to the institution."""
    key = db.query(ApiKey).filter(ApiKey.id == id).first()
    if not key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "API key not found", "code": "NOT_FOUND"},
        )

    require_same_institution(principal, key.institution_aicte_id)

    key.revoked_at = datetime.now(UTC)

    ip_addr = request.client.host if request.client else None
    append_audit_log(
        db,
        action="API_KEY_REVOKED",
        actor_type="USER",
        actor_id=principal.id,
        role=principal.role,
        resource="API_KEY",
        resource_id=key.id,
        payload={"prefix": key.prefix, "institution_id": key.institution_aicte_id},
        ip_address=ip_addr,
    )
    db.commit()
