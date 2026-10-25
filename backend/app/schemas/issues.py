"""
Pydantic schemas for Issue decision workflow, Corrections, and DQ comparison.
Complies with contracts/openapi.yaml and Task B4.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class IssueDecisionRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    action: str | None = Field(
        default=None,
        description="Decision action: ACCEPT_FIX, EDIT_FIX, or DISMISS",
    )
    decision: str | None = Field(
        default=None,
        description="Alternative action alias for OpenAPI compatibility",
    )
    value: Any | None = Field(default=None, description="Override value when EDIT_FIX")
    override_value: Any | None = Field(
        default=None, description="Alternative value alias for OpenAPI compatibility"
    )
    note: str | None = Field(default=None, description="Reviewer justification or note")
    remarks: str | None = Field(
        default=None, description="Alternative note alias for OpenAPI compatibility"
    )


class CorrectionCreateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    apaar_id: str
    field: str
    new_value: Any
    reason: str
    batch_id: str | None = None
    issue_id: str | None = None


class CorrectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str = Field(..., validation_alias="id")
    correction_id: str = Field(..., validation_alias="id")
    batch_id: str | None = None
    issue_id: str | None = None
    apaar_id: str | None = None
    field: str
    old_value: str | None = None
    new_value: str | None = None
    status: str
    proposed_by: str
    approved_by: str | None = None
    note: str | None = None
    created_at: datetime
    decided_at: datetime | None = None


class DQComparisonResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    batch_id: str
    quality_score_before: float
    quality_score_after: float
    score_delta: float
    resolved_count: int
    pending_count: int
    per_rule_deltas: dict[str, int] = Field(default_factory=dict)
    per_priority_deltas: dict[str, int] = Field(default_factory=dict)
    per_column_completeness_before: dict[str, float] = Field(default_factory=dict)
    per_column_completeness_after: dict[str, float] = Field(default_factory=dict)


class IssueRevertRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    reason: str | None = Field(
        default=None, description="Audit justification for reverting decision"
    )

