"""
PII masking helpers for APAAR ID, email, and mobile.
Adheres to agents.md §12 - never log or expose raw PII.
"""

import re


def mask_apaar(apaar: str | None) -> str:
    """
    Masks a 12-digit APAAR ID into '1234****9012'.
    Handles non-standard length gracefully without raising exceptions.
    """
    if not apaar:
        return ""
    clean = re.sub(r"\s+|-", "", str(apaar).strip())
    if len(clean) == 12:
        return f"{clean[:4]}****{clean[8:]}"
    if len(clean) > 4:
        return f"{clean[:2]}{'*' * (len(clean) - 4)}{clean[-2:]}"
    return "****"


def mask_email(email: str | None) -> str:
    """
    Masks an email into 'j***e@domain.com'.
    """
    if not email:
        return ""
    email_str = str(email).strip()
    if "@" not in email_str:
        return "***"
    local, domain = email_str.split("@", 1)
    if len(local) <= 2:
        masked_local = f"{local[:1]}*"
    else:
        masked_local = f"{local[0]}***{local[-1]}"
    return f"{masked_local}@{domain}"


def mask_mobile(mobile: str | None) -> str:
    """
    Masks a 10-digit mobile number into '98****3210'.
    Handles +91 or leading 0 prefixes cleanly.
    """
    if not mobile:
        return ""
    digits = re.sub(r"\D", "", str(mobile))
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]

    if len(digits) == 10:
        return f"{digits[:2]}****{digits[6:]}"
    if len(digits) > 4:
        return f"{digits[:2]}{'*' * (len(digits) - 4)}{digits[-2:]}"
    return "****"
