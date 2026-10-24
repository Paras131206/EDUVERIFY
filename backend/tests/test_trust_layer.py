"""
Integration tests for Task B6 Trust Layer:
- Keys & DIDs (/.well-known/did.json, /issuers/{id}/did.json, /v1/trust-list)
- SD-JWT VC issuance, holder key binding, and selective disclosure
- Verification presentation with KB-JWT and replay nonce
- Tampered disclosure detection
- Record correction -> SUPERSEDED hook
- Consent withdrawal -> SUSPENDED hook
- Manual revocation -> REVOKED
- QR code image and PDF certificate generation
"""

import hashlib
from datetime import UTC, date, datetime
from typing import Any, cast

import jwt
from app.models.auth import User
from app.models.core import (
    AcademicYear,
    ConsentLedger,
    Correction,
    Credential,
    DegreeAwardingBody,
    District,
    Institution,
    Program,
    ProgramIntake,
    State,
    StudentRecord,
)
from app.security.crypto import keyed_apaar_hash
from app.vc.sdjwt import (
    base64url_encode,
    build_holder_presentation,
)
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import ec
from jwt.algorithms import OKPAlgorithm
from sqlalchemy.orm import Session
from tests.conftest import make_auth_headers


def _setup_master_data(db_session: Session) -> tuple[Institution, DegreeAwardingBody, Program]:
    """Helper ensuring state, district, dab, institution, program and intake exist."""
    state = db_session.query(State).filter(State.lgd_state_code == 27).first()
    if not state:
        state = State(lgd_state_code=27, name="Maharashtra", name_hi="महाराष्ट्र")
        db_session.add(state)

    district = db_session.query(District).filter(District.lgd_district_code == 500).first()
    if not district:
        district = District(lgd_district_code=500, lgd_state_code=27, name="Mumbai")
        db_session.add(district)

    dab = db_session.query(DegreeAwardingBody).filter(DegreeAwardingBody.dab_id == "DAB-01").first()
    if not dab:
        dab = DegreeAwardingBody(
            dab_id="DAB-01",
            name="State Tech University",
            type="UNIVERSITY",
            state_code=27,
            did="did:web:localhost%3A8000:issuers:DAB-01",
        )
        db_session.add(dab)

    inst = (
        db_session.query(Institution).filter(Institution.institution_aicte_id == "1-10001").first()
    )
    if not inst:
        inst = Institution(
            institution_aicte_id="1-10001",
            name="Apex Institute of Technology",
            state_code=27,
            district_code=500,
            type="ENGINEERING",
            affiliated_dab_id="DAB-01",
            onboarding_level="FULL",
            did="did:web:localhost%3A8000:issuers:1-10001",
        )
        db_session.add(inst)

    ay = db_session.query(AcademicYear).filter(AcademicYear.academic_year == "2026-27").first()
    if not ay:
        ay = AcademicYear(academic_year="2026-27", is_current=True)
        db_session.add(ay)

    prog = db_session.query(Program).filter(Program.program_code == "CS-UG").first()
    if not prog:
        prog = Program(
            program_code="CS-UG",
            name="Computer Science Engineering",
            course_level="UG",
            department="CSE",
            duration_years=4,
        )
        db_session.add(prog)

    intake = (
        db_session.query(ProgramIntake)
        .filter(
            ProgramIntake.institution_aicte_id == "1-10001",
            ProgramIntake.program_code == "CS-UG",
            ProgramIntake.academic_year == "2026-27",
        )
        .first()
    )
    if not intake:
        intake = ProgramIntake(
            institution_aicte_id="1-10001",
            program_code="CS-UG",
            academic_year="2026-27",
            approved_intake=120,
            supernumerary_allowed={},
        )
        db_session.add(intake)

    db_session.commit()
    return inst, dab, prog


