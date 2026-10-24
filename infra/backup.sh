#!/usr/bin/env bash
# ==============================================================================
# EduVerify Automated Database Backup Script
# Supports local filesystem and S3-compatible object storage (AWS, R2, MinIO)
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILENAME="eduverify_backup_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

mkdir -p "${BACKUP_DIR}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Error: DATABASE_URL environment variable is required." >&2
  exit 1
fi

echo "=== [$(date)] Starting EduVerify PostgreSQL Backup ==="

# Execute pg_dump with compression
echo "Dumping database schema and data..."
pg_dump "${DATABASE_URL}" \
  --format=plain \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  | gzip -c -9 > "${BACKUP_PATH}"

# Generate cryptographic checksum for verification
echo "Generating SHA256 checksum..."
sha256sum "${BACKUP_PATH}" > "${BACKUP_PATH}.sha256"

SIZE="$(du -h "${BACKUP_PATH}" | cut -f1)"
echo "Backup created successfully: ${BACKUP_PATH} (${SIZE})"

# Optional upload to S3-compatible object storage
if [ -n "${S3_BUCKET:-}" ]; then
  S3_PREFIX="${S3_PREFIX:-backups/eduverify}"
  S3_TARGET="s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_FILENAME}"
  echo "Uploading to S3 target: ${S3_TARGET}..."
  
  if command -v aws >/dev/null 2>&1; then
    aws s3 cp "${BACKUP_PATH}" "${S3_TARGET}"
    aws s3 cp "${BACKUP_PATH}.sha256" "${S3_TARGET}.sha256"
  elif command -v mc >/dev/null 2>&1; then
    mc cp "${BACKUP_PATH}" "${S3_TARGET}"
    mc cp "${BACKUP_PATH}.sha256" "${S3_TARGET}.sha256"
  else
    echo "Warning: S3_BUCKET set but neither 'aws' nor 'mc' CLI found. Saved locally."
  fi
fi

# Prune old local backups
echo "Cleaning up local backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "eduverify_backup_*.sql.gz*" -mtime +"${RETENTION_DAYS}" -delete || true

echo "=== Backup Process Complete: ${BACKUP_FILENAME} ==="
