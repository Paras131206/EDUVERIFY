"""
Unit tests for cryptographic module app/security/crypto.py.
Complies with prompt B2 item 2 and agents.md §5, §8.4.
"""

from app.security.crypto import (
    decrypt_field,
    encrypt_field,
    keyed_apaar_hash,
    mask_apaar,
    mask_email,
    mask_mobile,
    mask_name,
)


def test_encryption_decryption_roundtrip():
    original = "student.name@institute.ac.in"
    encrypted = encrypt_field(original)
    assert encrypted is not None
    assert encrypted != original
    decrypted = decrypt_field(encrypted)
    assert decrypted == original


def test_encryption_none_handling():
    assert encrypt_field(None) is None
    assert decrypt_field(None) is None


def test_decryption_invalid_ciphertext():
    assert decrypt_field("invalid-not-base64-or-fernet") is None


def test_keyed_apaar_hash_deterministic():
    apaar = "104332181960"
    h1 = keyed_apaar_hash(apaar)
    h2 = keyed_apaar_hash(apaar)
    assert h1 == h2
    assert len(h1) == 64
    assert h1 != apaar


def test_keyed_apaar_hash_different_inputs():
    h1 = keyed_apaar_hash("104332181960")
    h2 = keyed_apaar_hash("631165667010")
    assert h1 != h2


def test_mask_apaar():
    assert mask_apaar("104332181960") == "1043****1960"
    assert mask_apaar("12345") == "12*45"
    assert mask_apaar("") == ""
    assert mask_apaar(None) == ""


def test_mask_email():
    assert mask_email("vedant@example.com") == "v****t@example.com"
    assert mask_email("ab@domain.com") == "a*@domain.com"
    assert mask_email("invalid") == "***"
    assert mask_email(None) == "***"


def test_mask_mobile():
    assert mask_mobile("9876543210") == "******3210"
    assert mask_mobile("123") == "****"
    assert mask_mobile(None) == ""


def test_mask_name():
    assert mask_name("Manish Mukherjee") == "M***** M********"
    assert mask_name("Raj") == "R**"
    assert mask_name("A B") == "A B"
    assert mask_name(None) == ""
