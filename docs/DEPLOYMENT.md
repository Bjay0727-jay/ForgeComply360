# ForgeComply 360 Deployment Guide

This guide covers deploying ForgeComply 360 to Cloudflare's infrastructure.

---

## Prerequisites

### Required Accounts
- **Cloudflare Account** with Workers Paid plan ($5/month minimum)
- **Sentry Account** for error monitoring (optional, recommended)
- **Resend Account** for email delivery (optional)

### Required Tools
- Node.js 18+ and npm
- Wrangler CLI: `npm install -g wrangler`
- Git

---

## Project Structure

```
forge-comply-360/
├── frontend/              # React frontend application
│   ├── src/
│   ├── dist/              # Built files (generated)
│   └── package.json
├── workers/
│   └── index.js           # Cloudflare Worker API
├── database/
│   └── schema.sql         # D1 database schema
├── wrangler.toml          # Cloudflare configuration
└── package.json           # Root package.json
```

---

## Initial Setup

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/your-org/forge-comply-360.git
cd forge-comply-360

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Authenticate with Cloudflare

```bash
npx wrangler login
```

This opens a browser for OAuth authentication.

### 3. Create Cloudflare Resources

#### Create D1 Database

```bash
# Create the database
npx wrangler d1 create forge-comply360-db

# Note the database ID from output, update wrangler.toml:
# database_id = "your-database-id"
```

#### Create KV Namespace

```bash
npx wrangler kv:namespace create KV

# Note the namespace ID, update wrangler.toml
```

#### Create R2 Bucket

```bash
npx wrangler r2 bucket create forge-evidence
```

### 4. Update wrangler.toml

Replace placeholder IDs with your actual resource IDs:

```toml
name = "forge-comply360-api"
main = "workers/index.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "forge-comply360-db"
database_id = "YOUR_DATABASE_ID"

[[kv_namespaces]]
binding = "KV"
id = "YOUR_KV_NAMESPACE_ID"

[[r2_buckets]]
binding = "EVIDENCE_VAULT"
bucket_name = "forge-evidence"

[ai]
binding = "AI"

[vars]
ENVIRONMENT = "development"
CORS_ORIGIN = "https://forgecomply360.pages.dev"

[triggers]
crons = ["0 6 * * *", "0 8 * * 1"]
```

---

## Database Setup

### Run Migrations

```bash
# Local development
npm run db:migrate:local

# Or manually:
npx wrangler d1 execute forge-comply360-db --local --file=database/schema.sql
```

### Seed Initial Data (Optional)

```bash
npm run db:seed:local

# Or manually:
npx wrangler d1 execute forge-comply360-db --local --file=database/seed.sql
```

---

## Local Development

### Start Backend (Workers)

```bash
npm run dev
# API available at http://localhost:8787
```

### Start Frontend (Vite)

```bash
npm run dev:frontend
# Frontend available at http://localhost:5173
```

### Run Both Concurrently

Open two terminals or use a process manager:

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run dev:frontend
```

---

## Staging Deployment

### 1. Create Staging Environment

Add to `wrangler.toml`:

```toml
[env.staging]
name = "forge-comply360-api-staging"
vars = { ENVIRONMENT = "staging" }

[[env.staging.d1_databases]]
binding = "DB"
database_name = "forge-comply360-db-staging"
database_id = "YOUR_STAGING_DB_ID"
```

### 2. Run Staging Migrations

```bash
npm run db:migrate:staging
# Or:
npx wrangler d1 execute forge-comply360-db-staging --env staging --file=database/schema.sql
```

### 3. Deploy to Staging

```bash
npm run deploy:staging
# Or:
npx wrangler deploy --env staging
```

### 4. Deploy Frontend to Staging

```bash
npm run frontend:deploy:staging
# Or:
cd frontend && npm run build
npx wrangler pages deploy dist --project-name=forgecomply360 --branch=staging
```

---

## Production Deployment

### 1. Create Production Environment

Add to `wrangler.toml`:

```toml
[env.production]
name = "forge-comply360-api"
vars = { ENVIRONMENT = "production" }

[[env.production.d1_databases]]
binding = "DB"
database_name = "forge-comply360-db"
database_id = "YOUR_PRODUCTION_DB_ID"
```

### 2. Set Production Secrets

```bash
# Email service API key
npx wrangler secret put RESEND_API_KEY --env production
# Enter: re_xxxxxxxx

# Sentry DSN for error tracking
npx wrangler secret put SENTRY_DSN --env production
# Enter: https://xxxxx@sentry.io/xxxxx
```

### 3. Run Production Migrations

```bash
npm run db:migrate:production
# Or:
npx wrangler d1 execute forge-comply360-db --env production --file=database/schema.sql
```

### 4. Deploy Backend

```bash
npm run deploy:production
# Or:
npx wrangler deploy --env production
```

### 5. Configure Frontend Environment

Edit `frontend/.env.production`:

```env
VITE_API_URL=https://forge-comply360-api.your-subdomain.workers.dev
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### 6. Deploy Frontend

