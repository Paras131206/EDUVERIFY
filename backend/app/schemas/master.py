"""
Pydantic schemas for Master Data endpoints.
Complies with contracts/openapi.yaml and agents.md §7.
"""

from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict


class StateRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    lgd_state_code: int
    name: str
    name_hi: str


class CreateStateRequest(BaseModel):
    lgd_state_code: int
    name: str
    name_hi: str


class DistrictRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    lgd_district_code: int
    lgd_state_code: int
    name: str


class CreateDistrictRequest(BaseModel):
    lgd_district_code: int
    lgd_state_code: int
    name: str


class InstitutionRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    institution_aicte_id: str
    name: str
    state_code: int
    district_code: int
    type: str
    affiliated_dab_id: str | None = None
    onboarding_level: str = "FULL"
    did: str


class CreateInstitutionRequest(BaseModel):
    institution_aicte_id: str
    name: str
    state_code: int
    district_code: int
    type: str
    affiliated_dab_id: str | None = None
    onboarding_level: str = "FULL"
    did: str


CourseLevel = Literal["DIPLOMA", "UG", "PG", "PGDM", "PHD"]


class ProgramRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    program_code: str
    name: str
    course_level: str
    department: str | None = None
    duration_years: int
    lateral_allowed: bool = False


class CreateProgramRequest(BaseModel):
    program_code: str
    name: str
    course_level: str
    department: str | None = None
    duration_years: int
    lateral_allowed: bool = False


class AcademicYearRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    academic_year: str
    start_date: date
    end_date: date
    admission_window_start: date
    admission_window_end: date
    is_current: bool = False


class CreateAcademicYearRequest(BaseModel):
    academic_year: str
    start_date: date
    end_date: date
    admission_window_start: date
    admission_window_end: date
    is_current: bool = False


class EnumItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    value: str
    label_en: str
    label_hi: str


class CreateEnumItemRequest(BaseModel):
    enum_name: str
    value: str
    label_en: str
    label_hi: str


class DabRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    dab_id: str
    name: str
    type: str
    state_code: int
    did: str


class CreateDabRequest(BaseModel):
    dab_id: str
    name: str
    type: str
    state_code: int
    did: str
