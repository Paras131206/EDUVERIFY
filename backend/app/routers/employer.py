"""
Employer Hiring Router: Candidate listing, consent-gated academic marks inspection,
and explicit hiring access requests conforming to DPDP Act 2023 Section 8.4.
"""

from datetime import UTC, datetime

from app.db import get_db
from app.models.auth import User
from app.models.core import (
    ConsentLedger,
    EmployerAccessRequest,
    Institution,
    NotificationOutbox,
    StudentAcademicRecord,
    StudentRecord,
)
from app.schemas.employer import (
    AcademicRecordDetail,
    CandidateDetailResponse,
    CandidateListItem,
    CreateEmployerAccessRequest,
    EmployerAccessRequestResponse,
)
from app.security.crypto import decrypt_field
from app.security.deps import Principal, require_roles
from app.services.audit import append_audit_log
from eduverify_engine.masking import mask_email, mask_mobile
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter(prefix="/v1/employer", tags=["Employer"])


def check_student_employer_consent(
    db: Session,
    apaar_id: str,
    employer_id: str,
) -> tuple[bool, str, EmployerAccessRequest | None]:
    """
    Checks if student has granted employer consent:
    1. Global EMPLOYER_HIRING consent in immutable ConsentLedger
    2. Specific APPROVED EmployerAccessRequest for this employer
    DPDP Act rule: If latest ConsentLedger status for EMPLOYER_HIRING is WITHDRAWN or REFUSED,
    it strictly revokes access and overrides any prior approval.
    """
    latest_req = (
        db.query(EmployerAccessRequest)
        .filter(
            EmployerAccessRequest.apaar_id == apaar_id,
            EmployerAccessRequest.employer_id == employer_id,
        )
        .order_by(EmployerAccessRequest.requested_at.desc())
        .first()
    )

    consent_row = (
        db.query(ConsentLedger)
        .filter(
            ConsentLedger.apaar_id == apaar_id,
            ConsentLedger.purpose == "EMPLOYER_HIRING",
        )
        .order_by(ConsentLedger.id.desc())
        .first()
    )

    # Explicit withdrawal revokes access immediately
    if consent_row and consent_row.status in ("WITHDRAWN", "REFUSED"):
        if latest_req and latest_req.status == "APPROVED":
            latest_req.status = "REVOKED"
            db.flush()
        return False, "WITHDRAWN", latest_req

    if consent_row and consent_row.status == "GRANTED":
        return True, "GRANTED", latest_req

    if latest_req and latest_req.status == "APPROVED":
        return True, "GRANTED", latest_req

    return False, "PENDING", latest_req


@router.get(
    "/candidates",
    include_in_schema=False,
    response_model=list[CandidateListItem],
    summary="List candidates with hiring consent status",
)
def list_candidates(
    q: str | None = Query(None, description="Search by name, APAAR ID, or roll number"),
    consent_only: bool = Query(False, description="Filter only candidates with granted consent"),
    program: str | None = Query(None, description="Filter by program code"),
    principal: Principal = Depends(require_roles("EMPLOYER", "AICTE_ADMIN")),
    db: Session = Depends(get_db),
) -> list[CandidateListItem]:
    """Lists student candidates with their consent status for corporate hiring."""
    stmt = (
        select(StudentRecord, Institution.name.label("inst_name"))
        .outerjoin(
            Institution,
            StudentRecord.institution_aicte_id == Institution.institution_aicte_id,
        )
        .order_by(StudentRecord.full_name.asc())
    )

    if program and program != "ALL":
        stmt = stmt.where(StudentRecord.program_code == program)

    if q:
        search = f"%{q.strip()}%"
        stmt = stmt.where(
            (StudentRecord.full_name.ilike(search))
            | (StudentRecord.apaar_id.ilike(search))
            | (StudentRecord.institution_student_id.ilike(search))
        )

    results = db.execute(stmt).all()
    candidates: list[CandidateListItem] = []

    for row in results:
        student: StudentRecord = row[0]
        inst_name: str | None = row[1]

        has_consent, consent_status, access_req = check_student_employer_consent(
            db, student.apaar_id, principal.id
        )

        if consent_only and not has_consent:
            continue

        cgpa: float | None = None
        if has_consent:
            acad = (
                db.query(StudentAcademicRecord)
                .filter(StudentAcademicRecord.apaar_id == student.apaar_id)
                .first()
            )
            cgpa = acad.cgpa if acad else None

        candidates.append(
            CandidateListItem(
                apaar_id=student.apaar_id,
                full_name=student.full_name,
                institution_aicte_id=student.institution_aicte_id,
                institution_name=inst_name,
                program_code=student.program_code,
                course_level=student.course_level,
                academic_year=student.academic_year,
                enrolment_status=student.enrolment_status,
                cgpa=cgpa,
                has_consent=has_consent,
                consent_status=consent_status,
                request_status=access_req.status if access_req else None,
            )
        )

    return candidates


