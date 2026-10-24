"""
Integration and analytics API tests for Task B7.
Covers:
1. Webhooks: CRUD, HTTPS validation, secret shown once, test event dispatch,
   HMAC-SHA256 signature verification via Python verifier, retry backoff, delivery history.
2. Notifications: Outbox pattern, 6 template renderings, SMTP email worker dispatch,
   SMS adapter stub, GET /v1/notifications/me.
3. Bulk exports: AICTE_ADMIN role enforcement, CSV & Parquet streaming, PII masking,
   mandatory reason validation (min 10 chars) for unmasked data, audit logging.
4. Dashboards: AICTE summary, 30s cache TTL, LGD map, leaderboards, anomaly feed,
   institution summary, institution DQ trend.
5. Reports: PDF & XLSX generation, template rendering, async job submission, download.
6. B4 Stubs completion: Rollover non-dry-run persistence execution.
"""

import hashlib
import hmac
import time
from datetime import date
from unittest.mock import MagicMock, patch

import pytest
from app.models.auth import AuditLog, User
from app.models.core import (
    Institution,
    Program,
    ProgramIntake,
    StudentRecord,
    Webhook,
)
from app.services.dashboards import _CACHE, clear_dashboard_cache
from app.services.notifications import (
    enqueue_notification,
    process_notifications_worker,
    send_sms_stub,
)
from app.services.notifications import (
    render_template as render_notification_template,
)
from app.services.webhooks import (
    deliver_webhook_attempt,
)
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from tests.conftest import make_auth_headers


# ---------------------------------------------------------------------------
# Python signature verification helper matching backend/docs/webhooks.md
# ---------------------------------------------------------------------------
def verify_eduverify_webhook(
    raw_body_bytes: bytes,
    signature_header: str,
    secret: str,
    tolerance_seconds: int = 300,
) -> bool:
    """Verifies HMAC-SHA256 signature per backend/docs/webhooks.md."""
    if not signature_header or not secret:
        return False

    elements = {}
    for part in signature_header.split(","):
        if "=" in part:
            k, v = part.split("=", 1)
            elements[k.strip()] = v.strip()

    timestamp_str = elements.get("t")
    received_signature = elements.get("v1")

    if not timestamp_str or not received_signature:
        return False

    try:
        timestamp = int(timestamp_str)
    except ValueError:
        return False

    current_time = int(time.time())
    if abs(current_time - timestamp) > tolerance_seconds:
        return False

    to_sign = f"{timestamp}.".encode("utf-8") + raw_body_bytes
    expected_signature = hmac.new(
        secret.encode("utf-8"),
        to_sign,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected_signature, received_signature)


