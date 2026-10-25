"""
Tests for Employer Hiring Portal and DPDP Act 2023 Consent-Gated Academic Marks Inspection.
Verifies:
1. RBAC: Only EMPLOYER and AICTE_ADMIN can query employer endpoints.
2. Consent Gating: Academic marks are withheld when consent is not granted.
3. Access Request Flow: Employer submits request; Student approves; Ledger updated.
4. Unmasked Academic Read: Unlocked when consent is GRANTED; Writes audit log.
5. Consent Withdrawal: Reverts candidate details to protected state.
"""

import hashlib
from datetime import date

import pytest
from app.models.auth import AuditLog, User
from app.models.core import (
    EmployerAccessRequest,
    StudentAcademicRecord,
    StudentRecord,
)
from app.security.crypto import encrypt_field
from sqlalchemy.orm import Session
from tests.conftest import make_auth_headers

TEST_APAAR = "123456789012"
TEST_INSTITUTION_ID = "1-10001"


@pytest.fixture(autouse=True)
def setup_test_employer_env(db_session: Session):
    """Sets up student record and academic records for test student."""
    student = (
        db_session.query(StudentRecord)
        .filter(StudentRecord.apaar_id == TEST_APAAR)
        .first()
    )
    if not student:
        student = StudentRecord(
            apaar_id=TEST_APAAR,
            apaar_hash=hashlib.sha256(TEST_APAAR.encode("utf-8")).hexdigest(),
            institution_aicte_id=TEST_INSTITUTION_ID,
            institution_student_id="ROLL-12345",
            full_name="Demo Student",
            dob=date(2004, 1, 1),
            gender="M",
            category="GEN",
            pwd=False,
            course_level="UG",
            program_code="UG-CSE",
            academic_year="2026-27",
            year_of_study=3,
            admission_date=date(2024, 8, 1),
            admission_type="REGULAR",
            seat_type="REGULAR",
            quota="NONE",
            nationality="IN",
            nri_status=False,
            oci_status=False,
            fn_status=False,
            enrolment_status="ACTIVE",
            consent_status="GRANTED",
            consent_date=date(2024, 8, 1),
            guardian_consent=False,
            email_enc=encrypt_field("student@demo.local"),
            mobile_enc=encrypt_field("9876543210"),
            record_version=1,
        )
        db_session.add(student)

    acad = (
        db_session.query(StudentAcademicRecord)
        .filter(StudentAcademicRecord.apaar_id == TEST_APAAR)
        .first()
    )
    if not acad:
        acad = StudentAcademicRecord(
            apaar_id=TEST_APAAR,
            tenth_board="CBSE",
            tenth_percentage=91.5,
            tenth_year=2020,
            tenth_school="St. Xavier High School",
            twelfth_board="CBSE",
            twelfth_percentage=93.2,
            twelfth_stream="PCM with Computer Science",
            twelfth_year=2022,
            twelfth_school="Delhi Public School",
            cgpa=8.85,
            total_credits=160,
            completed_credits=120,
            active_backlogs=0,
            semester_marks_json=[
                {"semester": 1, "sgpa": 8.7, "credits": 22, "status": "PASS"},
                {"semester": 2, "sgpa": 8.9, "credits": 22, "status": "PASS"},
                {"semester": 3, "sgpa": 9.0, "credits": 24, "status": "PASS"},
            ],
            skills_json=["Python", "React", "Docker", "Algorithms"],
            achievements_json=["Dean's Merit List 2025"],
        )
        db_session.add(acad)
    db_session.commit()


