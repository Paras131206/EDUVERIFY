"""
Verification and decentralized identifier discovery router.
Complies with contracts/openapi.yaml, agents.md §8.2, §8.3, §8.4, and Task B6.
"""

from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from app.config import get_settings
from app.db import get_db
from app.models.core import DegreeAwardingBody, Institution, StatusList
from app.schemas.credentials import (
    DidDocumentResponse,
    PresentationNonceResponse,
    PresentationRequest,
    StatusListResponse,
    TrustListEntry,
    TrustListResponse,
    VerificationResultResponse,
)
from app.security.deps import Principal, get_current_principal_optional
from app.security.limiter import limiter
from app.services.credentials import (
    create_verification_nonce_service,
    get_or_create_active_status_list,
    verify_presentation_service,
)
from app.vc.sdjwt import (
    build_did_document,
    build_issuer_did,
    get_or_create_issuer_key,
)
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

router = APIRouter(tags=["Verification"])
settings = get_settings()


# ============================================================================
# 1. DECENTRALIZED IDENTIFIER (DID:WEB) DISCOVERY
# ============================================================================


@router.get(
    "/.well-known/did.json",
    response_model=DidDocumentResponse,
    summary="Discover AICTE Root Issuer did:web document",
    tags=["Decentralized Identifiers"],
)
def get_root_did_document(
    request: Request,
    db: Session = Depends(get_db),
) -> DidDocumentResponse:
    """
    Returns AICTE Root Issuer W3C did:web document containing public Ed25519 verification keys.
    """
    host = request.headers.get("host")
    _, _, jwk = get_or_create_issuer_key(db, issuer_id="AICTE", host=host)
    doc = build_did_document(issuer_id="AICTE", jwk=jwk, host=host)
    return DidDocumentResponse.model_validate(doc)


@router.get(
    "/issuers/{issuer_id}/did.json",
    response_model=DidDocumentResponse,
    summary="Discover institution or DAB issuer did:web document",
    tags=["Decentralized Identifiers"],
)
def get_issuer_did_document(
    issuer_id: str,
    request: Request,
    db: Session = Depends(get_db),
) -> DidDocumentResponse:
    """Returns institution or DAB did:web document containing public Ed25519 verification keys."""
    host = request.headers.get("host")
    _, _, jwk = get_or_create_issuer_key(db, issuer_id=issuer_id, host=host)
    doc = build_did_document(issuer_id=issuer_id, jwk=jwk, host=host)
    return DidDocumentResponse.model_validate(doc)


# ============================================================================
# 2. TRUST LIST DISCOVERY
# ============================================================================


@router.get(
    "/v1/trust-list",
    response_model=TrustListResponse,
    summary="Retrieve AICTE-signed list of authorized issuer DIDs",
    tags=["Verification"],
)
def get_trust_list(
    request: Request,
    db: Session = Depends(get_db),
) -> TrustListResponse:
    """
    Returns the AICTE-signed cryptographic trust list of approved institutions and DABs.
    Verifiers validate this list against the root AICTE public key from /.well-known/did.json.
    """
    host = request.headers.get("host")
    aicte_priv, aicte_did, aicte_jwk = get_or_create_issuer_key(db, issuer_id="AICTE", host=host)

    now = datetime.now(UTC)
    entries: list[TrustListEntry] = [
        TrustListEntry(
            did=aicte_did,
            issuer_id="AICTE",
            name="All India Council for Technical Education (AICTE Root)",
            type="ROOT",
        )
    ]

    for inst in db.query(Institution).all():
        entries.append(
            TrustListEntry(
                did=build_issuer_did(inst.institution_aicte_id, host=host),
                issuer_id=inst.institution_aicte_id,
                name=inst.name,
                type="INSTITUTION",
            )
        )

    for dab in db.query(DegreeAwardingBody).all():
        entries.append(
            TrustListEntry(
                did=build_issuer_did(dab.dab_id, host=host),
                issuer_id=dab.dab_id,
                name=dab.name,
                type="DAB",
            )
        )

    payload: dict[str, Any] = {
        "iss": aicte_did,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=7)).timestamp()),
        "trust_list": [e.model_dump() for e in entries],
    }

    signed_jwt = jwt.encode(
        payload,
        aicte_priv,
        algorithm="EdDSA",
        headers={"kid": aicte_jwk["kid"], "typ": "JWT"},
    )

    return TrustListResponse(
        issuer=aicte_did,
        issued_at=now,
        trust_list=entries,
        jwt=signed_jwt,
    )


