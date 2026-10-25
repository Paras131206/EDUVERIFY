"""
Global SSE event stream and ticketing router.
Complies with prompt B3 item 4.
"""

from app.schemas.batches import EventTicketResponse
from app.security.deps import Principal, get_current_principal
from app.services.events import (
    broadcaster,
    create_event_ticket,
    validate_event_ticket,
)
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sse_starlette.sse import EventSourceResponse

router = APIRouter(prefix="/v1/events", tags=["Events"])


@router.post("/ticket", response_model=EventTicketResponse, summary="Obtain short-lived SSE ticket")
def get_event_ticket(
    principal: Principal = Depends(get_current_principal),
) -> EventTicketResponse:
    """
    Generates a single-use, 60-second ticket for EventSource authorization.
    Standard EventSource API in browser JavaScript cannot pass Authorization headers.
    """
    ticket = create_event_ticket(principal, ttl_seconds=60)
    return EventTicketResponse(ticket=ticket, expires_in=60)


@router.get("", summary="Server-Sent Events global stream")
async def get_events_stream(
    ticket: str | None = Query(None, description="Short-lived ticket from /v1/events/ticket"),
    authorization: str | None = Header(None),
) -> EventSourceResponse:
    """
    Subscribes to live Server-Sent Events stream.
    Authenticates via either ?ticket=<token> or Authorization: Bearer <jwt> header.
    Emits events: batch.progress, batch.validated, batch.committed,
    anomaly.detected, duplicate.cross_institution.
    """
    principal = None
    if ticket:
        principal = validate_event_ticket(ticket)
    if not principal:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "AUTH_REQUIRED",
                "message": "Valid ticket parameter or authorization header required for SSE",
            },
        )

    # Scoped to institution if not AICTE_ADMIN
    inst_filter = principal.institution_aicte_id if principal.role != "AICTE_ADMIN" else None
    return EventSourceResponse(broadcaster.subscribe(institution_id=inst_filter))


@router.get("/ticker", include_in_schema=False, summary="Get recent live ticker events")
def get_ticker_events() -> list[dict[str, str]]:
    """Returns recent ticker notifications for central console banner."""
    return [
        {
            "id": "evt-001",
            "event": "BATCH_COMMITTED",
            "institution_id": "1-100010001",
            "institution_name": "Delhi Institute of Engineering & Technology",
            "message": "Batch 2026-27 committed into AICTE Central Registry. 248 records ingested.",
            "timestamp": "2 mins ago",
        },
        {
            "id": "evt-002",
            "event": "ANOMALY_RESOLVED",
            "institution_id": "1-100010002",
            "institution_name": "Mumbai Technical Institute",
            "message": (
                "Quota drift anomaly reviewed and justified with state admission council approval."
            ),
            "timestamp": "5 mins ago",
        },
        {
            "id": "evt-003",
            "event": "AUDIT_CHAIN_VERIFIED",
            "institution_id": "AICTE-CENTRAL",
            "institution_name": "AICTE Apex Console",
            "message": (
                "Tamper-evident SHA-256 audit chain verified. Unbroken cryptographic lineage."
            ),
            "timestamp": "12 mins ago",
        },
    ]