# ---------------------------------------------------------------------------
# Test Fixtures & Seed Data
# ---------------------------------------------------------------------------
@pytest.fixture(autouse=True)
def setup_b7_test_data(db_session: Session):
    """Sets up institution, program, intake, and student records for B7 tests."""
    clear_dashboard_cache()

    # Ensure test institution exists
    inst = (
        db_session.query(Institution).filter(Institution.institution_aicte_id == "1-10001").first()
    )
    if not inst:
        inst = Institution(
            institution_aicte_id="1-10001",
            name="Apex Institute of Technology",
            state_code=7,
            district_code=101,
            type="ENGINEERING",
            affiliated_dab_id="DAB-01",
            onboarding_level="FULL",
            did="did:web:institution.1-10001",
        )
        db_session.add(inst)
        db_session.flush()

    # Ensure program & intake exist
    prog = db_session.query(Program).filter(Program.program_code == "BTECH-CSE").first()
    if not prog:
        prog = Program(
            program_code="BTECH-CSE",
            name="B.Tech Computer Science and Engineering",
            course_level="UG",
            duration_years=4,
        )
        db_session.add(prog)
        db_session.flush()

    intake = (
        db_session.query(ProgramIntake)
        .filter(
            ProgramIntake.institution_aicte_id == "1-10001",
            ProgramIntake.academic_year == "2024-25",
        )
        .first()
    )
    if not intake:
        intake = ProgramIntake(
            institution_aicte_id="1-10001",
            program_code="BTECH-CSE",
            academic_year="2024-25",
            approved_intake=60,
        )
        db_session.add(intake)
        db_session.flush()

    # Seed sample students
    if (
        not db_session.query(StudentRecord)
        .filter(StudentRecord.institution_aicte_id == "1-10001")
        .first()
    ):
        for i in range(5):
            student = StudentRecord(
                apaar_id=f"90000000000{i}",
                apaar_hash=f"apaar_hash_{i}",
                institution_aicte_id="1-10001",
                institution_student_id=f"STU-00{i}",
                academic_year="2024-25",
                program_code="BTECH-CSE",
                course_level="UG",
                year_of_study=1,
                full_name=f"Student{i} Test",
                dob=date(2003, 1, 15),
                gender="MALE",
                category="OPEN",
                pwd=False,
                admission_date=date(2024, 8, 1),
                admission_type="CENTRALIZED",
                seat_type="CONVENOR",
                quota="HOME_STATE",
                nationality="IN",
                enrolment_status="ACTIVE",
                consent_status="GRANTED",
                nri_status=(i == 0),
                supernumerary_scheme=("EWS" if i == 1 else None),
            )
            db_session.add(student)
        db_session.flush()

    db_session.commit()


# ===========================================================================
# 1. Webhook Tests
# ===========================================================================
def test_webhooks_rbac(client: TestClient, db_session: Session):
    """Verifies role-based access for webhooks (INSTITUTION_ADMIN only)."""
    student_user = db_session.query(User).filter(User.email == "student@demo.local").first()
    student_headers = make_auth_headers(student_user)

    # Student cannot create webhook (403)
    resp = client.post(
        "/v1/webhooks",
        headers=student_headers,
        json={"url": "https://example.com/webhook", "events": ["batch_validated"]},
    )
    assert resp.status_code == 403


def test_webhooks_create_https_validation_and_secret(client: TestClient, db_session: Session):
    """
    Verifies:
    1. HTTP is rejected for remote URLs.
    2. Localhost is permitted in dev.
    3. Remote HTTPS is permitted.
    4. Secret starts with whsec_ and is returned on creation.
    """
    inst_user = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    headers = make_auth_headers(inst_user)

    # Non-https remote URL is rejected (400)
    resp_http = client.post(
        "/v1/webhooks",
        headers=headers,
        json={"url": "http://example.com/webhook", "events": ["batch_validated"]},
    )
    assert resp_http.status_code == 400
    assert "HTTPS" in resp_http.json()["detail"]

    # Localhost in dev is allowed
    resp_local = client.post(
        "/v1/webhooks",
        headers=headers,
        json={
            "url": "http://localhost:9000/webhook",
            "events": ["batch_validated", "review_needed"],
        },
    )
    assert resp_local.status_code == 201
    data_local = resp_local.json()
    assert data_local["url"] == "http://localhost:9000/webhook"
    assert data_local["secret"] is not None
    assert data_local["secret"].startswith("whsec_")
    assert data_local["id"] is not None

    # Remote HTTPS is allowed
    resp_https = client.post(
        "/v1/webhooks",
        headers=headers,
        json={"url": "https://school.edu/api/webhooks", "events": ["batch_committed"]},
    )
    assert resp_https.status_code == 201
    data_https = resp_https.json()
    assert data_https["secret"].startswith("whsec_")


