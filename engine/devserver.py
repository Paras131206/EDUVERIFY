"""
EduVerify Engine Developer Harness.
Local dev harness only (never deployed to production).
Runs on port 8100.
"""

from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field

# Imports when run from engine directory
from eduverify_engine import __version__
from eduverify_engine.catalog import load_rule_catalog
from eduverify_engine.mapping import suggest_mapping
from eduverify_engine.models import BatchReport, ColumnMapping, DQComparison
from eduverify_engine.parse import parse_file
from eduverify_engine.report import compare_reports, export_report
from eduverify_engine.validate import validate_batch

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


class MapHeadersRequest(BaseModel):
    headers: list[str] = Field(..., description="List of raw column headers from spreadsheet")
    saved_profile: dict[str, str] | None = Field(
        default=None, description="Optional institution saved mapping profile"
    )


class ParseResponse(BaseModel):
    headers: list[str]
    rows_total: int
    detected_encoding: str
    cell_types: dict[str, str]
    sample_preview: list[dict[str, Any]]


@app.get("/healthz")
def healthz() -> dict[str, str]:
    """Healthcheck endpoint for engine dev harness."""
    catalog = load_rule_catalog()
    return {
        "status": "ok",
        "service": "eduverify_engine_devserver",
        "version": __version__,
        "engine_version": __version__,
        "catalog_version": catalog.catalog_version,
    }


@app.get("/catalog")
def get_catalog() -> dict:
    """Returns all V001-V035 rules from the rule catalog."""
    catalog = load_rule_catalog()
    return catalog.model_dump()


@app.post("/map", response_model=list[ColumnMapping])
def map_headers(payload: list[str] | MapHeadersRequest) -> list[ColumnMapping]:
    """
    Suggests smart column mappings for input headers.
    Accepts either raw JSON array of strings e.g. ["PRN", "DOB", "Dept"]
    or an object with { "headers": [...], "saved_profile": {...} }.
    """
    if isinstance(payload, list):
        headers = payload
        saved_profile = None
    else:
        headers = payload.headers
        saved_profile = payload.saved_profile

    return suggest_mapping(headers, saved_profile=saved_profile)


@app.post("/parse", response_model=ParseResponse)
async def parse_uploaded_file(file: UploadFile = File(...)) -> ParseResponse:
    """
    Parses uploaded CSV or XLSX file and returns headers, row counts, and preview.
    """
    content = await file.read()
    parsed = parse_file(content)
    preview = parsed.df.head(5).to_dict(orient="records") if not parsed.df.empty else []

    return ParseResponse(
        headers=parsed.original_headers,
        rows_total=parsed.rows_total,
        detected_encoding=parsed.detected_encoding,
        cell_types=parsed.cell_types,
        sample_preview=preview,
    )


class CompareRequest(BaseModel):
    before: BatchReport
    after: BatchReport
    decisions: list[dict[str, Any]] | None = Field(
        default=None, description="Optional list of human review decisions"
    )


@app.post("/validate", response_model=BatchReport)
async def validate_batch_endpoint(file: UploadFile = File(...)) -> BatchReport:
    """
    Accepts CSV or XLSX file and executes the engine validation pipeline.
    """
    content = await file.read()
    return validate_batch(content)


@app.post("/report/compare", response_model=DQComparison)
def compare_reports_endpoint(payload: CompareRequest) -> DQComparison:
    """
    Compares two BatchReports (before & after) plus optional human review decisions.
    Returns DQComparison with quality score deltas, rule deltas, and completeness deltas.
    """
    return compare_reports(payload.before, payload.after, payload.decisions)


@app.get("/report/demo.xlsx")
def download_demo_report() -> Response:
    """
    Validates the demo dataset (batch_2_errors.xlsx) and exports a complete
    Excel (.xlsx) report containing all 7 sheets with conditional formatting.
    """
    repo_root = Path(__file__).resolve().parent.parent
    demo_file = repo_root / "data" / "demo" / "batch_2_errors.xlsx"
    if not demo_file.exists():
        demo_file = Path("data/demo/batch_2_errors.xlsx")

    report = validate_batch(demo_file)
    content = export_report(report, fmt="xlsx")

    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="eduverify_demo_report.xlsx"'},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8100)
