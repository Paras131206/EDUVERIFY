#!/usr/bin/env bash
# OWASP ZAP Baseline Scan execution script for EduVerify
set -euo pipefail

TARGET_URL="${1:-http://localhost:8000}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

echo "=== Running OWASP ZAP Baseline Scan against ${TARGET_URL} ==="
echo "Configuration: ${DIR}/zap-baseline.conf"

docker run --rm \
  -v "${DIR}:/zap/wrk/:rw" \
  -t zaproxy/zap-stable zap-baseline.py \
  -t "${TARGET_URL}" \
  -c zap-baseline.conf \
  -r zap-report.html \
  -J zap-report.json \
  -I

echo "=== ZAP Baseline Scan Completed. Reports written to ${DIR}/zap-report.html ==="
