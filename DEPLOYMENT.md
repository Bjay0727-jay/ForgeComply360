# ForgeComply 360 - Deployment Guide

## Live URLs

| Service | URL |
|---------|-----|
| **Frontend (Pages)** | https://forgecomply360.pages.dev |
| **API (Workers)** | https://forge-comply360-api.stanley-riley.workers.dev |
| **Health Check** | https://forge-comply360-api.stanley-riley.workers.dev/health |

---

## Architecture Overview

```
Browser  -->  Cloudflare Pages (React SPA)
                    |
                    v
         Cloudflare Workers (REST API)
                    |
         +----------+----------+
         |          |          |
       D1 DB      KV       R2 Bucket
    (SQLite)   (Cache)   (Evidence Vault)
```

---

## Cloudflare Resources

| Resource | Type | ID/Name |
|----------|------|---------|
| D1 Database | `forge-comply360-db` | `73faffec-f001-44bc-880e-62bd932c25b1` |
| KV Namespace | `forge-comply360-kv` | `a3323bb1cfa14271a286170864082869` |
| R2 Bucket | `forge-evidence` | (existing bucket) |
| Worker | `forge-comply360-api` | Production environment |
| Pages Project | `forgecomply360` | Production branch: `main` |

---

## First-Time Setup (Already Completed)

These steps have already been run. Included for reference if recreating from scratch.

### 1. Create Cloudflare Resources

```bash
# D1 Database
npx wrangler d1 create forge-comply360-db

# KV Namespace
npx wrangler kv:namespace create forge-comply360-kv

# R2 Bucket
npx wrangler r2 bucket create forge-evidence

# Pages Project
npx wrangler pages project create forgecomply360 --production-branch main
```

### 2. Update wrangler.toml

Replace the database_id and KV id values in `wrangler.toml` with the IDs returned from step 1.

### 3. Run Database Migrations

```bash
# Schema (creates all tables)
npx wrangler d1 execute forge-comply360-db --remote --file=database/schema.sql

# Seed data (frameworks, controls, crosswalks, experience configs)
npx wrangler d1 execute forge-comply360-db --remote --file=database/seed.sql
```

### 4. Set Worker Secrets

```bash
# Generate and set JWT signing secret
echo "$(openssl rand -hex 32)" | npx wrangler secret put JWT_SECRET --env production
```

### 5. Deploy API

```bash
npx wrangler deploy --env production
```

### 6. Build and Deploy Frontend

```bash
# Build with production API URL
cd frontend
VITE_API_URL=https://forge-comply360-api.stanley-riley.workers.dev npm run build

# Deploy to Cloudflare Pages
cd ..
npx wrangler pages deploy frontend/dist --project-name=forgecomply360 --branch=main
```

---

## Ongoing Deployment

### Deploy API Changes

```bash
npx wrangler deploy --env production
```

### Deploy Frontend Changes

```bash
cd frontend
VITE_API_URL=https://forge-comply360-api.stanley-riley.workers.dev npm run build
cd ..
npx wrangler pages deploy frontend/dist --project-name=forgecomply360 --branch=main
```

### Run Database Migrations

```bash
# Apply new schema changes
npx wrangler d1 execute forge-comply360-db --remote --file=database/schema.sql

# Apply new seed data
npx wrangler d1 execute forge-comply360-db --remote --file=database/seed.sql
```

---

## GitHub Actions CI/CD

The `.github/workflows/deploy.yml` file automates deployment on push to `main` (production) or `staging`.

### Required GitHub Secrets

| Secret | Description | How to get it |
|--------|-------------|---------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers/Pages/D1/R2/KV permissions | Cloudflare Dashboard > My Profile > API Tokens > Create Token |

### Token Permissions Required

When creating the Cloudflare API token, grant these permissions:

- **Account > Workers Scripts** - Edit
- **Account > Workers KV Storage** - Edit
- **Account > Workers R2 Storage** - Edit
- **Account > D1** - Edit
- **Account > Cloudflare Pages** - Edit
- **Zone > Workers Routes** - Edit (if using custom domains)

### Setting up GitHub

1. Go to your GitHub repository
2. Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Name: `CLOUDFLARE_API_TOKEN`, Value: your Cloudflare API token
5. Push to `main` branch to trigger deployment

---

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+
- Wrangler CLI (`npm install -g wrangler`)

### Setup

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Set up local D1 database
npm run db:migrate:local
npm run db:seed:local

# Start API (Workers dev server on port 8787)
npm run dev

