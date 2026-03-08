# ForgeComply 360 — Deployment & Database Reference

Production database: `forge-comply360-db` (`73faffec-f001-44bc-880e-62bd932c25b1`)
Demo database: `forge-comply360-db-demo` (`094aa4dd-5c79-456e-a2cb-d43f08f677e5`)

> The `fe250bed` database (`forge-production`) is STALE. It was the original development DB with 28 tables. The active production database is `73faffec` with 84 tables and full schema.

## Finding -> Fix Mapping

| Finding | Severity | File | What It Does |
|---------|----------|------|-------------|
| **DB ID Mismatch** | CRITICAL | `wrangler.toml` | Points to correct DB `73faffec` (not stale `fe250bed`) |
| **H-2** Test Coverage | HIGH | `.github/workflows/deploy.yml` | Adds test job with coverage threshold |
| **H-3** Open Registration | HIGH | `patches/worker-patches.js` | Invite code gate (`REGISTRATION_INVITE_CODE` env var) |
| **H-4** No npm audit | HIGH | `.github/workflows/deploy.yml` | `npm audit --audit-level=high` in CI |
| **H-5** CORS Defaults | HIGH | `wrangler.toml` + `patches/worker-patches.js` | Custom domain CORS + pattern matching |
| **M-1** OSCAL Validation | MEDIUM | `workers/oscal-validator.js` | Schema validation on SSP export |
| **M-2** Scheduled Tasks | MEDIUM | `patches/worker-patches.js` | `Promise.allSettled()` error isolation |
| **M-3** CSP Inline Styles | MEDIUM | `patches/worker-patches.js` | Relaxed style-src for chart libraries |

## Deployment Pipeline

Deployments are triggered by pushes to `main` via `.github/workflows/deploy.yml`.

**Pipeline order:**
1. **test** — Run API + frontend tests, generate SBOM
2. **pre-deploy-check** — Validate migrations, column consistency, secrets scan (`scripts/pre-deploy-check.sh`)
3. **deploy-staging** — Deploy Worker + frontend to demo env, smoke test `/health`
4. **migrate-db** — Run pending database migrations against production D1 (migrations run *before* Worker deploy)
5. **deploy-api** — Deploy Worker to production, verify `/health`
6. **deploy-frontend** — Build and deploy frontend to Cloudflare Pages

