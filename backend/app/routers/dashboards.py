"""
Dashboards router for AICTE and Institution analytics.
Cached 30s in-memory.
Complies with Task B7 item 4.
"""

from app.db import get_db
from app.schemas.dashboards import (
    AicteLeaderboards,
    AicteMapMetricResponse,
    AicteSummaryDashboard,
    AnomalyFeedItem,
    InstitutionDqTrend,
    InstitutionSummaryDashboard,
)
from app.security.deps import Principal, get_current_principal
from app.services.dashboards import (
    get_aicte_anomalies_feed_service,
    get_aicte_leaderboards_service,
    get_aicte_map_metric_service,
    get_aicte_summary_service,
    get_institution_dq_trend_service,
    get_institution_summary_service,
)
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

router = APIRouter(prefix="/v1/dashboards", tags=["Dashboards"])


@router.get(
    "/aicte/summary",
    response_model=AicteSummaryDashboard,
    summary="Get national Apex AICTE summary metrics (cached 30s)",
)
def get_aicte_summary(
    db: Session = Depends(get_db),
) -> AicteSummaryDashboard:
    """
    Returns total institutions, coverage %, students, fill %, excess seats,
    quota breakdown, and avg DQ.
    """
    return get_aicte_summary_service(db)


@router.get(
    "/aicte/map",
    response_model=AicteMapMetricResponse,
    summary="Get geographic state-by-state map breakdown (cached 30s)",
)
def get_aicte_map(
    metric: str = Query(
        "coverage", description="Metric to visualize: coverage, students, dq, fill, excess"
    ),
    db: Session = Depends(get_db),
) -> AicteMapMetricResponse:
    """Returns geographic metrics grouped by LGD state code."""
    return get_aicte_map_metric_service(db, metric=metric)


@router.get(
    "/aicte/leaderboards",
    response_model=AicteLeaderboards,
    summary="Get national leaderboards for excess enrolment, low DQ, and cross-dupes (cached 30s)",
)
def get_aicte_leaderboards(
    db: Session = Depends(get_db),
) -> AicteLeaderboards:
    """Returns top institutions exceeding sanctioned intake, lowest DQ, and most duplicate flags."""
    return get_aicte_leaderboards_service(db)


@router.get(
    "/aicte/anomalies",
    response_model=list[AnomalyFeedItem],
    summary="Get real-time feed of detected batch anomalies (cached 30s)",
)
def get_aicte_anomalies(
    limit: int = Query(50, ge=1, le=200, description="Max feed items"),
    db: Session = Depends(get_db),
) -> list[AnomalyFeedItem]:
    """Returns real-time feed of statistical and rule anomalies across batches."""
    return get_aicte_anomalies_feed_service(db, limit=limit)


@router.get(
    "/institution/summary",
    response_model=InstitutionSummaryDashboard,
    summary="Get institution summary dashboard (cached 30s)",
)
def get_institution_summary(
    principal: Principal = Depends(get_current_principal),
    institution_id: str | None = Query(
        None, description="Optional AICTE ID (for AICTE_ADMIN inspection)"
    ),
    db: Session = Depends(get_db),
) -> InstitutionSummaryDashboard:
    """Returns own students, approved intake, fill rate, active batches, and DQ score."""
    return get_institution_summary_service(db, principal=principal, institution_id=institution_id)


@router.get(
    "/institution/dq-trend",
    response_model=InstitutionDqTrend,
    summary="Get institution batch data quality score trend (cached 30s)",
)
def get_institution_dq_trend(
    principal: Principal = Depends(get_current_principal),
    institution_id: str | None = Query(
        None, description="Optional AICTE ID (for AICTE_ADMIN inspection)"
    ),
    db: Session = Depends(get_db),
) -> InstitutionDqTrend:
    """Returns batch-by-batch historical DQ progression and trend direction."""
    return get_institution_dq_trend_service(db, principal=principal, institution_id=institution_id)


# OpenAPI Contract compatibility aliases
@router.get(
    "/aicte",
    response_model=AicteSummaryDashboard,
    summary="AICTE summary dashboard alias",
)
def get_aicte_summary_alias(db: Session = Depends(get_db)) -> AicteSummaryDashboard:
    return get_aicte_summary_service(db)


@router.get(
    "/map",
    response_model=AicteMapMetricResponse,
    summary="Geographic map breakdown alias",
)
def get_aicte_map_alias(
    metric: str = Query("coverage"),
    db: Session = Depends(get_db),
) -> AicteMapMetricResponse:
    return get_aicte_map_metric_service(db, metric=metric)


@router.get(
    "/leaderboards",
    response_model=AicteLeaderboards,
    summary="National leaderboards alias",
)
def get_aicte_leaderboards_alias(db: Session = Depends(get_db)) -> AicteLeaderboards:
    return get_aicte_leaderboards_service(db)


@router.get(
    "/anomalies",
    response_model=list[AnomalyFeedItem],
    summary="Real-time anomalies feed alias",
)
def get_aicte_anomalies_alias(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[AnomalyFeedItem]:
    return get_aicte_anomalies_feed_service(db, limit=limit)


@router.get(
    "/institution/{institution_id}",
    response_model=InstitutionSummaryDashboard,
    summary="Institution dashboard by ID alias",
)
def get_institution_by_id_alias(
    institution_id: str,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> InstitutionSummaryDashboard:
    return get_institution_summary_service(db, principal=principal, institution_id=institution_id)

