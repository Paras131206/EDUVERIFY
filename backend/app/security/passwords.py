"""
Argon2id password hashing, strength validation, and timing-safe verification.
Complies with prompt B1.
"""

from app.config import get_settings
from argon2 import PasswordHasher, Type
from argon2.exceptions import VerifyMismatchError

settings = get_settings()

# OWASP recommended parameters for argon2id
_hasher = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    type=Type.ID,
)

# Common breached passwords and trivial words
BREACHED_PASSWORDS = {
    "password",
    "password123",
    "password1234",
    "1234567890",
    "123456789012",
    "qwertyuiop",
    "admin12345",
    "letmein123",
    "welcome123",
    "aicte12345",
}

TRIVIAL_WORDS = {"password", "qwerty", "admin", "welcome", "letmein", "iloveyou"}

# Pre-computed dummy hash to ensure constant-time response when user is not found
DUMMY_HASH = _hasher.hash("DummySecurePassword123!@#" + settings.PEPPER)


def _prepare_password(password: str) -> str:
    """Combines password with global pepper before hashing or verification."""
    return f"{password}{settings.PEPPER}"


def validate_password_strength(password: str) -> None:
    """
    Validates minimum length (10 chars) and checks against known breached patterns.
    Raises ValueError with a clear message if validation fails.
    """
    if len(password) < 10:
        raise ValueError("Password must be at least 10 characters long")

    lowered = password.lower().strip()
    if lowered in BREACHED_PASSWORDS:
        raise ValueError("Password is a known commonly breached password")

    stripped_alpha = "".join(c for c in lowered if c.isalpha())
    if stripped_alpha in TRIVIAL_WORDS:
        raise ValueError("Password contains a trivial breached base word")

    if "1234567890" in lowered or "qwertyuiop" in lowered:
        raise ValueError("Password contains a predictable sequential pattern")


def hash_password(password: str) -> str:
    """Hashes a password using argon2id with pepper."""
    validate_password_strength(password)
    return _hasher.hash(_prepare_password(password))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against an argon2id hash."""
    try:
        return _hasher.verify(hashed_password, _prepare_password(plain_password))
    except VerifyMismatchError:
        return False
    except Exception:
        return False


def verify_dummy() -> None:
    """Performs dummy verification to defeat timing attacks on non-existent users."""
    try:
        _hasher.verify(DUMMY_HASH, "DummySecurePassword123!@#" + settings.PEPPER)
    except Exception:
        pass
