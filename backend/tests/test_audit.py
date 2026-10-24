"""
Audit log integrity and hash chaining tests for Task B1.
Tests genesis record hash, continuous SHA-256 chain linking, tamper detection,
PII masking in payloads, and IP address hashing.
Complies with agents.md §12 and prompt B1.
"""

import hashlib
import json

from app.models.auth import AuditLog
from app.services.audit import (
    GENESIS_HASH,
    append_audit_log,
    canonical_json,
    compute_audit_hash,
    verify_audit_chain,
)
from sqlalchemy.orm import Session


def test_genesis_record_hash(db_session: Session):
    """The first record in an empty audit log links to the GENESIS_HASH (64 zeros)."""
    # Clear any previous audit rows in transaction
    db_session.query(AuditLog).delete()
    db_session.flush()

    entry = append_audit_log(
        db_session,
        action="SYSTEM_INIT",
        actor_type="SYSTEM",
        resource="SYSTEM",
        payload={"message": "System initialization"},
    )
    db_session.flush()

    assert entry.prev_hash == GENESIS_HASH
    expected_hash = compute_audit_hash(
        GENESIS_HASH, canonical_json({"message": "System initialization"})
    )
    assert entry.hash == expected_hash

    valid, msg = verify_audit_chain(db_session)
    assert valid is True
    assert "Audit chain verified" in msg


def test_audit_chain_hashes_link(db_session: Session):
    """Sequence of audit log records forms an unbroken cryptographic hash chain."""
    db_session.query(AuditLog).delete()
    db_session.flush()

    actions = [
        ("LOGIN_SUCCESS", {"user": "admin", "method": "password"}),
        ("TOKEN_REFRESH", {"old_jti": "j1", "new_jti": "j2"}),
        ("API_KEY_CREATED", {"prefix": "abcd", "scopes": ["upload"]}),
        ("API_KEY_REVOKED", {"prefix": "abcd"}),
        ("LOGOUT", {"reason": "user_initiated"}),
    ]

    created_entries = []
    for action, payload in actions:
        e = append_audit_log(
            db_session,
            action=action,
            actor_type="USER",
            actor_id="test-user",
            resource="AUTH",
            payload=payload,
        )
        db_session.flush()
        created_entries.append(e)

    # Verify each link in the chain
    for i in range(1, len(created_entries)):
        prev_entry = created_entries[i - 1]
        curr_entry = created_entries[i]
        assert curr_entry.prev_hash == prev_entry.hash
        expected_curr_hash = compute_audit_hash(prev_entry.hash, curr_entry.payload_json)
        assert curr_entry.hash == expected_curr_hash

    valid, msg = verify_audit_chain(db_session)
    assert valid is True
    assert f"Audit chain verified ({len(actions)} records intact)" in msg


def test_tamper_detection_payload(db_session: Session):
    """Tampering with payload_json is detected by verify_audit_chain."""
    db_session.query(AuditLog).delete()
    db_session.flush()

    append_audit_log(db_session, action="ACTION_1", actor_type="SYSTEM", payload={"val": 1})
    tampered_entry = append_audit_log(
        db_session, action="ACTION_2", actor_type="SYSTEM", payload={"val": 2}
    )
    append_audit_log(db_session, action="ACTION_3", actor_type="SYSTEM", payload={"val": 3})
    db_session.flush()

    # Tamper with the payload
    tampered_entry.payload_json = json.dumps({"val": 9999})
    db_session.flush()

    valid, error = verify_audit_chain(db_session)
    assert valid is False
    assert "Hash mismatch at row" in error


def test_tamper_detection_prev_hash(db_session: Session):
    """Tampering with prev_hash link is detected by verify_audit_chain."""
    db_session.query(AuditLog).delete()
    db_session.flush()

    append_audit_log(db_session, action="ACTION_1", actor_type="SYSTEM", payload={"val": 1})
    tampered_entry = append_audit_log(
        db_session, action="ACTION_2", actor_type="SYSTEM", payload={"val": 2}
    )
    db_session.flush()

    # Tamper with prev_hash
    tampered_entry.prev_hash = "f" * 64
    db_session.flush()

    valid, error = verify_audit_chain(db_session)
    assert valid is False
    assert "Broken link at row" in error


def test_pii_masking_in_audit_payload(db_session: Session):
    """Sensitive PII (APAAR, email, mobile) is masked before storage in audit log."""
    db_session.query(AuditLog).delete()
    db_session.flush()

    raw_apaar = "123456789012"
    raw_email = "student.name@university.edu"
    raw_mobile = "9876543210"

    entry = append_audit_log(
        db_session,
        action="STUDENT_ACTION",
        actor_type="USER",
        payload={
            "apaar": raw_apaar,
            "contact": raw_email,
            "phone": raw_mobile,
            "meta": {"nested_apaar": f"Student ID is {raw_apaar}"},
        },
    )
    db_session.flush()

    # Raw PII must NEVER appear in the stored payload
    assert raw_apaar not in entry.payload_json
    assert raw_email not in entry.payload_json
    assert raw_mobile not in entry.payload_json

    # Masked forms must be present
    assert "1234****9012" in entry.payload_json
    assert "@university.edu" in entry.payload_json
    assert "3210" in entry.payload_json


def test_ip_address_hashed(db_session: Session):
    """Client IP address is cryptographically hashed with SHA-256 for privacy."""
    db_session.query(AuditLog).delete()
    db_session.flush()

    raw_ip = "192.168.1.100"
    expected_ip_hash = hashlib.sha256(raw_ip.encode("utf-8")).hexdigest()

    entry = append_audit_log(
        db_session,
        action="LOGIN_SUCCESS",
        actor_type="USER",
        ip_address=raw_ip,
        payload={"status": "ok"},
    )
    db_session.flush()

    assert entry.ip_hash == expected_ip_hash
    assert raw_ip not in (entry.ip_hash or "")
