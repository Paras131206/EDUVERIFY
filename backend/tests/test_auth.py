"""
Comprehensive authentication and authorization tests for Task B1.
Tests login, lockout, rate limiting, refresh rotation, reuse detection, logout,
/me, password change, and TOTP MFA.
"""

from datetime import UTC, datetime, timedelta

import pyotp
from app.models.auth import RefreshToken, User
from app.security.tokens import decode_access_token, generate_refresh_token
from sqlalchemy.orm import Session
from tests.conftest import TEST_PASSWORD, make_auth_headers


def test_login_success(client, db_session: Session):
    """POST /v1/auth/login returns access JWT and refresh token cookie + body."""
    response = client.post(
        "/v1/auth/login",
        json={"email": "aicte.admin@demo.local", "password": TEST_PASSWORD},
    )
    assert response.status_code == 200
    data = response.json()

    # Verify access token
    assert "access_token" in data
    assert data["token_type"] == "Bearer"
    assert data["expires_in"] == 900
    assert "refresh_token" in data
    assert data["refresh_token"].startswith("rt_")

    # Verify JWT claims
    claims = decode_access_token(data["access_token"])
    assert claims["role"] == "AICTE_ADMIN"
    assert claims["iss"] == "eduverify"
    assert claims["aud"] == "eduverify-api"
    assert "jti" in claims

    # Verify user profile in response
    user_info = data["user"]
    assert user_info["email"] == "aicte.admin@demo.local"
    assert user_info["role"] == "AICTE_ADMIN"
    assert "password_hash" not in user_info

    # Verify HttpOnly cookie
    cookies = response.cookies
    assert "refresh_token" in cookies
    assert cookies["refresh_token"] == data["refresh_token"]

    # Verify DB refresh token record
    jti = data["refresh_token"].split("_")[1]
    rt_record = db_session.query(RefreshToken).filter(RefreshToken.jti == jti).first()
    assert rt_record is not None
    assert rt_record.revoked_at is None


def test_login_wrong_password(client, db_session: Session):
    """POST /v1/auth/login with wrong password fails with uniform 401."""
    response = client.post(
        "/v1/auth/login",
        json={"email": "aicte.admin@demo.local", "password": "WrongPassword!999"},  # nosec B105
    )
    assert response.status_code == 401
    data = response.json()
    assert data["detail"] == "Invalid email or password"
    assert data["code"] == "AUTH_FAILED"

    # Verify failed logins incremented
    user = db_session.query(User).filter(User.email == "aicte.admin@demo.local").first()
    assert user is not None
    assert user.failed_logins == 1


def test_login_nonexistent_user(client):
    """POST /v1/auth/login with unknown email returns identical 401 (no enumeration)."""
    response = client.post(
        "/v1/auth/login",
        json={"email": "nonexistent@demo.local", "password": "SomePassword@2026"},  # nosec B105
    )
    assert response.status_code == 401
    data = response.json()
    assert data["detail"] == "Invalid email or password"
    assert data["code"] == "AUTH_FAILED"


