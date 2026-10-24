"""
Database seeding script for demo accounts and initial administrator accounts.
Complies with runthrough.md, agents.md §9, and prompt B1.
Can be executed as: python -m app.seed --if-empty
"""

import argparse
import hashlib
import logging
import sys
from datetime import UTC, datetime

from app.config import get_settings
from app.db import Base, SessionLocal, engine
from app.models.auth import User
from app.security.passwords import hash_password
from app.services.audit import append_audit_log

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)
settings = get_settings()

DEFAULT_DEV_PASSWORD = "AdminPassword@2026"  # nosec B105

DEMO_USERS = [
    {
        "email": "aicte.admin@demo.local",
        "full_name": "AICTE Administrator",
        "role": "AICTE_ADMIN",
        "institution_aicte_id": None,
        "dab_id": None,
        "student_apaar_hash": None,
    },
    {
        "email": "aicte.analyst@demo.local",
        "full_name": "AICTE Data Analyst",
        "role": "AICTE_ANALYST",
        "institution_aicte_id": None,
        "dab_id": None,
        "student_apaar_hash": None,
    },
    {
        "email": "inst.admin@demo.local",
        "full_name": "Apex Institute Admin",
        "role": "INSTITUTION_ADMIN",
        "institution_aicte_id": "1-10001",
        "dab_id": None,
        "student_apaar_hash": None,
    },
    {
        "email": "inst.staff@demo.local",
        "full_name": "Apex Institute Staff",
        "role": "INSTITUTION_STAFF",
        "institution_aicte_id": "1-10001",
        "dab_id": None,
        "student_apaar_hash": None,
    },
    {
        "email": "inst2.admin@demo.local",
        "full_name": "Beacon Institute Admin",
        "role": "INSTITUTION_ADMIN",
        "institution_aicte_id": "1-10002",
        "dab_id": None,
        "student_apaar_hash": None,
    },
    {
        "email": "dab.admin@demo.local",
        "full_name": "State Tech University Admin",
        "role": "DAB_ADMIN",
        "institution_aicte_id": None,
        "dab_id": "DAB-01",
        "student_apaar_hash": None,
    },
    {
        "email": "student@demo.local",
        "full_name": "Demo Student",
        "role": "STUDENT",
        "institution_aicte_id": "1-10001",
        "dab_id": None,
        "student_apaar_hash": hashlib.sha256(b"123456789012").hexdigest(),
    },
    {
        "email": "verifier@demo.local",
        "full_name": "Corporate Verifier",
        "role": "VERIFIER",
        "institution_aicte_id": None,
        "dab_id": None,
        "student_apaar_hash": None,
    },
]


def seed_database(if_empty: bool = False) -> None:
    """Seeds predefined demo accounts into the database with secure hashed passwords."""
    # Refuse to seed with default password when ENV != dev
    if settings.ENV != "dev" and settings.SEED_PASSWORD == DEFAULT_DEV_PASSWORD:
        logger.error(
            "Refusing to seed with default password in non-dev environment (ENV=%s)", settings.ENV
        )
        raise ValueError(
            f"Security Violation: Refusing to seed with default password "
            f"'{DEFAULT_DEV_PASSWORD}' when ENV={settings.ENV}"
        )

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if if_empty and user_count > 0:
            logger.info(
                "Database already contains %d users. Skipping seed (--if-empty specified).",
                user_count,
            )
            return

        seeded_count = 0
        password_hash = hash_password(settings.SEED_PASSWORD)

        for udata in DEMO_USERS:
            email = str(udata["email"])
            full_name = str(udata["full_name"])
            role = str(udata["role"])
            inst_id = udata["institution_aicte_id"]
            dab_id = udata["dab_id"]
            apaar_hash = udata["student_apaar_hash"]

            existing = db.query(User).filter(User.email == email).first()
            if existing:
                existing.password_hash = password_hash
                existing.full_name = full_name
                existing.role = role
                existing.institution_aicte_id = inst_id
                existing.dab_id = dab_id
                existing.student_apaar_hash = apaar_hash
                existing.is_active = True
                existing.failed_logins = 0
                existing.locked_until = None
            else:
                new_user = User(
                    email=email,
                    password_hash=password_hash,
                    full_name=full_name,
                    role=role,
                    institution_aicte_id=inst_id,
                    dab_id=dab_id,
                    student_apaar_hash=apaar_hash,
                    is_active=True,
                    created_at=datetime.now(UTC),
                )
                db.add(new_user)
                seeded_count += 1

        append_audit_log(
            db,
            action="DATABASE_SEEDED",
            actor_type="SYSTEM",
            resource="USERS",
            payload={"seeded_users_count": len(DEMO_USERS), "env": settings.ENV},
        )
        db.commit()
        logger.info("Successfully seeded database with %d demo users.", len(DEMO_USERS))
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed EduVerify database with demo accounts.")
    parser.add_argument(
        "--if-empty",
        action="store_true",
        help="Only seed if the users table is completely empty.",
    )
    args = parser.parse_args()

    try:
        seed_database(if_empty=args.if_empty)
    except Exception as e:
        logger.error("Seeding failed: %s", e)
        sys.exit(1)


if __name__ == "__main__":
    main()
