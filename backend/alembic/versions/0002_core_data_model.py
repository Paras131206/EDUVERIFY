"""Core data model: master data, batches, validation issues, student records,
credentials, and ledger.

Revision ID: 0002_core_data_model
Revises: 0001_initial_auth
Create Date: 2026-10-24 16:45:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_core_data_model"
down_revision: str | None = "0001_initial_auth"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. States table
    op.create_table(
        "states",
        sa.Column("lgd_state_code", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("name_hi", sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint("lgd_state_code"),
    )

    # 2. Districts table
    op.create_table(
        "districts",
        sa.Column("lgd_district_code", sa.Integer(), nullable=False),
        sa.Column("lgd_state_code", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.ForeignKeyConstraint(["lgd_state_code"], ["states.lgd_state_code"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("lgd_district_code"),
    )
    op.create_index(
        op.f("ix_districts_lgd_state_code"), "districts", ["lgd_state_code"], unique=False
    )

    # 3. Degree Awarding Bodies table
    op.create_table(
        "degree_awarding_bodies",
        sa.Column("dab_id", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("state_code", sa.Integer(), nullable=False),
        sa.Column("did", sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint("dab_id"),
    )
    op.create_index(
        op.f("ix_degree_awarding_bodies_state_code"),
        "degree_awarding_bodies",
        ["state_code"],
        unique=False,
    )

    # 4. Institutions table
    op.create_table(
        "institutions",
        sa.Column("institution_aicte_id", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("state_code", sa.Integer(), nullable=False),
        sa.Column("district_code", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("affiliated_dab_id", sa.String(length=50), nullable=True),
        sa.Column("onboarding_level", sa.String(length=50), nullable=False, server_default="FULL"),
        sa.Column("did", sa.String(length=255), nullable=False),
        sa.ForeignKeyConstraint(
            ["affiliated_dab_id"], ["degree_awarding_bodies.dab_id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("institution_aicte_id"),
    )
    op.create_index(
        op.f("ix_institutions_state_code"), "institutions", ["state_code"], unique=False
    )
    op.create_index(
        op.f("ix_institutions_district_code"), "institutions", ["district_code"], unique=False
    )
    op.create_index(
        op.f("ix_institutions_affiliated_dab_id"),
        "institutions",
        ["affiliated_dab_id"],
        unique=False,
    )

    # 5. Programs table
    op.create_table(
        "programs",
        sa.Column("program_code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("course_level", sa.String(length=50), nullable=False),
        sa.Column("department", sa.String(length=100), nullable=True),
        sa.Column("duration_years", sa.Integer(), nullable=False),
        sa.Column("lateral_allowed", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.PrimaryKeyConstraint("program_code"),
    )
    op.create_index(op.f("ix_programs_course_level"), "programs", ["course_level"], unique=False)

    # 6. Academic Years table
    op.create_table(
        "academic_years",
        sa.Column("academic_year", sa.String(length=20), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("admission_window_start", sa.Date(), nullable=False),
        sa.Column("admission_window_end", sa.Date(), nullable=False),
        sa.Column("is_current", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.PrimaryKeyConstraint("academic_year"),
    )

    # 7. Enums table
    op.create_table(
        "enums",
        sa.Column("enum_name", sa.String(length=50), nullable=False),
        sa.Column("value", sa.String(length=50), nullable=False),
        sa.Column("label_en", sa.String(length=255), nullable=False),
        sa.Column("label_hi", sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint("enum_name", "value"),
    )

    # 8. Program Intake table
    op.create_table(
        "program_intake",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("institution_aicte_id", sa.String(length=100), nullable=False),
        sa.Column("program_code", sa.String(length=50), nullable=False),
        sa.Column("academic_year", sa.String(length=20), nullable=False),
        sa.Column("approved_intake", sa.Integer(), nullable=False),
        sa.Column("supernumerary_allowed", sa.JSON(), nullable=False),
        sa.Column("approval_letter_ref", sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(
            ["institution_aicte_id"], ["institutions.institution_aicte_id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["program_code"], ["programs.program_code"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["academic_year"], ["academic_years.academic_year"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "institution_aicte_id", "program_code", "academic_year", name="uq_program_intake"
        ),
    )
    op.create_index(
        op.f("ix_program_intake_institution_aicte_id"),
        "program_intake",
        ["institution_aicte_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_program_intake_program_code"), "program_intake", ["program_code"], unique=False
    )
    op.create_index(
        op.f("ix_program_intake_academic_year"), "program_intake", ["academic_year"], unique=False
    )

    # 9. Declared Totals table
    op.create_table(
        "declared_totals",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("institution_aicte_id", sa.String(length=100), nullable=False),
        sa.Column("program_code", sa.String(length=50), nullable=False),
        sa.Column("academic_year", sa.String(length=20), nullable=False),
        sa.Column("declared_enrolment", sa.Integer(), nullable=False),
        sa.Column("declared_supernumerary", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("declared_nri", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("declared_oci", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("declared_fn", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "source", sa.String(length=50), nullable=False, server_default="APPROVAL_PROCESS"
        ),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["institution_aicte_id"], ["institutions.institution_aicte_id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["program_code"], ["programs.program_code"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["academic_year"], ["academic_years.academic_year"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "institution_aicte_id", "program_code", "academic_year", name="uq_declared_totals"
        ),
    )
    op.create_index(
        op.f("ix_declared_totals_institution_aicte_id"),
        "declared_totals",
        ["institution_aicte_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_declared_totals_program_code"), "declared_totals", ["program_code"], unique=False
    )
    op.create_index(
        op.f("ix_declared_totals_academic_year"), "declared_totals", ["academic_year"], unique=False
    )

    # 10. Batches table
    op.create_table(
        "batches",
        sa.Column("batch_id", sa.String(length=36), nullable=False),
        sa.Column("institution_aicte_id", sa.String(length=100), nullable=False),
        sa.Column("academic_year", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="UPLOADED"),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("supersedes_batch_id", sa.String(length=36), nullable=True),
        sa.Column("idempotency_key", sa.String(length=128), nullable=True),
        sa.Column("column_mapping_json", sa.JSON(), nullable=True),
        sa.Column("engine_version", sa.String(length=50), nullable=True),
        sa.Column("catalog_version", sa.String(length=50), nullable=True),
        sa.Column("quality_score_before", sa.Float(), nullable=True),
        sa.Column("quality_score_after", sa.Float(), nullable=True),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["institution_aicte_id"], ["institutions.institution_aicte_id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["academic_year"], ["academic_years.academic_year"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("batch_id"),
    )
    op.create_index(
        op.f("ix_batches_institution_aicte_id"), "batches", ["institution_aicte_id"], unique=False
    )
    op.create_index(op.f("ix_batches_academic_year"), "batches", ["academic_year"], unique=False)
    op.create_index(op.f("ix_batches_status"), "batches", ["status"], unique=False)
    op.create_index(
        op.f("ix_batches_supersedes_batch_id"), "batches", ["supersedes_batch_id"], unique=False
    )
    op.create_index(
        op.f("ix_batches_idempotency_key"), "batches", ["idempotency_key"], unique=False
    )

    # 11. Batch Files table
    op.create_table(
        "batch_files",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("batch_id", sa.String(length=36), nullable=False),
        sa.Column("file_data", sa.LargeBinary(), nullable=False),
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["batch_id"], ["batches.batch_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_batch_files_batch_id"), "batch_files", ["batch_id"], unique=False)

    # 12. Batch Reports table
    op.create_table(
        "batch_reports",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("batch_id", sa.String(length=36), nullable=False),
        sa.Column("report_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["batch_id"], ["batches.batch_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_batch_reports_batch_id"), "batch_reports", ["batch_id"], unique=False)

    # 13. Issues table
    op.create_table(
        "issues",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("batch_id", sa.String(length=36), nullable=False),
        sa.Column("rule_id", sa.String(length=20), nullable=False),
        sa.Column("row_index", sa.Integer(), nullable=True),
        sa.Column("field_name", sa.String(length=100), nullable=True),
        sa.Column("apaar_id", sa.String(length=12), nullable=True),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("priority", sa.String(length=20), nullable=False),
        sa.Column("bucket", sa.String(length=30), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("evidence_json", sa.JSON(), nullable=True),
        sa.Column("suggested_fix_json", sa.JSON(), nullable=True),
        sa.Column("value_masked", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="OPEN"),
        sa.Column("decided_by", sa.String(length=36), nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["batch_id"], ["batches.batch_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["decided_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_issues_batch_id"), "issues", ["batch_id"], unique=False)
    op.create_index(op.f("ix_issues_rule_id"), "issues", ["rule_id"], unique=False)
    op.create_index(op.f("ix_issues_apaar_id"), "issues", ["apaar_id"], unique=False)
    op.create_index(op.f("ix_issues_severity"), "issues", ["severity"], unique=False)
    op.create_index(op.f("ix_issues_priority"), "issues", ["priority"], unique=False)
    op.create_index(op.f("ix_issues_bucket"), "issues", ["bucket"], unique=False)
    op.create_index(op.f("ix_issues_status"), "issues", ["status"], unique=False)

    # 14. Corrections table
    op.create_table(
        "corrections",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("batch_id", sa.String(length=36), nullable=True),
        sa.Column("issue_id", sa.String(length=36), nullable=True),
        sa.Column("apaar_id", sa.String(length=12), nullable=True),
        sa.Column("field", sa.String(length=100), nullable=False),
        sa.Column("old_value_enc", sa.Text(), nullable=True),
        sa.Column("new_value_enc", sa.Text(), nullable=True),
        sa.Column("proposed_by", sa.String(length=36), nullable=False),
        sa.Column("approved_by", sa.String(length=36), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="PENDING"),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["batch_id"], ["batches.batch_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["issue_id"], ["issues.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["proposed_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["approved_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_corrections_batch_id"), "corrections", ["batch_id"], unique=False)
    op.create_index(op.f("ix_corrections_issue_id"), "corrections", ["issue_id"], unique=False)
    op.create_index(op.f("ix_corrections_apaar_id"), "corrections", ["apaar_id"], unique=False)
    op.create_index(op.f("ix_corrections_status"), "corrections", ["status"], unique=False)

    # 15. Duplicate Flags table
    op.create_table(
        "duplicate_flags",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("batch_id", sa.String(length=36), nullable=True),
        sa.Column("cluster_id", sa.String(length=64), nullable=False),
        sa.Column("apaar_id", sa.String(length=12), nullable=False),
        sa.Column("matched_apaar_id", sa.String(length=12), nullable=True),
        sa.Column("matched_institution_id", sa.String(length=100), nullable=True),
        sa.Column("similarity_score", sa.Float(), nullable=False),
        sa.Column("match_type", sa.String(length=30), nullable=False),
        sa.Column("matched_fields_json", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="OPEN"),
        sa.Column("decided_by", sa.String(length=36), nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["batch_id"], ["batches.batch_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["decided_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_duplicate_flags_batch_id"), "duplicate_flags", ["batch_id"], unique=False
    )
    op.create_index(
        op.f("ix_duplicate_flags_cluster_id"), "duplicate_flags", ["cluster_id"], unique=False
    )
    op.create_index(
        op.f("ix_duplicate_flags_apaar_id"), "duplicate_flags", ["apaar_id"], unique=False
    )
    op.create_index(
        op.f("ix_duplicate_flags_matched_apaar_id"),
        "duplicate_flags",
        ["matched_apaar_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_duplicate_flags_matched_institution_id"),
        "duplicate_flags",
        ["matched_institution_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_duplicate_flags_match_type"), "duplicate_flags", ["match_type"], unique=False
    )
    op.create_index(op.f("ix_duplicate_flags_status"), "duplicate_flags", ["status"], unique=False)

    # 16. Student Records table (Central Repository)
    op.create_table(
        "student_records",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("apaar_id", sa.String(length=12), nullable=False),
        sa.Column("apaar_hash", sa.String(length=64), nullable=False),
        sa.Column("institution_aicte_id", sa.String(length=100), nullable=False),
        sa.Column("institution_student_id", sa.String(length=100), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("dob", sa.Date(), nullable=False),
        sa.Column("gender", sa.String(length=10), nullable=False),
        sa.Column("category", sa.String(length=20), nullable=False),
        sa.Column("pwd", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("program_code", sa.String(length=50), nullable=False),
        sa.Column("course_level", sa.String(length=20), nullable=False),
        sa.Column("department", sa.String(length=100), nullable=True),
        sa.Column("academic_year", sa.String(length=20), nullable=False),
        sa.Column("year_of_study", sa.Integer(), nullable=False),
        sa.Column("admission_date", sa.Date(), nullable=False),
        sa.Column("admission_type", sa.String(length=30), nullable=False),
        sa.Column("expected_graduation_year", sa.Integer(), nullable=True),
        sa.Column("seat_type", sa.String(length=30), nullable=False),
        sa.Column("supernumerary_scheme", sa.String(length=50), nullable=True),
        sa.Column("quota", sa.String(length=30), nullable=False),
        sa.Column("nationality", sa.String(length=10), nullable=False, server_default="IN"),
        sa.Column("nri_status", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("oci_status", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("fn_status", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column(
            "enrolment_status", sa.String(length=30), nullable=False, server_default="ACTIVE"
        ),
        sa.Column("consent_status", sa.String(length=30), nullable=False, server_default="GRANTED"),
        sa.Column("consent_date", sa.Date(), nullable=True),
        sa.Column("guardian_consent", sa.Boolean(), nullable=True, server_default=sa.text("0")),
        sa.Column("email_enc", sa.Text(), nullable=True),
        sa.Column("mobile_enc", sa.Text(), nullable=True),
        sa.Column("record_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["institution_aicte_id"], ["institutions.institution_aicte_id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["program_code"], ["programs.program_code"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(
            ["academic_year"], ["academic_years.academic_year"], ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("apaar_id", name="uq_student_records_apaar_id"),
    )
    op.create_index(
        op.f("ix_student_records_apaar_id"), "student_records", ["apaar_id"], unique=True
    )
    op.create_index(
        op.f("ix_student_records_apaar_hash"), "student_records", ["apaar_hash"], unique=False
    )
    op.create_index(
        op.f("ix_student_records_institution_aicte_id"),
        "student_records",
        ["institution_aicte_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_student_records_institution_student_id"),
        "student_records",
        ["institution_student_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_student_records_program_code"), "student_records", ["program_code"], unique=False
    )
    op.create_index(
        op.f("ix_student_records_academic_year"), "student_records", ["academic_year"], unique=False
    )
    op.create_index(
        op.f("ix_student_records_enrolment_status"),
        "student_records",
        ["enrolment_status"],
        unique=False,
    )

    # 17. Student Record Versions table
    op.create_table(
        "student_record_versions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("apaar_id", sa.String(length=12), nullable=False),
        sa.Column("record_version", sa.Integer(), nullable=False),
        sa.Column("snapshot_json", sa.JSON(), nullable=False),
        sa.Column("changed_by", sa.String(length=36), nullable=False),
        sa.Column("change_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_student_record_versions_apaar_id"),
        "student_record_versions",
        ["apaar_id"],
        unique=False,
    )

    # 18. Transfers table
    op.create_table(
        "transfers",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("apaar_id", sa.String(length=12), nullable=False),
        sa.Column("source_institution_id", sa.String(length=100), nullable=False),
        sa.Column("dest_institution_id", sa.String(length=100), nullable=False),
        sa.Column("academic_year", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="PENDING"),
        sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("decided_by", sa.String(length=36), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("evidence_ref", sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_transfers_apaar_id"), "transfers", ["apaar_id"], unique=False)
    op.create_index(
        op.f("ix_transfers_source_institution_id"),
        "transfers",
        ["source_institution_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_transfers_dest_institution_id"), "transfers", ["dest_institution_id"], unique=False
    )
    op.create_index(
        op.f("ix_transfers_academic_year"), "transfers", ["academic_year"], unique=False
    )
    op.create_index(op.f("ix_transfers_status"), "transfers", ["status"], unique=False)

    # 19. Consent Ledger table
    op.create_table(
        "consent_ledger",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("apaar_id", sa.String(length=12), nullable=False),
        sa.Column("apaar_hash", sa.String(length=64), nullable=False),
        sa.Column("purpose", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("effective_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("guardian_consent", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("signature_ref", sa.String(length=255), nullable=True),
        sa.Column("prev_hash", sa.String(length=64), nullable=True),
        sa.Column("hash", sa.String(length=64), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_consent_ledger_apaar_id"), "consent_ledger", ["apaar_id"], unique=False
    )
    op.create_index(
        op.f("ix_consent_ledger_apaar_hash"), "consent_ledger", ["apaar_hash"], unique=False
    )

    # 20. Credentials table
    op.create_table(
        "credentials",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("credential_id", sa.String(length=100), nullable=False),
        sa.Column("apaar_id", sa.String(length=12), nullable=False),
        sa.Column("apaar_hash", sa.String(length=64), nullable=False),
        sa.Column("institution_aicte_id", sa.String(length=100), nullable=False),
        sa.Column("dab_id", sa.String(length=50), nullable=True),
        sa.Column("credential_type", sa.String(length=50), nullable=False),
        sa.Column("record_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("sd_jwt_compact", sa.Text(), nullable=False),
        sa.Column("holder_binding_jwk_json", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="VALID"),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status_list_index", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_credentials_credential_id"), "credentials", ["credential_id"], unique=True
    )
    op.create_index(op.f("ix_credentials_apaar_id"), "credentials", ["apaar_id"], unique=False)
    op.create_index(op.f("ix_credentials_apaar_hash"), "credentials", ["apaar_hash"], unique=False)
    op.create_index(
        op.f("ix_credentials_institution_aicte_id"),
        "credentials",
        ["institution_aicte_id"],
        unique=False,
    )
    op.create_index(op.f("ix_credentials_dab_id"), "credentials", ["dab_id"], unique=False)
    op.create_index(op.f("ix_credentials_status"), "credentials", ["status"], unique=False)

    # 21. Status Lists table
    op.create_table(
        "status_lists",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("list_id", sa.String(length=100), nullable=False),
        sa.Column(
            "type", sa.String(length=50), nullable=False, server_default="BitstringStatusListEntry"
        ),
        sa.Column("bitstring_data", sa.Text(), nullable=False),
        sa.Column("length", sa.Integer(), nullable=False, server_default="131072"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_status_lists_list_id"), "status_lists", ["list_id"], unique=True)

    # 22. Webhooks table
    op.create_table(
        "webhooks",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("institution_aicte_id", sa.String(length=100), nullable=False),
        sa.Column("url", sa.String(length=255), nullable=False),
        sa.Column("secret_hash", sa.String(length=64), nullable=False),
        sa.Column("events", sa.JSON(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_webhooks_institution_aicte_id"), "webhooks", ["institution_aicte_id"], unique=False
    )

    # 23. Webhook Deliveries table
    op.create_table(
        "webhook_deliveries",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("webhook_id", sa.String(length=36), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("payload_json", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="SUCCESS"),
        sa.Column("response_code", sa.Integer(), nullable=True),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["webhook_id"], ["webhooks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_webhook_deliveries_webhook_id"), "webhook_deliveries", ["webhook_id"], unique=False
    )
    op.create_index(
        op.f("ix_webhook_deliveries_status"), "webhook_deliveries", ["status"], unique=False
    )

    # 24. Notification Outbox table
    op.create_table(
        "notifications_outbox",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("recipient", sa.String(length=255), nullable=False),
        sa.Column("channel", sa.String(length=20), nullable=False, server_default="EMAIL"),
        sa.Column("subject", sa.String(length=255), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="PENDING"),
        sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_notifications_outbox_status"), "notifications_outbox", ["status"], unique=False
    )

    # 25. Metric History table
    op.create_table(
        "metric_history",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("institution_aicte_id", sa.String(length=100), nullable=False),
        sa.Column("academic_year", sa.String(length=20), nullable=True),
        sa.Column("batch_number", sa.Integer(), nullable=True),
        sa.Column("rows_total", sa.Integer(), nullable=False),
        sa.Column("null_rate", sa.Float(), nullable=False),
        sa.Column("nri_share", sa.Float(), nullable=False),
        sa.Column("supernumerary_share", sa.Float(), nullable=False),
        sa.Column("duplicate_rate", sa.Float(), nullable=False),
        sa.Column("quality_score", sa.Float(), nullable=False),
        sa.Column("committed_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_metric_history_institution_aicte_id"),
        "metric_history",
        ["institution_aicte_id"],
        unique=False,
    )

    # 26. Column Mapping Profiles table
    op.create_table(
        "column_mapping_profiles",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("institution_aicte_id", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("mapping_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_column_mapping_profiles_institution_aicte_id"),
        "column_mapping_profiles",
        ["institution_aicte_id"],
        unique=False,
    )

    # 27. Jobs table
    op.create_table(
        "jobs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("job_type", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="PENDING"),
        sa.Column("progress", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("batch_id", sa.String(length=36), nullable=True),
        sa.Column("parameters_json", sa.JSON(), nullable=True),
        sa.Column("result_json", sa.JSON(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_jobs_job_type"), "jobs", ["job_type"], unique=False)
    op.create_index(op.f("ix_jobs_status"), "jobs", ["status"], unique=False)
    op.create_index(op.f("ix_jobs_batch_id"), "jobs", ["batch_id"], unique=False)

    # 28. Mock APAAR Registry table
    op.create_table(
        "mock_apaar_registry",
        sa.Column("apaar_id", sa.String(length=12), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("dob", sa.Date(), nullable=False),
        sa.Column("gender", sa.String(length=10), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("apaar_id"),
    )

    # 29. Issuer Keys table
    op.create_table(
        "issuer_keys",
        sa.Column("issuer_id", sa.String(length=100), nullable=False),
        sa.Column("did", sa.String(length=255), nullable=False),
        sa.Column("key_id", sa.String(length=100), nullable=False, server_default="key-1"),
        sa.Column("encrypted_private_key", sa.Text(), nullable=False),
        sa.Column("public_key_jwk_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("issuer_id"),
    )

    # 30. Holder Keys table
    op.create_table(
        "holder_keys",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("apaar_id", sa.String(length=12), nullable=False),
        sa.Column("apaar_hash", sa.String(length=64), nullable=False),
        sa.Column("jwk_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_holder_keys_user_id"), "holder_keys", ["user_id"], unique=False)
    op.create_index(op.f("ix_holder_keys_apaar_id"), "holder_keys", ["apaar_id"], unique=False)
    op.create_index(op.f("ix_holder_keys_apaar_hash"), "holder_keys", ["apaar_hash"], unique=False)

    # 31. Verification Nonces table
    op.create_table(
        "verification_nonces",
        sa.Column("nonce", sa.String(length=64), nullable=False),
        sa.Column("aud", sa.String(length=255), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("nonce"),
    )

    # 32. Short Links table
    op.create_table(
        "short_links",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("credential_id", sa.String(length=100), nullable=True),
        sa.Column("presentation_data", sa.Text(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    # Drop tables in reverse dependency order
    op.drop_table("short_links")
    op.drop_table("verification_nonces")
    op.drop_table("holder_keys")
    op.drop_table("issuer_keys")
    op.drop_table("mock_apaar_registry")
    op.drop_table("jobs")
    op.drop_table("column_mapping_profiles")
    op.drop_table("metric_history")
    op.drop_table("notifications_outbox")
    op.drop_table("webhook_deliveries")
    op.drop_table("webhooks")
    op.drop_table("status_lists")
    op.drop_table("credentials")
    op.drop_table("consent_ledger")
    op.drop_table("transfers")
    op.drop_table("student_record_versions")
    op.drop_table("student_records")
    op.drop_table("duplicate_flags")
    op.drop_table("corrections")
    op.drop_table("issues")
    op.drop_table("batch_reports")
    op.drop_table("batch_files")
    op.drop_table("batches")
    op.drop_table("declared_totals")
    op.drop_table("program_intake")
    op.drop_table("enums")
    op.drop_table("academic_years")
    op.drop_table("programs")
    op.drop_table("institutions")
    op.drop_table("degree_awarding_bodies")
    op.drop_table("districts")
    op.drop_table("states")