@router.get(
    "/candidates/{apaar_id}",
    include_in_schema=False,
    response_model=CandidateDetailResponse,
    summary="Get candidate academic details (consent-gated)",
)
def get_candidate_detail(
    apaar_id: str,
    principal: Principal = Depends(require_roles("EMPLOYER", "AICTE_ADMIN")),
    db: Session = Depends(get_db),
) -> CandidateDetailResponse:
    """
    Retrieves full academic record (10th/12th marks, university CGPA, transcripts).
    Enforces DPDP Act 2023: Details are withheld unless student has granted consent.
    """
    student = db.scalars(select(StudentRecord).where(StudentRecord.apaar_id == apaar_id)).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found"
        )

    institution = (
        db.query(Institution)
        .filter(Institution.institution_aicte_id == student.institution_aicte_id)
        .first()
    )

    has_consent, consent_status, _ = check_student_employer_consent(
        db, student.apaar_id, principal.id
    )

    student_data = {
        "apaar_id": student.apaar_id,
        "full_name": student.full_name,
        "institution_aicte_id": student.institution_aicte_id,
        "institution_name": institution.name if institution else student.institution_aicte_id,
        "institution_student_id": student.institution_student_id,
        "program_code": student.program_code,
        "course_level": student.course_level,
        "department": student.department,
        "academic_year": student.academic_year,
        "year_of_study": student.year_of_study,
        "enrolment_status": student.enrolment_status,
        "admission_date": student.admission_date.isoformat() if student.admission_date else None,
        "expected_graduation_year": student.expected_graduation_year,
    }

    if not has_consent:
        # PII and marks protected: student has not granted consent
        raw_email = decrypt_field(student.email_enc) if student.email_enc else None
        raw_mobile = decrypt_field(student.mobile_enc) if student.mobile_enc else None
        student_data["email"] = mask_email(raw_email) if raw_email else None
        student_data["mobile"] = mask_mobile(raw_mobile) if raw_mobile else None

        return CandidateDetailResponse(
            apaar_id=apaar_id,
            has_consent=False,
            consent_status=consent_status,
            student=student_data,
            academic_record=None,
            message=(
                "Academic record is protected under DPDP Act 2023 Section 8.4. "
                "Student consent is required before previous marks and transcripts can be viewed."
            ),
        )

    # Consent GRANTED: reveal unmasked academic record and log audit
    raw_email = decrypt_field(student.email_enc) if student.email_enc else None
    raw_mobile = decrypt_field(student.mobile_enc) if student.mobile_enc else None
    student_data["email"] = raw_email
    student_data["mobile"] = raw_mobile

    acad = (
        db.query(StudentAcademicRecord)
        .filter(StudentAcademicRecord.apaar_id == student.apaar_id)
        .first()
    )

    academic_detail: AcademicRecordDetail | None = None
    if acad:
        academic_detail = AcademicRecordDetail(
            tenth_board=acad.tenth_board,
            tenth_percentage=acad.tenth_percentage,
            tenth_year=acad.tenth_year,
            tenth_school=acad.tenth_school,
            twelfth_board=acad.twelfth_board,
            twelfth_percentage=acad.twelfth_percentage,
            twelfth_stream=acad.twelfth_stream,
            twelfth_year=acad.twelfth_year,
            twelfth_school=acad.twelfth_school,
            cgpa=acad.cgpa,
            total_credits=acad.total_credits,
            completed_credits=acad.completed_credits,
            active_backlogs=acad.active_backlogs,
            semester_marks=acad.semester_marks_json,
            skills=acad.skills_json,
            achievements=acad.achievements_json,
        )

    # Mandatory DPDP audit log
    append_audit_log(
        db,
        action="EMPLOYER_ACADEMIC_READ",
        actor_type="USER",
        actor_id=principal.id,
        role=principal.role,
        resource="STUDENT_ACADEMIC_RECORD",
        resource_id=student.apaar_id,
        payload={
            "purpose": "HIRING_SCREENING",
            "employer_email": principal.email,
            "has_consent": True,
        },
    )
    db.commit()

    return CandidateDetailResponse(
        apaar_id=apaar_id,
        has_consent=True,
        consent_status="GRANTED",
        student=student_data,
        academic_record=academic_detail,
        message="Consent verified: Academic record and previous marks unlocked.",
    )


