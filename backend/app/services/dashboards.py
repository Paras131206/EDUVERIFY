"""
Analytics and Dashboard aggregation service with 30-second in-memory TTL cache.
Complies with Task B7 item 4.
"""

import logging
import time
from datetime import UTC, datetime
from typing import Any

from app.models.core import (
    Batch,
    DuplicateFlag,
    Institution,
    Issue,
    ProgramIntake,
    State,
    StudentRecord,
)
from app.schemas.dashboards import (
    AicteLeaderboardItem,
    AicteLeaderboards,
    AicteMapMetricResponse,
    AicteSummaryDashboard,
    AnomalyFeedItem,
    DqTrendPoint,
    InstitutionDqTrend,
    InstitutionSummaryDashboard,
    StateMetric,
)
from app.security.deps import Principal
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# In-memory thread-safe cache with 30s TTL
_CACHE: dict[str, tuple[float, Any]] = {}
CACHE_TTL_SECONDS = 30.0


def _get_from_cache(key: str) -> Any | None:
    now = time.time()
    if key in _CACHE:
        cached_time, val = _CACHE[key]
        if now - cached_time < CACHE_TTL_SECONDS:
            return val
    return None


def _set_to_cache(key: str, val: Any) -> None:
    _CACHE[key] = (time.time(), val)


def clear_dashboard_cache() -> None:
    """Clears the dashboard aggregation in-memory cache."""
    _CACHE.clear()


def get_aicte_summary_service(db: Session) -> AicteSummaryDashboard:
    """Calculates nationwide Apex AICTE summary dashboard metrics with 30s caching."""
    cache_key = "aicte:summary"
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached

    now = datetime.now(UTC)

    # 1. Total institutions
    total_institutions = db.scalar(select(func.count(Institution.institution_aicte_id))) or 0

    # 2. Institutions with submitted batches
    institutions_with_batches = (
        db.scalar(select(func.count(func.distinct(Batch.institution_aicte_id)))) or 0
    )
    coverage = (
        round((institutions_with_batches / total_institutions) * 100.0, 2)
        if total_institutions > 0
        else 0.0
    )

    # 3. Total active enrolled students
    total_students = db.scalar(select(func.count(StudentRecord.apaar_id))) or 0

    # 4. Total approved intake across all institutions
    total_approved_intake = db.scalar(select(func.sum(ProgramIntake.approved_intake))) or 0

    fill_percent = (
        round((total_students / total_approved_intake) * 100.0, 2)
        if total_approved_intake > 0
        else 0.0
    )

    # 5. Supernumerary quota counts
    quotas = list(
        db.execute(
            select(StudentRecord.quota, func.count(StudentRecord.apaar_id)).group_by(
                StudentRecord.quota
            )
        ).all()
    )
    breakdown = {"nri": 0, "oci": 0, "fn": 0, "supernumerary": 0}
    for q_name, cnt in quotas:
        q_str = str(q_name or "").upper()
        if "NRI" in q_str:
            breakdown["nri"] += cnt
        elif "OCI" in q_str:
            breakdown["oci"] += cnt
        elif "FN" in q_str or "FOREIGN" in q_str:
            breakdown["fn"] += cnt
        elif "SUPERNUMERARY" in q_str:
            breakdown["supernumerary"] += cnt

    # 6. Excess enrollment calculation (where enrollment > approved intake per program/inst)
    intake_vs_actual = list(
        db.execute(
            select(
                StudentRecord.institution_aicte_id,
                StudentRecord.program_code,
                func.count(StudentRecord.apaar_id).label("enrolled"),
            ).group_by(StudentRecord.institution_aicte_id, StudentRecord.program_code)
        ).all()
    )

    intake_lookup: dict[tuple[str, str], int] = {}
    for pi in db.scalars(select(ProgramIntake)).all():
        intake_lookup[(pi.institution_aicte_id, pi.program_code)] = pi.approved_intake

    excess_seats = 0
    for inst_id, prog_code, enrolled in intake_vs_actual:
        cap = intake_lookup.get((inst_id, prog_code), 60)
        if enrolled > cap:
            excess_seats += enrolled - cap

    # 7. Average Data Quality Score
    avg_dq = (
        db.scalar(
            select(func.avg(func.coalesce(Batch.quality_score_after, Batch.quality_score_before)))
        )
        or 100.0
    )
    avg_dq = round(float(avg_dq), 2)

    result = AicteSummaryDashboard(
        institutions=total_institutions,
        coverage_percent=coverage,
        students=total_students,
        fill_percent=fill_percent,
        excess_enrolment=excess_seats,
        supernumerary_breakdown=breakdown,
        dq_avg=avg_dq,
        cached_at=now,
    )
    _set_to_cache(cache_key, result)
    return result


