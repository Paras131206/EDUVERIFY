"""
Issue decision and record correction workflow services.
Enforces RBAC: INSTITUTION_ADMIN approves decisions/corrections; STAFF may only propose.
Nothing changes the data until approved.
Complies with contracts/openapi.yaml and Task B4.
"""

import uuid
from datetime import UTC, datetime
from typing import Any

from app.models.core import Batch, Correction, Credential, Issue
from app.security.deps import Principal
from app.services.audit import append_audit_log
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

DECISION_ACTION_MAP = {
    "ACCEPT_FIX": "ACCEPT_FIX",
    "ACCEPT_SUGGESTION": "ACCEPT_FIX",
    "EDIT_FIX": "EDIT_FIX",
    "OVERRIDE_VALUE": "EDIT_FIX",
    "DISMISS": "DISMISS",
    "MARK_VERIFIED": "DISMISS",
}


def decide_issue_service(
    db: Session,
    *,
    issue_id: str,
    action: str | None,
    decision_alias: str | None,
    value: Any | None,
    override_value: Any | None,
    note: str | None,
    remarks: str | None,
    principal: Principal,
) -> Issue:
    """
    Submits a human review decision on an Issue entity.
    - INSTITUTION_ADMIN or AICTE_ADMIN can approve fixes or dismissals.
    - STAFF may ONLY PROPOSE fixes; creates a PENDING correction row and leaves Issue OPEN.
    """
    issue = db.scalars(select(Issue).where(Issue.id == issue_id)).first()
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Issue '{issue_id}' not found"},
        )

    batch = db.scalars(select(Batch).where(Batch.batch_id == issue.batch_id)).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Associated batch not found"},
        )

    # RBAC check
    if principal.role != "AICTE_ADMIN" and principal.role != "AICTE_ANALYST":
        if (
            principal.institution_aicte_id
            and principal.institution_aicte_id != batch.institution_aicte_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "FORBIDDEN",
                    "message": "Cannot review issues for another institution",
                },
            )

    # Normalize action
    raw_action = (action or decision_alias or "").strip().upper()
    resolved_action = DECISION_ACTION_MAP.get(raw_action)
    if not resolved_action:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "INVALID_ACTION",
                "message": f"Action must be ACCEPT_FIX, EDIT_FIX, or DISMISS (got '{raw_action}')",
            },
        )

    final_note = (note or remarks or "").strip() or None
    final_value = value if value is not None else override_value
    now = datetime.now(UTC)

    is_admin = principal.role in ("INSTITUTION_ADMIN", "AICTE_ADMIN")

    if not is_admin:
        # STAFF role: May ONLY PROPOSE
        # Creates a PENDING correction row; does NOT change the issue status or data
        proposed_val = (
            str(final_value)
            if final_value is not None
            else (
                str(issue.suggested_fix_json.get("value"))
                if issue.suggested_fix_json and "value" in issue.suggested_fix_json
                else ""
            )
        )
        correction = Correction(
            id=str(uuid.uuid4()),
            batch_id=issue.batch_id,
            issue_id=issue.id,
            apaar_id=issue.apaar_id,
            field=issue.field_name or "unknown",
            old_value_enc=issue.value_masked,
            new_value_enc=proposed_val,
            proposed_by=principal.id,
            approved_by=None,
            status="PENDING",
            note=final_note or "Staff proposal awaiting admin approval",
            created_at=now,
        )
        db.add(correction)
        db.commit()
        db.refresh(issue)
        return issue

    # INSTITUTION_ADMIN or AICTE_ADMIN: can approve directly
    if resolved_action == "DISMISS":
        issue.status = "DISMISSED"
        issue.decided_by = principal.id
        issue.decided_at = now
        # Also create a dismissed correction record for audit tracking
        correction = Correction(
            id=str(uuid.uuid4()),
            batch_id=issue.batch_id,
            issue_id=issue.id,
            apaar_id=issue.apaar_id,
            field=issue.field_name or "unknown",
            old_value_enc=issue.value_masked,
            new_value_enc=None,
            proposed_by=principal.id,
            approved_by=principal.id,
            status="REJECTED",
            note=final_note or "Dismissed by administrator",
            created_at=now,
            decided_at=now,
        )
        db.add(correction)

    elif resolved_action == "ACCEPT_FIX":
        fix_val = (
            str(final_value)
            if final_value is not None
            else (
                str(issue.suggested_fix_json.get("value"))
                if issue.suggested_fix_json and "value" in issue.suggested_fix_json
                else ""
            )
        )
        issue.status = "ACCEPTED"
        issue.decided_by = principal.id
        issue.decided_at = now

        correction = Correction(
            id=str(uuid.uuid4()),
            batch_id=issue.batch_id,
            issue_id=issue.id,
            apaar_id=issue.apaar_id,
            field=issue.field_name or "unknown",
            old_value_enc=issue.value_masked,
            new_value_enc=fix_val,
            proposed_by=principal.id,
            approved_by=principal.id,
            status="APPROVED",
            note=final_note or "Suggested fix accepted by administrator",
            created_at=now,
            decided_at=now,
        )
        db.add(correction)

    elif resolved_action == "EDIT_FIX":
        if final_value is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "VALUE_REQUIRED", "message": "value is required for EDIT_FIX"},
            )
        fix_val = str(final_value)
        issue.status = "FIXED"
        issue.decided_by = principal.id
        issue.decided_at = now

        correction = Correction(
            id=str(uuid.uuid4()),
            batch_id=issue.batch_id,
            issue_id=issue.id,
            apaar_id=issue.apaar_id,
            field=issue.field_name or "unknown",
            old_value_enc=issue.value_masked,
            new_value_enc=fix_val,
            proposed_by=principal.id,
            approved_by=principal.id,
            status="APPROVED",
            note=final_note or "Custom value edited by administrator",
            created_at=now,
            decided_at=now,
        )
        db.add(correction)

    # Log audit
    append_audit_log(
        db,
        action="ISSUE_DECISION",
        actor_type="API_KEY" if principal.is_api_key else "USER",
        actor_id=principal.id,
        role=principal.role,
        resource="ISSUE",
        resource_id=issue.id,
        payload={"action": resolved_action, "status": issue.status, "batch_id": issue.batch_id},
    )

    db.commit()
    db.refresh(issue)
    return issue


