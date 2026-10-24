"""
Cryptographic security module for EduVerify.
Handles:
- PII field encryption/decryption at rest (Fernet / AES-GCM)
- Keyed hashing (HMAC-SHA256 with PEPPER) for APAAR lookups and pseudonymisation
- Masking helpers for APAAR, emails, mobile numbers, and personal names.
Complies with agents.md §5, §8.4, §12 and prompt B2.
"""

import base64
import hashlib
import hmac
from functools import lru_cache

from app.config import get_settings
from cryptography.fernet import Fernet


@lru_cache(maxsize=1)
def get_fernet() -> Fernet:
    """
    Get or initialize the Fernet cipher instance using a deterministic 32-byte key.
    If settings.FERNET_KEY is a valid 44-character urlsafe base64 string encoding 32 bytes,
    use it directly; otherwise derive a 32-byte key via SHA-256 and base64-encode it.
    """
    settings = get_settings()
    key_str = settings.FERNET_KEY.strip()
    try:
        # Check if it's already a valid Fernet key
        decoded = base64.urlsafe_b64decode(key_str.encode("utf-8"))
        if len(decoded) == 32:
            return Fernet(key_str.encode("utf-8"))
    except Exception:  # nosec B110
        pass

    # Deterministically derive 32 bytes from the configured key string
    derived = hashlib.sha256(key_str.encode("utf-8")).digest()
    b64_key = base64.urlsafe_b64encode(derived)
    return Fernet(b64_key)


def encrypt_field(value: str | None) -> str | None:
    """
    Encrypt a plaintext PII string (e.g. email, mobile, correction value) using Fernet.
    Returns base64 ciphertext string, or None if input is None.
    """
    if value is None:
        return None
    fernet = get_fernet()
    return fernet.encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_field(ciphertext: str | None) -> str | None:
    """
    Decrypt an encrypted ciphertext string back to plaintext.
    Returns plaintext string, or None if input is None.
    """
    if ciphertext is None:
        return None
    fernet = get_fernet()
    try:
        return fernet.decrypt(ciphertext.encode("utf-8")).decode("utf-8")
    except Exception:
        # If decryption fails (e.g. invalid ciphertext), return None or raise
        return None


def keyed_apaar_hash(apaar_id: str) -> str:
    """
    Generate a cryptographic HMAC-SHA256 hash of an APAAR ID using settings.PEPPER.
    Provides pseudonymisation and privacy-preserving indexing per agents.md §8.4.
    Returns a 64-character hexadecimal digest.
    """
    settings = get_settings()
    pepper = settings.PEPPER.encode("utf-8")
    message = apaar_id.strip().encode("utf-8")
    return hmac.new(pepper, message, hashlib.sha256).hexdigest()


def mask_apaar(apaar_id: str | None) -> str:
    """
    Mask a 12-digit APAAR ID preserving first 4 and last 4 digits: '1234****9012'.
    """
    if not apaar_id:
        return ""
    clean = apaar_id.strip()
    if len(clean) == 12:
        return f"{clean[:4]}****{clean[8:]}"
    if len(clean) > 4:
        return f"{clean[:2]}{'*' * (len(clean) - 4)}{clean[-2:]}"
    return "****"


def mask_email(email: str | None) -> str:
    """
    Mask an email address for privacy in logs and UI: 'v***t@example.com'.
    """
    if not email or "@" not in email:
        return "***"
    local, domain = email.strip().split("@", 1)
    if len(local) <= 2:
        masked_local = f"{local[:1]}*"
    else:
        masked_local = f"{local[0]}{'*' * (len(local) - 2)}{local[-1]}"
    return f"{masked_local}@{domain}"


def mask_mobile(mobile: str | None) -> str:
    """
    Mask a mobile contact number: '******7890'.
    """
    if not mobile:
        return ""
    clean = mobile.strip()
    if len(clean) >= 4:
        return f"{'*' * (len(clean) - 4)}{clean[-4:]}"
    return "****"


def mask_name(name: str | None) -> str:
    """
    Mask a student full name: 'Manish Mukherjee' -> 'M***** M********'.
    """
    if not name:
        return ""
    parts = name.strip().split()
    masked_parts = []
    for part in parts:
        if len(part) <= 1:
            masked_parts.append(part)
        else:
            masked_parts.append(f"{part[0]}{'*' * (len(part) - 1)}")
    return " ".join(masked_parts)
