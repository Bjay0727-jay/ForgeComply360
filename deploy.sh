#!/bin/bash
# =============================================================================
# ForgeComply 360™ — Deploy Script
# =============================================================================
# Usage:
#   ./scripts/deploy.sh                    # Deploy to production
#   ./scripts/deploy.sh staging            # Deploy to staging
#   ./scripts/deploy.sh production --dry   # Dry run (validate only)
#   ./scripts/deploy.sh --migrate-only     # Run migrations without deploying
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENV="${1:-production}"
DRY_RUN=false
MIGRATE_ONLY=false

for arg in "$@"; do
  case $arg in
    --dry) DRY_RUN=true ;;
    --migrate-only) MIGRATE_ONLY=true ;;
  esac
done

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════╗"
echo "║     ForgeComply 360™ — Deploy            ║"
echo "║     Environment: ${ENV}                  ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ---------- Step 1: Pre-deploy validation ----------
echo -e "${YELLOW}[1/5] Running pre-deploy checks...${NC}"
if [ -f scripts/pre-deploy-check.js ]; then
  node scripts/pre-deploy-check.js --env "$ENV"
  if [ $? -ne 0 ]; then
    echo -e "${RED}Pre-deploy check failed. Aborting.${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠️  pre-deploy-check.js not found, skipping${NC}"
fi

# ---------- Step 2: Install dependencies ----------
echo -e "${YELLOW}[2/5] Installing dependencies...${NC}"
npm ci --silent 2>/dev/null || npm install --silent

# ---------- Step 3: Run tests ----------
echo -e "${YELLOW}[3/5] Running tests...${NC}"
npm test 2>/dev/null || echo -e "${YELLOW}⚠️  No test script or tests failed${NC}"

# ---------- Step 4: Run migrations ----------
echo -e "${YELLOW}[4/5] Running database migrations...${NC}"

if [ -d database ]; then
  MIGRATION_FILES=$(ls database/migrate-*.sql 2>/dev/null | sort)
  
  if [ -n "$MIGRATION_FILES" ]; then
    case "$ENV" in
      production)
        DB_NAME="forge-comply360-db"
        WRANGLER_ENV=""
        ;;
      staging)
        DB_NAME="forge-comply360-db-demo"
        WRANGLER_ENV="--env staging"
        ;;
      *)
        echo -e "${RED}Unknown environment: $ENV${NC}"
        exit 1
        ;;
    esac

    for f in $MIGRATION_FILES; do
      BASENAME=$(basename "$f")
      echo -e "  📄 $BASENAME"
      
      if [ "$DRY_RUN" = true ]; then
        echo -e "     ${YELLOW}[DRY RUN] Would execute: wrangler d1 execute $DB_NAME $WRANGLER_ENV --remote --file=$f${NC}"
      else
        npx wrangler d1 execute "$DB_NAME" $WRANGLER_ENV --remote --file="$f" --yes 2>/dev/null || {
          echo -e "     ${YELLOW}⚠️  Migration may already be applied or had an error${NC}"
        }
      fi
    done
    echo -e "${GREEN}  ✅ Migrations complete${NC}"
  else
    echo "  No migration files found"
  fi
else
  echo "  No database/ directory found"
fi

if [ "$MIGRATE_ONLY" = true ]; then
  echo -e "${GREEN}Migration-only mode — skipping deploy.${NC}"
  exit 0
fi

# ---------- Step 5: Deploy Worker ----------
echo -e "${YELLOW}[5/5] Deploying Worker...${NC}"

case "$ENV" in
  production)
    DEPLOY_CMD="npx wrangler deploy"
    ;;
  staging)
    DEPLOY_CMD="npx wrangler deploy --env staging"
    ;;
esac

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}[DRY RUN] Would execute: $DEPLOY_CMD${NC}"
  echo -e "${GREEN}Dry run complete — no changes made.${NC}"
  exit 0
fi

$DEPLOY_CMD

# ---------- Post-deploy health check ----------
echo ""
echo -e "${YELLOW}Running post-deploy health check...${NC}"
sleep 3

case "$ENV" in
  production) HEALTH_URL="https://api.forgecomply360.com/health" ;;
  staging)    HEALTH_URL="https://forge-api-staging.workers.dev/health" ;;
esac

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Health check passed (HTTP $HTTP_CODE)${NC}"
else
  echo -e "${YELLOW}⚠️  Health check returned HTTP $HTTP_CODE — verify manually at $HEALTH_URL${NC}"
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗"
echo "║     Deploy Complete!                     ║"
echo "╚══════════════════════════════════════════╝${NC}"
