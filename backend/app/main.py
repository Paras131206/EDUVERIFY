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
from app.middleware import RequestIdMiddleware
from app.routers import ROUTERS
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle management."""
    setup_logging(level="INFO" if settings.ENV != "dev" else "DEBUG")
    logger.info(
        f"Starting EduVerify API v0.1.0 (ENV={settings.ENV}, engine={eduverify_engine.__version__})"
    )
    yield
    logger.info("Stopping EduVerify API")


app = FastAPI(
    title="EduVerify API",
    version="0.1.0",
    description="Central repository and verification trust layer for AICTE-approved institutions keyed by APAAR ID.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request ID and latency tracking middleware
app.add_middleware(RequestIdMiddleware)

# Register feature routers in sorted order
for router in ROUTERS:
    app.include_router(router)


def load_canonical_openapi() -> dict[str, Any]:
    """Loads the canonical contract-first openapi.yaml specification."""
    # Search for contracts/openapi.yaml relative to workspace or backend
    possible_paths = [
        Path(__file__).resolve().parent.parent.parent / "contracts" / "openapi.yaml",
        Path(__file__).resolve().parent.parent / "contracts" / "openapi.yaml",
        Path("contracts/openapi.yaml"),
    ]
    for path in possible_paths:
        if path.exists():
            with open(path, encoding="utf-8") as f:
                return yaml.safe_load(f)
    return {}


def custom_openapi() -> dict[str, Any]:
    """Overrides FastAPI default OpenAPI generator with the contracts/openapi.yaml spec."""
    if app.openapi_schema:
        return app.openapi_schema
    schema = load_canonical_openapi()
    if schema:
        app.openapi_schema = schema
        return app.openapi_schema
    # Fallback to FastAPI generator
    from fastapi.openapi.utils import get_openapi

    app.openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    return app.openapi_schema


app.openapi = custom_openapi


@app.get(
    "/healthz",
    tags=["Health"],
    summary="Health and readiness check",
    response_model=dict[str, Any],
)
def get_health() -> JSONResponse:
    """
    Health check returning status, version, engine_version, and database status.
    Returns 200 if healthy, 503 if database check fails.
    """
    db_status = check_db_health()
    engine_ver = getattr(eduverify_engine, "__version__", "0.0.1")

    payload = {
        "status": "ok" if "unreachable" not in db_status else "degraded",
        "version": "0.1.0",
        "engine_version": engine_ver,
        "db": db_status,
    }

    http_status = (
        status.HTTP_200_OK
        if payload["status"] == "ok"
        else status.HTTP_503_SERVICE_UNAVAILABLE
    )
    return JSONResponse(content=payload, status_code=http_status)
