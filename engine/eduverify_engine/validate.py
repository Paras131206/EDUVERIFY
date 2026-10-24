"""
Batch validation pipeline for EduVerify Engine.
Frozen public API for validate_batch().
Wires parse -> mapping -> normalize -> core rules (V001, V002, V005, V023, V024) -> BatchReport.
"""

import io
import uuid
from pathlib import Path
from typing import Any, Protocol, runtime_checkable

import pandas as pd

from . import __version__
from .catalog import load_rule_catalog
from .mapping import find_missing_required_fields, suggest_mapping
from .masking import mask_apaar
from .models import (
    BatchReport,
    ColumnMapping,
    Issue,
)
from .normalize import normalize_apaar, normalize_date
from .parse import parse_file


@runtime_checkable
class RegistryEntry(Protocol):
    apaar_id: str
    full_name: str
    dob: str
    gender: str


@runtime_checkable
class RegistryProtocol(Protocol):
    def lookup(self, apaar_id: str) -> RegistryEntry | None: ...


PRIORITY_WEIGHTS = {"CRITICAL": 10, "HIGH": 5, "MEDIUM": 2, "LOW": 1}
MAX_PRIORITY_WEIGHT = 10


def calculate_quality_score(issues: list[Issue], rows_total: int) -> float:
    """Computes quality score [0..100] per agents.md §5.3."""
    if rows_total <= 0:
        return 100.0
    total_penalty = sum(PRIORITY_WEIGHTS.get(i.priority, 1) for i in issues)
    raw_score = 100.0 * (1.0 - (total_penalty / (rows_total * MAX_PRIORITY_WEIGHT)))
    return max(0.0, min(100.0, round(raw_score, 1)))


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
    """
    batch_id = batch_id or str(uuid.uuid4())
    catalog = load_rule_catalog()
    catalog_version = catalog.catalog_version

    # 1. Parse File
    parsed = parse_file(file_or_df)
    df = parsed.df
    headers = parsed.original_headers
    rows_total = len(df)
    issues: list[Issue] = list(parsed.parse_issues)

    # 2. Smart Column Mapping
    if mapping is None:
        mapping = suggest_mapping(headers, sample_df=df)

    source_to_target = {m.source: m.target for m in mapping}
    target_to_source = {m.target: m.source for m in mapping}

    # Check V001: Required columns missing
    missing_fields = find_missing_required_fields(mapping)
    for mf in missing_fields:
        issues.append(
            Issue(
                issue_id=str(uuid.uuid4()),
                field=mf,
                rule_id="V001",
                severity="ERROR",
                priority="CRITICAL",
                confidence=1.0,
                bucket="AUTO_FLAG",
                message=f"Mandatory column '{mf}' is missing and could not be mapped",
                reason=(
                    f"Column '{mf}' is required by canonical schema "
                    "but has no mapped source header."
                ),
                evidence={"missing_field": mf, "available_headers": headers},
            )
        )

    # Resolve institution ID
    inst_id = institution_aicte_id or "1-100010001"
    if "institution_aicte_id" in target_to_source:
        inst_col = target_to_source["institution_aicte_id"]
        if not df.empty and df[inst_col].iloc[0].strip():
            inst_id = df[inst_col].iloc[0].strip()

    # Apply column remapping to a working DataFrame copy
    working_df = pd.DataFrame(index=df.index)
    for src_col, tgt_field in source_to_target.items():
        if src_col in df.columns:
            working_df[tgt_field] = df[src_col]

    # Row-level validation loop for V002, V005, V023, V024
    apaar_col = "apaar_id" if "apaar_id" in working_df.columns else None
    student_id_col = (
        "institution_student_id" if "institution_student_id" in working_df.columns else None
    )

    rows_with_error = set()
    rows_with_warning = set()

    for idx, row in working_df.iterrows():
        row_num = int(idx) + 2  # 1-indexed, header is row 1
        fallback_key = f"row-{row_num}"
        rec_key = str(row.get(student_id_col, fallback_key)) if student_id_col else fallback_key

        # --- Check APAAR ID (V002 & V023) ---
        if apaar_col:
            raw_apaar = row.get(apaar_col, "")
            norm_apaar, defect, fix = normalize_apaar(raw_apaar)

            # V023: Excel-mangled APAAR
            if defect:
                issues.append(
                    Issue(
                        issue_id=str(uuid.uuid4()),
                        row=row_num,
                        record_key=rec_key,
                        field="apaar_id",
                        rule_id="V023",
                        severity="WARN",
                        priority="HIGH",
                        confidence=0.98,
                        bucket="AUTO_FLAG",
                        message="APAAR identifier appears Excel-mangled",
                        reason=f"Detected spreadsheet corruption: {defect} in value '{raw_apaar}'",
                        evidence={"original": raw_apaar, "cleaned": norm_apaar, "defect": defect},
                        suggested_fix=fix,
                        value_masked=mask_apaar(norm_apaar),
                    )
                )
                rows_with_warning.add(row_num)

            # V002: APAAR missing or not 12 digits
            if not norm_apaar or len(norm_apaar) != 12 or not norm_apaar.isdigit():
                issues.append(
                    Issue(
                        issue_id=str(uuid.uuid4()),
                        row=row_num,
                        record_key=rec_key,
                        field="apaar_id",
                        rule_id="V002",
                        severity="ERROR",
                        priority="CRITICAL",
                        confidence=1.0,
                        bucket="AUTO_FLAG",
                        message="APAAR ID missing or not exactly 12 numeric digits",
                        reason=(
                            f"Expected 12 numeric digits, found '{norm_apaar}' "
                            f"(length {len(norm_apaar)})"
                        ),
                        evidence={"value": raw_apaar, "length": len(norm_apaar)},
                        value_masked=mask_apaar(norm_apaar),
                    )
                )
                rows_with_error.add(row_num)

        # --- Check V005: Required fields null or empty ---
        required_in_batch = [
            f
            for f in [
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
            ]
            if f in working_df.columns
        ]

        for rf in required_in_batch:
            val = str(row.get(rf, "")).strip()
            if not val or val.lower() in ("nan", "none", "null"):
                issues.append(
                    Issue(
                        issue_id=str(uuid.uuid4()),
                        row=row_num,
                        record_key=rec_key,
                        field=rf,
                        rule_id="V005",
                        severity="ERROR",
                        priority="HIGH" if rf in ("full_name", "dob") else "MEDIUM",
                        confidence=1.0,
                        bucket="AUTO_FLAG",
                        message=f"Required field '{rf}' is empty or null",
                        reason=f"Field '{rf}' cannot be blank in student enrolment record.",
                        evidence={"field": rf, "row": row_num},
                    )
                )
                rows_with_error.add(row_num)

        # --- Check V024: Dates (dob, admission_date) ---
        for date_field in ["dob", "admission_date"]:
            if date_field in working_df.columns:
                raw_date = row.get(date_field, "")
                if raw_date and str(raw_date).strip():
                    iso_date, candidates, is_valid = normalize_date(raw_date)
                    if not is_valid:
                        issues.append(
                            Issue(
                                issue_id=str(uuid.uuid4()),
                                row=row_num,
                                record_key=rec_key,
                                field=date_field,
                                rule_id="V024",
                                severity="ERROR",
                                priority="MEDIUM",
                                confidence=0.90,
                                bucket="HUMAN_REVIEW",
                                message=f"Ambiguous or unparseable date in '{date_field}'",
                                reason=(
                                    f"Value '{raw_date}' cannot be parsed under Indian date policy."
                                ),
                                evidence={
                                    "original_value": str(raw_date),
                                    "candidates": candidates,
                                },
                            )
                        )
                        rows_with_error.add(row_num)

    # Summarize rows
    err_count = len(rows_with_error)
    warn_count = len(rows_with_warning - rows_with_error)
    valid_count = max(0, rows_total - (err_count + warn_count))

    # Review summaries
    review_summary = {"AUTO_FLAG": 0, "HUMAN_REVIEW": 0, "INFO": 0}
    priority_summary = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for iss in issues:
        review_summary[iss.bucket] = review_summary.get(iss.bucket, 0) + 1
        priority_summary[iss.priority] = priority_summary.get(iss.priority, 0) + 1

    # Sort issues by priority (CRITICAL -> HIGH -> MEDIUM -> LOW) then row
    priority_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    issues.sort(key=lambda i: (priority_order.get(i.priority, 4), i.row or 0))

    # Compute Quality Score
    q_score = calculate_quality_score(issues, rows_total)

    # Basic completeness metric
    completeness_metrics = {}
    if not df.empty:
        for col in df.columns:
            non_blank = (df[col].astype(str).str.strip() != "").sum()
            completeness_metrics[col] = round(float(non_blank / len(df)), 2)

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
        metrics={"completeness": completeness_metrics},
        issues=issues,
        review_summary=review_summary,
        priority_summary=priority_summary,
        intake_summary=[],
        reconciliation=[],
        duplicate_clusters=[],
        schema_drift=[],
        anomalies=[],
    )