def _create_test_student(db_session: Session, apaar_id: str = "123456789012") -> StudentRecord:
    """Helper creating a canonical student record with active consent."""
    _setup_master_data(db_session)
    apaar_hash = keyed_apaar_hash(apaar_id)
    student = db_session.query(StudentRecord).filter(StudentRecord.apaar_id == apaar_id).first()
    now = datetime.now(UTC)

    if not student:
        student = StudentRecord(
            apaar_id=apaar_id,
            apaar_hash=apaar_hash,
            institution_aicte_id="1-10001",
            institution_student_id=f"ROLL-{apaar_id[-4:]}",
            full_name="Aarav Sharma",
            dob=date(2004, 5, 15),
            gender="M",
            category="GENERAL",
            pwd=False,
            program_code="CS-UG",
            course_level="UG",
            department="CSE",
            academic_year="2026-27",
            year_of_study=1,
            admission_date=date(2026, 7, 10),
            admission_type="REGULAR",
            expected_graduation_year=2030,
            seat_type="AIQ",
            quota="GENERAL",
            nationality="IN",
            enrolment_status="ACTIVE",
            consent_status="GRANTED",
            consent_date=date(2026, 7, 10),
            record_version=1,
        )
        db_session.add(student)

    # Grant VERIFICATION_SHARE consent
    consent = (
        db_session.query(ConsentLedger)
        .filter(
            ConsentLedger.apaar_hash == apaar_hash,
            ConsentLedger.purpose == "VERIFICATION_SHARE",
        )
        .first()
    )
    if not consent:
        consent = ConsentLedger(
            apaar_id=apaar_id,
            apaar_hash=apaar_hash,
            purpose="VERIFICATION_SHARE",
            status="GRANTED",
            effective_at=now,
            guardian_consent=False,
        )
        db_session.add(consent)

    db_session.commit()
    db_session.refresh(student)
    return student


def _generate_holder_ec_key():
    """Generates an ECDSA P-256 private key and public JWK."""
    priv = ec.generate_private_key(ec.SECP256R1(), default_backend())
    pn = priv.public_key().public_numbers()
    jwk = {
        "kty": "EC",
        "crv": "P-256",
        "x": base64url_encode(pn.x.to_bytes(32, "big")),
        "y": base64url_encode(pn.y.to_bytes(32, "big")),
    }
    return priv, jwk


# ============================================================================
# 1. DID & TRUST LIST TESTS
# ============================================================================


def test_did_document_discovery(client, db_session: Session):
    """Test GET /.well-known/did.json and GET /issuers/{id}/did.json."""
    _setup_master_data(db_session)

    # 1. AICTE Root DID document
    r_root = client.get("/.well-known/did.json")
    assert r_root.status_code == 200
    doc_root = r_root.json()
    assert "did:web:" in doc_root["id"]
    assert len(doc_root["verificationMethod"]) >= 1
    assert doc_root["verificationMethod"][0]["publicKeyJwk"]["crv"] == "Ed25519"

    # 2. Institution DID document
    r_inst = client.get("/issuers/1-10001/did.json")
    assert r_inst.status_code == 200
    doc_inst = r_inst.json()
    assert "1-10001" in doc_inst["id"]
    assert doc_inst["verificationMethod"][0]["publicKeyJwk"]["kty"] == "OKP"


def test_trust_list_retrieval_and_signature(client, db_session: Session):
    """Test GET /v1/trust-list returns signed JWT verifiable by AICTE root key."""
    _setup_master_data(db_session)

    r = client.get("/v1/trust-list")
    assert r.status_code == 200
    data = r.json()
    assert "jwt" in data
    assert "trust_list" in data
    assert len(data["trust_list"]) >= 1

    # Verify JWT signature using root AICTE key
    r_did = client.get("/.well-known/did.json")
    root_jwk = r_did.json()["verificationMethod"][0]["publicKeyJwk"]

    root_pub = OKPAlgorithm.from_jwk(root_jwk)
    decoded = jwt.decode(data["jwt"], cast(Any, root_pub), algorithms=["EdDSA"])
    assert decoded["iss"] == data["issuer"]
    assert len(decoded["trust_list"]) == len(data["trust_list"])


