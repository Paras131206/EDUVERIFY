"""
FastAPI router for APAAR Registry verification endpoints.
Complies with prompt B2 item 4 and agents.md §5, §9.
"""

from typing import Any

from app.db import get_db
from app.schemas.auth import UserRole
from app.security.crypto import mask_apaar
from app.security.deps import Principal, require_roles
from app.services.audit import append_audit_log
from app.services.registry import MockApaarRegistry
from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/v1/registry", tags=["Registry"])


@router.get(
    "/{apaar}/check",
    summary="Check APAAR ID existence in Mock Registry",
    description=(
        "Restricted to AICTE administrators and analysts. "
        "Returns existence status and masked demographic match."
    ),
    response_model=dict[str, Any],
)
def check_apaar_registry(
    apaar: str = Path(..., description="12-digit APAAR ID"),
    principal: Principal = Depends(require_roles(UserRole.AICTE_ADMIN, UserRole.AICTE_ANALYST)),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Check APAAR ID in the central registry."""
    clean_apaar = apaar.strip()
    if len(clean_apaar) != 12 or not clean_apaar.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="APAAR ID must be exactly 12 digits",
        )

    service = MockApaarRegistry(db)
    result = service.check(clean_apaar)

    # Record sensitive query in tamper-evident audit log
    actor_type = "API_KEY" if principal.is_api_key else "USER"
    append_audit_log(
        db,
        action="REGISTRY_CHECK",
        actor_type=actor_type,
        actor_id=principal.id,
        role=principal.role,
        resource="mock_apaar_registry",
        resource_id=mask_apaar(clean_apaar),
        payload={"apaar_masked": mask_apaar(clean_apaar), "exists": result["exists"]},
    )
    db.commit()

    return result
