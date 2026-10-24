"""
Pydantic schemas for Duplicates clusters, side-by-side records, and resolution.
Complies with contracts/openapi.yaml and Task B4.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class DuplicateClusterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="ignore")
    cluster_id: str
    id: str | None = None
    batch_id: str | None = None
    scope: str = Field(..., description="INTRA or CROSS_INSTITUTION")
    bucket: str = Field(default="HUMAN_REVIEW")
    status: str = Field(default="OPEN", description="OPEN, SAME_PERSON, DIFFERENT_PEOPLE, TRANSFER")
    score: float = Field(..., alias="similarity_score")
    similarity_score: float | None = None
    matched_fields: dict[str, Any] = Field(default_factory=dict)
    members: list[dict[str, Any]] = Field(default_factory=list)
    notes: str | None = None
    decided_by: str | None = None
    decided_at: datetime | None = None


class DuplicateResolutionRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    decision: str | None = Field(
        default=None, description="SAME_PERSON, DIFFERENT_PEOPLE, or TRANSFER"
    )
    resolution: str | None = Field(
        default=None, description="Alternative decision alias for OpenAPI compatibility"
    )
    note: str | None = Field(default=None, description="Justification note")
    remarks: str | None = Field(
        default=None, description="Alternative note alias for OpenAPI compatibility"
    )