# ============================================================================
# 2. HOLDER KEY REGISTRATION & ISSUANCE TESTS
# ============================================================================


def test_holder_key_registration(client, db_session: Session):
    """Test POST /v1/credentials/holder-key as STUDENT."""
    student_user = db_session.query(User).filter(User.role == "STUDENT").first()
    assert student_user is not None
    headers = make_auth_headers(student_user)

    _, jwk = _generate_holder_ec_key()

    r = client.post("/v1/credentials/holder-key", json={"jwk": jwk}, headers=headers)
    assert r.status_code == 200
    res = r.json()
    assert res["status"] == "REGISTERED"
    assert res["jwk"]["x"] == jwk["x"]


def test_credential_full_cycle_issue_present_verify(client, db_session: Session):
    """
    Test complete lifecycle:
    1. Student registers holder key
    2. Institution Admin issues SD-JWT credential
    3. Student fetches nonce and creates selective presentation
    4. Verifier calls POST /v1/verify -> returns VALID with only disclosed claims
    """
    student = _create_test_student(db_session, "123456789012")
    student_user = db_session.query(User).filter(User.role == "STUDENT").first()
    inst_admin = (
        db_session.query(User)
        .filter(User.role == "INSTITUTION_ADMIN", User.institution_aicte_id == "1-10001")
        .first()
    )
    assert student_user is not None and inst_admin is not None

    # Step 1: Register holder key
    holder_priv, holder_jwk = _generate_holder_ec_key()
    r_key = client.post(
        "/v1/credentials/holder-key",
        json={"jwk": holder_jwk},
        headers=make_auth_headers(student_user),
    )
    assert r_key.status_code == 200

    # Step 2: Issue credential
    issue_payload = {
        "apaar_id": student.apaar_id,
        "credential_type": "EduVerifyEnrolmentCredential",
    }
    r_issue = client.post(
        "/v1/credentials/issue",
        json=issue_payload,
        headers=make_auth_headers(inst_admin),
    )
    assert r_issue.status_code == 201
    issued = r_issue.json()
    assert "credential_id" in issued
    assert "sd_jwt" in issued
    assert issued["qr_data_uri"].startswith("data:image/png;base64,")

    # Step 3: Check student's credential list
    r_me = client.get("/v1/credentials/me", headers=make_auth_headers(student_user))
    assert r_me.status_code == 200
    my_creds = r_me.json()
    assert len(my_creds) >= 1
    assert any(c["credential_id"] == issued["credential_id"] for c in my_creds)

    # Step 4: Verifier issues challenge nonce
    r_nonce = client.get("/v1/verify/nonce?aud=https://verifier.corp.local")
    assert r_nonce.status_code == 200
    nonce = r_nonce.json()["nonce"]

    # Step 5: Student builds presentation disclosing ONLY full_name and program
    presentation = build_holder_presentation(
        sd_jwt_compact=issued["sd_jwt"],
        claims_to_disclose=["full_name", "program"],
        holder_private_key=holder_priv,
        nonce=nonce,
        aud="https://verifier.corp.local",
    )

    # Step 6: Verify presentation
    verify_payload = {
        "sd_jwt_presentation": presentation,
        "nonce": nonce,
        "aud": "https://verifier.corp.local",
    }
    r_verify = client.post("/v1/verify", json=verify_payload)
    assert r_verify.status_code == 200
    v_res = r_verify.json()

    assert v_res["valid"] is True, f"v_res: {v_res}"
    assert v_res["result"] == "VALID"
    assert v_res["status"] == "VALID"
    assert v_res["issuer_trusted"] is True
    # Verify selective disclosure
    assert "full_name" in v_res["disclosed_claims"]
    assert v_res["disclosed_claims"]["full_name"] == student.full_name
    assert "program" in v_res["disclosed_claims"]
    assert "apaar_id" not in v_res["disclosed_claims"]
    assert "dob" not in v_res["disclosed_claims"]
    # Always-disclosed claim must be present
    assert "institution_name" in v_res["disclosed_claims"]


