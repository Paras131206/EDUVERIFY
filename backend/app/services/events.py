"""
Server-Sent Events (SSE) broadcaster and ticketing system.
Complies with prompt B3 item 4.
"""

import asyncio
import json
import logging
import secrets
import time
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from typing import Any

from app.security.deps import Principal

logger = logging.getLogger(__name__)

# In-memory ticket storage: ticket -> (Principal, expire_at)
_TICKETS: dict[str, tuple[Principal, float]] = {}


def create_event_ticket(principal: Principal, ttl_seconds: int = 60) -> str:
    """Generates a short-lived single-use ticket for EventSource authorization."""
    ticket = secrets.token_urlsafe(32)
    _TICKETS[ticket] = (principal, time.time() + ttl_seconds)
    _cleanup_expired_tickets()
    return ticket


def validate_event_ticket(ticket: str) -> Principal | None:
    """Validates and consumes a short-lived ticket."""
    _cleanup_expired_tickets()
    if ticket in _TICKETS:
        principal, expire_at = _TICKETS.pop(ticket)
        if time.time() <= expire_at:
            return principal
    return None


def _cleanup_expired_tickets() -> None:
    """Purges expired tickets from in-memory cache."""
    now = time.time()
    expired = [t for t, (_, exp) in _TICKETS.items() if now > exp]
    for t in expired:
        _TICKETS.pop(t, None)


class EventBroadcaster:
    """
    In-process asynchronous event broadcaster with pub/sub queues and keepalive heartbeat.
    """

    def __init__(self) -> None:
        self._subscribers: set[tuple[asyncio.Queue, str | None, str | None]] = set()
        self._lock = asyncio.Lock()

    async def subscribe(
        self, institution_id: str | None = None, batch_id: str | None = None
    ) -> AsyncGenerator[dict[str, Any], None]:
        """
        Subscribes a client to SSE events with optional institution and batch scoping.
        Yields events formatted for sse_starlette.
        """
        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=100)
        sub_entry = (queue, institution_id, batch_id)

        async with self._lock:
            self._subscribers.add(sub_entry)

        try:
            while True:
                try:
                    # Wait for next event or 5-second timeout for keepalive heartbeat
                    event = await asyncio.wait_for(queue.get(), timeout=5.0)
                    yield event
                except TimeoutError:
                    # 5-second heartbeat ping
                    yield {
                        "event": "ping",
                        "data": json.dumps({"timestamp": datetime.now(UTC).isoformat()}),
                    }
        finally:
            async with self._lock:
                self._subscribers.discard(sub_entry)

    async def publish(
        self,
        event_type: str,
        data: dict[str, Any],
        institution_id: str | None = None,
        batch_id: str | None = None,
    ) -> None:
        """
        Publishes an event to all matching active subscriber queues.
        """
        payload = {
            "event": event_type,
            "data": json.dumps(data, default=str),
        }
        async with self._lock:
            for queue, sub_inst, sub_batch in list(self._subscribers):
                # Filter by institution: if subscriber is institution-scoped,
                # match or allow AICTE (None)
                if (
                    sub_inst is not None
                    and institution_id is not None
                    and sub_inst != institution_id
                ):
                    continue
                # Filter by batch_id: if subscriber is batch-scoped, must match
                if sub_batch is not None and batch_id is not None and sub_batch != batch_id:
                    continue
                try:
                    queue.put_nowait(payload)
                except asyncio.QueueFull:
                    logger.warning("Subscriber queue full; dropping event: %s", event_type)

    def publish_sync(
        self,
        event_type: str,
        data: dict[str, Any],
        institution_id: str | None = None,
        batch_id: str | None = None,
    ) -> None:
        """
        Synchronous dispatch directly into in-memory subscriber queues.
        Safe for execution from background worker threads or sync service methods.
        """
        payload = {
            "event": event_type,
            "data": json.dumps(data, default=str),
        }
        for queue, sub_inst, sub_batch in list(self._subscribers):
            if sub_inst is not None and institution_id is not None and sub_inst != institution_id:
                continue
            if sub_batch is not None and batch_id is not None and sub_batch != batch_id:
                continue
            try:
                queue.put_nowait(payload)
            except Exception as put_exc:
                logger.debug("Could not enqueue event to subscriber: %s", put_exc)

    _publish_sync = publish_sync


# Global singleton broadcaster instance
broadcaster = EventBroadcaster()
