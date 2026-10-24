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
from starlette.responses import JSONResponse, RedirectResponse, Response

settings = get_settings()

MAX_REQUEST_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB maximum payload limit


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
    Injects essential security headers into every HTTP response and enforces
    HTTPS redirection outside local development.
    Complies with prompt B1 and B8.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Enforce HTTPS redirect outside development (e.g. Render forwards X-Forwarded-Proto)
        if settings.ENV != "dev":
            forwarded_proto = request.headers.get("x-forwarded-proto", "")
            if forwarded_proto.lower() == "http":
                secure_url = str(request.url).replace("http://", "https://", 1)
                return RedirectResponse(url=secure_url, status_code=301)

        response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = "frame-ancestors 'none';"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # HSTS enforced outside dev
        if settings.ENV != "dev":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        return response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """
    Guards server resources by rejecting request payloads exceeding 15 MB.
    Complies with prompt B8 item 2.
    """

    def __init__(self, app, max_bytes: int = MAX_REQUEST_SIZE_BYTES):
        super().__init__(app)
        self.max_bytes = max_bytes

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > self.max_bytes:
                    max_mb = self.max_bytes // (1024 * 1024)
                    return JSONResponse(
                        status_code=413,
                        content={
                            "code": "PAYLOAD_TOO_LARGE",
                            "detail": f"Request body exceeds maximum allowed size of {max_mb} MB",
                        },
                    )
            except ValueError:
                pass

        return await call_next(request)

