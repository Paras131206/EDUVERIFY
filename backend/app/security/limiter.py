"""
Rate limiting configuration using slowapi for login brute-force prevention.
Complies with prompt B1 (10/min/IP on login).
"""

from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)


def rate_limit_handler(request: Request, exc: Exception) -> JSONResponse:
    """Returns compliant 429 response when rate limit is exceeded."""
    detail = getattr(exc, "detail", str(exc))
    return JSONResponse(
        status_code=429,
        content={
            "detail": f"Rate limit exceeded: {detail}",
            "code": "RATE_LIMITED",
        },
    )
