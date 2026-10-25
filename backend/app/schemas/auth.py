"""
Pydantic v2 schemas for authentication, users, and API key management.
Complies with contracts/openapi.yaml and prompt B1.
"""

from datetime import datetime
from enum import Enum
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

EmailType = Annotated[
    str,
    StringConstraints(
        pattern=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$",
        to_lower=True,
        strip_whitespace=True,
    ),
    Field(json_schema_extra={"format": "email"}),
]
EmailStr = EmailType


class UserRole(str, Enum):
    AICTE_ADMIN = "AICTE_ADMIN"
    AICTE_ANALYST = "AICTE_ANALYST"
    DAB_ADMIN = "DAB_ADMIN"
    INSTITUTION_ADMIN = "INSTITUTION_ADMIN"
    INSTITUTION_STAFF = "INSTITUTION_STAFF"
    VERIFIER = "VERIFIER"
    STUDENT = "STUDENT"
    EMPLOYER = "EMPLOYER"


class UserProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    institution_aicte_id: str | None = None
    dab_id: str | None = None
    is_active: bool = True
    last_login_at: datetime | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=10)
    mfa_code: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = 900
    refresh_token: str | None = None
    user: UserProfile


class RefreshRequest(BaseModel):
    refresh_token: str | None = None


class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=10)
    full_name: str
    role: UserRole
    institution_aicte_id: str | None = None
    dab_id: str | None = None


class UpdateUserRequest(BaseModel):
    full_name: str | None = None
    is_active: bool | None = None
    role: UserRole | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=10)


ApiKeyScope = Literal["upload", "read"]


class CreateApiKeyRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    scopes: list[ApiKeyScope] = Field(min_length=1)


class ApiKeyMetadata(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    institution_aicte_id: str
    name: str
    prefix: str
    scopes: list[str]
    created_at: datetime
    last_used_at: datetime | None = None


class ApiKeyCreatedResponse(BaseModel):
    id: str
    name: str
    prefix: str
    raw_key: str
    scopes: list[str]


class ErrorResponse(BaseModel):
    detail: str
    code: str | None = None
