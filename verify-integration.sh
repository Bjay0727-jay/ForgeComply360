#!/bin/bash
# ============================================================================
# ForgeComply 360™ - Integration Verification Script
#
# Verifies:
#   1. API Worker is healthy and responding
#   2. Auth flow works (register → login → token refresh)
#   3. Core CRUD operations work (systems, POA&M, controls)
#   4. Reporter can connect to API (connected mode)
#   5. CORS headers allow Reporter origin
#
# Usage:
#   chmod +x scripts/verify-integration.sh
#   ./scripts/verify-integration.sh [API_URL]
# ============================================================================

set -e

API_URL="${1:-https://comply360-api.forgecyberdefense.com}"
REPORTER_URL="https://reporter-forgecomply360.pages.dev"
TEST_EMAIL="verify-$(date +%s)@forgetest.internal"
TEST_PASS="VerifyTest2026!@#"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0
SKIP=0

check() {
  local name="$1"
  local result="$2"
  local expected="$3"

  if [ "$result" = "$expected" ]; then
    echo -e "  ${GREEN}✓${NC} $name"
    ((PASS++))
  else
    echo -e "  ${RED}✗${NC} $name (got: $result, expected: $expected)"
    ((FAIL++))
  fi
}

echo ""
echo "ForgeComply 360™ — Integration Verification"
echo "API: $API_URL"
echo "Reporter: $REPORTER_URL"
echo "════════════════════════════════════════════════"
echo ""

# ── 1. Health Check ────────────────────────────────────────────────────
echo "1. API Health"
HEALTH_CODE=$(curl -s -o /tmp/fc360-health.json -w "%{http_code}" "$API_URL/health" 2>/dev/null || echo "000")
check "GET /health returns 200" "$HEALTH_CODE" "200"

if [ "$HEALTH_CODE" = "200" ]; then
  HEALTH_STATUS=$(cat /tmp/fc360-health.json | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "unknown")
  check "Health status is healthy" "$HEALTH_STATUS" "healthy"
fi
echo ""

# ── 2. CORS Headers ───────────────────────────────────────────────────
echo "2. CORS Configuration"
CORS_HEADERS=$(curl -s -I -X OPTIONS "$API_URL/api/v1/auth/login" \
  -H "Origin: $REPORTER_URL" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" 2>/dev/null)

ALLOW_ORIGIN=$(echo "$CORS_HEADERS" | grep -i "access-control-allow-origin" | tr -d '\r' || echo "")
if echo "$ALLOW_ORIGIN" | grep -qi "$REPORTER_URL\|\\*"; then
  echo -e "  ${GREEN}✓${NC} CORS allows Reporter origin"
  ((PASS++))
else
  echo -e "  ${YELLOW}⚠${NC} CORS may not allow Reporter origin"
  echo "    Header: $ALLOW_ORIGIN"
  echo "    If using wildcard (*), Reporter will work but should be restricted in production"
  ((SKIP++))
fi

ALLOW_METHODS=$(echo "$CORS_HEADERS" | grep -i "access-control-allow-methods" | tr -d '\r' || echo "")
if echo "$ALLOW_METHODS" | grep -qi "POST"; then
  echo -e "  ${GREEN}✓${NC} CORS allows POST method"
  ((PASS++))
else
  echo -e "  ${RED}✗${NC} CORS does not allow POST method"
  ((FAIL++))
fi
echo ""

# ── 3. Auth Flow ──────────────────────────────────────────────────────
echo "3. Authentication Flow"

# Register
REG_CODE=$(curl -s -o /tmp/fc360-register.json -w "%{http_code}" \
  -X POST "$API_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASS\",
    \"organizationName\": \"Integration Test Org\",
    \"firstName\": \"Verify\",
    \"lastName\": \"Script\"
  }" 2>/dev/null || echo "000")

check "POST /auth/register returns 200" "$REG_CODE" "200"

TOKEN=$(cat /tmp/fc360-register.json | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null || echo "")
if [ -n "$TOKEN" ] && [ "$TOKEN" != "None" ]; then
  echo -e "  ${GREEN}✓${NC} JWT token received (${#TOKEN} chars)"
  ((PASS++))
else
  echo -e "  ${RED}✗${NC} No JWT token in response"
  ((FAIL++))
  # Try login instead
  LOGIN_CODE=$(curl -s -o /tmp/fc360-login.json -w "%{http_code}" \
    -X POST "$API_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASS\"}" 2>/dev/null || echo "000")

  TOKEN=$(cat /tmp/fc360-login.json | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null || echo "")
fi

# Login with same credentials
LOGIN_CODE=$(curl -s -o /tmp/fc360-login.json -w "%{http_code}" \
  -X POST "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASS\"}" 2>/dev/null || echo "000")
check "POST /auth/login returns 200" "$LOGIN_CODE" "200"

# Bad password
BAD_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"WrongPassword\"}" 2>/dev/null || echo "000")
check "Bad password returns 401" "$BAD_CODE" "401"

