"""
Duplicates management service: clusters, side-by-side comparisons, and resolution.
Enforces RBAC: AICTE sees cross-institution duplicates, institutions see their own.
Cross-institution resolution is strictly restricted to AICTE_ANALYST or AICTE_ADMIN.
Complies with contracts/openapi.yaml and Task B4.
"""

from datetime import UTC, datetime
from typing import Any

from app.models.core import Batch, DuplicateFlag, StudentRecord
from app.security.deps import Principal
from app.services.audit import append_audit_log
from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

RESOLUTION_MAP = {
    "SAME_PERSON": "SAME_PERSON",
    "MERGE_CONFIRMED": "SAME_PERSON",
    "DIFFERENT_PEOPLE": "DIFFERENT_PEOPLE",
    "FALSE_POSITIVE_DIFFERENT_PERSONS": "DIFFERENT_PEOPLE",
    "TRANSFER": "TRANSFER",
    "TRANSFER_PENDING": "TRANSFER",
}


def _mask_apaar(apaar: str | None) -> str:
    if not apaar:
        return "XXXX-XXXX-XXXX"
    cleaned = apaar.replace("-", "").strip()
    if len(cleaned) == 12:
        return f"XXXX-XXXX-{cleaned[-4:]}"
    return f"XXXX-{cleaned[-4:]}" if len(cleaned) >= 4 else "XXXX"


def _mask_name(name: str | None) -> str:
    if not name:
        return "Anonymous"
    parts = name.split()
    if len(parts) == 1:
        return f"{parts[0][0]}***"
    return f"{parts[0][0]}*** {parts[-1][0]}***"


def list_duplicates_service(
    db: Session,
    *,
    scope: str | None,
    bucket: str | None,
    status_filter: str | None,
    batch_id: str | None,
    principal: Principal,
) -> list[dict[str, Any]]:
    """
    Lists intra- and cross-institution duplicate clusters with RBAC filtering.
    - AICTE roles see all duplicates including cross-institution.
    - Institutions see only clusters involving their own institution.
    """
    stmt = select(DuplicateFlag)
    if scope:
        stmt = stmt.where(DuplicateFlag.match_type == scope.upper())
    if status_filter:
        stmt = stmt.where(DuplicateFlag.status == status_filter.upper())
    if batch_id:
        stmt = stmt.where(DuplicateFlag.batch_id == batch_id)

    flags = list(db.scalars(stmt).all())

    # RBAC filtering
    is_aicte = principal.role in ("AICTE_ADMIN", "AICTE_ANALYST")
    user_inst = principal.institution_aicte_id

    filtered_flags: list[DuplicateFlag] = []
    for f in flags:
        if is_aicte:
            filtered_flags.append(f)
        else:
            # Institution can only see if:
            # 1. match_type is INTRA and batch/student belongs to their institution
            # 2. Or if CROSS_INSTITUTION, their institution is involved (uploader/matched)
            inst_involved = False
            if f.matched_institution_id == user_inst:
                inst_involved = True
            elif f.batch_id:
                b = db.scalars(select(Batch).where(Batch.batch_id == f.batch_id)).first()
                if b and b.institution_aicte_id == user_inst:
                    inst_involved = True
            if inst_involved:
                filtered_flags.append(f)

    # Group flags into cluster responses
    clusters_dict: dict[str, dict[str, Any]] = {}
    for f in filtered_flags:
        cid = f.cluster_id
        if cid not in clusters_dict:
            # Fetch member information
            m1_inst = "Unknown"
            if f.batch_id:
                b = db.scalars(select(Batch).where(Batch.batch_id == f.batch_id)).first()
                if b:
                    m1_inst = b.institution_aicte_id
            m1 = {
                "apaar_id": _mask_apaar(f.apaar_id),
                "institution_aicte_id": m1_inst,
                "role": "uploaded_candidate",
            }
            m2 = {
                "apaar_id": _mask_apaar(f.matched_apaar_id),
                "institution_aicte_id": f.matched_institution_id or "Central Repository",
                "role": "matched_record",
            }
            clusters_dict[cid] = {
                "cluster_id": cid,
                "id": f.id,
                "batch_id": f.batch_id,
                "scope": f.match_type,
                "bucket": "HUMAN_REVIEW",
                "status": f.status,
                "similarity_score": f.similarity_score,
                "score": f.similarity_score,
                "matched_fields": f.matched_fields_json,
                "members": [m1, m2],
                "notes": f.notes,
                "decided_by": f.decided_by,
                "decided_at": f.decided_at,
            }

    return list(clusters_dict.values())


