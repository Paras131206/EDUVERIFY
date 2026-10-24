"""
Schema drift detection module for EduVerify Engine.
Implements Task C5.2:
- V028: Required column removed / type changed
- V029: New unseen category values
- V030: Missing-ID or null-rate jump (> 3x or +10 percentage points)
Produces SchemaDrift objects for BatchReport and Issue objects for review.
"""

import logging
from pathlib import Path
from typing import Any

import pandas as pd

from .models import Issue, SchemaDrift
from .profile import generate_profile
from .rules.context import RuleContext
from .rules.registry import make_issue, rule

logger = logging.getLogger(__name__)


def _get_baseline_profile(ctx: RuleContext) -> dict[str, Any] | None:
    """Retrieves previous batch profile from ctx or builds one from demo baseline if present."""
    if hasattr(ctx, "previous_batch_profile") and ctx.previous_batch_profile:
        return ctx.previous_batch_profile

    # Fallback to demo baseline file batch_1_clean.csv if available
    repo_root = getattr(ctx, "repo_root", None) or Path(".")
    baseline_path = repo_root / "data" / "demo" / "batch_1_clean.csv"
    if baseline_path.exists():
        try:
            baseline_df = pd.read_csv(baseline_path, dtype=str)
            baseline_profile = generate_profile(baseline_df, ctx)
            ctx.previous_batch_profile = baseline_profile
            return baseline_profile
        except Exception as e:
            logger.debug("Failed loading baseline profile from batch_1_clean.csv: %s", e)

    return None


