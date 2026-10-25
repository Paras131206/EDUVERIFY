"""
Backend configuration using pydantic-settings.
Complies with agents.md §3 and prompt B0.
"""

import json
from contextlib import suppress
from functools import lru_cache
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ENV: str = Field(default="dev", description="Environment: dev, staging, prod")
    PORT: int = Field(default=8000, description="Listening port (binds $PORT on Render)")

    # Database
    DATABASE_URL: str = Field(
        default="sqlite:///./eduverify.sqlite3",
        description="SQLAlchemy database URL with postgres:// rewrite",
    )

    # Security & Cryptography
    JWT_SECRET: str = Field(
        default="dev-jwt-secret-at-least-32-characters-for-hs256-signing-eduverify",
        description="Secret key for JWT generation",
    )
    FERNET_KEY: str = Field(
        default="0123456789abcdef0123456789abcdef0123456789a=",
        description="Fernet symmetric key for PII encryption at rest",
    )
    ISSUER_KEYS_JSON: str = Field(
        default="{}",
        description="JSON string containing Ed25519 issuer keys for SD-JWT credentials",
    )
    PEPPER: str = Field(
        default="dev-password-pepper-change-in-production",
        description="Pepper for password hashing",
    )
    SEED_PASSWORD: str = Field(
        default="AdminPassword@2026",
        description="Default password for seeded demo accounts",
    )
    MFA_REQUIRED_FOR_ADMIN: bool = Field(
        default=False,
        description="Feature flag: Require TOTP MFA for AICTE_ADMIN",
    )
    BATCH_FILES_RETENTION_DAYS: int = Field(
        default=90,
        description="Number of days to retain raw batch upload files in batch_files before purging",
    )

    # CORS & URLs
    CORS_ORIGINS: list[str] | str = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
        ],
        description="Allowed CORS origin domains",
    )
    PUBLIC_BASE_URL: str = Field(
        default="http://localhost:8000",
        description="Public accessible URL of the API",
    )
    FRONTEND_URL: str = Field(
        default="http://localhost:5173",
        description="Public accessible URL of the frontend UI",
    )

    # SMTP Configuration (Mailpit locally, SMTP on Render)
    SMTP_HOST: str = Field(default="localhost", description="SMTP host")
    SMTP_PORT: int = Field(default=1025, description="SMTP port")
    SMTP_USER: str = Field(default="", description="SMTP username")
    SMTP_PASSWORD: str = Field(default="", description="SMTP password")
    SMTP_FROM: str = Field(
        default="no-reply@eduverify.aicte-india.org",
        description="Sender email address for notifications",
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def rewrite_database_url(cls, v: Any) -> Any:
        if isinstance(v, str):
            # Render provides postgres:// which SQLAlchemy 2 / psycopg 3 requires as postgresql+psycopg://
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+psycopg://", 1)
            if v.startswith("postgresql://") and "+psycopg" not in v:
                return v.replace("postgresql://", "postgresql+psycopg://", 1)
            if v == "sqlite:///./eduverify.sqlite3" or v.startswith("sqlite:///./"):
                from pathlib import Path

                root_db = Path(__file__).resolve().parent.parent.parent / "eduverify.sqlite3"
                return f"sqlite:///{root_db.as_posix()}"
        return v

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                with suppress(json.JSONDecodeError):
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return [str(origin).strip() for origin in parsed if str(origin).strip()]
            # Handle comma-separated or single URL string from environment variables
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        if isinstance(v, list):
            return [str(origin).strip() for origin in v if str(origin).strip()]
        return ["http://localhost:5173", "http://127.0.0.1:5173"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
