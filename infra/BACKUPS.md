# EduVerify Database Backup and Disaster Recovery Strategy

This document details the database backup procedures, offsite storage architecture, restore drill protocols, and operational constraints for EduVerify deployments.

---

## ⚠️ CRITICAL NOTICE: Render Free PostgreSQL Expiry Policy

> [!CAUTION]
> **Render Free Tier Databases expire and are permanently deleted after 30 days!**
> Render free PostgreSQL instances do not support persistence beyond 30 days from creation.
> To prevent total data loss in free/demo environments:
> 1. Run automated daily backups to S3-compatible cloud storage (Cloudflare R2, AWS S3, or Backblaze B2).
> 2. Execute the **30-Day Database Re-provisioning and Restore Drill** before instance expiration.
> 3. For production staging and apex AICTE deployments, upgrade to a persistent Render Starter/Standard PostgreSQL plan.

---

## Backup Automation Architecture

The backup system utilizes `pg_dump` piped directly to gzip compression with cryptographic SHA-256 integrity signatures:

```mermaid
flowchart LR
    DB[(PostgreSQL)] -->|pg_dump --clean| DUMP[pg_dump stream]
    DUMP -->|gzip -9| FILE[eduverify_backup_*.sql.gz]
    FILE -->|sha256sum| CHECKSUM[*.sha256]
    FILE --> S3[(S3 / Cloudflare R2)]
    CHECKSUM --> S3
```

### Script: `infra/backup.sh`

```bash
# Execute local backup
DATABASE_URL="postgres://user:pass@host/eduverify" ./infra/backup.sh

# Execute backup with S3 upload
export DATABASE_URL="postgres://user:pass@host/eduverify"
export S3_BUCKET="eduverify-backups"
export S3_PREFIX="backups/prod"
./infra/backup.sh
```

### Automation via GitHub Actions / Cron
Schedule a daily cron job (e.g. `0 2 * * *`) via GitHub Actions or Render Cron Job with repository secrets `DATABASE_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `S3_BUCKET`.

---

## Disaster Recovery & Restore Drill

### Prerequisites
- Target PostgreSQL database connection string (`DATABASE_URL`).
- Backup file `eduverify_backup_YYYYMMDD_HHMMSS.sql.gz` and its companion `.sha256` signature.
- `psql` and `gunzip` installed in shell environment.

### Step-by-Step Restore Protocol

1. **Verify Integrity of Backup Artifact:**
   ```bash
   sha256sum --check eduverify_backup_20261025_000000.sql.gz.sha256
   ```

2. **Execute Database Restore Drill:**
   ```bash
   DATABASE_URL="postgres://user:pass@new-host/eduverify" \
     ./infra/restore.sh ./backups/eduverify_backup_20261025_000000.sql.gz --force
   ```

3. **Run Schema Migrations:**
   Ensure latest Alembic migrations are applied to head:
   ```bash
   cd backend
   alembic upgrade head
   ```

4. **Verify Table Row Counts:**
   The restore script automatically queries core tables:
   - `users`
   - `institutions`
   - `batches`
   - `student_records`

5. **Run End-to-End Smoke Test:**
   Execute smoke verification against the newly restored API:
   ```bash
   ./infra/smoke.sh https://eduverify-api.onrender.com
   ```

---

## Recovery Objectives (RTO / RPO)

| Metric | Target | Method |
| :--- | :--- | :--- |
| **RPO (Recovery Point Objective)** | 24 Hours (Free/Demo) / 1 Hour (Prod) | Scheduled pg_dump to offsite S3 storage |
| **RTO (Recovery Time Objective)** | < 15 Minutes | Automated decompression & streaming restore via `infra/restore.sh` |
| **Data Integrity Verification** | 100% | Cryptographic SHA-256 hash match prior to database execution |
