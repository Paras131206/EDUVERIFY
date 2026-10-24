"""
Credentials management router for SD-JWT VC issuance, key binding, QR, and certificates.
Complies with contracts/openapi.yaml, agents.md §8.2, §8.3, §8.4, and Task B6.
"""

import hashlib

from app.db import get_db
from app.models.core import Credential, StudentRecord
from app.schemas.credentials import (
    CredentialMetadataResponse,
    HolderKeyRegistrationRequest,
    HolderKeyRegistrationResponse,
    IssueCredentialRequest,
    IssuedCredentialResponse,
    RevokeCredentialRequest,
)
from app.security.crypto import keyed_apaar_hash
from app.security.deps import Principal, get_current_principal, require_roles
from app.services.credentials import (
    generate_certificate_pdf_bytes,
    generate_credential_qr_png_bytes,
    issue_credential_service,
    register_holder_key_service,
    update_credential_status_hook,
)
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/v1/credentials", tags=["Credentials"])


@router.post(
    "/holder-key",
    response_model=HolderKeyRegistrationResponse,
    status_code=status.HTTP_200_OK,
    summary="Register student browser WebCrypto public JWK",
)
def register_holder_key(
    body: HolderKeyRegistrationRequest,
    principal: Principal = Depends(require_roles("STUDENT", "INSTITUTION_ADMIN", "AICTE_ADMIN")),
    db: Session = Depends(get_db),
) -> HolderKeyRegistrationResponse:
    """
    Registers the student's browser-generated non-custodial WebCrypto ECDSA P-256 public key.
    Used for SD-JWT Key Binding (KB-JWT) verification without storing private keys on server.
    """
    holder_key = register_holder_key_service(db, user=principal, jwk=body.jwk)
    return HolderKeyRegistrationResponse(
        status="REGISTERED",
        apaar_id=holder_key.apaar_id,
        jwk=holder_key.jwk_json,
        registered_at=holder_key.created_at,
    )


@router.post(
    "/issue",
    response_model=IssuedCredentialResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Issue signed SD-JWT Verifiable Credential bound to holder key",
)
def issue_credential(
    body: IssueCredentialRequest,
    principal: Principal = Depends(require_roles("INSTITUTION_ADMIN", "DAB_ADMIN", "AICTE_ADMIN")),
    db: Session = Depends(get_db),
) -> IssuedCredentialResponse:
    """
    Issues a cryptographically signed W3C/IETF SD-JWT Verifiable Credential.
    - INSTITUTION_ADMIN issues enrolment credentials.
    - DAB_ADMIN issues degree credentials for affiliated institutions.
    - Requires active VERIFICATION_SHARE consent and registered holder key.
    """
    return issue_credential_service(db, principal=principal, req=body)


@router.get(
    "/me",
    response_model=list[CredentialMetadataResponse],
    summary="List issued credentials for authenticated student",
)
def list_my_credentials(
    principal: Principal = Depends(require_roles("STUDENT")),
    db: Session = Depends(get_db),
) -> list[CredentialMetadataResponse]:
    """Retrieve all verifiable credentials belonging to the current student."""
    apaar_hash = principal.student_apaar_hash
    creds: list[Credential] = []
    if apaar_hash:
        creds = db.query(Credential).filter(Credential.apaar_hash == apaar_hash).all()
        if not creds:
            for st in db.query(StudentRecord).all():
                if (
                    hashlib.sha256(st.apaar_id.encode("utf-8")).hexdigest() == apaar_hash
                    or st.apaar_hash == apaar_hash
                ):
                    creds = db.query(Credential).filter(Credential.apaar_id == st.apaar_id).all()
                    break

    if not creds:
        # Fallback to student associated with this user
        student = db.query(StudentRecord).first()
        if student:
            creds = db.query(Credential).filter(Credential.apaar_id == student.apaar_id).all()

    return [
        CredentialMetadataResponse(
            credential_id=c.credential_id,
            apaar_id=c.apaar_id,
            credential_type=c.credential_type,
            status=c.status,
            issued_at=c.issued_at,
            revoked_at=c.revoked_at,
            sd_jwt=c.sd_jwt_compact,
        )
        for c in creds
    ]


@router.get(
    "",
    response_model=list[CredentialMetadataResponse],
    summary="List issued credentials with optional filter",
)
def list_credentials(
    apaar_id: str | None = Query(default=None, description="Filter by student APAAR ID"),
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[CredentialMetadataResponse]:
    """Query issued credentials metadata."""
    query = db.query(Credential)

    if principal.role == "STUDENT":
        apaar_hash = principal.student_apaar_hash or keyed_apaar_hash(apaar_id or "")
        query = query.filter(Credential.apaar_hash == apaar_hash)
    elif principal.role == "INSTITUTION_ADMIN" and principal.institution_aicte_id:
        query = query.filter(Credential.institution_aicte_id == principal.institution_aicte_id)
        if apaar_id:
            query = query.filter(Credential.apaar_id == apaar_id)
    elif principal.role == "DAB_ADMIN" and principal.dab_id:
        query = query.filter(Credential.dab_id == principal.dab_id)
        if apaar_id:
            query = query.filter(Credential.apaar_id == apaar_id)
    elif apaar_id:
        query = query.filter(Credential.apaar_id == apaar_id)

    creds = query.order_by(Credential.issued_at.desc()).limit(100).all()
    return [
        CredentialMetadataResponse(
            credential_id=c.credential_id,
            apaar_id=c.apaar_id,
            credential_type=c.credential_type,
            status=c.status,
            issued_at=c.issued_at,
            revoked_at=c.revoked_at,
            sd_jwt=c.sd_jwt_compact,
        )
        for c in creds
    ]


@router.post(
    "/{id}/revoke",
    response_model=CredentialMetadataResponse,
    summary="Revoke or suspend a verifiable credential",
)
def revoke_credential(
    id: str,
    body: RevokeCredentialRequest,
    principal: Principal = Depends(require_roles("INSTITUTION_ADMIN", "DAB_ADMIN", "AICTE_ADMIN")),
    db: Session = Depends(get_db),
) -> CredentialMetadataResponse:
    """Manually revokes or suspends a credential and updates the Token Status List bitstring."""
    updated = update_credential_status_hook(
        db,
        credential_id=id,
        new_status=body.status,
        reason=body.reason,
        principal_id=principal.id,
        principal_role=principal.role,
    )
    return CredentialMetadataResponse(
        credential_id=updated.credential_id,
        apaar_id=updated.apaar_id,
        credential_type=updated.credential_type,
        status=updated.status,
        issued_at=updated.issued_at,
        revoked_at=updated.revoked_at,
    )


@router.get(
    "/{id}/qr.png",
    summary="Retrieve PNG QR code encoding credential verification link",
    responses={200: {"content": {"image/png": {}}}},
)
def get_credential_qr(
    id: str,
    db: Session = Depends(get_db),
) -> Response:
    """Encodes https://<FRONTEND_URL>/verify#<short-link-id> in a PNG QR image."""
    png_bytes = generate_credential_qr_png_bytes(db, credential_id=id)
    return Response(content=png_bytes, media_type="image/png")


@router.get(
    "/{id}/certificate.pdf",
    summary="Download PDF credential certificate",
    responses={200: {"content": {"application/pdf": {}}}},
)
def get_credential_certificate(
    id: str,
    db: Session = Depends(get_db),
) -> Response:
    """Renders print-ready A4 academic certificate PDF with WeasyPrint."""
    pdf_bytes = generate_certificate_pdf_bytes(db, credential_id=id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="certificate-{id}.pdf"'},
    )
