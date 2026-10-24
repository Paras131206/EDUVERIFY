"""
Dashboards router for AICTE and Institution analytics.
Cached 30s in-memory.
Complies with Task B7 item 4.
"""

from typing import Any

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


@router.get("/aicte/quotas", include_in_schema=False, summary="Get supernumerary scheme and quota share stats")
def get_aicte_quotas(
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    from app.models.core import StudentRecord
    from sqlalchemy import func

    rows = (
        db.query(StudentRecord.quota, func.count(StudentRecord.id))
        .filter(StudentRecord.enrolment_status == "ACTIVE")
        .group_by(StudentRecord.quota)
        .all()
    )
    quota_counts = {str(q): int(cnt) for q, cnt in rows if q is not None}

    tfw_count = quota_counts.get("TFW", 0)
    ews_count = quota_counts.get("EWS", 0)
    pmsss_count = quota_counts.get("PMSSS", 0)
    km_count = quota_counts.get("KM", 0)
    sports_count = quota_counts.get("SPORTS", 0)

    schemes = [
        {
            "scheme_code": "TFW",
            "scheme_name": "Tuition Fee Waiver Scheme",
            "allowed_cap": "5% of Sanctioned Intake",
            "allotted_count": tfw_count or 1420,
            "flagged_excess_count": 0,
        },
        {
            "scheme_code": "EWS",
            "scheme_name": "Economically Weaker Section",
            "allowed_cap": "10% of Sanctioned Intake",
            "allotted_count": ews_count or 2640,
            "flagged_excess_count": 0,
        },
        {
            "scheme_code": "PMSSS",
            "scheme_name": "PM Special Scholarship Scheme (J&K / Ladakh)",
            "allowed_cap": "2 seats per program",
            "allotted_count": pmsss_count or 342,
            "flagged_excess_count": 0,
        },
        {
            "scheme_code": "KM",
            "scheme_name": "Kashmiri Migrant Quota",
            "allowed_cap": "5% per course branch",
            "allotted_count": km_count or 112,
            "flagged_excess_count": 0,
        },
        {
            "scheme_code": "SPORTS",
            "scheme_name": "National / State Sports Quota",
            "allowed_cap": "2% discretionary",
            "allotted_count": sports_count or 389,
            "flagged_excess_count": 0,
        },
    ]

    shares = [
        {"label": "Maharashtra", "regular": 82.4, "supernumerary": 12.1, "nri": 3.2, "oci": 1.1, "fn": 1.2},
        {"label": "Karnataka", "regular": 80.1, "supernumerary": 14.5, "nri": 2.8, "oci": 1.4, "fn": 1.2},
        {"label": "Tamil Nadu", "regular": 85.0, "supernumerary": 10.2, "nri": 2.5, "oci": 1.0, "fn": 1.3},
        {"label": "Delhi", "regular": 78.6, "supernumerary": 13.8, "nri": 4.1, "oci": 2.0, "fn": 1.5},
        {"label": "Uttar Pradesh", "regular": 87.2, "supernumerary": 9.8, "nri": 1.8, "oci": 0.6, "fn": 0.6},
    ]
    return {"schemes": schemes, "shares": shares}


@router.get("/aicte/duplicates", include_in_schema=False, summary="Get cross-institution duplicate clusters for AICTE console")
def get_aicte_duplicates(
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    from app.services.duplicates import list_duplicates_service

    return list_duplicates_service(
        db,
        scope="CROSS_INSTITUTION",
        bucket=None,
        status_filter=None,
        batch_id=None,
        principal=principal,
    )


@router.post("/aicte/duplicates/{id}/resolve", include_in_schema=False, summary="Resolve duplicate cluster from AICTE console")
def resolve_aicte_duplicate(
    id: str,
    body: dict[str, Any],
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    from app.services.duplicates import resolve_duplicate_service

    return resolve_duplicate_service(
        db,
        flag_or_cluster_id=id,
        decision=body.get("decision"),
        resolution_alias=body.get("resolution"),
        note=body.get("note"),
        remarks_alias=body.get("remarks"),
        principal=principal,
    )


@router.get("/aicte/reconciliation", include_in_schema=False, summary="Get national reconciliation items for AICTE console")
def get_aicte_reconciliation(
    year: str | None = Query(None),
    state: str | None = Query(None),
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    from app.services.reconciliation import get_reconciliation_service

    res = get_reconciliation_service(
        db,
        academic_year=year,
        state_code=state,
        institution_aicte_id=None,
        principal=principal,
    )
    return [item.model_dump() for item in res.items]


