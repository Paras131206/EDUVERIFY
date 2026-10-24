"""
Batch profiling module for EduVerify Engine.
Generates comprehensive data quality profiles, type inference, category sets,
and institutional demographic metrics for schema drift tracking and metric history.
"""

from __future__ import annotations

import logging
import re
from typing import TYPE_CHECKING, Any

import pandas as pd

if TYPE_CHECKING:
    from .rules.context import RuleContext

logger = logging.getLogger(__name__)

DATE_REGEX = re.compile(r"^(\d{4}-\d{2}-\d{2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})$")
INT_REGEX = re.compile(r"^-?\d+$")
FLOAT_REGEX = re.compile(r"^-?\d+\.\d+(?:[eE][-+]?\d+)?$")
BOOL_VALUES = {"true", "false", "yes", "no", "t", "f", "1", "0"}


def infer_column_type(series: pd.Series) -> str:
    """Infers high-level semantic data type for a pandas Series."""
    clean = series.dropna().astype(str).str.strip()
    clean = clean[~clean.str.lower().isin(["", "nan", "none", "null"])]
    if clean.empty:
        return "string"

    # Sample up to 100 non-null values for fast inference
    sample = clean.iloc[:100]

    # Boolean check
    if sample.str.lower().isin(BOOL_VALUES).all():
        return "boolean"

    # Integer check
    if sample.apply(lambda s: bool(INT_REGEX.match(s))).all():
        return "integer"

    # Float check
    if sample.apply(lambda s: bool(FLOAT_REGEX.match(s))).all():
        return "float"

    # Date check
    if sample.apply(lambda s: bool(DATE_REGEX.match(s))).all():
        return "date"

    return "string"


