"""
Audit trail inspection, chain integrity verification, and data retention router.
Complies with contracts/openapi.yaml, agents.md §12, and Task B5.
"""

from datetime import datetime
from typing import Any

from app.db import get_db
from app.models.auth import AuditLog, User
from app.models.core import Batch, BatchFile, Correction, Issue
from app.schemas.audit import (
    AuditChainVerificationResponse,
    AuditListResponse,
    AuditLogEntryResponse,
    RetentionPurgeResponse,
)
from app.security.deps import Principal, require_roles
from app.services.audit import list_audit_logs_service, verify_audit_chain_detailed
from app.services.retention import purge_expired_batch_files
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter(tags=["Audit"])


@router.get(
    "/v1/audit",
    response_model=AuditListResponse,
    summary="Query tamper-evident audit log with multi-criteria filtering",
)
def list_audit_logs(
    from_date: datetime | None = Query(
        default=None, description="Filter logs starting at UTC timestamp"
    ),
    to_date: datetime | None = Query(
        default=None, description="Filter logs ending at UTC timestamp"
    ),
    action: str | None = Query(
        default=None, description="Action code filter, e.g. CONSENT_GRANTED, BATCH_COMMIT"
    ),
    actor_id: str | None = Query(default=None, description="Specific user or API key actor UUID"),
    resource: str | None = Query(
        default=None, description="Resource type filter, e.g. STUDENT_RECORD, CONSENT_LEDGER"
    ),
    limit: int = Query(default=50, ge=1, le=200, description="Page limit"),
    offset: int = Query(default=0, ge=0, description="Page offset"),
    principal: Principal = Depends(require_roles("AICTE_ADMIN", "AICTE_ANALYST")),
    db: Session = Depends(get_db),
) -> AuditListResponse:
    """
    Returns paginated tamper-evident audit log records with PII masked payloads.
    Restricted to AICTE_ADMIN or AICTE_ANALYST compliance officers.
    """
    items, total = list_audit_logs_service(
        db,
        from_date=from_date,
        to_date=to_date,
        action=action,
        actor_id=actor_id,
        resource=resource,
        limit=limit,
        offset=offset,
    )
    return AuditListResponse(
        total=total,
        items=[AuditLogEntryResponse.model_validate(it) for it in items],
    )


def _format_timestamp(ts: Any) -> str:
    if isinstance(ts, datetime):
        return ts.isoformat()
    return str(ts or "")


@router.get(
    "/v1/audit/log",
    include_in_schema=False,
    summary="Get flat list of audit log records for dashboard feed",
)
def list_audit_log_feed(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    principal: Principal = Depends(require_roles("AICTE_ADMIN", "AICTE_ANALYST")),
    db: Session = Depends(get_db),
) -> list[dict]:
    items, _ = list_audit_logs_service(
        db,
        limit=limit,
        offset=offset,
    )
    return [
        {
            "id": it.get("id"),
            "sequence": it.get("id"),
            "timestamp": _format_timestamp(it.get("ts")),
            "actor_id": it.get("actor_id"),
            "action": it.get("action"),
            "resource": it.get("resource"),
            "record_id": it.get("resource_id"),
            "sha256_hash": it.get("hash"),
            "prev_hash": it.get("prev_hash"),
            "payload_masked": it.get("payload") or {},
        }
        for it in items
    ]


@router.get(
    "/v1/audit/verify-chain",
    response_model=AuditChainVerificationResponse,
    summary="Verify cryptographic integrity of the entire audit hash chain",
)
def verify_audit_chain_endpoint(
    db: Session = Depends(get_db),
) -> AuditChainVerificationResponse:
    """
    Verifies that all audit records maintain an unbroken SHA-256 hash chain:
    recalculates sha256(prev_hash + canonical_json(payload)) for each record sequentially.
    Returns {valid: true, length, head_hash} or indicates first_broken_id.
    """
    result = verify_audit_chain_detailed(db)
    return AuditChainVerificationResponse.model_validate(result)