def test_webhooks_list_and_secret_shown_once(client: TestClient, db_session: Session):
    """Verifies that GET /v1/webhooks masks the signing secret (shown only once on creation)."""
    inst_user = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    headers = make_auth_headers(inst_user)

    # Create webhook
    create_resp = client.post(
        "/v1/webhooks",
        headers=headers,
        json={"url": "https://myinstitute.org/events", "events": ["batch_committed"]},
    )
    assert create_resp.status_code == 201
    created = create_resp.json()
    created_id = created["id"]
    assert created["secret"] is not None

    # List webhooks: secret must be None / masked
    list_resp = client.get("/v1/webhooks", headers=headers)
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert any(w["id"] == created_id for w in items)
    matched = next(w for w in items if w["id"] == created_id)
    assert matched["secret"] is None, "Secret must NOT be exposed in GET /v1/webhooks"


def test_webhooks_test_dispatch_and_signature_verification(client: TestClient, db_session: Session):
    """
    Verifies:
    1. POST /v1/webhooks/{id}/test triggers test event dispatch.
    2. Signature header format 't=...,v1=...'.
    3. Signature verification succeeds using the exact Python snippet from docs/webhooks.md.
    4. WebhookDelivery record is created.
    """
    inst_user = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    headers = make_auth_headers(inst_user)

    # Create webhook
    create_resp = client.post(
        "/v1/webhooks",
        headers=headers,
        json={"url": "https://mock.endpoint/webhook", "events": ["ping", "batch_validated"]},
    )
    assert create_resp.status_code == 201
    wh_data = create_resp.json()
    webhook_id = wh_data["id"]
    raw_secret = wh_data["secret"]
    assert raw_secret is not None

    # Mock httpx dispatch to inspect outgoing headers and payload
    captured_request = {}

    class MockHttpClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_val, exc_tb):
            pass

        def post(self, url, content=None, headers=None, **kwargs):
            captured_request["url"] = url
            captured_request["content"] = content
            captured_request["headers"] = headers
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.is_success = True
            mock_resp.text = "OK"
            return mock_resp

    with patch("app.services.webhooks.httpx.Client", MockHttpClient):
        test_resp = client.post(f"/v1/webhooks/{webhook_id}/test", headers=headers)
        assert test_resp.status_code == 200
        result = test_resp.json()
        assert result["success"] is True
        assert result["status_code"] == 200

    # Verify outgoing signature header
    sig_header = captured_request["headers"].get("X-EduVerify-Signature")
    assert sig_header is not None
    assert sig_header.startswith("t=") and ",v1=" in sig_header

    # Verify signature using documentation helper function
    is_valid = verify_eduverify_webhook(
        raw_body_bytes=captured_request["content"],
        signature_header=sig_header,
        secret=raw_secret,
    )
    assert is_valid is True, "HMAC-SHA256 signature verification failed using docs verifier"

    # Test tampering rejection
    tampered_bytes = captured_request["content"] + b"TAMPERED"
    assert verify_eduverify_webhook(tampered_bytes, sig_header, raw_secret) is False

    # Check delivery logs
    deliv_resp = client.get(f"/v1/webhooks/{webhook_id}/deliveries", headers=headers)
    assert deliv_resp.status_code == 200
    deliveries = deliv_resp.json()
    assert len(deliveries) >= 1
    assert deliveries[0]["response_code"] == 200
    assert deliveries[0]["event_type"] == "ping"


def test_webhooks_delete(client: TestClient, db_session: Session):
    """Verifies deletion of a registered webhook."""
    inst_user = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    headers = make_auth_headers(inst_user)

    create_resp = client.post(
        "/v1/webhooks",
        headers=headers,
        json={"url": "https://del.test/webhook", "events": ["batch_committed"]},
    )
    wh_id = create_resp.json()["id"]

    del_resp = client.delete(f"/v1/webhooks/{wh_id}", headers=headers)
    assert del_resp.status_code == 200

    list_resp = client.get("/v1/webhooks", headers=headers)
    assert all(w["id"] != wh_id for w in list_resp.json())