def get_aicte_map_metric_service(db: Session, metric: str = "coverage") -> AicteMapMetricResponse:
    """Calculates state-wise geographic metrics by LGD code with 30s caching."""
    clean_metric = metric.strip().lower()
    cache_key = f"aicte:map:{clean_metric}"
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached

    now = datetime.now(UTC)
    states = list(db.scalars(select(State).order_by(State.lgd_state_code)).all())

    # Map institution counts by state
    inst_counts = {
        row[0]: row[1]
        for row in db.execute(
            select(Institution.state_code, func.count(Institution.institution_aicte_id)).group_by(
                Institution.state_code
            )
        ).all()
        if row[0] is not None
    }

    # Student counts by state
    student_counts = {
        row[0]: row[1]
        for row in db.execute(
            select(Institution.state_code, func.count(StudentRecord.apaar_id))
            .join(
                Institution,
                StudentRecord.institution_aicte_id == Institution.institution_aicte_id,
            )
            .group_by(Institution.state_code)
        ).all()
        if row[0] is not None
    }

    # DQ scores by state
    dq_scores = {
        row[0]: row[1]
        for row in db.execute(
            select(
                Institution.state_code,
                func.avg(func.coalesce(Batch.quality_score_after, Batch.quality_score_before)),
            )
            .join(
                Institution,
                Batch.institution_aicte_id == Institution.institution_aicte_id,
            )
            .where(
                func.coalesce(Batch.quality_score_after, Batch.quality_score_before).is_not(None)
            )
            .group_by(Institution.state_code)
        ).all()
        if row[0] is not None and row[1] is not None
    }

    state_metrics: list[StateMetric] = []
    total_val = 0.0
    for s in states:
        inst_cnt = int(inst_counts.get(s.lgd_state_code) or 0)
        stu_cnt = int(student_counts.get(s.lgd_state_code) or 0)
        raw_dq = dq_scores.get(s.lgd_state_code)
        dq_val = round(float(raw_dq), 2) if raw_dq is not None else 100.0
        fill = round((stu_cnt / max(1, inst_cnt * 120)) * 100.0, 2)
        excess = max(0, stu_cnt - (inst_cnt * 100))

        if clean_metric in ("students", "enrolment"):
            metric_val = float(stu_cnt)
        elif clean_metric in ("dq", "quality"):
            metric_val = dq_val
        elif clean_metric in ("fill", "fill_rate"):
            metric_val = fill
        elif clean_metric in ("excess", "excess_enrolment"):
            metric_val = float(excess)
        else:  # coverage / institutions
            metric_val = float(inst_cnt)

        total_val += metric_val
        state_metrics.append(
            StateMetric(
                lgd_state_code=s.lgd_state_code,
                state_name=s.name,
                metric_value=metric_val,
                institutions=inst_cnt,
                students=stu_cnt,
                fill_percent=fill,
                dq_avg=dq_val,
                excess_enrolment=excess,
            )
        )

    nat_avg = round(total_val / max(1, len(states)), 2)
    response = AicteMapMetricResponse(
        metric=clean_metric,
        unit="Count" if clean_metric in ("students", "institutions", "excess") else "%",
        states=state_metrics,
        national_average=nat_avg,
        cached_at=now,
    )
    _set_to_cache(cache_key, response)
    return response


