"""
Canonical Pydantic v2 data models for EduVerify Engine.
Mirrors agents.md §5.3, §8, and contracts/schemas/batch_report.json.
"""

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class ColumnMapping(BaseModel):
    model_config = ConfigDict(extra="forbid")
    source: str = Field(..., description="Uploaded column name")
    target: str = Field(..., description="Canonical student_record field name")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Match confidence")
    method: Literal["synonym", "fuzzy", "user", "sniffed", "exact"] = Field(
        ..., description="Resolution method"
    )


class SuggestedFix(BaseModel):
    model_config = ConfigDict(extra="forbid")
    value: Any = Field(..., description="Suggested replacement value")
    rationale: str = Field(..., description="Reason for this suggested fix")
    requires_approval: bool = Field(
        default=True, description="Whether human confirmation is required"
    )


class Issue(BaseModel):
    model_config = ConfigDict(extra="forbid")
    issue_id: str = Field(..., description="Unique issue UUID")
    row: int | None = Field(default=None, description="1-indexed row number in uploaded file")
    record_key: str | None = Field(default=None, description="Institution student ID or key")
    field: str = Field(..., description="Target field name or column")
    rule_id: str = Field(..., description="Rule code (e.g. V001..V035)")
    severity: Literal["ERROR", "WARN", "INFO"] = Field(..., description="Issue severity")
    priority: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"] = Field(
        ..., description="Risk-based priority"
    )
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Rule engine confidence")
    bucket: Literal["AUTO_FLAG", "HUMAN_REVIEW", "INFO"] = Field(
        ..., description="Review routing bucket"
    )
    message: str = Field(..., description="Short plain-English summary")
    reason: str = Field(..., description="Explainable reason detailing numbers/values")
    evidence: dict[str, Any] = Field(
        default_factory=dict, description="Contextual key-values demonstrating the defect"
    )
    suggested_fix: SuggestedFix | None = Field(
        default=None, description="Deterministic suggested correction if safe"
    )
    value_masked: str | None = Field(
        default=None, description="Masked representation of offending value"
    )


class DuplicateMember(BaseModel):
    model_config = ConfigDict(extra="forbid")
    row: int | None = Field(default=None, description="Row number if in current batch")
    apaar_masked: str = Field(..., description="Masked APAAR ID (1234****9012)")
    institution: str | None = Field(default=None, description="Institution AICTE ID")
    student_id: str | None = Field(default=None, description="Roll/PRN/Student ID")


class DuplicateCluster(BaseModel):
    model_config = ConfigDict(extra="forbid")
    cluster_id: str = Field(..., description="Cluster identifier")
    members: list[DuplicateMember] = Field(..., description="Cluster candidate records")
    score: float = Field(..., ge=0.0, le=1.0, description="Composite similarity score")
    matched_fields: dict[str, float] = Field(
        default_factory=dict, description="Per-field similarity scores"
    )
    scope: Literal["INTRA", "CROSS_INSTITUTION"] = Field(
        ..., description="Within same batch or across institutions"
    )
    bucket: Literal["AUTO_FLAG", "HUMAN_REVIEW"] = Field(..., description="Review routing bucket")


class SchemaDrift(BaseModel):
    model_config = ConfigDict(extra="forbid")
    kind: Literal[
        "COLUMN_REMOVED",
        "TYPE_CHANGED",
        "NEW_CATEGORY",
        "NULL_RATE_JUMP",
    ] = Field(..., description="Drift classification")
    column: str = Field(..., description="Affected column name")
    previous: Any = Field(..., description="Baseline value from prior batch")
    current: Any = Field(..., description="Detected value in current batch")


class Anomaly(BaseModel):
    model_config = ConfigDict(extra="forbid")
    metric: str = Field(..., description="Metric name (e.g. nri_share, null_rate)")
    value: float = Field(..., description="Current batch metric value")
    baseline: float = Field(..., description="Historical baseline metric")
    z: float = Field(..., description="Z-score deviation")
    method: Literal["zscore", "isolation_forest"] = Field(
        ..., description="Statistical detection method"
    )
    reason: str = Field(..., description="Explainable description of anomaly")


class IntakeSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")
    program_code: str = Field(..., description="AICTE program code")
    approved: int = Field(..., ge=0, description="Approved intake count")
    enrolled: int = Field(..., ge=0, description="Regular enrolled student count")
    supernumerary: int = Field(..., ge=0, description="Supernumerary student count")
    excess: int = Field(..., description="Enrolment excess beyond approved quota")


class ReconciliationRow(BaseModel):
    model_config = ConfigDict(extra="forbid")
    program_code: str = Field(..., description="AICTE program code")
    declared: int = Field(..., ge=0, description="Total declared in approval process")
    uploaded: int = Field(..., ge=0, description="Total uploaded student-level records")
    delta: int = Field(..., description="Difference (uploaded - declared)")
    status: Literal["MATCH", "MISMATCH"] = Field(
        ..., description="Reconciliation status within tolerance"
    )


class BatchReport(BaseModel):
    model_config = ConfigDict(extra="forbid")
    batch_id: str = Field(..., description="Batch UUID")
    institution_aicte_id: str = Field(..., description="AICTE institution ID")
    engine_version: str = Field(default="1.0.0", description="Semantic version of engine")
    rule_catalog_version: str = Field(
        default="1.0.0", description="Semantic version of rule catalog"
    )
    rows_total: int = Field(default=0, ge=0, description="Total rows in batch")
    rows_valid: int = Field(default=0, ge=0, description="Rows with no errors or warnings")
    rows_warning: int = Field(default=0, ge=0, description="Rows with warnings only")
    rows_error: int = Field(default=0, ge=0, description="Rows with fatal errors")
    quality_score: float = Field(
        default=100.0, ge=0.0, le=100.0, description="Batch quality score [0..100]"
    )
    column_mapping: list[ColumnMapping] = Field(
        default_factory=list, description="Resolved column mapping"
    )
    metrics: dict[str, dict[str, float]] = Field(
        default_factory=dict,
        description="Deequ-style metrics: completeness, validity, uniqueness",
    )
    issues: list[Issue] = Field(
        default_factory=list, description="All detected issues sorted by priority"
    )
    review_summary: dict[str, int] = Field(
        default_factory=lambda: {"AUTO_FLAG": 0, "HUMAN_REVIEW": 0, "INFO": 0},
        description="Issue count per review bucket",
    )
    priority_summary: dict[str, int] = Field(
        default_factory=lambda: {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0},
        description="Issue count per priority",
    )
    intake_summary: list[IntakeSummary] = Field(
        default_factory=list, description="Per-program intake compliance"
    )
    reconciliation: list[ReconciliationRow] = Field(
        default_factory=list, description="Reconciliation against declared totals"
    )
    duplicate_clusters: list[DuplicateCluster] = Field(
        default_factory=list, description="Grouped duplicate clusters"
    )
    schema_drift: list[SchemaDrift] = Field(
        default_factory=list, description="Detected schema drift events"
    )
    anomalies: list[Anomaly] = Field(
        default_factory=list, description="Statistical anomalies vs history"
    )


class DQComparison(BaseModel):
    model_config = ConfigDict(extra="forbid")
    rows_scanned: int = Field(..., ge=0)
    errors_found: int = Field(..., ge=0)
    duplicates_found: int = Field(..., ge=0)
    resolved: int = Field(..., ge=0, description="Accepted fix, dismissed, or merged")
    pending: int = Field(..., ge=0, description="Awaiting human decision")
    quality_score_before: float = Field(..., ge=0.0, le=100.0)
    quality_score_after: float = Field(..., ge=0.0, le=100.0)
    per_rule_deltas: dict[str, int] = Field(default_factory=dict)
    per_priority_deltas: dict[str, int] = Field(default_factory=dict)
    per_column_completeness_before: dict[str, float] = Field(default_factory=dict)
    per_column_completeness_after: dict[str, float] = Field(default_factory=dict)
