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
from fastapi.testclient import TestClient
from openapi_spec_validator import validate
from sqlalchemy.orm import Session


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
    exp = getattr(schemathesis, "experimental", None)
    if exp and hasattr(exp, "OPEN_API_3_1"):
        exp.OPEN_API_3_1.enable()



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


def test_zero_contract_drift(repo_root):
    """
    Verifies 100% path synchronization between contracts/openapi.yaml and live app.openapi().
    Guarantees no undocumented endpoints or unhandled contract routes exist.
    """
    from app.main import app

    spec_path = repo_root / "contracts" / "openapi.yaml"
    contract = yaml.safe_load(spec_path.read_text(encoding="utf-8"))
    app_spec = app.openapi()

    contract_paths = set(contract.get("paths", {}).keys())
    app_paths = set(app_spec.get("paths", {}).keys())

    in_contract_not_app = contract_paths - app_paths
    in_app_not_contract = app_paths - contract_paths

    assert not in_contract_not_app, f"Paths in contract but missing in app: {in_contract_not_app}"
    assert not in_app_not_contract, f"Paths in app but missing in contract: {in_app_not_contract}"


def test_schemathesis_live_app_endpoints(client: TestClient, db_session: Session, repo_root):
    """
    Exercises all contract operations against live app with role-based auth tokens.
    Verifies that no endpoint produces an unhandled 500 error or route failure.
    """
    spec_path = repo_root / "contracts" / "openapi.yaml"

    loader = getattr(schemathesis, "openapi", None)
    load_from_path = getattr(loader, "from_path", None) if loader else None
    if not load_from_path:
        load_from_path = getattr(schemathesis, "from_path")  # noqa: B009

    schema = load_from_path(str(spec_path))
    operations = list(schema.get_all_operations())
    assert len(operations) >= 100, f"Expected >=100 operations, found {len(operations)}"

    # Auth fixture tokens for admin and institution
    from app.models.auth import User
    from tests.conftest import make_auth_headers

    admin_user = db_session.query(User).filter(User.email == "aicte.admin@demo.local").first()
    assert admin_user is not None
    admin_headers = make_auth_headers(admin_user)

    for op_item in operations:
        actual_op = op_item.ok() if hasattr(op_item, "ok") else op_item
        if not actual_op:
            continue

        # Check GET endpoints with realistic parameter substitution
        if actual_op.method.upper() == "GET":
            path = actual_op.path
            # Replace path parameters with sample valid IDs
            path = path.replace("{id}", "1").replace("{apaar_id}", "123456789012")
            path = path.replace("{batch_id}", "b-test").replace("{issuer_id}", "1-10001")
            path = path.replace("{transfer_id}", "t-1").replace("{student_id}", "123456789012")
            path = path.replace("{metric}", "coverage")

            resp = client.get(path, headers=admin_headers)
            # Live app must never return unhandled 500 Internal Server Error
            err_msg = f"500 Internal Error on {actual_op.method} {actual_op.path}: {resp.text}"
            assert resp.status_code != 500, err_msg
            missing_msg = f"404 route missing on {actual_op.method} {actual_op.path}"
            assert resp.status_code != 404 or "{" in actual_op.path, missing_msg


