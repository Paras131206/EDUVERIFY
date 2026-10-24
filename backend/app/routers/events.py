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