@router.post(
    "/requests",
    include_in_schema=False,
    response_model=EmployerAccessRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit explicit hiring access request to student",
)
def create_access_request(
    body: CreateEmployerAccessRequest,
    principal: Principal = Depends(require_roles("EMPLOYER", "AICTE_ADMIN")),
    db: Session = Depends(get_db),
) -> EmployerAccessRequestResponse:
    """Sends a consent request to the student for inspecting academic marks for a role."""
    student = (
        db.scalars(select(StudentRecord).where(StudentRecord.apaar_id == body.apaar_id)).first()
    )
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found"
        )

    user = db.query(User).filter(User.id == principal.id).first()
    employer_name = user.full_name if user else (principal.email or "Hiring Manager")

    req = EmployerAccessRequest(
        employer_id=principal.id,
        employer_name=employer_name,
        apaar_id=body.apaar_id,
        job_title=body.job_title,
        organization=body.organization or employer_name,
        purpose=body.purpose,
        status="PENDING",
        requested_at=datetime.now(UTC),
    )
    db.add(req)

    # Notify student in notification outbox
    raw_email = decrypt_field(student.email_enc) if student.email_enc else "student@demo.local"
    db.add(
        NotificationOutbox(
            recipient=raw_email,
            channel="EMAIL",
            subject=f"New Hiring Verification Request from {employer_name}",
            body=(
                f"{employer_name} has requested your consent to inspect your verified academic "
                f"marks for the role '{body.job_title}'. "
                "Log in to your student wallet to approve or decline."
            ),
            status="PENDING",
        )
    )

    append_audit_log(
        db,
        action="EMPLOYER_ACCESS_REQUEST_CREATED",
        actor_type="USER",
        actor_id=principal.id,
        role=principal.role,
        resource="EMPLOYER_ACCESS_REQUEST",
        resource_id=body.apaar_id,
        payload={"job_title": body.job_title, "purpose": body.purpose},
    )
    db.commit()
    db.refresh(req)

    return EmployerAccessRequestResponse.model_validate(req)


@router.get(
    "/requests",
    include_in_schema=False,
    response_model=list[EmployerAccessRequestResponse],
    summary="List all hiring access requests sent by this employer",
)
def list_my_requests(
    principal: Principal = Depends(require_roles("EMPLOYER", "AICTE_ADMIN")),
    db: Session = Depends(get_db),
) -> list[EmployerAccessRequestResponse]:
    """Retrieves all hiring access requests initiated by the authenticated employer."""
    requests = (
        db.query(EmployerAccessRequest)
        .filter(EmployerAccessRequest.employer_id == principal.id)
        .order_by(EmployerAccessRequest.requested_at.desc())
        .all()
    )
    return [EmployerAccessRequestResponse.model_validate(r) for r in requests]
