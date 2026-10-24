"""
Student lifecycle state machine service.
Enforces transition table per agents.md §8.1:
- ACTIVE -> WITHDRAWN | DEFERRED | TRANSFERRED_OUT | COMPLETED
- DEFERRED -> ACTIVE | WITHDRAWN
- COMPLETED -> GRADUATED
- Anything else -> 422 with rule V021.
Complies with contracts/openapi.yaml and Task B4.
"""

import uuid
from datetime import UTC, date, datetime

from app.models.core import Credential, StudentRecord, StudentRecordVersion
from app.security.deps import Principal
from app.services.audit import append_audit_log
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

# Allowed lifecycle state transitions (agents.md §8.1)
ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "ACTIVE": {"WITHDRAWN", "DEFERRED", "TRANSFERRED_OUT", "COMPLETED"},
    "DEFERRED": {"ACTIVE", "WITHDRAWN"},
    "COMPLETED": {"GRADUATED"},
    # Terminal or non-transitional states:
    "WITHDRAWN": set(),
    "TRANSFERRED_OUT": set(),
    "GRADUATED": set(),
}


def transition_student_service(
    db: Session,
    *,
    apaar_id: str,
    to_status: str,
    effective_date: date,
    reason: str,
    evidence_ref: str | None,
    principal: Principal,
) -> StudentRecord:
    """Executes a student lifecycle state transition with strict V021 state machine validation."""
    student = db.scalars(select(StudentRecord).where(StudentRecord.apaar_id == apaar_id)).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Student with APAAR '{apaar_id}' not found"},
        )

    # Institution access check
    if principal.role != "AICTE_ADMIN":
        if (
            principal.institution_aicte_id
            and principal.institution_aicte_id != student.institution_aicte_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "FORBIDDEN",
                    "message": (
                        "Only the institution of record or AICTE_ADMIN can transition state"
                    ),
                },
            )

    curr_status = student.enrolment_status.strip().upper()
    next_status = to_status.strip().upper()

    # Validate state transition per Rule V021
    allowed_next = ALLOWED_TRANSITIONS.get(curr_status, set())
    if next_status not in allowed_next:
        allowed_str = ", ".join(sorted(allowed_next)) if allowed_next else "None (Terminal state)"
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "V021",
                "message": (
                    f"Invalid lifecycle transition: '{curr_status}' -> '{next_status}' is not "
                    f"allowed per Rule V021. Allowed transitions from {curr_status}: {allowed_str}"
                ),
            },
        )

    now = datetime.now(UTC)

    # 1. Archive previous state in student_record_versions
    version_archive = StudentRecordVersion(
        id=str(uuid.uuid4()),
        apaar_id=student.apaar_id,
        record_version=student.record_version,
        snapshot_json={
            "full_name": student.full_name,
            "institution_aicte_id": student.institution_aicte_id,
            "program_code": student.program_code,
            "academic_year": student.academic_year,
            "year_of_study": student.year_of_study,
            "enrolment_status": student.enrolment_status,
            "effective_date": effective_date.isoformat(),
            "evidence_ref": evidence_ref,
        },
        changed_by=principal.id,
        change_reason=f"Lifecycle transition to {next_status}: {reason}",
        created_at=now,
    )
    db.add(version_archive)

    # 2. Update student status and bump record version
    student.enrolment_status = next_status
    student.record_version += 1
    student.updated_at = now

    # 3. If withdrawing, transferring out, or graduating, supersede active credentials
    if next_status in ("WITHDRAWN", "TRANSFERRED_OUT", "GRADUATED"):
        db.query(Credential).filter(
            Credential.apaar_hash == student.apaar_hash,
            Credential.status == "ACTIVE",
        ).update({"status": "SUPERSEDED", "revoked_at": now})

    # 4. Audit log
    append_audit_log(
        db,
        action="LIFECYCLE_TRANSITION",
        actor_type="API_KEY" if principal.is_api_key else "USER",
        actor_id=principal.id,
        role=principal.role,
        resource="STUDENT",
        resource_id=student.apaar_id,
        payload={
            "from_status": curr_status,
            "to_status": next_status,
            "effective_date": str(effective_date),
            "reason": reason,
            "evidence_ref": evidence_ref,
            "record_version": student.record_version,
        },
    )

    db.commit()
    db.refresh(student)
    return student
