"""
Webhook service for institutional event subscriptions, signature signing, and delivery.
Complies with Task B7 item 1.
"""

import hashlib
import hmac
import json
import logging
import secrets
import time
from datetime import UTC, datetime
from typing import Any
from urllib.parse import urlparse

import httpx
from app.config import get_settings
from app.models.core import Webhook, WebhookDelivery
from app.schemas.webhooks import (
    CreateWebhookRequest,
    TestWebhookResponse,
    WebhookDeliveryResponse,
    WebhookResponse,
)
from app.security.crypto import decrypt_field, encrypt_field
from app.security.deps import Principal
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)
settings = get_settings()


def validate_webhook_url(url: str, env: str) -> None:
    """Validates that webhook URLs use HTTPS, allowing localhost/127.0.0.1 in dev mode only."""
    try:
        parsed = urlparse(url.strip())
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_URL",
                "message": "Malformed webhook listener URL",
            },
        ) from None

    if parsed.scheme == "https":
        return

    if env == "dev" and parsed.scheme == "http":
        hostname = (parsed.hostname or "").lower()
        if hostname in ("localhost", "127.0.0.1", "::1", "testserver"):
            return

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={
            "code": "INSECURE_WEBHOOK_URL",
            "message": "Webhook URL must use HTTPS (HTTP localhost permitted only in dev mode)",
        },
    )


def generate_webhook_signature(secret: str, payload_bytes: bytes, timestamp: int) -> str:
    """
    Computes HMAC-SHA256 signature for outgoing webhook payload.
    Header format: t={timestamp},v1={hmac_hex}
    Signature base: f"{timestamp}.".encode() + payload_bytes
    """
    to_sign = f"{timestamp}.".encode("utf-8") + payload_bytes
    sig = hmac.new(secret.encode("utf-8"), to_sign, hashlib.sha256).hexdigest()
    return f"t={timestamp},v1={sig}"


def create_webhook_service(
    db: Session,
    req: CreateWebhookRequest,
    principal: Principal,
) -> WebhookResponse:
    """Creates a new institutional webhook subscription and returns the plaintext secret once."""
    if principal.role != "INSTITUTION_ADMIN" and principal.role != "AICTE_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Only INSTITUTION_ADMIN can manage webhooks"},
        )

    institution_id = principal.institution_aicte_id
    if not institution_id and principal.role == "AICTE_ADMIN":
        institution_id = "AICTE-APEX"

    if not institution_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "MISSING_INSTITUTION", "message": "User has no institution assigned"},
        )

    validate_webhook_url(req.url, settings.ENV)

    raw_secret = f"whsec_{secrets.token_hex(24)}"
    encrypted_secret = encrypt_field(raw_secret) or raw_secret

    webhook = Webhook(
        institution_aicte_id=institution_id,
        url=req.url.strip(),
        secret_hash=encrypted_secret,
        events=req.events,
        is_active=True,
    )
    db.add(webhook)
    db.commit()
    db.refresh(webhook)

    return WebhookResponse(
        id=webhook.id,
        institution_aicte_id=webhook.institution_aicte_id,
        url=webhook.url,
        events=webhook.events,
        is_active=webhook.is_active,
        secret=raw_secret,
        created_at=webhook.created_at,
        updated_at=webhook.updated_at,
    )


def list_webhooks_service(
    db: Session,
    principal: Principal,
) -> list[WebhookResponse]:
    """Lists webhooks for caller's institution (secret is masked)."""
    institution_id = principal.institution_aicte_id
    if not institution_id and principal.role == "AICTE_ADMIN":
        webhooks = list(db.scalars(select(Webhook)).all())
    else:
        webhooks = list(
            db.scalars(select(Webhook).where(Webhook.institution_aicte_id == institution_id)).all()
        )

    return [
        WebhookResponse(
            id=w.id,
            institution_aicte_id=w.institution_aicte_id,
            url=w.url,
            events=w.events,
            is_active=w.is_active,
            secret=None,
            created_at=w.created_at,
            updated_at=w.updated_at,
        )
        for w in webhooks
    ]


def delete_webhook_service(
    db: Session,
    webhook_id: str,
    principal: Principal,
) -> dict[str, str]:
    """Deletes an institutional webhook."""
    webhook = db.get(Webhook, webhook_id)
    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Webhook {webhook_id} not found"},
        )

    if (
        principal.role != "AICTE_ADMIN"
        and webhook.institution_aicte_id != principal.institution_aicte_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Cannot delete another institution's webhook"},
        )

    db.delete(webhook)
    db.commit()
    return {"message": "Webhook deleted successfully", "id": webhook_id}


def _get_raw_secret(webhook: Webhook) -> str:
    """Decrypts or retrieves raw webhook secret for signing."""
    try:
        decrypted = decrypt_field(webhook.secret_hash)
        if decrypted:
            return decrypted
    except Exception as exc:
        logger.debug("Failed to decrypt webhook secret: %s", exc)
    return webhook.secret_hash


