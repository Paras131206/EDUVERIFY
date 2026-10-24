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


def test_devserver_catalog():
    response = client.get("/catalog")
    assert response.status_code == 200
    data = response.json()
    assert data["catalog_version"] == "0.1.0"
    assert len(data["rules"]) == 35


def test_devserver_validate():
    sample_csv = io.BytesIO(b"apaar_id,full_name\n123456789012,John Doe\n")
    response = client.post(
        "/validate",
        files={"file": ("upload.csv", sample_csv, "text/csv")},
    )
    assert response.status_code == 200
    report = response.json()
    assert report["rows_total"] == 1
    assert report["quality_score"] == 100.0
    assert "issues" in report
