"""
Intake reconciliation module for EduVerify Engine.
Implements Task C5.4:
- Compares per-program counts (total, supernumerary, NRI, OCI, FN) with declared_totals.
- Produces ReconciliationRow instances for BatchReport.
- Flags V022 when uploaded counts exceed or diverge from declared counts beyond tolerance (default ±2% or ±2).
- Provides reconcile_aggregate() helper for AGGREGATE_ONLY institutions.
"""

import logging
from typing import Any

import pandas as pd

from .models import Issue, ReconciliationRow
from .rules.context import RuleContext
from .rules.registry import make_issue, rule

logger = logging.getLogger(__name__)

DEFAULT_TOLERANCE_PCT = 0.02
DEFAULT_TOLERANCE_ABS = 2


def _is_truthy(val: Any) -> bool:
    return str(val).strip().lower() in ("true", "1", "yes", "t")


def reconcile_batch(
    df: pd.DataFrame,
    ctx: RuleContext,
    tolerance_pct: float = DEFAULT_TOLERANCE_PCT,
    tolerance_abs: int = DEFAULT_TOLERANCE_ABS,
) -> tuple[list[Issue], list[ReconciliationRow]]:
    """
    Reconciles student-level upload DataFrame against institutional declared_totals.
    Returns: (issues, reconciliation_rows)
    """
    cached = getattr(ctx, "_reconcile_cache", None)
    if cached is not None:
        return cached

    issues: list[Issue] = []
    reconciliation_rows: list[ReconciliationRow] = []

    declared_df = ctx.declared_totals
    if declared_df is None or declared_df.empty or "program_code" not in declared_df.columns:
        result = (issues, reconciliation_rows)
        ctx._reconcile_cache = result
        return result

    inst_id = str(ctx.institution_aicte_id)
    acad_year = str(ctx.academic_year)

    inst_col = (
        "institution_aicte_id" if "institution_aicte_id" in declared_df.columns else "institution"
    )
    year_col = "academic_year" if "academic_year" in declared_df.columns else ""

    mask = declared_df[inst_col].astype(str) == inst_id
    if year_col:
        mask = mask & (declared_df[year_col].astype(str) == acad_year)

    inst_declared = declared_df[mask]
    if inst_declared.empty:
        # Fallback to any matching program rows if academic year format differs slightly
        inst_declared = declared_df[declared_df[inst_col].astype(str) == inst_id]

    if inst_declared.empty:
        result = (issues, reconciliation_rows)
        ctx._reconcile_cache = result
        return result

    # Pre-aggregate uploaded counts by program
    prog_col = "program_code" if "program_code" in df.columns else ""

    for _, d_row in inst_declared.iterrows():
        prog = str(d_row["program_code"]).strip()
        declared_total = int(str(d_row.get("declared_enrolment") or 0))
        declared_super = int(str(d_row.get("declared_supernumerary") or 0))
        declared_nri = int(str(d_row.get("declared_nri") or 0))
        declared_oci = int(str(d_row.get("declared_oci") or 0))
        declared_fn = int(str(d_row.get("declared_fn") or 0))

        uploaded_total = 0
        uploaded_super = 0
        uploaded_nri = 0
        uploaded_oci = 0
        uploaded_fn = 0

        if prog_col:
            prog_mask = df[prog_col].astype(str).str.strip() == prog
            uploaded_total = int(prog_mask.sum())

            # Supernumerary
            if "seat_type" in df.columns:
                uploaded_super += int(
                    (
                        prog_mask
                        & (df["seat_type"].astype(str).str.strip().str.upper() == "SUPERNUMERARY")
                    ).sum()
                )
            if "supernumerary_scheme" in df.columns:
                scheme_str = df["supernumerary_scheme"].fillna("").astype(str).str.strip()
                uploaded_super = max(
                    uploaded_super,
                    int(
                        (
                            prog_mask & (~scheme_str.str.lower().isin(["", "nan", "none", "null"]))
                        ).sum()
                    ),
                )

            # NRI
            if "nri_status" in df.columns:
                uploaded_nri += int((prog_mask & df["nri_status"].apply(_is_truthy)).sum())
            elif "quota" in df.columns:
                uploaded_nri += int(
                    (prog_mask & (df["quota"].astype(str).str.strip().str.upper() == "NRI")).sum()
                )

            # OCI
            if "oci_status" in df.columns:
                uploaded_oci += int((prog_mask & df["oci_status"].apply(_is_truthy)).sum())
            elif "quota" in df.columns:
                uploaded_oci += int(
                    (prog_mask & (df["quota"].astype(str).str.strip().str.upper() == "OCI")).sum()
                )

            # FN
            if "fn_status" in df.columns:
                uploaded_fn += int((prog_mask & df["fn_status"].apply(_is_truthy)).sum())
            elif "quota" in df.columns:
                uploaded_fn += int(
                    (prog_mask & (df["quota"].astype(str).str.strip().str.upper() == "FN")).sum()
                )

        delta = uploaded_total - declared_total
        tolerance = max(tolerance_abs, int(round(tolerance_pct * declared_total)))
        status = "MATCH" if abs(delta) <= tolerance else "MISMATCH"

        reconciliation_rows.append(
            ReconciliationRow(
                program_code=prog,
                declared=declared_total,
                uploaded=uploaded_total,
                delta=delta,
                status=status,
            )
        )

        # Issue V022 when uploaded count exceeds declared total beyond allowed tolerance
        sub_quota_exceeded = (declared_nri > 0 and uploaded_nri > declared_nri + tolerance) or (
            declared_super > 0 and uploaded_super > declared_super + tolerance
        )
        if uploaded_total > 0 and (
            uploaded_total > declared_total + tolerance or sub_quota_exceeded
        ):
            issues.append(
                make_issue(
                    rule_id="V022",
                    ctx=ctx,
                    field="program_code",
                    message=(
                        f"Reconciliation mismatch for program '{prog}': "
                        f"uploaded {uploaded_total} exceeds declared {declared_total} (delta {delta:+d})"
                    ),
                    reason=(
                        f"Total uploaded student-level records for {prog} ({uploaded_total}) "
                        f"exceeds declared statistical total ({declared_total}) "
                        f"beyond allowed tolerance ±{tolerance} (delta {delta:+d})."
                    ),
                    evidence={
                        "program_code": prog,
                        "declared_total": declared_total,
                        "uploaded_total": uploaded_total,
                        "delta": delta,
                        "tolerance": tolerance,
                        "declared_supernumerary": declared_super,
                        "uploaded_supernumerary": uploaded_super,
                        "declared_nri": declared_nri,
                        "uploaded_nri": uploaded_nri,
                        "declared_oci": declared_oci,
                        "uploaded_oci": uploaded_oci,
                        "declared_fn": declared_fn,
                        "uploaded_fn": uploaded_fn,
                    },
                    severity="WARN",
                    priority="HIGH",
                    bucket="HUMAN_REVIEW",
                    confidence=0.95,
                )
            )

    result = (issues, reconciliation_rows)
    ctx._reconcile_cache = result
    ctx._reconciliation = reconciliation_rows
    return result


