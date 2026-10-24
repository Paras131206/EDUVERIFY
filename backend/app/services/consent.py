"""
Consent service implementing DPDP Act 2023 compliance, hash-chained ledger,
and credential/PII lifecycle hooks per agents.md §8.4 and Task B5.
"""

import hashlib
import json
import uuid
from datetime import UTC, datetime

from app.models.core import (
    ConsentLedger,
    Credential,
    StatusList,
    StudentRecord,
    StudentRecordVersion,
)
from app.security.crypto import keyed_apaar_hash
from app.security.deps import Principal, require_self_student
from app.services.audit import append_audit_log
from app.vc.sdjwt import set_status_list_bit
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

GENESIS_HASH = "0" * 64


def canonical_consent_json(
    apaar_id: str,
    purpose: str,
    status: str,
    effective_at: datetime,
    guardian_consent: bool,
    signature_ref: str | None,
) -> str:
    """Produces deterministic canonical JSON for consent ledger hashing."""
    payload = {
        "apaar_id": apaar_id,
        "effective_at": effective_at.isoformat(),
        "guardian_consent": guardian_consent,
        "purpose": purpose,
        "signature_ref": signature_ref or "",
        "status": status,
    }
    return json.dumps(payload, sort_keys=True, separators=(",", ":"))


def compute_consent_hash(prev_hash: str, canonical_payload: str) -> str:
    """Computes SHA-256 hash chaining: sha256(prev_hash + canonical_json)."""
    return hashlib.sha256(f"{prev_hash}{canonical_payload}".encode("utf-8")).hexdigest()


def record_consent_service(
    db: Session,
    *,
    purpose: str,
    action: str,
    apaar_id: str | None,
    evidence_ref: str | None,
    guardian_consent: bool,
    principal: Principal,
) -> ConsentLedger:
    """
    Appends an immutable consent record to consent_ledger with hash chaining.
    Applies lifecycle effects per agents.md §8.4:
    - VERIFICATION_SHARE withdraw -> suspend credentials (hook into B6) and block presentations.
    - REPOSITORY withdraw -> pseudonymise PII, keep statistical counts.
    """
    target_apaar: str | None = apaar_id

    # 1. Authorization and Target Student Resolution
    if principal.role == "STUDENT":
        if target_apaar:
            require_self_student(principal, target_apaar)
        else:
            # Resolve student record by principal's apaar hash
            student_match = db.scalars(
                select(StudentRecord).where(
                    StudentRecord.apaar_hash == principal.student_apaar_hash
                )
            ).first()
            if not student_match:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={
                        "code": "STUDENT_NOT_FOUND",
                        "message": "Student record not associated with authenticated account",
                    },
                )
            target_apaar = student_match.apaar_id
    elif principal.role == "INSTITUTION_ADMIN":
        if not target_apaar:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "APAAR_REQUIRED", "message": "Student APAAR ID is required"},
            )
        # Verify student belongs to administrator's institution
        student_match = db.scalars(
            select(StudentRecord).where(StudentRecord.apaar_id == target_apaar)
        ).first()
        if (
            student_match
            and principal.institution_aicte_id
            and student_match.institution_aicte_id != principal.institution_aicte_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "FORBIDDEN",
                    "message": "Cannot manage consent for student of another institution",
                },
            )
        # Institution admins recording consent on behalf of student act as guardian/parental proxy
        guardian_consent = True
    elif principal.role == "AICTE_ADMIN":
        if not target_apaar:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "APAAR_REQUIRED", "message": "Student APAAR ID is required"},
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Not authorized to manage consent"},
        )

    assert target_apaar is not None
    now = datetime.now(UTC)
    consent_status = "GRANTED" if action == "GRANT" else "WITHDRAWN"

    # 2. Hash chaining in append-only consent_ledger
    last_row = db.query(ConsentLedger).order_by(ConsentLedger.id.desc()).first()
    prev_hash = last_row.hash if (last_row and last_row.hash) else GENESIS_HASH

    payload_json = canonical_consent_json(
        apaar_id=target_apaar,
        purpose=purpose,
        status=consent_status,
        effective_at=now,
        guardian_consent=guardian_consent,
        signature_ref=evidence_ref,
    )
    current_hash = compute_consent_hash(prev_hash, payload_json)

    entry = ConsentLedger(
        apaar_id=target_apaar,
        apaar_hash=keyed_apaar_hash(target_apaar),
        purpose=purpose,
        status=consent_status,
        effective_at=now,
        guardian_consent=guardian_consent,
        signature_ref=evidence_ref,
        prev_hash=prev_hash,
        hash=current_hash,
    )
    db.add(entry)

    # 3. Lifecycle Hooks per agents.md §8.4
    if purpose == "VERIFICATION_SHARE":
        status_list = db.query(StatusList).order_by(StatusList.updated_at.desc()).first()
        if action == "WITHDRAW":
            creds = (
                db.query(Credential)
                .filter(
                    Credential.apaar_id == target_apaar,
                    Credential.status == "VALID",
                )
                .all()
            )
            for c in creds:
                c.status = "SUSPENDED"
                if c.status_list_index is not None and status_list:
                    status_list.bitstring_data = set_status_list_bit(
                        status_list.bitstring_data,
                        c.status_list_index,
                        3,  # SUSPENDED
                        bits=2,
                    )
            if status_list and creds:
                status_list.updated_at = now
        elif action == "GRANT":
            creds = (
                db.query(Credential)
                .filter(
                    Credential.apaar_id == target_apaar,
                    Credential.status == "SUSPENDED",
                )
                .all()
            )
            for c in creds:
                c.status = "VALID"
                if c.status_list_index is not None and status_list:
                    status_list.bitstring_data = set_status_list_bit(
                        status_list.bitstring_data,
                        c.status_list_index,
                        0,  # VALID
                        bits=2,
                    )
            if status_list and creds:
                status_list.updated_at = now

    elif purpose == "REPOSITORY":
        if action == "WITHDRAW":
            # Pseudonymise PII in Central Repository while preserving aggregate statistics
            student = db.scalars(
                select(StudentRecord).where(StudentRecord.apaar_id == target_apaar)
            ).first()
            if student:
                # Archive version in student_record_versions prior to pseudonymisation
                version_archive = StudentRecordVersion(
                    id=str(uuid.uuid4()),
                    apaar_id=student.apaar_id,
                    record_version=student.record_version,
                    snapshot_json={
                        "full_name": student.full_name,
                        "program_code": student.program_code,
                        "academic_year": student.academic_year,
                        "course_level": student.course_level,
                        "year_of_study": student.year_of_study,
                        "institution_aicte_id": student.institution_aicte_id,
                        "enrolment_status": student.enrolment_status,
                    },
                    changed_by=principal.id,
                    change_reason="DPDP Act 2023 Section 8.4 Repository consent withdrawal",
                    created_at=now,
                )
                db.add(version_archive)

                # Wipe PII identifiers, pseudonymise name, keep counts
                student.full_name = "[WITHDRAWN]"
                student.email_enc = None
                student.mobile_enc = None
                student.consent_status = "WITHDRAWN"
                student.record_version += 1
                student.updated_at = now

    # 4. Audit Log Entry
    append_audit_log(
        db,
        action=f"CONSENT_{consent_status}",
        actor_type="API_KEY" if principal.is_api_key else "USER",
        actor_id=principal.id,
        role=principal.role,
        resource="CONSENT_LEDGER",
        resource_id=target_apaar,
        payload={
            "purpose": purpose,
            "action": action,
            "guardian_consent": guardian_consent,
            "evidence_ref": evidence_ref,
        },
    )

    db.commit()
    db.refresh(entry)
    return entry


