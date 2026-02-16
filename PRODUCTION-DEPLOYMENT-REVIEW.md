# ForgeComply 360 — Production Deployment Review

**Date:** 2026-02-16
**Version Reviewed:** 5.0.0
**Reviewer:** Automated Code Review (Claude)
**Scope:** Security, infrastructure, CI/CD, database, observability, frontend

---

## Executive Summary

ForgeComply 360 is a well-structured enterprise GRC platform with dual deployment targets (Cloudflare cloud and Docker on-prem). The codebase demonstrates strong security fundamentals — parameterized queries throughout, PBKDF2 password hashing, MFA support, RBAC, comprehensive audit logging, and field-level encryption for sensitive data.

However, several issues must be resolved before production deployment, particularly around **secret management, CI/CD pipeline safety, file upload validation, Docker hardening, and migration reliability**. The findings below are ranked by severity.

---

## CRITICAL — Must Fix Before Production

### 1. Refresh Token Salt Is Hardcoded

**File:** `workers/index.js:1365,1430,1450,1466`

Refresh tokens are hashed using a static, plaintext salt `'refresh-salt'` instead of a per-token random salt:

```js
const refreshHash = await hashPassword(refreshToken, 'refresh-salt');
```

**Risk:** If the database is compromised, an attacker with access to `refresh_tokens.token_hash` values could precompute a rainbow table against the fixed salt to recover refresh tokens and hijack sessions.

**Recommendation:** Generate a unique random salt per refresh token and store it alongside the hash in the `refresh_tokens` table, the same way user passwords are handled. Alternatively, use a keyed HMAC (with the JWT_SECRET) for refresh token verification instead of PBKDF2 with a fixed salt.

---

### 2. CI/CD Pipeline Silently Swallows Migration Failures

**File:** `.github/workflows/deploy.yml:100-101`

All migration and seed steps use `|| echo "warning — continuing"` patterns:

```yaml
wrangler d1 execute ... --file="$f" || echo "⚠️ Migration $f failed — continuing"
```

**Risk:** A migration that genuinely fails (schema conflict, syntax error, partial application) will be silently skipped. The deployment proceeds with a database in an inconsistent state, potentially causing data corruption or application errors in production.

**Recommendation:**
- Track applied migrations using the existing `schema_migrations` table. Each migration script should check if it has already been applied before executing.
- Only suppress `CREATE TABLE IF NOT EXISTS` / `INSERT OR IGNORE` idempotent statements, not arbitrary migration files.
- Fail the CI job on unexpected migration errors so the team is alerted.

---

### 3. No File Upload Size or Type Validation

**File:** `workers/index.js:2666-2698`

The `handleUploadEvidence` function accepts any file without server-side size or MIME type restrictions:

```js
const file = formData.get('file');
// No size check
// No file type validation
const arrayBuffer = await file.arrayBuffer();
```

The nginx config allows up to 50MB (`client_max_body_size 50M`), but the Workers API has no equivalent limit.

**Risk:** An authenticated user could upload arbitrarily large files, consuming R2 storage and potentially causing memory exhaustion on the Worker (which buffers the entire file into an ArrayBuffer). Malicious file types (`.exe`, `.html` with scripts) could be stored and later served.

**Recommendation:**
- Enforce a maximum file size (e.g., 25MB) in the API handler before calling `file.arrayBuffer()`.
- Validate file types against an allowlist of expected evidence formats (PDF, DOCX, XLSX, PNG, JPG, CSV, TXT, JSON, XML).
- Consider streaming uploads for the on-prem deployment to avoid buffering large files in memory.

---

### 4. Docker API Container Runs as Root

**File:** `docker/Dockerfile.api`

The Dockerfile does not set a non-root user. The container runs as `root` by default:

```dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache python3 make g++ sqlite
# ... no USER directive
CMD ["node", "docker/server.js"]
```

**Risk:** If the application is compromised, the attacker has root access within the container, making privilege escalation and container escape easier.

**Recommendation:** Add a non-root user:

```dockerfile
RUN addgroup -S forge && adduser -S forge -G forge
RUN chown -R forge:forge /app /data
USER forge
```

---

## HIGH — Should Fix Before Production