def test_employer_rbac(client, db_session: Session):
    """Verifies RBAC protection on /v1/employer endpoints."""
    employer = db_session.query(User).filter(User.role == "EMPLOYER").first()
    student = db_session.query(User).filter(User.role == "STUDENT").first()
    inst_staff = db_session.query(User).filter(User.role == "INSTITUTION_STAFF").first()

    assert employer is not None, "Demo employer user missing"
    assert student is not None, "Demo student user missing"

    # Unauthenticated request fails with 401
    resp_unauth = client.get("/v1/employer/candidates")
    assert resp_unauth.status_code == 401

    # Unauthorized roles fail with 403
    resp_staff = client.get("/v1/employer/candidates", headers=make_auth_headers(inst_staff))
    assert resp_staff.status_code == 403

    resp_student = client.get("/v1/employer/candidates", headers=make_auth_headers(student))
    assert resp_student.status_code == 403

    # Authorized employer succeeds with 200
    resp_emp = client.get("/v1/employer/candidates", headers=make_auth_headers(employer))
    assert resp_emp.status_code == 200
    data = resp_emp.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_consent_gated_academic_marks_flow(client, db_session: Session):
    """
    End-to-end flow:
    1. Initially without consent, candidate marks are withheld (academic_record is None).
    2. Employer submits hiring access request.
    3. Student retrieves pending requests and approves.
    4. Employer can now view 10th marks, 12th marks, CGPA, and semester grades.
    5. Audit log records EMPLOYER_ACADEMIC_READ.
    6. Student withdraws consent; access is blocked again.
    """
    employer = db_session.query(User).filter(User.role == "EMPLOYER").first()
    student_user = db_session.query(User).filter(User.role == "STUDENT").first()
    assert employer is not None and student_user is not None

    test_apaar = TEST_APAAR

    # Ensure clean initial state (withdraw any prior consent and clean requests)
    db_session.query(EmployerAccessRequest).filter(
        EmployerAccessRequest.apaar_id == test_apaar
    ).delete()
    db_session.commit()

    # Student explicitly ensures EMPLOYER_HIRING consent is WITHDRAWN initially
    withdraw_resp = client.post(
        "/v1/consent",
        headers=make_auth_headers(student_user),
        json={
            "purpose": "EMPLOYER_HIRING",
            "action": "WITHDRAW",
            "apaar_id": test_apaar,
        },
    )
    assert withdraw_resp.status_code in (200, 201)

    # 1. Employer inspects candidate without consent
    emp_headers = make_auth_headers(employer)
    detail_resp1 = client.get(f"/v1/employer/candidates/{test_apaar}", headers=emp_headers)
    assert detail_resp1.status_code == 200
    d1 = detail_resp1.json()
    assert d1["has_consent"] is False
    assert d1["academic_record"] is None
    assert "protected" in d1["message"].lower()

    # 2. Employer submits hiring access request
    req_resp = client.post(
        "/v1/employer/requests",
        headers=emp_headers,
        json={
            "apaar_id": test_apaar,
            "job_title": "Full Stack Engineer (2026 Batch)",
            "organization": "TechCorp India",
            "purpose": "Campus recruitment screening",
        },
    )
    assert req_resp.status_code == 201
    req_data = req_resp.json()
    request_id = req_data["id"]
    assert req_data["status"] == "PENDING"
    assert req_data["job_title"] == "Full Stack Engineer (2026 Batch)"

    # 3. Student views requests in student portal
    student_headers = make_auth_headers(student_user)
    my_reqs_resp = client.get("/v1/students/me/employer-requests", headers=student_headers)
    assert my_reqs_resp.status_code == 200
    my_reqs = my_reqs_resp.json()
    assert any(r["id"] == request_id for r in my_reqs)

    # 4. Student approves the employer's request
    decide_resp = client.post(
        f"/v1/students/me/employer-requests/{request_id}/decision",
        headers=student_headers,
        json={"decision": "APPROVED"},
    )
    assert decide_resp.status_code == 200
    assert decide_resp.json()["status"] == "APPROVED"

    # 5. Employer inspects candidate again -> Now UNLOCKED!
    detail_resp2 = client.get(f"/v1/employer/candidates/{test_apaar}", headers=emp_headers)
    assert detail_resp2.status_code == 200
    d2 = detail_resp2.json()
    assert d2["has_consent"] is True
    assert d2["consent_status"] == "GRANTED"
    assert d2["academic_record"] is not None

    acad = d2["academic_record"]
    assert acad["tenth_percentage"] is not None
    assert acad["twelfth_percentage"] is not None
    assert acad["cgpa"] is not None
    assert isinstance(acad["semester_marks"], list)
    assert len(acad["semester_marks"]) > 0

    # 6. Verify audit log entry
    audit_entry = (
        db_session.query(AuditLog)
        .filter(
            AuditLog.action == "EMPLOYER_ACADEMIC_READ",
            AuditLog.resource_id == test_apaar,
        )
        .order_by(AuditLog.id.desc())
        .first()
    )
    assert audit_entry is not None
    assert audit_entry.actor_id == employer.id

    # 7. Student withdraws consent -> Access blocked again immediately
    client.post(
        "/v1/consent",
        headers=student_headers,
        json={
            "purpose": "EMPLOYER_HIRING",
            "action": "WITHDRAW",
            "apaar_id": test_apaar,
        },
    )

    detail_resp3 = client.get(f"/v1/employer/candidates/{test_apaar}", headers=emp_headers)
    assert detail_resp3.status_code == 200
    d3 = detail_resp3.json()
    assert d3["has_consent"] is False
    assert d3["academic_record"] is None
