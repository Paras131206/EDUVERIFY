from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEMO_DIR = REPO_ROOT / "data" / "demo"

from eduverify_engine.mapping import suggest_mapping
from eduverify_engine.normalize import (
    normalize_apaar,
    normalize_boolean,
    normalize_date,
    normalize_name,
)
from eduverify_engine.parse import parse_file
from eduverify_engine.validate import validate_batch


def test_batch_2_mapping():
    """batch_2_errors.xlsx maps PRN->institution_student_id, DOB->dob, Dept->department >= 0.9."""
    b2_path = DEMO_DIR / "batch_2_errors.xlsx"
    if not b2_path.exists():
        b2_path = Path("data/demo/batch_2_errors.xlsx")
    assert b2_path.exists(), "batch_2_errors.xlsx missing"

    parsed = parse_file(b2_path)
    mappings = suggest_mapping(parsed.original_headers, sample_df=parsed.df)
    mapping_dict = {m.source: m for m in mappings}

    # PRN -> institution_student_id
    assert "PRN" in mapping_dict
    assert mapping_dict["PRN"].target == "institution_student_id"
    assert mapping_dict["PRN"].confidence >= 0.9

    # DOB -> dob
    assert "DOB" in mapping_dict
    assert mapping_dict["DOB"].target == "dob"
    assert mapping_dict["DOB"].confidence >= 0.9

    # Dept -> department
    assert "Dept" in mapping_dict
    assert mapping_dict["Dept"].target == "department"
    assert mapping_dict["Dept"].confidence >= 0.9

    # APAAR No -> apaar_id
    assert "APAAR No" in mapping_dict
    assert mapping_dict["APAAR No"].target == "apaar_id"
    assert mapping_dict["APAAR No"].confidence >= 0.9


def test_leading_zero_preservation():
    """CSV with APAAR '012345678901' keeps the leading zero."""
    csv_bytes = b"apaar_id,full_name\n012345678901,Rahul Sharma\n"
    parsed = parse_file(csv_bytes)
    apaar_val = parsed.df["apaar_id"].iloc[0]
    assert apaar_val == "012345678901", f"Leading zero lost: got '{apaar_val}'"


def test_date_policy():
    """'03/04/2026' parses as 3 April 2026; '2026-13-01' -> invalid (V024)."""
    # 03/04/2026 -> 3 April 2026 under Indian DD/MM/YYYY policy
    iso_date, candidates, is_valid = normalize_date("03/04/2026")
    assert is_valid is True
    assert iso_date == "2026-04-03", f"Expected 2026-04-03, got {iso_date}"

    # 2026-13-01 -> month 13 is invalid
    iso_invalid, _, is_valid = normalize_date("2026-13-01")
    assert is_valid is False
    assert iso_invalid is None

    # 31/02/2026 -> Feb 31 is invalid
    iso_feb31, _, is_valid = normalize_date("31/02/2026")
    assert is_valid is False
    assert iso_feb31 is None


def test_name_norm():
    """name_norm normalizes honorifics, initials, transliteration."""
    # Transliteration equivalence
    assert normalize_name("Mohd. Khan") == normalize_name("Mohammad Khan")
    assert normalize_name("Lakshmi Iyer") == normalize_name("Laxmi Iyer")

    # Honorifics removal
    norm_shri = normalize_name("Shri Rahul Sharma")
    norm_plain = normalize_name("Rahul Sharma")
    assert norm_shri == norm_plain == "rahul sharma"

    # Initials collapse
    assert "rs sharma" in normalize_name("R. S. Sharma")


def test_apaar_mangling_detection():
    """Detects and fixes scientific notation, .0 suffix, and dropped leading zero."""
    # Scientific notation
    clean_sci, defect_sci, fix_sci = normalize_apaar("1.23457E+11")
    assert defect_sci == "SCIENTIFIC_NOTATION"
    assert fix_sci is not None
    assert len(fix_sci.value) == 12

    # .0 float suffix
    clean_dot, defect_dot, fix_dot = normalize_apaar("123456789012.0")
    assert clean_dot == "123456789012"
    assert defect_dot == "FLOAT_SUFFIX"
    assert fix_dot is not None
    assert fix_dot.value == "123456789012"

    # Dropped leading zero (11 digits)
    clean_pad, defect_pad, fix_pad = normalize_apaar("12345678901")
    assert defect_pad == "DROPPED_LEADING_ZERO"
    assert clean_pad == "012345678901"
    assert fix_pad is not None
    assert fix_pad.value == "012345678901"


def test_boolean_normalization():
    assert normalize_boolean("Y") == "True"
    assert normalize_boolean("Yes") == "True"
    assert normalize_boolean("हाँ") == "True"
    assert normalize_boolean("N") == "False"
    assert normalize_boolean("No") == "False"
    assert normalize_boolean("नहीं") == "False"


def test_minimal_validate_batch_clean():
    """Validates batch_1_clean.csv with 0 errors and 100 quality score."""
    b1_path = DEMO_DIR / "batch_1_clean.csv"
    if not b1_path.exists():
        b1_path = Path("data/demo/batch_1_clean.csv")
    report = validate_batch(b1_path)
    assert report.rows_total == 50
    assert report.rows_error == 0
    assert report.quality_score == 100.0


def test_minimal_validate_batch_errors():
    """Validates batch_2_errors.xlsx with detected seeded errors."""
    b2_path = DEMO_DIR / "batch_2_errors.xlsx"
    if not b2_path.exists():
        b2_path = Path("data/demo/batch_2_errors.xlsx")
    report = validate_batch(b2_path)
    assert report.rows_total == 50
    rule_ids = {iss.rule_id for iss in report.issues}

    # Verify seeded rules triggered
    assert "V002" in rule_ids, "V002 not triggered in batch_2"
    assert "V005" in rule_ids, "V005 not triggered in batch_2"
    assert "V023" in rule_ids, "V023 not triggered in batch_2"
    assert "V024" in rule_ids, "V024 not triggered in batch_2"
    assert report.quality_score < 100.0
