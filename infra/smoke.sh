#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:8000}"

echo "=== Running EduVerify Smoke Test against $BASE_URL ==="

# 1. Health check
echo -n "Checking /healthz ... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/healthz")
if [ "$STATUS" -eq 200 ]; then
  echo "OK (200)"
else
  echo "FAILED ($STATUS)"
  exit 1
fi

# 2. OpenAPI JSON
echo -n "Checking /openapi.json ... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/openapi.json")
if [ "$STATUS" -eq 200 ]; then
  echo "OK (200)"
else
  echo "FAILED ($STATUS)"
  exit 1
fi

echo "=== All smoke checks passed! ==="