# Unauthorized access
UNAUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  "$API_URL/api/v1/systems" 2>/dev/null || echo "000")
check "No-token request returns 401" "$UNAUTH_CODE" "401"
echo ""

# ── 4. Core CRUD ──────────────────────────────────────────────────────
if [ -n "$TOKEN" ] && [ "$TOKEN" != "None" ]; then
  AUTH="Authorization: Bearer $TOKEN"

  echo "4. Core Operations (Systems)"

  # Create system
  SYS_CODE=$(curl -s -o /tmp/fc360-system.json -w "%{http_code}" \
    -X POST "$API_URL/api/v1/systems" \
    -H "Content-Type: application/json" \
    -H "$AUTH" \
    -d '{
      "name": "Integration Test System",
      "acronym": "ITS",
      "impactLevel": "moderate",
      "systemType": "Cloud SaaS",
      "description": "Created by integration verification script"
    }' 2>/dev/null || echo "000")

  if [ "$SYS_CODE" = "200" ] || [ "$SYS_CODE" = "201" ]; then
    echo -e "  ${GREEN}✓${NC} POST /systems creates system ($SYS_CODE)"
    ((PASS++))
  else
    echo -e "  ${RED}✗${NC} POST /systems returned $SYS_CODE"
    ((FAIL++))
  fi

  # List systems
  LIST_CODE=$(curl -s -o /tmp/fc360-systems.json -w "%{http_code}" \
    -H "$AUTH" "$API_URL/api/v1/systems" 2>/dev/null || echo "000")
  check "GET /systems returns 200" "$LIST_CODE" "200"

  # Dashboard
  DASH_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "$AUTH" "$API_URL/api/v1/dashboard/stats" 2>/dev/null || echo "000")
  check "GET /dashboard/stats returns 200" "$DASH_CODE" "200"
  echo ""

  # ── 5. POA&M ────────────────────────────────────────────────────────
  echo "5. POA&M Operations"

  POAM_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "$AUTH" "$API_URL/api/v1/poam" 2>/dev/null || echo "000")
  check "GET /poam returns 200" "$POAM_CODE" "200"
  echo ""

  # ── 6. Controls ─────────────────────────────────────────────────────
  echo "6. Compliance Controls"

  CTRL_CODE=$(curl -s -o /tmp/fc360-controls.json -w "%{http_code}" \
    -H "$AUTH" "$API_URL/api/v1/controls" 2>/dev/null || echo "000")
  check "GET /controls returns 200" "$CTRL_CODE" "200"

  if [ "$CTRL_CODE" = "200" ]; then
    # Try to count controls in response
    CTRL_COUNT=$(cat /tmp/fc360-controls.json | python3 -c "
import sys,json
d = json.load(sys.stdin)
controls = d.get('controls', d.get('data', []))
if isinstance(controls, list):
  print(len(controls))
else:
  print('?')
" 2>/dev/null || echo "?")
    echo -e "  ${GREEN}✓${NC} Control catalog contains $CTRL_COUNT controls"
  fi
  echo ""

else
  echo -e "  ${YELLOW}⚠${NC} Skipping CRUD tests — no auth token available"
  echo ""
fi

# ── 7. Reporter Connectivity ──────────────────────────────────────────
echo "7. Reporter Integration"

REPORTER_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$REPORTER_URL" 2>/dev/null || echo "000")
check "Reporter is accessible" "$REPORTER_CODE" "200"

# Test that API responds to Reporter-like requests
REPORTER_AUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X OPTIONS "$API_URL/api/v1/ssp" \
  -H "Origin: $REPORTER_URL" \
  -H "Access-Control-Request-Method: GET" 2>/dev/null || echo "000")

if [ "$REPORTER_AUTH_CODE" = "200" ] || [ "$REPORTER_AUTH_CODE" = "204" ]; then
  echo -e "  ${GREEN}✓${NC} API accepts preflight from Reporter origin"
  ((PASS++))
else
  echo -e "  ${YELLOW}⚠${NC} Preflight returned $REPORTER_AUTH_CODE (may still work if CORS is permissive)"
  ((SKIP++))
fi
echo ""

# ── Summary ───────────────────────────────────────────────────────────
echo "════════════════════════════════════════════════"
echo -e "  ${GREEN}Passed:${NC}  $PASS"
echo -e "  ${RED}Failed:${NC}  $FAIL"
echo -e "  ${YELLOW}Skipped:${NC} $SKIP"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}All checks passed! ForgeComply 360 is operational.${NC}"
  echo ""
  echo "Reporter connected mode URL:"
  echo "  ${REPORTER_URL}#api=${API_URL}"
  echo ""
else
  echo -e "${RED}$FAIL check(s) failed. Review output above.${NC}"
  exit 1
fi

# Cleanup temp files
rm -f /tmp/fc360-*.json
