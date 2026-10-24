from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parents[2]


def test_column_synonyms_loads():
    syn_file = REPO_ROOT / "contracts" / "column_synonyms.yaml"
    if not syn_file.exists():
        syn_file = Path("contracts/column_synonyms.yaml")
    assert syn_file.exists(), f"Synonyms file not found at {syn_file}"

    with open(syn_file, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    assert "synonyms" in data
    syns = data["synonyms"]

    # Verify key canonical fields are present
    key_fields = [
        "apaar_id",
        "institution_student_id",
        "institution_aicte_id",
        "full_name",
        "dob",
        "gender",
        "category",
        "program_code",
        "course_level",
        "department",
        "academic_year",
        "year_of_study",
        "admission_date",
        "admission_type",
        "expected_graduation_year",
        "seat_type",
        "quota",
        "nationality",
        "consent_status",
    ]

    for field in key_fields:
        assert field in syns, f"Canonical field {field} missing in column_synonyms.yaml"
        assert len(syns[field]) > 0, f"No synonyms defined for {field}"

    # Verify Hindi translations exist
    assert any("अपार" in s for s in syns["apaar_id"])
    assert any("नाम" in s for s in syns["full_name"])
