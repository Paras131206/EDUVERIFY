# Database Migration Strategy: Expand / Contract Architecture

Refer to canonical documentation in [docs/migrations.md](file:///c:/Users/Vedant/Documents/Coding/Projects/EDUVERIFY/docs/migrations.md).

## Quick Summary
- **Pattern**: Expand / Contract (Never destructive in one deploy)
- **Tool**: Alembic (`alembic upgrade head`, `alembic downgrade -1`)
- **Automated Verification**: `pytest backend/tests/test_migration_and_seed.py`
- **Current Revisions**:
  - `0001_initial_users`: User authentication, roles, API keys, audit ledger
  - `0002_core_data_model`: Batches, students, issues, consent, credentials, webhooks, notifications outbox
  - `0003_performance_indexes`: High-performance composite indexes for institution+year, batch_id, rule_id+priority
