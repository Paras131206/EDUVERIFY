"""
Pydantic schemas initialization and re-exports.
"""

from app.schemas.aggregates import (
    AggregateProgramItem,
    AggregateSubmissionRequest,
    DeclaredTotalCreateRequest,
    DeclaredTotalResponse,
    ReconciliationItemResponse,
    ReconciliationResponse,
)
from app.schemas.audit import (
    AuditChainVerificationResponse,
    AuditListResponse,
    AuditLogEntryResponse,
    RetentionPurgeResponse,
)
from app.schemas.auth import (
    ApiKeyCreatedResponse,
    ApiKeyMetadata,
    ApiKeyScope,
    ChangePasswordRequest,
    CreateApiKeyRequest,
    CreateUserRequest,
    ErrorResponse,
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    UpdateUserRequest,
    UserProfile,
    UserRole,
)
from app.schemas.batches import (
    BatchIssueResponse,
    BatchSummary,
    ColumnMappingModel,
    CommitRequest,
    CommitResponse,
    ConfirmMappingRequest,
    EventTicketResponse,
)
from app.schemas.consent import (
    ConsentAction,
    ConsentItemResponse,
    ConsentPurpose,
    ConsentRecordRequest,
    StudentConsentSummaryResponse,
)
from app.schemas.duplicates import (
    DuplicateClusterResponse,
    DuplicateResolutionRequest,
)
from app.schemas.issues import (
    CorrectionCreateRequest,
    CorrectionResponse,
    DQComparisonResponse,
    IssueDecisionRequest,
)
from app.schemas.rollover import (
    RolloverRequest,
    RolloverSummaryResponse,
)
from app.schemas.students import (
    LifecycleTransitionRequest,
    StudentRecordResponse,
    StudentUpdateRequest,
)
from app.schemas.transfers import (
    CreateTransferRequest,
    TransferDecisionRequest,
    TransferOverrideRequest,
    TransferRecordResponse,
)

__all__ = [
    "AggregateProgramItem",
    "AggregateSubmissionRequest",
    "ApiKeyCreatedResponse",
    "ApiKeyMetadata",
    "ApiKeyScope",
    "AuditChainVerificationResponse",
    "AuditListResponse",
    "AuditLogEntryResponse",
    "BatchIssueResponse",
    "BatchSummary",
    "ChangePasswordRequest",
    "ColumnMappingModel",
    "CommitRequest",
    "CommitResponse",
    "ConfirmMappingRequest",
    "ConsentAction",
    "ConsentItemResponse",
    "ConsentPurpose",
    "ConsentRecordRequest",
    "CorrectionCreateRequest",
    "CorrectionResponse",
    "CreateApiKeyRequest",
    "CreateTransferRequest",
    "CreateUserRequest",
    "DQComparisonResponse",
    "DeclaredTotalCreateRequest",
    "DeclaredTotalResponse",
    "DuplicateClusterResponse",
    "DuplicateResolutionRequest",
    "ErrorResponse",
    "EventTicketResponse",
    "IssueDecisionRequest",
    "LifecycleTransitionRequest",
    "LoginRequest",
    "LoginResponse",
    "ReconciliationItemResponse",
    "ReconciliationResponse",
    "RefreshRequest",
    "RetentionPurgeResponse",
    "RolloverRequest",
    "RolloverSummaryResponse",
    "StudentConsentSummaryResponse",
    "StudentRecordResponse",
    "StudentUpdateRequest",
    "TransferDecisionRequest",
    "TransferOverrideRequest",
    "TransferRecordResponse",
    "UpdateUserRequest",
    "UserProfile",
    "UserRole",
]
