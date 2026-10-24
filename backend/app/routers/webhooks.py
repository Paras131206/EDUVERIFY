"""
Webhooks management and delivery router for institutions.
Complies with Task B7 item 1.
"""

from app.db import get_db
from app.schemas.webhooks import (
    CreateWebhookRequest,
    TestWebhookResponse,
    WebhookDeliveryResponse,
    WebhookResponse,
)
from app.security.deps import Principal, get_current_principal
from app.services.webhooks import (
    create_webhook_service,
    delete_webhook_service,
    get_webhook_deliveries_service,
    list_webhooks_service,
    test_webhook_service,
)
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/v1/webhooks", tags=["Webhooks"])


@router.post(
    "",
    response_model=WebhookResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create institutional webhook subscription",
)
def create_webhook(
    body: CreateWebhookRequest,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> WebhookResponse:
    """
    Subscribes institution endpoint to events.
    - Restricted to INSTITUTION_ADMIN.
    - URL must be HTTPS (localhost/127.0.0.1 permitted in dev).
    - Secret is shown ONCE in this response.
    """
    return create_webhook_service(db, req=body, principal=principal)


@router.get(
    "",
    response_model=list[WebhookResponse],
    summary="List active webhooks for caller's institution",
)
def list_webhooks(
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[WebhookResponse]:
    """Returns all active webhooks for caller's institution with secret masked."""
    return list_webhooks_service(db, principal=principal)


@router.delete(
    "/{id}",
    summary="Delete institutional webhook subscription",
)
def delete_webhook(
    id: str,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Deletes webhook belonging to caller's institution."""
    return delete_webhook_service(db, webhook_id=id, principal=principal)


@router.post(
    "/{id}/test",
    response_model=TestWebhookResponse,
    summary="Dispatch immediate test ping event to webhook",
)
def test_webhook(
    id: str,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> TestWebhookResponse:
    """Dispatches test ping event with HMAC-SHA256 signature header and logs delivery."""
    return test_webhook_service(db, webhook_id=id, principal=principal)


@router.get(
    "/{id}/deliveries",
    response_model=list[WebhookDeliveryResponse],
    summary="Get webhook delivery history and retry metrics",
)
def get_webhook_deliveries(
    id: str,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[WebhookDeliveryResponse]:
    """Returns chronological delivery attempt history for the webhook."""
    return get_webhook_deliveries_service(db, webhook_id=id, principal=principal)