def test_login_inactive_user(client, db_session: Session):
    """POST /v1/auth/login for deactivated user returns 401 ACCOUNT_INACTIVE."""
    user = db_session.query(User).filter(User.email == "inst.staff@demo.local").first()
    assert user is not None
    user.is_active = False
    db_session.flush()

    response = client.post(
        "/v1/auth/login",
        json={"email": "inst.staff@demo.local", "password": TEST_PASSWORD},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["code"] == "ACCOUNT_INACTIVE"


def test_account_lockout_after_5_failures(client, db_session: Session):
    """5 failed logins locks account for 15 minutes; 6th attempt is blocked."""
    email = "inst.admin@demo.local"

    for _ in range(5):
        resp = client.post(
            "/v1/auth/login",
            json={"email": email, "password": "BadPassword@123"},  # nosec B105
        )
        assert resp.status_code == 401

    user = db_session.query(User).filter(User.email == email).first()
    assert user is not None
    assert user.failed_logins >= 5
    assert user.locked_until is not None
    raw_locked = user.locked_until
    assert isinstance(raw_locked, datetime)
    locked_until: datetime = raw_locked if raw_locked.tzinfo else raw_locked.replace(tzinfo=UTC)
    assert locked_until > datetime.now(UTC)

    # 6th attempt with CORRECT password must still fail due to lockout
    resp_locked = client.post(
        "/v1/auth/login",
        json={"email": email, "password": TEST_PASSWORD},
    )
    assert resp_locked.status_code == 401
    data = resp_locked.json()
    assert data["code"] == "ACCOUNT_LOCKED"
    assert "temporarily locked" in data["detail"]


def test_refresh_token_rotation(client, db_session: Session):
    """POST /v1/auth/refresh rotates the token and revokes the old one."""
    # Login to get initial refresh token
    login_resp = client.post(
        "/v1/auth/login",
        json={"email": "aicte.analyst@demo.local", "password": TEST_PASSWORD},
    )
    assert login_resp.status_code == 200
    first_rt = login_resp.json()["refresh_token"]
    first_jti = first_rt.split("_")[1]

    # Rotate refresh token
    refresh_resp = client.post(
        "/v1/auth/refresh",
        json={"refresh_token": first_rt},
    )
    assert refresh_resp.status_code == 200
    second_data = refresh_resp.json()
    second_rt = second_data["refresh_token"]
    second_jti = second_rt.split("_")[1]

    assert first_rt != second_rt
    assert first_jti != second_jti

    # Verify old token record is revoked and replaced_by points to new jti
    old_record = db_session.query(RefreshToken).filter(RefreshToken.jti == first_jti).first()
    assert old_record is not None
    assert old_record.revoked_at is not None
    assert old_record.replaced_by == second_jti

    # Verify new token record is active
    new_record = db_session.query(RefreshToken).filter(RefreshToken.jti == second_jti).first()
    assert new_record is not None
    assert new_record.revoked_at is None


def test_refresh_token_reuse_detection(client, db_session: Session):
    """Reusing an already rotated/revoked refresh token revokes all user sessions."""
    # 1. Login
    login_resp = client.post(
        "/v1/auth/login",
        json={"email": "inst2.admin@demo.local", "password": TEST_PASSWORD},
    )
    rt_1 = login_resp.json()["refresh_token"]

    # 2. Legitimate rotation: rt_1 -> rt_2
    refresh_resp = client.post("/v1/auth/refresh", json={"refresh_token": rt_1})
    assert refresh_resp.status_code == 200
    rt_2 = refresh_resp.json()["refresh_token"]
    jti_2 = rt_2.split("_")[1]

    # 3. Attacker attempts to reuse rt_1 (which was already revoked)
    reuse_resp = client.post("/v1/auth/refresh", json={"refresh_token": rt_1})
    assert reuse_resp.status_code == 401
    data = reuse_resp.json()
    assert data["code"] == "TOKEN_REUSE"

    # 4. Confirm rt_2 was ALSO revoked as part of whole-family revocation
    active_tokens = (
        db_session.query(RefreshToken)
        .filter(
            RefreshToken.user_id == "u-inst2-admin-1",
            RefreshToken.revoked_at.is_(None),
        )
        .all()
    )
    assert len(active_tokens) == 0

    token_2 = db_session.query(RefreshToken).filter(RefreshToken.jti == jti_2).first()
    assert token_2 is not None
    assert token_2.revoked_at is not None


def test_refresh_token_expired(client, db_session: Session):
    """Expired refresh token returns 401 TOKEN_EXPIRED."""
    raw_rt, jti, _ = generate_refresh_token()
    past_time = datetime.now(UTC) - timedelta(days=8)

    rt = RefreshToken(
        jti=jti,
        user_id="u-aicte-admin-1",
        expires_at=past_time,
    )
    db_session.add(rt)
    db_session.flush()

    resp = client.post("/v1/auth/refresh", json={"refresh_token": raw_rt})
    assert resp.status_code == 401
    assert resp.json()["code"] == "TOKEN_EXPIRED"


def test_logout(client, db_session: Session):
    """POST /v1/auth/logout revokes active refresh token and clears cookie."""
    login_resp = client.post(
        "/v1/auth/login",
        json={"email": "student@demo.local", "password": TEST_PASSWORD},
    )
    access_token = login_resp.json()["access_token"]
    raw_rt = login_resp.json()["refresh_token"]
    jti = raw_rt.split("_")[1]

    # Logout
    logout_resp = client.post(
        "/v1/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"},
        cookies={"refresh_token": raw_rt},
    )
    assert logout_resp.status_code == 204

    # Verify DB revoked
    rt = db_session.query(RefreshToken).filter(RefreshToken.jti == jti).first()
    assert rt is not None
    assert rt.revoked_at is not None