def deliver_webhook_attempt(
    webhook: Webhook,
    event_type: str,
    payload: dict[str, Any],
    max_retries: int = 5,
) -> tuple[str, int | None, str | None, int]:
    """
    Delivers a webhook HTTP POST with exponential backoff up to max_retries.
    Returns (status, response_code, error_message, attempts).
    """
    secret = _get_raw_secret(webhook)
    full_payload = {
        "id": f"evt_{secrets.token_hex(12)}",
        "event": event_type,
        "created_at": datetime.now(UTC).isoformat(),
        "institution_id": webhook.institution_aicte_id,
        "data": payload,
    }
    payload_bytes = json.dumps(full_payload, separators=(",", ":"), default=str).encode("utf-8")

    status_str = "FAILED"
    resp_code: int | None = None
    err_msg: str | None = None
    attempts = 0

    for attempt in range(1, max_retries + 1):
        attempts = attempt
        ts = int(time.time())
        sig_header = generate_webhook_signature(secret, payload_bytes, ts)
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "EduVerify-Webhook-Worker/1.0",
            "X-EduVerify-Signature": sig_header,
        }

        try:
            with httpx.Client(timeout=5.0) as client:
                res = client.post(webhook.url, content=payload_bytes, headers=headers)
                resp_code = res.status_code
                if res.is_success:
                    status_str = "SUCCESS"
                    err_msg = None
                    break
                else:
                    err_msg = f"HTTP {res.status_code}: {res.text[:200]}"
        except Exception as exc:
            err_msg = str(exc)

        # Exponential backoff simulation for retries
        if attempt < max_retries:
            time.sleep(min(0.05 * (2 ** (attempt - 1)), 0.5))

    return status_str, resp_code, err_msg, attempts


def test_webhook_service(
    db: Session,
    webhook_id: str,
    principal: Principal,
) -> TestWebhookResponse:
    """Sends immediate test ping event to webhook and logs delivery."""
    webhook = db.get(Webhook, webhook_id)
    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Webhook {webhook_id} not found"},
        )

    if (
        principal.role != "AICTE_ADMIN"
        and webhook.institution_aicte_id != principal.institution_aicte_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Cannot test another institution's webhook"},
        )

    test_payload = {
        "message": "EduVerify Webhook Ping Test",
        "institution_aicte_id": webhook.institution_aicte_id,
        "timestamp": datetime.now(UTC).isoformat(),
    }

    status_str, code, err, attempts = deliver_webhook_attempt(
        webhook, "ping", test_payload, max_retries=1
    )

    now = datetime.now(UTC)
    delivery = WebhookDelivery(
        webhook_id=webhook.id,
        event_type="ping",
        payload_json=test_payload,
        status=status_str,
        response_code=code,
        attempts=attempts,
        error_message=err,
        delivered_at=now,
    )
    db.add(delivery)
    db.commit()

    return TestWebhookResponse(
        success=(status_str == "SUCCESS"),
        status_code=code,
        event="ping",
        delivered_at=now,
        error=err,
    )


def get_webhook_deliveries_service(
    db: Session,
    webhook_id: str,
    principal: Principal,
) -> list[WebhookDeliveryResponse]:
    """Returns delivery history log for a webhook."""
    webhook = db.get(Webhook, webhook_id)
    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Webhook {webhook_id} not found"},
        )

    if (
        principal.role != "AICTE_ADMIN"
        and webhook.institution_aicte_id != principal.institution_aicte_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "FORBIDDEN",
                "message": "Cannot inspect another institution's deliveries",
            },
        )

    deliveries = list(
        db.scalars(
            select(WebhookDelivery)
            .where(WebhookDelivery.webhook_id == webhook_id)
            .order_by(WebhookDelivery.delivered_at.desc())
        ).all()
    )
    return [WebhookDeliveryResponse.model_validate(d) for d in deliveries]


def dispatch_webhook_event(
    db: Session,
    institution_aicte_id: str,
    event_type: str,
    payload: dict[str, Any],
) -> int:
    """
    Dispatches an event to all matching active institutional webhooks with delivery logging.
    Returns count of webhooks notified.
    """
    webhooks = list(
        db.scalars(
            select(Webhook).where(
                Webhook.institution_aicte_id == institution_aicte_id,
                Webhook.is_active.is_(True),
            )
        ).all()
    )

    dispatched = 0
    now = datetime.now(UTC)
    for wh in webhooks:
        events = wh.events or []
        if "*" in events or event_type in events:
            status_str, code, err, attempts = deliver_webhook_attempt(wh, event_type, payload)
            delivery = WebhookDelivery(
                webhook_id=wh.id,
                event_type=event_type,
                payload_json=payload,
                status=status_str,
                response_code=code,
                attempts=attempts,
                error_message=err,
                delivered_at=now,
            )
            db.add(delivery)
            dispatched += 1

    if dispatched > 0:
        db.commit()

    return dispatched
