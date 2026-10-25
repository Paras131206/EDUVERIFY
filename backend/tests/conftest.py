"""
Pytest configuration and shared test fixtures for EduVerify backend tests.
Provides isolated in-memory SQLite database, overridden get_db dependency,
TestClient, demo users, and auth helpers.
"""

import hashlib
import os
from collections.abc import Generator
from datetime import UTC, datetime

import pytest
from app.config import get_settings
from app.db import Base, get_db
from app.main import app
from app.models.auth import User
from app.security.limiter import limiter
from app.security.passwords import hash_password
from app.security.tokens import create_access_token
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Force dev environment for test execution
os.environ["ENV"] = "dev"
settings = get_settings()

TEST_PASSWORD = "TestAdminPassword@2026"  # nosec B105
TEST_PASSWORD_HASH = hash_password(TEST_PASSWORD)

DEMO_ACCOUNTS = [
    {
        "id": "u-aicte-admin-1",
        "email": "aicte.admin@demo.local",
        "full_name": "AICTE Administrator",
        "role": "AICTE_ADMIN",
        "institution_aicte_id": None,
        "dab_id": None,
        "student_apaar_hash": None,
    },
    {
        "id": "u-aicte-analyst-1",
        "email": "aicte.analyst@demo.local",
        "full_name": "AICTE Data Analyst",
        "role": "AICTE_ANALYST",
        "institution_aicte_id": None,
        "dab_id": None,
        "student_apaar_hash": None,
    },
    {
        "id": "u-inst-admin-1",
        "email": "inst.admin@demo.local",
        "full_name": "Apex Institute Admin",
        "role": "INSTITUTION_ADMIN",
        "institution_aicte_id": "1-10001",
        "dab_id": None,
        "student_apaar_hash": None,
    },
    {
        "id": "u-inst-staff-1",
        "email": "inst.staff@demo.local",
        "full_name": "Apex Institute Staff",
        "role": "INSTITUTION_STAFF",
        "institution_aicte_id": "1-10001",
        "dab_id": None,
        "student_apaar_hash": None,
    },
    {
        "id": "u-inst2-admin-1",
        "email": "inst2.admin@demo.local",
        "full_name": "Beacon Institute Admin",
        "role": "INSTITUTION_ADMIN",
        "institution_aicte_id": "1-10002",
        "dab_id": None,
        "student_apaar_hash": None,
    },
    {
        "id": "u-dab-admin-1",
        "email": "dab.admin@demo.local",
        "full_name": "State Tech University Admin",
        "role": "DAB_ADMIN",
        "institution_aicte_id": None,
        "dab_id": "DAB-01",
        "student_apaar_hash": None,
    },
    {
        "id": "u-student-1",
        "email": "student@demo.local",
        "full_name": "Demo Student",
        "role": "STUDENT",
        "institution_aicte_id": "1-10001",
        "dab_id": None,
        "student_apaar_hash": hashlib.sha256(b"123456789012").hexdigest(),
    },
    {
        "id": "u-verifier-1",
        "email": "verifier@demo.local",
        "full_name": "Corporate Verifier",
        "role": "VERIFIER",
        "institution_aicte_id": None,
        "dab_id": None,
        "student_apaar_hash": None,
    },
    {
        "id": "u-employer-1",
        "email": "employer@demo.local",
        "full_name": "Tata Consultancy Services (Talent Acquisition)",
        "role": "EMPLOYER",
        "institution_aicte_id": None,
        "dab_id": None,
        "student_apaar_hash": None,
    },
]


@pytest.fixture(scope="session")
def test_engine():
    """Session-wide SQLite in-memory database engine with shared connection pool."""
    from app.seed import (
        find_data_dir,
        seed_academic_years,
        seed_dabs,
        seed_demo_registry,
        seed_districts,
        seed_enums,
        seed_institutions,
        seed_programs,
        seed_states,
    )

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)

    # Seed master data once into the in-memory test database
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = session_factory()
    try:
        data_dir = find_data_dir()
        master_dir = data_dir / "master"
        demo_dir = data_dir / "demo"
        seed_states(session, master_dir / "states.csv")
        seed_districts(session, master_dir / "districts.csv")
        seed_dabs(session, master_dir / "degree_awarding_bodies.csv")
        seed_institutions(session, master_dir / "institutions.csv")
        seed_programs(session, master_dir / "programs.csv")
        seed_academic_years(session, master_dir / "academic_years.csv")
        seed_enums(session, master_dir / "enums.csv")
        seed_demo_registry(session, demo_dir / "demo_registry.csv")
        session.commit()
    finally:
        session.close()

    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(test_engine) -> Generator[Session, None, None]:
    """Provides a fresh transactional database session per test with demo users seeded."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    session = session_factory()

    # Seed demo users if not present
    now = datetime.now(UTC)
    for acct in DEMO_ACCOUNTS:
        existing = session.query(User).filter(User.email == acct["email"]).first()
        if not existing:
            user = User(
                id=acct["id"],
                email=acct["email"],
                password_hash=TEST_PASSWORD_HASH,
                full_name=acct["full_name"],
                role=acct["role"],
                institution_aicte_id=acct["institution_aicte_id"],
                dab_id=acct["dab_id"],
                student_apaar_hash=acct["student_apaar_hash"],
                is_active=True,
                failed_logins=0,
                created_at=now,
            )
            session.add(user)
    session.flush()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """TestClient configured with overridden get_db and reset rate-limiter."""

    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    limiter.reset()

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    limiter.reset()


def make_auth_headers(user: User | None) -> dict[str, str]:
    """Generates Authorization: Bearer <jwt> headers for a user."""
    assert user is not None, "Cannot make auth headers for None user"
    token = create_access_token(user)
    return {"Authorization": f"Bearer {token}"}
