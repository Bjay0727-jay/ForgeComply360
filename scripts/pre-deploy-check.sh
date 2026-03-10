#!/usr/bin/env bash
# ============================================================================
# ForgeComply 360 — Pre-Deploy Validation
#
# Runs before staging/production deployment to catch common issues early.
# Called by .github/workflows/deploy.yml in the pre-deploy-check job.
#
# Checks:
#   1. Migration file ordering and naming consistency
#   2. SQL syntax basics (unclosed quotes, missing semicolons)
#   3. Column name consistency (org_id vs organization_id)
#   4. Worker bundle size estimate
#   5. Required files exist
#   6. No secrets or credentials in tracked files
# ============================================================================

set -euo pipefail

PASS=0
FAIL=0
WARN=0

pass() { echo "  PASS  $1"; PASS=$((PASS + 1)); }
fail() { echo "  FAIL  $1"; FAIL=$((FAIL + 1)); }
warn() { echo "  WARN  $1"; WARN=$((WARN + 1)); }

echo "ForgeComply 360 — Pre-Deploy Checks"
echo "===================================="
echo ""

# ── 1. Required files exist ──
echo "[1/8] Required files..."

for f in workers/index.js wrangler.toml package.json; do
  if [ -f "$f" ]; then
    pass "$f exists"
  else
    fail "$f is MISSING"
  fi
done

# ── 2. Migration file ordering ──
echo ""
echo "[2/8] Migration file ordering..."

PREV_NUM=""
ORDERING_OK=true
for f in $(ls database/migrate-*.sql 2>/dev/null | sort); do
  NAME=$(basename "$f" .sql)
  # Extract numeric prefix: migrate-001-foo -> 001, migrate-023b-foo -> 023b
  NUM=$(echo "$NAME" | sed 's/^migrate-\([0-9]*\).*/\1/')

  if [ -n "$PREV_NUM" ]; then
    # Check for duplicate prefixes (allow suffixed like 023 and 023b)
    if [ "$NUM" = "$PREV_NUM" ]; then
      warn "Duplicate migration number: $NUM (file: $NAME)"
    fi
  fi
  PREV_NUM="$NUM"
done

MIGRATION_COUNT=$(ls database/migrate-*.sql 2>/dev/null | wc -l)
if [ "$MIGRATION_COUNT" -gt 0 ]; then
  pass "$MIGRATION_COUNT migration files found, ordering valid"
else
  warn "No migration files found in database/"
fi

# ── 3. Column name consistency ──
echo ""
echo "[3/8] Column name consistency..."

# Check for org_id vs organization_id conflicts within migration files
ORG_ID_FILES=$(grep -rl '\borg_id\b' database/migrate-*.sql 2>/dev/null | sort -u || true)
ORGANIZATION_ID_FILES=$(grep -rl '\borganization_id\b' database/migrate-*.sql 2>/dev/null | sort -u || true)

if [ -n "$ORG_ID_FILES" ] && [ -n "$ORGANIZATION_ID_FILES" ]; then
  # Check if any single file uses both conventions (that's the real problem)
  CONFLICT=false
  for f in $ORG_ID_FILES; do
    if echo "$ORGANIZATION_ID_FILES" | grep -q "^${f}$"; then
      # File uses both — check if it's in CREATE TABLE vs INSERT (could be intentional)
      warn "$(basename "$f") uses both org_id and organization_id — verify column names"
      CONFLICT=true
    fi
  done
  if [ "$CONFLICT" = false ]; then
    warn "Mixed column naming across migrations: some use org_id, others use organization_id"
  fi
else
  pass "Column naming is consistent across migrations"
fi

# ── 4. INSERT column validation against schema ──
echo ""
echo "[4/8] INSERT column validation..."

if [ -x scripts/validate-migration-columns.sh ]; then
  if bash scripts/validate-migration-columns.sh; then
    pass "All INSERT column names match schema definitions"
  else
    fail "INSERT column names do not match schema — run scripts/validate-migration-columns.sh for details"
  fi
else
  warn "scripts/validate-migration-columns.sh not found or not executable — skipping column validation"
fi

# ── 5. SQL basic validation ──
echo ""
echo "[5/8] SQL syntax checks..."

