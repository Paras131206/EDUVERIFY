"""
Pydantic schemas for DPDP Act 2023 consent management.
Complies with agents.md §8.4 and Task B5.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ConsentPurpose = Literal[
    "REPOSITORY",
    "VERIFICATION_SHARE",
    "ANALYTICS_AGGREGATE",
    "EMPLOYER_HIRING",
]
ConsentAction = Literal["GRANT", "WITHDRAW"]


class ConsentRecordRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    purpose: ConsentPurpose = Field(
        ...,
        description="Consent purpose: REPOSITORY, VERIFICATION_SHARE, or ANALYTICS_AGGREGATE",
    )
    action: ConsentAction = Field(
        ...,
        description="Consent action: GRANT or WITHDRAW",
    )
    apaar_id: str | None = Field(
        default=None,
        pattern=r"^\d{12}$",
        description="Student APAAR ID (required when recorded by institution on behalf of student)",
    )
    evidence_ref: str | None = Field(
        default=None,
        description="Reference ID or hash of parental/guardian consent form or documentation",
    )
    guardian_consent: bool = Field(
        default=False,
        description="True if consent is executed by parent/guardian for a minor student",
    )


class ConsentItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="ignore")

    id: int
    apaar_id: str
    purpose: str
    status: str = Field(description="GRANTED or WITHDRAWN")
    effective_at: datetime
    guardian_consent: bool
    signature_ref: str | None = None
    prev_hash: str | None = None
    hash: str | None = None


class StudentConsentSummaryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    apaar_id: str
    consents: dict[str, str] = Field(
        description="Current state per purpose (REPOSITORY, VERIFICATION_SHARE, ANALYTICS)"
    )
    history: list[ConsentItemResponse] = Field(default_factory=list)
