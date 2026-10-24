"""
JWT Access Token and Refresh Token generation, rotation, and validation.
Complies with prompt B1.
"""

import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from app.config import get_settings
from app.models.auth import User

settings = get_settings()

JWT_ALGORITHM = "HS256"
JWT_ISSUER = "eduverify"
JWT_AUDIENCE = "eduverify-api"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7


def create_access_token(user: User) -> str:
    """Creates a signed 15-minute access JWT with required claims."""
    now = datetime.now(UTC)
    expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    payload: dict[str, Any] = {
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "inst": user.institution_aicte_id,
        "dab": user.dab_id,
        "jti": str(uuid.uuid4()),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
    }

    return jwt.encode(payload, settings.JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """
    Decodes and verifies an access JWT.
    Raises jwt.PyJWTError on failure.
    """
    return jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=[JWT_ALGORITHM],
        issuer=JWT_ISSUER,
        audience=JWT_AUDIENCE,
    )


def generate_refresh_token() -> tuple[str, str, datetime]:
    """
    Generates a cryptographically random refresh token.
    Returns (raw_token, jti, expires_at).
    Format: rt_<jti>_<secret>
    """
    jti = secrets.token_hex(16)
    secret = secrets.token_urlsafe(32)
    raw_token = f"rt_{jti}_{secret}"
    expires_at = datetime.now(UTC) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    return raw_token, jti, expires_at


def parse_refresh_token_jti(raw_token: str) -> str | None:
    """Extracts JTI from raw refresh token format rt_<jti>_<secret>."""
    parts = raw_token.split("_")
    if len(parts) >= 3 and parts[0] == "rt":
        return parts[1]
    return None
