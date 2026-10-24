"""
Integration tests for Task B5: Privacy and Audit.
1. Consent ledger: POST /v1/consent (GRANT, WITHDRAW), GET /v1/consent/me, hash chaining,
   VERIFICATION_SHARE withdrawal credential suspension/restoration,
   REPOSITORY withdrawal PII pseudonymisation with version archival.
2. Audit trail: GET /v1/audit (filtered), GET /v1/audit/verify-chain, tampering detection,
   daily head hash logging.
3. PII Masking: Serializers mask apaar/email/mobile unless self student or institution admin;
   AICTE_ANALYST always masked; unmasked read writes PII_UNMASKED_READ audit log.
4. Data retention: purge raw batch_files after 90 days.
Complies with contracts/openapi.yaml, agents.md §8.2, §8.4, §12, and prompt B5.
"""

import uuid
from datetime import UTC, date, datetime, timedelta

import pytest
from app.models.auth import AuditLog, User
from app.models.core import Batch, BatchFile, Credential, Institution, Program, StudentRecord
from app.security.crypto import encrypt_field, keyed_apaar_hash
from app.services.audit import append_audit_log, log_daily_audit_head_hash
from sqlalchemy.orm import Session
from tests.conftest import make_auth_headers

TEST_INSTITUTION_ID = "1-10001"
TEST_APAAR_ID = "998877665544"


@pytest.fixture(autouse=True)
def setup_test_environment(db_session: Session):
    """Sets up a test institution, program, and student record."""
    # Ensure institution
    inst = (
        db_session.query(Institution)
        .filter(Institution.institution_aicte_id == TEST_INSTITUTION_ID)
        .first()
    )
    if not inst:
        inst = Institution(
            institution_aicte_id=TEST_INSTITUTION_ID,
            name="Apex Institute of Technology",
            state_code=7,
            district_code=101,
            type="ENGINEERING",
            affiliated_dab_id="DAB-01",
            onboarding_level="FULL",
            did=f"did:web:institution.{TEST_INSTITUTION_ID}",
        )
        db_session.add(inst)

    # Ensure program
    prog = db_session.query(Program).filter(Program.program_code == "CSE-UG").first()
    if not prog:
        prog = Program(
            program_code="CSE-UG",
            name="Computer Science & Engineering",
            course_level="UG",
            department="Engineering & Technology",
            duration_years=4,
            lateral_allowed=True,
        )
        db_session.add(prog)

    # Ensure student record
    student = (
        db_session.query(StudentRecord).filter(StudentRecord.apaar_id == TEST_APAAR_ID).first()
    )
    if not student:
        student = StudentRecord(
            apaar_id=TEST_APAAR_ID,
            apaar_hash=keyed_apaar_hash(TEST_APAAR_ID),
            institution_aicte_id=TEST_INSTITUTION_ID,
            institution_student_id="APEX-CS-2024-001",
            full_name="Aarav Sharma",
            dob=date(2003, 5, 14),
            gender="MALE",
            category="GENERAL",
            pwd=False,
            course_level="UG",
            program_code="CSE-UG",
            academic_year="2024-2025",
            year_of_study=1,
            admission_date=date(2024, 8, 1),
            admission_type="REGULAR",
            seat_type="GOVERNMENT",
            supernumerary_scheme=None,
            quota="HOME_STATE",
            nationality="IN",
            nri_status=False,
            oci_status=False,
            fn_status=False,
            enrolment_status="ACTIVE",
            consent_status="GRANTED",
            consent_date=date(2024, 8, 1),
            guardian_consent=False,
            email_enc=encrypt_field("aarav.sharma@example.com"),
            mobile_enc=encrypt_field("9876543210"),
            record_version=1,
        )
        db_session.add(student)

    # Wire student user to have matching apaar_hash
    student_user = db_session.query(User).filter(User.email == "student@demo.local").first()
    if student_user:
        student_user.student_apaar_hash = keyed_apaar_hash(TEST_APAAR_ID)

    db_session.commit()


# ============================================================================
# 1. CONSENT TESTS (POST /v1/consent, GET /v1/consent/me, HASH CHAINING)
# ============================================================================


