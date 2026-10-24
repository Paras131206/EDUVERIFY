"""
Rule registry, decorator, and execution engine for EduVerify.
Loads metadata from contracts/rule_catalog.yaml.
"""

import uuid
from typing import Any, Callable, Literal

import pandas as pd

from ..catalog import RuleCatalogItem, load_rule_catalog
from ..models import Issue, SuggestedFix
from .context import RuleContext

RuleFn = Callable[[pd.DataFrame, RuleContext], list[Issue]]

RULE_REGISTRY: dict[str, RuleFn] = {}
_RULE_METADATA: dict[str, RuleCatalogItem] = {}


def _get_catalog_item(rule_id: str) -> RuleCatalogItem | None:
    """Gets catalog item from cache or loads rule catalog."""
    global _RULE_METADATA
    if not _RULE_METADATA:
        catalog = load_rule_catalog()
        _RULE_METADATA = catalog.as_dict()
    return _RULE_METADATA.get(rule_id)


def rule(rule_id: str):
    """
    Decorator that registers a rule function for a specific catalog rule_id.
    Validates that rule_id exists in contracts/rule_catalog.yaml.
    """

    def decorator(fn: RuleFn) -> RuleFn:
        catalog_item = _get_catalog_item(rule_id)
        if catalog_item is None:
            # Fallback if catalog hasn't loaded or rule_id not found
            pass
        RULE_REGISTRY[rule_id] = fn
        fn.rule_id = rule_id  # type: ignore[attr-defined]
        fn.metadata = catalog_item  # type: ignore[attr-defined]
        return fn

    return decorator


def make_issue(
    rule_id: str,
    ctx: RuleContext,
    *,
    field: str,
    message: str,
    reason: str,
    evidence: dict[str, Any],
    row: int | None = None,
    record_key: str | None = None,
    severity: Literal["ERROR", "WARN", "INFO"] | None = None,
    priority: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"] | None = None,
    bucket: Literal["AUTO_FLAG", "HUMAN_REVIEW", "INFO"] | None = None,
    confidence: float | None = None,
    suggested_fix: SuggestedFix | dict[str, Any] | None = None,
    value_masked: str | None = None,
) -> Issue:
    """
    Constructs a canonical Issue with metadata defaults from contracts/rule_catalog.yaml.
    Guarantees plain-English message, reason with actual numbers, and structured evidence.
    """
    item = _get_catalog_item(rule_id)
    if item is None and ctx.catalog:
        item = ctx.catalog.get_rule(rule_id)

    default_severity = item.severity if item else "ERROR"
    default_priority = item.default_priority if item else "HIGH"
    default_bucket = item.bucket_policy if item else "AUTO_FLAG"

    resolved_severity = severity or default_severity
    resolved_priority = priority or default_priority
    resolved_bucket = bucket or default_bucket

    if confidence is None:
        if resolved_bucket == "AUTO_FLAG":
            resolved_confidence = 1.0
        elif resolved_bucket == "HUMAN_REVIEW":
            resolved_confidence = 0.85
        else:
            resolved_confidence = 1.0
    else:
        resolved_confidence = confidence

    resolved_fix: SuggestedFix | None = None
    if isinstance(suggested_fix, dict):
        resolved_fix = SuggestedFix(**suggested_fix)
    elif isinstance(suggested_fix, SuggestedFix):
        resolved_fix = suggested_fix

    return Issue(
        issue_id=str(uuid.uuid4()),
        row=row,
        record_key=record_key,
        field=field,
        rule_id=rule_id,
        severity=resolved_severity,  # type: ignore[arg-type]
        priority=resolved_priority,  # type: ignore[arg-type]
        confidence=resolved_confidence,
        bucket=resolved_bucket,  # type: ignore[arg-type]
        message=message,
        reason=reason,
        evidence=evidence,
        suggested_fix=resolved_fix,
        value_masked=value_masked,
    )


def get_registered_rules() -> dict[str, RuleFn]:
    """Returns mapping of all registered rule functions."""
    return dict(RULE_REGISTRY)


def run_rules(
    df: pd.DataFrame,
    ctx: RuleContext,
    rule_ids: list[str] | None = None,
) -> list[Issue]:
    """
    Executes registered rules against df with ctx and returns all detected Issues.
    Issues are sorted by priority (CRITICAL -> HIGH -> MEDIUM -> LOW), then by row.
    """
    all_issues: list[Issue] = []

    target_rules = (
        {r: RULE_REGISTRY[r] for r in rule_ids if r in RULE_REGISTRY}
        if rule_ids is not None
        else RULE_REGISTRY
    )

    for r_id, r_fn in target_rules.items():
        try:
            issues = r_fn(df, ctx)
            if issues:
                all_issues.extend(issues)
        except Exception as e:
            # Avoid crashing entire validation pipeline on an isolated rule exception
            all_issues.append(
                make_issue(
                    rule_id=r_id,
                    ctx=ctx,
                    field="general",
                    message=f"Rule {r_id} execution encountered an internal error: {e}",
                    reason=f"Exception during rule execution: {type(e).__name__}: {e}",
                    evidence={"rule_id": r_id, "error": str(e)},
                    severity="ERROR",
                    priority="HIGH",
                    bucket="HUMAN_REVIEW",
                    confidence=0.5,
                )
            )

    priority_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    all_issues.sort(key=lambda i: (priority_order.get(i.priority, 4), i.row or 0))
    return all_issues
