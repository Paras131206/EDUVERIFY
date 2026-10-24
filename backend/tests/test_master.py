"""
Tests for Master Data endpoints.
Complies with contracts/openapi.yaml, prompt B2 item 5, and agents.md §7.
"""

from app.models.auth import User
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from tests.conftest import make_auth_headers


def get_headers(db: Session, role: str) -> dict[str, str]:
    user = db.query(User).filter(User.role == role).first()
    assert user is not None, f"User with role {role} not found"
    return make_auth_headers(user)


def test_master_programs_unauthenticated(client: TestClient):
    resp = client.get("/v1/master/programs")
    assert resp.status_code == 401


def test_master_programs_authenticated(client: TestClient, db_session: Session):
    headers = get_headers(db_session, "INSTITUTION_ADMIN")
    resp = client.get("/v1/master/programs", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0
    codes = [p["program_code"] for p in data]
    assert "UG-CSE" in codes


def test_master_programs_filter_course_level(client: TestClient, db_session: Session):
    headers = get_headers(db_session, "INSTITUTION_STAFF")
    resp = client.get("/v1/master/programs?course_level=DIPLOMA", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) > 0
    assert all(p["course_level"] == "DIPLOMA" for p in data)


def test_master_states(client: TestClient, db_session: Session):
    headers = get_headers(db_session, "STUDENT")
    resp = client.get("/v1/master/states", headers=headers)
    assert resp.status_code == 200
    states = resp.json()
    assert len(states) >= 19
    state_names = [s["name"] for s in states]
    assert "Delhi" in state_names or "Maharashtra" in state_names


def test_master_districts(client: TestClient, db_session: Session):
    headers = get_headers(db_session, "AICTE_ANALYST")
    resp = client.get("/v1/master/districts?state_code=7", headers=headers)
    assert resp.status_code == 200
    districts = resp.json()
    assert len(districts) > 0
    assert all(d["lgd_state_code"] == 7 for d in districts)


def test_master_institutions(client: TestClient, db_session: Session):
    headers = get_headers(db_session, "INSTITUTION_ADMIN")
    resp = client.get("/v1/master/institutions?search=Delhi", headers=headers)
    assert resp.status_code == 200
    insts = resp.json()
    assert len(insts) > 0
    assert any("Delhi" in i["name"] for i in insts)


def test_master_academic_years(client: TestClient, db_session: Session):
    headers = get_headers(db_session, "INSTITUTION_ADMIN")
    resp = client.get("/v1/master/academic-years", headers=headers)
    assert resp.status_code == 200
    ays = resp.json()
    assert len(ays) > 0
    ay_names = [a["academic_year"] for a in ays]
    assert "2026-27" in ay_names


def test_master_enums(client: TestClient, db_session: Session):
    headers = get_headers(db_session, "INSTITUTION_ADMIN")
    resp = client.get("/v1/master/enums?lang=en", headers=headers)
    assert resp.status_code == 200
    enums = resp.json()
    assert "gender" in enums
    assert "category" in enums
    gender_vals = [g["value"] for g in enums["gender"]]
    assert "M" in gender_vals
    assert "F" in gender_vals


def test_master_dabs(client: TestClient, db_session: Session):
    headers = get_headers(db_session, "DAB_ADMIN")
    resp = client.get("/v1/master/dabs", headers=headers)
    assert resp.status_code == 200
    dabs = resp.json()
    assert len(dabs) >= 6
    dab_ids = [d["dab_id"] for d in dabs]
    assert "DAB-101" in dab_ids


def test_master_create_program_forbidden_for_non_admin(client: TestClient, db_session: Session):
    headers = get_headers(db_session, "INSTITUTION_ADMIN")
    payload = {
        "program_code": "UG-ROBOTICS",
        "name": "B.Tech in Robotics",
        "course_level": "UG",
        "department": "Robotics",
        "duration_years": 4,
        "lateral_allowed": True,
    }
    resp = client.post("/v1/master/programs", json=payload, headers=headers)
    assert resp.status_code == 403


def test_master_create_program_success_for_aicte_admin(client: TestClient, db_session: Session):
    headers = get_headers(db_session, "AICTE_ADMIN")
    payload = {
        "program_code": "UG-ROBOTICS",
        "name": "B.Tech in Robotics",
        "course_level": "UG",
        "department": "Robotics",
        "duration_years": 4,
        "lateral_allowed": True,
    }
    resp = client.post("/v1/master/programs", json=payload, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["program_code"] == "UG-ROBOTICS"
    assert data["lateral_allowed"] is True

    # Duplicate should return 409 Conflict
    resp_dup = client.post("/v1/master/programs", json=payload, headers=headers)
    assert resp_dup.status_code == 409
