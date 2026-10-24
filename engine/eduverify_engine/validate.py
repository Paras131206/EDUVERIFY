"""
Batch validation pipeline for EduVerify Engine.
Frozen public API for validate_batch().
Wires parse -> mapping -> normalize -> rules -> score -> BatchReport.
"""

import io
import uuid
from pathlib import Path
from typing import Any, Protocol, runtime_checkable

import pandas as pd

from . import __version__
from .catalog import load_rule_catalog
from .mapping import suggest_mapping
from .models import (
    BatchReport,
    ColumnMapping,
    IntakeSummary,
    Issue,
    ReconciliationRow,
)
from .parse import parse_file
from .rules import RuleContext, run_rules
from .score import calculate_deequ_metrics, calculate_quality_score


@runtime_checkable
class RegistryEntry(Protocol):
    apaar_id: str
    full_name: str
    dob: str
    gender: str


@runtime_checkable
class RegistryProtocol(Protocol):
    def lookup(self, apaar_id: str) -> RegistryEntry | None: ...


def validate_batch(
    file_or_df: str | Path | bytes | io.BytesIO | pd.DataFrame,
    *,
    mapping: list[ColumnMapping] | None = None,
    master: Any = None,
    intake: Any = None,
    declared_totals: Any = None,
    registry: Any = None,
    central_snapshot: Any = None,
    history: Any = None,
    previous_batch_profile: Any = None,
    transfers: Any = None,
    institution_aicte_id: str | None = None,
    academic_year: str = "2026-27",
    batch_id: str | None = None,
) -> BatchReport:
    """
    Main entry point for batch validation.
    Frozen API signature per C-MASTER and engine-v0.1 tag.
    Wires: parse -> mapping -> normalize -> rules -> score -> BatchReport.
    """
    batch_id = batch_id or str(uuid.uuid4())
    catalog = load_rule_catalog()
    catalog_version = catalog.catalog_version

    # 1. Parse File
    parsed = parse_file(file_or_df)
    df = parsed.df
    headers = parsed.original_headers
    rows_total = len(df)
    parse_issues: list[Issue] = list(parsed.parse_issues)

    # 2. Smart Column Mapping
    if mapping is None:
        mapping = suggest_mapping(headers, sample_df=df)

    source_to_target = {m.source: m.target for m in mapping}

    # 3. Remap into canonical working DataFrame
    working_df = pd.DataFrame(index=df.index)
    for src_col, tgt_field in source_to_target.items():
        if src_col in df.columns:
            working_df[tgt_field] = df[src_col]

    # Resolve institution ID
    auth_inst = institution_aicte_id or "1-100010001"
    inst_id = auth_inst
    if "institution_aicte_id" in working_df.columns:
        first_val = working_df["institution_aicte_id"].dropna().astype(str).str.strip()
        if not first_val.empty and first_val.iloc[0]:
            inst_id = first_val.iloc[0]

    if "institution_aicte_id" not in working_df.columns:
        working_df["institution_aicte_id"] = inst_id

    # 4. Construct RuleContext
    ctx = RuleContext(
        master=master,
        intake=intake,
        declared_totals=declared_totals,
        registry=registry,
        central_snapshot=central_snapshot,
        history=history,
        transfers=transfers,
        academic_year=academic_year,
        institution_aicte_id=inst_id,
        authenticated_institution_id=auth_inst,
        batch_id=batch_id,
        mapping=mapping,
        raw_df=df,
        catalog=catalog,
    )

    # 5. Run Rules Engine
    rule_issues = run_rules(working_df, ctx)
    all_issues = parse_issues + rule_issues

    # Sort issues by priority (CRITICAL -> HIGH -> MEDIUM -> LOW) then row
    priority_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    all_issues.sort(key=lambda i: (priority_order.get(i.priority, 4), i.row or 0))

    # 6. Row counts
    rows_with_error = {i.row for i in all_issues if i.severity == "ERROR" and i.row is not None}
    rows_with_warning = {
        i.row for i in all_issues if i.severity == "WARN" and i.row is not None
    } - rows_with_error
    err_count = len(rows_with_error)
    warn_count = len(rows_with_warning)
    valid_count = max(0, rows_total - (err_count + warn_count))

    # 7. Summary buckets
    review_summary = {"AUTO_FLAG": 0, "HUMAN_REVIEW": 0, "INFO": 0}
    priority_summary = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for iss in all_issues:
        review_summary[iss.bucket] = review_summary.get(iss.bucket, 0) + 1
        priority_summary[iss.priority] = priority_summary.get(iss.priority, 0) + 1

    # 8. Compute Quality Score & Deequ Metrics
    q_score = calculate_quality_score(all_issues, rows_total)
    metrics = calculate_deequ_metrics(working_df, all_issues)

    # 9. Intake Summary per program
    intake_summaries: list[IntakeSummary] = []
    if "program_code" in working_df.columns:
        seat_col = (
            working_df["seat_type"].astype(str).str.strip().str.upper()
            if "seat_type" in working_df.columns
            else pd.Series("REGULAR", index=working_df.index)
        )
        status_col = (
            working_df["enrolment_status"].astype(str).str.strip().str.upper()
            if "enrolment_status" in working_df.columns
            else pd.Series("ACTIVE", index=working_df.index)
        )

        programs = working_df["program_code"].dropna().unique()
        for prog in programs:
            prog_str = str(prog).strip()
            if not prog_str or prog_str.lower() in ("nan", "none", "null"):
                continue

            prog_mask = (working_df["program_code"].astype(str).str.strip() == prog_str) & (
                status_col == "ACTIVE"
            )
            enrolled = int((prog_mask & (seat_col == "REGULAR")).sum())
            supernumerary = int((prog_mask & (seat_col == "SUPERNUMERARY")).sum())

            intake_rec = ctx.get_intake_record(prog_str)
            approved = (
                int(intake_rec["approved_intake"])
                if (intake_rec and "approved_intake" in intake_rec)
                else 60
            )
            excess = max(0, enrolled - approved)

            intake_summaries.append(
                IntakeSummary(
                    program_code=prog_str,
                    approved=approved,
                    enrolled=enrolled,
                    supernumerary=supernumerary,
                    excess=excess,
                )
            )

    # 10. Reconciliation against declared totals
    reconciliation_rows: list[ReconciliationRow] = []
    if not ctx.declared_totals.empty and "program_code" in ctx.declared_totals.columns:
        inst_declared = ctx.declared_totals[
            (ctx.declared_totals["institution_aicte_id"].astype(str) == str(inst_id))
            & (ctx.declared_totals["academic_year"].astype(str) == str(academic_year))
        ]
        for _, d_row in inst_declared.iterrows():
            d_prog = str(d_row["program_code"]).strip()
            declared_count = int(d_row.get("declared_enrolment", 0))

            uploaded_count = 0
            if "program_code" in working_df.columns:
                uploaded_count = int(
                    (working_df["program_code"].astype(str).str.strip() == d_prog).sum()
                )

            delta = uploaded_count - declared_count
            tolerance = max(2, int(0.02 * declared_count))
            status = "MATCH" if abs(delta) <= tolerance else "MISMATCH"

            reconciliation_rows.append(
                ReconciliationRow(
                    program_code=d_prog,
                    declared=declared_count,
                    uploaded=uploaded_count,
                    delta=delta,
                    status=status,
                )
            )

    duplicate_clusters = getattr(ctx, "_duplicate_clusters", [])
    if not duplicate_clusters and not hasattr(ctx, "_dedup_cache"):
        from .dedup import detect_duplicates

        _, duplicate_clusters = detect_duplicates(working_df, ctx)

    return BatchReport(
        batch_id=batch_id,
        institution_aicte_id=inst_id,
        engine_version=__version__,
        rule_catalog_version=catalog_version,
        rows_total=rows_total,
        rows_valid=valid_count,
        rows_warning=warn_count,
        rows_error=err_count,
        quality_score=q_score,
        column_mapping=mapping,
        metrics=metrics,
        issues=all_issues,
        review_summary=review_summary,
        priority_summary=priority_summary,
        intake_summary=intake_summaries,
        reconciliation=reconciliation_rows,
        duplicate_clusters=duplicate_clusters,
        schema_drift=[],
        anomalies=[],
    )
