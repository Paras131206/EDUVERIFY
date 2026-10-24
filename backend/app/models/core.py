"""
SQLAlchemy ORM models for EduVerify core data architecture.
Complies with agents.md §5, §7, §8 and prompt B2.
"""

import uuid
from datetime import UTC, date, datetime
from typing import Any

from app.db import Base
from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    LargeBinary,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship


class State(Base):
    """Local Government Directory (LGD) state master record."""

    __tablename__ = "states"

    lgd_state_code: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    name_hi: Mapped[str] = mapped_column(String(100), nullable=False)

    districts: Mapped[list["District"]] = relationship(
        "District", back_populates="state", cascade="all, delete-orphan"
    )


class District(Base):
    """Local Government Directory (LGD) district master record."""

    __tablename__ = "districts"

    lgd_district_code: Mapped[int] = mapped_column(Integer, primary_key=True)
    lgd_state_code: Mapped[int] = mapped_column(
        Integer, ForeignKey("states.lgd_state_code", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    state: Mapped["State"] = relationship("State", back_populates="districts")


class DegreeAwardingBody(Base):
    """Degree Awarding Body (DAB) e.g. affiliating university or autonomous institution."""

    __tablename__ = "degree_awarding_bodies"

    dab_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # UNIVERSITY, DEEMED, AUTONOMOUS_INSTITUTION
    state_code: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    did: Mapped[str] = mapped_column(String(255), nullable=False)

    institutions: Mapped[list["Institution"]] = relationship(
        "Institution", back_populates="affiliated_dab"
    )


class Institution(Base):
    """AICTE-approved educational institution."""

    __tablename__ = "institutions"

    institution_aicte_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    state_code: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    district_code: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    affiliated_dab_id: Mapped[str | None] = mapped_column(
        String(50),
        ForeignKey("degree_awarding_bodies.dab_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    onboarding_level: Mapped[str] = mapped_column(
        String(50), nullable=False, default="FULL"
    )  # FULL, AGGREGATE_ONLY
    did: Mapped[str] = mapped_column(String(255), nullable=False)

    affiliated_dab: Mapped[DegreeAwardingBody | None] = relationship(
        "DegreeAwardingBody", back_populates="institutions"
    )


class Program(Base):
    """Academic program/course specification."""

    __tablename__ = "programs"

    program_code: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    course_level: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )  # DIPLOMA, UG, PG, PGDM, PHD
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    duration_years: Mapped[int] = mapped_column(Integer, nullable=False)
    lateral_allowed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class AcademicYear(Base):
    """Academic year specification with admission window timeline."""

    __tablename__ = "academic_years"

    academic_year: Mapped[str] = mapped_column(String(20), primary_key=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    admission_window_start: Mapped[date] = mapped_column(Date, nullable=False)
    admission_window_end: Mapped[date] = mapped_column(Date, nullable=False)
    is_current: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class EnumItem(Base):
    """Bilingual canonical enumerated value for UI dropdowns and validation."""

    __tablename__ = "enums"

    enum_name: Mapped[str] = mapped_column(String(50), primary_key=True)
    value: Mapped[str] = mapped_column(String(50), primary_key=True)
    label_en: Mapped[str] = mapped_column(String(255), nullable=False)
    label_hi: Mapped[str] = mapped_column(String(255), nullable=False)


class ProgramIntake(Base):
    """Approved intake and supernumerary caps per institution, program, and academic year."""

    __tablename__ = "program_intake"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    institution_aicte_id: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("institutions.institution_aicte_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    program_code: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("programs.program_code", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    academic_year: Mapped[str] = mapped_column(
        String(20),
        ForeignKey("academic_years.academic_year", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    approved_intake: Mapped[int] = mapped_column(Integer, nullable=False)
    supernumerary_allowed: Mapped[dict[str, Any]] = mapped_column(
        JSON, nullable=False, default=dict
    )
    approval_letter_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)

    __table_args__ = (
        UniqueConstraint(
            "institution_aicte_id", "program_code", "academic_year", name="uq_program_intake"
        ),
    )


class DeclaredTotal(Base):
    """Statistical intake totals submitted during approval or aggregate mode."""

    __tablename__ = "declared_totals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    institution_aicte_id: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("institutions.institution_aicte_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    program_code: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("programs.program_code", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    academic_year: Mapped[str] = mapped_column(
        String(20),
        ForeignKey("academic_years.academic_year", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    declared_enrolment: Mapped[int] = mapped_column(Integer, nullable=False)
    declared_supernumerary: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    declared_nri: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    declared_oci: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    declared_fn: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    source: Mapped[str] = mapped_column(
        String(50), nullable=False, default="APPROVAL_PROCESS"
    )  # APPROVAL_PROCESS | AGGREGATE_MODE
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "institution_aicte_id", "program_code", "academic_year", name="uq_declared_totals"
        ),
    )


class Batch(Base):
    """Batch ingestion lifecycle entity supporting versioning and optimistic concurrency."""

    __tablename__ = "batches"

    batch_id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    institution_aicte_id: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("institutions.institution_aicte_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    academic_year: Mapped[str] = mapped_column(
        String(20),
        ForeignKey("academic_years.academic_year", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # State machine: UPLOADED -> MAPPING -> VALIDATING -> VALIDATED
    # -> (IN_REVIEW) -> COMMITTED | REJECTED | SUPERSEDED | FAILED
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="UPLOADED", index=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    supersedes_batch_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    idempotency_key: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    column_mapping_json: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(
        JSON, nullable=True
    )
    engine_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    catalog_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    quality_score_before: Mapped[float | None] = mapped_column(Float, nullable=True)
    quality_score_after: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )


class BatchFile(Base):
    """Raw uploaded student batch payload (stored as bytea/BLOB)."""

    __tablename__ = "batch_files"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("batches.batch_id", ondelete="CASCADE"), nullable=False, index=True
    )
    file_data: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )


class BatchReport(Base):
    """Full batch evaluation report generated by the validation engine."""

    __tablename__ = "batch_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("batches.batch_id", ondelete="CASCADE"), nullable=False, index=True
    )
    report_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )


class Issue(Base):
    """Flattened validation issue entity with explainable reasoning and suggested fixes."""

    __tablename__ = "issues"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("batches.batch_id", ondelete="CASCADE"), nullable=False, index=True
    )
    rule_id: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    row_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    field_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    apaar_id: Mapped[str | None] = mapped_column(String(12), nullable=True, index=True)
    severity: Mapped[str] = mapped_column(
        String(20), nullable=False, index=True
    )  # ERROR, WARN, INFO
    priority: Mapped[str] = mapped_column(
        String(20), nullable=False, index=True
    )  # CRITICAL, HIGH, MEDIUM, LOW
    bucket: Mapped[str] = mapped_column(
        String(30), nullable=False, index=True
    )  # AUTO_FLAG, HUMAN_REVIEW, INFO
    message: Mapped[str] = mapped_column(Text, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    evidence_json: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    suggested_fix_json: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    value_masked: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="OPEN", index=True
    )  # OPEN, ACCEPTED, DISMISSED, FIXED
    decided_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Correction(Base):
    """Human-approved record correction tracking old/new encrypted values."""

    __tablename__ = "corrections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("batches.batch_id", ondelete="CASCADE"), nullable=True, index=True
    )
    issue_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("issues.id", ondelete="SET NULL"), nullable=True, index=True
    )
    apaar_id: Mapped[str | None] = mapped_column(String(12), nullable=True, index=True)
    field: Mapped[str] = mapped_column(String(100), nullable=False)
    old_value_enc: Mapped[str | None] = mapped_column(Text, nullable=True)
    new_value_enc: Mapped[str | None] = mapped_column(Text, nullable=True)
    proposed_by: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=False
    )
    approved_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="PENDING", index=True
    )  # PENDING, APPROVED, REJECTED
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class DuplicateFlag(Base):
    """Fuzzy duplicate identity cluster across or within institutions."""

    __tablename__ = "duplicate_flags"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("batches.batch_id", ondelete="CASCADE"), nullable=True, index=True
    )
    cluster_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    apaar_id: Mapped[str] = mapped_column(String(12), nullable=False, index=True)
    matched_apaar_id: Mapped[str | None] = mapped_column(String(12), nullable=True, index=True)
    matched_institution_id: Mapped[str | None] = mapped_column(
        String(100), nullable=True, index=True
    )
    similarity_score: Mapped[float] = mapped_column(Float, nullable=False)
    match_type: Mapped[str] = mapped_column(
        String(30), nullable=False, index=True
    )  # INTRA, CROSS_INSTITUTION
    matched_fields_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="OPEN", index=True
    )  # OPEN, SAME_PERSON, DIFFERENT_PEOPLE, TRANSFER
    decided_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class StudentRecord(Base):
    """Canonical student record committed to the AICTE Central Repository."""

    __tablename__ = "student_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    apaar_id: Mapped[str] = mapped_column(String(12), unique=True, nullable=False, index=True)
    apaar_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    institution_aicte_id: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("institutions.institution_aicte_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    institution_student_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    dob: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String(10), nullable=False)
    category: Mapped[str] = mapped_column(String(20), nullable=False)
    pwd: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    program_code: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("programs.program_code", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    course_level: Mapped[str] = mapped_column(String(20), nullable=False)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    academic_year: Mapped[str] = mapped_column(
        String(20),
        ForeignKey("academic_years.academic_year", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    year_of_study: Mapped[int] = mapped_column(Integer, nullable=False)
    admission_date: Mapped[date] = mapped_column(Date, nullable=False)
    admission_type: Mapped[str] = mapped_column(String(30), nullable=False)
    expected_graduation_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    seat_type: Mapped[str] = mapped_column(String(30), nullable=False)
    supernumerary_scheme: Mapped[str | None] = mapped_column(String(50), nullable=True)
    quota: Mapped[str] = mapped_column(String(30), nullable=False)
    nationality: Mapped[str] = mapped_column(String(10), nullable=False, default="IN")
    nri_status: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    oci_status: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    fn_status: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    enrolment_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="ACTIVE", index=True
    )  # ACTIVE, WITHDRAWN, DEFERRED, TRANSFERRED_OUT, COMPLETED, GRADUATED
    consent_status: Mapped[str] = mapped_column(String(30), nullable=False, default="GRANTED")
    consent_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    guardian_consent: Mapped[bool | None] = mapped_column(Boolean, nullable=True, default=False)
    email_enc: Mapped[str | None] = mapped_column(Text, nullable=True)
    mobile_enc: Mapped[str | None] = mapped_column(Text, nullable=True)
    record_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )


class StudentRecordVersion(Base):
    """Immutable audit snapshot of previous student record versions."""

    __tablename__ = "student_record_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    apaar_id: Mapped[str] = mapped_column(String(12), nullable=False, index=True)
    record_version: Mapped[int] = mapped_column(Integer, nullable=False)
    snapshot_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    changed_by: Mapped[str] = mapped_column(String(36), nullable=False)
    change_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )


class Transfer(Base):
    """Inter-institution student transfer record."""

    __tablename__ = "transfers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    apaar_id: Mapped[str] = mapped_column(String(12), nullable=False, index=True)
    source_institution_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    dest_institution_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    academic_year: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="PENDING", index=True
    )  # PENDING, APPROVED, REJECTED, CANCELLED, OVERRIDDEN
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    decided_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    evidence_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)