# In another terminal, start frontend (Vite dev server on port 5173)
npm run dev:frontend
```

The frontend dev server proxies `/api` requests to the Workers dev server at `localhost:8787`.

---

## Custom Domain Setup

To use a custom domain (e.g., `app.forgecomply360.com` and `api.forgecomply360.com`):

### API (Workers)

1. Go to Cloudflare Dashboard > Workers & Pages > forge-comply360-api
2. Settings > Triggers > Custom Domains
3. Add `api.forgecomply360.com`
4. Update `wrangler.toml` production routes:
   ```toml
   [env.production]
   routes = [{ pattern = "api.forgecomply360.com", custom_domain = true }]
   ```

### Frontend (Pages)

1. Go to Cloudflare Dashboard > Workers & Pages > forgecomply360
2. Custom domains > Set up a custom domain
3. Add `app.forgecomply360.com`

### Update CORS

After setting custom domains, update the CORS origin in `wrangler.toml`:

```toml
[env.production.vars]
CORS_ORIGIN = "https://app.forgecomply360.com"
```

Then rebuild and deploy the frontend with the new API URL:

```bash
cd frontend
VITE_API_URL=https://api.forgecomply360.com npm run build
cd ..
npx wrangler pages deploy frontend/dist --project-name=forgecomply360 --branch=main
```

---

## Database Schema

The D1 database contains 20 tables:

| Table | Purpose |
|-------|---------|
| `organizations` | Multi-tenant orgs with subscription tier |
| `users` | User accounts with RBAC roles |
| `refresh_tokens` | JWT refresh token rotation |
| `experience_configs` | Federal/Enterprise/Healthcare UX configs |
| `compliance_frameworks` | 28 frameworks (NIST, FedRAMP, HIPAA, SOC 2, etc.) |
| `security_controls` | 61+ controls across frameworks |
| `control_crosswalks` | 23 cross-framework control mappings |
| `organization_frameworks` | Per-org enabled frameworks (license-gated) |
| `systems` | Information systems under assessment |
| `control_implementations` | Per-system control implementation status |
| `evidence` | Evidence vault metadata (files in R2) |
| `evidence_control_links` | Links evidence to control implementations |
| `poams` | Plan of Action & Milestones |
| `ssp_documents` | Generated SSP/OSCAL documents |
| `monitoring_checks` | ControlPulse CCM continuous monitoring |
| `risks` | RiskForge ERM risk register |
| `vendors` | VendorGuard TPRM vendor management |
| `audit_logs` | Complete audit trail |
| `addon_modules` | Available add-on modules |
| `organization_addons` | Per-org enabled add-ons |

---

## API Endpoints Reference

### Authentication (Public)
- `POST /api/v1/auth/register` - Create account + org
- `POST /api/v1/auth/login` - Sign in (returns JWT)
- `POST /api/v1/auth/refresh` - Refresh access token

### Authenticated (Bearer token required)
- `GET /api/v1/auth/me` - Current user + org
- `GET /api/v1/experience` - Experience layer config
- `PUT /api/v1/experience` - Change experience type
- `GET /api/v1/frameworks` - All available frameworks
- `GET /api/v1/frameworks/enabled` - Org's enabled frameworks
- `POST /api/v1/frameworks/enable` - Enable a framework
- `GET /api/v1/crosswalks` - Cross-framework control mappings
- `GET /api/v1/controls` - Browse controls (paginated)
- `GET/POST /api/v1/systems` - List/create systems
- `GET/POST /api/v1/implementations` - Control implementations
- `POST /api/v1/implementations/bulk` - Initialize all controls for a system
- `GET /api/v1/implementations/stats` - Compliance statistics
- `GET/POST /api/v1/poams` - POA&M management
- `GET/POST /api/v1/evidence` - Evidence vault
- `POST /api/v1/ssp/generate` - Generate OSCAL SSP
- `GET/POST /api/v1/risks` - Risk register
- `GET/POST /api/v1/vendors` - Vendor management
- `GET /api/v1/dashboard/stats` - Dashboard metrics
- `GET /api/v1/audit-log` - Audit trail

---

## Troubleshooting

### "Internal server error" on API calls
- Check Worker logs: `npx wrangler tail --env production`
- Verify D1 database has been migrated and seeded
- Verify JWT_SECRET is set: `npx wrangler secret list --env production`

### Frontend shows blank page
- Check browser console for errors
- Verify `VITE_API_URL` was set during build
- Check CORS_ORIGIN in wrangler.toml matches the Pages URL

### CORS errors in browser
- Update `CORS_ORIGIN` in `wrangler.toml` to match your frontend URL
- Redeploy the Worker: `npx wrangler deploy --env production`

### Database migration errors
- D1 uses SQLite syntax, not PostgreSQL
- `CREATE TABLE IF NOT EXISTS` and `INSERT OR REPLACE` prevent duplicate errors
- Migrations are idempotent and safe to re-run
