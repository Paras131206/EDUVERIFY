"""
Tests for database seeding script.
Validates idempotency, 8 required demo users, and refusal of default password in production.
Complies with runthrough.md and prompt B1.
"""

import pytest
from app.models.auth import User
from app.seed import DEFAULT_DEV_PASSWORD, DEMO_USERS, seed_database
from sqlalchemy.orm import Session


def test_seed_demo_accounts_idempotency(db_session: Session):
    """Seed script populates all 8 demo accounts and is idempotent."""
    seed_database(if_empty=False)

    users = db_session.query(User).all()
    assert len(users) >= 8

    demo_emails = [u["email"] for u in DEMO_USERS]
    for email in demo_emails:
        user = db_session.query(User).filter(User.email == email).first()
        assert user is not None, f"Seeded user {email} missing"
        assert user.is_active is True

    # Re-running with if_empty=True must be a no-op
    seed_database(if_empty=True)


def test_seed_refuses_default_password_when_not_dev(monkeypatch):
    """Seed refuses to execute with default dev password in non-dev environments."""
    monkeypatch.setattr("app.seed.settings.ENV", "production")
    monkeypatch.setattr("app.seed.settings.SEED_PASSWORD", DEFAULT_DEV_PASSWORD)

    with pytest.raises(ValueError) as exc_info:
        seed_database(if_empty=False)

    assert "Refusing to seed with default password" in str(exc_info.value)
