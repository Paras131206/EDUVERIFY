"""
Reconciliation and Aggregates router.
Handles:
- POST /v1/aggregates
- GET /v1/declared-totals
- POST /v1/declared-totals
- GET /v1/reconciliation?year=&state=
Complies with contracts/openapi.yaml and Task B4 item 5.
"""

from typing import Any

from app.db import get_db
from app.schemas.aggregates import (
    AggregateSubmissionRequest,
    DeclaredTotalCreateRequest,
    DeclaredTotalResponse,
)
from app.security.deps import Principal, get_current_principal
from app.services.reconciliation import (
    create_declared_total_service,
    get_declared_totals_service,
    get_reconciliation_service,
    submit_aggregates_service,
)
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["Aggregates", "Declared Totals", "Reconciliation"])


@router.post(
    "/v1/aggregates",
    status_code=status.HTTP_201_CREATED,
    summary="Submit statistical totals for aggregate-only institutions",
)
def submit_aggregates(
    body: AggregateSubmissionRequest,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Records statistical program totals for AGGREGATE_ONLY institutions."""
    return submit_aggregates_service(
        db,
        institution_aicte_id=body.institution_aicte_id,
        academic_year=body.academic_year,
        programs=body.programs,
        principal=principal,
    )


@router.get(
    "/v1/aggregates",
    response_model=list[DeclaredTotalResponse],
    summary="List aggregate enrollment submissions",
)
def list_aggregates(
    academic_year: str | None = Query(None),
    institution_aicte_id: str | None = Query(None),
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[DeclaredTotalResponse]:
    """Lists aggregate submissions."""
    rows = get_declared_totals_service(
        db,
        academic_year=academic_year,
        institution_aicte_id=institution_aicte_id,
        principal=principal,
    )
    return [
        DeclaredTotalResponse(
            id=r.id,
            institution_aicte_id=r.institution_aicte_id,
            program_code=r.program_code,
            academic_year=r.academic_year,
            declared_enrolment=r.declared_enrolment,
            declared_supernumerary=r.declared_supernumerary,
            declared_nri=r.declared_nri,
            source=r.source,
            submitted_at=r.submitted_at,
        )
        for r in rows
        if r.source == "AGGREGATE_MODE"
    ]


@router.get(
    "/v1/declared-totals",
    response_model=list[DeclaredTotalResponse],
    summary="Get approved statistical totals for institution programs",
)
def get_declared_totals(
    academic_year: str | None = Query(None),
    institution_aicte_id: str | None = Query(None),
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[DeclaredTotalResponse]:
    """Retrieves declared intake and quota totals."""
    rows = get_declared_totals_service(
        db,
        academic_year=academic_year,
        institution_aicte_id=institution_aicte_id,
        principal=principal,
    )
    return [
        DeclaredTotalResponse(
            id=r.id,
            institution_aicte_id=r.institution_aicte_id,
            program_code=r.program_code,
            academic_year=r.academic_year,
            declared_enrolment=r.declared_enrolment,
            declared_supernumerary=r.declared_supernumerary,
            declared_nri=r.declared_nri,
            source=r.source,
            submitted_at=r.submitted_at,
        )
        for r in rows
    ]


@router.post(
    "/v1/declared-totals",
    status_code=status.HTTP_201_CREATED,
    response_model=DeclaredTotalResponse,
    summary="Register declared intake and quota quotas",
)
def create_declared_totals(
    body: DeclaredTotalCreateRequest,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> DeclaredTotalResponse:
    """Registers declared total quota for an institution program."""
    r = create_declared_total_service(db, body=body, principal=principal)
    return DeclaredTotalResponse(
        id=r.id,
        institution_aicte_id=r.institution_aicte_id,
        program_code=r.program_code,
        academic_year=r.academic_year,
        declared_enrolment=r.declared_enrolment,
        declared_supernumerary=r.declared_supernumerary,
        declared_nri=r.declared_nri,
        source=r.source,
        submitted_at=r.submitted_at,
    )


@router.get(
    "/v1/reconciliation",
    summary="Get reconciliation status comparing uploaded records vs declared totals",
)
def get_reconciliation(
    year: str | None = Query(None, description="Academic year e.g. 2026-27"),
    academic_year: str | None = Query(None, description="Alternative alias for year"),
    state: str | None = Query(None, description="State code filter"),
    institution_aicte_id: str | None = Query(None),
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> Any:
    """
    Returns program-level reconciliation: declared vs uploaded vs aggregate, delta, status.
    Also returns institutional coverage percentage for dashboards.
    """
    effective_year = year or academic_year
    result = get_reconciliation_service(
        db,
        academic_year=effective_year,
        state_code=state,
        institution_aicte_id=institution_aicte_id,
        principal=principal,
    )
    return result
