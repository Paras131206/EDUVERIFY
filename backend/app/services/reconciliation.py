"""
Reconciliation, aggregates submission, and statistical totals services.
Complies with contracts/openapi.yaml and Task B4 item 5.
"""

from datetime import UTC, datetime
from typing import Any

from app.models.core import DeclaredTotal, Institution, Program, StudentRecord
from app.schemas.aggregates import (
    AggregateProgramItem,
    DeclaredTotalCreateRequest,
    ReconciliationItemResponse,
    ReconciliationResponse,
)
from app.security.deps import Principal
from app.services.audit import append_audit_log
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session


def submit_aggregates_service(
    db: Session,
    *,
    institution_aicte_id: str,
    academic_year: str,
    programs: list[AggregateProgramItem],
    principal: Principal,
) -> dict[str, Any]:
    """Records statistical enrollment totals for aggregate-only institutions."""
    if principal.role != "AICTE_ADMIN":
        if (
            principal.role != "INSTITUTION_ADMIN"
            or principal.institution_aicte_id != institution_aicte_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "FORBIDDEN",
                    "message": "Cannot submit aggregates for another institution",
                },
            )

    now = datetime.now(UTC)
    saved_count = 0

    for prog in programs:
        existing = db.scalars(
            select(DeclaredTotal).where(
                DeclaredTotal.institution_aicte_id == institution_aicte_id,
                DeclaredTotal.program_code == prog.program_code,
                DeclaredTotal.academic_year == academic_year,
            )
        ).first()

        if existing:
            existing.declared_enrolment = prog.total_enrolment
            existing.declared_supernumerary = prog.supernumerary_count
            existing.declared_nri = prog.nri_count
            existing.declared_oci = prog.oci_count
            existing.declared_fn = prog.fn_count
            existing.source = "AGGREGATE_MODE"
            existing.submitted_at = now
        else:
            new_tot = DeclaredTotal(
                institution_aicte_id=institution_aicte_id,
                program_code=prog.program_code,
                academic_year=academic_year,
                declared_enrolment=prog.total_enrolment,
                declared_supernumerary=prog.supernumerary_count,
                declared_nri=prog.nri_count,
                declared_oci=prog.oci_count,
                declared_fn=prog.fn_count,
                source="AGGREGATE_MODE",
                submitted_at=now,
            )
            db.add(new_tot)
        saved_count += 1

    append_audit_log(
        db,
        action="AGGREGATES_SUBMITTED",
        actor_type="API_KEY" if principal.is_api_key else "USER",
        actor_id=principal.id,
        role=principal.role,
        resource="AGGREGATES",
        resource_id=institution_aicte_id,
        payload={"academic_year": academic_year, "programs_count": len(programs)},
    )

    db.commit()
    return {
        "message": f"Successfully recorded aggregate totals for {saved_count} programs",
        "institution_aicte_id": institution_aicte_id,
        "academic_year": academic_year,
        "programs_count": saved_count,
    }


def get_declared_totals_service(
    db: Session,
    *,
    academic_year: str | None,
    institution_aicte_id: str | None,
    principal: Principal,
) -> list[DeclaredTotal]:
    """Retrieves declared intake and statistical quotas."""
    stmt = select(DeclaredTotal)
    if academic_year:
        stmt = stmt.where(DeclaredTotal.academic_year == academic_year)
    if institution_aicte_id:
        stmt = stmt.where(DeclaredTotal.institution_aicte_id == institution_aicte_id)
    elif principal.role not in ("AICTE_ADMIN", "AICTE_ANALYST") and principal.institution_aicte_id:
        stmt = stmt.where(DeclaredTotal.institution_aicte_id == principal.institution_aicte_id)

    return list(db.scalars(stmt.order_by(DeclaredTotal.submitted_at.desc())).all())


def create_declared_total_service(
    db: Session,
    *,
    body: DeclaredTotalCreateRequest,
    principal: Principal,
) -> DeclaredTotal:
    """Creates or updates declared total record."""
    if principal.role != "AICTE_ADMIN":
        if (
            principal.role != "INSTITUTION_ADMIN"
            or principal.institution_aicte_id != body.institution_aicte_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "FORBIDDEN",
                    "message": "Cannot create declared totals for another institution",
                },
            )

    now = datetime.now(UTC)
    enrolment = (
        body.declared_enrolment
        if body.declared_enrolment is not None
        else (body.approved_intake or 0)
    )

    existing = db.scalars(
        select(DeclaredTotal).where(
            DeclaredTotal.institution_aicte_id == body.institution_aicte_id,
            DeclaredTotal.program_code == body.program_code,
            DeclaredTotal.academic_year == body.academic_year,
        )
    ).first()

    if existing:
        existing.declared_enrolment = enrolment
        existing.declared_supernumerary = body.declared_supernumerary or 0
        existing.declared_nri = body.declared_nri or 0
        existing.source = "APPROVAL_PROCESS"
        existing.submitted_at = now
        target = existing
    else:
        target = DeclaredTotal(
            institution_aicte_id=body.institution_aicte_id,
            program_code=body.program_code,
            academic_year=body.academic_year,
            declared_enrolment=enrolment,
            declared_supernumerary=body.declared_supernumerary or 0,
            declared_nri=body.declared_nri or 0,
            source="APPROVAL_PROCESS",
            submitted_at=now,
        )
        db.add(target)

    db.commit()
    db.refresh(target)
    return target


