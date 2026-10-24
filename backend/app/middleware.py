"""
HTTP Middlewares for EduVerify API.
Handles Request-ID generation/propagation, latency metrics, and security headers.
Complies with prompt B0 and B1.
"""

import time
import uuid

from app.config import get_settings
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

settings = get_settings()


class RequestIdMiddleware(BaseHTTPMiddleware):
    """
    Ensures every inbound request has a unique X-Request-ID header,
    making distributed tracing and error diagnosis reliable.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id

        start_time = time.perf_counter()
        response = await call_next(request)
        process_time = time.perf_counter() - start_time

        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{process_time:.4f}s"
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Injects essential security headers into every HTTP response.
    Complies with prompt B1 (HSTS, nosniff, frame-ancestors none, Referrer-Policy).
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = "frame-ancestors 'none';"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # HSTS only in non-dev environments
        if settings.ENV != "dev":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        return response
