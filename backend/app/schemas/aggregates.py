"""
Pydantic schemas for Aggregate Mode, Declared Totals, and Reconciliation.
Complies with contracts/openapi.yaml and Task B4.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AggregateProgramItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    program_code: str
    total_enrolment: int = Field(..., ge=0)
    supernumerary_count: int = Field(default=0, ge=0)
    nri_count: int = Field(default=0, ge=0)
    oci_count: int = Field(default=0, ge=0)
    fn_count: int = Field(default=0, ge=0)


class AggregateSubmissionRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    institution_aicte_id: str
    academic_year: str
    programs: list[AggregateProgramItem]


class DeclaredTotalCreateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    institution_aicte_id: str
    program_code: str
    academic_year: str
    approved_intake: int | None = Field(default=None, ge=0)
    declared_enrolment: int | None = Field(default=None, ge=0)
    supernumerary_allowed: int | None = Field(default=0, ge=0)
    declared_supernumerary: int | None = Field(default=0, ge=0)
    declared_nri: int | None = Field(default=0, ge=0)


class DeclaredTotalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="ignore")
    id: int
    institution_aicte_id: str
    program_code: str
    academic_year: str
    declared_enrolment: int
    declared_supernumerary: int
    declared_nri: int
    source: str
    submitted_at: datetime


class ReconciliationItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="ignore")
    institution_aicte_id: str | None = None
    program_code: str
    academic_year: str
    declared: int
    uploaded: int
    aggregate: int = 0
    delta: int
    status: str = Field(..., description="MATCH, MISMATCH, or EXCESS")


class ReconciliationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    items: list[ReconciliationItemResponse]
    coverage_pct: float = Field(
        ..., description="Percentage of institutions with student-level records"
    )
    total_institutions: int
    student_data_institutions: int
    aggregate_only_institutions: int
