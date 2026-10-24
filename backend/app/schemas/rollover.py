"""
Pydantic schemas for Academic Year Rollover preview and execution.
Complies with contracts/openapi.yaml and Task B4.
"""

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class RolloverRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    from_academic_year: str | None = Field(
        default=None, description="Source academic year e.g. 2025-26"
    )
    from_year: str | None = Field(default=None, description="Alias for from_academic_year")
    to_academic_year: str | None = Field(
        default=None, description="Target academic year e.g. 2026-27"
    )
    to_year: str | None = Field(default=None, description="Alias for to_academic_year")
    dry_run: bool = Field(
        default=True, description="Whether to simulate rollover without persistence"
    )


class RolloverSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="ignore")
    from_academic_year: str
    to_academic_year: str
    eligible_students: int
    rolled_over: int
    graduated: int
    errors: int = 0
    dry_run: bool = True
    details: dict[str, Any] = Field(default_factory=dict)
