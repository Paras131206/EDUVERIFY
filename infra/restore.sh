#!/usr/bin/env bash
# ==============================================================================
# EduVerify Database Restore Drill Script
# Validates checksums, restores schema & data, verifies table integrity.
# ==============================================================================
set -euo pipefail

BACKUP_FILE="${1:-}"
FORCE="${2:-}"

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <path-to-backup.sql.gz> [--force]" >&2
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Error: DATABASE_URL environment variable is required." >&2
  exit 1
fi

# Verify SHA256 checksum if available
if [ -f "${BACKUP_FILE}.sha256" ]; then
  echo "Verifying SHA256 checksum..."
  if sha256sum --check "${BACKUP_FILE}.sha256"; then
    echo "Checksum verified: OK"
  else
    echo "Error: Checksum verification failed for ${BACKUP_FILE}!" >&2
    exit 1
  fi
fi

if [ "${FORCE}" != "--force" ]; then
  echo "WARNING: This will overwrite data in the target database!"
  echo "Target: ${DATABASE_URL}"
  read -r -p "Are you sure you want to proceed? [y/N] " confirmation
  if [[ ! "$confirmation" =~ ^[Yy]$ ]]; then
    echo "Restore aborted by user."
    exit 0
  fi
fi

echo "=== [$(date)] Restoring EduVerify Database from ${BACKUP_FILE} ==="

# Decompress and feed into psql
gunzip -c "${BACKUP_FILE}" | psql "${DATABASE_URL}" -v ON_ERROR_STOP=1

echo "=== Verifying Restored Database Schema & Data ==="

# Verification queries
psql "${DATABASE_URL}" -c "
SELECT 'users' AS table_name, count(*) AS row_count FROM users
UNION ALL
SELECT 'institutions', count(*) FROM institutions
UNION ALL
SELECT 'batches', count(*) FROM batches
UNION ALL
SELECT 'student_records', count(*) FROM student_records;
"

echo "=== Database Restore Completed Successfully ==="
