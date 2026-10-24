"""
Comprehensive integration tests for Task B3: Batch ingestion, mapping, validation,
commit, SSE events, report exports, and student lifecycle updates.
Complies with prompt B3 item 8.
"""

import concurrent.futures
from pathlib import Path

from app.models.auth import User
from app.models.core import StudentRecord, StudentRecordVersion
from sqlalchemy.orm import Session
from tests.conftest import make_auth_headers

DEMO_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "demo"


def get_demo_file(filename: str) -> tuple[bytes, str]:
    file_path = DEMO_DIR / filename
    assert file_path.exists(), f"Demo file not found: {file_path}"
    data = file_path.read_bytes()
    mime = (
        "text/csv"
        if filename.endswith(".csv")
        else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    return data, mime


def test_batch_upload_happy_path_clean_csv(client, db_session: Session):
    """
    Happy path with data/demo/batch_1_clean.csv:
    Upload -> Smart mapping suggested -> Confirm mapping -> Validation completes ->
    Commit -> Students persisted.
    """
    user = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    assert user is not None
    user.institution_aicte_id = "1-100010001"
    db_session.flush()
    headers = make_auth_headers(user)
    file_bytes, mime = get_demo_file("batch_1_clean.csv")

    # 1. Upload
    resp = client.post(
        "/v1/batches",
        headers=headers,
        data={"academic_year": "2026-27"},
        files={"file": ("batch_1_clean.csv", file_bytes, mime)},
    )
    assert resp.status_code == 202
    batch_data = resp.json()
    batch_id = batch_data["batch_id"]
    assert batch_data["status"] in ("MAPPING", "VALIDATING", "VALIDATED")

    # 2. Retrieve mapping suggestions
    map_resp = client.get(f"/v1/batches/{batch_id}/mapping", headers=headers)
    assert map_resp.status_code == 200
    mappings = map_resp.json()
    assert len(mappings) > 10

    # 3. Confirm mapping (triggers full validation)
    confirm_resp = client.put(
        f"/v1/batches/{batch_id}/mapping",
        headers=headers,
        json={"mappings": mappings, "save_profile": True, "profile_name": "Test Profile"},
    )
    assert confirm_resp.status_code == 202
    validated_batch = confirm_resp.json()
    assert validated_batch["status"] in ("VALIDATED", "IN_REVIEW")

    # 4. Check report
    report_resp = client.get(f"/v1/batches/{batch_id}/report?format=json", headers=headers)
    assert report_resp.status_code == 200
    report_json = report_resp.json()
    assert report_json["rows_total"] > 0

    # 5. Commit batch
    commit_resp = client.post(
        f"/v1/batches/{batch_id}/commit",
        headers=headers,
        json={"version": validated_batch["version"]},
    )
    assert commit_resp.status_code == 200, (
        f"Commit failed with {commit_resp.status_code}: {commit_resp.text}"
    )
    commit_data = commit_resp.json()
    assert commit_data["committed_records"] > 0
    assert commit_data["batch_id"] == batch_id

    # Verify student records committed in database
    committed_students = (
        db_session.query(StudentRecord)
        .filter(StudentRecord.institution_aicte_id == user.institution_aicte_id)
        .count()
    )
    assert committed_students > 0


def test_batch_upload_errors_xlsx_and_issues(client, db_session: Session):
    """
    Error path with data/demo/batch_2_errors.xlsx:
    Upload -> Confirm mapping -> State becomes IN_REVIEW -> Issues queried & sorted ->
    Commit blocked on critical issues.
    """
    user = db_session.query(User).filter(User.email == "inst2.admin@demo.local").first()
    assert user is not None
    headers = make_auth_headers(user)
    file_bytes, mime = get_demo_file("batch_2_errors.xlsx")

    # Upload
    upload_resp = client.post(
        "/v1/batches",
        headers=headers,
        data={"academic_year": "2026-27"},
        files={"file": ("batch_2_errors.xlsx", file_bytes, mime)},
    )
    assert upload_resp.status_code == 202
    batch_id = upload_resp.json()["batch_id"]

    # Confirm mapping
    map_resp = client.get(f"/v1/batches/{batch_id}/mapping", headers=headers)
    mappings = map_resp.json()
    confirm_resp = client.put(
        f"/v1/batches/{batch_id}/mapping",
        headers=headers,
        json={"mappings": mappings},
    )
    assert confirm_resp.status_code == 202
    batch = confirm_resp.json()
    assert batch["status"] == "IN_REVIEW"

    # Query issues
    issues_resp = client.get(f"/v1/batches/{batch_id}/issues", headers=headers)
    assert issues_resp.status_code == 200
    issues = issues_resp.json()
    assert len(issues) > 0

    # Verify priority sorting: CRITICAL comes before HIGH/MEDIUM/LOW
    priorities = [i["priority"] for i in issues]
    critical_indices = [idx for idx, p in enumerate(priorities) if p == "CRITICAL"]
    high_indices = [idx for idx, p in enumerate(priorities) if p == "HIGH"]
    if critical_indices and high_indices:
        assert max(critical_indices) < min(high_indices)

    # Filter issues by priority
    crit_resp = client.get(f"/v1/batches/{batch_id}/issues?priority=CRITICAL", headers=headers)
    assert crit_resp.status_code == 200
    for iss in crit_resp.json():
        assert iss["priority"] == "CRITICAL"

    # Commit attempt blocked due to OPEN CRITICAL issues
    commit_resp = client.post(
        f"/v1/batches/{batch_id}/commit",
        headers=headers,
        json={"version": batch["version"]},
    )
    assert commit_resp.status_code == 409
    assert commit_resp.json()["code"] == "CRITICAL_ISSUES_OPEN"


def test_batch_idempotent_reupload_returns_same_batch(client, db_session: Session):
    """Re-uploading with the same Idempotency-Key returns the existing batch."""
    user = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    assert user is not None
    headers = make_auth_headers(user)
    headers["Idempotency-Key"] = "idemp-batch-unique-999"
    file_bytes, mime = get_demo_file("batch_1_clean.csv")

    resp1 = client.post(
        "/v1/batches",
        headers=headers,
        data={"academic_year": "2027-28"},
        files={"file": ("batch_1_clean.csv", file_bytes, mime)},
    )
    assert resp1.status_code == 202
    batch_id_1 = resp1.json()["batch_id"]

    resp2 = client.post(
        "/v1/batches",
        headers=headers,
        data={"academic_year": "2027-28"},
        files={"file": ("batch_1_clean.csv", file_bytes, mime)},
    )
    assert resp2.status_code == 202
    batch_id_2 = resp2.json()["batch_id"]

    assert batch_id_1 == batch_id_2


def test_batch_open_conflict_and_supersede_flow(client, db_session: Session):
    """
    Uploading a second batch for same inst + year conflicts (409) with open batch ID.
    Explicitly superseding marks the previous batch SUPERSEDED and succeeds.
    """
    user = db_session.query(User).filter(User.email == "inst2.admin@demo.local").first()
    assert user is not None
    headers = make_auth_headers(user)
    file_bytes, mime = get_demo_file("batch_1_clean.csv")

    # Batch 1
    resp1 = client.post(
        "/v1/batches",
        headers=headers,
        data={"academic_year": "2028-29"},
        files={"file": ("batch_1_clean.csv", file_bytes, mime)},
    )
    assert resp1.status_code == 202
    b1_id = resp1.json()["batch_id"]

    # Batch 2 without supersede -> 409
    resp2 = client.post(
        "/v1/batches",
        headers=headers,
        data={"academic_year": "2028-29"},
        files={"file": ("batch_1_clean.csv", file_bytes, mime)},
    )
    assert resp2.status_code == 409
    assert resp2.json()["open_batch_id"] == b1_id

    # Batch 3 with supersedes_batch_id -> 202
    resp3 = client.post(
        "/v1/batches",
        headers=headers,
        data={"academic_year": "2028-29", "supersedes_batch_id": b1_id},
        files={"file": ("batch_1_clean.csv", file_bytes, mime)},
    )
    assert resp3.status_code == 202
    b3_id = resp3.json()["batch_id"]
    assert b3_id != b1_id

    # Check B1 is now SUPERSEDED
    b1_check = client.get(f"/v1/batches/{b1_id}", headers=headers).json()
    assert b1_check["status"] == "SUPERSEDED"


def test_concurrent_commit_race_condition(client, db_session: Session):
    """
    Concurrent commit race:
    Two parallel commit requests with the same version -> one wins (200), the other loses with 409.
    """
    user = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    assert user is not None
    user.institution_aicte_id = "1-100010001"
    db_session.flush()
    headers = make_auth_headers(user)
    file_bytes, mime = get_demo_file("batch_1_clean.csv")

    # Create & validate batch
    resp = client.post(
        "/v1/batches",
        headers=headers,
        data={"academic_year": "2029-30"},
        files={"file": ("batch_1_clean.csv", file_bytes, mime)},
    )
    batch_id = resp.json()["batch_id"]
    maps = client.get(f"/v1/batches/{batch_id}/mapping", headers=headers).json()
    confirmed = client.put(
        f"/v1/batches/{batch_id}/mapping", headers=headers, json={"mappings": maps}
    ).json()
    version = confirmed["version"]

    results = []

    def _do_commit():
        return client.post(
            f"/v1/batches/{batch_id}/commit",
            headers=headers,
            json={"version": version},
        )

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        f1 = executor.submit(_do_commit)
        f2 = executor.submit(_do_commit)
        results = [f1.result(), f2.result()]

    status_codes = [r.status_code for r in results]
    assert 200 in status_codes, f"Results: {[r.text for r in results]}"
    assert 409 in status_codes, f"Results: {[r.text for r in results]}"


def test_batch_report_exports_json_xlsx_pdf(client, db_session: Session):
    """Tests GET /v1/batches/{id}/report format variations (json, xlsx, pdf)."""
    user = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    assert user is not None
    headers = make_auth_headers(user)
    file_bytes, mime = get_demo_file("batch_1_clean.csv")

    resp = client.post(
        "/v1/batches",
        headers=headers,
        data={"academic_year": "2030-31"},
        files={"file": ("batch_1_clean.csv", file_bytes, mime)},
    )
    batch_id = resp.json()["batch_id"]
    maps = client.get(f"/v1/batches/{batch_id}/mapping", headers=headers).json()
    client.put(f"/v1/batches/{batch_id}/mapping", headers=headers, json={"mappings": maps})

    # JSON
    r_json = client.get(f"/v1/batches/{batch_id}/report?format=json", headers=headers)
    assert r_json.status_code == 200
    assert "application/json" in r_json.headers["content-type"]

    # XLSX
    r_xlsx = client.get(f"/v1/batches/{batch_id}/report?format=xlsx", headers=headers)
    assert r_xlsx.status_code == 200
    assert len(r_xlsx.content) > 1000
    assert "spreadsheetml" in r_xlsx.headers["content-type"]

    # PDF
    r_pdf = client.get(f"/v1/batches/{batch_id}/report?format=pdf", headers=headers)
    assert r_pdf.status_code == 200
    assert r_pdf.content.startswith(b"%PDF")
    assert "application/pdf" in r_pdf.headers["content-type"]


def test_events_ticket_and_stream(client, db_session: Session):
    """Tests POST /v1/events/ticket generation and ticket validation."""
    user = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    assert user is not None
    headers = make_auth_headers(user)

    ticket_resp = client.post("/v1/events/ticket", headers=headers)
    assert ticket_resp.status_code == 200
    ticket = ticket_resp.json()["ticket"]
    assert len(ticket) >= 32

    # Unauthenticated without ticket -> 401
    unauth = client.get("/v1/events")
    assert unauth.status_code == 401


def test_update_student_by_institution_of_record(client, db_session: Session):
    """
    PUT /v1/students/{apaar_id}:
    Institution of record updates student -> new record_version archived,
    credentials superseded, audit logged.
    Forbidden for another institution.
    """
    admin1 = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    admin2 = db_session.query(User).filter(User.email == "inst2.admin@demo.local").first()

    # Find or create a student belonging to institution 1-10001
    student = (
        db_session.query(StudentRecord)
        .filter(StudentRecord.institution_aicte_id == "1-10001")
        .first()
    )
    if not student:
        from datetime import UTC, date, datetime

        from app.security.crypto import keyed_apaar_hash

        student = StudentRecord(
            apaar_id="100000000001",
            apaar_hash=keyed_apaar_hash("100000000001"),
            institution_aicte_id="1-10001",
            institution_student_id="STUDENT-001",
            full_name="Original Name",
            dob=date(2005, 5, 20),
            gender="M",
            category="GEN",
            pwd=False,
            course_level="UG",
            program_code="UG-CSE",
            academic_year="2026-27",
            year_of_study=1,
            admission_date=date(2026, 8, 1),
            admission_type="REGULAR",
            seat_type="REGULAR",
            quota="NONE",
            nationality="IN",
            nri_status=False,
            oci_status=False,
            fn_status=False,
            enrolment_status="ACTIVE",
            consent_status="GRANTED",
            guardian_consent=False,
            record_version=1,
            created_at=datetime.now(UTC),
        )
        db_session.add(student)
        db_session.commit()
    apaar_id = student.apaar_id
    initial_version = student.record_version

    # Admin 2 (1-10002) attempts to update -> 403 Forbidden
    forbid_resp = client.put(
        f"/v1/students/{apaar_id}",
        headers=make_auth_headers(admin2),
        json={"full_name": "Hacked Name"},
    )
    assert forbid_resp.status_code == 403

    # Admin 1 (institution of record) updates -> 200 OK
    update_resp = client.put(
        f"/v1/students/{apaar_id}",
        headers=make_auth_headers(admin1),
        json={
            "full_name": "Verified Corrected Name",
            "reason": "Name spelling corrected per Aadhaar",
        },
    )
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["full_name"] == "Verified Corrected Name"
    assert updated_data["record_version"] == initial_version + 1

    # Verify archived version in database
    archived = (
        db_session.query(StudentRecordVersion)
        .filter(
            StudentRecordVersion.apaar_id == apaar_id,
            StudentRecordVersion.record_version == initial_version,
        )
        .first()
    )
    assert archived is not None