def test_webhooks_retries_with_exponential_backoff(db_session: Session):
    """Verifies delivery worker retries with exponential backoff up to 5 attempts upon failure."""
    wh = Webhook(
        institution_aicte_id="1-10001",
        url="https://flaky.endpoint.edu/webhook",
        secret_hash="test_secret_hash",
        events=["batch_validated"],
        is_active=True,
    )
    db_session.add(wh)
    db_session.flush()

    attempt_counter = [0]

    class FailingHttpClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_val, exc_tb):
            pass

        def post(self, url, content=None, headers=None, **kwargs):
            attempt_counter[0] += 1
            mock_resp = MagicMock()
            if attempt_counter[0] < 5:
                mock_resp.status_code = 503
                mock_resp.is_success = False
                mock_resp.text = "Service Unavailable"
            else:
                mock_resp.status_code = 200
                mock_resp.is_success = True
                mock_resp.text = "Success on attempt 5"
            return mock_resp

    with patch("app.services.webhooks.httpx.Client", FailingHttpClient):
        with patch("time.sleep") as mock_sleep:
            status_str, code, err, attempts = deliver_webhook_attempt(
                wh, "batch_validated", {"batch_id": "b-test"}, max_retries=5
            )
            assert status_str == "SUCCESS"
            assert code == 200
            assert attempts == 5
            assert (
                mock_sleep.call_count == 4
            )  # Backoff sleep called between attempts 1-2, 2-3, 3-4, 4-5


# ===========================================================================
# 2. Notifications & Outbox Tests
# ===========================================================================
def test_notifications_all_templates_and_enqueue(db_session: Session):
    """Tests template rendering and outbox enqueue for all 6 required notification events."""
    templates = [
        ("batch_validated", {"batch_id": "b-1", "quality_score": 98.5, "rows_count": 120}),
        (
            "batch_committed",
            {"batch_id": "b-1", "academic_year": "2024-25", "total_committed": 120},
        ),
        ("review_needed", {"batch_id": "b-1", "issue_count": 5, "quality_score": 75.0}),
        ("transfer_requested", {"student_name": "Rohan Sharma", "to_institution": "MIT Pune"}),
        (
            "consent_changed",
            {"student_name": "Rohan Sharma", "action": "REVOKED", "target": "Employer X"},
        ),
        (
            "credential_revoked_or_superseded",
            {"credential_id": "cred-1", "reason": "Academic Correction"},
        ),
    ]

    for event_type, ctx in templates:
        subj, body = render_notification_template(event_type, ctx)
        assert len(subj) > 0
        assert len(body) > 0

        item = enqueue_notification(
            db=db_session,
            recipient="test.recipient@demo.local",
            channel="EMAIL",
            subject=subj,
            body=body,
        )
        assert item.status == "PENDING"
        assert item.recipient == "test.recipient@demo.local"


def test_notifications_worker_processing(db_session: Session):
    """Verifies background notification worker processes pending outbox items."""
    item = enqueue_notification(
        db=db_session,
        recipient="user.worker@demo.local",
        channel="EMAIL",
        subject="Test Alert",
        body="This is an automated test alert.",
    )
    db_session.commit()

    # Mock smtplib.SMTP to avoid requiring active mailpit daemon during test
    with patch("smtplib.SMTP") as mock_smtp:
        mock_instance = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_instance

        processed = process_notifications_worker(db=db_session, batch_size=10)
        assert processed >= 1

    db_session.refresh(item)
    assert item.status == "SENT"
    assert item.sent_at is not None

    # Test SMS adapter stub
    sms_success = send_sms_stub(recipient="+919876543210", body="Test OTP 123456")
    assert sms_success is True


def test_notifications_me_endpoint(client: TestClient, db_session: Session):
    """Verifies GET /v1/notifications/me returns current user's notifications."""
    inst_user = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    assert inst_user is not None
    assert inst_user.email is not None
    headers = make_auth_headers(inst_user)

    # Enqueue a notification for this user
    enqueue_notification(
        db=db_session,
        recipient=inst_user.email,
        channel="EMAIL",
        subject="Welcome Institution Admin",
        body="Your account is active.",
    )
    db_session.commit()

    resp = client.get("/v1/notifications/me", headers=headers)
    assert resp.status_code == 200
    items = resp.json()
    assert any(n["subject"] == "Welcome Institution Admin" for n in items)


