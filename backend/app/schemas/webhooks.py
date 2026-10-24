"""
Pydantic schemas for Webhook management and delivery logging.
Complies with Task B7 item 1.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class CreateWebhookRequest(BaseModel):
    url: str = Field(
        ...,
        description=(
            "Webhook listener URL. Must be HTTPS in production/staging; "
            "localhost/127.0.0.1 permitted in dev."
        ),
    )
    events: list[str] = Field(
        ...,
        min_length=1,
        description=(
            "Event types to subscribe e.g. ['batch.committed', 'review.needed', "
            "'transfer.requested', 'consent.changed', 'credential.revoked', "
            "'credential.superseded']"
        ),
    )


class WebhookResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    institution_aicte_id: str
    url: str
    events: list[str]
    is_active: bool
    secret: str | None = Field(
        None,
        description="Signing secret (shown ONCE only at creation time).",
    )
    created_at: datetime
    updated_at: datetime


class WebhookDeliveryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    webhook_id: str
    event_type: str
    payload_json: dict[str, Any]
    status: str
    response_code: int | None = None
    attempts: int
    error_message: str | None = None
    delivered_at: datetime


class TestWebhookResponse(BaseModel):
    success: bool
    status_code: int | None = None
    event: str = "ping"
    delivered_at: datetime
    error: str | None = None
