"""
Academic Year Rollover router.
POST /v1/admin/rollover {from_year, to_year, dry_run} (AICTE_ADMIN).
Uses engine.rollover_preview; dry_run returns counts.
Until engine-v0.5 lands, non-dry-run returns 501.
Complies with contracts/openapi.yaml and Task B4 item 6.
"""

from app.db import get_db
from app.schemas.rollover import RolloverRequest, RolloverSummaryResponse
from app.security.deps import Principal, get_current_principal
from app.services.rollover import execute_rollover_service
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter(prefix="/v1/admin", tags=["Rollover"])


@router.post(
    "/rollover",
    response_model=RolloverSummaryResponse,
    summary="Trigger academic year rollover preview or execution",
)
def trigger_rollover(
    body: RolloverRequest,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> RolloverSummaryResponse:
    """
    Executes or previews academic year rollover using engine.rollover_preview.
    - Restricted to AICTE_ADMIN.
    - dry_run=true generates simulation preview and progression counts.
    - dry_run=false returns 501 until engine-v0.5 is released (Task B7).
    """
    from_yr = body.from_academic_year or body.from_year or "2025-26"
    to_yr = body.to_academic_year or body.to_year or "2026-27"

    return execute_rollover_service(
        db,
        from_year=from_yr,
        to_year=to_yr,
        dry_run=body.dry_run,
        principal=principal,
    )
