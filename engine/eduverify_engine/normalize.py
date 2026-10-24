"""
Data normalization helpers for EduVerify Engine.
Implements:
1. Indian Date Policy (agents.md §8.9): canonical ISO, DD-MM-YYYY default, never MM/DD.
2. APAAR normalization & Excel mangling detection (V023).
3. Name normalization (name_norm) for fuzzy deduplication.
4. Boolean normalization (English & Hindi).
"""

import re
from datetime import date, datetime, timedelta
from typing import Any

from .models import SuggestedFix

HONORIFICS_REGEX = r"^(mr|ms|mrs|dr|prof|shri|smt|kumari|kumar|master)\.?\s+"

TRANSLITERATION_MAP = {
    r"\b(mohammed|mohd|md)\b": "mohammad",
    r"\blaxmi\b": "lakshmi",
    r"\b(choudhary|chowdhury)\b": "chaudhary",
    r"\bdiksha\b": "deeksha",
    r"\bvirendra\b": "virender",
    r"\bshanker\b": "shankar",
    r"\byadava?\b": "yadav",
}


def normalize_date(val: Any, cell_type: str | None = None) -> tuple[str | None, list[str], bool]:
    """
    Parses date under Indian Date Policy.
    Returns: (canonical_iso_date_or_none, candidates_tried, is_valid)
    Never assumes MM/DD/YYYY.
    """
    if val is None:
        return None, [], True
    s = str(val).strip()
    if not s or s.lower() in ("nan", "none", "null", ""):
        return None, [], True

    # 1. Try ISO YYYY-MM-DD
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", s):
        try:
            parsed = datetime.strptime(s, "%Y-%m-%d").date()
            return parsed.isoformat(), [s], True
        except ValueError:
            return None, [s], False

    # 2. Excel numeric serial date (e.g. 45678 or 45678.0)
    if (cell_type in ("n", "d", "numeric", "date") or s.replace(".", "", 1).isdigit()) and float(
        s
    ) > 1000:
        try:
            num = float(s)
            if 10000 <= num <= 70000:  # Covers ~1927 to ~2091
                excel_epoch = date(1899, 12, 30)
                parsed = excel_epoch + timedelta(days=int(num))
                return parsed.isoformat(), [f"Excel serial {num}"], True
        except (ValueError, OverflowError):
            pass

    # 3. Indian standard date formats: DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
    candidates = []
    # Match DD[-/.]MM[-/.]YYYY
    m = re.fullmatch(r"(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})", s)
    if m:
        d_str, m_str, y_str = m.group(1), m.group(2), m.group(3)
        day, month, year = int(d_str), int(m_str), int(y_str)
        candidates.append(f"{year:04d}-{month:02d}-{day:02d}")
        try:
            parsed = date(year, month, day)
            return parsed.isoformat(), candidates, True
        except ValueError:
            return None, candidates, False

    # 4. Mon format: DD-Mon-YYYY (e.g. 10-Aug-2026)
    for fmt in ("%d-%b-%Y", "%d %b %Y", "%d/%b/%Y", "%d-%B-%Y", "%d %B %Y"):
        try:
            parsed = datetime.strptime(s, fmt).date()
            return parsed.isoformat(), [parsed.isoformat()], True
        except ValueError:
            pass

    # Unparseable date
    return None, [s], False


def normalize_apaar(val: Any) -> tuple[str, str | None, SuggestedFix | None]:
    """
    Cleans APAAR and detects Excel auto-mangling (V023).
    Returns: (cleaned_string, defect_kind_or_none, suggested_fix_or_none)
    """
    if val is None:
        return "", None, None
    raw = str(val).strip()
    if not raw or raw.lower() in ("nan", "none", "null"):
        return "", None, None

    # Strip spaces and hyphens
    clean = re.sub(r"[\s\-]+", "", raw)

    # 1. Scientific notation e.g. 1.23457E+11
    if "e+" in clean.lower() or "e-" in clean.lower():
        try:
            num = float(clean)
            recovered = f"{int(num):012d}"
            return (
                recovered,
                "SCIENTIFIC_NOTATION",
                SuggestedFix(
                    value=recovered,
                    rationale="Recovered 12-digit integer from scientific notation",
                    requires_approval=True,
                ),
            )
        except (ValueError, OverflowError):
            return clean, "SCIENTIFIC_NOTATION", None

    # 2. Float suffix .0 (e.g. 123456789012.0)
    if clean.endswith(".0"):
        clean = clean[:-2]
        return (
            clean,
            "FLOAT_SUFFIX",
            SuggestedFix(
                value=clean,
                rationale="Stripped Excel numeric .0 decimal suffix",
                requires_approval=True,
            ),
        )

    # 3. 11 digits numeric (dropped leading zero)
    if len(clean) == 11 and clean.isdigit():
        padded = f"0{clean}"
        return (
            padded,
            "DROPPED_LEADING_ZERO",
            SuggestedFix(
                value=padded,
                rationale="Left-padded missing leading zero to restore 12 digits",
                requires_approval=True,
            ),
        )

    return clean, None, None


def normalize_name(name: str | None) -> str:
    """
    Computes name_norm:
    Strips honorifics, removes punctuation, collapses initials, applies transliteration mapping.
    """
    if not name:
        return ""
    clean = str(name).strip().lower()

    # Strip honorifics
    clean = re.sub(HONORIFICS_REGEX, "", clean)

    # Strip dots from initials: 'r. s. sharma' -> 'r s sharma'
    clean = re.sub(r"\b([a-z])\.", r"\1", clean)

    # Collapse consecutive single-letter initials: 'r s sharma' -> 'rs sharma'
    clean = re.sub(r"\b([a-z])\s+(?=[a-z]\b)", r"\1", clean)

    # Remove non-alphanumeric except space
    clean = re.sub(r"[^\w\s]", "", clean)

    # Apply transliteration substitutions
    for pattern, repl in TRANSLITERATION_MAP.items():
        clean = re.sub(pattern, repl, clean)

    # Collapse multiple spaces
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean


def normalize_boolean(val: Any) -> str:
    """
    Normalizes boolean representations in English and Hindi to 'True' or 'False'.
    """
    if val is None:
        return "False"
    s = str(val).strip().lower()
    if s in ("true", "t", "yes", "y", "1", "हाँ", "हां"):
        return "True"
    if s in ("false", "f", "no", "n", "0", "नहीं", "नही", ""):
        return "False"
    return "False"
