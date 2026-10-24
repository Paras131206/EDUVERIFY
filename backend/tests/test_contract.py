"""
Contract validation tests for OpenAPI and JSON schemas.
Validates contracts/openapi.yaml against OpenAPI 3.1 specification.
"""

import json
from pathlib import Path

import jsonschema
import pytest
import schemathesis
import yaml
from openapi_spec_validator import validate


@pytest.fixture
def repo_root():
    # Find repository root from backend/tests
    return Path(__file__).resolve().parent.parent.parent


def test_openapi_contract_validates(repo_root):
    spec_path = repo_root / "contracts" / "openapi.yaml"
    assert spec_path.exists(), "contracts/openapi.yaml does not exist"

    spec_dict = yaml.safe_load(spec_path.read_text(encoding="utf-8"))
    assert spec_dict.get("openapi") == "3.1.0"
    assert spec_dict.get("info", {}).get("version") == "0.1.0"

    # Validate using openapi-spec-validator with base_uri
    validate(spec_dict, base_uri=spec_path.resolve().as_uri())


def test_schemathesis_spec_loads(repo_root):
    spec_path = repo_root / "contracts" / "openapi.yaml"

    # Support Schemathesis 3.x experimental flag and Schemathesis 4.x native OpenAPI 3.1
    if hasattr(schemathesis, "experimental") and hasattr(schemathesis.experimental, "OPEN_API_3_1"):
        schemathesis.experimental.OPEN_API_3_1.enable()

    # Schemathesis 4.x moves loaders under schemathesis.openapi;
    # Schemathesis 3.x has them on top-level or schemathesis.openapi.
    loader = getattr(schemathesis, "openapi", None)
    load_from_path = getattr(loader, "from_path", None) if loader else None
    if not load_from_path:
        load_from_path = getattr(schemathesis, "from_path")  # noqa: B009

    schema = load_from_path(str(spec_path))
    operations = list(schema.get_all_operations())
    assert len(operations) > 50, f"Expected >50 operations, got {len(operations)}"


def test_schemas_directory_contents(repo_root):
    schemas_dir = repo_root / "contracts" / "schemas"
    assert schemas_dir.exists(), "contracts/schemas directory missing"

    required_files = [
        "batch_report.json",
        "enums.json",
        "student_record.json",
        "credential.json",
    ]

    for filename in required_files:
        file_path = schemas_dir / filename
        assert file_path.exists(), f"Schema file missing: {filename}"

        content = json.loads(file_path.read_text(encoding="utf-8"))
        assert isinstance(content, dict)


def test_student_record_json_schema(repo_root):
    schema_path = repo_root / "contracts" / "schemas" / "student_record.json"
    schema = json.loads(schema_path.read_text(encoding="utf-8"))

    # Validate a sample valid student record
    sample_student = {
        "apaar_id": "123456789012",
        "institution_aicte_id": "1-12345678",
        "institution_student_id": "PRN2026001",
        "full_name": "Aarav Sharma",
        "dob": "2004-05-15",
        "gender": "M",
        "category": "GEN",
        "program_code": "CSE-BTECH",
        "course_level": "UG",
        "academic_year": "2026-27",
        "year_of_study": 1,
        "admission_date": "2026-08-01",
        "admission_type": "REGULAR",
        "seat_type": "REGULAR",
        "quota": "NONE",
        "nationality": "IN",
        "nri_status": False,
        "oci_status": False,
        "fn_status": False,
        "enrolment_status": "ACTIVE",
        "consent_status": "GRANTED",
    }

    jsonschema.validate(instance=sample_student, schema=schema)