def get_aicte_leaderboards_service(db: Session) -> AicteLeaderboards:
    """
    Calculates national leaderboards: excess enrolment, lowest DQ, and highest cross-duplicates.
    """
    cache_key = "aicte:leaderboards"
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached

    now = datetime.now(UTC)

    # 1. Excess Enrolment
    excess_items: list[AicteLeaderboardItem] = []
    insts = list(db.scalars(select(Institution).limit(20)).all())
    for inst in insts:
        stu_cnt = (
            db.scalar(
                select(func.count(StudentRecord.apaar_id)).where(
                    StudentRecord.institution_aicte_id == inst.institution_aicte_id
                )
            )
            or 0
        )
        approved = (
            db.scalar(
                select(func.sum(ProgramIntake.approved_intake)).where(
                    ProgramIntake.institution_aicte_id == inst.institution_aicte_id
                )
            )
            or 120
        )
        if stu_cnt > approved:
            excess_items.append(
                AicteLeaderboardItem(
                    institution_aicte_id=inst.institution_aicte_id,
                    institution_name=inst.name,
                    metric_value=stu_cnt - approved,
                    detail=f"Enrolled {stu_cnt} vs Sanctioned {approved}",
                )
            )
    excess_items.sort(key=lambda x: x.metric_value, reverse=True)

    # 2. Lowest DQ
    low_dq_rows = list(
        db.execute(
            select(
                Institution.institution_aicte_id,
                Institution.name,
                func.avg(
                    func.coalesce(Batch.quality_score_after, Batch.quality_score_before)
                ).label("avg_dq"),
            )
            .join(Batch, Institution.institution_aicte_id == Batch.institution_aicte_id)
            .where(
                func.coalesce(Batch.quality_score_after, Batch.quality_score_before).is_not(None)
            )
            .group_by(Institution.institution_aicte_id, Institution.name)
            .order_by(
                func.avg(func.coalesce(Batch.quality_score_after, Batch.quality_score_before)).asc()
            )
            .limit(10)
        ).all()
    )
    low_dq_items = [
        AicteLeaderboardItem(
            institution_aicte_id=r[0],
            institution_name=r[1],
            metric_value=round(float(r[2]), 2),
            detail=f"Average Data Quality {round(float(r[2]), 2)}%",
        )
        for r in low_dq_rows
    ]

    # 3. Cross-duplicates
    cross_dupes_rows = list(
        db.execute(
            select(
                Institution.institution_aicte_id,
                Institution.name,
                func.count(DuplicateFlag.id).label("dupe_cnt"),
            )
            .join(Batch, Institution.institution_aicte_id == Batch.institution_aicte_id)
            .join(DuplicateFlag, Batch.batch_id == DuplicateFlag.batch_id)
            .where(DuplicateFlag.match_type == "CROSS_INSTITUTION")
            .group_by(Institution.institution_aicte_id, Institution.name)
            .order_by(func.count(DuplicateFlag.id).desc())
            .limit(10)
        ).all()
    )
    cross_dupe_items = [
        AicteLeaderboardItem(
            institution_aicte_id=r[0],
            institution_name=r[1],
            metric_value=r[2],
            detail=f"{r[2]} cross-institution duplicates detected",
        )
        for r in cross_dupes_rows
    ]

    result = AicteLeaderboards(
        excess_enrolment=excess_items[:10],
        low_dq=low_dq_items,
        most_cross_dupes=cross_dupe_items,
        cached_at=now,
    )
    _set_to_cache(cache_key, result)
    return result


def get_aicte_anomalies_feed_service(db: Session, limit: int = 50) -> list[AnomalyFeedItem]:
    """Returns real-time anomaly and auto-flag feed across institutions."""
    cache_key = f"aicte:anomalies:{limit}"
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached

    now = datetime.now(UTC)
    issues = list(
        db.scalars(
            select(Issue).where(Issue.bucket == "AUTO_FLAG").order_by(Issue.id.desc()).limit(limit)
        ).all()
    )

    feed: list[AnomalyFeedItem] = []
    for iss in issues:
        batch = db.get(Batch, iss.batch_id) if iss.batch_id else None
        inst = (
            db.get(Institution, batch.institution_aicte_id)
            if batch and batch.institution_aicte_id
            else None
        )
        inst_name = inst.name if inst else (batch.institution_aicte_id if batch else "Unknown")
        dt = batch.created_at if batch else now
        feed.append(
            AnomalyFeedItem(
                id=iss.id,
                institution_aicte_id=batch.institution_aicte_id if batch else "AICTE",
                institution_name=inst_name,
                anomaly_type=iss.rule_id,
                severity=iss.priority,
                description=iss.message,
                detected_at=dt,
            )
        )

    _set_to_cache(cache_key, feed)
    return feed


