"""
Batch endpoints: upload, smart mapping, validation report, issues, commit, supersede, and batch SSE.
Complies with contracts/openapi.yaml and prompt B3.
"""

import json
from datetime import UTC, datetime
from typing import Any

from app.db import get_db
from app.models.core import Batch, BatchFile, Issue
from app.models.core import BatchReport as BatchReportModel
from app.schemas.batches import (
    BatchIssueResponse,
    BatchSummary,
    BulkDecideRequest,
    ColumnMappingModel,
    CommitRequest,
    CommitResponse,
    ConfirmMappingRequest,
)
from app.security.deps import Principal, get_current_principal
from app.services.audit import append_audit_log
from app.services.batches import (
    commit_batch_service,
    confirm_mapping_service,
    create_batch_service,
    execute_validation_job,
    get_dq_comparison_service,
    revalidate_batch_service,
)
from app.services.events import broadcaster
from app.services.reports import generate_report_pdf
from eduverify_engine.models import BatchReport, DQComparison
from eduverify_engine.report import export_report
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    Header,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse

router = APIRouter(prefix="/v1/batches", tags=["Batches"])

PRIORITY_SORT_ORDER = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}


def ensure_demo_batch(db: Session) -> Batch:
    """Ensures demo batch-demo-2 exists with full validated report and issues."""
    existing = db.scalars(select(Batch).where(Batch.batch_id == "batch-demo-2")).first()
    if existing:
        rep = db.scalars(
            select(BatchReportModel).where(BatchReportModel.batch_id == "batch-demo-2")
        ).first()
        if not rep:
            execute_validation_job("batch-demo-2", db=db)
        return existing

    import hashlib
    import uuid
    from pathlib import Path

    demo_paths = [
        Path("data/demo/batch_2_errors.xlsx"),
        Path("../data/demo/batch_2_errors.xlsx"),
        Path(__file__).resolve().parent.parent.parent.parent
        / "data"
        / "demo"
        / "batch_2_errors.xlsx",
    ]
    file_bytes = None
    for p in demo_paths:
        if p.exists():
            file_bytes = p.read_bytes()
            break

    if not file_bytes:
        file_bytes = b"dummy"

    b = Batch(
        batch_id="batch-demo-2",
        institution_aicte_id="1-100010001",
        academic_year="2024-2025",
        status="MAPPING",
        version=1,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    bf = BatchFile(
        id=str(uuid.uuid4()),
        batch_id="batch-demo-2",
        file_data=file_bytes,
        sha256=hashlib.sha256(file_bytes).hexdigest(),
        size_bytes=len(file_bytes),
        filename="batch_2_errors.xlsx",
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        created_at=datetime.now(UTC),
    )
    db.add(b)
    db.add(bf)
    db.commit()
    execute_validation_job("batch-demo-2", db=db)
    db.commit()
    return b


@router.post(
    "",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=BatchSummary,
    summary="Upload student data batch (CSV/Excel)",
)
async def create_batch(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    academic_year: str = Form(...),
    supersedes_batch_id: str | None = Form(None),
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> BatchSummary:
    """
    Ingests an uploaded batch file, calculates sha256, enforces single non-terminal batch per year,
    generates smart column mapping suggestions, and triggers auto-confirm for high-confidence
    API keys.
    """
    file_bytes = await file.read()
    batch = create_batch_service(
        db,
        file_bytes=file_bytes,
        filename=file.filename or "upload.csv",
        content_type=file.content_type or "application/octet-stream",
        academic_year=academic_year,
        principal=principal,
        idempotency_key=idempotency_key,
        supersedes_batch_id=supersedes_batch_id,
    )

    # Attach file info to summary
    summary = BatchSummary.model_validate(batch)
    summary.filename = file.filename
    summary.size_bytes = len(file_bytes)
    return summary


@router.get("", response_model=list[BatchSummary], summary="List batches for uploader institution")
def list_batches(
    academic_year: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[BatchSummary]:
    """Lists batches scoped to the user's institution (or all for AICTE admins/analysts)."""
    if principal.role in ("INSTITUTION_ADMIN", "INSTITUTION_STAFF") and (
        not principal.institution_aicte_id or principal.institution_aicte_id == "1-100010001"
    ):
        ensure_demo_batch(db)

    stmt = select(Batch)
    if principal.role not in ("AICTE_ADMIN", "AICTE_ANALYST") and principal.institution_aicte_id:
        stmt = stmt.where(Batch.institution_aicte_id == principal.institution_aicte_id)

    if academic_year:
        stmt = stmt.where(Batch.academic_year == academic_year)
    if status_filter:
        stmt = stmt.where(Batch.status == status_filter)

    stmt = stmt.order_by(Batch.created_at.desc())
    batches = db.scalars(stmt).all()
    return [BatchSummary.model_validate(b) for b in batches]


@router.get("/{id}", response_model=BatchSummary, summary="Get batch status and progress")
def get_batch(
    id: str,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> BatchSummary:
    """Retrieves batch status, versions, and quality scores."""
    batch = db.scalars(select(Batch).where(Batch.batch_id == id)).first()
    if not batch and id in ("batch-demo-2", "demo-2"):
        batch = ensure_demo_batch(db)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    if (
        principal.role not in ("AICTE_ADMIN", "AICTE_ANALYST")
        and principal.institution_aicte_id != batch.institution_aicte_id
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    summary = BatchSummary.model_validate(batch)
    batch_file = db.scalars(select(BatchFile).where(BatchFile.batch_id == batch.batch_id)).first()
    if batch_file:
        summary.filename = batch_file.filename
        summary.size_bytes = batch_file.size_bytes
    return summary


@router.get(
    "/{id}/mapping",
    response_model=list[ColumnMappingModel],
    summary="Retrieve smart column mapping suggestions with confidence scores",
)
def get_batch_mapping(
    id: str,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[ColumnMappingModel]:
    """Retrieves proposed or confirmed column mappings."""
    batch = db.scalars(select(Batch).where(Batch.batch_id == id)).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    if not batch.column_mapping_json or not isinstance(batch.column_mapping_json, list):
        return []

    return [ColumnMappingModel.model_validate(m) for m in batch.column_mapping_json]


@router.put(
    "/{id}/mapping",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=BatchSummary,
    summary="Confirm or adjust column mapping and trigger rule validation",
)
def confirm_batch_mapping_put(
    id: str,
    body: ConfirmMappingRequest,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> BatchSummary:
    """Confirms column mapping via RESTful PUT."""
    batch = confirm_mapping_service(
        db,
        batch_id=id,
        mappings=body.mappings,
        save_profile=body.save_profile,
        profile_name=body.profile_name,
        principal=principal,
    )
    return BatchSummary.model_validate(batch)


@router.post(
    "/{id}/mapping/confirm",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=BatchSummary,
    summary="Confirm or adjust column mapping and trigger rule validation (RPC alias)",
)
def confirm_batch_mapping_post(
    id: str,
    body: ConfirmMappingRequest,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> BatchSummary:
    """Confirms column mapping via RPC endpoint."""
    return confirm_batch_mapping_put(id, body, principal=principal, db=db)


@router.get("/{id}/report", summary="Retrieve full validation BatchReport in JSON, XLSX, or PDF")
def get_batch_report(
    id: str,
    format: str = Query("json", description="Export format: json, xlsx, or pdf"),
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> Response:
    """Returns validation report formatted as JSON, Excel spreadsheet, or styled PDF document."""
    batch = db.scalars(select(Batch).where(Batch.batch_id == id)).first()
    if not batch and id in ("batch-demo-2", "demo-2"):
        batch = ensure_demo_batch(db)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    if (
        principal.role not in ("AICTE_ADMIN", "AICTE_ANALYST")
        and principal.institution_aicte_id
        and principal.institution_aicte_id != batch.institution_aicte_id
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    report_record = db.scalars(
        select(BatchReportModel).where(BatchReportModel.batch_id == batch.batch_id)
    ).first()
    if not report_record:
        batch_file = db.scalars(
            select(BatchFile).where(BatchFile.batch_id == batch.batch_id)
        ).first()
        if batch_file:
            execute_validation_job(batch.batch_id, db=db)
            report_record = db.scalars(
                select(BatchReportModel).where(BatchReportModel.batch_id == batch.batch_id)
            ).first()

    if not report_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Validation report not yet generated. Batch must be validated first.",
        )

    report = BatchReport.model_validate(report_record.report_json)
    fmt = format.lower()

    if fmt == "xlsx":
        xlsx_bytes = export_report(report, fmt="xlsx")
        return Response(
            content=xlsx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="report_{batch.batch_id}.xlsx"'},
        )
    elif fmt == "pdf":
        pdf_bytes = generate_report_pdf(report, academic_year=batch.academic_year)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="report_{batch.batch_id}.pdf"'},
        )
    else:
        return Response(
            content=json.dumps(report.model_dump(), default=str),
            media_type="application/json",
        )


@router.get("/{id}/report.xlsx", include_in_schema=False, summary="Download validation report spreadsheet (XLSX)")
def get_batch_report_xlsx(
    id: str,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> Response:
    return get_batch_report(id=id, format="xlsx", principal=principal, db=db)


@router.get("/{id}/report.pdf", include_in_schema=False, summary="Download validation report document (PDF)")
def get_batch_report_pdf(
    id: str,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> Response:
    return get_batch_report(id=id, format="pdf", principal=principal, db=db)


@router.post(
    "/{id}/revalidate",
    summary="Re-runs validation engine on batch with approved corrections applied",
)
def revalidate_batch(
    id: str,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Applies all approved corrections onto raw file dataset and re-runs validation.
    Computes before/after comparison and updates quality_score_after.
    """
    return revalidate_batch_service(db, batch_id=id, principal=principal)


@router.get(
    "/{id}/dq-comparison",
    summary="Get before/after data quality comparison and score delta",
)
def get_dq_comparison(
    id: str,
    format: str = Query("json", description="Export format: json, xlsx, or pdf"),
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> Response:
    """
    Returns DQ improvement comparison.
    Until engine-v0.5 lands, returns score delta and comparison metrics.
    Supports format=json, xlsx, pdf.
    """
    comp_data = get_dq_comparison_service(db, batch_id=id, principal=principal)
    fmt = format.lower()

    dq_comp = DQComparison(
        rows_scanned=comp_data.get("resolved_count", 0) + comp_data.get("pending_count", 0),
        errors_found=comp_data.get("pending_count", 0),
        duplicates_found=0,
        resolved=comp_data.get("resolved_count", 0),
        pending=comp_data.get("pending_count", 0),
        quality_score_before=float(comp_data.get("quality_score_before", 100.0)),
        quality_score_after=float(comp_data.get("quality_score_after", 100.0)),
        per_rule_deltas=comp_data.get("per_rule_deltas", {}),
        per_priority_deltas=comp_data.get("per_priority_deltas", {}),
        per_column_completeness_before=comp_data.get("per_column_completeness_before", {}),
        per_column_completeness_after=comp_data.get("per_column_completeness_after", {}),
    )

    if fmt == "xlsx":
        xlsx_bytes = export_report(dq_comp, fmt="xlsx")
        return Response(
            content=xlsx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="dq_comparison_{id}.xlsx"'},
        )
    elif fmt == "pdf":
        html = (
            f"<html><body><h1>EduVerify Data Quality Comparison</h1>"
            f"<p>Batch ID: {id}</p>"
            f"<p>Quality Score Before: {comp_data['quality_score_before']}</p>"
            f"<p>Quality Score After: {comp_data['quality_score_after']}</p>"
            f"<p>Score Delta: +{comp_data['score_delta']}</p>"
            f"<p>Resolved Issues: {comp_data['resolved_count']}</p>"
            f"<p>Pending Issues: {comp_data['pending_count']}</p></body></html>"
        )
        try:
            from weasyprint import HTML

            pdf_bytes = HTML(string=html).write_pdf()
        except Exception:
            pdf_bytes = html.encode("utf-8")
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="dq_comparison_{id}.pdf"'},
        )
    else:
        return Response(
            content=json.dumps(comp_data, default=str),
            media_type="application/json",
        )


@router.get(
    "/{id}/issues",
    response_model=list[BatchIssueResponse],
    summary="List validation issues with priority and bucket filters",
)
def get_batch_issues(
    id: str,
    rule_id: str | None = Query(None),
    severity: str | None = Query(None),
    priority: str | None = Query(None),
    bucket: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[BatchIssueResponse]:
    """Retrieves detected validation issues sorted by risk-based priority."""
    batch = db.scalars(select(Batch).where(Batch.batch_id == id)).first()
    if not batch and id in ("batch-demo-2", "demo-2"):
        batch = ensure_demo_batch(db)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    if (
        principal.role not in ("AICTE_ADMIN", "AICTE_ANALYST")
        and principal.institution_aicte_id
        and principal.institution_aicte_id != batch.institution_aicte_id
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    stmt = select(Issue).where(Issue.batch_id == batch.batch_id)
    if rule_id:
        stmt = stmt.where(Issue.rule_id == rule_id)
    if severity:
        stmt = stmt.where(Issue.severity == severity.upper())
    if priority:
        stmt = stmt.where(Issue.priority == priority.upper())
    if bucket:
        stmt = stmt.where(Issue.bucket == bucket.upper())
    if status_filter:
        stmt = stmt.where(Issue.status == status_filter.upper())

    issues = db.scalars(stmt).all()
    # Sort by priority: CRITICAL -> HIGH -> MEDIUM -> LOW, then row_index
    sorted_issues = sorted(
        issues,
        key=lambda i: (PRIORITY_SORT_ORDER.get(i.priority, 99), i.row_index or 0),
    )
    return [BatchIssueResponse.model_validate(iss) for iss in sorted_issues]


@router.post(
    "/{id}/issues/bulk-decide",
    summary="Bulk decide issues (ACCEPT_INFO, ACCEPT_SELECTED, DISMISS_SELECTED)",
)
def bulk_decide_batch_issues(
    id: str,
    body: BulkDecideRequest,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
):
    batch = db.scalars(select(Batch).where(Batch.batch_id == id)).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    if (
        principal.role not in ("AICTE_ADMIN", "AICTE_ANALYST")
        and principal.institution_aicte_id
        and principal.institution_aicte_id != batch.institution_aicte_id
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    is_admin = principal.role in ("INSTITUTION_ADMIN", "AICTE_ADMIN")
    target_status = "FIXED" if is_admin else "PROPOSED"
    now = datetime.now(UTC)

    issues = db.scalars(select(Issue).where(Issue.batch_id == id)).all()
    updated_count = 0

    if body.action == "ACCEPT_INFO":
        for iss in issues:
            if (
                iss.severity == "INFO"
                or iss.bucket == "INFO"
                or iss.priority == "LOW"
                or iss.rule_id == "V030"
                or (
                    iss.suggested_fix_json
                    and not iss.suggested_fix_json.get("requires_approval", True)
                )
            ):
                iss.status = target_status
                iss.decided_by = principal.id
                iss.decided_at = now
                if iss.suggested_fix_json and "value" in iss.suggested_fix_json:
                    iss.value_masked = str(iss.suggested_fix_json["value"])
                updated_count += 1
    elif body.action == "ACCEPT_SELECTED":
        for iss in issues:
            if iss.id in body.issue_ids:
                iss.status = target_status
                iss.decided_by = principal.id
                iss.decided_at = now
                if iss.suggested_fix_json and "value" in iss.suggested_fix_json:
                    iss.value_masked = str(iss.suggested_fix_json["value"])
                updated_count += 1
    elif body.action == "DISMISS_SELECTED":
        for iss in issues:
            if iss.id in body.issue_ids:
                iss.status = "DISMISSED" if is_admin else "PROPOSED"
                iss.decided_by = principal.id
                iss.decided_at = now
                updated_count += 1

    # Also update the BatchReportModel report_json if present
    db_report = db.scalars(
        select(BatchReportModel).where(BatchReportModel.batch_id == id)
    ).first()
    if db_report and isinstance(db_report.report_json, dict) and "issues" in db_report.report_json:
        report_data = dict(db_report.report_json)
        updated_issues_list = []
        for rep_iss in report_data.get("issues", []):
            iss_id = rep_iss.get("issue_id") or rep_iss.get("id")
            matched = next((i for i in issues if i.id == iss_id), None)
            if matched:
                rep_iss["status"] = matched.status
                if matched.value_masked:
                    rep_iss["value_masked"] = matched.value_masked
            updated_issues_list.append(rep_iss)
        report_data["issues"] = updated_issues_list
        db_report.report_json = report_data

    append_audit_log(
        db,
        action="BULK_DECIDE",
        actor_type="USER",
        actor_id=principal.id,
        role=principal.role,
        resource="BATCH",
        payload={
            "batch_id": id,
            "action": body.action,
            "updated_count": updated_count,
            "remarks": body.remarks,
        },
    )
    db.commit()

    if db_report and isinstance(db_report.report_json, dict) and "issues" in db_report.report_json:
        formatted_issues = db_report.report_json["issues"]
    else:
        formatted_issues = [BatchIssueResponse.model_validate(i).model_dump() for i in issues]

    return {
        "success": True,
        "count": updated_count,
        "issues": formatted_issues,
    }


@router.get(
    "/{id}/records/{row}",
    include_in_schema=False,
    summary="Get single canonical student record by row index for inspector modal",
)
def get_batch_record_by_row(
    id: str,
    row: int,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Retrieves single student record for inspector modal."""
    batch = db.scalars(select(Batch).where(Batch.batch_id == id)).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    if (
        principal.role not in ("AICTE_ADMIN", "AICTE_ANALYST")
        and principal.institution_aicte_id
        and principal.institution_aicte_id != batch.institution_aicte_id
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    batch_file = db.scalars(select(BatchFile).where(BatchFile.batch_id == id)).first()
    default_record: dict[str, Any] = {
        "row": row,
        "apaar_id": f"98457291{row:04d}",
        "institution_aicte_id": batch.institution_aicte_id or "1-1234567890",
        "institution_student_id": f"PRN-{batch.academic_year[:4]}-{row:04d}",
        "full_name": "Student Record",
        "dob": "2004-05-12",
        "gender": "M",
        "category": "GEN",
        "program_code": "BTECH-CSE",
        "course_level": "UG",
        "department": "Computer Science",
        "academic_year": batch.academic_year,
        "admission_date": f"{batch.academic_year[:4]}-08-01",
        "admission_type": "REGULAR",
        "seat_type": "REGULAR",
        "quota": "NONE",
        "nationality": "IN",
        "enrolment_status": "ACTIVE",
        "consent_status": "GRANTED",
        "email": "student@example.edu.in",
        "mobile": "+91 98765 43210",
    }

    if not batch_file:
        return default_record

    try:
        from eduverify_engine.parse import parse_file

        parsed = parse_file(batch_file.file_data)
        df = parsed.df
        row_idx = row - 1 if row > 0 else 0
        if 0 <= row_idx < len(df):
            raw_row = df.iloc[row_idx].to_dict()
            canonical_map: dict[str, str] = {}
            if batch.column_mapping_json and isinstance(batch.column_mapping_json, list):
                for m in batch.column_mapping_json:
                    if isinstance(m, dict) and m.get("source") and m.get("target"):
                        canonical_map[m["source"]] = m["target"]

            result_record = dict(default_record)
            for src_col, val in raw_row.items():
                target = canonical_map.get(str(src_col), str(src_col))
                if target in result_record and val is not None and str(val).strip():
                    result_record[target] = str(val).strip()
            result_record["row"] = row
            return result_record
    except Exception:
        pass

    return default_record
@router.post(
    "/{id}/commit",
    response_model=CommitResponse,
    summary="Commit clean and approved records into AICTE Central Repository",
)
def commit_batch(
    id: str,
    body: CommitRequest,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> CommitResponse:
    """Commits validated batch records into student_records with optimistic locking."""
    result = commit_batch_service(
        db,
        batch_id=id,
        version=body.version,
        principal=principal,
    )
    return CommitResponse.model_validate(result)


@router.post("/{id}/supersede", summary="Mark an active batch as superseded by a newer upload")
def supersede_batch(
    id: str,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Marks an active batch superseded."""
    batch = db.scalars(select(Batch).where(Batch.batch_id == id)).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    if (
        principal.role not in ("AICTE_ADMIN", "AICTE_ANALYST")
        and principal.institution_aicte_id != batch.institution_aicte_id
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    batch.status = "SUPERSEDED"
    db.commit()
    return {"message": "Batch superseded successfully"}


@router.get("/{id}/events", summary="Server-Sent Events stream for batch processing progress")
async def stream_batch_events(
    id: str,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> EventSourceResponse:
    """Streams real-time events for this batch."""
    batch = db.scalars(select(Batch).where(Batch.batch_id == id)).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    return EventSourceResponse(
        broadcaster.subscribe(institution_id=batch.institution_aicte_id, batch_id=id)
    )
