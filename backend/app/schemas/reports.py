"""
Pydantic schemas for Reports Generation and Job Tracking.
Complies with Task B7 item 5 and frontend contract.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class CreateReportRequest(BaseModel):
    report_type: str = Field(
        default="POLICY",
        description="Report type: POLICY, ACCREDITATION, MONITORING, or REGULATORY",
    )
    type: str | None = Field(
        None,
        description="Alias for report_type per prompt B7 specification",
    )
    academic_year: str = Field(default="2026-27", description="Target academic year")
    state: str | None = Field(None, description="State filter name or code")
    program: str | None = Field(None, description="Program code filter")
    category: str | None = Field(None, description="Quota/Category filter")
    format: str = Field(default="PDF", description="Format: PDF or XLSX")
    filters: dict[str, Any] | None = Field(
        None,
        description="Optional nested filters object: {year, state, program, category}",
    )


class ReportSummary(BaseModel):
    total_institutions: int = 0
    total_students: int = 0
    approved_intake: int = 0
    enrolled_count: int = 0
    excess_seats: int = 0
    compliance_score: float = 0.0


class ReportItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    title_hi: str | None = None
    report_type: str
    format: str
    academic_year: str
    state: str | None = None
    program: str | None = None
    category: str | None = None
    status: str
    generated_at: str | datetime
    generated_by: str
    file_size: str
    download_url: str
    summary: ReportSummary | None = None


class ReportJobResponse(BaseModel):
    job_id: str
    status: str
    progress_percent: int
    current_step: str
    result_report: ReportItemResponse | None = None
    download_url: str | None = None
    error_message: str | None = None
