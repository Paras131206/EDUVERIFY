"""
Role-based access control (RBAC) tests for Task B1.
Tests the full RBAC matrix: every role against protected endpoints,
as well as require_same_institution, require_self_student, and require_scope.
Complies with agents.md §9 and prompt B1.
"""

import pytest
from app.models.auth import User
from app.security.deps import (
    Principal,
    require_same_institution,
    require_scope,
    require_self_student,
)
from fastapi import HTTPException
from sqlalchemy.orm import Session
from tests.conftest import make_auth_headers

ALL_ROLES = [
    "AICTE_ADMIN",
    "AICTE_ANALYST",
    "INSTITUTION_ADMIN",
    "INSTITUTION_STAFF",
    "DAB_ADMIN",
    "STUDENT",
    "VERIFIER",
]

ROLE_TO_EMAIL = {
    "AICTE_ADMIN": "aicte.admin@demo.local",
    "AICTE_ANALYST": "aicte.analyst@demo.local",
    "INSTITUTION_ADMIN": "inst.admin@demo.local",
    "INSTITUTION_STAFF": "inst.staff@demo.local",
    "DAB_ADMIN": "dab.admin@demo.local",
    "STUDENT": "student@demo.local",
    "VERIFIER": "verifier@demo.local",
}


def test_users_endpoint_role_matrix(client, db_session: Session):
    """
    RBAC Matrix test for /v1/users (GET):
    Permitted roles: AICTE_ADMIN, INSTITUTION_ADMIN.
    Forbidden roles: AICTE_ANALYST, INSTITUTION_STAFF, DAB_ADMIN, STUDENT, VERIFIER (403).
    """
    for role in ALL_ROLES:
        email = ROLE_TO_EMAIL[role]
        user = db_session.query(User).filter(User.email == email).first()
        assert user is not None, f"Demo user missing for {role}"
        headers = make_auth_headers(user)

        resp = client.get("/v1/users", headers=headers)
        if role in ("AICTE_ADMIN", "INSTITUTION_ADMIN"):
            assert resp.status_code == 200, f"{role} should get 200, got {resp.status_code}"
        else:
            assert resp.status_code == 403, f"{role} should get 403, got {resp.status_code}"


def test_api_keys_create_role_matrix(client, db_session: Session):
    """
    RBAC Matrix test for /v1/api-keys (POST):
    Only INSTITUTION_ADMIN is permitted to generate API keys.
    """
    for role in ALL_ROLES:
        email = ROLE_TO_EMAIL[role]
        user = db_session.query(User).filter(User.email == email).first()
        headers = make_auth_headers(user)

        resp = client.post(
            "/v1/api-keys",
            headers=headers,
            json={"name": f"Test Key for {role}", "scopes": ["upload"]},
        )
        if role == "INSTITUTION_ADMIN":
            assert resp.status_code == 201, (
                f"INSTITUTION_ADMIN should get 201, got {resp.status_code}"
            )
        else:
            assert resp.status_code == 403, f"{role} should get 403, got {resp.status_code}"


def test_api_keys_list_role_matrix(client, db_session: Session):
    """
    RBAC Matrix test for /v1/api-keys (GET):
    Permitted roles: AICTE_ADMIN, INSTITUTION_ADMIN.
    Forbidden roles: AICTE_ANALYST, INSTITUTION_STAFF, DAB_ADMIN, STUDENT, VERIFIER.
    """
    for role in ALL_ROLES:
        email = ROLE_TO_EMAIL[role]
        user = db_session.query(User).filter(User.email == email).first()
        headers = make_auth_headers(user)

        resp = client.get("/v1/api-keys", headers=headers)
        if role in ("AICTE_ADMIN", "INSTITUTION_ADMIN"):
            assert resp.status_code == 200, f"{role} should get 200, got {resp.status_code}"
        else:
            assert resp.status_code == 403, f"{role} should get 403, got {resp.status_code}"


def test_auth_me_role_matrix(client, db_session: Session):
    """
    RBAC Matrix test for /v1/auth/me:
    Every authenticated role has access to their own profile (200).
    """
    for role in ALL_ROLES:
        email = ROLE_TO_EMAIL[role]
        user = db_session.query(User).filter(User.email == email).first()
        headers = make_auth_headers(user)

        resp = client.get("/v1/auth/me", headers=headers)
        assert resp.status_code == 200, f"{role} failed /v1/auth/me"
        assert resp.json()["role"] == role


def test_require_same_institution_helper():
    """Validates require_same_institution behavior for matching, mismatched, and admin users."""
    inst_principal = Principal(
        id="p1", email="admin@inst.org", role="INSTITUTION_ADMIN", institution_aicte_id="1-10001"
    )
    admin_principal = Principal(
        id="p2", email="aicte@aicte.org", role="AICTE_ADMIN", institution_aicte_id=None
    )

    # 1. Matching institution succeeds
    require_same_institution(inst_principal, "1-10001")

    # 2. Mismatched institution raises 403
    with pytest.raises(HTTPException) as exc_info:
        require_same_institution(inst_principal, "1-10002")
    assert exc_info.value.status_code == 403

    # 3. AICTE_ADMIN bypasses institution check
    require_same_institution(admin_principal, "1-10001")
    require_same_institution(admin_principal, "1-10002")


def test_require_self_student_helper():
    """Validates require_self_student behavior for matching APAAR, other APAAR, and admin."""
    import hashlib

    apaar = "123456789012"
    apaar_hash = hashlib.sha256(apaar.encode("utf-8")).hexdigest()

    student_principal = Principal(
        id="s1",
        email="student@demo.local",
        role="STUDENT",
        student_apaar_hash=apaar_hash,
    )
    admin_principal = Principal(
        id="a1",
        email="admin@demo.local",
        role="AICTE_ADMIN",
    )

    # 1. Matching APAAR succeeds
    require_self_student(student_principal, apaar)

    # 2. Accessing someone else's APAAR raises 403
    with pytest.raises(HTTPException) as exc_info:
        require_self_student(student_principal, "999999999999")
    assert exc_info.value.status_code == 403

    # 3. AICTE_ADMIN bypasses
    require_self_student(admin_principal, "999999999999")


def test_require_scope_enforcement():
    """Validates scope checker dependency on principal scopes."""
    upload_principal = Principal(
        id="k1",
        email=None,
        role="INSTITUTION_ADMIN",
        scopes=["upload"],
        is_api_key=True,
    )
    read_principal = Principal(
        id="k2",
        email=None,
        role="INSTITUTION_ADMIN",
        scopes=["read"],
        is_api_key=True,
    )

    upload_checker = require_scope("upload")
    read_checker = require_scope("read")

    # upload_principal has upload scope
    res = upload_checker(upload_principal)
    assert res == upload_principal

    # upload_principal lacks read scope -> 403
    with pytest.raises(HTTPException) as exc_info:
        read_checker(upload_principal)
    assert exc_info.value.status_code == 403

    # read_principal has read scope
    res2 = read_checker(read_principal)
    assert res2 == read_principal
