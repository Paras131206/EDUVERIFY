"""
EduVerify Engine - AI & Data Validation Engine for EduVerify.
Pure Python package (no DB, no HTTP in library).
"""

__version__ = "0.0.1"

from .masking import mask_apaar, mask_email, mask_mobile
from .models import (
    Anomaly,
    BatchReport,
    ColumnMapping,
    DQComparison,
    DuplicateCluster,
    DuplicateMember,
    IntakeSummary,
    Issue,
    ReconciliationRow,
    SchemaDrift,
    SuggestedFix,
)

__all__ = [
    "__version__",
    "BatchReport",
    "ColumnMapping",
    "DQComparison",
    "Issue",
    "SuggestedFix",
    "DuplicateCluster",
    "DuplicateMember",
    "SchemaDrift",
    "Anomaly",
    "IntakeSummary",
    "ReconciliationRow",
    "mask_apaar",
    "mask_email",
    "mask_mobile",
]
