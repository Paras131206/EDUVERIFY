"""
Pydantic schemas for Student Transfers workflow.
Complies with contracts/openapi.yaml and Task B4.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CreateTransferRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    apaar_id: str = Field(..., pattern=r"^\d{12}$", description="12-digit student APAAR ID")
    from_institution_id: str = Field(..., description="Source institution AICTE ID")
    to_program_code: str = Field(..., description="Destination program code")
    academic_year: str | None = Field(default=None, description="Academic year of transfer")
    transfer_certificate_ref: str | None = Field(
        default=None, description="Reference ID or hash of TC document"
    )
    reason: str | None = Field(default=None, description="Transfer justification")


class TransferRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="ignore", populate_by_name=True)
    transfer_id: str = Field(..., validation_alias="id")
    id: str = Field(..., validation_alias="id")
    apaar_id: str
    from_institution_id: str = Field(..., validation_alias="source_institution_id")
    source_institution_id: str = Field(..., validation_alias="source_institution_id")
    to_institution_id: str = Field(..., validation_alias="dest_institution_id")
    dest_institution_id: str = Field(..., validation_alias="dest_institution_id")
    academic_year: str
    status: str = Field(
        default="PENDING", description="PENDING, APPROVED, REJECTED, CANCELLED, OVERRIDDEN"
    )
    reason: str | None = None
    evidence_ref: str | None = None
    requested_at: datetime
    decided_at: datetime | None = None
    decided_by: str | None = None


class TransferDecisionRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    decision: str = Field(..., description="APPROVED or REJECTED")
    remarks: str | None = Field(default=None, description="Decision remarks or notes")


class TransferOverrideRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    decision: str = Field(..., description="APPROVED or REJECTED")
    reason: str = Field(..., description="Mandatory AICTE statutory justification for override")
