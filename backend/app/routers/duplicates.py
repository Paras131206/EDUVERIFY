"""
Duplicates router: list clusters, view side-by-side records, and resolve.
Complies with contracts/openapi.yaml and Task B4.
"""

from typing import Any

from app.db import get_db
from app.schemas.duplicates import (
    DuplicateClusterResponse,
    DuplicateResolutionRequest,
)
from app.security.deps import Principal, get_current_principal
from app.services.duplicates import (
    get_duplicate_cluster_service,
    list_duplicates_service,
    resolve_duplicate_service,
)
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

router = APIRouter(prefix="/v1/duplicates", tags=["Duplicates"])


@router.get(
    "",
    response_model=list[DuplicateClusterResponse],
    summary="List intra- and cross-institution duplicate clusters",
)
def list_duplicates(
    scope: str | None = Query(None, description="INTRA or CROSS_INSTITUTION"),
    bucket: str | None = Query(None, description="AUTO_FLAG, HUMAN_REVIEW, INFO"),
    status_filter: str | None = Query(
        None, alias="status", description="OPEN, SAME_PERSON, DIFFERENT_PEOPLE, TRANSFER"
    ),
    batch_id: str | None = Query(None),
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """
    Lists duplicate clusters with RBAC filtering.
    - AICTE roles see all duplicates including cross-institution.
    - Institutions see only clusters involving their own institution.
    """
    return list_duplicates_service(
        db,
        scope=scope,
        bucket=bucket,
        status_filter=status_filter,
        batch_id=batch_id,
        principal=principal,
    )


@router.get(
    "/{id}",
    response_model=DuplicateClusterResponse,
    summary="Get duplicate cluster with side-by-side masked records",
)
def get_duplicate(
    id: str,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Retrieves duplicate cluster side-by-side comparison."""
    return get_duplicate_cluster_service(db, flag_or_cluster_id=id, principal=principal)


@router.post(
    "/{id}/resolve",
    response_model=DuplicateClusterResponse,
    summary="Resolve a duplicate cluster decision",
)
def resolve_duplicate(
    id: str,
    body: DuplicateResolutionRequest,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Resolves a duplicate cluster.
    - If CROSS_INSTITUTION: strictly restricted to AICTE_ANALYST or AICTE_ADMIN.
    - If INTRA: INSTITUTION_ADMIN or AICTE_ADMIN.
    """
    return resolve_duplicate_service(
        db,
        flag_or_cluster_id=id,
        decision=body.decision,
        resolution_alias=body.resolution,
        note=body.note,
        remarks_alias=body.remarks,
        principal=principal,
    )
