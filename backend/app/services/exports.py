"""
Bulk data export streaming service for AICTE administrators with statutory unmasked audit logging.
Complies with Task B7 item 3 and DPDP Act 2023.
"""

import csv
import io
import logging
from typing import Generator

import pandas as pd
from app.models.core import Institution, State, StudentRecord
from app.security.crypto import decrypt_field, mask_apaar, mask_email, mask_mobile
from app.security.deps import Principal
from app.services.audit import append_audit_log
from fastapi import HTTPException, status
from fastapi.responses import Response, StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def export_students_service(
    db: Session,
    *,
    academic_year: str | None = None,
    state: str | None = None,
    fmt: str = "csv",
    unmasked: bool = False,
    reason: str | None = None,
    principal: Principal,
) -> Response:
    """
    Streams filtered student records in CSV or Parquet format.
    Restricted to AICTE_ADMIN.
    Requires audit reason when unmasked=True.
    """
    if principal.role != "AICTE_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Only AICTE_ADMIN can perform bulk exports"},
        )

    if unmasked:
        if not reason or len(reason.strip()) < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "REASON_REQUIRED",
                    "message": (
                        "Statutory audit reason is mandatory when unmasked=true "
                        "(min 10 characters)"
                    ),
                },
            )
        append_audit_log(
            db,
            action="BULK_EXPORT_UNMASKED",
            actor_type="API_KEY" if principal.is_api_key else "USER",
            actor_id=principal.id,
            role=principal.role,
            resource="STUDENTS",
            resource_id=f"export-{academic_year or 'all'}-{state or 'all'}",
            payload={
                "academic_year": academic_year,
                "state": state,
                "format": fmt,
                "reason": reason.strip(),
            },
        )
        db.commit()

    # Build query
    query = select(StudentRecord).join(
        Institution,
        StudentRecord.institution_aicte_id == Institution.institution_aicte_id,
        isouter=True,
    )

    if academic_year:
        query = query.where(StudentRecord.academic_year == academic_year)

    if state:
        state_clean = state.strip()
        if state_clean.isdigit():
            query = query.where(Institution.state_code == int(state_clean))
        else:
            query = query.join(State, Institution.state_code == State.lgd_state_code, isouter=True)
            query = query.where(State.name.ilike(f"%{state_clean}%"))

    students = list(db.scalars(query.order_by(StudentRecord.created_at.desc())).all())

    rows: list[dict[str, str | int | float | None]] = []
    for s in students:
        raw_email = s.email_enc
        if raw_email:
            try:
                decrypted_email = decrypt_field(raw_email)
            except Exception:
                decrypted_email = raw_email
        else:
            decrypted_email = ""

        raw_phone = s.mobile_enc
        if raw_phone:
            try:
                decrypted_phone = decrypt_field(raw_phone)
            except Exception:
                decrypted_phone = raw_phone
        else:
            decrypted_phone = ""

        if unmasked:
            apaar_val = s.apaar_id
            email_val = decrypted_email
            phone_val = decrypted_phone
        else:
            apaar_val = mask_apaar(s.apaar_id)
            email_val = mask_email(decrypted_email) if decrypted_email else ""
            phone_val = mask_mobile(decrypted_phone) if decrypted_phone else ""

        rows.append(
            {
                "apaar_id": apaar_val,
                "full_name": s.full_name,
                "dob": s.dob.isoformat() if s.dob else "",
                "gender": s.gender,
                "category": s.category,
                "quota": s.quota,
                "institution_aicte_id": s.institution_aicte_id,
                "institution_student_id": s.institution_student_id,
                "program_code": s.program_code,
                "course_level": s.course_level,
                "academic_year": s.academic_year,
                "enrolment_status": s.enrolment_status,
                "admission_date": s.admission_date.isoformat() if s.admission_date else "",
                "email": email_val,
                "mobile": phone_val,
            }
        )

    clean_fmt = fmt.strip().lower()
    if clean_fmt == "parquet":
        df = (
            pd.DataFrame(rows)
            if rows
            else pd.DataFrame(columns=["apaar_id", "full_name", "program_code"])
        )
        buf = io.BytesIO()
        df.to_parquet(buf, index=False)
        return Response(
            content=buf.getvalue(),
            media_type="application/octet-stream",
            headers={"Content-Disposition": 'attachment; filename="students_export.parquet"'},
        )

    # Default CSV streaming
    def csv_generator() -> Generator[str, None, None]:
        fieldnames = [
            "apaar_id",
            "full_name",
            "dob",
            "gender",
            "category",
            "quota",
            "institution_aicte_id",
            "institution_student_id",
            "program_code",
            "course_level",
            "academic_year",
            "enrolment_status",
            "admission_date",
            "email",
            "mobile",
        ]
        out = io.StringIO()
        writer = csv.DictWriter(out, fieldnames=fieldnames)
        writer.writeheader()
        yield out.getvalue()
        out.seek(0)
        out.truncate(0)

        for r in rows:
            writer.writerow(r)
            yield out.getvalue()
            out.seek(0)
            out.truncate(0)

    return StreamingResponse(
        csv_generator(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="students_export.csv"'},
    )
