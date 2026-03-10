# ForgeComply 360™ — Fix Files

Drop-in files to address findings from the platform review.
All files are ready to commit.

## Quick Start (15 minutes)

### Step 1: Critical Fixes (5 min)

```bash
cd /path/to/ForgeComply360

# Make repo private (do this on GitHub if not already done)

# Add LICENSE
cp /path/to/fixes/LICENSE ./LICENSE

# Add README
cp /path/to/fixes/README.md ./README.md

# Add production env
cp /path/to/fixes/.env.production ./.env.production

# Move compliance review doc to /docs
mv COMPLIANCE-REVIEW-HIPAA-TAC202.md docs/

# Commit
git add -A
git commit -m "chore: add LICENSE, README, env config, organize docs"
git push
```

### Step 2: Deploy Scripts (5 min)

```bash
# Copy deploy and verification scripts
cp /path/to/fixes/scripts/deploy.sh ./scripts/deploy.sh
cp /path/to/fixes/scripts/verify-integration.sh ./scripts/verify-integration.sh
chmod +x scripts/deploy.sh scripts/verify-integration.sh

git add scripts/
git commit -m "feat: add deploy and integration verification scripts"
git push
```

### Step 3: Test Infrastructure (5 min)

```bash
# Copy test files
cp /path/to/fixes/workers/__tests__/api.test.ts ./workers/__tests__/api.test.ts

# Install test dependencies (vitest.config.ts already exists in repo)
npm install -D @vitest/coverage-v8

# Verify tests run
npm test

git add workers/__tests__/
git commit -m "test: add API worker unit test suite"
git push
```

### Step 4: Deploy to comply360.forgecyberdefense.com

```bash
# Run the deploy script
./scripts/deploy.sh

# After deployment, verify everything works
./scripts/verify-integration.sh https://comply360-api.forgecyberdefense.com
```

### Step 5: API URL Cleanup

Search and replace across ALL Forge repos:

```bash
# In ForgeComply360
grep -r "stanley-riley" --include="*.{js,ts,tsx,html,json,toml}" .

# In Forge-Reporter
grep -r "stanley-riley" --include="*.{js,ts,tsx,html,json,env}" /path/to/Forge-Reporter/

# Replace all occurrences:
#   stanley-riley.workers.dev → forgecyberdefense.com
```

## File Inventory

| File | Purpose | Drop Into |
|------|---------|-----------|
| `LICENSE` | Proprietary license protecting IP | Repo root |
| `README.md` | Professional flagship product README | Repo root |
| `.env.production` | Production URLs (forgecyberdefense.com) | Repo root |
| `scripts/deploy.sh` | Automated Cloudflare deployment | `scripts/` |
| `scripts/verify-integration.sh` | Tests API + Reporter integration | `scripts/` |
| `workers/__tests__/api.test.ts` | Worker unit tests (Vitest) | `workers/__tests__/` |

## Custom Domain Setup

After running `deploy.sh`, configure custom domains in Cloudflare:

### API Worker Route
1. Cloudflare Dashboard → Workers & Pages → forgecomply360 worker
2. Settings → Triggers → Add Route
3. Route: `comply360-api.forgecyberdefense.com/*`
4. Zone: forgecyberdefense.com

### Frontend (Pages)
1. Cloudflare Dashboard → Workers & Pages → forgecomply360 pages project
2. Custom domains → Add
3. Domain: `comply360.forgecyberdefense.com`

### DNS Records (if not auto-created)
| Type  | Name              | Target                    |
|-------|-------------------|---------------------------|
| CNAME | comply360         | forgecomply360.pages.dev  |
| CNAME | comply360-api     | (worker route handles this)|

## Reporter Integration

Once the API is live at comply360-api.forgecyberdefense.com, update Forge-Reporter:

1. Update `.env.production` in Forge-Reporter:
   ```
   VITE_API_URL=https://comply360-api.forgecyberdefense.com
   ```

2. Redeploy Reporter to Cloudflare Pages

3. Test connected mode:
   ```
   https://reporter-forgecomply360.pages.dev#api=https://comply360-api.forgecyberdefense.com
   ```
