"""
Completeness validation rules for EduVerify:
V001: Required column missing after column mapping
V005: Required field null/empty
"""

import pandas as pd

from ..mapping import REQUIRED_FIELDS, find_missing_required_fields
from ..models import Issue
from .context import RuleContext
from .registry import make_issue, rule


@rule("V001")
def validate_v001_missing_column(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """
    V001: Required column missing after column mapping.
    Checks whether all required canonical student_record fields were mapped.
    """
    issues: list[Issue] = []
    if ctx.mapping:
        missing_fields = find_missing_required_fields(ctx.mapping)
    else:
        missing_fields = [f for f in REQUIRED_FIELDS if f not in df.columns]

    available_headers = list(ctx.raw_df.columns) if ctx.raw_df is not None else list(df.columns)

    for mf in missing_fields:
        issues.append(
            make_issue(
                rule_id="V001",
                ctx=ctx,
                field=mf,
                message=f"Mandatory column '{mf}' is missing and could not be mapped",
                reason=(
                    f"Canonical field '{mf}' is required by the EduVerify schema "
                    "but has no mapped source column in the uploaded dataset."
                ),
                evidence={"missing_field": mf, "available_headers": available_headers},
                severity="ERROR",
                priority="CRITICAL",
                bucket="AUTO_FLAG",
                confidence=1.0,
            )
        )
    return issues


@rule("V005")
def validate_v005_required_field_null(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """
    V005: Required field null/empty.
    Every row must supply mandatory values for core student record fields.
    Escalated to HIGH priority on identity fields (full_name, dob, institution_student_id).
    """
    issues: list[Issue] = []

    # Mandatory fields per agents.md §5.1
    mandatory_fields = [
        "full_name",
        "dob",
        "gender",
        "category",
        "program_code",
        "course_level",
        "year_of_study",
        "admission_date",
        "admission_type",
        "seat_type",
        "nationality",
        "enrolment_status",
        "consent_status",
    ]

    target_fields = [f for f in mandatory_fields if f in df.columns]

    for idx, row in enumerate(ctx.get_records(df)):
        row_num = int(idx) + 2
        rec_key = str(row.get("institution_student_id", f"row-{row_num}"))

        for rf in target_fields:
            val = row.get(rf)
            val_str = str(val).strip() if val is not None else ""
            if not val_str or val_str.lower() in ("nan", "none", "null", ""):
                is_identity = rf in ("full_name", "dob", "institution_student_id")
                issues.append(
                    make_issue(
                        rule_id="V005",
                        ctx=ctx,
                        row=row_num,
                        record_key=rec_key,
                        field=rf,
                        message=f"Required field '{rf}' is empty or null",
                        reason=f"Mandatory field '{rf}' cannot be blank in student enrolment record (row {row_num}).",
                        evidence={"field": rf, "row": row_num},
                        severity="ERROR",
                        priority="HIGH" if is_identity else "MEDIUM",
                        bucket="AUTO_FLAG",
                        confidence=1.0,
                    )
                )

    return issues