Migrations run before the Worker deploy because schema additions (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ADD COLUMN`) are backward-compatible with the currently-running Worker, while new Worker code that depends on new columns is not backward-compatible with the old schema.

### Deploy via CI (recommended)

```bash
git add .
git commit -m "fix: apply deployment config fixes from readiness review"
git push origin main  # triggers production deploy
```

### Deploy Manually

```bash
# Validate first
bash scripts/pre-deploy-check.sh

# Deploy Worker to production
npx wrangler deploy --env production

# Or use the deploy script
./deploy.sh production

# Dry run
./deploy.sh production --dry

# Migrations only
./deploy.sh production --migrate-only

# Run a specific migration
npx wrangler d1 execute forge-comply360-db --env production --remote --file=database/migrate-041-operational-data.sql
```

## Files

```
wrangler.toml                        # Cloudflare Worker configuration (all envs)
.github/workflows/deploy.yml         # CI/CD pipeline
scripts/pre-deploy-check.sh          # Pre-deploy validation (runs in CI + locally)
deploy.sh                            # Manual deploy helper script
pre-deploy-check.js                  # Node.js pre-deploy validation
worker-patches.js                    # Security patches to apply to workers/index.js
workers/oscal-validator.js            # OSCAL SSP compliance validator
```

## Migration Files

All migrations are in `database/`. Run in order. Each is idempotent (`IF NOT EXISTS` / `INSERT OR IGNORE`).

**42 migration files** (`migrate-001` through `migrate-041`, plus `migrate-023b`)

| Range | Description |
|-------|-------------|
| `001-013` | POA&M enhancements, audit logs, risk management, evidence, compliance scoring, tracking |
| `014-019` | Asset enhancements, ServiceNow CMDB, POA&M vulnerability linking, extended fields |
| `020-023b` | FISMA SSP tables, password reset, OSCAL/vendor column repair, missing tables, user status |
| `024` | PHS sample data seed |
| `025-033` | Framework expansions: CNSA 2.0, FFIEC, NYDFS, GLBA, CSA CCM, NERC CIP, ISO 27701, EU AI Act, NIST AI RMF |
| `034` | ForgeScan integration |
| `035-039` | Full control catalogs: NIST 800-53, FedRAMP, NIST 800-171, CMMC, HIPAA/SOC2/StateRAMP |
| `040` | Control implementations |
| `041` | PHS operational data (75 assets, 150 findings, 40 POA&Ms, 50 vuln defs) |

### Seed Files (7 files in `database/`)

| File | Description |
|------|-------------|
| `seed.sql` | Core org, users, systems |
| `seed-frameworks.sql` | Compliance frameworks |
| `seed-controls-expanded.sql` | Expanded control catalog |
| `seed-additional-controls.sql` | Supplementary controls |
| `seed-tcf-controls.sql` | TCF controls |
| `seed-sample-customer-esfs.sql` | ESF sample customer data |
| `seed-sample-customer-phs.sql` | PHS sample customer data |

## Pre-Deploy Checks

Run `scripts/pre-deploy-check.sh` before deploying to catch:
- Migration file ordering and naming issues
- Column name inconsistencies (`org_id` vs `organization_id`)
- SQL syntax issues (unbalanced quotes)
- Worker bundle size limits
- Secrets or credentials in tracked files

```bash
bash scripts/pre-deploy-check.sh
```

## Control Generator Script

`scripts/build_controls.js` is the source-of-truth generator for the NIST 800-53 Rev 5 control library.

```bash
node scripts/build_controls.js
```

## Operational Data Generator

`generate-operational-data.js` generates realistic PHS system data for demo/testing.

```bash
node generate-operational-data.js
# Output: database/migrate-041-operational-data.sql
```

## Database Reference

| Environment | Database Name | Database ID | Size |
|-------------|--------------|-------------|------|
| **Production** | forge-comply360-db | `73faffec-f001-44bc-880e-62bd932c25b1` | 10.5 MB |
| **Staging/Demo** | forge-comply360-db-demo | `094aa4dd-5c79-456e-a2cb-d43f08f677e5` | 2.5 MB |
| ~~Legacy~~ | ~~forge-production~~ | ~~`fe250bed-40a9-443a-a6c7-4b59bf8a0dac`~~ | ~~1 MB~~ |

## Environments

| Environment | Worker | Frontend | DB |
|-------------|--------|----------|----|
| Development | `wrangler dev` (local) | `localhost:5173` | Local SQLite |
| Staging | `forge-comply360-api-staging` | `staging.forgecomply360.pages.dev` | `forge-comply360-db-demo` |
| Demo | `forge-comply360-api-demo` | `demo.forgecomply360.pages.dev` | `forge-comply360-db-demo` |
| Production | `forge-comply360-api` | `forgecomply360.pages.dev` | `forge-comply360-db` |

## Schema Notes

- **scan_imports** + vulnerability_findings/assets extensions support Nessus, Qualys, and Rapid7 scanner integration
- **control_definitions** uses `UNIQUE(framework_id, control_id)` — safe for re-runs
- **control_implementations** uses `UNIQUE(system_id, control_definition_id)` — one implementation per control per system
- FC360 responsibility model: `inherited` (Cloudflare PE/MP), `shared` (AU/CM/CP/IR/MA/SC/SI), `provider` (everything else)

## Secrets (set via `wrangler secret put`)

- `RESEND_API_KEY` — Email delivery via Resend
- `CLOUDFLARE_API_TOKEN` — Set in GitHub Actions secrets
- `REGISTRATION_INVITE_CODE` — Set per environment in `wrangler.toml` vars
