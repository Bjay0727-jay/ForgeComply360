# ForgeComply 360 — Deployment Configuration Package

## Finding → Fix Mapping

| Finding | Severity | File | What It Does |
|---------|----------|------|-------------|
| **DB ID Mismatch** | CRITICAL | `wrangler.toml` | Points to correct DB `73faffec` (not stale `fe250bed`) |
| **H-2** Test Coverage | HIGH | `.github/workflows/deploy.yml` | Adds test job with coverage threshold |
| **H-3** Open Registration | HIGH | `patches/worker-patches.js` | Invite code gate (`REGISTRATION_INVITE_CODE` env var) |
| **H-4** No npm audit | HIGH | `.github/workflows/deploy.yml` | `npm audit --audit-level=high` in CI |
| **H-5** CORS Defaults | HIGH | `wrangler.toml` + `patches/worker-patches.js` | Custom domain CORS + pattern matching |
| **M-1** OSCAL Validation | MEDIUM | (previous delivery: `oscal-validator.js`) | Schema validation on SSP export |
| **M-2** Scheduled Tasks | MEDIUM | `patches/worker-patches.js` | `Promise.allSettled()` error isolation |
| **M-3** CSP Inline Styles | MEDIUM | `patches/worker-patches.js` | Relaxed style-src for chart libraries |

## Files

```
deploy-package/
├── wrangler.toml                        # ← Replace your existing wrangler.toml
├── .github/
│   └── workflows/
│       └── deploy.yml                   # ← Add to repo
├── scripts/
│   ├── pre-deploy-check.js              # ← Add to repo (runs in CI + locally)
│   └── deploy.sh                        # ← Add to repo (manual deploy helper)
└── patches/
    └── worker-patches.js                # ← Apply changes to workers/index.js
```

## Deployment Steps

### First Time Setup

1. **Replace `wrangler.toml`** in your repo root with the one from this package
2. **Copy `.github/workflows/deploy.yml`** into your repo
3. **Copy `scripts/`** directory into your repo
4. **Apply patches** from `patches/worker-patches.js` to your `workers/index.js`
5. **Add GitHub Secret**: `CLOUDFLARE_API_TOKEN` (Settings → Secrets → Actions)

### Deploy via CI (recommended)

```bash
git add .
git commit -m "fix: apply deployment config fixes from readiness review"
git push origin main  # → triggers production deploy
git push origin staging  # → triggers staging deploy
```

### Deploy Manually

```bash
# Validate first
node scripts/pre-deploy-check.js --env production

# Deploy
./scripts/deploy.sh production

# Or dry run
./scripts/deploy.sh production --dry

# Migrations only
./scripts/deploy.sh production --migrate-only
```

## Database Reference

| Environment | Database Name | Database ID | Size |
|-------------|--------------|-------------|------|
| **Production** | forge-comply360-db | `73faffec-f001-44bc-880e-62bd932c25b1` | 10.5 MB |
| **Staging/Demo** | forge-comply360-db-demo | `094aa4dd-5c79-456e-a2cb-d43f08f677e5` | 2.5 MB |
| ~~Legacy~~ | ~~forge-production~~ | ~~`fe250bed-40a9-443a-a6c7-4b59bf8a0dac`~~ | ~~1 MB~~ |

> ⚠️ The `fe250bed` database is STALE. It was the original development DB with 28 tables. The active production database is `73faffec` with 84 tables and full schema.
