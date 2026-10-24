"""
EduVerify FastAPI Application Entry Point.
Complies with agents.md §3 and prompt B0.
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import eduverify_engine
import yaml
from app.config import get_settings
from app.db import check_db_health
from app.logging import setup_logging
from app.middleware import RequestIdMiddleware, SecurityHeadersMiddleware
from app.routers import ROUTERS
from app.security.limiter import limiter, rate_limit_handler
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle management."""
    setup_logging(level="INFO" if settings.ENV != "dev" else "DEBUG")
    logger.info(
        "Starting EduVerify API v0.1.0 (ENV=%s, engine=%s)",
        settings.ENV,
        eduverify_engine.__version__,
    )
    yield
    logger.info("Stopping EduVerify API")


app = FastAPI(
    title="EduVerify API",
    version="0.1.0",
    description=(
        "Central repository and verification trust layer "
        "for AICTE-approved institutions keyed by APAAR ID."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiter configuration
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)


@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    """Formats HTTPException into OpenAPI compliant ErrorResponse schema."""
    if isinstance(exc.detail, dict):
        content = dict(exc.detail)
        if "detail" not in content:
            content["detail"] = str(exc.detail)
        return JSONResponse(status_code=exc.status_code, content=content, headers=exc.headers)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers,
    )


# Security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Request ID and latency tracking middleware
app.add_middleware(RequestIdMiddleware)

# Register feature routers
for router in ROUTERS:
    app.include_router(router)


def load_canonical_openapi() -> dict[str, Any]:
    """Load the canonical contract-first OpenAPI specification."""
    possible_paths = [
        Path(__file__).resolve().parent.parent.parent / "contracts" / "openapi.yaml",
        Path(__file__).resolve().parent.parent / "contracts" / "openapi.yaml",
        Path("contracts/openapi.yaml"),
    ]

    for path in possible_paths:
        if path.exists():
            with path.open(encoding="utf-8") as file:
                return yaml.safe_load(file) or {}

    return {}


def custom_openapi() -> dict[str, Any]:
    """Load the canonical OpenAPI schema and include health endpoints."""
    if app.openapi_schema:
        return app.openapi_schema

    schema = load_canonical_openapi()

    if schema:
        schema.setdefault("paths", {})

        health_path = schema["paths"].get("/health")
        healthz_path = schema["paths"].get("/healthz")

        if health_path and not healthz_path:
            schema["paths"]["/healthz"] = health_path.copy()
        elif healthz_path and not health_path:
            schema["paths"]["/health"] = healthz_path.copy()

        app.openapi_schema = schema
        return app.openapi_schema

    from fastapi.openapi.utils import get_openapi

    app.openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    return app.openapi_schema


app.openapi = custom_openapi


def get_health() -> JSONResponse:
    """
    Return API health, engine version, and database status.

    Returns HTTP 200 when healthy or HTTP 503 when degraded.
    """
    try:
        db_status = check_db_health()
    except Exception:
        logger.exception("Database health check failed")
        db_status = "unreachable"

    engine_ver = getattr(
        eduverify_engine,
        "__version__",
        "0.0.1",
    )

    is_healthy = "unreachable" not in db_status.lower()

    payload = {
        "status": "ok" if is_healthy else "degraded",
        "version": "0.1.0",
        "engine_version": engine_ver,
        "db": db_status,
    }

    http_status = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        content=payload,
        status_code=http_status,
    )


# Register both endpoints explicitly.
app.add_api_route(
    "/health",
    get_health,
    methods=["GET"],
    tags=["Health"],
    summary="Health and readiness check",
    response_model=dict[str, Any],
)

app.add_api_route(
    "/healthz",
    get_health,
    methods=["GET"],
    tags=["Health"],
    summary="Health and readiness check",
    response_model=dict[str, Any],
)