### 5. Production and Development Share the Same D1 Database ID

**File:** `wrangler.toml:12,42`

Both the default (development) and production environments reference the same D1 database:

```toml
# Default (dev)
database_id = "73faffec-f001-44bc-880e-62bd932c25b1"

# Production
database_id = "73faffec-f001-44bc-880e-62bd932c25b1"
```

**Risk:** Running `wrangler dev` or local tests could accidentally modify production data.

**Recommendation:** Create a separate D1 database for development and update the default binding. Only the `[env.production]` section should reference the production database ID.

---

### 6. KV Namespace Shared Across Environments

**File:** `wrangler.toml:15,46`

Same issue as above — the KV namespace `a3323bb1cfa14271a286170864082869` is reused for both dev and production. Rate limit state, session data, and cached values could bleed between environments.

**Recommendation:** Create separate KV namespaces per environment.

---

### 7. Missing `Access-Control-Allow-Credentials` Header

**File:** `workers/index.js:113-119`

The CORS configuration does not include `Access-Control-Allow-Credentials: true`:

```js
function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}
```

This is fine if the frontend uses `Authorization` headers exclusively (which it appears to). However, if cookies or credentials are ever used for auth, this will silently fail. Document this as an intentional design decision.

---

### 8. Rate Limiting Is DB-Backed and Non-Atomic

**File:** `workers/index.js:136-163`

Rate limiting uses the D1 database with a `DELETE` + `SELECT` + `INSERT/UPDATE` sequence. This has two problems:

1. **Performance:** Every API request hits the database for rate limit checks, adding latency.
2. **Race conditions:** The check-then-update pattern is not atomic — under concurrent requests, the count can be bypassed.

**Recommendation:** Use Cloudflare KV or a dedicated rate-limiting service instead of D1. KV operations are faster and more appropriate for ephemeral counters. For the on-prem deployment, use Redis (already configured in the documented architecture but not in the simplified docker-compose).

---

### 9. CSP Allows `unsafe-inline` for Styles

**File:** `workers/index.js:54`

The Content-Security-Policy includes `style-src 'self' 'unsafe-inline'`:

```
style-src 'self' 'unsafe-inline';
```

**Risk:** This weakens XSS protection by allowing inline styles, which can be exploited for data exfiltration (e.g., CSS injection).

**Recommendation:** Since the frontend uses TailwindCSS (utility classes, no inline styles), investigate removing `unsafe-inline` and using nonce-based CSP for any remaining inline styles.

---

### 10. Frontend Dockerfile Health Check Targets Port 80 (Not 443)

**File:** `docker/Dockerfile.frontend:31`

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -qO- http://localhost:80/ || exit 1
```

Since nginx redirects port 80 to 443, this health check will always get a `301 redirect` response, not a `200 OK`. The health check may report the container as unhealthy depending on how `wget` handles redirects.

**Recommendation:** Either health-check against `https://localhost:443/` (with `--no-check-certificate`) or add a dedicated health check location in nginx that returns 200 on port 80 without redirecting.

---

### 11. No Database Connection Pooling or WAL Checkpoint (On-Prem)

**File:** `docker/server.js:33-35`

```js
const sqlite = new Database(DB_PATH, { verbose: process.env.DEBUG ? console.log : undefined });
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
```

WAL mode is correctly enabled, but there is no periodic checkpoint (`PRAGMA wal_checkpoint(TRUNCATE)`) or maximum WAL size limit. Under sustained write load, the WAL file can grow unbounded.

**Recommendation:** Add a periodic WAL checkpoint (e.g., every 5 minutes or when WAL exceeds a threshold) and set `PRAGMA wal_autocheckpoint` to a reasonable value.

---

## MEDIUM — Recommended Improvements

### 12. No Staging Environment in CI/CD

**File:** `.github/workflows/deploy.yml`

The pipeline deploys directly from `main` to production with no staging gate:

```yaml
on:
  push:
    branches: [main]
```

**Recommendation:** Add a staging deployment step that runs integration tests against a staging environment before promoting to production. Use the existing `[env.staging]` (or `[env.demo]`) wrangler environment for this.

---

### 13. Docker Compose Uses `version: '3.8'` (Deprecated)

