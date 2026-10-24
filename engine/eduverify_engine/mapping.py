"""
Smart column mapping engine for EduVerify (USP 6).
Maps arbitrary header names to canonical student_record fields using:
1. Saved institution profile
2. Exact synonym dictionary lookup
3. Normalized synonym lookup
4. RapidFuzz token_set_ratio + Jaro-Winkler (>= 85 threshold)
5. Value-pattern sniffing (12-digit APAAR, dates)
"""

import re
from pathlib import Path

import pandas as pd
import yaml
from rapidfuzz import distance, fuzz

from .models import ColumnMapping

# Mandatory canonical fields (agents.md §5.1)
REQUIRED_FIELDS = [
    "apaar_id",
    "institution_student_id",
    "full_name",
    "dob",
    "gender",
    "category",
    "program_code",
    "course_level",
    "academic_year",
    "year_of_study",
    "admission_date",
    "admission_type",
    "seat_type",
    "quota",
    "nationality",
    "enrolment_status",
    "consent_status",
]


def normalize_token(s: str) -> str:
    """Lowercases, strips, and collapses underscores/spaces/hyphens."""
    if not s:
        return ""
    clean = re.sub(r"[\s_\-\.]+", " ", str(s).strip().lower())
    return clean


def load_synonyms(synonyms_path: Path | str | None = None) -> dict[str, list[str]]:
    """Loads column_synonyms.yaml from contracts or provided path."""
    if synonyms_path is None:
        # Check standard locations
        curr = Path(__file__).resolve()
        candidates = [
            curr.parent.parent.parent / "contracts" / "column_synonyms.yaml",
            curr.parent.parent / "contracts" / "column_synonyms.yaml",
            Path("contracts/column_synonyms.yaml"),
        ]
        for c in candidates:
            if c.exists():
                synonyms_path = c
                break

    if synonyms_path and Path(synonyms_path).exists():
        with open(synonyms_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            return data.get("synonyms", {})
    return {}


def sniff_column_pattern(values: list[str]) -> str | None:
    """Sniffs data patterns: 12-digit numbers (APAAR) or dates."""
    non_empty = [str(v).strip() for v in values if str(v).strip()]
    if not non_empty:
        return None

    # Check 12-digit numeric density
    twelve_digit_count = sum(1 for v in non_empty if re.fullmatch(r"\d{12}", v))
    if twelve_digit_count / len(non_empty) >= 0.7:
        return "apaar_id"

    # Check date patterns (YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY)
    date_regex = r"(\d{4}[-/]\d{1,2}[-/]\d{1,2})|(\d{1,2}[-/.]\d{1,2}[-/.]\d{4})"
    date_count = sum(1 for v in non_empty if re.search(date_regex, v))
    if date_count / len(non_empty) >= 0.7:
        return "admission_date"

    return None


def suggest_mapping(
    headers: list[str],
    synonyms: dict[str, list[str]] | None = None,
    saved_profile: dict[str, str] | None = None,
    sample_df: pd.DataFrame | None = None,
) -> list[ColumnMapping]:
    """
    Suggests canonical field mappings for uploaded headers.
    Returns list of ColumnMapping objects.
    """
    if synonyms is None:
        synonyms = load_synonyms()
    if saved_profile is None:
        saved_profile = {}

    mappings: list[ColumnMapping] = []
    mapped_targets: set[str] = set()

    # Pre-compute normalized synonym table: norm_synonym -> canonical_field
    norm_syn_table: dict[str, str] = {}
    for canonical_field, syn_list in synonyms.items():
        norm_syn_table[normalize_token(canonical_field)] = canonical_field
        for syn in syn_list:
            norm_syn_table[normalize_token(syn)] = canonical_field

    for header in headers:
        header_str = str(header).strip()
        norm_header = normalize_token(header_str)

        # 1. Saved profile
        if header_str in saved_profile:
            target = saved_profile[header_str]
            mappings.append(
                ColumnMapping(source=header_str, target=target, confidence=1.0, method="user")
            )
            mapped_targets.add(target)
            continue

        # 2. Exact match on canonical field name
        if norm_header in [normalize_token(f) for f in synonyms.keys()]:
            for can_field in synonyms.keys():
                if norm_header == normalize_token(can_field):
                    mappings.append(
                        ColumnMapping(
                            source=header_str, target=can_field, confidence=1.0, method="exact"
                        )
                    )
                    mapped_targets.add(can_field)
                    break
            continue

        # 3. Exact match in synonym list
        if norm_header in norm_syn_table:
            target = norm_syn_table[norm_header]
            mappings.append(
                ColumnMapping(source=header_str, target=target, confidence=0.98, method="synonym")
            )
            mapped_targets.add(target)
            continue

        # 4. RapidFuzz token_set_ratio + Jaro-Winkler matching (threshold >= 85)
        best_match_field: str | None = None
        best_score = 0.0

        for canonical_field, syn_list in synonyms.items():
            if canonical_field in mapped_targets:
                continue

            candidates = [canonical_field] + syn_list
            for cand in candidates:
                norm_cand = normalize_token(cand)
                # Combine token_set_ratio and jaro_winkler
                ts_ratio = fuzz.token_set_ratio(norm_header, norm_cand)
                jw_ratio = distance.JaroWinkler.similarity(norm_header, norm_cand) * 100
                score = max(ts_ratio, jw_ratio)
                if score > best_score:
                    best_score = score
                    best_match_field = canonical_field

        if best_match_field and best_score >= 85.0:
            confidence = min(0.95, round(best_score / 100.0, 2))
            mappings.append(
                ColumnMapping(
                    source=header_str,
                    target=best_match_field,
                    confidence=confidence,
                    method="fuzzy",
                )
            )
            mapped_targets.add(best_match_field)
            continue

        # 5. Value pattern sniffing if sample_df provided
        if sample_df is not None and header in sample_df.columns:
            sample_vals = sample_df[header].dropna().head(50).tolist()
            sniffed_field = sniff_column_pattern(sample_vals)
            if sniffed_field and sniffed_field not in mapped_targets:
                mappings.append(
                    ColumnMapping(
                        source=header_str,
                        target=sniffed_field,
                        confidence=0.85,
                        method="sniffed",
                    )
                )
                mapped_targets.add(sniffed_field)
                continue

    return mappings


def find_missing_required_fields(
    mappings: list[ColumnMapping], required_fields: list[str] | None = None
) -> list[str]:
    """Returns list of mandatory canonical fields that were not mapped."""
    if required_fields is None:
        required_fields = REQUIRED_FIELDS
    mapped_targets = {m.target for m in mappings}
    return [rf for rf in required_fields if rf not in mapped_targets]
