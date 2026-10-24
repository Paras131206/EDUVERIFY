"""
Aggregate quota validation rules for EduVerify:
V012: Regular-seat count per program vs approved_intake
V013: Supernumerary per scheme vs allowed
"""

import json

import pandas as pd

from ..models import Issue
from .context import RuleContext
from .registry import make_issue, rule


@rule("V012")
def validate_v012_regular_intake_exceeded(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """
    V012: Regular-seat enrolment exceeds approved intake.
    Aggregates active regular-seat enrolments per program and compares against AICTE approved capacity.
    """
    issues: list[Issue] = []
    if "program_code" not in df.columns or ctx.intake.empty:
        return issues

    # Filter regular active seats
    seat_col = (
        df["seat_type"].astype(str).str.strip().str.upper()
        if "seat_type" in df.columns
        else pd.Series("REGULAR", index=df.index)
    )
    status_col = (
        df["enrolment_status"].astype(str).str.strip().str.upper()
        if "enrolment_status" in df.columns
        else pd.Series("ACTIVE", index=df.index)
    )

    mask = (seat_col == "REGULAR") & (status_col == "ACTIVE")
    active_regular = df[mask]

    prog_counts = active_regular.groupby(df["program_code"].astype(str).str.strip()).size()

    for prog_code, enrolled_count in prog_counts.items():
        if not prog_code or prog_code.lower() in ("nan", "none", "null"):
            continue

        intake_rec = ctx.get_intake_record(prog_code)
        if intake_rec and "approved_intake" in intake_rec:
            try:
                approved = int(intake_rec["approved_intake"])
                if enrolled_count > approved:
                    excess = enrolled_count - approved
                    issues.append(
                        make_issue(
                            rule_id="V012",
                            ctx=ctx,
                            field="program_code",
                            message=f"Regular enrolment ({enrolled_count}) exceeds approved capacity ({approved}) for program '{prog_code}'",
                            reason=(
                                f"Program '{prog_code}' has {enrolled_count} active regular enrolments in this batch, "
                                f"exceeding AICTE-approved intake capacity of {approved} by {excess} seats."
                            ),
                            evidence={
                                "program_code": prog_code,
                                "approved_intake": approved,
                                "enrolled_count": enrolled_count,
                                "excess": excess,
                            },
                            severity="ERROR",
                            priority="HIGH",
                            bucket="AUTO_FLAG",
                            confidence=1.0,
                        )
                    )
            except ValueError:
                pass

    return issues


@rule("V013")
def validate_v013_supernumerary_quota_exceeded(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """
    V013: Supernumerary count exceeds allowed scheme quota.
    Aggregates active supernumerary enrolments per program and scheme and checks against limits.
    """
    issues: list[Issue] = []
    if (
        "program_code" not in df.columns
        or "supernumerary_scheme" not in df.columns
        or ctx.intake.empty
    ):
        return issues

    seat_col = (
        df["seat_type"].astype(str).str.strip().str.upper()
        if "seat_type" in df.columns
        else pd.Series("", index=df.index)
    )
    status_col = (
        df["enrolment_status"].astype(str).str.strip().str.upper()
        if "enrolment_status" in df.columns
        else pd.Series("ACTIVE", index=df.index)
    )

    mask = (seat_col == "SUPERNUMERARY") & (status_col == "ACTIVE")
    active_super = df[mask]

    grouped = active_super.groupby(
        [
            df["program_code"].astype(str).str.strip(),
            df["supernumerary_scheme"].astype(str).str.strip().str.upper(),
        ]
    ).size()

    for (prog_code, scheme), count in grouped.items():
        if not prog_code or not scheme or scheme in ("NAN", "NONE", "NULL", ""):
            continue

        intake_rec = ctx.get_intake_record(prog_code)
        if intake_rec and "supernumerary_allowed" in intake_rec:
            allowed_json = intake_rec["supernumerary_allowed"]
            try:
                allowed_map = (
                    json.loads(allowed_json)
                    if isinstance(allowed_json, str)
                    else dict(allowed_json)
                )
                allowed_limit = allowed_map.get(scheme, 0)
                if count > allowed_limit:
                    excess = count - allowed_limit
                    issues.append(
                        make_issue(
                            rule_id="V013",
                            ctx=ctx,
                            field="supernumerary_scheme",
                            message=f"Supernumerary count ({count}) for '{scheme}' exceeds cap ({allowed_limit}) in '{prog_code}'",
                            reason=(
                                f"Active enrolments for supernumerary scheme '{scheme}' in program '{prog_code}' is {count}, "
                                f"exceeding the AICTE statutory ceiling of {allowed_limit} by {excess} seats."
                            ),
                            evidence={
                                "program_code": prog_code,
                                "supernumerary_scheme": scheme,
                                "count": count,
                                "allowed_limit": allowed_limit,
                                "excess": excess,
                            },
                            severity="ERROR",
                            priority="HIGH",
                            bucket="AUTO_FLAG",
                            confidence=1.0,
                        )
                    )
            except Exception:
                pass

    return issues
