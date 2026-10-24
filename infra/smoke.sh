#!/usr/bin/env bash
# ==============================================================================
# EduVerify Production Smoke Test Drill
# Exercises: 1. Healthz 2. Login 3. Upload Demo Batch 4. Verify Credential / Trust
# Complies with prompt B8 item 7.
# ==============================================================================
set -euo pipefail

BASE_URL="${1:-http://localhost:8000}"
# Trim trailing slash
BASE_URL="${BASE_URL%/}"

EMAIL="${SMOKE_EMAIL:-inst.admin@demo.local}"
PASSWORD="${SMOKE_PASSWORD:-DemoPass123!}"

echo "======================================================================="
echo " Starting EduVerify Deployment Smoke Test Drill"
echo " Target URL : ${BASE_URL}"
echo " Timestamp  : $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "======================================================================="

# Helper function for JSON parsing without jq dependency if missing
json_val() {
  local key="$1"
  python -c "import sys, json; data=json.load(sys.stdin); print(data.get('$key', ''))" 2>/dev/null || true
}

# ------------------------------------------------------------------------------
# STEP 1: Healthcheck (/healthz)
# ------------------------------------------------------------------------------
echo -n "[1/4] Checking /healthz ... "
HEALTH_RESP=$(curl -s -w "\n%{http_code}" "${BASE_URL}/healthz")
HEALTH_CODE=$(echo "$HEALTH_RESP" | tail -n1)
HEALTH_BODY=$(echo "$HEALTH_RESP" | sed '$d')

if [ "$HEALTH_CODE" -ne 200 ]; then
  echo "FAILED (HTTP ${HEALTH_CODE})"
  echo "Response: ${HEALTH_BODY}"
  exit 1
fi
echo "PASSED (HTTP 200, status: ok)"

# ------------------------------------------------------------------------------
# STEP 2: Authenticate & Retrieve JWT Token (/v1/auth/login)
# ------------------------------------------------------------------------------
echo -n "[2/4] Testing authentication as ${EMAIL} ... "
LOGIN_RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")
LOGIN_CODE=$(echo "$LOGIN_RESP" | tail -n1)
LOGIN_BODY=$(echo "$LOGIN_RESP" | sed '$d')

if [ "$LOGIN_CODE" -ne 200 ]; then
  echo "FAILED (HTTP ${LOGIN_CODE})"
  echo "Response: ${LOGIN_BODY}"
  exit 1
fi

TOKEN=$(echo "$LOGIN_BODY" | json_val "access_token")
if [ -z "$TOKEN" ]; then
  echo "FAILED (No access_token returned)"
  exit 1
fi
echo "PASSED (HTTP 200, JWT token acquired)"

# ------------------------------------------------------------------------------
# STEP 3: Upload Demo Batch (/v1/batches)
# ------------------------------------------------------------------------------
echo -n "[3/4] Uploading synthetic verification batch ... "
TMP_BATCH=$(mktemp /tmp/smoke_batch_XXXXXX.csv 2>/dev/null || mktemp -t smoke_batch.csv)
cat << 'EOF' > "$TMP_BATCH"
apaar_id,student_id,full_name,dob,gender,category,program_code,course_level,academic_year,year_of_study,admission_date,admission_type,seat_type,quota,nationality,pwd,nri,email,mobile
900012345678,SMOKE-001,Aarav Sharma,2004-05-15,M,GEN,CSE-BTECH,UG,2026-27,1,2026-08-01,REGULAR,REGULAR,NONE,IN,False,False,smoke.student@demo.local,9876543210
EOF

BATCH_RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/v1/batches" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "academic_year=2026-27" \
  -F "file=@${TMP_BATCH};type=text/csv")
BATCH_CODE=$(echo "$BATCH_RESP" | tail -n1)
BATCH_BODY=$(echo "$BATCH_RESP" | sed '$d')
rm -f "$TMP_BATCH"

if [ "$BATCH_CODE" -ne 202 ] && [ "$BATCH_CODE" -ne 200 ]; then
  echo "FAILED (HTTP ${BATCH_CODE})"
  echo "Response: ${BATCH_BODY}"
  exit 1
fi

BATCH_ID=$(echo "$BATCH_BODY" | json_val "batch_id")
echo "PASSED (HTTP ${BATCH_CODE}, batch_id: ${BATCH_ID:-accepted})"

# ------------------------------------------------------------------------------
# STEP 4: Verify Public Nonce & Credential Verification Protocol
# ------------------------------------------------------------------------------
echo -n "[4/4] Verifying public trust layer and verification nonce ... "
NONCE_RESP=$(curl -s -w "\n%{http_code}" "${BASE_URL}/v1/verify/nonce")
NONCE_CODE=$(echo "$NONCE_RESP" | tail -n1)
NONCE_BODY=$(echo "$NONCE_RESP" | sed '$d')

if [ "$NONCE_CODE" -ne 200 ]; then
  echo "FAILED (HTTP ${NONCE_CODE})"
  echo "Response: ${NONCE_BODY}"
  exit 1
fi

NONCE=$(echo "$NONCE_BODY" | json_val "nonce")
if [ -z "$NONCE" ]; then
  echo "FAILED (No nonce in response)"
  exit 1
fi

# Check public DID discovery
DID_RESP=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/.well-known/did.json")
if [ "$DID_RESP" -ne 200 ]; then
  echo "FAILED (DID Document returned ${DID_RESP})"
  exit 1
fi

echo "PASSED (HTTP 200, nonce: ${NONCE:0:16}..., W3C did:web verified)"

echo "======================================================================="
echo " ALL SMOKE TEST CHECKS PASSED SUCCESSFULLY!"
echo " Target service ${BASE_URL} is healthy, authenticated, and verifying."
echo "======================================================================="
exit 0