# ============================================================================
# 3. STATUS LIST DISCOVERY
# ============================================================================


@router.get(
    "/v1/status-lists/{id}",
    response_model=StatusListResponse,
    summary="Retrieve W3C bitstring status list for revocation/suspension checks",
    tags=["Status Lists"],
)
def get_status_list_by_id(
    id: str,
    db: Session = Depends(get_db),
) -> StatusListResponse:
    """Retrieves the compressed bitstring status list for offline/online status verification."""
    status_list = (
        db.query(StatusList).filter((StatusList.list_id == id) | (StatusList.id == id)).first()
    )
    if not status_list:
        status_list = get_or_create_active_status_list(db)

    return StatusListResponse(
        id=f"{settings.PUBLIC_BASE_URL}/v1/status-lists/{status_list.list_id}",
        type="BitstringStatusListEntry",
        statusList=status_list.bitstring_data,
    )


# ============================================================================
# 4. REPLAY PROTECTION NONCES
# ============================================================================


@router.get(
    "/v1/verify/nonce",
    response_model=PresentationNonceResponse,
    summary="Generate fresh 5-minute challenge nonce for presentation verification",
    tags=["Verification"],
)
def get_verification_nonce(
    aud: str | None = Query(default=None, description="Audience URI of the verifier"),
    db: Session = Depends(get_db),
) -> PresentationNonceResponse:
    """Issues a cryptographically random single-use nonce valid for 5 minutes."""
    nonce, expires_at = create_verification_nonce_service(db, aud=aud)
    return PresentationNonceResponse(nonce=nonce, expires_at=expires_at)


@router.post(
    "/v1/credentials/presentation-nonce",
    response_model=PresentationNonceResponse,
    summary="Generate fresh presentation nonce (contract alias)",
    tags=["Credentials"],
)
def post_presentation_nonce(
    db: Session = Depends(get_db),
) -> PresentationNonceResponse:
    """Alternative POST endpoint for presentation nonce generation per contract."""
    nonce, expires_at = create_verification_nonce_service(db)
    return PresentationNonceResponse(nonce=nonce, expires_at=expires_at)


# ============================================================================
# 5. PRESENTATION VERIFICATION
# ============================================================================


@router.post(
    "/v1/verify",
    response_model=VerificationResultResponse,
    summary="Verify SD-JWT VC presentation with holder key binding",
    tags=["Verification"],
)
@limiter.limit("60/minute")
def verify_presentation(
    request: Request,
    body: PresentationRequest,
    principal: Principal | None = Depends(get_current_principal_optional),
    db: Session = Depends(get_db),
) -> VerificationResultResponse:
    """
    Cryptographically verifies an SD-JWT presentation:
    1. Checks issuer Ed25519 signature
    2. Validates issuer membership in AICTE trust list
    3. Verifies validity window and expiration (exp)
    4. Evaluates status list bits (REVOKED, SUPERSEDED, SUSPENDED)
    5. Validates holder key binding (KB-JWT) against cnf.jwk and sd_hash
    6. Confirms challenge nonce and replay prevention
    7. Emits tamper-evident audit row without PII
    """
    res = verify_presentation_service(db, req=body, principal=principal)
    return VerificationResultResponse.model_validate(res)
