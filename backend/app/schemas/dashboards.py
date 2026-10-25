"""
Pydantic schemas for Apex AICTE and Institution Dashboard APIs.
Complies with Task B7 item 4.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AicteSummaryDashboard(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    institutions: int = Field(..., description="Total AICTE approved institutions")
    coverage_percent: float = Field(
        ..., description="Percentage of institutions with active batches"
    )
    students: int = Field(..., description="Total student records enrolled")
    fill_percent: float = Field(
        ..., description="Overall enrollment vs approved intake percentage"
    )
    excess_enrolment: int = Field(
        ..., description="Total excess seats flagged over sanctioned intake"
    )
    supernumerary_breakdown: dict[str, int] = Field(
        ...,
        description="Quota breakdown: NRI, OCI, FN, and other supernumerary admissions",
    )
    dq_avg: float = Field(..., description="Weighted average data quality score across all batches")
    cached_at: datetime = Field(..., description="Timestamp of cached computation")


class StateMetric(BaseModel):
    lgd_state_code: int
    state_name: str
    metric_value: float
    institutions: int
    students: int
    fill_percent: float
    dq_avg: float
    excess_enrolment: int


class AicteMapMetricResponse(BaseModel):
    metric: str
    unit: str
    states: list[StateMetric]
    national_average: float
    cached_at: datetime


class AicteLeaderboardItem(BaseModel):
    institution_aicte_id: str
    institution_name: str
    state_name: str | None = None
    metric_value: float | int
    detail: str | None = None


class AicteLeaderboards(BaseModel):
    excess_enrolment: list[AicteLeaderboardItem] = Field(
        ..., description="Top institutions exceeding sanctioned intake"
    )
    low_dq: list[AicteLeaderboardItem] = Field(
        ..., description="Institutions with lowest average data quality score"
    )
    most_cross_dupes: list[AicteLeaderboardItem] = Field(
        ..., description="Institutions with most cross-institution duplicate student flags"
    )
    cached_at: datetime


class AnomalyFeedItem(BaseModel):
    id: str
    institution_aicte_id: str
    institution_name: str
    anomaly_type: str
    severity: str
    description: str
    detected_at: datetime


class InstitutionSummaryDashboard(BaseModel):
    institution_aicte_id: str
    institution_name: str
    total_students: int
    sanctioned_intake: int
    fill_percent: float
    active_batches: int
    avg_quality_score: float
    latest_quality_score: float | None = None
    pending_reviews: int
    excess_seats: int
    cached_at: datetime


class DqTrendPoint(BaseModel):
    batch_id: str
    batch_number: int | None = None
    quality_score: float
    committed_at: datetime


class InstitutionDqTrend(BaseModel):
    institution_aicte_id: str
    data_points: list[DqTrendPoint]
    trend_direction: str  # IMPROVING, STABLE, DECLINING
    cached_at: datetime
