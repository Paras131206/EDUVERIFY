"""
Bulk data exports router for AICTE administration.
Complies with Task B7 item 3.
"""

from app.db import get_db
from app.security.deps import Principal, get_current_principal
from app.services.exports import export_students_service
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

router = APIRouter(prefix="/v1/exports", tags=["Exports"])


@router.get(
    "/students",
    summary="Stream bulk student records in CSV or Parquet format",
)
def export_students(
    year: str | None = Query(None, description="Filter by academic year e.g. 2026-27"),
    state: str | None = Query(None, description="Filter by state name or LGD state code"),
    format: str = Query("csv", description="Output format: csv or parquet"),
    unmasked: bool = Query(
        False, description="Set true to export unmasked PII (requires reason parameter)"
    ),
    reason: str | None = Query(
        None, description="Statutory justification reason required when unmasked=true"
    ),
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> Response:
    """
    Streams student records.
    - Restricted to AICTE_ADMIN.
    - Sensitive columns (APAAR, email, mobile) masked by default.
    - If unmasked=true, statutory justification reason is required and audited.
    """
    return export_students_service(
        db,
        academic_year=year,
        state=state,
        fmt=format,
        unmasked=unmasked,
        reason=reason,
        principal=principal,
    )
