import io
import sys
from pathlib import Path

from fastapi.testclient import TestClient

engine_dir = Path(__file__).resolve().parent.parent
if str(engine_dir) not in sys.path:
    sys.path.insert(0, str(engine_dir))

from devserver import app

client = TestClient(app)


def test_devserver_healthz():
    response = client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "eduverify_engine_devserver"
    assert data["engine_version"] == "1.0.0"
    assert data["catalog_version"] == "1.0.0"


def test_devserver_catalog():
    response = client.get("/catalog")
    assert response.status_code == 200
    data = response.json()
    assert data["catalog_version"] == "1.0.0"
    assert len(data["rules"]) == 35


def test_devserver_map():
    headers = ["PRN", "DOB", "Dept", "APAAR No"]
    response = client.post("/map", json=headers)
    assert response.status_code == 200
    mappings = response.json()
    assert len(mappings) == 4
    targets = {m["source"]: m["target"] for m in mappings}
    assert targets["PRN"] == "institution_student_id"
    assert targets["DOB"] == "dob"
    assert targets["Dept"] == "department"
    assert targets["APAAR No"] == "apaar_id"


def test_devserver_parse():
    sample_csv = io.BytesIO(b"apaar_id,full_name,gender\n123456789012,John Doe,M\n")
    response = client.post(
        "/parse",
        files={"file": ("upload.csv", sample_csv, "text/csv")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["headers"] == ["apaar_id", "full_name", "gender"]
    assert data["rows_total"] == 1


def test_devserver_validate():
    sample_csv = io.BytesIO(b"apaar_id,full_name\n123456789012,John Doe\n")
    response = client.post(
        "/validate",
        files={"file": ("upload.csv", sample_csv, "text/csv")},
    )
    assert response.status_code == 200
    report = response.json()
    assert report["rows_total"] == 1
    assert "issues" in report


def test_devserver_report_compare():
    sample_csv = io.BytesIO(b"apaar_id,full_name\n123456789012,John Doe\n")
    val_resp = client.post(
        "/validate",
        files={"file": ("upload.csv", sample_csv, "text/csv")},
    )
    report = val_resp.json()

    cmp_payload = {
        "before": report,
        "after": report,
        "decisions": [{"action": "ACCEPT_FIX", "rule_id": "V005"}],
    }
    response = client.post("/report/compare", json=cmp_payload)
    assert response.status_code == 200
    cmp_data = response.json()
    assert "quality_score_before" in cmp_data
    assert "quality_score_after" in cmp_data
    assert "resolved" in cmp_data
    assert cmp_data["resolved"] == 1


def test_devserver_report_demo_xlsx():
    response = client.get("/report/demo.xlsx")
    assert response.status_code == 200
    assert (
        response.headers["content-type"]
        == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    assert "eduverify_demo_report.xlsx" in response.headers.get("content-disposition", "")
    assert len(response.content) > 1000
