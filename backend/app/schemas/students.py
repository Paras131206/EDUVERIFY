"""
Pydantic schemas for StudentRecord model and manual update endpoint.
Complies with contracts/openapi.yaml and prompt B3 item 7.
"""

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class StudentRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    apaar_id: str
    institution_aicte_id: str
    institution_student_id: str | None = None
    full_name: str
    dob: date
    gender: str
    category: str
    pwd: bool = False
    course_level: str
    program_code: str
    academic_year: str
    year_of_study: int
    admission_date: date
    admission_type: str
    seat_type: str
    supernumerary_scheme: str | None = None
    quota: str = "NONE"
    nationality: str = "IN"
    nri_status: bool = False
    oci_status: bool = False
    fn_status: bool = False
    enrolment_status: str
    consent_status: str
    consent_date: date | None = None
    guardian_consent: bool = False
    email: str | None = None
    mobile: str | None = None
    record_version: int = 1
    created_at: datetime
    updated_at: datetime | None = None


class StudentUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    full_name: str | None = None
    dob: date | None = None
    gender: str | None = None
    category: str | None = None
    pwd: bool | None = None
    course_level: str | None = None
    program_code: str | None = None
    academic_year: str | None = None
    year_of_study: int | None = None
    admission_date: date | None = None
    admission_type: str | None = None
    seat_type: str | None = None
    supernumerary_scheme: str | None = None
    quota: str | None = None
    nationality: str | None = None
    nri_status: bool | None = None
    oci_status: bool | None = None
    fn_status: bool | None = None
    enrolment_status: str | None = None
    consent_status: str | None = None
    consent_date: date | None = None
    guardian_consent: bool | None = None
    email: str | None = None
    mobile: str | None = None
    reason: str = Field(default="Administrative correction", description="Audit reason for update")


class LifecycleTransitionRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    to_status: str = Field(
        ...,
        description="Target status: WITHDRAWN, DEFERRED, COMPLETED, GRADUATED, etc.",
    )
    effective_date: date = Field(..., description="Date transition takes legal effect")
    reason: str = Field(..., description="Justification and regulatory basis for transition")
    evidence_ref: str | None = Field(
        default=None, description="Document/order reference supporting lifecycle change"
    )
