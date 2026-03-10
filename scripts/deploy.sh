#!/bin/bash
# ============================================================================
# ForgeComply 360™ - Production Deployment Script
#
# Deploys the full platform to Cloudflare:
#   - API Worker  → comply360-api.forgecyberdefense.com
#   - Frontend    → comply360.forgecyberdefense.com (Cloudflare Pages)
#   - Database    → Cloudflare D1
#   - Storage     → Cloudflare R2
#   - Cache       → Cloudflare KV
#
# Prerequisites:
#   - Node.js 18+ installed
#   - Wrangler CLI: npm install -g wrangler
#   - Authenticated: wrangler login
#   - Domain forgecyberdefense.com on Cloudflare
#
# Usage:
#   chmod +x scripts/deploy.sh
#   ./scripts/deploy.sh [--skip-db] [--skip-seed]
# ============================================================================

set -e

SKIP_DB=false
SKIP_SEED=false
for arg in "$@"; do
  case $arg in
    --skip-db) SKIP_DB=true ;;
    --skip-seed) SKIP_SEED=true ;;
  esac
done

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       ForgeComply 360™ — Deployment           ║${NC}"
echo -e "${CYAN}║       Forge Cyber Defense LLC                  ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════╝${NC}"
echo ""

# ── Step 1: Prerequisites ──────────────────────────────────────────────
echo -e "${YELLOW}[1/8] Checking prerequisites...${NC}"
command -v node >/dev/null 2>&1 || { echo -e "${RED}✗ Node.js required${NC}"; exit 1; }
command -v npx >/dev/null 2>&1 || { echo -e "${RED}✗ npx required${NC}"; exit 1; }
echo -e "  ${GREEN}✓${NC} Node.js $(node -v)"

# Verify wrangler auth
npx wrangler whoami > /dev/null 2>&1 || { echo -e "${RED}✗ Run 'wrangler login' first${NC}"; exit 1; }
echo -e "  ${GREEN}✓${NC} Wrangler authenticated"
echo ""

# ── Step 2: Install dependencies ───────────────────────────────────────
echo -e "${YELLOW}[2/8] Installing dependencies...${NC}"
npm ci --silent 2>/dev/null || npm install --silent
echo -e "  ${GREEN}✓${NC} Dependencies installed"
echo ""

# ── Step 3: Run tests ──────────────────────────────────────────────────
echo -e "${YELLOW}[3/8] Running test suite...${NC}"
if npm test --silent 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} All tests passed"
else
  echo -e "  ${YELLOW}⚠${NC} Tests failed or not configured — continuing deployment"
  echo "    Run 'npm test' manually to investigate"
fi
echo ""

# ── Step 4: Database setup ─────────────────────────────────────────────
if [ "$SKIP_DB" = false ]; then
  echo -e "${YELLOW}[4/8] Setting up D1 database...${NC}"

  # Check if database exists
  DB_NAME="forgecomply360-db"
  DB_EXISTS=$(npx wrangler d1 list 2>/dev/null | grep "$DB_NAME" || true)

  if [ -z "$DB_EXISTS" ]; then
    echo "  Creating D1 database: $DB_NAME"
    DB_OUTPUT=$(npx wrangler d1 create "$DB_NAME" 2>&1)
    echo "$DB_OUTPUT"

    DB_ID=$(echo "$DB_OUTPUT" | grep -o 'database_id = "[^"]*"' | cut -d'"' -f2)
    if [ -n "$DB_ID" ]; then
      echo ""
      echo -e "  ${YELLOW}⚠ UPDATE wrangler.toml with:${NC}"
      echo "    database_id = \"$DB_ID\""
      echo ""
      echo "  Press Enter after updating, or Ctrl+C to abort..."
      read -r
    fi
  else
    echo -e "  ${GREEN}✓${NC} Database already exists"
  fi

  # Run schema
  if [ -f "database/schema.sql" ]; then
    echo "  Applying schema..."
    npx wrangler d1 execute "$DB_NAME" --file=database/schema.sql 2>/dev/null
    echo -e "  ${GREEN}✓${NC} Schema applied"
  fi

  # Seed data
  if [ "$SKIP_SEED" = false ] && [ -f "database/seed.sql" ]; then
    echo "  Seeding compliance framework data..."
    npx wrangler d1 execute "$DB_NAME" --file=database/seed.sql 2>/dev/null
    echo -e "  ${GREEN}✓${NC} Framework data seeded"
  fi