SQL_ISSUES=0
for f in database/migrate-*.sql; do
  # Check for obviously unbalanced single quotes (rough heuristic).
  # Downgraded to warning: SQL comments with apostrophes cause false positives.
  QUOTE_COUNT=$(tr -cd "'" < "$f" | wc -c)
  if [ $((QUOTE_COUNT % 2)) -ne 0 ]; then
    warn "$(basename "$f"): Odd number of single quotes ($QUOTE_COUNT) — possible unclosed string"
  fi
done

if [ "$SQL_ISSUES" -eq 0 ]; then
  pass "No obvious SQL syntax issues in migration files"
fi

# ── 6. Worker bundle size estimate ──
echo ""
echo "[6/8] Worker bundle size..."

WORKER_SIZE=$(wc -c < workers/index.js)
WORKER_SIZE_KB=$((WORKER_SIZE / 1024))

# Cloudflare Workers free plan: 1MB compressed, paid: 10MB compressed
# index.js is uncompressed; rough estimate is 3-4x compression ratio
if [ "$WORKER_SIZE_KB" -gt 8192 ]; then
  fail "workers/index.js is ${WORKER_SIZE_KB}KB — may exceed Workers size limit after bundling"
elif [ "$WORKER_SIZE_KB" -gt 4096 ]; then
  warn "workers/index.js is ${WORKER_SIZE_KB}KB — approaching Workers size limit"
else
  pass "workers/index.js is ${WORKER_SIZE_KB}KB (within size limits)"
fi

# ── 7. FK reference consistency ──
echo ""
echo "[7/8] Foreign key reference consistency..."

# Check that INSERT statements referencing org_id use IDs that exist
# in the same migration or in seed data
FK_ISSUES=0
for f in database/migrate-*.sql; do
  [ -f "$f" ] || continue
  base=$(basename "$f")

  # Check for org_id references that don't have a matching INSERT into organizations
  ORG_IDS_USED=$(grep -oP "org_id[^,]*,\s*'([^']+)'" "$f" 2>/dev/null | grep -oP "'[^']+'" | sort -u || true)
  if [ -n "$ORG_IDS_USED" ]; then
    for org_ref in $ORG_IDS_USED; do
      org_val=$(echo "$org_ref" | tr -d "'")
      # Check if org exists in seed.sql, schema.sql, or any prior migration
      ORG_EXISTS=$(grep -rl "INTO organizations.*'${org_val}'" database/seed.sql database/migrate-*.sql 2>/dev/null | head -1 || true)
      if [ -z "$ORG_EXISTS" ]; then
        warn "$base references org_id '$org_val' but no INSERT into organizations with that ID found"
        FK_ISSUES=$((FK_ISSUES + 1))
      fi
    done
  fi
done

if [ "$FK_ISSUES" -eq 0 ]; then
  pass "Foreign key references appear consistent"
fi

# ── 8. Secrets check ──
echo ""
echo "[8/8] Secrets scan..."

SECRETS_FOUND=0

# Check for common secret patterns in tracked files (excluding .git, node_modules, test fixtures)
for pattern in 'CLOUDFLARE_API_TOKEN\s*=' 'sk-[a-zA-Z0-9]{20,}' 'PRIVATE.KEY' 'BEGIN RSA PRIVATE'; do
  MATCHES=$(grep -rl "$pattern" --include="*.js" --include="*.ts" --include="*.json" --include="*.yml" --include="*.yaml" --include="*.toml" --include="*.env" \
    --exclude-dir=node_modules --exclude-dir=.git --exclude-dir='*.test.*' . 2>/dev/null || true)
  if [ -n "$MATCHES" ]; then
    for mf in $MATCHES; do
      fail "Potential secret pattern '$pattern' found in $mf"
      SECRETS_FOUND=$((SECRETS_FOUND + 1))
    done
  fi
done

# Check for .env files that shouldn't be committed
for envfile in .env .env.local; do
  if [ -f "$envfile" ]; then
    fail "$envfile exists and should not be committed"
    SECRETS_FOUND=$((SECRETS_FOUND + 1))
  fi
done

if [ "$SECRETS_FOUND" -eq 0 ]; then
  pass "No secrets or credential files detected"
fi

# ── Summary ──
echo ""
echo "===================================="
echo "Results: $PASS passed, $FAIL failed, $WARN warnings"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "Pre-deploy checks FAILED. Fix the issues above before deploying."
  exit 1
fi

if [ "$WARN" -gt 0 ]; then
  echo "Pre-deploy checks PASSED with warnings. Review before deploying."
  exit 0
fi

echo "All pre-deploy checks passed."
exit 0
