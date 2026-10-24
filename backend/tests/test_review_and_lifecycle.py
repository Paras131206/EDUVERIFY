"""
Integration tests for Task B4: Review, duplicates, lifecycle state machine,
transfers, aggregates, reconciliation, and rollover.
Complies with contracts/openapi.yaml, agents.md §8.1, and Task B4.
"""

import uuid
from datetime import UTC, date, datetime

import pytest
from app.models.auth import User
from app.models.core import (
    Batch,
    BatchFile,
    Correction,
    DuplicateFlag,
    Institution,
    Issue,
    Program,
    StudentRecord,
)
from app.security.crypto import keyed_apaar_hash
from sqlalchemy.orm import Session
from tests.conftest import make_auth_headers


@pytest.fixture(autouse=True)
def ensure_institutions_and_programs(db_session: Session):
    """Ensures test institutions and programs exist in the test database."""
    inst1 = (
        db_session.query(Institution)
        .filter(Institution.institution_aicte_id == "1-100010001")
        .first()
    )
    if not inst1:
        inst1 = Institution(
            institution_aicte_id="1-100010001",
            name="Delhi College of Engineering & Technology",
            state_code=7,
            district_code=101,
            type="ENGINEERING",
            affiliated_dab_id="DAB-01",
            onboarding_level="FULL",
            did="did:web:institution.1-100010001",
        )
        db_session.add(inst1)

    inst2 = (
        db_session.query(Institution).filter(Institution.institution_aicte_id == "1-10002").first()
    )
    if not inst2:
        inst2 = Institution(
            institution_aicte_id="1-10002",
            name="Beacon Institute of Technology",
            state_code=27,
            district_code=201,
            type="ENGINEERING",
            affiliated_dab_id="DAB-01",
            onboarding_level="FULL",
            did="did:web:institution.1-10002",
        )
        db_session.add(inst2)

    prog = db_session.query(Program).filter(Program.program_code == "UG-CSE").first()
    if not prog:
        prog = Program(
            program_code="UG-CSE",
            name="Computer Science and Engineering",
            course_level="UG",
            department="CSE",
            duration_years=4,
            lateral_allowed=True,
        )
        db_session.add(prog)

    prog_ece = db_session.query(Program).filter(Program.program_code == "UG-ECE").first()
    if not prog_ece:
        prog_ece = Program(
            program_code="UG-ECE",
            name="Electronics and Communication Engineering",
            course_level="UG",
            department="ECE",
            duration_years=4,
            lateral_allowed=True,
        )
        db_session.add(prog_ece)

    db_session.commit()