# ===========================================================================
# 3. Bulk Exports Tests
# ===========================================================================
def test_bulk_exports_rbac(client: TestClient, db_session: Session):
    """Verifies bulk exports are strictly restricted to AICTE_ADMIN."""
    inst_user = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    inst_headers = make_auth_headers(inst_user)

    resp = client.get("/v1/exports/students?academic_year=2024-25", headers=inst_headers)
    assert resp.status_code == 403


def test_bulk_exports_csv_and_parquet_masked(client: TestClient, db_session: Session):
    """Verifies default CSV and Parquet exports stream masked student PII."""
    aicte_user = db_session.query(User).filter(User.email == "aicte.admin@demo.local").first()
    aicte_headers = make_auth_headers(aicte_user)

    # 1. Default CSV Export (Masked)
    resp_csv = client.get(
        "/v1/exports/students?academic_year=2024-25&format=csv",
        headers=aicte_headers,
    )
    assert resp_csv.status_code == 200
    assert "text/csv" in resp_csv.headers["content-type"]
    csv_text = resp_csv.text
    assert "apaar_id" in csv_text and "institution_aicte_id" in csv_text
    # Check that APAAR is masked (ends with *... or has mask format)
    assert "********" in csv_text or "****" in csv_text

    # 2. Parquet Export
    resp_parquet = client.get(
        "/v1/exports/students?academic_year=2024-25&format=parquet",
        headers=aicte_headers,
    )
    assert resp_parquet.status_code == 200
    assert "application/octet-stream" in resp_parquet.headers["content-type"]
    assert len(resp_parquet.content) > 0


def test_bulk_exports_unmasked_reason_validation_and_audit(client: TestClient, db_session: Session):
    """
    Verifies unmasked exports:
    1. Reject requests without reason or short reason (< 10 chars).
    2. Allow requests with statutory reason and log to audit_log.
    """
    aicte_user = db_session.query(User).filter(User.email == "aicte.admin@demo.local").first()
    aicte_headers = make_auth_headers(aicte_user)

    # 1. Unmasked without reason returns 400
    resp_no_reason = client.get(
        "/v1/exports/students?academic_year=2024-25&unmasked=true",
        headers=aicte_headers,
    )
    assert resp_no_reason.status_code == 400
    assert "reason" in resp_no_reason.json()["detail"].lower()

    # 2. Unmasked with short reason (< 10 chars) returns 400
    resp_short_reason = client.get(
        "/v1/exports/students?academic_year=2024-25&unmasked=true&reason=test",
        headers=aicte_headers,
    )
    assert resp_short_reason.status_code == 400

    # 3. Valid statutory reason returns unmasked data and logs audit entry
    valid_reason = "Statutory CBI investigation reference order 2026-B7"
    resp_valid = client.get(
        "/v1/exports/students",
        params={
            "academic_year": "2024-25",
            "unmasked": "true",
            "reason": valid_reason,
        },
        headers=aicte_headers,
    )
    assert resp_valid.status_code == 200
    csv_text = resp_valid.text
    # APAAR ID should not be masked
    assert "900000000000" in csv_text

    # Check audit log in DB
    audit_entry = (
        db_session.query(AuditLog)
        .filter(AuditLog.action == "BULK_EXPORT_UNMASKED")
        .order_by(AuditLog.ts.desc())
        .first()
    )
    assert audit_entry is not None
    assert valid_reason in audit_entry.payload_json


