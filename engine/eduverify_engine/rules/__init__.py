"""
EduVerify Validation Rules Package.
Exports RuleContext, @rule decorator, and execution functions.
All rules self-register on package import.
"""

from .. import anomaly, dedup, drift, reconcile, rollover
from . import (
    academic,
    aggregates,
    completeness,
    format_consistency,
    identity,
    institution,
    quota_status,
)
from .context import RuleContext
from .registry import (
    RULE_REGISTRY,
    RuleFn,
    get_registered_rules,
    make_issue,
    rule,
    run_rules,
)

__all__ = [
    "RuleContext",
    "RuleFn",
    "rule",
    "make_issue",
    "run_rules",
    "get_registered_rules",
    "RULE_REGISTRY",
    "academic",
    "aggregates",
    "anomaly",
    "completeness",
    "dedup",
    "drift",
    "format_consistency",
    "identity",
    "institution",
    "quota_status",
    "reconcile",
    "rollover",
]