```bash
npm run frontend:deploy:production
# Or:
cd frontend && npm run build
npx wrangler pages deploy dist --project-name=forgecomply360
```

---

## Custom Domain Setup

### API Custom Domain

1. Go to Cloudflare Dashboard > Workers & Pages
2. Select your worker
3. Go to Triggers > Custom Domains
4. Add your domain (e.g., `api.forgecomply.com`)

### Frontend Custom Domain

1. Go to Cloudflare Dashboard > Workers & Pages
2. Select your Pages project
3. Go to Custom Domains
4. Add your domain (e.g., `app.forgecomply.com`)

---

## Environment Variables Reference

### Backend (wrangler.toml vars or secrets)

| Variable | Description | Required |
|----------|-------------|----------|
| `ENVIRONMENT` | Environment name (development, staging, production) | Yes |
| `CORS_ORIGIN` | Allowed CORS origin | Yes |
| `RESEND_API_KEY` | Resend.com API key for emails | No |
| `SENTRY_DSN` | Sentry DSN for error tracking | No |

### Frontend (.env files)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |
| `VITE_SENTRY_DSN` | Sentry DSN for frontend errors | No |

---

## CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main, staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm ci
          cd frontend && npm ci

      - name: Run tests
        run: npm run test:all

      - name: Build frontend
        run: cd frontend && npm run build

      - name: Deploy to Staging
        if: github.ref == 'refs/heads/staging'
        run: |
          npx wrangler deploy --env staging
          npx wrangler pages deploy frontend/dist --project-name=forgecomply360 --branch=staging
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

      - name: Deploy to Production
        if: github.ref == 'refs/heads/main'
        run: |
          npx wrangler deploy --env production
          npx wrangler pages deploy frontend/dist --project-name=forgecomply360
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### Required GitHub Secrets

1. Go to Repository Settings > Secrets and Variables > Actions
2. Add `CLOUDFLARE_API_TOKEN` with a Cloudflare API token that has:
   - Workers Scripts: Edit
   - D1: Edit
   - Pages: Edit
   - R2: Edit

---

## Database Backups

### Manual Backup

```bash
# Export database to SQL
npx wrangler d1 export forge-comply360-db --env production --output=backup.sql
```

### Restore from Backup

```bash
# Import SQL backup
npx wrangler d1 execute forge-comply360-db --env production --file=backup.sql
```

### Automated Backups

Consider using Cloudflare's D1 Time Travel feature (30-day retention) or setting up a scheduled Worker to export backups to R2.

---

## Monitoring & Observability

### Sentry Error Tracking

1. Create Sentry projects for frontend and backend
2. Add DSN values to environment variables
3. Errors are automatically captured and reported

### Cloudflare Analytics

- Workers Analytics: Dashboard > Workers & Pages > Analytics
- Real-time logs: `npx wrangler tail --env production`

### Health Check Endpoint

The API provides a health check at:
```
GET /api/v1/health
```

Response:
```json
{
  "status": "healthy",
  "version": "5.0.0",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

---

## Scaling Considerations

### Cloudflare Workers Limits

| Resource | Free | Paid |
|----------|------|------|
| Requests/day | 100,000 | Unlimited |
| CPU time/request | 10ms | 30s |
| Memory | 128MB | 128MB |
| Subrequests | 50 | 1000 |

### D1 Database Limits

| Resource | Limit |
|----------|-------|
| Database size | 2GB |
| Rows read/query | 5,000,000 |
| Rows written/query | 100,000 |

### R2 Storage Limits

| Resource | Limit |
|----------|-------|
| Object size | 5GB |
| Bucket count | 1000 |
| Storage | Unlimited |

---

## Troubleshooting

### Common Issues

**1. CORS Errors**

Ensure `CORS_ORIGIN` matches your frontend domain exactly:
```toml
[vars]
CORS_ORIGIN = "https://forgecomply360.pages.dev"
```

**2. Database Connection Errors**

Verify database ID in wrangler.toml matches your D1 database:
```bash
npx wrangler d1 list
```

**3. Build Failures**

Clear node_modules and reinstall:
```bash
rm -rf node_modules frontend/node_modules
npm install
cd frontend && npm install
```

**4. Deployment Timeout**

For large deployments, increase timeout:
```bash
npx wrangler deploy --timeout 300
```

### Getting Logs

```bash
# Real-time logs
npx wrangler tail --env production

# Filter by status
npx wrangler tail --env production --status error
```

---

## Security Checklist

Before going to production:

- [ ] Set strong CORS origin (no wildcards)
- [ ] Configure rate limiting appropriate for your load
- [ ] Set up Sentry error monitoring
- [ ] Enable MFA for Cloudflare account
- [ ] Review and rotate API keys
- [ ] Test all authentication flows
- [ ] Verify database backups work
- [ ] Set up monitoring alerts
- [ ] Review security headers (CSP, HSTS, etc.)

---

## Support

For deployment issues:
- Cloudflare Community: https://community.cloudflare.com
- Wrangler Issues: https://github.com/cloudflare/workers-sdk/issues
- ForgeComply Support: support@forgecyber.com

---

*Last updated: February 2025*
