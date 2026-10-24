"""
FastAPI router for bulk upload template generation.
Complies with contracts/openapi.yaml, agents.md §7, and prompt B2 item 5.
"""

from app.db import get_db
from app.security.deps import Principal, get_current_principal
from app.services.template import generate_student_upload_template
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

router = APIRouter(prefix="/v1/templates", tags=["Templates"])


@router.get(
    "/student-upload.xlsx",
    summary="Download pre-formatted Excel template with APAAR text formatting and dropdowns",
    description=(
        "Returns a standardized .xlsx workbook containing the StudentData sheet "
        "(with column A strictly formatted as Text and dropdown data validation rules) "
        "and a bilingual Instructions sheet in English and Hindi."
    ),
    responses={
        200: {
            "content": {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {}},
            "description": "Pre-formatted Excel upload template",
        }
    },
)
def download_student_upload_template(
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> Response:
    """Generate and return binary student-upload.xlsx template."""
    content = generate_student_upload_template(db)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": 'attachment; filename="student-upload-template.xlsx"',
            "Cache-Control": "no-cache",
        },
    )
