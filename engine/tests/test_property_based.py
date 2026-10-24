"""
Property-based tests for EduVerify Engine using Hypothesis.
Verifies invariants:
1. Masking functions never raise and never emit raw 12-digit APAAR numbers.
2. validate_batch issue messages, reasons, and masked values never leak raw 12-digit APAARs.
3. Parser handles arbitrary string and byte inputs safely without crashing.
"""

from __future__ import annotations

import re
from typing import Any

import pandas as pd
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from eduverify_engine.masking import mask_apaar, mask_email, mask_mobile
from eduverify_engine.normalize import normalize_apaar, normalize_date
from eduverify_engine.parse import parse_file
from eduverify_engine.validate import validate_batch

RAW_12_DIGIT_REGEX = re.compile(r"\b\d{12}\b")


# -----------------------------------------------------------------------------
# 1. Masking Invariants
# -----------------------------------------------------------------------------
@settings(max_examples=200, suppress_health_check=[HealthCheck.too_slow])
@given(val=st.text())
def test_mask_apaar_never_raises_and_never_leaks_12_digits(val: str):
    """Property: mask_apaar never raises and never emits unmasked 12-digit numbers."""
    masked = mask_apaar(val)
    assert isinstance(masked, str)
    assert RAW_12_DIGIT_REGEX.search(masked) is None, (
        f"Leaked 12-digit APAAR in '{masked}' from input '{val}'"
    )


@settings(max_examples=100)
@given(digits=st.from_regex(r"\A\d{12}\Z", fullmatch=True))
def test_mask_apaar_exact_12_digits_masked(digits: str):
    """Property: Any exact 12-digit string is masked to 1234****9012 format."""
    masked = mask_apaar(digits)
    assert len(masked) == 12
    assert masked[4:8] == "****"
    assert masked[:4] == digits[:4]
    assert masked[8:] == digits[8:]
    assert RAW_12_DIGIT_REGEX.search(masked) is None


@settings(max_examples=100)
@given(val=st.one_of(st.text(), st.integers(), st.floats(allow_nan=True), st.none()))
def test_mask_helpers_never_raise(val: Any):
    """Property: All masking helpers safely accept any data type without raising."""
    res_apaar = mask_apaar(val)
    assert isinstance(res_apaar, str)
    assert RAW_12_DIGIT_REGEX.search(res_apaar) is None

    res_email = mask_email(val)
    assert isinstance(res_email, str)

    res_mobile = mask_mobile(val)
    assert isinstance(res_mobile, str)


# -----------------------------------------------------------------------------
# 2. APAAR Privacy in validate_batch Output
# -----------------------------------------------------------------------------
@settings(max_examples=15, suppress_health_check=[HealthCheck.too_slow], deadline=None)
@given(
    apaar_suffix=st.integers(min_value=1000, max_value=9999),
    name=st.text(
        min_size=2, max_size=20, alphabet=st.characters(whitelist_categories=("Lu", "Ll"))
    ),
)
def test_validate_batch_never_emits_raw_apaar_in_messages_or_reasons(apaar_suffix: int, name: str):
    """
    Property: validate_batch issue messages, reasons, and value_masked never leak raw 12-digit APAARs.
    """
    raw_apaar = f"99887766{apaar_suffix}"
    df = pd.DataFrame(
        [
            {
                "apaar_id": raw_apaar,
                "full_name": name,
                "dob": "2005-05-15",
                "gender": "M",
                "category": "GEN",
                "program_code": "UG-CSE",
                "course_level": "UG",
                "academic_year": "2026-27",
                "year_of_study": "1",
                "admission_date": "2026-08-10",
                "admission_type": "REGULAR",
                "expected_graduation_year": "2030",
                "seat_type": "REGULAR",
                "supernumerary_scheme": "",
                "quota": "NONE",
                "nationality": "IN",
                "nri_status": "False",
                "oci_status": "False",
                "fn_status": "False",
                "enrolment_status": "ACTIVE",
                "consent_status": "GRANTED",
                "consent_date": "2026-08-10",
                "guardian_consent": "False",
                "institution_student_id": "STU-HYP-01",
            }
        ]
    )

    report = validate_batch(df)
    for iss in report.issues:
        if iss.message:
            assert RAW_12_DIGIT_REGEX.search(iss.message) is None, (
                f"Raw APAAR leaked in message: {iss.message}"
            )
        if iss.reason:
            assert RAW_12_DIGIT_REGEX.search(iss.reason) is None, (
                f"Raw APAAR leaked in reason: {iss.reason}"
            )
        if iss.value_masked:
            assert RAW_12_DIGIT_REGEX.search(iss.value_masked) is None, (
                f"Raw APAAR leaked in value_masked: {iss.value_masked}"
            )


# -----------------------------------------------------------------------------
# 3. Normalization Invariants
# -----------------------------------------------------------------------------
@settings(max_examples=100)
@given(val=st.text())
def test_normalize_apaar_never_raises(val: str):
    """Property: normalize_apaar never raises an unhandled exception for any text."""
    norm, defect, fix = normalize_apaar(val)
    assert isinstance(norm, str)
    assert defect is None or isinstance(defect, str)


@settings(max_examples=100)
@given(val=st.text())
def test_normalize_date_never_raises(val: str):
    """Property: normalize_date never raises an unhandled exception for any text."""
    iso_date, candidates, is_valid = normalize_date(val)
    assert isinstance(is_valid, bool)
    assert isinstance(candidates, list)


# -----------------------------------------------------------------------------
# 4. Parser Invariants
# -----------------------------------------------------------------------------
@settings(max_examples=25, suppress_health_check=[HealthCheck.too_slow], deadline=None)
@given(csv_text=st.text(max_size=1500))
def test_parse_file_text_never_crashes(csv_text: str):
    """Property: parse_file handles any string input safely without unhandled crashes."""
    try:
        parsed = parse_file(csv_text.encode("utf-8"))
        assert hasattr(parsed, "df")
        assert hasattr(parsed, "original_headers")
        assert isinstance(parsed.df, pd.DataFrame)
    except (ValueError, UnicodeDecodeError):
        # Size limit or encoding guardrails are expected controlled rejections
        pass