def get_consent_summary_service(
    db: Session,
    *,
    apaar_id: str | None,
    principal: Principal,
) -> dict:
    """Retrieves purpose-bound consent state and audit history for a student."""
    target_apaar = apaar_id

    if principal.role == "STUDENT":
        if target_apaar:
            require_self_student(principal, target_apaar)
        else:
            student_match = db.scalars(
                select(StudentRecord).where(
                    StudentRecord.apaar_hash == principal.student_apaar_hash
                )
            ).first()
            if not student_match:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={
                        "code": "STUDENT_NOT_FOUND",
                        "message": "Student record not found for authenticated user",
                    },
                )
            target_apaar = student_match.apaar_id
    elif principal.role in ("INSTITUTION_ADMIN", "AICTE_ADMIN", "AICTE_ANALYST"):
        if not target_apaar:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "APAAR_REQUIRED", "message": "apaar_id query parameter required"},
            )
        if principal.role == "INSTITUTION_ADMIN":
            student_match = db.scalars(
                select(StudentRecord).where(StudentRecord.apaar_id == target_apaar)
            ).first()
            if (
                student_match
                and principal.institution_aicte_id
                and student_match.institution_aicte_id != principal.institution_aicte_id
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={"code": "FORBIDDEN", "message": "Access denied"},
                )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Unauthorized"},
        )

    assert target_apaar is not None

    # Fetch history ordered chronologically
    history_rows = (
        db.query(ConsentLedger)
        .filter(ConsentLedger.apaar_id == target_apaar)
        .order_by(ConsentLedger.id.desc())
        .all()
    )

    # Calculate latest status per purpose (default to GRANTED if student is active)
    consents = {
        "REPOSITORY": "GRANTED",
        "VERIFICATION_SHARE": "GRANTED",
        "ANALYTICS_AGGREGATE": "GRANTED",
    }
    # Walk chronologically forwards to compute current active states
    for row in reversed(history_rows):
        consents[row.purpose] = row.status

    return {
        "apaar_id": target_apaar,
        "consents": consents,
        "history": history_rows,
    }