def get_duplicate_cluster_service(
    db: Session,
    *,
    flag_or_cluster_id: str,
    principal: Principal,
) -> dict[str, Any]:
    """Gets details of a duplicate cluster with side-by-side masked records."""
    flag = db.scalars(
        select(DuplicateFlag).where(
            or_(
                DuplicateFlag.id == flag_or_cluster_id,
                DuplicateFlag.cluster_id == flag_or_cluster_id,
            )
        )
    ).first()

    if not flag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "NOT_FOUND",
                "message": f"Duplicate cluster '{flag_or_cluster_id}' not found",
            },
        )

    # RBAC check
    if principal.role not in ("AICTE_ADMIN", "AICTE_ANALYST"):
        user_inst = principal.institution_aicte_id
        b = (
            db.scalars(select(Batch).where(Batch.batch_id == flag.batch_id)).first()
            if flag.batch_id
            else None
        )
        b_inst = b.institution_aicte_id if b else None
        if user_inst != flag.matched_institution_id and user_inst != b_inst:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Side-by-side member records
    m1_name = "Uploaded Record"
    m1_inst = "Unknown"
    if flag.batch_id:
        b = db.scalars(select(Batch).where(Batch.batch_id == flag.batch_id)).first()
        if b:
            m1_inst = b.institution_aicte_id

    # Lookup student record for matched APAAR if committed
    s_matched = db.scalars(
        select(StudentRecord).where(StudentRecord.apaar_id == flag.matched_apaar_id)
    ).first()
    m2_name = _mask_name(s_matched.full_name) if s_matched else "Matched Candidate"
    m2_inst = (
        s_matched.institution_aicte_id if s_matched else (flag.matched_institution_id or "Other")
    )

    members = [
        {
            "apaar_id": _mask_apaar(flag.apaar_id),
            "full_name": m1_name,
            "institution_aicte_id": m1_inst,
            "status": "CANDIDATE",
        },
        {
            "apaar_id": _mask_apaar(flag.matched_apaar_id),
            "full_name": m2_name,
            "institution_aicte_id": m2_inst,
            "status": s_matched.enrolment_status if s_matched else "MATCHED",
        },
    ]

    return {
        "cluster_id": flag.cluster_id,
        "id": flag.id,
        "batch_id": flag.batch_id,
        "scope": flag.match_type,
        "bucket": "HUMAN_REVIEW",
        "status": flag.status,
        "similarity_score": flag.similarity_score,
        "score": flag.similarity_score,
        "matched_fields": flag.matched_fields_json,
        "members": members,
        "notes": flag.notes,
        "decided_by": flag.decided_by,
        "decided_at": flag.decided_at,
    }


def resolve_duplicate_service(
    db: Session,
    *,
    flag_or_cluster_id: str,
    decision: str | None,
    resolution_alias: str | None,
    note: str | None,
    remarks_alias: str | None,
    principal: Principal,
) -> dict[str, Any]:
    """
    Resolves a duplicate cluster.
    - If CROSS_INSTITUTION: strictly restricted to AICTE_ANALYST or AICTE_ADMIN.
    - If INTRA: INSTITUTION_ADMIN or AICTE_ADMIN.
    """
    flag = db.scalars(
        select(DuplicateFlag).where(
            or_(
                DuplicateFlag.id == flag_or_cluster_id,
                DuplicateFlag.cluster_id == flag_or_cluster_id,
            )
        )
    ).first()

    if not flag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "NOT_FOUND",
                "message": f"Duplicate cluster '{flag_or_cluster_id}' not found",
            },
        )

    # Normalize decision
    raw_dec = (decision or resolution_alias or "").strip().upper()
    resolved_dec = RESOLUTION_MAP.get(raw_dec)
    if not resolved_dec:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "INVALID_DECISION",
                "message": (
                    f"Decision must be SAME_PERSON, DIFFERENT_PEOPLE, or TRANSFER (got '{raw_dec}')"
                ),
            },
        )

    # RBAC enforcement: cross-institution requires AICTE_ANALYST or AICTE_ADMIN
    if flag.match_type == "CROSS_INSTITUTION":
        if principal.role not in ("AICTE_ANALYST", "AICTE_ADMIN"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "FORBIDDEN",
                    "message": (
                        "Only AICTE_ANALYST or AICTE_ADMIN can resolve cross-institution duplicates"
                    ),
                },
            )
    else:
        # INTRA scope
        if principal.role not in ("INSTITUTION_ADMIN", "AICTE_ADMIN"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "FORBIDDEN",
                    "message": "Only INSTITUTION_ADMIN can resolve intra duplicates",
                },
            )

    now = datetime.now(UTC)
    final_note = (note or remarks_alias or "").strip() or None

    # Update all flags in this cluster
    flags_in_cluster = db.scalars(
        select(DuplicateFlag).where(DuplicateFlag.cluster_id == flag.cluster_id)
    ).all()

    for f in flags_in_cluster:
        f.status = resolved_dec
        f.decided_by = principal.id
        f.decided_at = now
        f.notes = final_note

    # Audit log
    append_audit_log(
        db,
        action="DUPLICATE_RESOLVED",
        actor_type="API_KEY" if principal.is_api_key else "USER",
        actor_id=principal.id,
        role=principal.role,
        resource="DUPLICATE_FLAG",
        resource_id=flag.cluster_id,
        payload={
            "cluster_id": flag.cluster_id,
            "decision": resolved_dec,
            "scope": flag.match_type,
            "note": final_note,
        },
    )

    db.commit()
    db.refresh(flag)
    return get_duplicate_cluster_service(db, flag_or_cluster_id=flag.id, principal=principal)