def reconcile_aggregate(
    declared: pd.DataFrame | list[dict[str, Any]],
    aggregate_submission: pd.DataFrame | list[dict[str, Any]],
    tolerance_pct: float = DEFAULT_TOLERANCE_PCT,
    tolerance_abs: int = DEFAULT_TOLERANCE_ABS,
) -> tuple[list[Issue], list[ReconciliationRow]]:
    """
    Reconciliation function for AGGREGATE_ONLY institutions uploading program-level totals.
    Compares submitted aggregate totals against approval declared numbers.
    """
    dec_df = pd.DataFrame(declared) if not isinstance(declared, pd.DataFrame) else declared
    sub_df = (
        pd.DataFrame(aggregate_submission)
        if not isinstance(aggregate_submission, pd.DataFrame)
        else aggregate_submission
    )

    issues: list[Issue] = []
    rows: list[ReconciliationRow] = []

    if dec_df.empty or "program_code" not in dec_df.columns:
        return issues, rows

    sub_lookup: dict[str, int] = {}
    if not sub_df.empty and "program_code" in sub_df.columns:
        cnt_col = "enrolled" if "enrolled" in sub_df.columns else "uploaded_enrolment"
        if cnt_col not in sub_df.columns:
            for c in ["total", "count", "submitted"]:
                if c in sub_df.columns:
                    cnt_col = c
                    break
        for _, s in sub_df.iterrows():
            p = str(s["program_code"]).strip()
            val = int(str(s.get(cnt_col) or 0))
            sub_lookup[p] = val

    for _, d in dec_df.iterrows():
        p = str(d["program_code"]).strip()
        decl = int(str(d.get("declared_enrolment") or 0))
        subm = sub_lookup.get(p, 0)
        delta = subm - decl
        tolerance = max(tolerance_abs, int(round(tolerance_pct * decl)))
        status = "MATCH" if abs(delta) <= tolerance else "MISMATCH"

        rows.append(
            ReconciliationRow(
                program_code=p,
                declared=decl,
                uploaded=subm,
                delta=delta,
                status=status,
            )
        )

        if status == "MISMATCH":
            issues.append(
                Issue(
                    issue_id=f"rec-{p}",
                    row=None,
                    record_key=p,
                    field="program_code",
                    rule_id="V022",
                    severity="WARN",
                    priority="HIGH",
                    confidence=0.95,
                    bucket="HUMAN_REVIEW",
                    message=f"Aggregate mismatch for '{p}': submitted {subm} vs declared {decl}",
                    reason=f"Aggregate submission for {p} ({subm}) deviates from declared {decl} (delta {delta:+d}, allowed ±{tolerance}).",
                    evidence={"program": p, "declared": decl, "submitted": subm, "delta": delta},
                )
            )

    return issues, rows


# -------------------------------------------------------------
# Rule Registry binding: V022
# -------------------------------------------------------------
@rule("V022")
def rule_v022_reconciliation(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """Uploaded counts differ from declared statistical totals."""
    issues, _ = reconcile_batch(df, ctx)
    return [i for i in issues if i.rule_id == "V022"]