def list_corrections_service(
    db: Session,
    *,
    batch_id: str | None,
    apaar_id: str | None,
    principal: Principal,
) -> list[Correction]:
    """Lists audit trail of approved or proposed corrections."""
    stmt = select(Correction)
    if batch_id:
        stmt = stmt.where(Correction.batch_id == batch_id)
    if apaar_id:
        stmt = stmt.where(Correction.apaar_id == apaar_id)
    return list(db.scalars(stmt.order_by(Correction.created_at.desc())).all())


def approve_correction_service(
    db: Session,
    *,
    correction_id: str,
    principal: Principal,
) -> Correction:
    """Approves a pending correction submitted by staff."""
    if principal.role not in ("INSTITUTION_ADMIN", "AICTE_ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Only administrators can approve corrections"},
        )

    correction = db.scalars(select(Correction).where(Correction.id == correction_id)).first()
    if not correction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Correction not found")

    correction.status = "APPROVED"
    correction.approved_by = principal.id
    correction.decided_at = datetime.now(UTC)

    if correction.issue_id:
        issue = db.scalars(select(Issue).where(Issue.id == correction.issue_id)).first()
        if issue:
            issue.status = "ACCEPTED"
            issue.decided_by = principal.id
            issue.decided_at = datetime.now(UTC)

    # Lifecycle hook: record correction -> SUPERSEDED per agents.md §8.4
    if correction.apaar_id:
        from app.services.credentials import update_credential_status_hook

        creds = (
            db.query(Credential)
            .filter(Credential.apaar_id == correction.apaar_id, Credential.status == "VALID")
            .all()
        )
        for c in creds:
            update_credential_status_hook(
                db,
                credential_id=c.credential_id,
                new_status="SUPERSEDED",
                reason=f"Record correction approved ({correction.field})",
                principal_id=principal.id,
                principal_role=principal.role,
            )

    db.commit()
    db.refresh(correction)
    return correction


def revert_issue_service(
    db: Session,
    *,
    issue_id: str,
    reason: str | None = None,
    principal: Principal,
) -> Issue:
    """Reverts an issue decision back to OPEN status and records tamper-evident audit log."""
    if principal.role not in ("INSTITUTION_ADMIN", "AICTE_ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Only administrators can revert decisions"},
        )

    issue = db.scalars(select(Issue).where(Issue.id == issue_id)).first()
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Issue '{issue_id}' not found"},
        )

    batch = db.scalars(select(Batch).where(Batch.batch_id == issue.batch_id)).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Associated batch not found"},
        )

    if principal.role != "AICTE_ADMIN" and principal.role != "AICTE_ANALYST":
        if (
            principal.institution_aicte_id
            and principal.institution_aicte_id != batch.institution_aicte_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "FORBIDDEN", "message": "Cannot revert issues for another institution"},
            )

    old_status = issue.status
    old_decided_by = issue.decided_by

    # Revert issue to OPEN
    issue.status = "OPEN"
    issue.decided_by = None
    issue.decided_at = None

    # Mark corrections as REVERTED
    corrections = db.scalars(select(Correction).where(Correction.issue_id == issue.id)).all()
    for corr in corrections:
        corr.status = "REVERTED"
        revert_note = f"[Reverted by {principal.id}: {reason or 'Rollback to original document state'}]"
        corr.note = f"{corr.note} {revert_note}" if corr.note else revert_note

    # Record tamper-evident audit log entry
    append_audit_log(
        db,
        action="REVERT_ISSUE_DECISION",
        actor_type="API_KEY" if principal.is_api_key else "USER",
        actor_id=principal.id,
        role=principal.role,
        resource="ISSUE",
        resource_id=issue.id,
        payload={
            "action": "REVERT",
            "batch_id": issue.batch_id,
            "previous_status": old_status,
            "previous_decided_by": old_decided_by,
            "reason": reason or "Rollback to original document state",
        },
    )

    db.commit()
    db.refresh(issue)
    return issue

