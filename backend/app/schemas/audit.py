"""
Pydantic schemas for tamper-evident audit logs and verification.
Complies with agents.md §12 and Task B5.
"""

from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class AuditLogEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="ignore")

    id: int
    ts: datetime
    actor_type: str
    actor_id: str | None = None
    role: str | None = None
    action: str
    resource: str
    resource_id: str | None = None
    ip_hash: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    prev_hash: str
    hash: str


class AuditListResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    total: int
    items: list[AuditLogEntryResponse]


class AuditChainVerificationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    valid: bool = Field(description="True if the cryptographic hash chain is unbroken")
    length: int = Field(description="Total number of audit records verified")
    first_broken_id: int | None = Field(
        default=None,
        description="ID of first tampered or invalid audit entry, if broken",
    )
    head_hash: str = Field(description="SHA-256 digest of the latest audit record in the chain")
    reason: str = Field(description="Verification summary or failure details")

    # Contract compatibility fields
    chain_valid: bool = Field(default=True)
    total_records: int = Field(default=0)
    broken_link_id: str | None = None
    verified_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    def model_post_init(self, __context: Any) -> None:
        self.chain_valid = self.valid
        self.total_records = self.length
        if self.first_broken_id is not None:
            self.broken_link_id = str(self.first_broken_id)


class RetentionPurgeResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    purged_count: int
    cutoff_date: datetime
    retention_days: int
