"""
Quality scoring and Deequ-style column metrics for EduVerify Engine.
Implements:
1. Quality score calculation per agents.md §5.3.
2. Column-level completeness, validity, and uniqueness metrics.
"""

from collections import Counter

import pandas as pd

from .models import Issue

PRIORITY_WEIGHTS = {
    "CRITICAL": 10,
    "HIGH": 5,
    "MEDIUM": 2,
    "LOW": 1,
}
MAX_PRIORITY_WEIGHT = 10


def calculate_quality_score(issues: list[Issue], rows_total: int) -> float:
    """
    Computes quality score [0..100] per agents.md §5.3:
    quality_score = 100 * (1 - sum(weight_priority * issues) / (rows_total * max_weight))
    weights: CRITICAL 10, HIGH 5, MEDIUM 2, LOW 1.
    Clipped to [0.0, 100.0] and rounded to 1 decimal place.
    """
    if rows_total <= 0:
        return 100.0

    total_penalty = sum(PRIORITY_WEIGHTS.get(i.priority, 1) for i in issues)
    raw_score = 100.0 * (1.0 - (total_penalty / (rows_total * MAX_PRIORITY_WEIGHT)))
    return max(0.0, min(100.0, round(raw_score, 1)))


def calculate_deequ_metrics(
    df: pd.DataFrame,
    issues: list[Issue] | None = None,
) -> dict[str, dict[str, float]]:
    """
    Computes Deequ-style column-level metrics:
    - completeness: ratio of non-null/non-blank values in column [0..1]
    - validity: ratio of rows in column without fatal ERROR issues [0..1]
    - uniqueness: ratio of distinct non-blank values to total non-blank rows [0..1]
    """
    issues = issues or []
    total_rows = len(df)

    completeness: dict[str, float] = {}
    validity: dict[str, float] = {}
    uniqueness: dict[str, float] = {}

    if total_rows == 0:
        return {
            "completeness": {},
            "validity": {},
            "uniqueness": {},
        }

    # Count errors per field
    error_counts_per_field = Counter(i.field for i in issues if i.severity == "ERROR" and i.field)

    for col in df.columns:
        series = df[col]
        # Treat NaN, None, and empty string as blank
        non_blank_mask = (
            series.notna()
            & (series.astype(str).str.strip() != "")
            & (~series.astype(str).str.strip().str.lower().isin(["nan", "none", "null"]))
        )
        non_blank_count = int(non_blank_mask.sum())

        # 1. Completeness
        completeness[col] = round(float(non_blank_count / total_rows), 3)

        # 2. Validity
        col_errors = error_counts_per_field.get(col, 0)
        valid_rows = max(0, total_rows - col_errors)
        validity[col] = round(float(valid_rows / total_rows), 3)

        # 3. Uniqueness
        if non_blank_count > 0:
            distinct_count = int(series[non_blank_mask].astype(str).nunique())
            uniqueness[col] = round(float(distinct_count / non_blank_count), 3)
        else:
            uniqueness[col] = 1.0

    return {
        "completeness": completeness,
        "validity": validity,
        "uniqueness": uniqueness,
    }