def test_consent_grant_and_withdraw_chain(client, db_session: Session):
    """
    Test student self-consent grant & withdraw, verifying immutable append-only hash linking.
    """
    student_user = db_session.query(User).filter(User.email == "student@demo.local").first()
    headers = make_auth_headers(student_user)

    # 1. Grant VERIFICATION_SHARE
    r1 = client.post(
        "/v1/consent",
        json={"purpose": "VERIFICATION_SHARE", "action": "GRANT"},
        headers=headers,
    )
    assert r1.status_code == 201
    d1 = r1.json()
    assert d1["purpose"] == "VERIFICATION_SHARE"
    assert d1["status"] == "GRANTED"
    assert d1["prev_hash"] is not None
    assert d1["hash"] is not None

    # 2. Withdraw VERIFICATION_SHARE
    r2 = client.post(
        "/v1/consent",
        json={"purpose": "VERIFICATION_SHARE", "action": "WITHDRAW"},
        headers=headers,
    )
    assert r2.status_code == 201
    d2 = r2.json()
    assert d2["status"] == "WITHDRAWN"
    # Cryptographic link: row2 prev_hash must equal row1 hash
    assert d2["prev_hash"] == d1["hash"]

    # 3. Query consent summary
    r3 = client.get("/v1/consent/me", headers=headers)
    assert r3.status_code == 200
    d3 = r3.json()
    assert d3["apaar_id"] == TEST_APAAR_ID
    assert d3["consents"]["VERIFICATION_SHARE"] == "WITHDRAWN"
    assert len(d3["history"]) >= 2


def test_guardian_consent_by_institution_admin(client, db_session: Session):
    """
    Test institution admin recording parental/guardian consent with evidence_ref.
    """
    admin_user = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    headers = make_auth_headers(admin_user)

    r = client.post(
        "/v1/consent",
        json={
            "apaar_id": TEST_APAAR_ID,
            "purpose": "REPOSITORY",
            "action": "GRANT",
            "evidence_ref": "REF-PARENT-CONSENT-FORM-2024-9988",
            "guardian_consent": True,
        },
        headers=headers,
    )
    assert r.status_code == 201
    data = r.json()
    assert data["guardian_consent"] is True
    assert data["signature_ref"] == "REF-PARENT-CONSENT-FORM-2024-9988"
    assert data["status"] == "GRANTED"


def test_verification_share_withdrawal_suspends_credentials(client, db_session: Session):
    """
    Test agents.md §8.4: Withdrawing VERIFICATION_SHARE suspends active credentials;
    re-granting lifts suspension.
    """
    # Create test credential
    cred_id = str(uuid.uuid4())
    cred = Credential(
        id=cred_id,
        credential_id=f"cred-{cred_id}",
        apaar_id=TEST_APAAR_ID,
        apaar_hash=keyed_apaar_hash(TEST_APAAR_ID),
        institution_aicte_id=TEST_INSTITUTION_ID,
        credential_type="EduVerifyEnrolmentCredential",
        record_version=1,
        sd_jwt_compact="dummy-sd-jwt-token",
        status="VALID",
        holder_binding_jwk_json={"kty": "EC", "crv": "P-256"},
    )
    db_session.add(cred)
    db_session.commit()

    student_user = db_session.query(User).filter(User.email == "student@demo.local").first()
    headers = make_auth_headers(student_user)

    # Withdraw VERIFICATION_SHARE
    r = client.post(
        "/v1/consent",
        json={"purpose": "VERIFICATION_SHARE", "action": "WITHDRAW"},
        headers=headers,
    )
    assert r.status_code == 201

    # Credential should now be SUSPENDED
    db_session.refresh(cred)
    assert cred.status == "SUSPENDED"

    # Re-grant VERIFICATION_SHARE
    r2 = client.post(
        "/v1/consent",
        json={"purpose": "VERIFICATION_SHARE", "action": "GRANT"},
        headers=headers,
    )
    assert r2.status_code == 201

    # Credential should be restored to VALID
    db_session.refresh(cred)
    assert cred.status == "VALID"


def test_repository_consent_withdrawal_pseudonymises_pii(client, db_session: Session):
    """
    Test agents.md §8.4: Withdrawing REPOSITORY consent archives record version,
    pseudonymises PII in Central Repository, and preserves counts.
    """
    student = (
        db_session.query(StudentRecord).filter(StudentRecord.apaar_id == TEST_APAAR_ID).first()
    )
    assert student is not None
    initial_version = student.record_version

    student_user = db_session.query(User).filter(User.email == "student@demo.local").first()
    headers = make_auth_headers(student_user)

    # Withdraw REPOSITORY consent
    r = client.post(
        "/v1/consent",
        json={"purpose": "REPOSITORY", "action": "WITHDRAW"},
        headers=headers,
    )
    assert r.status_code == 201

    db_session.refresh(student)
    # PII pseudonymised
    assert student.full_name == "[WITHDRAWN]"
    assert student.email_enc is None
    assert student.mobile_enc is None
    assert student.consent_status == "WITHDRAWN"
    assert student.record_version == initial_version + 1

    # Statistical counts are preserved: record still exists with program & academic year
    total_students = (
        db_session.query(StudentRecord)
        .filter(StudentRecord.institution_aicte_id == TEST_INSTITUTION_ID)
        .count()
    )
    assert total_students >= 1