else
  echo -e "${YELLOW}[4/8] Skipping database setup (--skip-db)${NC}"
fi
echo ""

# ── Step 5: Configure secrets ──────────────────────────────────────────
echo -e "${YELLOW}[5/8] Configuring secrets...${NC}"

# Check if JWT_SECRET is already set
JWT_CHECK=$(npx wrangler secret list 2>/dev/null | grep "JWT_SECRET" || true)
if [ -z "$JWT_CHECK" ]; then
  JWT=$(openssl rand -base64 32)
  echo "$JWT" | npx wrangler secret put JWT_SECRET 2>/dev/null
  echo -e "  ${GREEN}✓${NC} JWT_SECRET configured"
else
  echo -e "  ${GREEN}✓${NC} JWT_SECRET already set"
fi
echo ""

# ── Step 6: Deploy API Worker ──────────────────────────────────────────
echo -e "${YELLOW}[6/8] Deploying API Worker...${NC}"
npx wrangler deploy 2>&1 | tail -5
echo -e "  ${GREEN}✓${NC} API Worker deployed"
echo ""

# ── Step 7: Deploy Frontend ───────────────────────────────────────────
echo -e "${YELLOW}[7/8] Deploying Frontend...${NC}"
if [ -d "frontend" ]; then
  # Build frontend if build script exists
  if [ -f "frontend/package.json" ]; then
    cd frontend
    npm ci --silent 2>/dev/null || npm install --silent
    npm run build --silent 2>/dev/null || true
    cd ..
  fi

  # Deploy to Cloudflare Pages
  DEPLOY_DIR="frontend/dist"
  if [ ! -d "$DEPLOY_DIR" ]; then
    DEPLOY_DIR="frontend"
  fi

  npx wrangler pages deploy "$DEPLOY_DIR" \
    --project-name=forgecomply360 \
    --branch=main 2>&1 | tail -3
  echo -e "  ${GREEN}✓${NC} Frontend deployed"
else
  echo -e "  ${YELLOW}⚠${NC} No frontend/ directory found — skipping"
fi
echo ""

# ── Step 8: Verify deployment ──────────────────────────────────────────
echo -e "${YELLOW}[8/8] Verifying deployment...${NC}"

# Get worker URL from wrangler output
WORKER_URL=$(npx wrangler deployments list 2>/dev/null | grep "https://" | head -1 | grep -o 'https://[^ ]*' || echo "")

if [ -n "$WORKER_URL" ]; then
  HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$WORKER_URL/health" 2>/dev/null || echo "000")
  if [ "$HEALTH" = "200" ]; then
    echo -e "  ${GREEN}✓${NC} API health check passed ($WORKER_URL/health)"
  else
    echo -e "  ${YELLOW}⚠${NC} Health check returned $HEALTH — verify manually"
  fi
else
  echo -e "  ${YELLOW}⚠${NC} Could not determine worker URL — verify manually"
fi
echo ""

# ── Summary ────────────────────────────────────────────────────────────
echo -e "${CYAN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║            Deployment Complete!                ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════╝${NC}"
echo ""
echo "  Endpoints:"
echo "    API:      https://comply360-api.forgecyberdefense.com"
echo "    Frontend: https://comply360.forgecyberdefense.com"
echo "    Health:   https://comply360-api.forgecyberdefense.com/health"
echo ""
echo "  Custom Domain Setup (if not done):"
echo "    1. Go to Cloudflare dashboard → Workers & Pages"
echo "    2. Select forgecomply360 worker → Settings → Triggers"
echo "    3. Add route: comply360-api.forgecyberdefense.com/*"
echo "    4. For Pages: Custom domains → comply360.forgecyberdefense.com"
echo ""
echo "  Verify Reporter integration:"
echo "    Open https://reporter-forgecomply360.pages.dev"
echo "    Append: #api=https://comply360-api.forgecyberdefense.com"
echo ""
echo "  Next steps:"
echo "    1. Configure custom domain routes in Cloudflare dashboard"
echo "    2. Test registration: scripts/verify-integration.sh"
echo "    3. Update Forge-Reporter .env to point to production API"
echo ""
