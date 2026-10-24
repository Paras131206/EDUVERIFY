"""
Pydantic schemas for Notification outbox and user alert listings.
Complies with Task B7 item 2.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    recipient: str
    channel: str
    subject: str | None = None
    body: str
    status: str
    created_at: datetime
    sent_at: datetime | None = None
    error: str | None = None
