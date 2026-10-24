"""
Issues and Corrections router: review decisions and audit trail.
Complies with contracts/openapi.yaml and Task B4.
"""

from app.db import get_db
from app.schemas.batches import BatchIssueResponse
from app.schemas.issues import (
    CorrectionResponse,
    IssueDecisionRequest,
)
from app.security.deps import Principal, get_current_principal
from app.services.issues import (
    approve_correction_service,
    decide_issue_service,
    list_corrections_service,
)
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

router = APIRouter(tags=["Issues", "Corrections"])


@router.post(
    "/v1/issues/{id}/decision",
    response_model=BatchIssueResponse,
    summary="Submit human review decision on an issue",
)
@router.post(
    "/v1/issues/{id}/decide",
    response_model=BatchIssueResponse,
    summary="Submit human review decision on an issue (OpenAPI contract alias)",
)
def decide_issue(
    id: str,
    body: IssueDecisionRequest,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> BatchIssueResponse:
    """
    Submits a review decision on a validation issue.
    - INSTITUTION_ADMIN or AICTE_ADMIN can approve fixes or dismissals.
    - STAFF may ONLY PROPOSE fixes; creates a PENDING correction row and leaves Issue OPEN.
    """
    updated_issue = decide_issue_service(
        db,
        issue_id=id,
        action=body.action,
        decision_alias=body.decision,
        value=body.value,
        override_value=body.override_value,
        note=body.note,
        remarks=body.remarks,
        principal=principal,
    )
    return BatchIssueResponse.model_validate(updated_issue)


@router.get(
    "/v1/corrections",
    response_model=list[CorrectionResponse],
    summary="List audit trail of approved and proposed corrections",
)
def list_corrections(
    batch_id: str | None = Query(None),
    apaar_id: str | None = Query(None),
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[CorrectionResponse]:
    """Lists correction records with optional batch_id or apaar_id filtering."""
    rows = list_corrections_service(db, batch_id=batch_id, apaar_id=apaar_id, principal=principal)
    results: list[CorrectionResponse] = []
    for r in rows:
        results.append(
            CorrectionResponse(
                id=r.id,
                correction_id=r.id,
                batch_id=r.batch_id,
                issue_id=r.issue_id,
                apaar_id=r.apaar_id,
                field=r.field,
                old_value=r.old_value_enc,
                new_value=r.new_value_enc,
                status=r.status,
                proposed_by=r.proposed_by,
                approved_by=r.approved_by,
                note=r.note,
                created_at=r.created_at,
                decided_at=r.decided_at,
            )
        )
    return results


@router.post(
    "/v1/corrections/{id}/approve",
    response_model=CorrectionResponse,
    summary="Approve a pending correction proposed by staff",
)
def approve_correction(
    id: str,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> CorrectionResponse:
    """Approves a pending staff correction."""
    r = approve_correction_service(db, correction_id=id, principal=principal)
    return CorrectionResponse(
        id=r.id,
        correction_id=r.id,
        batch_id=r.batch_id,
        issue_id=r.issue_id,
        apaar_id=r.apaar_id,
        field=r.field,
        old_value=r.old_value_enc,
        new_value=r.new_value_enc,
        status=r.status,
        proposed_by=r.proposed_by,
        approved_by=r.approved_by,
        note=r.note,
        created_at=r.created_at,
        decided_at=r.decided_at,
    )
