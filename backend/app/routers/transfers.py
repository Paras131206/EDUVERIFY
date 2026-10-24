"""
Student Transfers router: initiate, list, approve/reject, and override.
Complies with contracts/openapi.yaml and Task B4.
"""

from app.db import get_db
from app.schemas.transfers import (
    CreateTransferRequest,
    TransferDecisionRequest,
    TransferOverrideRequest,
    TransferRecordResponse,
)
from app.security.deps import Principal, get_current_principal
from app.services.transfers import (
    create_transfer_service,
    decide_transfer_service,
    list_transfers_service,
    override_transfer_service,
)
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/v1/transfers", tags=["Transfers"])


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=TransferRecordResponse,
    summary="Initiate student transfer request",
)
def create_transfer(
    body: CreateTransferRequest,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> TransferRecordResponse:
    """Initiates student transfer request by destination institution."""
    transfer = create_transfer_service(
        db,
        apaar_id=body.apaar_id,
        from_institution_id=body.from_institution_id,
        to_program_code=body.to_program_code,
        academic_year=body.academic_year,
        transfer_certificate_ref=body.transfer_certificate_ref,
        reason=body.reason,
        principal=principal,
    )
    return TransferRecordResponse.model_validate(transfer)


@router.get(
    "",
    response_model=list[TransferRecordResponse],
    summary="List student transfer requests",
)
def list_transfers(
    direction: str | None = Query(None, description="in or out"),
    status_filter: str | None = Query(
        None, alias="status", description="PENDING, APPROVED, REJECTED, OVERRIDDEN"
    ),
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[TransferRecordResponse]:
    """Lists student transfer requests with direction filtering."""
    rows = list_transfers_service(
        db, direction=direction, status_filter=status_filter, principal=principal
    )
    return [TransferRecordResponse.model_validate(t) for t in rows]


@router.post(
    "/{id}/approve",
    response_model=TransferRecordResponse,
    summary="Source institution approves transfer",
)
def approve_transfer(
    id: str,
    body: TransferDecisionRequest | None = None,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> TransferRecordResponse:
    """Source institution approves transfer. Sets source student record to TRANSFERRED_OUT."""
    remarks = body.remarks if body else None
    transfer = decide_transfer_service(
        db, transfer_id=id, decision="APPROVED", remarks=remarks, principal=principal
    )
    return TransferRecordResponse.model_validate(transfer)


@router.post(
    "/{id}/reject",
    response_model=TransferRecordResponse,
    summary="Source institution rejects transfer",
)
def reject_transfer(
    id: str,
    body: TransferDecisionRequest | None = None,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> TransferRecordResponse:
    """Source institution rejects transfer."""
    remarks = body.remarks if body else None
    transfer = decide_transfer_service(
        db, transfer_id=id, decision="REJECTED", remarks=remarks, principal=principal
    )
    return TransferRecordResponse.model_validate(transfer)


@router.post(
    "/{id}/decide",
    response_model=TransferRecordResponse,
    summary="Source institution approve or reject transfer (OpenAPI contract)",
)
def decide_transfer(
    id: str,
    body: TransferDecisionRequest,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> TransferRecordResponse:
    """Source institution decides transfer."""
    transfer = decide_transfer_service(
        db, transfer_id=id, decision=body.decision, remarks=body.remarks, principal=principal
    )
    return TransferRecordResponse.model_validate(transfer)


@router.post(
    "/{id}/override",
    response_model=TransferRecordResponse,
    summary="AICTE Admin override for stale or disputed transfers",
)
def override_transfer(
    id: str,
    body: TransferOverrideRequest,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> TransferRecordResponse:
    """
    AICTE Administrator statutory override.
    On approval, sets source record to TRANSFERRED_OUT.
    """
    transfer = override_transfer_service(
        db, transfer_id=id, decision=body.decision, reason=body.reason, principal=principal
    )
    return TransferRecordResponse.model_validate(transfer)