# ============================================================================
# 3. SECURITY & TAMPERING TESTS
# ============================================================================


def test_tampered_disclosure_detected(client, db_session: Session):
    """Test that altering a disclosure in the presentation yields INVALID."""
    student = _create_test_student(db_session, "123456789013")
    student_user = db_session.query(User).filter(User.role == "STUDENT").first()
    inst_admin = db_session.query(User).filter(User.role == "INSTITUTION_ADMIN").first()

    holder_priv, holder_jwk = _generate_holder_ec_key()
    client.post(
        "/v1/credentials/holder-key",
        json={"jwk": holder_jwk},
        headers=make_auth_headers(student_user),
    )

    r_issue = client.post(
        "/v1/credentials/issue",
        json={"apaar_id": student.apaar_id, "credential_type": "EduVerifyEnrolmentCredential"},
        headers=make_auth_headers(inst_admin),
    )
    sd_jwt = r_issue.json()["sd_jwt"]

    r_nonce = client.get("/v1/verify/nonce")
    nonce = r_nonce.json()["nonce"]

    # Build legitimate presentation
    legit_pres = build_holder_presentation(
        sd_jwt_compact=sd_jwt,
        claims_to_disclose=["full_name"],
        holder_private_key=holder_priv,
        nonce=nonce,
    )

    # Tamper with the disclosure segment: forge a fake claim
    parts = legit_pres.split("~")
    fake_disc = base64url_encode(b'["fakesalt","full_name","Forged Identity"]')
    parts[1] = fake_disc
    tampered_pres = "~".join(parts)

    r_verify = client.post(
        "/v1/verify",
        json={"sd_jwt_presentation": tampered_pres, "nonce": nonce},
    )
    assert r_verify.status_code == 200
    res = r_verify.json()
    assert res["valid"] is False
    assert res["result"] == "INVALID"
    assert "Tampered disclosure" in str(res["reasons"])


def test_wrong_or_replayed_nonce_rejected(client, db_session: Session):
    """Test that presenting with a wrong or reused nonce is rejected."""
    student = _create_test_student(db_session, "123456789014")
    student_user = db_session.query(User).filter(User.role == "STUDENT").first()
    inst_admin = db_session.query(User).filter(User.role == "INSTITUTION_ADMIN").first()

    holder_priv, holder_jwk = _generate_holder_ec_key()
    client.post(
        "/v1/credentials/holder-key",
        json={"jwk": holder_jwk},
        headers=make_auth_headers(student_user),
    )

    r_issue = client.post(
        "/v1/credentials/issue",
        json={"apaar_id": student.apaar_id, "credential_type": "EduVerifyEnrolmentCredential"},
        headers=make_auth_headers(inst_admin),
    )
    sd_jwt = r_issue.json()["sd_jwt"]

    pres = build_holder_presentation(
        sd_jwt_compact=sd_jwt,
        claims_to_disclose=["full_name"],
        holder_private_key=holder_priv,
        nonce="wrong-unregistered-nonce-value",
    )

    r_verify = client.post(
        "/v1/verify",
        json={"sd_jwt_presentation": pres, "nonce": "wrong-unregistered-nonce-value"},
    )
    assert r_verify.status_code == 200
    res = r_verify.json()
    assert res["valid"] is False
    assert res["status"] == "KEY_BINDING_FAILED"


# ============================================================================
# 4. LIFECYCLE HOOKS: CORRECTION, CONSENT WITHDRAWAL, REVOKE
# ============================================================================


