# ForgeComply 360 — Cloudflare Configuration & Dashboard Review

**Date:** 2026-03-13
**Branch:** `claude/review-cloudflare-config-Fw8XY`
**Scope:** Review of `forgecomply-360-dashboard (1).zip` from branch `claude/create-sample-customer-data-sc8Su`, Cloudflare Worker configuration, D1 database schema, CI/CD pipeline, and Docker on-prem deployment.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Dashboard Prototype Evaluation](#2-dashboard-prototype-evaluation)
3. [Cloudflare Configuration Security Review](#3-cloudflare-configuration-security-review)
4. [D1 Database Schema Review](#4-d1-database-schema-review)
5. [CI/CD Pipeline Review](#5-cicd-pipeline-review)
6. [Docker On-Prem Deployment Review](#6-docker-on-prem-deployment-review)
7. [Dashboard vs Platform Comparison](#7-dashboard-vs-platform-comparison)
8. [Recommendations Summary](#8-recommendations-summary)
9. [Remediation Tracker](#9-remediation-tracker)

---

## 1. Executive Summary

This review identified **5 critical**, **7 high**, and **5 medium** severity findings across the ForgeComply 360 infrastructure. The dashboard zip (`forgecomply-360-dashboard (1).zip`) is a Google AI Studio prototype with excellent UI patterns but critical security gaps. The Cloudflare production configuration has several hardening opportunities, and the CI/CD pipeline lacks security scanning gates.

**Key takeaway:** The dashboard prototype should be integrated into the main Cloudflare-based platform (not deployed standalone), and the configuration fixes documented below should be applied before any production deployment.

---

## 2. Dashboard Prototype Evaluation

### 2.1 What It Is

The zip contains a **Google AI Studio React prototype** for the ForgeComply 360 SSP Reporter. It is a single-page application with:

- **Framework:** React 19 + TypeScript + Vite 6 + Tailwind CSS 4
- **AI Integration:** Google Gemini 3 Flash Preview (`@google/genai ^1.29.0`)
- **State Management:** Zustand 5.x with auto-save debouncing
- **Rich Text:** TipTap editor (`@tiptap/react ^3.20.1`)
- **PDF Export:** jsPDF + jspdf-autotable
- **OSCAL Data:** 26 mock controls across 8 NIST 800-53 families

### 2.2 Findings

#### FINDING D-1: API Key Exposed in Client Bundle (CRITICAL)

**File:** `vite.config.ts:11`
```typescript
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
},
```

The Gemini API key is injected into the Vite build output via the `define` block. This means the key is visible in the browser's JavaScript bundle. Anyone inspecting the page source can extract and abuse the API key.

**Also in:** `src/components/ReporterAssistant.tsx:22`
```typescript
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || 'dummy' });
```

**Recommendation:** Never embed API keys in client-side code. All AI calls must go through a server-side proxy (e.g., the existing Cloudflare Worker API at `/api/ai/generate`).

---

#### FINDING D-2: No Authentication Layer (CRITICAL)

The prototype has no authentication. The `App.tsx` router exposes all routes without any auth check:

```typescript
<Routes>
  <Route path="/" element={<Dashboard />} />
  <Route path="/systems/:systemId/reporter" element={<ReporterRouteWrapper />} />
</Routes>
```

Any user can access any system's SSP data by navigating to `/systems/{id}/reporter`.

**Recommendation:** Integrate with the main platform's JWT authentication. The existing `workers/index.js` already implements session management, RBAC, and org-scoped access.

---

#### FINDING D-3: XSS via Unsanitized AI HTML Output (HIGH)

**File:** `src/services/geminiService.ts:22-24`
```typescript
let html = response.text || '';
html = html.replace(/^```html\s*/i, '').replace(/\s*```$/i, '');
return html;
```

Raw HTML from the Gemini API response is stripped of markdown code fences but **not sanitized**. This HTML is then rendered directly in the TipTap rich text editor via `editor.commands.setContent(value)`.

If the AI model returns malicious HTML (or if a prompt injection triggers it), arbitrary JavaScript could execute in the user's browser.

**Recommendation:** Add DOMPurify sanitization before setting editor content:
```typescript
import DOMPurify from 'dompurify';
const cleanHtml = DOMPurify.sanitize(html, { ALLOWED_TAGS: ['p', 'ul', 'ol', 'li', 'strong', 'em', 'h1', 'h2', 'h3', 'blockquote', 'code', 'pre'] });
```

---

#### FINDING D-4: Mock Data Only — No Real API Integration (HIGH)

**File:** `src/store/oscalStore.ts:32-47`

All data operations are mocked with `setTimeout` delays:
```typescript
fetchOscalData: async (systemId: string) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  set({ oscalData: initialOscalData, ... });
},
```

The store ignores the `systemId` parameter entirely — it always returns the same hardcoded data from `mockOscalData.ts`.

**Recommendation:** Replace mock calls with real API integration:
```typescript
const res = await fetch(`${API_URL}/api/systems/${systemId}/oscal`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

#### FINDING D-5: Incomplete OSCAL Coverage (MEDIUM)

**File:** `src/data/mockOscalData.ts`

The mock data contains only 26 controls across 8 families:
- AC (Access Control): 6 controls
- AT (Awareness & Training): 2 controls
- AU (Audit & Accountability): 3 controls
- CM (Configuration Management): 3 controls
- IA (Identification & Authentication): 3 controls
- IR (Incident Response): 2 controls
- SC (System & Communications Protection): 3 controls
- SI (System & Information Integrity): 4 controls

FedRAMP Moderate requires **325+ controls** across all 20 NIST 800-53 families. The main platform's database already has the complete catalog in `database/seed-frameworks.sql`.

---

#### FINDING D-6: Package Name Mismatch (LOW)

**File:** `package.json:2`
```json
"name": "react-example"
```

The package retains the AI Studio template name. Should be `"forgecomply-360-dashboard"` or similar.

---

### 2.3 Patterns Worth Adopting

Despite the security gaps, the prototype has excellent UI patterns:

1. **Three-pane SSP Reporter layout** — Navigation sidebar + editor + AI assistant panel
2. **Live OSCAL JSON viewer** — Modal showing real-time OSCAL 1.1.2 JSON output
3. **Progress tracking sidebar** — Per-section completion percentage with visual indicators
4. **Bulk control editing** — Select multiple controls, apply status/origination changes at once via floating action bar
5. **AI narrative generation** — Per-control "Generate with AI" button that produces NIST-compliant implementation narratives
6. **Client-side PDF export** — jsPDF-based SSP export complements the server-side SSP builder
7. **Auto-save with status indicator** — Debounced saves with visual feedback (saving/saved/error)
8. **OSCAL validation panel** — Schema validation errors with "Fix Issue" navigation links

---

## 3. Cloudflare Configuration Security Review

### 3.1 wrangler.toml

#### FINDING C-1: Production Database & KV IDs Exposed (HIGH)

**Lines 75, 79:**
```toml
database_id = "73faffec-f001-44bc-880e-62bd932c25b1"
id = "a3323bb1cfa14271a286170864082869"
```

While these are not secrets (Cloudflare API tokens are needed to access them), exposing resource IDs reduces the attack surface required if a token is compromised. An attacker with a leaked token and these IDs can immediately target the correct resources.

**Recommendation:** Document this as accepted risk. The IDs must be in `wrangler.toml` for deployment. Ensure API tokens are strictly scoped and rotated regularly.

---

#### FINDING C-2: Registration Invite Code in Plaintext (HIGH)

**Line 98:**
```toml
REGISTRATION_INVITE_CODE = "FORGE-BETA-2026"
```

The production registration invite code is in version control. Anyone with repo access can register new accounts.

**Recommendation:** Move to `wrangler secret put REGISTRATION_INVITE_CODE --env production`. Remove from `[env.production.vars]`.

---

#### FINDING C-3: CORS Pattern Allows All Preview Deployments (MEDIUM)

**Line 97:**
```toml
CORS_ORIGIN_PATTERN = "https://*.forgecomply360.pages.dev"
```

This wildcard allows every Cloudflare Pages preview deployment (e.g., `https://abc123.forgecomply360.pages.dev`) to make API requests. Preview deployments may run untested code.

**Recommendation:** In production, restrict to the specific production domain only:
```toml
CORS_ORIGIN = "https://forgecomply360.pages.dev"
CORS_ORIGIN_PATTERN = ""
```
Or use an explicit allowlist of known deployment URLs.

---

#### FINDING C-4: Development Rate Limit Too High (LOW)

**Line 51:**
```toml
RATE_LIMIT_RPM = "1000"
```

1,000 RPM in development is excessive and could mask rate-limiting bugs that only appear in production (500 RPM).

**Recommendation:** Set development to match production (500 RPM) to catch rate-limit edge cases during testing.

---

### 3.2 .env.production

#### FINDING C-5: Production Environment File Committed to Repo (CRITICAL)

**File:** `.env.production`

This file contains:
- Production URLs: `APP_URL=https://comply360.forgecyberdefense.com`
- API endpoints: `API_URL=https://comply360-api.forgecyberdefense.com`
- CORS origins for multiple domains
- Sentry DSN (error tracking endpoint)
- Company information usable for social engineering

**Recommendation:** Add `.env.production` to `.gitignore`. Manage these values through CI/CD environment variables or GitHub Secrets. Consider using `git filter-branch` or BFG Repo-Cleaner to purge from history.

---

### 3.3 Secrets Management

#### Current Secrets Architecture (Good)

The following sensitive values are correctly managed via `wrangler secret put`:
- `JWT_SECRET` — Token signing key
- `RESEND_API_KEY` — Email delivery API key
- `ANTHROPIC_API_KEY` — AI features (optional)

#### Missing from Secrets (Needs Fix)

- `REGISTRATION_INVITE_CODE` — Currently in `wrangler.toml` plaintext (Finding C-2)

---

## 4. D1 Database Schema Review

### 4.1 Strengths

- 40+ tables with comprehensive compliance domain modeling
- Foreign key constraints with appropriate `ON DELETE CASCADE`
- Indexes on frequently queried columns (`org_id`, `user_id`, `status`, `created_at`)
- `CHECK` constraints on enum fields (roles, subscription tiers, experience types)
- Schema migrations tracking table for version control
- Integrity hash chain in audit_logs (`integrity_hash`, `prev_hash`) for tamper detection
- Multi-tenancy via `org_id` on all tables
- MFA support (`mfa_enabled`, `mfa_secret`, `mfa_backup_codes`)
- Evidence files stored in R2 with SHA-256 hash verification

### 4.2 Findings

#### FINDING DB-1: MFA Backup Codes Stored as Plaintext (HIGH)

The `users` table stores `mfa_backup_codes` as a TEXT field. If the database is compromised, backup codes are immediately usable.

**Recommendation:** Hash each backup code with bcrypt/PBKDF2 before storage. On verification, hash the user-provided code and compare.

---

#### FINDING DB-2: Missing NOT NULL Constraints on Critical Fields (MEDIUM)

The schema does not enforce `NOT NULL` on several critical columns:
- `users.email`
- `users.password_hash`

While the application layer likely validates these, defense-in-depth requires database-level enforcement.

---

#### FINDING DB-3: No Column-Level Encryption for PII (MEDIUM)

IP addresses, email addresses, and other PII are stored in plaintext. While Cloudflare D1 provides encryption at rest (managed by Cloudflare), column-level encryption would provide defense-in-depth for HIPAA compliance.

**Recommendation:** Consider encrypting PII columns using application-layer encryption (AES-256-GCM) with a key managed via `wrangler secret`.

---

## 5. CI/CD Pipeline Review

### 5.1 Strengths

- Multi-stage deployment: test → pre-check → dry-run → staging → migrate → production
- Migration dry-run against local D1 before production
- Smoke test after staging deployment
- SBOM (CycloneDX) generation with 90-day artifact retention
- Concurrency control preventing race conditions on migrations
- Health check verification after each deployment stage

### 5.2 Findings

#### FINDING CI-1: No Deployment Approval Gates (CRITICAL)

Any push to `main` triggers automatic production deployment. There is no required review or manual approval step.

**Recommendation:** Add GitHub environment protection rules:
```yaml
environment:
  name: production
  url: https://comply360.forgecyberdefense.com
```
Then configure the `production` environment in GitHub to require approvals.

---

#### FINDING CI-2: No Security Scanning (HIGH)

The pipeline has no:
- `npm audit` for dependency vulnerabilities
- SAST (Static Application Security Testing)
- Container image scanning for Docker builds

**Recommendation:** Add as a required step before deployment:
```yaml
- name: Security audit
  run: npm audit --audit-level=high
```

---

#### FINDING CI-3: Single Broad Cloudflare API Token (HIGH)

One `CLOUDFLARE_API_TOKEN` controls Workers, D1, KV, R2, and Pages. Token compromise = full infrastructure access.

**Recommendation:** Create separate scoped tokens:
- `CF_TOKEN_WORKERS` — Workers deploy only
- `CF_TOKEN_D1` — Database migrations only
- `CF_TOKEN_PAGES` — Frontend deploy only

---

#### FINDING CI-4: No Secrets Verification Before Deploy (MEDIUM)

The pipeline does not verify that required secrets (e.g., `RESEND_API_KEY`) exist before deploying. A deployment could succeed but leave email functionality silently broken.

**Recommendation:** Add a pre-deploy check:
```yaml
- name: Verify required secrets
  run: |
    if [ -z "${{ secrets.CLOUDFLARE_API_TOKEN }}" ]; then
      echo "::error::CLOUDFLARE_API_TOKEN is not set"
      exit 1
    fi
```

---

## 6. Docker On-Prem Deployment Review

### 6.1 Findings

#### FINDING D-7: Backup Retention Only 30 Days (HIGH)

**File:** `docker-compose.yml`
```yaml
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
```

HIPAA requires 6 years (2,190 days) retention. FedRAMP requires a minimum of 3 years (1,095 days).

**Recommendation:** Change default to 2,190 days.

---

#### FINDING D-8: Weak Default Credentials (HIGH)

```yaml
POSTGRES_USER=${DB_USER:-forgecomply}
POSTGRES_PASSWORD=${DB_PASSWORD}
```

If `DB_PASSWORD` is not set, PostgreSQL may start with no password or a blank one.

**Recommendation:** Add a validation script or entrypoint that fails fast if required environment variables are not set.

---

#### FINDING D-9: No Centralized Logging (MEDIUM)

Logs are stored in local Docker volumes (`api-logs`). There is no log aggregation service (ELK, Loki, Fluentd).

**Recommendation:** Add a Loki + Grafana stack or Fluentd container for centralized, tamper-resistant logging.

---

#### FINDING D-10: Ollama AI Endpoint Unauthenticated (MEDIUM)

Port 11434 (Ollama local LLM) is exposed on the Docker network with no authentication.

**Recommendation:** Bind Ollama to `127.0.0.1` only, or add a reverse proxy with API key authentication.

---

## 7. Dashboard vs Platform Comparison

| Aspect | Zip (Dashboard Prototype) | Main Repo (Cloudflare Platform) | Integration Path |
|--------|--------------------------|--------------------------------|-----------------|
| **Runtime** | Vite dev server / AI Studio | Cloudflare Workers (edge) | Deploy as Pages SPA, API via Workers |
| **AI Provider** | Google Gemini 3 Flash (client-side) | Cloudflare Workers AI (server-side) | Migrate to `/api/ai/generate` endpoint |
| **Database** | None (Zustand mock, in-memory) | Cloudflare D1 (SQLite, 40+ tables) | Replace mock store with API calls |
| **Authentication** | None | JWT + PBKDF2-SHA256 + MFA | Wrap routes with auth guards |
| **OSCAL Controls** | 26 controls (8 families) | 325+ controls (full FedRAMP catalog) | Load from D1 via API |
| **Frameworks** | FedRAMP only | 25+ (FedRAMP, CMMC, HIPAA, SOC 2, ISO 27001...) | Already available in D1 |
| **Multi-tenancy** | No | Yes (`org_id` on all tables) | Add org context to API calls |
| **Scan Import** | No | Nessus XML + Tenable CSV parsers | Already available |
| **Evidence Storage** | No | Cloudflare R2 with SHA-256 integrity | Already available |
| **SSP Export** | Client-side PDF (jsPDF) | Server-side SSP builder | Keep both; client for quick preview |
| **State Management** | Zustand with auto-save | D1 + KV cache layer | Replace Zustand with API-backed store |
| **API Key Security** | Exposed in client bundle | Server-side via `wrangler secret` | Critical: must migrate |
| **Rich Text Editor** | TipTap (excellent UX) | Not present in main frontend | Adopt TipTap component |
| **OSCAL Validation** | Schema validation panel (mock) | Not present | Adopt validation UI pattern |

---

## 8. Recommendations Summary

### Critical (Fix Before Production)

| # | Action | Owner |
|---|--------|-------|
| 1 | Add `.env.production` to `.gitignore`; purge from git history | DevOps |
| 2 | Add deployment approval gates to CI/CD | DevOps |
| 3 | Migrate dashboard AI calls from client-side Gemini to server-side Workers AI | Engineering |
| 4 | Add authentication to dashboard prototype | Engineering |
| 5 | Move `REGISTRATION_INVITE_CODE` to `wrangler secret` | DevOps |

### High Priority (Address Within 2 Weeks)

| # | Action | Owner |
|---|--------|-------|
| 6 | Hash MFA backup codes before storage | Engineering |
| 7 | Add `npm audit` and SAST scanning to CI/CD | DevOps |
| 8 | Increase Docker backup retention to 2,190 days | DevOps |
| 9 | Add DOMPurify to sanitize AI-generated HTML | Engineering |
| 10 | Use scoped Cloudflare API tokens per resource type | DevOps |
| 11 | Add required env var validation to Docker entrypoint | DevOps |

### Medium Priority (Address Within 30 Days)

| # | Action | Owner |
|---|--------|-------|
| 12 | Pin wrangler to exact version (`3.99.0`, not `^3.99.0`) | Engineering |
| 13 | Restrict CORS pattern to specific production domains | DevOps |
| 14 | Add centralized logging to Docker on-prem deployment | DevOps |
| 15 | Add NOT NULL constraints to critical DB columns | Engineering |
| 16 | Secure Ollama endpoint with authentication | DevOps |

### Integration Roadmap

| Phase | Work Item | Effort |
|-------|-----------|--------|
| 1 | Integrate dashboard prototype into main frontend as `/reporter` route | 2-3 days |
| 2 | Replace Zustand mock store with real API calls to Cloudflare Workers | 1-2 days |
| 3 | Migrate Gemini AI calls to Cloudflare Workers AI endpoint | 1 day |
| 4 | Add JWT auth guards to reporter routes | 0.5 day |
| 5 | Load full control catalog from D1 instead of mock 26 controls | 0.5 day |
| 6 | Add DOMPurify for AI HTML sanitization | 0.5 day |
| 7 | Connect PDF export to real OSCAL data from D1 | 0.5 day |

---

## 9. Remediation Tracker

| Finding ID | Severity | Status | Fixed In |
|-----------|----------|--------|----------|
| D-1 | CRITICAL | Open | — |
| D-2 | CRITICAL | Open | — |
| D-3 | HIGH | Open | — |
| D-4 | HIGH | Open | — |
| D-5 | MEDIUM | Open | — |
| D-6 | LOW | Open | — |
| C-1 | HIGH | Accepted Risk | — |
| C-2 | HIGH | **Fixed** | This PR |
| C-3 | MEDIUM | Open | — |
| C-4 | LOW | Open | — |
| C-5 | CRITICAL | **Fixed** | This PR |
| DB-1 | HIGH | Open | — |
| DB-2 | MEDIUM | Open | — |
| DB-3 | MEDIUM | Open | — |
| CI-1 | CRITICAL | Open | — |
| CI-2 | HIGH | **Fixed** | This PR |
| CI-3 | HIGH | Open | — |
| CI-4 | MEDIUM | **Fixed** | This PR |
| D-7 | HIGH | **Fixed** | This PR |
| D-8 | HIGH | Open | — |
| D-9 | MEDIUM | Open | — |
| D-10 | MEDIUM | Open | — |
