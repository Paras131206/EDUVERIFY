"""
Notifications router for caller's outbox messages and alerts.
Complies with Task B7 item 2.
"""

from app.db import get_db
from app.schemas.notifications import NotificationResponse
from app.security.deps import Principal, get_current_principal
from app.services.notifications import list_user_notifications_service
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter(prefix="/v1/notifications", tags=["Notifications"])


@router.get(
    "/me",
    response_model=list[NotificationResponse],
    summary="List notifications for the calling user",
)
def get_my_notifications(
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[NotificationResponse]:
    """Returns alerts and emails dispatched or queued for the caller."""
    return list_user_notifications_service(db, principal=principal)


@router.get(
    "/outbox",
    response_model=list[NotificationResponse],
    summary="Monitor notifications outbox queue",
)
def list_notifications_outbox(
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[NotificationResponse]:
    """Returns all queued and dispatched outbox notifications."""
    from app.models.core import NotificationOutbox
    from sqlalchemy import select

    items = list(
        db.scalars(
            select(NotificationOutbox)
            .order_by(NotificationOutbox.created_at.desc())
            .limit(100)
        ).all()
    )
    return [NotificationResponse.model_validate(n) for n in items]

