"""
Database connection and session factory for SQLAlchemy 2.
Supports SQLite for tests/local dev and PostgreSQL 16 (psycopg 3) for production.
"""

import logging
from collections.abc import Generator

from app.config import get_settings
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

logger = logging.getLogger(__name__)
settings = get_settings()

# Engine creation with connection pooling
connect_args = {}

if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # PostgreSQL (psycopg 3): limit connection and query wait times.
    connect_args = {
        "connect_timeout": 5,
        "options": "-c statement_timeout=5000",
    }

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    echo=False,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    """Dependency yielding a transactional SQLAlchemy session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_health() -> str:
    """Validate database connectivity with bounded PostgreSQL timeouts."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return "connected"
    except SQLAlchemyError as exc:
        logger.warning(
            "Database health check failed: %s",
            type(exc).__name__,
        )
        return f"unreachable ({type(exc).__name__})"
