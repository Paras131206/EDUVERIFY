"""
Tamper-evident hash-chained audit logging service.
Complies with agents.md §12 and prompt B1.
"""

import hashlib
import json
import re
from datetime import UTC, datetime
from typing import Any

from app.models.auth import AuditLog
from eduverify_engine.masking import mask_apaar, mask_email, mask_mobile
from sqlalchemy import text
from sqlalchemy.orm import Session

GENESIS_HASH = "0" * 64
AUDIT_ADVISORY_LOCK_ID = 742189421

# Patterns for PII detection in audit payloads
APAAR_REGEX = re.compile(r"\b\d{12}\b")
EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
MOBILE_REGEX = re.compile(r"\b(?:\+91|91|0)?[6-9]\d{9}\b")


def mask_payload_pii(data: Any) -> Any:
    """Recursively masks APAAR, email, and mobile numbers in audit payload data."""
    if isinstance(data, dict):
        return {k: mask_payload_pii(v) for k, v in data.items()}
    if isinstance(data, list):
        return [mask_payload_pii(item) for item in data]
    if isinstance(data, str):
        # Mask APAAR first
        masked = APAAR_REGEX.sub(lambda m: mask_apaar(m.group(0)), data)
        # Mask email
        masked = EMAIL_REGEX.sub(lambda m: mask_email(m.group(0)), masked)
        # Mask mobile
        masked = MOBILE_REGEX.sub(lambda m: mask_mobile(m.group(0)), masked)
        return masked
    return data


def canonical_json(data: Any) -> str:
    """Produces deterministic canonical JSON (sorted keys, compact separators)."""
    return json.dumps(data, sort_keys=True, separators=(",", ":"), default=str)


def compute_audit_hash(prev_hash: str, canonical_payload: str) -> str:
    """Computes SHA-256 hash chaining: sha256(prev_hash + canonical_json(payload))."""
    digest_input = f"{prev_hash}{canonical_payload}".encode()
    return hashlib.sha256(digest_input).hexdigest()


def append_audit_log(
    db: Session,
    action: str,
    actor_type: str,
    actor_id: str | None = None,
    role: str | None = None,
    resource: str = "AUTH",
    resource_id: str | None = None,
    ip_address: str | None = None,
    payload: dict[str, Any] | None = None,
) -> AuditLog:
    """
    Appends a new hash-chained audit record inside the current database transaction.
    Takes an advisory transaction lock on PostgreSQL to guarantee deterministic chaining.
    """
    bind = db.get_bind()
    if bind is not None and bind.dialect.name == "postgresql":
        db.execute(text(f"SELECT pg_advisory_xact_lock({AUDIT_ADVISORY_LOCK_ID})"))

    last_row = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
    prev_hash = last_row.hash if last_row else GENESIS_HASH

    cleaned_payload = mask_payload_pii(payload or {})
    payload_str = canonical_json(cleaned_payload)
    current_hash = compute_audit_hash(prev_hash, payload_str)

    ip_hash = hashlib.sha256(ip_address.encode("utf-8")).hexdigest() if ip_address else None

    entry = AuditLog(
        ts=datetime.now(UTC),
        actor_type=actor_type,
        actor_id=actor_id,
        role=role,
        action=action,
        resource=resource,
        resource_id=resource_id,
        ip_hash=ip_hash,
        payload_json=payload_str,
        prev_hash=prev_hash,
        hash=current_hash,
    )

    db.add(entry)
    db.flush()
    return entry


def verify_audit_chain(db: Session) -> tuple[bool, str]:
    """
    Validates the entire audit log hash chain.
    Returns (True, 'Valid') or (False, error_reason).
    """
    rows = db.query(AuditLog).order_by(AuditLog.id.asc()).all()
    if not rows:
        return True, "Audit log is empty (valid)"

    expected_prev = GENESIS_HASH
    for row in rows:
        if row.prev_hash != expected_prev:
            return (
                False,
                f"Broken link at row {row.id}: "
                f"expected prev_hash {expected_prev}, got {row.prev_hash}",
            )

        recalculated = compute_audit_hash(row.prev_hash, row.payload_json)
        if row.hash != recalculated:
            return (
                False,
                f"Hash mismatch at row {row.id}: expected {recalculated}, stored {row.hash}",
            )

        expected_prev = row.hash

    return True, f"Audit chain verified ({len(rows)} records intact)"