class ConsentLedger(Base):
    """DPDP Act consent ledger entry with immutable cryptographic chaining."""

    __tablename__ = "consent_ledger"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    apaar_id: Mapped[str] = mapped_column(String(12), nullable=False, index=True)
    apaar_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    purpose: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # REPOSITORY, VERIFICATION_SHARE, ANALYTICS_AGGREGATE
    status: Mapped[str] = mapped_column(String(30), nullable=False)  # GRANTED, REFUSED, WITHDRAWN
    effective_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    guardian_consent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    signature_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    prev_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    hash: Mapped[str | None] = mapped_column(String(64), nullable=True)


class Credential(Base):
    """W3C / IETF SD-JWT Verifiable Credential instance."""

    __tablename__ = "credentials"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    credential_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    apaar_id: Mapped[str] = mapped_column(String(12), nullable=False, index=True)
    apaar_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    institution_aicte_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    dab_id: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    credential_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # EduVerifyEnrolmentCredential, EduVerifyDegreeCredential
    record_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    sd_jwt_compact: Mapped[str] = mapped_column(Text, nullable=False)
    holder_binding_jwk_json: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="VALID", index=True
    )  # VALID, REVOKED, SUPERSEDED, SUSPENDED
    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status_list_index: Mapped[int | None] = mapped_column(Integer, nullable=True)


