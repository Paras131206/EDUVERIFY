"""
Comprehensive API key tests for Task B1.
Tests API key generation, raw token once, hashing, list, revoke, cross-institution protection,
and authentication via Authorization: ApiKey and X-API-Key headers.
"""

import hashlib

from app.models.auth import ApiKey, User
from sqlalchemy.orm import Session
from tests.conftest import make_auth_headers


def test_create_api_key_success(client, db_session: Session):
    """POST /v1/api-keys by INSTITUTION_ADMIN creates key and returns raw token once."""
    user = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    headers = make_auth_headers(user)

    resp = client.post(
        "/v1/api-keys",
        headers=headers,
        json={"name": "Bulk Ingestion Bot", "scopes": ["upload", "read"]},
    )
    assert resp.status_code == 201
    data = resp.json()

    assert "id" in data
    assert data["name"] == "Bulk Ingestion Bot"
    assert data["prefix"] is not None
    assert "upload" in data["scopes"]
    assert "read" in data["scopes"]

    # Verify raw_key format: evk_<prefix>_<secret>
    raw_key = data["raw_key"]
    assert raw_key.startswith(f"evk_{data['prefix']}_")

    # Verify database record: stores SHA-256 hash, not the raw key
    expected_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
    key_record = db_session.query(ApiKey).filter(ApiKey.id == data["id"]).first()
    assert key_record is not None
    assert key_record.key_hash == expected_hash
    assert key_record.institution_aicte_id == "1-10001"
    assert key_record.revoked_at is None


def test_create_api_key_role_restriction(client, db_session: Session):
    """Non-INSTITUTION_ADMIN roles are rejected with 403."""
    for email in ["inst.staff@demo.local", "student@demo.local", "verifier@demo.local"]:
        user = db_session.query(User).filter(User.email == email).first()
        headers = make_auth_headers(user)
        resp = client.post(
            "/v1/api-keys",
            headers=headers,
            json={"name": "Unauthorized Bot", "scopes": ["upload"]},
        )
        assert resp.status_code == 403


def test_list_api_keys(client, db_session: Session):
    """GET /v1/api-keys returns active keys for the institution without exposing secret or hash."""
    user = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    headers = make_auth_headers(user)

    # Create two keys
    client.post("/v1/api-keys", headers=headers, json={"name": "Key A", "scopes": ["upload"]})
    client.post("/v1/api-keys", headers=headers, json={"name": "Key B", "scopes": ["read"]})

    resp = client.get("/v1/api-keys", headers=headers)
    assert resp.status_code == 200
    keys = resp.json()
    assert len(keys) >= 2

    for k in keys:
        assert "id" in k
        assert "name" in k
        assert "prefix" in k
        assert "scopes" in k
        assert "raw_key" not in k
        assert "key_hash" not in k


def test_revoke_api_key(client, db_session: Session):
    """DELETE /v1/api-keys/{id} revokes the key."""
    user = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    headers = make_auth_headers(user)

    create_resp = client.post(
        "/v1/api-keys", headers=headers, json={"name": "Temporary Key", "scopes": ["read"]}
    )
    key_id = create_resp.json()["id"]

    delete_resp = client.delete(f"/v1/api-keys/{key_id}", headers=headers)
    assert delete_resp.status_code == 204

    # Verify key marked revoked
    key = db_session.query(ApiKey).filter(ApiKey.id == key_id).first()
    assert key is not None
    assert key.revoked_at is not None

    # Revoked key should no longer appear in active list
    list_resp = client.get("/v1/api-keys", headers=headers)
    active_ids = [k["id"] for k in list_resp.json()]
    assert key_id not in active_ids


def test_revoke_other_institution_key_forbidden(client, db_session: Session):
    """Institution admin cannot revoke another institution's API key."""
    admin1 = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    admin2 = db_session.query(User).filter(User.email == "inst2.admin@demo.local").first()

    # Admin 1 creates key for 1-10001
    create_resp = client.post(
        "/v1/api-keys",
        headers=make_auth_headers(admin1),
        json={"name": "Inst 1 Key", "scopes": ["upload"]},
    )
    key_id = create_resp.json()["id"]

    # Admin 2 (1-10002) attempts to delete Admin 1's key
    del_resp = client.delete(f"/v1/api-keys/{key_id}", headers=make_auth_headers(admin2))
    assert del_resp.status_code == 403


def test_api_key_auth_via_authorization_header(client, db_session: Session):
    """Authenticating via Authorization: ApiKey evk_... header."""
    admin = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    create_resp = client.post(
        "/v1/api-keys",
        headers=make_auth_headers(admin),
        json={"name": "Ingestion Agent", "scopes": ["upload", "read"]},
    )
    raw_key = create_resp.json()["raw_key"]

    # Call /v1/api-keys using the API key
    resp = client.get("/v1/api-keys", headers={"Authorization": f"ApiKey {raw_key}"})
    assert resp.status_code == 200


def test_api_key_auth_via_x_api_key_header(client, db_session: Session):
    """Authenticating via X-API-Key: evk_... header."""
    admin = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    create_resp = client.post(
        "/v1/api-keys",
        headers=make_auth_headers(admin),
        json={"name": "CLI Tool", "scopes": ["read"]},
    )
    raw_key = create_resp.json()["raw_key"]

    resp = client.get("/v1/api-keys", headers={"X-API-Key": raw_key})
    assert resp.status_code == 200


def test_revoked_api_key_rejected(client, db_session: Session):
    """Revoked API key cannot authenticate."""
    admin = db_session.query(User).filter(User.email == "inst.admin@demo.local").first()
    create_resp = client.post(
        "/v1/api-keys",
        headers=make_auth_headers(admin),
        json={"name": "Deprecated Key", "scopes": ["read"]},
    )
    key_id = create_resp.json()["id"]
    raw_key = create_resp.json()["raw_key"]

    # Revoke
    client.delete(f"/v1/api-keys/{key_id}", headers=make_auth_headers(admin))

    # Attempt to authenticate
    resp = client.get("/v1/api-keys", headers={"X-API-Key": raw_key})
    assert resp.status_code == 401
    assert resp.json()["code"] == "AUTH_FAILED"
