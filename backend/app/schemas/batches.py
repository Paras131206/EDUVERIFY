"""
Pydantic schemas for Batch ingestion, smart mapping, reports, issues, and commit operations.
Complies with contracts/openapi.yaml and prompt B3.
"""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ColumnMappingModel(BaseModel):
    model_config = ConfigDict(extra="forbid")
    source: str = Field(..., description="Uploaded column name")
    target: str = Field(..., description="Canonical student_record field name")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Match confidence")
    method: Literal["synonym", "fuzzy", "user", "sniffed", "exact"] = Field(
        ..., description="Resolution method"
    )


class ConfirmMappingRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    mappings: list[ColumnMappingModel] = Field(..., description="Confirmed column mappings")
    save_profile: bool = Field(
        default=False, description="Whether to save this mapping as a profile"
    )
    profile_name: str | None = Field(default=None, description="Profile name if saving")


class BatchSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    batch_id: str
    id: str | None = None
    institution_aicte_id: str
    academic_year: str
    status: str
    rows_total: int = 0
    rows_valid: int = 0
    rows_error: int = 0
    rows_warning: int = 0
    quality_score: float | None = None
    quality_score_before: float | None = None
    quality_score_after: float | None = None
    version: int = 1
    supersedes_batch_id: str | None = None
    engine_version: str | None = None
    catalog_version: str | None = None
    created_at: datetime
    updated_at: datetime | None = None
    filename: str | None = None
    size_bytes: int | None = None

    @model_validator(mode="after")
    def sync_id(self):
        if not self.id:
            self.id = self.batch_id
        if self.quality_score is None:
            self.quality_score = (
                self.quality_score_after
                if self.quality_score_after is not None
                else self.quality_score_before
            )
        return self


class BatchIssueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    batch_id: str
    rule_id: str
    row_index: int | None = None
    field_name: str | None = None
    apaar_id: str | None = None
    severity: str
    priority: str
    bucket: str
    message: str
    reason: str | None = None
    evidence_json: dict[str, Any] | None = None
    suggested_fix_json: dict[str, Any] | None = None
    value_masked: str | None = None
    status: str
    decided_by: str | None = None
    decided_at: datetime | None = None


class CommitRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    version: int = Field(..., description="Optimistic concurrency batch version")


class CommitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    batch_id: str
    committed_records: int
    quality_score_before: float
    quality_score_after: float
    committed_at: datetime
    excluded_rows_count: int = 0
    excluded_row_numbers: list[int] = Field(default_factory=list)


class EventTicketResponse(BaseModel):
    ticket: str
    expires_in: int = 60


class BulkDecideRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    action: str = Field(..., description="Action: ACCEPT_INFO, ACCEPT_SELECTED, DISMISS_SELECTED")
    issue_ids: list[str] = Field(default_factory=list, description="Target issue IDs")
    remarks: str | None = Field(default=None, description="Remarks or decision notes")
