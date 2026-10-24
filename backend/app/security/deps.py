"""
Role-based access control (RBAC), principal resolution, and scope enforcement dependencies.
Complies with agents.md §9 and prompt B1.
"""

import hashlib
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

import jwt
from app.db import get_db
from app.models.auth import ApiKey, User
from app.security.tokens import decode_access_token
from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session


@dataclass
class Principal:
    """Authenticated subject representing either an interactive session or an API key client."""

    id: str
    email: str | None
    role: str
    institution_aicte_id: str | None = None
    dab_id: str | None = None
    student_apaar_hash: str | None = None
    scopes: list[str] = field(default_factory=list)
    is_api_key: bool = False


# Alias for backwards compatibility with earlier prompts / IDE cache
AuthenticatedPrincipal = Principal


def get_current_principal(
    request: Request,
    authorization: str | None = Header(None),
    x_api_key: str | None = Header(None, alias="X-API-Key"),
    db: Session = Depends(get_db),
) -> Principal:
    """
    Resolves the authenticated Principal from Bearer JWT or API Key headers.
    Supports Authorization: Bearer <jwt>, Authorization: ApiKey <key>, or X-API-Key: <key>.
    """
    raw_api_key: str | None = None
    bearer_token: str | None = None

    if authorization:
        parts = authorization.strip().split(maxsplit=1)
        if len(parts) == 2:
            scheme, token = parts
            if scheme.lower() == "bearer":
                bearer_token = token
            elif scheme.lower() == "apikey":
                raw_api_key = token
    elif x_api_key:
        raw_api_key = x_api_key.strip()

    # 1. Handle API Key Authentication
    if raw_api_key:
        key_hash = hashlib.sha256(raw_api_key.encode("utf-8")).hexdigest()
        api_key = (
            db.query(ApiKey)
            .filter(ApiKey.key_hash == key_hash, ApiKey.revoked_at.is_(None))
            .first()
        )
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"detail": "Invalid or revoked API key", "code": "AUTH_FAILED"},
            )

        api_key.last_used_at = datetime.now(UTC)
        db.flush()

        return Principal(
            id=api_key.id,
            email=None,
            role="INSTITUTION_ADMIN",
            institution_aicte_id=api_key.institution_aicte_id,
            dab_id=None,
            student_apaar_hash=None,
            scopes=api_key.scopes,
            is_api_key=True,
        )

    # 2. Handle Bearer JWT Authentication
    if bearer_token:
        try:
            payload = decode_access_token(bearer_token)
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"detail": "Token has expired", "code": "TOKEN_EXPIRED"},
            ) from None
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"detail": "Invalid token", "code": "AUTH_FAILED"},
            ) from None

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"detail": "Invalid token subject", "code": "AUTH_FAILED"},
            )

        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"detail": "User account inactive or not found", "code": "AUTH_FAILED"},
            )

        return Principal(
            id=user.id,
            email=user.email,
            role=user.role,
            institution_aicte_id=user.institution_aicte_id,
            dab_id=user.dab_id,
            student_apaar_hash=user.student_apaar_hash,
            scopes=["upload", "read"],
            is_api_key=False,
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"detail": "Missing authentication credentials", "code": "AUTH_REQUIRED"},
    )


def get_current_principal_optional(
    request: Request,
    authorization: str | None = Header(None),
    x_api_key: str | None = Header(None, alias="X-API-Key"),
    db: Session = Depends(get_db),
) -> Principal | None:
    """Optional dependency resolving authenticated principal if credentials exist, else None."""
    if not authorization and not x_api_key:
        return None
    try:
        return get_current_principal(
            request=request, authorization=authorization, x_api_key=x_api_key, db=db
        )
    except HTTPException:
        return None


def require_roles(*allowed_roles: Any):
    """Factory creating an endpoint dependency enforcing allowed user roles."""
    flat_roles: set[str] = set()
    for r in allowed_roles:
        if isinstance(r, (list, tuple, set)):
            for item in r:
                flat_roles.add(item.value if hasattr(item, "value") else str(item))
        else:
            flat_roles.add(r.value if hasattr(r, "value") else str(r))

    def role_checker(principal: Principal = Depends(get_current_principal)) -> Principal:
        if principal.role not in flat_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "detail": f"Access forbidden: role '{principal.role}' is not authorized",
                    "code": "FORBIDDEN",
                },
            )
        return principal

    return role_checker


def require_scope(required_scope: str):
    """Factory creating a dependency enforcing specific API key or token scopes."""

    def scope_checker(principal: Principal = Depends(get_current_principal)) -> Principal:
        if required_scope not in principal.scopes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "detail": f"Access forbidden: scope '{required_scope}' is required",
                    "code": "FORBIDDEN",
                },
            )
        return principal

    return scope_checker


def require_same_institution(principal: Principal, target_institution_id: str | None) -> None:
    """Helper verifying that principal belongs to the specified institution (or is AICTE_ADMIN)."""
    if principal.role == "AICTE_ADMIN":
        return
    if (
        principal.institution_aicte_id is not None
        and target_institution_id is not None
        and principal.institution_aicte_id == target_institution_id
    ):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={
            "detail": "Access forbidden: cannot access another institution's data",
            "code": "FORBIDDEN",
        },
    )


def require_self_student(principal: Principal, apaar_id: str) -> None:
    """Helper verifying that principal is either AICTE_ADMIN or the matching student."""
    if principal.role == "AICTE_ADMIN":
        return
    if principal.role == "STUDENT":
        expected_hash = hashlib.sha256(apaar_id.encode("utf-8")).hexdigest()
        if principal.student_apaar_hash == expected_hash:
            return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={
            "detail": "Access forbidden: students may only access their own records",
            "code": "FORBIDDEN",
        },
    )