class StatusList(Base):
    """W3C Token Status List bitstring state storage."""

    __tablename__ = "status_lists"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    list_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="BitstringStatusListEntry"
    )
    bitstring_data: Mapped[str] = mapped_column(Text, nullable=False)
    length: Mapped[int] = mapped_column(Integer, nullable=False, default=131072)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )


class Webhook(Base):
    """Institution registered webhook endpoint."""

    __tablename__ = "webhooks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_aicte_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    url: Mapped[str] = mapped_column(String(255), nullable=False)
    secret_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    events: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )


class WebhookDelivery(Base):
    """Webhook dispatch delivery attempt log."""

    __tablename__ = "webhook_deliveries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    webhook_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("webhooks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    payload_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="SUCCESS", index=True
    )  # SUCCESS, FAILED, RETRYING
    response_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    delivered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )


class NotificationOutbox(Base):
    """Asynchronous notification outbox for email and SMS alerts."""

    __tablename__ = "notifications_outbox"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    recipient: Mapped[str] = mapped_column(String(255), nullable=False)
    channel: Mapped[str] = mapped_column(String(20), nullable=False, default="EMAIL")  # EMAIL, SMS
    subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="PENDING", index=True
    )  # PENDING, SENT, FAILED
    retry_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)


class MetricHistory(Base):
    """Historical data quality and aggregate metrics per batch commitment."""

    __tablename__ = "metric_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_aicte_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    academic_year: Mapped[str | None] = mapped_column(String(20), nullable=True)
    batch_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rows_total: Mapped[int] = mapped_column(Integer, nullable=False)
    null_rate: Mapped[float] = mapped_column(Float, nullable=False)
    nri_share: Mapped[float] = mapped_column(Float, nullable=False)
    supernumerary_share: Mapped[float] = mapped_column(Float, nullable=False)
    duplicate_rate: Mapped[float] = mapped_column(Float, nullable=False)
    quality_score: Mapped[float] = mapped_column(Float, nullable=False)
    committed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )


class ColumnMappingProfile(Base):
    """Saved smart column mapping profiles for recurring institution uploads."""

    __tablename__ = "column_mapping_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_aicte_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    mapping_json: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )


class Job(Base):
    """DB-backed background processing job with resumable state."""

    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )  # MAPPING, VALIDATION, REVALIDATION, ROLLOVER, REPORT_EXPORT
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="PENDING", index=True
    )  # PENDING, RUNNING, COMPLETED, FAILED
    progress: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    batch_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    parameters_json: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    result_json: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class MockApaarRegistry(Base):
    """Database-backed mock APAAR central registry for identity verification."""

    __tablename__ = "mock_apaar_registry"

    apaar_id: Mapped[str] = mapped_column(String(12), primary_key=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    dob: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String(10), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )


class IssuerKey(Base):
    """Ed25519 issuer private/public key storage encrypted at rest."""

    __tablename__ = "issuer_keys"

    issuer_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    did: Mapped[str] = mapped_column(String(255), nullable=False)
    key_id: Mapped[str] = mapped_column(String(100), nullable=False, default="key-1")
    encrypted_private_key: Mapped[str] = mapped_column(Text, nullable=False)
    public_key_jwk_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )


class HolderKey(Base):
    """Registered student browser WebCrypto public JWK for SD-JWT key binding."""

    __tablename__ = "holder_keys"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    apaar_id: Mapped[str] = mapped_column(String(12), nullable=False, index=True)
    apaar_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    jwk_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )


class VerificationNonce(Base):
    """Short-lived challenge nonce for replay protection."""

    __tablename__ = "verification_nonces"

    nonce: Mapped[str] = mapped_column(String(64), primary_key=True)
    aud: Mapped[str | None] = mapped_column(String(255), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )


class ShortLink(Base):
    """Short-lived 24-hour presentation short links for compact QR codes."""

    __tablename__ = "short_links"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    credential_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    presentation_data: Mapped[str] = mapped_column(Text, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