def get_reconciliation_service(
    db: Session,
    *,
    academic_year: str | None,
    state_code: str | None,
    institution_aicte_id: str | None,
    principal: Principal,
) -> ReconciliationResponse:
    """
    Computes program-level reconciliation: declared totals vs uploaded student records
    vs aggregates. Also calculates institutional coverage % for dashboards.
    """
    year = academic_year or "2026-27"
    target_inst = institution_aicte_id or (
        principal.institution_aicte_id
        if principal.role not in ("AICTE_ADMIN", "AICTE_ANALYST")
        else None
    )

    # 1. Total institutions and coverage metrics
    inst_query = select(Institution)
    if state_code:
        inst_query = inst_query.where(Institution.state_code == state_code)
    all_insts = list(db.scalars(inst_query).all())
    total_institutions = max(len(all_insts), 1)

    # Institutions with committed student-level records
    uploaded_inst_ids = set(
        db.scalars(
            select(StudentRecord.institution_aicte_id)
            .where(StudentRecord.academic_year == year)
            .distinct()
        ).all()
    )

    # Institutions registered as AGGREGATE_ONLY or submitted in aggregate mode
    agg_only_inst_ids = {
        i.institution_aicte_id
        for i in all_insts
        if getattr(i, "onboarding_level", None) == "AGGREGATE_ONLY"
    }
    agg_submitted_inst_ids = set(
        db.scalars(
            select(DeclaredTotal.institution_aicte_id)
            .where(DeclaredTotal.academic_year == year, DeclaredTotal.source == "AGGREGATE_MODE")
            .distinct()
        ).all()
    )
    all_agg_inst_ids = agg_only_inst_ids | agg_submitted_inst_ids

    student_data_count = len(uploaded_inst_ids)
    coverage_pct = round((student_data_count / total_institutions) * 100.0, 2)

    # 2. Program level reconciliation items
    # Fetch declared totals
    dt_stmt = select(DeclaredTotal).where(DeclaredTotal.academic_year == year)
    if target_inst:
        dt_stmt = dt_stmt.where(DeclaredTotal.institution_aicte_id == target_inst)
    declared_rows = list(db.scalars(dt_stmt).all())

    # Map declared by (institution, program)
    declared_map: dict[tuple[str, str], int] = {}
    aggregate_map: dict[tuple[str, str], int] = {}
    for d in declared_rows:
        key = (d.institution_aicte_id, d.program_code)
        if d.source == "AGGREGATE_MODE":
            aggregate_map[key] = aggregate_map.get(key, 0) + d.declared_enrolment
        else:
            declared_map[key] = declared_map.get(key, 0) + d.declared_enrolment

    # Fetch uploaded student counts
    up_stmt = (
        select(
            StudentRecord.institution_aicte_id,
            StudentRecord.program_code,
            func.count(StudentRecord.apaar_id).label("student_count"),
        )
        .where(
            StudentRecord.academic_year == year,
            StudentRecord.enrolment_status.in_(["ACTIVE", "COMPLETED", "GRADUATED"]),
        )
        .group_by(StudentRecord.institution_aicte_id, StudentRecord.program_code)
    )
    if target_inst:
        up_stmt = up_stmt.where(StudentRecord.institution_aicte_id == target_inst)

    uploaded_counts = db.execute(up_stmt).all()
    uploaded_map: dict[tuple[str, str], int] = {
        (row[0], row[1]): int(row[2]) for row in uploaded_counts
    }

    # All program keys
    all_keys = set(declared_map.keys()) | set(uploaded_map.keys()) | set(aggregate_map.keys())
    if not all_keys:
        # Provide default template items if database empty
        programs = db.scalars(select(Program).limit(5)).all()
        inst_id = target_inst or "1-100010001"
        for p in programs:
            all_keys.add((inst_id, p.program_code))

    items: list[ReconciliationItemResponse] = []
    for inst_id, prog_code in sorted(all_keys):
        decl = declared_map.get((inst_id, prog_code), 0)
        up = uploaded_map.get((inst_id, prog_code), 0)
        agg = aggregate_map.get((inst_id, prog_code), 0)
        effective_actual = up if up > 0 else agg
        delta = effective_actual - decl

        if delta == 0:
            recon_status = "MATCH"
        elif delta < 0:
            recon_status = "MISMATCH"
        else:
            recon_status = "EXCESS"

        items.append(
            ReconciliationItemResponse(
                institution_aicte_id=inst_id,
                program_code=prog_code,
                academic_year=year,
                declared=decl,
                uploaded=up,
                aggregate=agg,
                delta=delta,
                status=recon_status,
            )
        )

    return ReconciliationResponse(
        items=items,
        coverage_pct=coverage_pct,
        total_institutions=total_institutions,
        student_data_institutions=student_data_count,
        aggregate_only_institutions=len(all_agg_inst_ids),
    )
