"""
Audit trail inspection, chain integrity verification, and data retention router.
Complies with contracts/openapi.yaml, agents.md §12, and Task B5.
"""

from datetime import datetime

from app.db import get_db
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
            "timestamp": it.get("ts").isoformat() if hasattr(it.get("ts"), "isoformat") else str(it.get("ts") or ""),
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
