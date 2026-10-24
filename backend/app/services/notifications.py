"""
Notification outbox and background delivery worker service.
Supports SMTP email (Mailpit locally), SMS adapter stub, and template rendering.
Complies with Task B7 item 2.
"""

import logging
import smtplib
from datetime import UTC, datetime
from email.message import EmailMessage
from typing import Any

from app.config import get_settings
from app.models.core import NotificationOutbox
from app.schemas.notifications import NotificationResponse
from app.security.deps import Principal
from sqlalchemy import select
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)
settings = get_settings()

TEMPLATES: dict[str, dict[str, str]] = {
    "batch_validated": {
        "subject": "EduVerify: Batch {batch_id} Validation Completed",
        "body": "Batch {batch_id} for institution {institution_id} has been validated. "
        "Quality Score: {quality_score}%. Errors: {errors}, Warnings: {warnings}.",
    },
    "batch_committed": {
        "subject": "EduVerify: Batch {batch_id} Successfully Committed",
        "body": "Batch {batch_id} has been committed to the Central Repository. "
        "{committed_records} student records enrolled successfully.",
    },
    "review_needed": {
        "subject": "EduVerify: Action Required — Batch {batch_id} Review Needed",
        "body": (
            "Batch {batch_id} contains {flagged_issues} issues routed "
            "for institutional human review."
        ),
    },
    "transfer_requested": {
        "subject": "EduVerify: Student Transfer Request {transfer_id}",
        "body": (
            "Transfer request submitted for student {student_id} from {from_inst} to {to_inst}."
        ),
    },
    "consent_changed": {
        "subject": "EduVerify: Privacy Consent Record Updated",
        "body": (
            "Consent record updated for student {apaar_id}: "
            "Purpose '{purpose}' updated to '{status}'."
        ),
    },
    "credential_revoked_or_superseded": {
        "subject": "EduVerify: Credential Status Update",
        "body": (
            "Notice: Verifiable Credential {credential_id} status updated to '{status}' on {date}."
        ),
    },
}


def render_template(template_name: str, context: dict[str, Any]) -> tuple[str, str]:
    """Renders subject and body for a known notification template."""
    tmpl = TEMPLATES.get(
        template_name,
        {
            "subject": "EduVerify Notification: " + template_name.replace("_", " ").title(),
            "body": "Notification event: " + str(context),
        },
    )
    try:
        subject = tmpl["subject"].format(**context)
        body = tmpl["body"].format(**context)
    except Exception:
        subject = tmpl["subject"]
        body = tmpl["body"] + f" Context: {context}"
    return subject, body


def enqueue_notification(
    db: Session,
    recipient: str,
    template_name: str = "",
    context: dict[str, Any] | None = None,
    channel: str = "EMAIL",
    subject: str | None = None,
    body: str | None = None,
    custom_subject: str | None = None,
    custom_body: str | None = None,
) -> NotificationOutbox:
    """Enqueues an alert into notifications_outbox."""
    subj = subject or custom_subject
    bod = body or custom_body
    if not (subj and bod):
        subj, bod = render_template(template_name, context or {})

    item = NotificationOutbox(
        recipient=recipient.strip(),
        channel=channel.upper(),
        subject=subj,
        body=body,
        status="PENDING",
        retry_count=0,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def _send_email_smtp(recipient: str, subject: str, body: str) -> None:
    """Dispatches email via SMTP server (Mailpit at localhost:1025 in dev)."""
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM
    msg["To"] = recipient
    msg.set_content(body)

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=4.0) as server:
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)


def send_sms_stub(recipient: str, body: str) -> bool:
    """SMS gateway adapter stub (mocked delivery)."""
    logger.info("SMS Adapter STUB -> Recipient: %s, Message: %s", recipient, body[:80])
    return True


_send_sms_stub = send_sms_stub


def process_notifications_worker(
    db: Session, batch_limit: int = 50, batch_size: int | None = None
) -> int:
    """
    Processes pending outbox notifications.
    Returns count of successfully sent alerts.
    """
    limit = batch_size if batch_size is not None else batch_limit
    pending = list(
        db.scalars(
            select(NotificationOutbox).where(NotificationOutbox.status == "PENDING").limit(limit)
        ).all()
    )

    processed = 0
    now = datetime.now(UTC)

    for item in pending:
        try:
            if item.channel == "EMAIL":
                _send_email_smtp(
                    item.recipient, item.subject or "EduVerify Notification", item.body
                )
            elif item.channel == "SMS":
                _send_sms_stub(item.recipient, item.body)
            item.status = "SENT"
            item.sent_at = now
            item.error = None
            processed += 1
        except Exception as exc:
            logger.warning("Notification delivery failed for %s: %s", item.recipient, exc)
            item.status = "FAILED"
            item.retry_count += 1
            item.error = str(exc)

    if pending:
        db.commit()

    return processed


def list_user_notifications_service(
    db: Session,
    principal: Principal,
    limit: int = 50,
) -> list[NotificationResponse]:
    """Returns alerts for caller's email / user id."""
    email = principal.email.lower() if principal.email else ""
    items = list(
        db.scalars(
            select(NotificationOutbox)
            .where(NotificationOutbox.recipient.ilike(email))
            .order_by(NotificationOutbox.created_at.desc())
            .limit(limit)
        ).all()
    )

    return [NotificationResponse.model_validate(n) for n in items]