**File:** `docker/docker-compose.yml:11`

The `version` key is deprecated in modern Docker Compose. It has no functional effect and can be safely removed.

---

### 14. No Resource Limits on Docker Containers

**File:** `docker/docker-compose.yml`

None of the containers have CPU or memory limits defined. The Ollama container in particular can consume significant memory.

**Recommendation:**

```yaml
api:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 1G
ollama:
  deploy:
    resources:
      limits:
        cpus: '4'
        memory: 8G
```

---

### 15. Backup Script Does Not Download Evidence Files by Default

**File:** `scripts/backup.sh:55-62`

Evidence file download is commented out. The backup only captures metadata, not the actual files.

**Recommendation:** For HIPAA compliance, backups must include evidence files. Enable the R2 download section or document an alternative procedure for backing up the R2 bucket.

---

### 16. Login Endpoint Leaks Account Existence via Timing

**File:** `workers/index.js:1392-1411`

When a user is not found, the handler returns immediately without performing a password hash. When a user exists, it performs the PBKDF2 hash (100K iterations). This timing difference reveals whether an email address is registered.

```js
const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')...first();
if (!user) return jsonResponse({ error: 'Invalid credentials' }, 401); // Fast path

const hash = await hashPassword(password, user.salt); // Slow path
```

**Recommendation:** When the user is not found, perform a dummy PBKDF2 computation before returning to make both paths take approximately the same time:

```js
if (!user) {
  await hashPassword(password, 'dummy-salt-for-timing');
  return jsonResponse({ error: 'Invalid credentials' }, 401);
}
```

---

### 17. Monolithic API Worker (14,000+ Lines)

**File:** `workers/index.js`

The entire API is a single 14,421-line JavaScript file with no module imports (aside from Toucan and XMLParser). This impacts:

- **Maintainability:** Difficult to navigate, test individual modules, or perform code reviews.
- **Cold start:** The entire file is parsed on every Worker cold start.

**Recommendation:** Split into modules using Wrangler's bundler support. At minimum, separate auth, middleware, routes, and database helpers into distinct files.

---

### 18. Missing `.env` Files in `.gitignore`

**File:** `.gitignore`

Only `docker/.env` is ignored. Root-level `.env`, `frontend/.env.local`, or other env files are not explicitly excluded:

```
docker/.env
```

**Recommendation:** Add broader env file patterns:

```gitignore
.env
.env.*
!.env.example
!.env.demo
!.env.production
```

Note: `frontend/.env.production` is committed intentionally (it contains only the API URL and Sentry DSN, no secrets).

---

### 19. Notification Message Vulnerable to XSS via Interpolation

**File:** `workers/index.js:2694`

```js
await notifyOrgRole(env, org.id, user.id, 'manager', 'evidence_upload',
  'New Evidence Uploaded',
  'Evidence file "' + file.name + '" was uploaded', ...);
```

The `file.name` is interpolated directly into the notification message without sanitization. If this message is rendered as HTML on the frontend, a crafted filename could inject script content.

**Recommendation:** Sanitize `file.name` before interpolation, or ensure the frontend always renders notification messages as plain text (not `dangerouslySetInnerHTML`).

---

### 20. No Graceful Shutdown Handler (On-Prem)

**File:** `docker/server.js`

The Node.js server does not handle `SIGTERM` or `SIGINT` signals. When Docker stops the container, in-flight requests may be dropped and the SQLite database may not flush properly.

**Recommendation:** Add a graceful shutdown handler:

```js
process.on('SIGTERM', () => {
  server.close(() => {
    sqlite.close();
    process.exit(0);
  });
});
```

---

## LOW — Nice to Have

### 21. Frontend Source Maps in Production

Verify that Vite is configured to exclude source maps from production builds. The current `vite.config.ts` does not explicitly set `build.sourcemap: false`, which means source maps may be generated depending on the Vite version defaults.

### 22. No Dependency Vulnerability Scanning in CI

The CI pipeline does not run `npm audit` or use a tool like Snyk/Dependabot. Add a vulnerability scanning step to catch known CVEs in dependencies.

### 23. Database Schema Uses `datetime('now')` Without Timezone