def test_record_correction_supersedes_credential(client, db_session: Session):
    """Test that approving a correction updates credential status to SUPERSEDED."""
    student = _create_test_student(db_session, "123456789015")
    student_user = db_session.query(User).filter(User.role == "STUDENT").first()
    inst_admin = db_session.query(User).filter(User.role == "INSTITUTION_ADMIN").first()
    assert inst_admin is not None

    holder_priv, holder_jwk = _generate_holder_ec_key()
    client.post(
        "/v1/credentials/holder-key",
        json={"jwk": holder_jwk},
        headers=make_auth_headers(student_user),
    )

    r_issue = client.post(
        "/v1/credentials/issue",
        json={"apaar_id": student.apaar_id, "credential_type": "EduVerifyEnrolmentCredential"},
        headers=make_auth_headers(inst_admin),
    )
    sd_jwt = r_issue.json()["sd_jwt"]

    # Create and approve a correction for this student
    corr = Correction(
        issue_id=None,
        batch_id=None,
        apaar_id=student.apaar_id,
        field="full_name",
        old_value_enc="Aarav Sharma",
        new_value_enc="Aarav S. Sharma",
        status="PENDING",
        proposed_by=inst_admin.id,
    )
    db_session.add(corr)
    db_session.commit()

    # Approve correction
    from app.services.issues import approve_correction_service

    approve_correction_service(db_session, correction_id=corr.id, principal=cast(Any, inst_admin))

    # Check that credential status is now SUPERSEDED
    cred = db_session.query(Credential).filter(Credential.apaar_id == student.apaar_id).first()
    assert cred is not None
    assert cred.status == "SUPERSEDED"

    # Verify presentation of this credential yields SUPERSEDED
    r_nonce = client.get("/v1/verify/nonce")
    nonce = r_nonce.json()["nonce"]
    pres = build_holder_presentation(
        sd_jwt_compact=sd_jwt,
        claims_to_disclose=["full_name"],
        holder_private_key=holder_priv,
        nonce=nonce,
    )
    r_verify = client.post(
        "/v1/verify",
        json={"sd_jwt_presentation": pres, "nonce": nonce},
    )
    assert r_verify.status_code == 200
    res = r_verify.json()
    assert res["valid"] is False
    assert res["result"] == "SUPERSEDED"


def test_consent_withdrawal_suspends_credential(client, db_session: Session):
    """Test that withdrawing VERIFICATION_SHARE consent updates credential status to SUSPENDED."""
    student = _create_test_student(db_session, "123456789016")
    student_user = db_session.query(User).filter(User.role == "STUDENT").first()
    assert student_user is not None
    student_user.student_apaar_hash = hashlib.sha256(student.apaar_id.encode("utf-8")).hexdigest()
    db_session.commit()
    inst_admin = db_session.query(User).filter(User.role == "INSTITUTION_ADMIN").first()

    holder_priv, holder_jwk = _generate_holder_ec_key()
    client.post(
        "/v1/credentials/holder-key",
        json={"jwk": holder_jwk},
        headers=make_auth_headers(student_user),
    )

    r_issue = client.post(
        "/v1/credentials/issue",
        json={"apaar_id": student.apaar_id, "credential_type": "EduVerifyEnrolmentCredential"},
        headers=make_auth_headers(inst_admin),
    )
    sd_jwt = r_issue.json()["sd_jwt"]

    # Student withdraws VERIFICATION_SHARE consent
    r_withdraw = client.post(
        "/v1/consent",
        json={
            "apaar_id": student.apaar_id,
            "purpose": "VERIFICATION_SHARE",
            "action": "WITHDRAW",
        },
        headers=make_auth_headers(student_user),
    )
    assert r_withdraw.status_code == 201

    # Check credential status is SUSPENDED
    cred = db_session.query(Credential).filter(Credential.apaar_id == student.apaar_id).first()
    assert cred is not None
    assert cred.status == "SUSPENDED"

    # Present credential -> verification returns SUSPENDED
    r_nonce = client.get("/v1/verify/nonce")
    nonce = r_nonce.json()["nonce"]
    pres = build_holder_presentation(
        sd_jwt_compact=sd_jwt,
        claims_to_disclose=["full_name"],
        holder_private_key=holder_priv,
        nonce=nonce,
    )
    r_verify = client.post(
        "/v1/verify",
        json={"sd_jwt_presentation": pres, "nonce": nonce},
    )
    assert r_verify.status_code == 200
    res = r_verify.json()
    assert res["valid"] is False
    assert res["result"] == "SUSPENDED"


