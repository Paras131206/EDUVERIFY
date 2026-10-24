"""
EduVerify Engine - AI & Data Validation Engine for EduVerify.
Pure Python package (no DB, no HTTP in library).
"""

__version__ = "1.0.0"

from .anomaly import detect_anomalies
from .dedup import detect_duplicates
from .drift import detect_schema_drift
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
from .profile import generate_profile
from .reconcile import reconcile_aggregate, reconcile_batch
from .report import compare_reports, export_report
from .rollover import rollover_preview
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
    "detect_anomalies",
    "detect_duplicates",
    "detect_schema_drift",
    "export_report",
    "generate_profile",
    "mask_apaar",
    "mask_email",
    "mask_mobile",
    "normalize_apaar",
    "normalize_boolean",
    "normalize_date",
    "normalize_name",
    "parse_file",
    "reconcile_aggregate",
    "reconcile_batch",
    "rollover_preview",
    "suggest_mapping",
    "validate_batch",
]