def get_institution_summary_service(
    db: Session,
    principal: Principal,
    institution_id: str | None = None,
) -> InstitutionSummaryDashboard:
    """Returns single institution summary dashboard metrics."""
    inst_aicte_id = institution_id or principal.institution_aicte_id
    if not inst_aicte_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "MISSING_INSTITUTION", "message": "No institution specified"},
        )

    cache_key = f"inst:summary:{inst_aicte_id}"
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached

    now = datetime.now(UTC)
    inst = db.get(Institution, inst_aicte_id)
    inst_name = inst.name if inst else inst_aicte_id

    # Students
    total_stu = (
        db.scalar(
            select(func.count(StudentRecord.apaar_id)).where(
                StudentRecord.institution_aicte_id == inst_aicte_id
            )
        )
        or 0
    )

    # Sanctioned intake
    approved = (
        db.scalar(
            select(func.sum(ProgramIntake.approved_intake)).where(
                ProgramIntake.institution_aicte_id == inst_aicte_id
            )
        )
        or 0
    )

    fill = round((total_stu / approved) * 100.0, 2) if approved > 0 else 0.0

    # Active batches
    active_b = (
        db.scalar(
            select(func.count(Batch.batch_id)).where(
                Batch.institution_aicte_id == inst_aicte_id,
                Batch.status != "COMMITTED",
            )
        )
        or 0
    )

    # DQ score
    avg_dq = (
        db.scalar(
            select(
                func.avg(func.coalesce(Batch.quality_score_after, Batch.quality_score_before))
            ).where(Batch.institution_aicte_id == inst_aicte_id)
        )
        or 100.0
    )

    # Pending reviews
    pending_r = (
        db.scalar(
            select(func.count(Issue.id))
            .join(Batch, Issue.batch_id == Batch.batch_id)
            .where(
                Batch.institution_aicte_id == inst_aicte_id,
                Issue.status == "OPEN",
                Issue.bucket == "HUMAN_REVIEW",
            )
        )
        or 0
    )

    excess = max(0, total_stu - approved)

    result = InstitutionSummaryDashboard(
        institution_aicte_id=inst_aicte_id,
        institution_name=inst_name,
        total_students=total_stu,
        sanctioned_intake=approved,
        fill_percent=fill,
        active_batches=active_b,
        avg_quality_score=round(float(avg_dq), 2),
        pending_reviews=pending_r,
        excess_seats=excess,
        cached_at=now,
    )
    _set_to_cache(cache_key, result)
    return result


def get_institution_dq_trend_service(
    db: Session,
    principal: Principal,
    institution_id: str | None = None,
) -> InstitutionDqTrend:
    """Returns historical DQ trend across batches for caller's institution."""
    inst_aicte_id = institution_id or principal.institution_aicte_id
    if not inst_aicte_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "MISSING_INSTITUTION", "message": "No institution specified"},
        )

    cache_key = f"inst:dq_trend:{inst_aicte_id}"
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached

    now = datetime.now(UTC)
    reports = list(
        db.execute(
            select(
                Batch.batch_id,
                Batch.version,
                func.coalesce(Batch.quality_score_after, Batch.quality_score_before, 100.0),
                Batch.created_at,
            )
            .where(Batch.institution_aicte_id == inst_aicte_id)
            .order_by(Batch.created_at.asc())
        ).all()
    )

    points: list[DqTrendPoint] = []
    for r in reports:
        dt = r[3] or now
        points.append(
            DqTrendPoint(
                batch_id=r[0],
                batch_number=r[1],
                quality_score=round(float(r[2]), 2),
                committed_at=dt,
            )
        )

    trend_dir = "STABLE"
    if len(points) >= 2:
        if points[-1].quality_score > points[0].quality_score + 1.0:
            trend_dir = "IMPROVING"
        elif points[-1].quality_score < points[0].quality_score - 1.0:
            trend_dir = "DECLINING"

    result = InstitutionDqTrend(
        institution_aicte_id=inst_aicte_id,
        data_points=points,
        trend_direction=trend_dir,
        cached_at=now,
    )
    _set_to_cache(cache_key, result)
    return result
