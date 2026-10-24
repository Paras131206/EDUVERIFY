"""
Reports generation, job tracking, and download router.
Complies with Task B7 item 5 and frontend contract.
"""

from app.db import get_db
from app.schemas.reports import CreateReportRequest, ReportItemResponse, ReportJobResponse
from app.security.deps import Principal, get_current_principal
from app.services.reports import (
    generate_system_report_service,
    get_report_download_service,
    get_report_item_service,
    list_reports_service,
)
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/v1/reports", tags=["Reports"])


@router.post(
    "",
    response_model=ReportJobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Initiate system report generation job",
)
def create_report(
    body: CreateReportRequest,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> ReportJobResponse:
    """Generates policy, accreditation, monitoring, or regulatory report job."""
    return generate_system_report_service(db, req=body, principal=principal)


@router.post(
    "/jobs",
    response_model=ReportJobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Initiate report generation job (frontend alias)",
)
def create_report_job(
    body: CreateReportRequest,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> ReportJobResponse:
    """Frontend-compatible alias for creating a report generation job."""
    return generate_system_report_service(db, req=body, principal=principal)


@router.get(
    "",
    response_model=list[ReportItemResponse],
    summary="List generated system reports",
)
def list_reports(
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[ReportItemResponse]:
    """Returns history of generated reports."""
    return list_reports_service(db, principal=principal)


@router.get(
    "/{id}",
    response_model=ReportItemResponse,
    summary="Get report metadata by ID",
)
def get_report(
    id: str,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> ReportItemResponse:
    """Returns report item metadata and summary."""
    return get_report_item_service(db, report_id=id)


@router.get(
    "/{id}/download",
    summary="Download report PDF or XLSX file",
)
def download_report(
    id: str,
    db: Session = Depends(get_db),
) -> Response:
    """Downloads report file in PDF or XLSX format."""
    file_bytes, media_type, filename = get_report_download_service(db, report_id=id)
    return Response(
        content=file_bytes,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
