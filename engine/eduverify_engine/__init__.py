"""
EduVerify Engine - AI & Data Validation Engine for EduVerify.
Pure Python package (no DB, no HTTP in library).
"""

__version__ = "0.0.1"

from .dedup import detect_duplicates
from .mapping import suggest_mapping
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
from .normalize import normalize_apaar, normalize_boolean, normalize_date, normalize_name
from .parse import ParsedFile, parse_file
from .report import compare_reports, export_report
from .validate import RegistryEntry, RegistryProtocol, validate_batch

__all__ = [
    "__version__",
    "Anomaly",
    "BatchReport",
    "ColumnMapping",
    "DQComparison",
    "DuplicateCluster",
    "DuplicateMember",
    "IntakeSummary",
    "Issue",
    "ParsedFile",
    "ReconciliationRow",
    "RegistryEntry",
    "RegistryProtocol",
    "SchemaDrift",
    "SuggestedFix",
    "compare_reports",
    "detect_duplicates",
    "export_report",
    "mask_apaar",
    "mask_email",
    "mask_mobile",
    "normalize_apaar",
    "normalize_boolean",
    "normalize_date",
    "normalize_name",
    "parse_file",
    "suggest_mapping",
    "validate_batch",
]