All timestamp columns use `datetime('now')`, which returns UTC. This is correct behavior but should be documented. Consider using `strftime('%Y-%m-%dT%H:%M:%SZ', 'now')` for ISO 8601 format consistency with the API responses.

### 24. OCSP Stapling Commented Out in Nginx

**File:** `docker/nginx.conf:33-36`

OCSP stapling is commented out. When CA-signed certificates are used in production, enable OCSP stapling for improved TLS performance.

### 25. Ollama Port Exposed to Host

**File:** `docker/docker-compose.yml:62`

The Ollama port (11434) is exposed to the host. Since only the API container needs access, remove the host port mapping and rely on the internal Docker network:

```yaml
# Remove this:
ports:
  - "${OLLAMA_PORT:-11434}:11434"
# Ollama is still accessible via http://ollama:11434 within the Docker network
```

---

## Production Deployment Checklist

Before going live, verify the following:

- [ ] **Secrets:** JWT_SECRET is a cryptographically random string of 64+ characters, set via `wrangler secret put`
- [ ] **Secrets:** RESEND_API_KEY configured if email notifications are needed
- [ ] **Secrets:** SENTRY_DSN configured for error monitoring
- [ ] **Database:** Production D1 database has a separate ID from development
- [ ] **Database:** All migrations applied successfully (verify `schema_migrations` table)
- [ ] **Database:** Seed data loaded (frameworks, controls)
- [ ] **TLS:** Valid CA-signed certificates (not self-signed) for on-prem deployments
- [ ] **TLS:** OCSP stapling enabled for production certificates
- [ ] **Backups:** Automated backup cron triggers verified (`0 2 * * 2,5`)
- [ ] **Backups:** Backup restore procedure tested end-to-end
- [ ] **Monitoring:** Sentry DSN configured and test error sent
- [ ] **Monitoring:** Health check endpoint (`/health`) returns 200
- [ ] **CORS:** `CORS_ORIGIN` matches the exact production frontend domain
- [ ] **Rate Limiting:** Verified rate limits are active on auth and API endpoints
- [ ] **MFA:** TOTP setup and verification flow tested
- [ ] **Docker:** Containers run as non-root user
- [ ] **Docker:** Resource limits set for all containers
- [ ] **Docker:** Ollama port not exposed to host network
- [ ] **CI/CD:** Staging deployment step added before production
- [ ] **CI/CD:** Migration failures cause job failure (not silent continuation)
- [ ] **CI/CD:** `npm audit` step added to catch vulnerable dependencies
- [ ] **File Uploads:** Max file size enforced server-side
- [ ] **File Uploads:** File type allowlist enforced
- [ ] **Audit Logs:** Retention policy configured (6 years for HIPAA)
- [ ] **Audit Logs:** Log export mechanism verified

---

## Strengths

The following aspects of the codebase are well-implemented:

1. **Parameterized queries everywhere** — 1,385 uses of `.prepare()` + `.bind()` with zero string interpolation in SQL, eliminating SQL injection risk.
2. **PBKDF2 with 100K iterations** — Strong password hashing that meets NIST SP 800-132 recommendations.
3. **Breached password checking** — Integration with Have I Been Pwned using k-Anonymity preserves user privacy.
4. **Password history enforcement** — Prevents reuse of last 12 passwords.
5. **Comprehensive audit logging** — Every significant operation is logged with user, IP, user-agent, and change details.
6. **Field-level encryption** — MFA secrets encrypted at rest using AES-256-GCM derived from the JWT_SECRET via HKDF.
7. **Account lockout** — 5 failed attempts triggers a 15-minute lockout.
8. **Multi-framework RBAC** — 5-tier role system with organization isolation.
9. **Evidence integrity** — SHA-256 hashing for all uploaded evidence files.
10. **Security headers** — HSTS, X-Frame-Options DENY, CSP, Permissions-Policy all correctly set.
11. **Token rotation** — Refresh tokens are single-use with automatic rotation.
12. **Code splitting** — Frontend uses lazy-loaded route chunks for optimal initial load performance.
13. **Dual deployment support** — Clean cloud/on-prem architecture with appropriate shims.

---

*End of production deployment review.*