@router.post(
    "/v1/audit/verify-chain/recalculate",
    include_in_schema=False,
    response_model=AuditChainVerificationResponse,
    summary="Recalculate audit chain cryptographic integrity on demand",
)
def recalculate_audit_chain_endpoint(
    db: Session = Depends(get_db),
) -> AuditChainVerificationResponse:
    result = verify_audit_chain_detailed(db)
    return AuditChainVerificationResponse.model_validate(result)


@router.post(
    "/v1/admin/retention/purge",
    response_model=RetentionPurgeResponse,
    summary="Trigger data retention purge for expired raw batch upload files",
)
def purge_retention_batch_files_endpoint(
    retention_days: int | None = Query(
        default=None,
        ge=1,
        description="Override default retention threshold in days (default 90 days)",
    ),
    principal: Principal = Depends(require_roles("AICTE_ADMIN")),
    db: Session = Depends(get_db),
) -> RetentionPurgeResponse:
    """
    Deletes raw payload BLOBs in batch_files older than the retention period.
    Leaves batch records, issues, corrections, and audit rows intact.
    Restricted to AICTE_ADMIN.
    """
    purged_count, cutoff_date, days = purge_expired_batch_files(
        db,
        retention_days=retention_days,
        actor_id=principal.id,
        actor_role=principal.role,
        is_api_key=principal.is_api_key,
    )
    return RetentionPurgeResponse(
        purged_count=purged_count,
        cutoff_date=cutoff_date,
        retention_days=days,
    )