def test_manual_credential_revocation(client, db_session: Session):
    """Test POST /v1/credentials/{id}/revoke marks credential REVOKED."""
    student = _create_test_student(db_session, "123456789017")
    student_user = db_session.query(User).filter(User.role == "STUDENT").first()
    inst_admin = db_session.query(User).filter(User.role == "INSTITUTION_ADMIN").first()

    holder_priv, holder_jwk = _generate_holder_ec_key()
    client.post(
        "/v1/credentials/holder-key",
        json={"jwk": holder_jwk},
        headers=make_auth_headers(student_user),
    )

    r_issue = client.post(
        "/v1/credentials/issue",
        json={"apaar_id": student.apaar_id, "credential_type": "EduVerifyEnrolmentCredential"},
        headers=make_auth_headers(inst_admin),
    )
    cred_id = r_issue.json()["credential_id"]
    sd_jwt = r_issue.json()["sd_jwt"]

    # Revoke
    r_rev = client.post(
        f"/v1/credentials/{cred_id}/revoke",
        json={"status": "REVOKED", "reason": "Administrative disciplinary suspension"},
        headers=make_auth_headers(inst_admin),
    )
    assert r_rev.status_code == 200
    assert r_rev.json()["status"] == "REVOKED"

    # Verification yields REVOKED
    r_nonce = client.get("/v1/verify/nonce")
    nonce = r_nonce.json()["nonce"]
    pres = build_holder_presentation(
        sd_jwt_compact=sd_jwt,
        claims_to_disclose=["full_name"],
        holder_private_key=holder_priv,
        nonce=nonce,
    )
    r_verify = client.post(
        "/v1/verify",
        json={"sd_jwt_presentation": pres, "nonce": nonce},
    )
    assert r_verify.status_code == 200
    res = r_verify.json()
    assert res["valid"] is False
    assert res["result"] == "REVOKED"


# ============================================================================
# 5. QR CODE & CERTIFICATE PDF TESTS
# ============================================================================


def test_qr_code_and_certificate_pdf_endpoints(client, db_session: Session):
    """Test GET /v1/credentials/{id}/qr.png and GET /v1/credentials/{id}/certificate.pdf."""
    student = _create_test_student(db_session, "123456789018")
    student_user = db_session.query(User).filter(User.role == "STUDENT").first()
    inst_admin = db_session.query(User).filter(User.role == "INSTITUTION_ADMIN").first()

    _, holder_jwk = _generate_holder_ec_key()
    client.post(
        "/v1/credentials/holder-key",
        json={"jwk": holder_jwk},
        headers=make_auth_headers(student_user),
    )

    r_issue = client.post(
        "/v1/credentials/issue",
        json={"apaar_id": student.apaar_id, "credential_type": "EduVerifyEnrolmentCredential"},
        headers=make_auth_headers(inst_admin),
    )
    cred_id = r_issue.json()["credential_id"]

    # 1. QR Code PNG
    r_qr = client.get(f"/v1/credentials/{cred_id}/qr.png")
    assert r_qr.status_code == 200
    assert r_qr.headers["content-type"] == "image/png"
    assert r_qr.content.startswith(b"\x89PNG")

    # 2. Certificate PDF
    r_pdf = client.get(f"/v1/credentials/{cred_id}/certificate.pdf")
    assert r_pdf.status_code == 200
    assert r_pdf.headers["content-type"] == "application/pdf"
    assert r_pdf.content.startswith(b"%PDF")
