"""
Authentication router implementing login, token refresh, logout, profile, and password update.
Complies with contracts/openapi.yaml, agents.md §9, and prompt B1.
"""

import hashlib
from datetime import UTC, datetime, timedelta

import pyotp
from app.config import get_settings
from app.db import get_db
from app.models.auth import RefreshToken, User
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    UserProfile,
)
from app.security.deps import Principal, get_current_principal
from app.security.limiter import limiter
from app.security.passwords import (
    hash_password,
    validate_password_strength,
    verify_dummy,
    verify_password,
)
from app.security.tokens import (
    create_access_token,
    generate_refresh_token,
    parse_refresh_token_jti,
)
from app.services.audit import append_audit_log
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/v1/auth", tags=["Auth"])
settings = get_settings()


def ensure_utc(dt: datetime | None) -> datetime | None:
    """Normalizes naive datetimes (e.g. from SQLite) to UTC timezone-aware datetimes."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Authenticate user credentials",
)
@limiter.limit("10/minute")
def login(
    request: Request,
    body: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> LoginResponse:
    """
    Authenticates user credentials and issues an access JWT plus HttpOnly refresh token.
    Enforces rate-limiting (10/min), timing-safe comparison, and 5-strike 15-min lockout.
    """
    ip_addr = request.client.host if request.client else None
    now = datetime.now(UTC)

    user = db.query(User).filter(User.email == body.email.lower().strip()).first()
    if not user:
        verify_dummy()
        append_audit_log(
            db,
            action="LOGIN_FAILED",
            actor_type="ANONYMOUS",
            actor_id=body.email,
            resource="AUTH",
            payload={"email": body.email, "reason": "user_not_found"},
            ip_address=ip_addr,
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"detail": "Invalid email or password", "code": "AUTH_FAILED"},
        )

    # Check account lockout
    locked_until_utc = ensure_utc(user.locked_until)
    if locked_until_utc and locked_until_utc > now:
        append_audit_log(
            db,
            action="LOGIN_LOCKED",
            actor_type="USER",
            actor_id=user.id,
            role=user.role,
            resource="AUTH",
            payload={"reason": "account_locked", "locked_until": locked_until_utc.isoformat()},
            ip_address=ip_addr,
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "detail": (
                    "Account is temporarily locked due to multiple failed login attempts. "
                    "Try again later."
                ),
                "code": "ACCOUNT_LOCKED",
            },
        )

    # Verify password
    if not verify_password(body.password, user.password_hash):
        user.failed_logins += 1
        if user.failed_logins >= 5:
            user.locked_until = now + timedelta(minutes=15)
            append_audit_log(
                db,
                action="LOCKOUT",
                actor_type="USER",
                actor_id=user.id,
                role=user.role,
                resource="AUTH",
                payload={
                    "reason": "max_failed_logins",
                    "locked_until": user.locked_until.isoformat(),
                },
                ip_address=ip_addr,
            )

        append_audit_log(
            db,
            action="LOGIN_FAILED",
            actor_type="USER",
            actor_id=user.id,
            role=user.role,
            resource="AUTH",
            payload={"reason": "invalid_password", "failed_count": user.failed_logins},
            ip_address=ip_addr,
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"detail": "Invalid email or password", "code": "AUTH_FAILED"},
        )

    if not user.is_active:
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"detail": "Account is inactive", "code": "ACCOUNT_INACTIVE"},
        )

    # Optional TOTP MFA for AICTE_ADMIN
    if settings.MFA_REQUIRED_FOR_ADMIN and user.role == "AICTE_ADMIN":
        if user.mfa_secret:
            if not body.mfa_code or not pyotp.TOTP(user.mfa_secret).verify(
                body.mfa_code, valid_window=1
            ):
                append_audit_log(
                    db,
                    action="LOGIN_MFA_FAILED",
                    actor_type="USER",
                    actor_id=user.id,
                    role=user.role,
                    resource="AUTH",
                    payload={"reason": "mfa_invalid_or_missing"},
                    ip_address=ip_addr,
                )
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "detail": "Valid MFA code required for administrator login",
                        "code": "MFA_REQUIRED",
                    },
                )

    # Reset failed login count and record last login
    user.failed_logins = 0
    user.locked_until = None
    user.last_login_at = now

    # Issue tokens
    access_token = create_access_token(user)
    raw_rt, jti, exp = generate_refresh_token()

    ua_hash = (
        hashlib.sha256(request.headers.get("user-agent", "").encode("utf-8")).hexdigest()
        if request.headers.get("user-agent")
        else None
    )

    rt_record = RefreshToken(
        jti=jti,
        user_id=user.id,
        expires_at=exp,
        user_agent_hash=ua_hash,
    )
    db.add(rt_record)

    append_audit_log(
        db,
        action="LOGIN_SUCCESS",
        actor_type="USER",
        actor_id=user.id,
        role=user.role,
        resource="AUTH",
        ip_address=ip_addr,
    )
    db.commit()

    # Set HttpOnly Secure SameSite=Lax cookie for web clients
    response.set_cookie(
        key="refresh_token",
        value=raw_rt,
        httponly=True,
        secure=(settings.ENV != "dev"),
        samesite="lax",
        max_age=7 * 24 * 3600,
        path="/v1/auth",
    )

    return LoginResponse(
        access_token=access_token,
        token_type="Bearer",
        expires_in=900,
        refresh_token=raw_rt,
        user=UserProfile.model_validate(user),
    )


@router.post(
    "/refresh",
    response_model=LoginResponse,
    summary="Rotate refresh token and issue new access token",
)
def refresh_token(
    request: Request,
    response: Response,
    body: RefreshRequest | None = None,
    db: Session = Depends(get_db),
) -> LoginResponse:
    """
    Rotates the single-use refresh token and issues a new access token.
    Detects reuse of previously revoked tokens and revokes the entire token family.
    """
    raw_rt = (body.refresh_token if body and body.refresh_token else None) or request.cookies.get(
        "refresh_token"
    )
    if not raw_rt:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"detail": "Missing refresh token", "code": "AUTH_REQUIRED"},
        )

    jti = parse_refresh_token_jti(raw_rt)
    if not jti:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"detail": "Malformed refresh token format", "code": "AUTH_FAILED"},
        )

    now = datetime.now(UTC)
    ip_addr = request.client.host if request.client else None

    token_record = db.query(RefreshToken).filter(RefreshToken.jti == jti).first()
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"detail": "Invalid or unknown refresh token", "code": "AUTH_FAILED"},
        )

    # Token Reuse Detection: if already revoked, revoke all tokens for this user!
    if token_record.revoked_at is not None:
        db.query(RefreshToken).filter(RefreshToken.user_id == token_record.user_id).update(
            {RefreshToken.revoked_at: now}
        )
        append_audit_log(
            db,
            action="TOKEN_REUSE_DETECTED",
            actor_type="USER",
            actor_id=token_record.user_id,
            resource="AUTH",
            payload={"compromised_jti": jti, "action": "revoked_all_user_tokens"},
            ip_address=ip_addr,
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "detail": "Refresh token reuse detected; all sessions revoked",
                "code": "TOKEN_REUSE",
            },
        )

    expires_at_utc = ensure_utc(token_record.expires_at)
    if expires_at_utc and expires_at_utc < now:
        token_record.revoked_at = now
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"detail": "Refresh token has expired", "code": "TOKEN_EXPIRED"},
        )

    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user or not user.is_active:
        token_record.revoked_at = now
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"detail": "User account inactive or not found", "code": "AUTH_FAILED"},
        )

    # Rotate refresh token: generate new token, mark old replaced_by and revoked
    new_raw_rt, new_jti, new_exp = generate_refresh_token()
    token_record.revoked_at = now
    token_record.replaced_by = new_jti

    ua_hash = (
        hashlib.sha256(request.headers.get("user-agent", "").encode("utf-8")).hexdigest()
        if request.headers.get("user-agent")
        else None
    )

    new_rt_record = RefreshToken(
        jti=new_jti,
        user_id=user.id,
        expires_at=new_exp,
        user_agent_hash=ua_hash,
    )
    db.add(new_rt_record)

    access_token = create_access_token(user)

    append_audit_log(
        db,
        action="TOKEN_REFRESH",
        actor_type="USER",
        actor_id=user.id,
        role=user.role,
        resource="AUTH",
        payload={"old_jti": jti, "new_jti": new_jti},
        ip_address=ip_addr,
    )
    db.commit()

    response.set_cookie(
        key="refresh_token",
        value=new_raw_rt,
        httponly=True,
        secure=(settings.ENV != "dev"),
        samesite="lax",
        max_age=7 * 24 * 3600,
        path="/v1/auth",
    )

    return LoginResponse(
        access_token=access_token,
        token_type="Bearer",
        expires_in=900,
        refresh_token=new_raw_rt,
        user=UserProfile.model_validate(user),
    )


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke active session and refresh token",
)
def logout(
    request: Request,
    response: Response,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> None:
    """Revokes the current refresh token and clears the authentication cookie."""
    raw_rt = request.cookies.get("refresh_token")
    now = datetime.now(UTC)

    if raw_rt:
        jti = parse_refresh_token_jti(raw_rt)
        if jti:
            token_record = db.query(RefreshToken).filter(RefreshToken.jti == jti).first()
            if token_record and token_record.revoked_at is None:
                token_record.revoked_at = now

    response.delete_cookie(key="refresh_token", path="/v1/auth")

    ip_addr = request.client.host if request.client else None
    append_audit_log(
        db,
        action="LOGOUT",
        actor_type="USER",
        actor_id=principal.id,
        role=principal.role,
        resource="AUTH",
        ip_address=ip_addr,
    )
    db.commit()


@router.get(
    "/me",
    response_model=UserProfile,
    summary="Get authenticated user profile and roles",
)
def get_me(
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> UserProfile:
    """Returns the authenticated user profile."""
    user = db.query(User).filter(User.id == principal.id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "User not found", "code": "NOT_FOUND"},
        )
    return UserProfile.model_validate(user)


@router.post(
    "/password",
    summary="Change user password",
)
def change_password(
    request: Request,
    body: ChangePasswordRequest,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Changes password for the authenticated user and revokes all active sessions."""
    user = db.query(User).filter(User.id == principal.id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "User not found", "code": "NOT_FOUND"},
        )

    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": "Current password is incorrect", "code": "INVALID_PASSWORD"},
        )

    try:
        validate_password_strength(body.new_password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": str(e), "code": "WEAK_PASSWORD"},
        ) from e

    user.password_hash = hash_password(body.new_password)

    # Revoke all refresh tokens on password change
    now = datetime.now(UTC)
    db.query(RefreshToken).filter(RefreshToken.user_id == user.id).update(
        {RefreshToken.revoked_at: now}
    )

    ip_addr = request.client.host if request.client else None
    append_audit_log(
        db,
        action="PASSWORD_CHANGED",
        actor_type="USER",
        actor_id=user.id,
        role=user.role,
        resource="AUTH",
        ip_address=ip_addr,
    )
    db.commit()

    return {"detail": "Password successfully updated"}