def detect_schema_drift(
    df: pd.DataFrame,
    ctx: RuleContext,
    current_profile: dict[str, Any] | None = None,
) -> tuple[list[Issue], list[SchemaDrift]]:
    """
    Compares current batch profile against previous_batch_profile.
    Returns: (issues, schema_drift_entries)
    """
    cached = getattr(ctx, "_drift_cache", None)
    if cached is not None:
        return cached

    profile = current_profile or generate_profile(df, ctx)
    prev_profile = _get_baseline_profile(ctx)

    if not prev_profile:
        result = ([], [])
        ctx._drift_cache = result
        return result

    issues: list[Issue] = []
    drift_events: list[SchemaDrift] = []

    prev_cols = set(prev_profile.get("columns", []))
    curr_cols = set(profile.get("columns", []))

    # 1. Column Removed (V028)
    removed_cols = sorted(list(prev_cols - curr_cols))
    for col in removed_cols:
        drift_events.append(
            SchemaDrift(
                kind="COLUMN_REMOVED",
                column=col,
                previous=True,
                current=False,
            )
        )
        issues.append(
            make_issue(
                rule_id="V028",
                ctx=ctx,
                field=col,
                message=f"Schema drift: Column '{col}' removed compared to previous batch",
                reason=(
                    f"Column '{col}' was present in previous institutional batch profile, "
                    "but is missing in the current upload."
                ),
                evidence={"column": col, "status": "REMOVED"},
                severity="WARN",
                priority="MEDIUM",
                bucket="HUMAN_REVIEW",
                confidence=1.0,
            )
        )

    # 2. Type Changed (V028)
    prev_types = prev_profile.get("inferred_types", {})
    curr_types = profile.get("inferred_types", {})
    common_cols = prev_cols & curr_cols

    for col in sorted(list(common_cols)):
        pt = prev_types.get(col)
        ct = curr_types.get(col)
        if pt and ct and pt != ct and pt != "string":
            drift_events.append(
                SchemaDrift(
                    kind="TYPE_CHANGED",
                    column=col,
                    previous=pt,
                    current=ct,
                )
            )
            issues.append(
                make_issue(
                    rule_id="V028",
                    ctx=ctx,
                    field=col,
                    message=f"Schema drift: Column '{col}' data type changed from '{pt}' to '{ct}'",
                    reason=(
                        f"Column '{col}' semantic data type shifted from {pt} in previous profile "
                        f"to {ct} in current batch."
                    ),
                    evidence={"column": col, "previous_type": pt, "current_type": ct},
                    severity="WARN",
                    priority="MEDIUM",
                    bucket="HUMAN_REVIEW",
                    confidence=0.90,
                )
            )

    # 3. New Category Values (V029)
    prev_cats = prev_profile.get("category_sets", {})
    curr_cats = profile.get("category_sets", {})

    for col, curr_vals in curr_cats.items():
        if col in prev_cats and prev_cats[col]:
            known_vals = set(prev_cats[col])
            unseen = sorted(list(set(curr_vals) - known_vals))
            if unseen:
                drift_events.append(
                    SchemaDrift(
                        kind="NEW_CATEGORY",
                        column=col,
                        previous=prev_cats[col],
                        current=unseen,
                    )
                )
                issues.append(
                    make_issue(
                        rule_id="V029",
                        ctx=ctx,
                        field=col,
                        message=f"Schema drift: New category value(s) in '{col}': {', '.join(unseen)}",
                        reason=(
                            f"Column '{col}' contains new unseen value(s) {unseen} "
                            "not present in previous institutional uploads."
                        ),
                        evidence={
                            "column": col,
                            "new_categories": unseen,
                            "known_categories": prev_cats[col],
                        },
                        severity="WARN",
                        priority="LOW",
                        bucket="INFO",
                        confidence=0.95,
                    )
                )

    # 4. Null-Rate or Missing-ID Rate Jump (V030)
    prev_nulls = prev_profile.get("null_rates", {})
    curr_nulls = profile.get("null_rates", {})

    for col in sorted(list(curr_nulls.keys())):
        prev_r = prev_nulls.get(col, 0.0)
        curr_r = curr_nulls[col]
        # Condition: rate jumped > 3x (with at least 5% nulls) or increased by >= 10 percentage points
        if (curr_r > 3.0 * prev_r and curr_r >= 0.05) or (curr_r >= prev_r + 0.10):
            drift_events.append(
                SchemaDrift(
                    kind="NULL_RATE_JUMP",
                    column=col,
                    previous=round(prev_r, 4),
                    current=round(curr_r, 4),
                )
            )
            issues.append(
                make_issue(
                    rule_id="V030",
                    ctx=ctx,
                    field=col,
                    message=f"Null-rate jump in column '{col}' ({prev_r:.1%} -> {curr_r:.1%})",
                    reason=(
                        f"Null rate for '{col}' increased significantly from {prev_r:.1%} to {curr_r:.1%} "
                        "(exceeds 3x baseline or +10 percentage points)."
                    ),
                    evidence={
                        "column": col,
                        "previous_null_rate": prev_r,
                        "current_null_rate": curr_r,
                    },
                    severity="WARN",
                    priority="HIGH",
                    bucket="HUMAN_REVIEW",
                    confidence=0.95,
                )
            )

    # Missing-ID Jump check on apaar_id
    prev_mid = prev_profile.get("metrics", {}).get("missing_id_rate", 0.0)
    curr_mid = profile.get("metrics", {}).get("missing_id_rate", 0.0)
    if (curr_mid > 3.0 * prev_mid and curr_mid >= 0.05) or (curr_mid >= prev_mid + 0.10):
        # Don't duplicate if already flagged in column null-rate
        if not any(e.kind == "NULL_RATE_JUMP" and e.column == "apaar_id" for e in drift_events):
            drift_events.append(
                SchemaDrift(
                    kind="NULL_RATE_JUMP",
                    column="apaar_id",
                    previous=round(prev_mid, 4),
                    current=round(curr_mid, 4),
                )
            )
            issues.append(
                make_issue(
                    rule_id="V030",
                    ctx=ctx,
                    field="apaar_id",
                    message=f"Missing-ID rate jump ({prev_mid:.1%} -> {curr_mid:.1%})",
                    reason=f"Missing or invalid APAAR ID rate jumped from {prev_mid:.1%} to {curr_mid:.1%}.",
                    evidence={
                        "metric": "missing_id_rate",
                        "previous_rate": prev_mid,
                        "current_rate": curr_mid,
                    },
                    severity="WARN",
                    priority="HIGH",
                    bucket="HUMAN_REVIEW",
                    confidence=0.95,
                )
            )

    result = (issues, drift_events)
    ctx._drift_cache = result
    ctx._schema_drift = drift_events
    return result


# -------------------------------------------------------------
# Rule Registry bindings: V028, V029, V030
# -------------------------------------------------------------
@rule("V028")
def rule_v028_schema_drift_columns(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """Schema drift: required column removed or type changed."""
    issues, _ = detect_schema_drift(df, ctx)
    return [i for i in issues if i.rule_id == "V028"]


@rule("V029")
def rule_v029_schema_drift_new_category(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """Schema drift: new unseen category value."""
    issues, _ = detect_schema_drift(df, ctx)
    return [i for i in issues if i.rule_id == "V029"]


@rule("V030")
def rule_v030_schema_drift_null_jump(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """Missing-ID or null-rate jump vs previous batch."""
    issues, _ = detect_schema_drift(df, ctx)
    return [i for i in issues if i.rule_id == "V030"]
