"""
Student records router: retrieve student details, execute manual administrative corrections,
and manage lifecycle state transitions with DPDP Act 2023 PII masking.
Complies with contracts/openapi.yaml, agents.md §8.1, §8.4, and prompt B5.
"""

from app.db import get_db
from app.models.core import StudentRecord
from app.schemas.students import (
    LifecycleTransitionRequest,
    StudentRecordResponse,
    StudentUpdateRequest,
)
from app.security.crypto import decrypt_field, keyed_apaar_hash
from app.security.deps import Principal, get_current_principal
from app.services.audit import append_audit_log
from app.services.batches import update_student_service
from app.services.students import transition_student_service
from eduverify_engine.masking import mask_apaar, mask_email, mask_mobile
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter(prefix="/v1/students", tags=["Students"])


def serialize_student_record(
    student: StudentRecord,
    principal: Principal,
    db: Session,
    purpose: str = "STUDENT_RECORD_READ",
) -> StudentRecordResponse:
    """
    Serializes student record applying DPDP Act 2023 PII masking rules:
    - apaar_id, email, and mobile are masked UNLESS principal is the record's student
      or the institution admin of the student's enrolled institution.
    - AICTE_ANALYST is always masked.
    - Every unmasked read logs a tamper-evident audit row with access purpose.
    """
    is_self = principal.role == "STUDENT" and (
        principal.student_apaar_hash in (student.apaar_hash, keyed_apaar_hash(student.apaar_id))
    )
    is_inst_admin = (
        principal.role == "INSTITUTION_ADMIN"
        and principal.institution_aicte_id == student.institution_aicte_id
    )
    can_view_unmasked = (is_self or is_inst_admin) and principal.role != "AICTE_ANALYST"

    raw_email = decrypt_field(student.email_enc) if student.email_enc else None
    raw_mobile = decrypt_field(student.mobile_enc) if student.mobile_enc else None

    resp = StudentRecordResponse.model_validate(student)

    if can_view_unmasked:
        append_audit_log(
            db,
            action="PII_UNMASKED_READ",
            actor_type="API_KEY" if principal.is_api_key else "USER",
            actor_id=principal.id,
            role=principal.role,
            resource="STUDENT_RECORD",
            resource_id=student.apaar_id,
            payload={"purpose": purpose},
        )
        db.commit()
        resp.apaar_id = student.apaar_id
        resp.email = raw_email
        resp.mobile = raw_mobile
    else:
        resp.apaar_id = mask_apaar(student.apaar_id)
        resp.email = mask_email(raw_email) if raw_email else None
        resp.mobile = mask_mobile(raw_mobile) if raw_mobile else None

    return resp


@router.get(
    "",
    include_in_schema=False,
    response_model=list[StudentRecordResponse],
    summary="List students in Central Repository",
)
def list_students(
    q: str | None = Query(None, description="Search by name, APAAR ID, or roll number"),
    status: str | None = Query(None, description="Filter by enrolment status"),
    program: str | None = Query(None, description="Filter by program code"),
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[StudentRecordResponse]:
    """Lists students filtered by institution, status, program, or search query."""
    stmt = select(StudentRecord)
    if principal.role not in ("AICTE_ADMIN", "AICTE_ANALYST") and principal.institution_aicte_id:
        stmt = stmt.where(StudentRecord.institution_aicte_id == principal.institution_aicte_id)
    if status and status != "ALL":
        stmt = stmt.where(StudentRecord.enrolment_status == status)
    if program and program != "ALL":
        stmt = stmt.where(StudentRecord.program_code == program)
    if q:
        search = f"%{q.strip()}%"
        stmt = stmt.where(
            (StudentRecord.full_name.ilike(search))
            | (StudentRecord.apaar_id.ilike(search))
            | (StudentRecord.institution_student_id.ilike(search))
        )
    stmt = stmt.order_by(StudentRecord.full_name.asc())
    students = db.scalars(stmt).all()
    return [
        serialize_student_record(s, principal=principal, db=db, purpose="STUDENT_ROSTER_LIST")
        for s in students
    ]


@router.get(
    "/{apaar_id}",
    response_model=StudentRecordResponse,
    summary="Get student record from Central Repository",
)
def get_student(
    apaar_id: str,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> StudentRecordResponse:
    """
    Retrieves student record by 12-digit APAAR ID.
    Enforces authorization, PII masking, and unmasked read audit trail.
    """
    student = db.scalars(select(StudentRecord).where(StudentRecord.apaar_id == apaar_id)).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found"
        )

    # Authorization checks
    if principal.role in ("AICTE_ADMIN", "AICTE_ANALYST"):
        pass  # Global platform administrative access
    elif principal.role in ("INSTITUTION_ADMIN", "INSTITUTION_STAFF"):
        if (
            principal.institution_aicte_id
            and principal.institution_aicte_id != student.institution_aicte_id
        ):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif principal.role == "STUDENT":
        if principal.student_apaar_hash not in (
            student.apaar_hash,
            keyed_apaar_hash(apaar_id),
        ):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return serialize_student_record(
        student,
        principal=principal,
        db=db,
        purpose="STUDENT_RECORD_INSPECTION",
    )


@router.put(
    "/{apaar_id}",
    response_model=StudentRecordResponse,
    summary="Update student record (creates new record version and supersedes credentials)",
)
def update_student(
    apaar_id: str,
    body: StudentUpdateRequest,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> StudentRecordResponse:
    """
    Updates a student record from the institution of record, archives old version, and logs audit.
    """
    updated_student = update_student_service(
        db,
        apaar_id=apaar_id,
        update_data=body.model_dump(exclude_unset=True),
        principal=principal,
    )
    return serialize_student_record(
        updated_student,
        principal=principal,
        db=db,
        purpose="STUDENT_RECORD_UPDATE",
    )


@router.post(
    "/{apaar_id}/transitions",
    response_model=StudentRecordResponse,
    summary="Perform lifecycle transition (WITHDRAWN, DEFERRED, TRANSFERRED_OUT, GRADUATED)",
)
def create_student_transition(
    apaar_id: str,
    body: LifecycleTransitionRequest,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> StudentRecordResponse:
    """
    Executes student lifecycle state transition adhering to state machine in agents.md §8.1.
    Invalid transitions raise 422 with rule code V021.
    """
    updated_student = transition_student_service(
        db,
        apaar_id=apaar_id,
        to_status=body.to_status,
        effective_date=body.effective_date,
        reason=body.reason,
        evidence_ref=body.evidence_ref,
        principal=principal,
    )
    return serialize_student_record(
        updated_student,
        principal=principal,
        db=db,
        purpose="STUDENT_LIFECYCLE_TRANSITION",
    )