# ===========================================================================
# 4. Dashboards API Tests
# ===========================================================================
def test_dashboards_aicte_summary_and_caching(client: TestClient, db_session: Session):
    """Verifies nationwide summary aggregation and 30-second cache behavior."""
    clear_dashboard_cache()
    aicte_user = db_session.query(User).filter(User.email == "aicte.admin@demo.local").first()
    headers = make_auth_headers(aicte_user)

    resp1 = client.get("/v1/dashboards/aicte/summary?academic_year=2024-25", headers=headers)
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert "institutions" in data1
    assert "students" in data1
    assert "coverage_percent" in data1
    assert "fill_percent" in data1
    assert "supernumerary_breakdown" in data1
    assert "dq_avg" in data1

    # Verify cache is populated
    assert len(_CACHE) >= 1

    # Second call should return identical cached data
    resp2 = client.get("/v1/dashboards/aicte/summary?academic_year=2024-25", headers=headers)
    assert resp2.status_code == 200
    assert resp2.json() == data1


def test_dashboards_aicte_map(client: TestClient, db_session: Session):
    """Verifies map aggregation by LGD state code."""
    aicte_user = db_session.query(User).filter(User.email == "aicte.admin@demo.local").first()
    headers = make_auth_headers(aicte_user)

    for metric in ["quality_score", "students_total", "fill_percentage", "excess_enrolment"]:
        resp = client.get(f"/v1/dashboards/aicte/map?metric={metric}", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["metric"] is not None
        assert "states" in data


def test_dashboards_aicte_leaderboards(client: TestClient, db_session: Session):
    """Verifies leaderboards for excess enrolment, low DQ, and cross duplicates."""
    aicte_user = db_session.query(User).filter(User.email == "aicte.admin@demo.local").first()
    headers = make_auth_headers(aicte_user)

    resp = client.get(
        "/v1/dashboards/aicte/leaderboards?academic_year=2024-25&limit=5", headers=headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "excess_enrolment" in data
    assert "low_dq" in data
    assert "most_cross_dupes" in data


def test_dashboards_aicte_anomalies(client: TestClient, db_session: Session):
    """Verifies anomalies feed retrieval."""
    aicte_user = db_session.query(User).filter(User.email == "aicte.admin@demo.local").first()
    headers = make_auth_headers(aicte_user)

    resp = client.get("/v1/dashboards/aicte/anomalies?limit=10", headers=headers)
    assert resp.status_code == 200
    items = resp.json()
    assert isinstance(items, list)


def test_dashboards_institution_summary_and_dq_trend(client: TestClient, db_session: Session):
    """Verifies institution-specific summary and DQ score trend."""
    inst_user = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    headers = make_auth_headers(inst_user)

    # 1. Own Summary
    resp_sum = client.get(
        "/v1/dashboards/institution/summary?academic_year=2024-25", headers=headers
    )
    assert resp_sum.status_code == 200
    sum_data = resp_sum.json()
    assert sum_data["institution_aicte_id"] == "1-10001"
    assert "sanctioned_intake" in sum_data
    assert "total_students" in sum_data

    # 2. DQ Trend
    resp_trend = client.get("/v1/dashboards/institution/dq-trend?limit=5", headers=headers)
    assert resp_trend.status_code == 200
    trend_data = resp_trend.json()
    assert trend_data["institution_aicte_id"] == "1-10001"
    assert "data_points" in trend_data


# ===========================================================================
# 5. Reports API Tests
# ===========================================================================
def test_reports_create_sync_pdf_and_xlsx(client: TestClient, db_session: Session):
    """Verifies synchronous creation of PDF and XLSX reports."""
    aicte_user = db_session.query(User).filter(User.email == "aicte.admin@demo.local").first()
    headers = make_auth_headers(aicte_user)

    # 1. Create PDF Report
    resp_pdf = client.post(
        "/v1/reports",
        headers=headers,
        json={
            "report_type": "POLICY",
            "format": "pdf",
            "academic_year": "2024-25",
            "state": "Delhi",
            "program": "BTECH-CSE",
        },
    )
    assert resp_pdf.status_code == 201
    job_pdf = resp_pdf.json()
    assert job_pdf["status"] == "COMPLETED"
    result_report = job_pdf["result_report"]
    assert result_report["report_type"] == "POLICY"
    assert result_report["format"].lower() == "pdf"
    pdf_id = result_report["id"]

    # Download PDF
    down_pdf = client.get(f"/v1/reports/{pdf_id}/download", headers=headers)
    assert down_pdf.status_code == 200
    assert "application/pdf" in down_pdf.headers["content-type"]
    assert len(down_pdf.content) > 0

    # 2. Create XLSX Report
    resp_xlsx = client.post(
        "/v1/reports",
        headers=headers,
        json={
            "report_type": "MONITORING",
            "format": "xlsx",
            "academic_year": "2024-25",
        },
    )
    assert resp_xlsx.status_code == 201
    job_xlsx = resp_xlsx.json()
    xlsx_id = job_xlsx["result_report"]["id"]

    # Download XLSX
    down_xlsx = client.get(f"/v1/reports/{xlsx_id}/download", headers=headers)
    assert down_xlsx.status_code == 200
    assert "spreadsheet" in down_xlsx.headers["content-type"]
    assert len(down_xlsx.content) > 0


def test_reports_async_job_and_list(client: TestClient, db_session: Session):
    """Verifies asynchronous report job creation, report listing, and item retrieval."""
    aicte_user = db_session.query(User).filter(User.email == "aicte.admin@demo.local").first()
    headers = make_auth_headers(aicte_user)

    # Create async job
    job_resp = client.post(
        "/v1/reports/jobs",
        headers=headers,
        json={
            "report_type": "ACCREDITATION",
            "format": "pdf",
            "academic_year": "2024-25",
        },
    )
    assert job_resp.status_code in (201, 202)
    job_data = job_resp.json()
    assert job_data["status"] == "COMPLETED"
    report_id = job_data["result_report"]["id"]
    assert report_id is not None

    # List reports
    list_resp = client.get("/v1/reports", headers=headers)
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert any(r["id"] == report_id for r in items)

    # Get single report item
    item_resp = client.get(f"/v1/reports/{report_id}", headers=headers)
    assert item_resp.status_code == 200
    assert item_resp.json()["id"] == report_id


# ===========================================================================
# 6. B4 Stubs Completion: Rollover Progression Execution Test
# ===========================================================================
def test_rollover_non_dry_run_executes_progression(client: TestClient, db_session: Session):
    """Verifies POST /v1/admin/rollover with dry_run=False executes progression updates in DB."""
    aicte_user = db_session.query(User).filter(User.email == "aicte.admin@demo.local").first()
    headers = make_auth_headers(aicte_user)

    # Create a test student in year 2024-25 year_of_study 1
    student = StudentRecord(
        apaar_id="888888888888",
        apaar_hash="rollover_test_hash",
        institution_aicte_id="1-10001",
        institution_student_id="ROLLOVER-1",
        academic_year="2024-25",
        program_code="BTECH-CSE",
        course_level="UG",
        year_of_study=1,
        full_name="Rollover Candidate",
        dob=date(2003, 5, 20),
        gender="MALE",
        category="OPEN",
        pwd=False,
        admission_date=date(2024, 8, 1),
        admission_type="CENTRALIZED",
        seat_type="CONVENOR",
        quota="HOME_STATE",
        nationality="IN",
        enrolment_status="ACTIVE",
        consent_status="GRANTED",
        nri_status=False,
    )
    db_session.add(student)
    db_session.commit()

    # Run non-dry-run rollover
    resp = client.post(
        "/v1/admin/rollover",
        headers=headers,
        json={
            "from_academic_year": "2024-25",
            "to_academic_year": "2025-26",
            "dry_run": False,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["dry_run"] is False
    assert data["rolled_over"] >= 1

    # Verify student was progressed in DB
    db_session.refresh(student)
    assert student.academic_year == "2025-26"
    assert student.year_of_study == 2
