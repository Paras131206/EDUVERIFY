"""
Pydantic schemas for Employer Portal, candidate academic history, and consent-gated hiring.
Complies with DPDP Act 2023 Section 8.4 and prompt requirements.
"""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class SemesterMarkItem(BaseModel):
    semester: int
    sgpa: float
    credits: int
    status: str = "PASS"


class AcademicRecordDetail(BaseModel):
    model_config = ConfigDict(extra="ignore")

    tenth_board: str | None = None
    tenth_percentage: float | None = None
    tenth_year: int | None = None
    tenth_school: str | None = None
    twelfth_board: str | None = None
    twelfth_percentage: float | None = None
    twelfth_stream: str | None = None
    twelfth_year: int | None = None
    twelfth_school: str | None = None
    cgpa: float | None = None
    total_credits: int | None = 160
    completed_credits: int | None = 120
    active_backlogs: int = 0
    semester_marks: list[dict[str, Any]] | None = None
    skills: list[str] | None = None
    achievements: list[str] | None = None


class CandidateListItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    apaar_id: str
    full_name: str
    institution_aicte_id: str
    institution_name: str | None = None
    program_code: str
    course_level: str
    academic_year: str
    enrolment_status: str
    cgpa: float | None = None
    has_consent: bool
    consent_status: str
    request_status: str | None = None


class CandidateDetailResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    apaar_id: str
    has_consent: bool
    consent_status: str
    student: dict[str, Any]
    academic_record: AcademicRecordDetail | None = None
    message: str | None = None


class CreateEmployerAccessRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    apaar_id: str = Field(..., pattern=r"^\d{12}$", description="12-digit student APAAR ID")
    job_title: str = Field(..., min_length=2, max_length=150, description="Target job/intern role")
    organization: str | None = Field(default=None, description="Hiring organization/agency name")
    purpose: str = Field(
        default="Campus Recruitment & Background Verification",
        description="Purpose for requesting academic records under DPDP Act 2023",
    )


class EmployerAccessRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="ignore")

    id: str
    employer_id: str
    employer_name: str
    apaar_id: str
    job_title: str | None = None
    organization: str | None = None
    purpose: str
    status: str
    requested_at: datetime
    decided_at: datetime | None = None


class StudentDecisionRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    decision: Literal["APPROVED", "REJECTED"] = Field(
        ..., description="Decision to grant or reject employer access"
    )
