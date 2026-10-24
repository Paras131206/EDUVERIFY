"""Performance DB indexes for fast batch validation, reporting, and deduplication.

Revision ID: 0003_performance_indexes
Revises: 0002_core_data_model
Create Date: 2026-10-24 23:55:00.000000

"""

from collections.abc import Sequence

from alembic import op

revision: str = "0003_performance_indexes"
down_revision: str | None = "0002_core_data_model"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Student records compound queries by institution + year
    op.create_index(
        "ix_student_records_inst_year",
        "student_records",
        ["institution_aicte_id", "academic_year"],
        unique=False,
    )

    # Batches lookup by institution + year
    op.create_index(
        "ix_batches_inst_year",
        "batches",
        ["institution_aicte_id", "academic_year"],
        unique=False,
    )

    # Issues filtering by rule_id + priority
    op.create_index(
        "ix_issues_rule_priority",
        "issues",
        ["rule_id", "priority"],
        unique=False,
    )

    # Issues filtering by batch_id + status
    op.create_index(
        "ix_issues_batch_status",
        "issues",
        ["batch_id", "status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_issues_batch_status", table_name="issues")
    op.drop_index("ix_issues_rule_priority", table_name="issues")
    op.drop_index("ix_batches_inst_year", table_name="batches")
    op.drop_index("ix_student_records_inst_year", table_name="student_records")