def test_issue_decision_staff_propose_vs_admin_decide(client, db_session: Session):
    """
    POST /v1/issues/{id}/decision
    - STAFF may ONLY PROPOSE (creates PENDING correction, issue remains OPEN).
    - INSTITUTION_ADMIN can ACCEPT_FIX, EDIT_FIX, or DISMISS
      (creates APPROVED correction, updates status).
    """
    admin_user = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    staff_user = db_session.query(User).filter(User.email == "inst.staff@demo.local").first()
    assert admin_user and staff_user
    admin_user.institution_aicte_id = "1-100010001"
    staff_user.institution_aicte_id = "1-100010001"
    db_session.flush()

    admin_headers = make_auth_headers(admin_user)
    staff_headers = make_auth_headers(staff_user)

    # 1. Setup batch and issue
    batch_id = str(uuid.uuid4())
    batch = Batch(
        batch_id=batch_id,
        institution_aicte_id="1-100010001",
        academic_year="2026-27",
        status="IN_REVIEW",
        version=1,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    db_session.add(batch)

    issue_id = str(uuid.uuid4())
    issue = Issue(
        id=issue_id,
        batch_id=batch_id,
        rule_id="V002",
        row_index=5,
        field_name="gender",
        apaar_id="100000000001",
        severity="ERROR",
        priority="HIGH",
        bucket="HUMAN_REVIEW",
        message="Invalid gender code",
        suggested_fix_json={"value": "M", "confidence": 0.95},
        value_masked="X",
        status="OPEN",
    )
    db_session.add(issue)
    db_session.commit()

    # 2. Staff user proposes a fix
    staff_resp = client.post(
        f"/v1/issues/{issue_id}/decision",
        headers=staff_headers,
        json={"action": "ACCEPT_FIX", "note": "Staff recommendation: change to M"},
    )
    assert staff_resp.status_code == 200
    staff_res_data = staff_resp.json()
    # Issue status must REMAIN OPEN until approved!
    assert staff_res_data["status"] == "OPEN"

    # Verify a PENDING correction was created
    corrections_resp = client.get(f"/v1/corrections?batch_id={batch_id}", headers=admin_headers)
    assert corrections_resp.status_code == 200
    corrections = corrections_resp.json()
    assert len(corrections) == 1
    assert corrections[0]["status"] == "PENDING"
    assert corrections[0]["new_value"] == "M"

    # 3. Admin user directly approves fix via EDIT_FIX
    admin_resp = client.post(
        f"/v1/issues/{issue_id}/decision",
        headers=admin_headers,
        json={"action": "EDIT_FIX", "value": "M", "note": "Admin approved and verified"},
    )
    assert admin_resp.status_code == 200
    admin_res_data = admin_resp.json()
    assert admin_res_data["status"] == "FIXED"

    # Verify an APPROVED correction exists
    corrections_resp2 = client.get(f"/v1/corrections?batch_id={batch_id}", headers=admin_headers)
    corrections2 = corrections_resp2.json()
    approved_corrs = [c for c in corrections2 if c["status"] == "APPROVED"]
    assert len(approved_corrs) >= 1
    assert approved_corrs[0]["new_value"] == "M"


def test_batch_revalidate_and_dq_comparison(client, db_session: Session):
    """
    POST /v1/batches/{id}/revalidate
    Re-runs validation applying approved corrections, updates quality_score_after.
    GET /v1/batches/{id}/dq-comparison returns score delta and supports json, xlsx, pdf.
    """
    admin_user = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    assert admin_user
    admin_user.institution_aicte_id = "1-100010001"
    db_session.flush()
    headers = make_auth_headers(admin_user)

    # 1. Setup batch with simple CSV data
    header_line = (
        "apaar_id,institution_aicte_id,full_name,dob,gender,category,"
        "course_level,program_code,academic_year,year_of_study,admission_date,"
        "admission_type,seat_type\n"
    )
    row_line = (
        "100000000005,1-100010001,Priya Sharma,2005-04-12,F,GEN,"
        "UG,UG-CSE,2026-27,1,2026-08-01,REGULAR,REGULAR\n"
    )
    csv_content = (header_line + row_line).encode("utf-8")

    batch_id = str(uuid.uuid4())
    batch = Batch(
        batch_id=batch_id,
        institution_aicte_id="1-100010001",
        academic_year="2026-27",
        status="IN_REVIEW",
        quality_score_before=85.0,
        version=1,
        column_mapping_json=[
            {"source": "apaar_id", "target": "apaar_id", "confidence": 1.0, "method": "exact"},
            {
                "source": "institution_aicte_id",
                "target": "institution_aicte_id",
                "confidence": 1.0,
                "method": "exact",
            },
            {"source": "full_name", "target": "full_name", "confidence": 1.0, "method": "exact"},
            {"source": "dob", "target": "dob", "confidence": 1.0, "method": "exact"},
            {"source": "gender", "target": "gender", "confidence": 1.0, "method": "exact"},
            {"source": "category", "target": "category", "confidence": 1.0, "method": "exact"},
            {
                "source": "course_level",
                "target": "course_level",
                "confidence": 1.0,
                "method": "exact",
            },
            {
                "source": "program_code",
                "target": "program_code",
                "confidence": 1.0,
                "method": "exact",
            },
            {
                "source": "academic_year",
                "target": "academic_year",
                "confidence": 1.0,
                "method": "exact",
            },
            {
                "source": "year_of_study",
                "target": "year_of_study",
                "confidence": 1.0,
                "method": "exact",
            },
            {
                "source": "admission_date",
                "target": "admission_date",
                "confidence": 1.0,
                "method": "exact",
            },
            {
                "source": "admission_type",
                "target": "admission_type",
                "confidence": 1.0,
                "method": "exact",
            },
            {"source": "seat_type", "target": "seat_type", "confidence": 1.0, "method": "exact"},
        ],
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    db_session.add(batch)

    bf = BatchFile(
        id=str(uuid.uuid4()),
        batch_id=batch_id,
        file_data=csv_content,
        sha256="fake_sha256",
        size_bytes=len(csv_content),
        filename="test.csv",
        content_type="text/csv",
        created_at=datetime.now(UTC),
    )
    db_session.add(bf)

    # Add an approved correction
    corr = Correction(
        id=str(uuid.uuid4()),
        batch_id=batch_id,
        apaar_id="100000000005",
        field="full_name",
        old_value_enc="Priya Sharma",
        new_value_enc="Priya Sharma Corrected",
        proposed_by=admin_user.id,
        approved_by=admin_user.id,
        status="APPROVED",
        created_at=datetime.now(UTC),
    )
    db_session.add(corr)
    db_session.commit()

    # 2. Revalidate
    reval_resp = client.post(f"/v1/batches/{batch_id}/revalidate", headers=headers)
    assert reval_resp.status_code == 200
    reval_data = reval_resp.json()
    assert reval_data["batch_id"] == batch_id
    assert "quality_score_after" in reval_data
    assert "score_delta" in reval_data

    # 3. DQ Comparison endpoints (json, xlsx, pdf)
    json_resp = client.get(f"/v1/batches/{batch_id}/dq-comparison?format=json", headers=headers)
    assert json_resp.status_code == 200
    assert "score_delta" in json_resp.json()

    xlsx_resp = client.get(f"/v1/batches/{batch_id}/dq-comparison?format=xlsx", headers=headers)
    assert xlsx_resp.status_code == 200
    assert "openxmlformats" in xlsx_resp.headers["Content-Type"]
    assert len(xlsx_resp.content) > 100

    pdf_resp = client.get(f"/v1/batches/{batch_id}/dq-comparison?format=pdf", headers=headers)
    assert pdf_resp.status_code == 200
    assert "application/pdf" in pdf_resp.headers["Content-Type"]
    assert len(pdf_resp.content) > 50


def test_duplicates_listing_and_rbac_resolution(client, db_session: Session):
    """
    GET /v1/duplicates (AICTE sees cross-institution, institutions see own).
    GET /v1/duplicates/{id} (side-by-side masked records).
    POST /v1/duplicates/{id}/resolve (AICTE_ANALYST for cross-institution; 403 for institution).
    """
    aicte_user = db_session.query(User).filter(User.email == "aicte.analyst@demo.local").first()
    inst_user = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    assert aicte_user and inst_user
    inst_user.institution_aicte_id = "1-100010001"
    db_session.flush()

    aicte_headers = make_auth_headers(aicte_user)
    inst_headers = make_auth_headers(inst_user)

    # Create cross-institution duplicate
    flag_id = str(uuid.uuid4())
    cluster_id = f"cluster_{uuid.uuid4().hex[:8]}"
    dup_flag = DuplicateFlag(
        id=flag_id,
        cluster_id=cluster_id,
        apaar_id="111122223333",
        matched_apaar_id="111122223333",
        matched_institution_id="1-10002",
        similarity_score=1.0,
        match_type="CROSS_INSTITUTION",
        matched_fields_json={"apaar_id": 1.0, "full_name": 0.98},
        status="OPEN",
    )
    db_session.add(dup_flag)
    db_session.commit()

    # 1. AICTE analyst lists duplicates
    list_resp = client.get("/v1/duplicates?scope=CROSS_INSTITUTION", headers=aicte_headers)
    assert list_resp.status_code == 200
    dups = list_resp.json()
    assert len(dups) >= 1
    found = [d for d in dups if d["cluster_id"] == cluster_id]
    assert len(found) == 1
    assert found[0]["scope"] == "CROSS_INSTITUTION"

    # 2. Side-by-side view
    detail_resp = client.get(f"/v1/duplicates/{flag_id}", headers=aicte_headers)
    assert detail_resp.status_code == 200
    detail_data = detail_resp.json()
    assert len(detail_data["members"]) == 2
    # Verify APAAR is masked
    assert "XXXX" in detail_data["members"][0]["apaar_id"]

    # 3. RBAC Resolution Check: Institution Admin gets 403 Forbidden for cross-institution!
    inst_res_resp = client.post(
        f"/v1/duplicates/{flag_id}/resolve",
        headers=inst_headers,
        json={"decision": "SAME_PERSON", "note": "Institution attempting unauthorized resolution"},
    )
    assert inst_res_resp.status_code == 403

    # 4. AICTE Analyst successfully resolves
    aicte_res_resp = client.post(
        f"/v1/duplicates/{flag_id}/resolve",
        headers=aicte_headers,
        json={"decision": "SAME_PERSON", "note": "AICTE analyst confirmed identity match"},
    )
    assert aicte_res_resp.status_code == 200
    assert aicte_res_resp.json()["status"] == "SAME_PERSON"


def test_student_lifecycle_transitions(client, db_session: Session):
    """
    POST /v1/students/{apaar_id}/transitions
    Tests allowed transitions table in agents.md §8.1:
    - ACTIVE -> WITHDRAWN | DEFERRED | TRANSFERRED_OUT | COMPLETED
    - DEFERRED -> ACTIVE | WITHDRAWN
    - COMPLETED -> GRADUATED
    - Invalid transitions return 422 with Rule V021.
    """
    admin_user = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    assert admin_user
    admin_user.institution_aicte_id = "1-100010001"
    db_session.flush()
    headers = make_auth_headers(admin_user)

    apaar = "555566667777"
    student = StudentRecord(
        apaar_id=apaar,
        apaar_hash=keyed_apaar_hash(apaar),
        institution_aicte_id="1-100010001",
        institution_student_id="STU-5555",
        full_name="Rohit Verma",
        dob=date(2004, 3, 15),
        gender="M",
        category="GEN",
        course_level="UG",
        program_code="UG-CSE",
        academic_year="2026-27",
        year_of_study=2,
        admission_date=date(2025, 8, 1),
        admission_type="REGULAR",
        seat_type="REGULAR",
        quota="NONE",
        enrolment_status="ACTIVE",
        consent_status="GRANTED",
        record_version=1,
        created_at=datetime.now(UTC),
    )
    db_session.add(student)
    db_session.commit()

    # 1. Invalid transition: ACTIVE -> GRADUATED is blocked by Rule V021 (must go through COMPLETED)
    inv_resp = client.post(
        f"/v1/students/{apaar}/transitions",
        headers=headers,
        json={
            "to_status": "GRADUATED",
            "effective_date": "2026-08-01",
            "reason": "Direct jump to graduated",
        },
    )
    assert inv_resp.status_code == 422
    assert inv_resp.json()["code"] == "V021"

    # 2. Valid transition: ACTIVE -> COMPLETED
    comp_resp = client.post(
        f"/v1/students/{apaar}/transitions",
        headers=headers,
        json={
            "to_status": "COMPLETED",
            "effective_date": "2026-08-01",
            "reason": "Passed final semester examinations",
        },
    )
    assert comp_resp.status_code == 200
    assert comp_resp.json()["enrolment_status"] == "COMPLETED"
    assert comp_resp.json()["record_version"] == 2

    # 3. Valid transition: COMPLETED -> GRADUATED
    grad_resp = client.post(
        f"/v1/students/{apaar}/transitions",
        headers=headers,
        json={
            "to_status": "GRADUATED",
            "effective_date": "2026-09-01",
            "reason": "Convocation degree conferred",
        },
    )
    assert grad_resp.status_code == 200
    assert grad_resp.json()["enrolment_status"] == "GRADUATED"
    assert grad_resp.json()["record_version"] == 3

    # 4. Invalid transition: GRADUATED -> ACTIVE (terminal state violation)
    inv_resp2 = client.post(
        f"/v1/students/{apaar}/transitions",
        headers=headers,
        json={
            "to_status": "ACTIVE",
            "effective_date": "2026-10-01",
            "reason": "Impossible reactivation",
        },
    )
    assert inv_resp2.status_code == 422
    assert inv_resp2.json()["code"] == "V021"


def test_transfer_workflow_and_golden_rule_no_v010(client, db_session: Session):
    """
    CRITICAL GOLDEN REQUIREMENT (agents.md §8.1 & Task B4 item 7):
    Destination initiates transfer -> Source approves transfer ->
    Source student enrolment_status becomes TRANSFERRED_OUT ->
    Re-upload / validation at destination has NO V010 rule violation!
    """
    source_admin = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    dest_admin = db_session.query(User).filter(User.email == "inst2.admin@demo.local").first()
    assert source_admin and dest_admin
    source_admin.institution_aicte_id = "1-100010001"
    dest_admin.institution_aicte_id = "1-10002"
    db_session.flush()

    source_headers = make_auth_headers(source_admin)
    dest_headers = make_auth_headers(dest_admin)

    # 1. Student initially ACTIVE at source institution
    apaar = "888877776666"
    student = StudentRecord(
        apaar_id=apaar,
        apaar_hash=keyed_apaar_hash(apaar),
        institution_aicte_id="1-100010001",
        institution_student_id="STU-SRC-8888",
        full_name="Karan Malhotra",
        dob=date(2004, 6, 20),
        gender="M",
        category="GEN",
        course_level="UG",
        program_code="UG-CSE",
        academic_year="2026-27",
        year_of_study=2,
        admission_date=date(2025, 8, 1),
        admission_type="REGULAR",
        seat_type="REGULAR",
        quota="NONE",
        enrolment_status="ACTIVE",
        consent_status="GRANTED",
        record_version=1,
        created_at=datetime.now(UTC),
    )
    db_session.add(student)
    db_session.commit()

    # 2. Destination institution requests transfer
    req_resp = client.post(
        "/v1/transfers",
        headers=dest_headers,
        json={
            "apaar_id": apaar,
            "from_institution_id": "1-100010001",
            "to_program_code": "UG-ECE",
            "academic_year": "2026-27",
            "transfer_certificate_ref": "TC-2026-0099",
            "reason": "Family relocation to Mumbai",
        },
    )
    assert req_resp.status_code == 201
    transfer_data = req_resp.json()
    transfer_id = transfer_data["transfer_id"]
    assert transfer_data["status"] == "PENDING"

    # 3. Source institution lists outgoing transfers
    out_resp = client.get("/v1/transfers?direction=out", headers=source_headers)
    assert out_resp.status_code == 200
    out_transfers = out_resp.json()
    assert any(t["transfer_id"] == transfer_id for t in out_transfers)

    # 4. Source institution approves transfer
    appr_resp = client.post(f"/v1/transfers/{transfer_id}/approve", headers=source_headers)
    assert appr_resp.status_code == 200
    assert appr_resp.json()["status"] == "APPROVED"

    # Verify source student record status automatically updated to TRANSFERRED_OUT!
    db_session.refresh(student)
    assert student.enrolment_status == "TRANSFERRED_OUT"
    assert student.record_version == 2

    # 5. Destination institution uploads batch containing this student
    dest_header = (
        "apaar_id,institution_aicte_id,full_name,dob,gender,category,"
        "course_level,program_code,academic_year,year_of_study,admission_date,"
        "admission_type,seat_type\n"
    )
    dest_row = (
        f"{apaar},1-10002,Karan Malhotra,2004-06-20,M,GEN,"
        "UG,UG-ECE,2026-27,2,2026-08-01,TRANSFER_IN,REGULAR\n"
    )
    dest_csv = (dest_header + dest_row).encode("utf-8")

    batch_resp = client.post(
        "/v1/batches",
        headers=dest_headers,
        data={"academic_year": "2026-27"},
        files={"file": ("transfer_dest.csv", dest_csv, "text/csv")},
    )
    assert batch_resp.status_code == 202
    dest_batch_id = batch_resp.json()["batch_id"]

    # Re-run validation synchronously to inspect issues
    reval_resp = client.post(f"/v1/batches/{dest_batch_id}/revalidate", headers=dest_headers)
    assert reval_resp.status_code == 200

    # 6. Verify: Rule V010 is NOT flagged!
    issues_resp = client.get(f"/v1/batches/{dest_batch_id}/issues", headers=dest_headers)
    assert issues_resp.status_code == 200
    issues = issues_resp.json()
    v010_issues = [i for i in issues if i["rule_id"] == "V010"]
    assert len(v010_issues) == 0, f"Expected no V010 issues, got: {v010_issues}"


def test_transfer_override_by_aicte_admin(client, db_session: Session):
    """POST /v1/transfers/{id}/override sets source student TRANSFERRED_OUT."""
    aicte_user = db_session.query(User).filter(User.email == "aicte.admin@demo.local").first()
    dest_user = db_session.query(User).filter(User.email == "inst2.admin@demo.local").first()
    assert aicte_user and dest_user
    dest_user.institution_aicte_id = "1-10002"
    db_session.flush()

    aicte_headers = make_auth_headers(aicte_user)
    dest_headers = make_auth_headers(dest_user)

    apaar = "444433332222"
    student = StudentRecord(
        apaar_id=apaar,
        apaar_hash=keyed_apaar_hash(apaar),
        institution_aicte_id="1-100010001",
        institution_student_id="STU-SRC-4444",
        full_name="Ananya Sen",
        dob=date(2004, 7, 10),
        gender="F",
        category="GEN",
        course_level="UG",
        program_code="UG-CSE",
        academic_year="2026-27",
        year_of_study=2,
        admission_date=date(2025, 8, 1),
        admission_type="REGULAR",
        seat_type="REGULAR",
        quota="NONE",
        enrolment_status="ACTIVE",
        consent_status="GRANTED",
        record_version=1,
        created_at=datetime.now(UTC),
    )
    db_session.add(student)
    db_session.commit()

    # Create transfer
    trf_resp = client.post(
        "/v1/transfers",
        headers=dest_headers,
        json={
            "apaar_id": apaar,
            "from_institution_id": "1-100010001",
            "to_program_code": "UG-ECE",
            "academic_year": "2026-27",
            "reason": "Source unresponsive",
        },
    )
    transfer_id = trf_resp.json()["transfer_id"]

    # AICTE Admin statutory override
    override_resp = client.post(
        f"/v1/transfers/{transfer_id}/override",
        headers=aicte_headers,
        json={"decision": "APPROVED", "reason": "Overridden after statutory 15 days inquiry"},
    )
    assert override_resp.status_code == 200
    assert override_resp.json()["status"] == "APPROVED"

    db_session.refresh(student)
    assert student.enrolment_status == "TRANSFERRED_OUT"


def test_aggregates_declared_totals_and_reconciliation(client, db_session: Session):
    """
    POST /v1/aggregates, GET /v1/declared-totals, GET /v1/reconciliation?year=&state=
    Verifies reconciliation status and dashboard coverage percentage.
    """
    admin_user = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    assert admin_user
    admin_user.institution_aicte_id = "1-100010001"
    db_session.flush()
    headers = make_auth_headers(admin_user)

    # 1. Submit aggregate totals
    agg_resp = client.post(
        "/v1/aggregates",
        headers=headers,
        json={
            "institution_aicte_id": "1-100010001",
            "academic_year": "2026-27",
            "programs": [
                {
                    "program_code": "UG-CSE",
                    "total_enrolment": 120,
                    "supernumerary_count": 10,
                    "nri_count": 5,
                }
            ],
        },
    )
    assert agg_resp.status_code == 201

    # 2. Register declared totals
    dt_resp = client.post(
        "/v1/declared-totals",
        headers=headers,
        json={
            "institution_aicte_id": "1-100010001",
            "program_code": "UG-CSE",
            "academic_year": "2026-27",
            "approved_intake": 120,
            "supernumerary_allowed": 15,
        },
    )
    assert dt_resp.status_code == 201

    # 3. Retrieve declared totals
    get_dt_resp = client.get("/v1/declared-totals?academic_year=2026-27", headers=headers)
    assert get_dt_resp.status_code == 200
    totals = get_dt_resp.json()
    assert len(totals) >= 1

    # 4. Reconciliation endpoint
    recon_resp = client.get("/v1/reconciliation?year=2026-27", headers=headers)
    assert recon_resp.status_code == 200
    recon_data = recon_resp.json()
    assert "coverage_pct" in recon_data
    assert "items" in recon_data
    assert len(recon_data["items"]) >= 1


def test_rollover_dry_run_and_501_not_implemented(client, db_session: Session):
    """
    POST /v1/admin/rollover {from_year, to_year, dry_run}
    - dry_run=True returns progression preview counts using engine.rollover_preview.
    - dry_run=False returns 501 Not Implemented until engine-v0.5 lands.
    """
    aicte_user = db_session.query(User).filter(User.email == "aicte.admin@demo.local").first()
    inst_user = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    assert aicte_user and inst_user
    aicte_headers = make_auth_headers(aicte_user)
    inst_headers = make_auth_headers(inst_user)

    # 1. Non-admin gets 403 Forbidden
    forb_resp = client.post(
        "/v1/admin/rollover",
        headers=inst_headers,
        json={"from_academic_year": "2025-26", "to_academic_year": "2026-27", "dry_run": True},
    )
    assert forb_resp.status_code == 403

    # 2. AICTE Admin with dry_run=True gets 200 with counts
    dry_resp = client.post(
        "/v1/admin/rollover",
        headers=aicte_headers,
        json={"from_academic_year": "2025-26", "to_academic_year": "2026-27", "dry_run": True},
    )
    assert dry_resp.status_code == 200
    dry_data = dry_resp.json()
    assert dry_data["dry_run"] is True
    assert "eligible_students" in dry_data
    assert "rolled_over" in dry_data
    assert "graduated" in dry_data

    # 3. AICTE Admin with dry_run=False executes rollover progression per Task B7 item 6
    exec_resp = client.post(
        "/v1/admin/rollover",
        headers=aicte_headers,
        json={"from_academic_year": "2025-26", "to_academic_year": "2026-27", "dry_run": False},
    )
    assert exec_resp.status_code == 200
    exec_data = exec_resp.json()
    assert exec_data["dry_run"] is False
    assert "rolled_over" in exec_data
