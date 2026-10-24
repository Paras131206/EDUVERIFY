"""
Pydantic schemas for Trust Layer (SD-JWT VC, Verification, DID, and Status Lists).
Complies with agents.md §8.2, §8.3, §8.4, prompt B6, and contracts/schemas/credential.json.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class HolderKeyRegistrationRequest(BaseModel):
    """Student WebCrypto public JWK registration payload."""

    jwk: dict[str, Any] = Field(
        ...,
        description=(
            "Public ECDSA P-256 JWK from student browser WebCrypto (kty=EC, crv=P-256, x, y)"
        ),
    )


class HolderKeyRegistrationResponse(BaseModel):
    """Response after successful student holder key registration."""

    status: str = Field(default="REGISTERED")
    apaar_id: str
    jwk: dict[str, Any]
    registered_at: datetime


class IssueCredentialRequest(BaseModel):
    """Request payload for issuing a signed SD-JWT Verifiable Credential."""

    apaar_id: str = Field(..., pattern=r"^\d{12}$", description="12-digit student APAAR ID")
    credential_type: str = Field(
        default="EduVerifyEnrolmentCredential",
        description="Credential type: ENROLMENT_CREDENTIAL, DEGREE_CERTIFICATE, "
        "EduVerifyEnrolmentCredential, or EduVerifyDegreeCredential",
    )
    holder_jwk: dict[str, Any] | None = Field(
        default=None,
        description="Optional holder JWK; if omitted, previously registered holder key is used",
    )


class IssuedCredentialResponse(BaseModel):
    """Response payload returning signed SD-JWT credential and QR code."""

    credential_id: str
    sd_jwt: str = Field(..., description="Signed SD-JWT compact string")
    qr_data_uri: str = Field(..., description="Base64 data URI of QR code image")
    issued_at: datetime


class CredentialMetadataResponse(BaseModel):
    """Metadata response for a student or institution credential query."""

    credential_id: str
    apaar_id: str
    credential_type: str
    status: str = Field(description="VALID, REVOKED, SUPERSEDED, SUSPENDED")
    issued_at: datetime
    revoked_at: datetime | None = None
    sd_jwt: str | None = None


class RevokeCredentialRequest(BaseModel):
    """Request payload to manually revoke or suspend a verifiable credential."""

    reason: str = Field(..., description="Administrative reason for revocation")
    status: str = Field(
        default="REVOKED",
        description="Target status: REVOKED or SUSPENDED",
    )


class PresentationNonceResponse(BaseModel):
    """Response payload for 5-minute replay-prevention verification challenge."""

    nonce: str
    expires_at: datetime


class PresentationRequest(BaseModel):
    """Verification presentation payload containing SD-JWT and holder key binding."""

    sd_jwt_presentation: str | None = Field(
        default=None,
        description="Tilde-delimited SD-JWT presentation with disclosures and KB-JWT",
    )
    presentation: str | None = Field(
        default=None,
        description="Alias for sd_jwt_presentation",
    )
    nonce: str | None = Field(
        default=None,
        description="Challenge nonce retrieved via GET /v1/verify/nonce",
    )
    aud: str | None = Field(
        default=None,
        description="Audience URI of the verifier",
    )


class VerificationResultResponse(BaseModel):
    """Standardized verification result payload."""

    result: str = Field(
        description="Result status: VALID, INVALID, REVOKED, SUPERSEDED, or SUSPENDED"
    )
    status: str = Field(
        description="Status code: VALID, REVOKED, SUPERSEDED, SUSPENDED, "
        "INVALID_SIGNATURE, EXPIRED, or KEY_BINDING_FAILED"
    )
    valid: bool = Field(description="True if credential signature, trust, and status are valid")
    issuer: str | None = Field(default=None, description="Issuer DID string")
    issuer_name: str | None = Field(default=None, description="Human-readable issuer name")
    issuer_trusted: bool = Field(
        default=True, description="True if issuer DID is in AICTE trust list"
    )
    issued_at: datetime | str | None = None
    checked_at: datetime | str | None = None
    verified_at: datetime | str | None = None
    disclosed_claims: dict[str, Any] = Field(
        default_factory=dict,
        description="Selectively disclosed student claims verified under issuer signature",
    )
    reasons: list[str] = Field(
        default_factory=list,
        description="Verification validation logs or rejection error reasons",
    )
    error_message: str | None = None


class TrustListEntry(BaseModel):
    """Single trusted issuer entity in AICTE trust list."""

    did: str
    issuer_id: str
    name: str
    type: str = Field(description="ROOT, INSTITUTION, or DAB")


class TrustListResponse(BaseModel):
    """AICTE-signed trust list response containing authorized issuer DIDs."""

    issuer: str = Field(description="AICTE root issuer DID")
    issued_at: datetime
    trust_list: list[TrustListEntry]
    jwt: str = Field(description="AICTE Ed25519-signed trust list JWT token")


class DidDocumentResponse(BaseModel):
    """W3C did:web document structure."""

    id: str
    context: list[str] = Field(
        default_factory=lambda: [
            "https://www.w3.org/ns/did/v1",
            "https://w3id.org/security/suites/ed25519-2020/v1",
        ],
        alias="@context",
    )
    verificationMethod: list[dict[str, Any]]
    authentication: list[str]
    assertionMethod: list[str]

    model_config = {"populate_by_name": True}


class StatusListResponse(BaseModel):
    """W3C Token Status List response."""

    id: str
    type: str = Field(default="BitstringStatusListEntry")
    statusList: str | dict[str, Any]