@router.get(
    "/v1/institution/audit-trail",
    include_in_schema=False,
    summary="Get complete document upload audit trail and discrepancy change history for institution admin",
)
def get_institution_audit_trail(
    batch_id: str | None = Query(None, description="Filter by specific batch ID"),
    limit: int = Query(default=100, ge=1, le=500),
    principal: Principal = Depends(
        require_roles("INSTITUTION_ADMIN", "INSTITUTION_STAFF", "AICTE_ADMIN", "AICTE_ANALYST")
    ),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Returns previous uploaded documents (batches), discrepancies detected within them,
    changes made by whom with timestamps, and revert capability for institution admins.
    """
    # 1. Fetch batches for the institution
    batch_stmt = select(Batch).order_by(Batch.created_at.desc())
    if principal.institution_aicte_id and principal.role not in ("AICTE_ADMIN", "AICTE_ANALYST"):
        batch_stmt = batch_stmt.where(Batch.institution_aicte_id == principal.institution_aicte_id)
    if batch_id:
        batch_stmt = batch_stmt.where(Batch.batch_id == batch_id)

    batches = list(db.scalars(batch_stmt).all())
    batch_ids = [b.batch_id for b in batches]

    # Map batch files for filename and size
    batch_files = {
        bf.batch_id: bf
        for bf in db.scalars(select(BatchFile).where(BatchFile.batch_id.in_(batch_ids))).all()
    } if batch_ids else {}

    # 2. Fetch issues for these batches
    issues_stmt = select(Issue).order_by(Issue.created_at.desc() if hasattr(Issue, "created_at") else Issue.id.desc())
    if batch_ids:
        issues_stmt = issues_stmt.where(Issue.batch_id.in_(batch_ids))
    else:
        issues_stmt = issues_stmt.where(False)

    issues = list(db.scalars(issues_stmt.limit(limit)).all())
    issue_ids = [i.id for i in issues]

    # Fetch corrections associated with these issues
    corrections = list(
        db.scalars(select(Correction).where(Correction.issue_id.in_(issue_ids))).all()
    ) if issue_ids else []

    corrections_by_issue: dict[str, list[Correction]] = {}
    for c in corrections:
        if c.issue_id:
            corrections_by_issue.setdefault(c.issue_id, []).append(c)

    # Fetch users for name/email resolution
    user_ids = set()
    for i in issues:
        if i.decided_by:
            user_ids.add(i.decided_by)
    for c in corrections:
        if c.proposed_by:
            user_ids.add(c.proposed_by)
        if c.approved_by:
            user_ids.add(c.approved_by)

    users_map = {
        u.id: u for u in db.scalars(select(User).where(User.id.in_(list(user_ids)))).all()
    } if user_ids else {}

    # Format batches
    formatted_batches = []
    for b in batches:
        bf = batch_files.get(b.batch_id)
        formatted_batches.append(
            {
                "batch_id": b.batch_id,
                "id": b.batch_id,
                "academic_year": b.academic_year,
                "filename": bf.filename if bf else f"{b.batch_id}.csv",
                "size_bytes": bf.size_bytes if bf else None,
                "status": b.status,
                "version": b.version,
                "quality_score_before": b.quality_score_before,
                "quality_score_after": b.quality_score_after,
                "quality_score": b.quality_score_after or b.quality_score_before,
                "created_at": b.created_at.isoformat() if b.created_at else None,
                "updated_at": b.updated_at.isoformat() if b.updated_at else None,
            }
        )

    # Format discrepancies & changes
    discrepancies = []
    total_modified = 0
    total_reverted = 0

    for i in issues:
        corrs = corrections_by_issue.get(i.id, [])
        latest_corr = corrs[-1] if corrs else None

        decided_user = users_map.get(i.decided_by) if i.decided_by else None
        decided_by_name = decided_user.full_name or decided_user.email if decided_user else (i.decided_by or None)
        decided_by_role = decided_user.role if decided_user else None

        is_reverted = False
        revert_reason = None
        for c in corrs:
            if c.status == "REVERTED":
                is_reverted = True
                revert_reason = c.note
                break

        is_modified = i.status in ("ACCEPTED", "FIXED", "DISMISSED")
        if is_modified:
            total_modified += 1
        if is_reverted:
            total_reverted += 1

        original_val = latest_corr.old_value_enc if latest_corr and latest_corr.old_value_enc else i.value_masked
        modified_val = latest_corr.new_value_enc if latest_corr and latest_corr.new_value_enc else None
        if not modified_val and i.status == "DISMISSED":
            modified_val = "DISMISSED"
        elif not modified_val and i.suggested_fix_json and i.status in ("ACCEPTED", "FIXED"):
            modified_val = str(i.suggested_fix_json.get("value", ""))

        bf = batch_files.get(i.batch_id)
        batch_filename = bf.filename if bf else f"{i.batch_id}.csv"

        discrepancies.append(
            {
                "issue_id": i.id,
                "batch_id": i.batch_id,
                "batch_filename": batch_filename,
                "rule_id": i.rule_id,
                "row": i.row_index,
                "field": i.field_name,
                "apaar_id": i.apaar_id,
                "severity": i.severity,
                "priority": i.priority,
                "message": i.message,
                "reason": i.reason,
                "original_value": original_val,
                "modified_value": modified_val,
                "status": i.status,
                "decided_by_id": i.decided_by,
                "decided_by_name": decided_by_name,
                "decided_by_role": decided_by_role,
                "decided_at": i.decided_at.isoformat() if i.decided_at else (latest_corr.decided_at.isoformat() if latest_corr and latest_corr.decided_at else None),
                "decision_note": latest_corr.note if latest_corr else None,
                "is_reverted": is_reverted,
                "revert_reason": revert_reason,
                "can_revert": is_modified and not is_reverted,
            }
        )

    # 3. Fetch recent audit logs for this institution
    recent_logs_stmt = select(AuditLog).order_by(AuditLog.id.desc()).limit(20)
    audit_rows = list(db.scalars(recent_logs_stmt).all())
    formatted_logs = [
        {
            "id": l.id,
            "timestamp": l.ts.isoformat() if l.ts else None,
            "action": l.action,
            "actor_id": l.actor_id,
            "role": l.role,
            "resource": l.resource,
            "resource_id": l.resource_id,
            "sha256_hash": l.hash,
        }
        for l in audit_rows
    ]

    return {
        "batches": formatted_batches,
        "discrepancies": discrepancies,
        "audit_logs": formatted_logs,
        "stats": {
            "total_documents": len(batches),
            "total_discrepancies": len(discrepancies),
            "total_modified": total_modified,
            "total_reverted": total_reverted,
        },
    }

