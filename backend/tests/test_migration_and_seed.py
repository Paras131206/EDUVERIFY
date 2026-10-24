"""
Tests for Alembic migrations 0001/0002 and seeder idempotency.
Complies with prompt B2 item 6.
"""

from pathlib import Path

from alembic import command
from alembic.config import Config
from app.db import SessionLocal
from app.models.auth import User
from app.models.core import Institution, Program, State, StudentRecord
from app.seed import seed_database
from sqlalchemy import inspect


def get_alembic_config(db_url: str | None = None) -> Config:
    backend_dir = Path(__file__).resolve().parent.parent
    ini_path = backend_dir / "alembic.ini"
    cfg = Config(str(ini_path))
    cfg.set_main_option("script_location", str(backend_dir / "alembic"))
    if db_url:
        cfg.set_main_option("sqlalchemy.url", db_url)
    return cfg


def test_seed_idempotency_counts():
    # Run seed again (we know seed was already run in dev)
    seed_database(if_empty=False)

    db = SessionLocal()
    try:
        users_count_1 = db.query(User).count()
        states_count_1 = db.query(State).count()
        programs_count_1 = db.query(Program).count()
        institutions_count_1 = db.query(Institution).count()
        students_count_1 = db.query(StudentRecord).count()

        assert users_count_1 >= 8
        assert states_count_1 >= 19
        assert programs_count_1 >= 27
        assert institutions_count_1 >= 40
        assert students_count_1 >= 200

        # Run seed a third time!
        seed_database(if_empty=False)

        users_count_2 = db.query(User).count()
        states_count_2 = db.query(State).count()
        programs_count_2 = db.query(Program).count()
        institutions_count_2 = db.query(Institution).count()
        students_count_2 = db.query(StudentRecord).count()

        # Counts must be completely identical
        assert users_count_1 == users_count_2
        assert states_count_1 == states_count_2
        assert programs_count_1 == programs_count_2
        assert institutions_count_1 == institutions_count_2
        assert students_count_1 == students_count_2
    finally:
        db.close()


def test_alembic_upgrade_downgrade_cycle(tmp_path):
    from sqlalchemy import create_engine

    db_file = tmp_path / "test_migration.sqlite3"
    db_url = f"sqlite:///{db_file.as_posix()}"
    cfg = get_alembic_config(db_url)
    test_engine = create_engine(db_url)

    try:
        # Step 1: Upgrade to 0001 (auth)
        command.upgrade(cfg, "0001_initial_auth")
        inspector = inspect(test_engine)
        tables_0001 = set(inspector.get_table_names())
        assert "users" in tables_0001
        assert "audit_log" in tables_0001
        assert "refresh_tokens" in tables_0001
        assert "api_keys" in tables_0001
        assert "states" not in tables_0001
        assert "batches" not in tables_0001
        assert "student_records" not in tables_0001

        # Step 2: Upgrade to head (0002_core_data_model)
        command.upgrade(cfg, "head")
        inspector = inspect(test_engine)
        tables_0002 = set(inspector.get_table_names())
        assert "states" in tables_0002
        assert "districts" in tables_0002
        assert "institutions" in tables_0002
        assert "batches" in tables_0002
        assert "student_records" in tables_0002
        assert "corrections" in tables_0002

        # Step 3: Downgrade 0002 -> 0001 (-1)
        command.downgrade(cfg, "-1")
        inspector = inspect(test_engine)
        tables_downgraded = set(inspector.get_table_names())
        assert "states" not in tables_downgraded
        assert "batches" not in tables_downgraded
        assert "student_records" not in tables_downgraded
        assert "users" in tables_downgraded

        # Step 4: Re-upgrade to head
        command.upgrade(cfg, "head")
        inspector = inspect(test_engine)
        tables_reupgraded = set(inspector.get_table_names())
        assert "states" in tables_reupgraded
        assert "batches" in tables_reupgraded
        assert "student_records" in tables_reupgraded
    finally:
        test_engine.dispose()