def generate_profile(df: pd.DataFrame, ctx: RuleContext | None = None) -> dict[str, Any]:
    """
    Constructs a serializable dictionary profile of a batch DataFrame:
    - columns: list of column names
    - inferred_types: mapping from column to inferred type
    - null_rates: null rate [0..1] per column
    - category_sets: observed discrete categories for enum/categorical columns
    - row_count: total rows in batch
    - metrics: dictionary of key aggregate ratios and rates
    """
    row_count = int(len(df))
    columns = [str(c) for c in df.columns]

    if row_count == 0:
        return {
            "columns": columns,
            "inferred_types": {c: "string" for c in columns},
            "null_rates": {c: 0.0 for c in columns},
            "category_sets": {},
            "row_count": 0,
            "metrics": {
                "rows_total": 0,
                "null_rate": 0.0,
                "supernumerary_share": 0.0,
                "nri_share": 0.0,
                "oci_share": 0.0,
                "fn_share": 0.0,
                "nri_oci_fn_share": 0.0,
                "duplicate_rate": 0.0,
                "missing_id_rate": 0.0,
                "fill_ratio_per_program": {},
            },
        }

    # 1. Null rates and inferred types per column
    null_rates: dict[str, float] = {}
    inferred_types: dict[str, str] = {}
    category_sets: dict[str, list[str]] = {}

    categorical_candidates = {
        "gender",
        "category",
        "seat_type",
        "enrolment_status",
        "course_level",
        "admission_type",
    }

    for col in columns:
        series = df[col]
        # Treat NaN, None, empty string, and literal "null"/"nan" as null
        as_str = series.fillna("").astype(str).str.strip().str.lower()
        is_null_mask = (series.isna()) | (as_str.isin(["", "nan", "none", "null"]))
        null_count = int(is_null_mask.sum())
        rate = round(null_count / row_count, 4)
        null_rates[col] = rate

        col_type = infer_column_type(series)
        inferred_types[col] = col_type

        # Category sets for discrete non-boolean fields
        if col_type != "boolean" and (col in categorical_candidates or col == "category"):
            unique_vals = series.dropna().astype(str).str.strip()
            unique_clean = sorted(
                {v for v in unique_vals if v and v.lower() not in ("nan", "none", "null")}
            )
            if unique_clean:
                category_sets[col] = unique_clean

    # 2. Key institutional metrics
    # Missing ID rate (APAAR ID)
    missing_id_count = 0
    if "apaar_id" in df.columns:
        apaar_clean = df["apaar_id"].fillna("").astype(str).str.strip()
        missing_id_count = int(
            (
                apaar_clean.isin(["", "nan", "none", "null"])
                | (apaar_clean.str.len() != 12)
                | (~apaar_clean.str.isdigit())
            ).sum()
        )
    missing_id_rate = round(missing_id_count / row_count, 4)

    # NRI, OCI, FN shares
    def _is_truthy(val: Any) -> bool:
        return str(val).strip().lower() in ("true", "1", "yes", "t")

    nri_mask = pd.Series(False, index=df.index)
    if "nri_status" in df.columns:
        nri_mask = nri_mask | df["nri_status"].apply(_is_truthy)
    if "quota" in df.columns:
        nri_mask = nri_mask | (df["quota"].astype(str).str.strip().str.upper() == "NRI")
    nri_count = int(nri_mask.sum())
    nri_share = round(nri_count / row_count, 4)

    oci_mask = pd.Series(False, index=df.index)
    if "oci_status" in df.columns:
        oci_mask = oci_mask | df["oci_status"].apply(_is_truthy)
    if "quota" in df.columns:
        oci_mask = oci_mask | (df["quota"].astype(str).str.strip().str.upper() == "OCI")
    oci_count = int(oci_mask.sum())
    oci_share = round(oci_count / row_count, 4)

    fn_mask = pd.Series(False, index=df.index)
    if "fn_status" in df.columns:
        fn_mask = fn_mask | df["fn_status"].apply(_is_truthy)
    if "quota" in df.columns:
        fn_mask = fn_mask | (df["quota"].astype(str).str.strip().str.upper() == "FN")
    fn_count = int(fn_mask.sum())
    fn_share = round(fn_count / row_count, 4)

    nri_oci_fn_share = round(int((nri_mask | oci_mask | fn_mask).sum()) / row_count, 4)

    # Supernumerary share
    super_mask = pd.Series(False, index=df.index)
    if "seat_type" in df.columns:
        super_mask = super_mask | (
            df["seat_type"].astype(str).str.strip().str.upper() == "SUPERNUMERARY"
        )
    if "supernumerary_scheme" in df.columns:
        scheme_str = df["supernumerary_scheme"].fillna("").astype(str).str.strip()
        super_mask = super_mask | (~scheme_str.str.lower().isin(["", "nan", "none", "null"]))
    super_share = round(int(super_mask.sum()) / row_count, 4)

    # Duplicate rate (intra-batch)
    dup_count = 0
    if "apaar_id" in df.columns:
        valid_apaar = df["apaar_id"].dropna().astype(str).str.strip()
        valid_apaar = valid_apaar[valid_apaar.str.len() == 12]
        dup_count = int(valid_apaar.duplicated().sum())
    duplicate_rate = round(dup_count / row_count, 4)

    # Average null rate across columns
    avg_null_rate = round(sum(null_rates.values()) / max(1, len(null_rates)), 4)

    # Fill ratio per program
    fill_ratio_per_program: dict[str, float] = {}
    if "program_code" in df.columns:
        programs = df["program_code"].dropna().unique()
        for prog in programs:
            prog_str = str(prog).strip()
            if not prog_str or prog_str.lower() in ("nan", "none", "null"):
                continue
            prog_count = int((df["program_code"].astype(str).str.strip() == prog_str).sum())
            approved = 60
            if ctx is not None:
                intake_rec = ctx.get_intake_record(prog_str)
                if intake_rec and "approved_intake" in intake_rec:
                    try:
                        approved = int(intake_rec["approved_intake"])
                    except (ValueError, TypeError):
                        approved = 60
            fill_ratio_per_program[prog_str] = round(prog_count / max(1, approved), 4)

    metrics = {
        "rows_total": row_count,
        "null_rate": avg_null_rate,
        "supernumerary_share": super_share,
        "nri_share": nri_share,
        "oci_share": oci_share,
        "fn_share": fn_share,
        "nri_oci_fn_share": nri_oci_fn_share,
        "duplicate_rate": duplicate_rate,
        "missing_id_rate": missing_id_rate,
        "fill_ratio_per_program": fill_ratio_per_program,
    }

    return {
        "columns": columns,
        "inferred_types": inferred_types,
        "null_rates": null_rates,
        "category_sets": category_sets,
        "row_count": row_count,
        "metrics": metrics,
    }