# ============================================================================
# 2. AUDIT TRAIL AND TAMPER-EVIDENCE TESTS
# ============================================================================


def test_audit_list_and_verification_endpoints(client, db_session: Session):
    """
    Test GET /v1/audit and GET /v1/audit/verify-chain.
    """
    admin_user = db_session.query(User).filter(User.email == "aicte.admin@demo.local").first()
    assert admin_user is not None
    headers = make_auth_headers(admin_user)

    # Append a test audit record to ensure at least 1 record exists
    append_audit_log(
        db_session,
        action="TEST_VERIFY_LOG",
        actor_type="USER",
        actor_id=admin_user.id,
        role="AICTE_ADMIN",
        resource="SYSTEM",
        payload={"test": True},
    )
    db_session.commit()

    # 1. Verify chain returns valid: true
    r_verify = client.get("/v1/audit/verify-chain", headers=headers)
    assert r_verify.status_code == 200
    verify_data = r_verify.json()
    assert verify_data["valid"] is True
    assert verify_data["first_broken_id"] is None
    assert "head_hash" in verify_data
    assert verify_data["length"] >= 1

    # 2. Query audit logs with filter
    r_list = client.get(
        "/v1/audit",
        params={"limit": 10, "offset": 0},
        headers=headers,
    )
    assert r_list.status_code == 200
    list_data = r_list.json()
    assert "total" in list_data
    assert "items" in list_data
    assert isinstance(list_data["items"], list)

    # 3. Test daily head hash logger function
    head_hash = log_daily_audit_head_hash(db_session)
    assert isinstance(head_hash, str)
    assert len(head_hash) == 64


def test_audit_tampering_detection(client, db_session: Session):
    """
    Test that modifying any audit row's payload directly in the database
    is immediately detected by GET /v1/audit/verify-chain.
    """
    admin_user = db_session.query(User).filter(User.email == "aicte.admin@demo.local").first()
    assert admin_user is not None
    headers = make_auth_headers(admin_user)

    # Append distinct audit rows
    append_audit_log(
        db_session,
        action="PRE_TAMPER_LOG",
        actor_type="USER",
        actor_id=admin_user.id,
        role="AICTE_ADMIN",
        resource="SYSTEM",
        payload={"checkpoint": "before"},
    )
    tampered_row = append_audit_log(
        db_session,
        action="TARGET_TAMPER_LOG",
        actor_type="USER",
        actor_id=admin_user.id,
        role="AICTE_ADMIN",
        resource="SYSTEM",
        payload={"secret": "original_value"},
    )
    append_audit_log(
        db_session,
        action="POST_TAMPER_LOG",
        actor_type="USER",
        actor_id=admin_user.id,
        role="AICTE_ADMIN",
        resource="SYSTEM",
        payload={"checkpoint": "after"},
    )
    db_session.commit()

    original_payload = tampered_row.payload_json
    tampered_id = tampered_row.id

    try:
        # Tamper payload
        tampered_row.payload_json = '{"tampered": "illegal_modification"}'
        db_session.commit()

        r = client.get("/v1/audit/verify-chain", headers=headers)
        assert r.status_code == 200
        res = r.json()
        assert res["valid"] is False
        assert res["first_broken_id"] == tampered_id
        assert "Hash mismatch" in res["reason"] or "Broken link" in res["reason"]

    finally:
        # Restore row to maintain test isolation
        tampered_row.payload_json = original_payload
        db_session.commit()


# ============================================================================
# 3. PII MASKING & UNMASKED READ AUDIT TESTS
# ============================================================================


