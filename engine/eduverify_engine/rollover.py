"""
Academic rollover helper and missing continuing student detection for EduVerify Engine.
Implements Task C5.5:
- rollover_preview(previous_year_records, programs): generates provisional next-year student rows.
- V034: flags active students from preceding year missing in current rollover without recorded withdrawal.
"""

import logging
import re
from typing import Any

import pandas as pd

from .masking import mask_apaar
from .models import Issue
from .rules.context import RuleContext
from .rules.registry import make_issue, rule

logger = logging.getLogger(__name__)


def _advance_academic_year(acad_year: str) -> str:
    """Advances academic year string e.g. '2025-26' -> '2026-27'."""
    match = re.match(r"^(\d{4})-(\d{2,4})$", str(acad_year).strip())
    if match:
        start_yr = int(match.group(1)) + 1
        end_yr = int(match.group(2)) + 1
        if len(match.group(2)) == 2:
            return f"{start_yr}-{end_yr % 100:02d}"
        return f"{start_yr}-{end_yr}"
    return f"{acad_year}+1"


def rollover_preview(
    previous_year_records: pd.DataFrame,
    programs: pd.DataFrame | None = None,
) -> pd.DataFrame:
    """
    Generates provisional next-year student records from previous year enrolment.
    - Filters to ACTIVE continuing students.
    - Excludes students reaching their final graduation year.
    - Increments year_of_study and advances academic_year.
    """
    if previous_year_records.empty:
        return pd.DataFrame()

    prog_durations: dict[str, int] = {}
    if programs is not None and not programs.empty and "program_code" in programs.columns:
        dur_col = "duration_years" if "duration_years" in programs.columns else "duration"
        for _, p in programs.iterrows():
            code = str(p["program_code"]).strip()
            val = p.get(dur_col, 4)
            try:
                prog_durations[code] = int(str(val)) if val is not None else 4
            except (ValueError, TypeError):
                prog_durations[code] = 4

    provisional_rows: list[dict[str, Any]] = []

    for _, row in previous_year_records.iterrows():
        status = str(row.get("enrolment_status") or "ACTIVE").strip().upper()
        # Only active continuing students roll over
        if status in ("TRANSFERRED_OUT", "WITHDRAWN", "COMPLETED", "GRADUATED", "DROPOUT"):
            continue

        prog = str(row.get("program_code") or "").strip()
        course_lvl = str(row.get("course_level") or "UG").strip().upper()
        default_dur = 2 if course_lvl == "PG" else (3 if course_lvl == "DIPLOMA" else 4)
        duration = prog_durations.get(prog, default_dur)

        try:
            yos_raw = row.get("year_of_study")
            current_yos = int(str(yos_raw)) if yos_raw is not None else 1
        except (ValueError, TypeError):
            current_yos = 1

        # If student has completed their final year of study, they do not roll over to next year of study
        if current_yos >= duration:
            continue

        next_yos = current_yos + 1
        curr_year = str(row.get("academic_year") or "2025-26")
        next_year = _advance_academic_year(curr_year)

        rec = row.to_dict()
        rec["academic_year"] = next_year
        rec["year_of_study"] = next_yos
        rec["admission_type"] = "CONTINUING"
        provisional_rows.append(rec)

    return pd.DataFrame(provisional_rows)


def check_rollover_missing(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """
    Checks for continuing students from previous year who are missing in the current rollover upload.
    Emits V034 for active students absent without documented transfer or withdrawal.
    """
    issues: list[Issue] = []

    prev_df = getattr(ctx, "previous_year_records", None)
    if prev_df is None or prev_df.empty:
        # Check central_snapshot for previous academic year records of this institution
        if ctx.central_snapshot is not None and not ctx.central_snapshot.empty:
            snap = ctx.central_snapshot
            inst_col = (
                "institution_aicte_id" if "institution_aicte_id" in snap.columns else "institution"
            )
            year_col = "academic_year" if "academic_year" in snap.columns else ""
            inst_id = str(ctx.institution_aicte_id)

            if year_col:
                # Find preceding year records for this institution
                curr_start = (
                    int(ctx.academic_year.split("-")[0]) if "-" in ctx.academic_year else 2026
                )
                prev_mask = (snap[inst_col].astype(str) == inst_id) & (
                    snap[year_col].apply(
                        lambda y: bool(
                            y and "-" in str(y) and int(str(y).split("-")[0]) == curr_start - 1
                        )
                    )
                )
                prev_df = snap[prev_mask]

    if prev_df is None or prev_df.empty:
        return issues

    # Current batch identifiers
    curr_apaars: set[str] = set()
    curr_sids: set[str] = set()

    if "apaar_id" in df.columns:
        curr_apaars = {
            re.sub(r"[\s\-]+", "", str(a).strip())
            for a in df["apaar_id"].dropna()
            if str(a).strip().lower() not in ("nan", "none", "null", "")
        }
    if "institution_student_id" in df.columns:
        curr_sids = {
            str(s).strip()
            for s in df["institution_student_id"].dropna()
            if str(s).strip().lower() not in ("nan", "none", "null", "")
        }

    # Transfers lookup
    approved_transfers: set[str] = set()
    if (
        ctx.transfers is not None
        and not ctx.transfers.empty
        and "apaar_id" in ctx.transfers.columns
    ):
        for _, t in ctx.transfers.iterrows():
            if str(t.get("status") or "").strip().upper() == "APPROVED":
                approved_transfers.add(str(t.get("apaar_id") or "").strip())

    for _, row in prev_df.iterrows():
        status = str(row.get("enrolment_status") or "ACTIVE").strip().upper()
        if status in ("TRANSFERRED_OUT", "WITHDRAWN", "COMPLETED", "GRADUATED", "DROPOUT"):
            continue

        raw_apaar = str(row.get("apaar_id") or "").strip()
        clean_apaar = re.sub(r"[\s\-]+", "", raw_apaar)
        sid = str(row.get("institution_student_id") or "").strip()
        name = str(row.get("full_name") or row.get("name") or "Student").strip()
        prev_yos = row.get("year_of_study", 1)
        prev_yr = row.get("academic_year", "")

        # Exclude if approved transfer
        if clean_apaar and clean_apaar in approved_transfers:
            continue

        # Check presence in current batch
        is_present = (clean_apaar and clean_apaar in curr_apaars) or (sid and sid in curr_sids)
        if not is_present:
            masked = mask_apaar(clean_apaar) if clean_apaar else sid
            issues.append(
                make_issue(
                    rule_id="V034",
                    ctx=ctx,
                    row=None,
                    record_key=sid or clean_apaar,
                    field="apaar_id",
                    message=f"Continuing student '{name}' active in {prev_yr} missing from current rollover batch",
                    reason=(
                        f"Student {name} (Student ID: '{sid}', APAAR: {masked}) was recorded as ACTIVE "
                        f"in year of study {prev_yos} ({prev_yr}), but is missing from current "
                        f"{ctx.academic_year} batch without documented withdrawal or approved transfer."
                    ),
                    evidence={
                        "student_id": sid,
                        "apaar_masked": masked,
                        "previous_academic_year": prev_yr,
                        "previous_year_of_study": prev_yos,
                        "student_name": name,
                    },
                    value_masked=masked,
                    severity="WARN",
                    priority="MEDIUM",
                    bucket="HUMAN_REVIEW",
                    confidence=0.90,
                )
            )

    return issues


# -------------------------------------------------------------
# Rule Registry binding: V034
# -------------------------------------------------------------
@rule("V034")
def rule_v034_rollover_missing(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """Student marked ACTIVE in previous year missing from rollover batch."""
    return check_rollover_missing(df, ctx)
