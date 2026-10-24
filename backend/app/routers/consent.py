"""
Consent management router for DPDP Act 2023 compliance.
Complies with contracts/openapi.yaml, agents.md §8.4, and Task B5.
"""

from app.db import get_db
from app.schemas.consent import (
    ConsentItemResponse,
    ConsentRecordRequest,
    StudentConsentSummaryResponse,
)
from app.security.deps import Principal, get_current_principal
from app.services.consent import get_consent_summary_service, record_consent_service
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/v1/consent", tags=["Consent"])


@router.post(
    "",
    response_model=ConsentItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record or withdraw consent for data repository, verification, or analytics",
)
def record_consent(
    body: ConsentRecordRequest,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> ConsentItemResponse:
    """
    Appends an immutable consent record to the consent ledger with cryptographic hash chaining.
    - STUDENT may manage consent for self.
    - INSTITUTION_ADMIN may record parental/guardian consent with evidence_ref.
    Lifecycle effects:
    - VERIFICATION_SHARE withdraw -> suspends verifiable credentials and blocks presentations.
    - REPOSITORY withdraw -> pseudonymises PII while preserving statistical counts.
    """
    entry = record_consent_service(
        db,
        purpose=body.purpose,
        action=body.action,
        apaar_id=body.apaar_id,
        evidence_ref=body.evidence_ref,
        guardian_consent=body.guardian_consent,
        principal=principal,
    )
    return ConsentItemResponse.model_validate(entry)


@router.get(
    "/me",
    response_model=StudentConsentSummaryResponse,
    summary="Get active consent summary and audit history",
)
def get_my_consent(
    apaar_id: str | None = Query(
        default=None,
        description="APAAR ID (optional for student self, required for admins)",
    ),
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> StudentConsentSummaryResponse:
    """
    Retrieves purpose-bound consent state (REPOSITORY, VERIFICATION_SHARE, ANALYTICS_AGGREGATE)
    and chronological ledger history for the authenticated student or queried APAAR.
    """
    summary = get_consent_summary_service(
        db,
        apaar_id=apaar_id,
        principal=principal,
    )
    return StudentConsentSummaryResponse.model_validate(summary)
