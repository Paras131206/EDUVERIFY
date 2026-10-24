"""
EduVerify Engine Developer Harness.
Local dev harness only (never deployed to production).
Runs on port 8100.
"""

import uuid

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from eduverify_engine import __version__
from eduverify_engine.catalog import load_rule_catalog

# Relative import within engine directory when uvicorn is run with --app-dir engine
from eduverify_engine.models import (
    BatchReport,
    ColumnMapping,
)

app = FastAPI(
    title="EduVerify Engine Dev Harness",
    version=__version__,
    description="Development harness for Team C AI/Data Engine testing and verification.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz() -> dict[str, str]:
    """Healthcheck endpoint for engine dev harness."""
    return {
        "status": "ok",
        "service": "eduverify_engine_devserver",
        "version": __version__,
    }


@app.get("/catalog")
def get_catalog() -> dict:
    """Returns all V001-V035 rules from the rule catalog."""
    catalog = load_rule_catalog()
    return catalog.model_dump()


@app.post("/validate", response_model=BatchReport)
async def validate_batch(file: UploadFile = File(...)) -> BatchReport:
    """
    Accepts CSV or XLSX file and returns a validated BatchReport.
    Used for dev and testing before full engine pipeline connection.
    """
    batch_id = str(uuid.uuid4())
    catalog = load_rule_catalog()

    # Read uploaded bytes to count rows if CSV
    content = await file.read()
    filename = file.filename or "upload.csv"

    rows_total = 0
    if filename.endswith(".csv"):
        text = content.decode("utf-8", errors="replace")
        lines = [line for line in text.splitlines() if line.strip()]
        rows_total = max(0, len(lines) - 1)
    else:
        rows_total = 10

    # Build initial baseline report
    return BatchReport(
        batch_id=batch_id,
        institution_aicte_id="1-DEMO12345",
        engine_version=__version__,
        rule_catalog_version=catalog.catalog_version,
        rows_total=rows_total,
        rows_valid=rows_total,
        rows_warning=0,
        rows_error=0,
        quality_score=100.0,
        column_mapping=[
            ColumnMapping(
                source="apaar_id",
                target="apaar_id",
                confidence=1.0,
                method="exact",
            )
        ],
        metrics={"completeness": {"apaar_id": 1.0}},
        issues=[],
        review_summary={"AUTO_FLAG": 0, "HUMAN_REVIEW": 0, "INFO": 0},
        priority_summary={"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0},
        intake_summary=[],
        reconciliation=[],
        duplicate_clusters=[],
        schema_drift=[],
        anomalies=[],
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8100)
