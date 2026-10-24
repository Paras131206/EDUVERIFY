"""
Data retention service and scheduled purge job for uploaded batch files.
Complies with Task B5, agents.md §3, and DPDP Act 2023 data minimization.
"""

import logging
from datetime import UTC, datetime, timedelta
from typing import Any

from app.config import Settings
from app.models.core import BatchFile
from app.services.audit import append_audit_log
from sqlalchemy import select
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)
settings = Settings()


def purge_expired_batch_files(
    db: Session,
    *,
    retention_days: int | None = None,
    actor_id: str | None = None,
    actor_role: str | None = None,
    is_api_key: bool = False,
) -> tuple[int, datetime, int]:
    """
    Purges raw payload BLOBs in batch_files older than the retention threshold.
    Default retention period is 90 days from Settings.BATCH_FILES_RETENTION_DAYS.
    Returns (purged_count, cutoff_date, retention_days).
    """
    days = retention_days if retention_days is not None else settings.BATCH_FILES_RETENTION_DAYS
    cutoff = datetime.now(UTC) - timedelta(days=days)

    # Query expired records
    stmt = select(BatchFile).where(BatchFile.created_at < cutoff)
    expired_files = db.scalars(stmt).all()
    count = len(expired_files)

    if count > 0:
        for bf in expired_files:
            db.delete(bf)

    # Record audit log
    append_audit_log(
        db,
        action="DATA_RETENTION_PURGE",
        actor_type="API_KEY" if is_api_key else ("USER" if actor_id else "SYSTEM"),
        actor_id=actor_id or "system_retention_job",
        role=actor_role or "SYSTEM",
        resource="BATCH_FILES",
        payload={
            "retention_days": days,
            "cutoff_date": cutoff.isoformat(),
            "purged_count": count,
        },
    )

    db.commit()
    logger.info(
        "Purged %d expired batch files older than %s (retention: %d days)",
        count,
        cutoff.isoformat(),
        days,
    )
    return count, cutoff, days


def run_retention_purge_job(db: Session) -> dict[str, Any]:
    """
    Scheduled job runner stub for automated batch files retention enforcement.
    Designed for invocation by cron, Celery, or ASGI lifespan background loop.
    """
    logger.info("Executing scheduled batch files data retention purge job")
    count, cutoff, days = purge_expired_batch_files(
        db,
        retention_days=settings.BATCH_FILES_RETENTION_DAYS,
        actor_id="system_cron_job",
        actor_role="SYSTEM",
    )
    return {
        "status": "COMPLETED",
        "purged_count": count,
        "cutoff_date": cutoff.isoformat(),
        "retention_days": days,
    }