def test_get_me(client, db_session: Session):
    """GET /v1/auth/me returns the authenticated user's profile."""
    user = db_session.query(User).filter(User.email == "dab.admin@demo.local").first()
    assert user is not None
    headers = make_auth_headers(user)

    resp = client.get("/v1/auth/me", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "dab.admin@demo.local"
    assert data["role"] == "DAB_ADMIN"
    assert data["dab_id"] == "DAB-01"

    # Missing auth header
    unauth_resp = client.get("/v1/auth/me")
    assert unauth_resp.status_code == 401


def test_change_password_success(client, db_session: Session):
    """POST /v1/auth/password changes password and revokes all active refresh tokens."""
    user = db_session.query(User).filter(User.email == "verifier@demo.local").first()
    assert user is not None
    headers = make_auth_headers(user)

    # Issue a refresh token first
    _, jti, exp = generate_refresh_token()
    rt = RefreshToken(jti=jti, user_id=user.id, expires_at=exp)
    db_session.add(rt)
    db_session.flush()

    new_password = "BrandNewSecurePassword@2026"  # nosec B105
    resp = client.post(
        "/v1/auth/password",
        headers=headers,
        json={"current_password": TEST_PASSWORD, "new_password": new_password},
    )
    assert resp.status_code == 200

    # Old refresh token should be revoked
    db_session.refresh(rt)
    assert rt.revoked_at is not None

    # Login with new password must succeed
    new_login = client.post(
        "/v1/auth/login",
        json={"email": "verifier@demo.local", "password": new_password},
    )
    assert new_login.status_code == 200


def test_change_password_weak_or_invalid(client, db_session: Session):
    """POST /v1/auth/password rejects wrong current password or weak new password."""
    user = db_session.query(User).filter(User.email == "verifier@demo.local").first()
    assert user is not None
    headers = make_auth_headers(user)

    # Wrong current password
    bad_current = client.post(
        "/v1/auth/password",
        headers=headers,
        json={"current_password": "WrongPassword@123", "new_password": "ValidNewPassword@2026"},  # nosec B105
    )
    assert bad_current.status_code == 400
    assert bad_current.json()["code"] == "INVALID_PASSWORD"

    # Weak new password (breached pattern 'password123456')
    weak_pw = client.post(
        "/v1/auth/password",
        headers=headers,
        json={"current_password": TEST_PASSWORD, "new_password": "password123456"},  # nosec B105
    )
    assert weak_pw.status_code == 400
    assert weak_pw.json()["code"] == "WEAK_PASSWORD"


def test_totp_mfa_for_admin(client, db_session: Session, monkeypatch):
    """TOTP MFA enforcement for AICTE_ADMIN when MFA_REQUIRED_FOR_ADMIN is True."""
    user = db_session.query(User).filter(User.email == "aicte.admin@demo.local").first()
    assert user is not None
    secret = pyotp.random_base32()
    user.mfa_secret = secret
    db_session.flush()

    # Enable feature flag
    monkeypatch.setattr("app.routers.auth.settings.MFA_REQUIRED_FOR_ADMIN", True)

    # Attempt login without MFA code -> 401 MFA_REQUIRED
    resp_no_mfa = client.post(
        "/v1/auth/login",
        json={"email": user.email, "password": TEST_PASSWORD},
    )
    assert resp_no_mfa.status_code == 401
    assert resp_no_mfa.json()["code"] == "MFA_REQUIRED"

    # Attempt login with invalid MFA code -> 401 MFA_REQUIRED
    resp_bad_mfa = client.post(
        "/v1/auth/login",
        json={"email": user.email, "password": TEST_PASSWORD, "mfa_code": "000000"},
    )
    assert resp_bad_mfa.status_code == 401

    # Attempt login with valid MFA code -> 200
    totp = pyotp.TOTP(secret)
    valid_code = totp.now()
    resp_valid_mfa = client.post(
        "/v1/auth/login",
        json={"email": user.email, "password": TEST_PASSWORD, "mfa_code": valid_code},
    )
    assert resp_valid_mfa.status_code == 200
    assert "access_token" in resp_valid_mfa.json()


def test_login_rate_limiting(client):
    """Enforces 10 requests per minute per IP rate limiting on /v1/auth/login."""
    # Reset limiter explicitly before this test
    from app.security.limiter import limiter

    limiter.reset()

    responses = []
    for _ in range(12):
        r = client.post(
            "/v1/auth/login",
            json={"email": "nonexistent@demo.local", "password": "WrongPassword@999"},  # nosec B105
        )
        responses.append(r)

    status_codes = [r.status_code for r in responses]
    # At least the 11th and 12th requests must be 429
    assert 429 in status_codes
    last_resp = responses[-1]
    assert last_resp.status_code == 429
    assert last_resp.json()["code"] == "RATE_LIMITED"

    # Reset limiter after test
    limiter.reset()