def test_pii_masking_for_analyst_and_unmasked_audit_for_admin(client, db_session: Session):
    """
    Test Task B5 PII masking:
    - AICTE_ANALYST always gets masked APAAR, email, and mobile.
    - INSTITUTION_ADMIN gets unmasked and writes PII_UNMASKED_READ audit log.
    - STUDENT for self gets unmasked and writes PII_UNMASKED_READ audit log.
    """
    analyst_user = db_session.query(User).filter(User.email == "aicte.analyst@demo.local").first()
    inst_admin_user = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    student_user = db_session.query(User).filter(User.email == "student@demo.local").first()

    # Restore Aarav Sharma PII for testing
    student = (
        db_session.query(StudentRecord).filter(StudentRecord.apaar_id == TEST_APAAR_ID).first()
    )
    assert student is not None
    student.full_name = "Aarav Sharma"
    student.email_enc = encrypt_field("aarav.sharma@example.com")
    student.mobile_enc = encrypt_field("9876543210")
    db_session.commit()

    # 1. AICTE_ANALYST read -> MUST BE MASKED
    headers_analyst = make_auth_headers(analyst_user)
    r_analyst = client.get(f"/v1/students/{TEST_APAAR_ID}", headers=headers_analyst)
    assert r_analyst.status_code == 200
    data_analyst = r_analyst.json()

    # APAAR must be masked '9988****5544'
    assert data_analyst["apaar_id"] == f"{TEST_APAAR_ID[:4]}****{TEST_APAAR_ID[8:]}"
    assert "****" in data_analyst["apaar_id"]
    # Email and mobile must be masked
    assert data_analyst["email"] != "aarav.sharma@example.com"
    assert "a***a@example.com" == data_analyst["email"]
    assert "****" in data_analyst["mobile"]

    # 2. INSTITUTION_ADMIN read -> UNMASKED + AUDIT ROW WRITTEN
    initial_unmasked_audits = (
        db_session.query(AuditLog).filter(AuditLog.action == "PII_UNMASKED_READ").count()
    )

    headers_admin = make_auth_headers(inst_admin_user)
    r_admin = client.get(f"/v1/students/{TEST_APAAR_ID}", headers=headers_admin)
    assert r_admin.status_code == 200
    data_admin = r_admin.json()

    # Full plaintext APAAR, email, and mobile
    assert data_admin["apaar_id"] == TEST_APAAR_ID
    assert data_admin["email"] == "aarav.sharma@example.com"
    assert data_admin["mobile"] == "9876543210"

    # Audit row logged
    new_unmasked_audits = (
        db_session.query(AuditLog).filter(AuditLog.action == "PII_UNMASKED_READ").count()
    )
    assert new_unmasked_audits == initial_unmasked_audits + 1

    # 3. STUDENT read for self -> UNMASKED
    headers_student = make_auth_headers(student_user)
    r_student = client.get(f"/v1/students/{TEST_APAAR_ID}", headers=headers_student)
    assert r_student.status_code == 200
    data_student = r_student.json()
    assert data_student["apaar_id"] == TEST_APAAR_ID
    assert data_student["email"] == "aarav.sharma@example.com"


# ============================================================================
# 4. DATA RETENTION PURGE TESTS (batch_files older than 90 days)
# ============================================================================


def test_data_retention_purge_service_and_endpoint(client, db_session: Session):
    """
    Test Task B5 item 4: Data retention purge removes raw batch_files older than 90 days,
    keeps active files, and logs an audit record.
    """
    # Create a batch
    batch_id = str(uuid.uuid4())
    batch = Batch(
        batch_id=batch_id,
        institution_aicte_id=TEST_INSTITUTION_ID,
        academic_year="2024-2025",
        status="COMMITTED",
    )
    db_session.add(batch)
    db_session.flush()

    now = datetime.now(UTC)
    old_date = now - timedelta(days=95)
    recent_date = now - timedelta(days=20)

    # 1. Expired batch file (>90 days old)
    old_file = BatchFile(
        id=str(uuid.uuid4()),
        batch_id=batch_id,
        file_data=b"old,student,data",
        sha256="abc123old",
        size_bytes=16,
        filename="old_students.csv",
        content_type="text/csv",
        created_at=old_date,
    )
    # 2. Recent batch file (<90 days old)
    recent_file = BatchFile(
        id=str(uuid.uuid4()),
        batch_id=batch_id,
        file_data=b"recent,student,data",
        sha256="abc123recent",
        size_bytes=19,
        filename="recent_students.csv",
        content_type="text/csv",
        created_at=recent_date,
    )
    db_session.add(old_file)
    db_session.add(recent_file)
    db_session.commit()

    old_file_id = old_file.id
    recent_file_id = recent_file.id

    # Call purge endpoint
    admin_user = db_session.query(User).filter(User.email == "aicte.admin@demo.local").first()
    headers = make_auth_headers(admin_user)

    r = client.post(
        "/v1/admin/retention/purge",
        params={"retention_days": 90},
        headers=headers,
    )
    assert r.status_code == 200
    res = r.json()
    assert res["purged_count"] >= 1
    assert res["retention_days"] == 90

    # Old file is purged from database
    purged_check = db_session.query(BatchFile).filter(BatchFile.id == old_file_id).first()
    assert purged_check is None

    # Recent file remains intact
    recent_check = db_session.query(BatchFile).filter(BatchFile.id == recent_file_id).first()
    assert recent_check is not None

    # Audit log entry for purge exists
    purge_audit = (
        db_session.query(AuditLog).filter(AuditLog.action == "DATA_RETENTION_PURGE").first()
    )
    assert purge_audit is not None
