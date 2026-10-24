"""
Tests for APAAR Registry Protocol, MockApaarRegistry, and /v1/registry/{apaar}/check.
Complies with prompt B2 item 4 and agents.md §5, §9.
"""

from app.models.auth import AuditLog, User
from app.services.registry import ApaarRegistry, MockApaarRegistry
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from tests.conftest import make_auth_headers


def get_headers(db: Session, role: str) -> dict[str, str]:
    user = db.query(User).filter(User.role == role).first()
    assert user is not None, f"User with role {role} not found"
    return make_auth_headers(user)


def test_registry_protocol_direct_service(db_session: Session):
    service = MockApaarRegistry(db_session)
    assert isinstance(service, ApaarRegistry)

    # Known seeded APAAR ID: 104332181960 (Manish Mukherjee)
    entry = service.lookup("104332181960")
    assert entry is not None
    assert entry.apaar_id == "104332181960"
    assert entry.full_name == "Manish Mukherjee"
    assert entry.dob == "2005-10-01"
    assert entry.gender == "M"

    # Check call returns masked demographic info
    check_res = service.check("104332181960")
    assert check_res["exists"] is True
    assert check_res["apaar_id"] == "104332181960"
    assert check_res["match"] is not None
    assert check_res["match"]["full_name_masked"] == "M***** M********"
    assert check_res["match"]["gender"] == "M"

    # Unknown APAAR ID
    unknown = service.lookup("999999999999")
    assert unknown is None
    unknown_check = service.check("999999999999")
    assert unknown_check["exists"] is False
    assert unknown_check["match"] is None


def test_registry_endpoint_unauthenticated(client: TestClient):
    resp = client.get("/v1/registry/104332181960/check")
    assert resp.status_code == 401


def test_registry_endpoint_forbidden_for_institution_and_students(
    client: TestClient, db_session: Session
):
    for role in ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "STUDENT", "VERIFIER"]:
        headers = get_headers(db_session, role)
        resp = client.get("/v1/registry/104332181960/check", headers=headers)
        assert resp.status_code == 403, f"Role {role} should not have access to registry check"


def test_registry_endpoint_allowed_for_aicte_admin(client: TestClient, db_session: Session):
    headers = get_headers(db_session, "AICTE_ADMIN")
    resp = client.get("/v1/registry/104332181960/check", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["exists"] is True
    assert data["apaar_id"] == "104332181960"
    assert data["match"]["full_name_masked"] == "M***** M********"
    assert data["match"]["dob"] == "2005-10-01"
    assert data["match"]["gender"] == "M"

    # Verify audit log entry
    audit_row = (
        db_session.query(AuditLog)
        .filter(AuditLog.action == "REGISTRY_CHECK")
        .order_by(AuditLog.id.desc())
        .first()
    )
    assert audit_row is not None
    assert audit_row.resource == "mock_apaar_registry"


def test_registry_endpoint_allowed_for_aicte_analyst(client: TestClient, db_session: Session):
    headers = get_headers(db_session, "AICTE_ANALYST")
    resp = client.get("/v1/registry/631165667010/check", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["exists"] is True


def test_registry_endpoint_unknown_apaar(client: TestClient, db_session: Session):
    headers = get_headers(db_session, "AICTE_ADMIN")
    resp = client.get("/v1/registry/999999999999/check", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["exists"] is False
    assert data["match"] is None


def test_registry_endpoint_invalid_apaar_format(client: TestClient, db_session: Session):
    headers = get_headers(db_session, "AICTE_ADMIN")
    resp = client.get("/v1/registry/12345/check", headers=headers)
    assert resp.status_code == 400
