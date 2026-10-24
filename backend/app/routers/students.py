"""
Student records router: retrieve student details and execute manual administrative corrections.
Complies with contracts/openapi.yaml and prompt B3 item 7.
"""

from app.db import get_db
from app.models.core import StudentRecord
from app.schemas.students import StudentRecordResponse, StudentUpdateRequest
from app.security.crypto import decrypt_field
from app.security.deps import Principal, get_current_principal
from app.services.batches import update_student_service
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter(prefix="/v1/students", tags=["Students"])


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
    """Retrieves student record by 12-digit APAAR ID."""
    student = db.scalars(select(StudentRecord).where(StudentRecord.apaar_id == apaar_id)).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found"
        )

    # Access check: AICTE roles can read all; institutions can read their enrolled students
    if principal.role != "AICTE_ADMIN" and principal.role != "AICTE_ANALYST":
        if (
            principal.institution_aicte_id
            and principal.institution_aicte_id != student.institution_aicte_id
        ):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    resp = StudentRecordResponse.model_validate(student)
    # Decrypt contact fields if present
    if student.email_enc:
        resp.email = decrypt_field(student.email_enc)
    if student.mobile_enc:
        resp.mobile = decrypt_field(student.mobile_enc)
    return resp


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
    resp = StudentRecordResponse.model_validate(updated_student)
    if updated_student.email_enc:
        resp.email = decrypt_field(updated_student.email_enc)
    if updated_student.mobile_enc:
        resp.mobile = decrypt_field(updated_student.mobile_enc)
    return resp
