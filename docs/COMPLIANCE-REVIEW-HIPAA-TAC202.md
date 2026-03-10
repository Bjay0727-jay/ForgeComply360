# ForgeComply 360 — Production Release Compliance Review

## HIPAA Security Rule (45 CFR 164.312) & Texas Cybersecurity Framework (TAC 202)

**Prepared for:** Forge Cyber Defense (SDVOSB)
**Application:** ForgeComply 360 v5.0.0 — Enterprise GRC Platform
**Review Date:** 2026-02-08
**Reviewer:** Automated Compliance Analysis via Claude Code
**Classification:** Internal — Pre-Release Assessment

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [HIPAA Technical Safeguards Review](#2-hipaa-technical-safeguards-review)
3. [HIPAA Administrative Safeguards Review](#3-hipaa-administrative-safeguards-review)
4. [Texas Cybersecurity Framework (TAC 202) Review](#4-texas-cybersecurity-framework-tac-202-review)
5. [Critical Findings](#5-critical-findings)
6. [High-Priority Findings](#6-high-priority-findings)
7. [Medium-Priority Findings](#7-medium-priority-findings)
8. [Low-Priority / Informational Findings](#8-low-priority--informational-findings)
9. [Production Readiness Checklist](#9-production-readiness-checklist)
10. [Recommendations Summary](#10-recommendations-summary)

---

## 1. Executive Summary

ForgeComply 360 is an enterprise GRC platform built on Cloudflare Workers (edge computing), D1 database, R2 object storage, and a React SPA frontend. It supports multiple compliance frameworks including NIST 800-53, FedRAMP, CMMC, HIPAA, and others.

This review evaluates the platform's own compliance posture for organizations subject to **HIPAA** (healthcare covered entities and business associates) and the **Texas Administrative Code Chapter 202** (TAC 202) cybersecurity framework. The review assesses whether ForgeComply 360 itself can be deployed in environments bound by these regulations.

### Overall Assessment

| Area | Rating | Summary |
|------|--------|---------|
| Authentication & Access Control | **Strong** | RBAC, MFA/TOTP, account lockout, session management |
| Audit Logging | **Strong** | Comprehensive audit trail with IP, user-agent, change deltas |
| Input Validation | **Strong** | Parameterized queries, server-side validation |
| Encryption in Transit | **Strong** | TLS enforced via Cloudflare edge, HSTS enabled |
| Encryption at Rest | **Needs Attention** | Database-level encryption not application-managed; relies on platform |
| Password Security | **Needs Attention** | Inconsistent minimums; no complexity requirements |
| JWT Secret Management | **Critical Gap** | Hardcoded fallback secret in production code path |
| Data Backup & Recovery | **Needs Attention** | No documented backup/DR procedures |
| Incident Response | **Not Implemented** | No automated breach notification or IR workflow |
| Content Security Policy | **Needs Attention** | `unsafe-inline` and `unsafe-eval` weaken CSP |
| Emergency Access Procedures | **Not Implemented** | No break-glass access mechanism for ePHI systems |

**Critical findings requiring remediation before production release: 3**
**High-priority findings: 6**
**Medium-priority findings: 7**
**Low/Informational findings: 5**

---

## 2. HIPAA Technical Safeguards Review

### 2.1 Access Controls — 45 CFR 164.312(a)(1)

#### 2.1.1 Unique User Identification (REQUIRED) — PASS

**Status:** Compliant

The system assigns unique identifiers to all users via `lower(hex(randomblob(16)))` UUIDs. Each user record contains a unique email address (enforced via `UNIQUE` constraint in `schema.sql:53`). User actions are tracked via `user_id` in audit logs. No shared accounts are supported by the architecture.

**Evidence:**
- `database/schema.sql:50-67` — Users table with unique ID and email
- `workers/index.js:783-797` — Audit log captures `user_id` on every action
- `workers/index.js:581-583` — `sanitizeUser()` strips sensitive fields from responses

#### 2.1.2 Emergency Access Procedures (REQUIRED) — FAIL

**Status:** Non-Compliant

**Finding ID: HIPAA-001 (Critical)**

There is no "break-glass" emergency access mechanism. If a system administrator is locked out (e.g., MFA device lost, all admin accounts locked), there is no documented or implemented emergency access procedure. HIPAA requires tested procedures for obtaining necessary ePHI during emergencies.

**Recommendation:**
- Implement an emergency access ("break-glass") endpoint or process with enhanced audit logging
- Document emergency access procedures including authorization requirements
- Ensure emergency access events are prominently flagged in audit logs
- Test emergency procedures periodically

#### 2.1.3 Automatic Logoff (ADDRESSABLE) — PASS

**Status:** Compliant

Session idle timeout is implemented on the frontend via `useIdleTimeout()` hook with configurable timeout periods (15, 30, 60 minutes). A 30-second warning modal displays before automatic logout. Server-side, JWT tokens expire after 60 minutes.

**Evidence:**
- `frontend/src/hooks/useIdleTimeout.ts` — Idle timeout implementation
- `workers/index.js:590` — JWT expiration set to 60 minutes

#### 2.1.4 Encryption and Decryption (ADDRESSABLE) — PARTIAL

**Status:** Partially Compliant — see Finding HIPAA-002

**Finding ID: HIPAA-002 (High)**

Encryption at rest is not application-managed. The system relies on Cloudflare D1's platform-level encryption (SQLite on Cloudflare infrastructure) and R2's server-side encryption. While Cloudflare encrypts data at rest on their infrastructure, the application does not implement field-level encryption for sensitive data (e.g., `mfa_secret`, `mfa_backup_codes`). The MFA secrets are stored in plaintext in the database.

For on-premises Docker deployments, the SQLite database file (`/data`) is stored unencrypted on the host filesystem.

**Recommendation:**
- Implement field-level encryption for sensitive columns (`mfa_secret`, `mfa_backup_codes`)
- For Docker/on-prem: require encrypted filesystem or volume encryption, document this requirement
- Document the encryption-at-rest posture including Cloudflare's platform encryption
- If storing ePHI, implement AES-256 field-level encryption for PHI data elements

---

### 2.2 Audit Controls — 45 CFR 164.312(b) (REQUIRED)

**Status:** Largely Compliant

The system implements comprehensive audit logging via the `audit_logs` table and `auditLog()` function (`workers/index.js:783`). Logged events include:

- User lifecycle: register, login, login_mfa_pending, password changes, MFA enable/disable
- Data operations: create, update, delete across all resource types
- Framework and control operations
- Evidence uploads with file metadata
- Role changes and account actions (lock/unlock/deactivate)
- IP address and user-agent captured from request headers

**Finding ID: HIPAA-003 (Medium)**

**Gaps identified:**
1. **No log immutability controls** — Audit logs can be deleted by anyone with database access. There is no write-once / append-only enforcement.
2. **No automated alerting** — No mechanism to alert on suspicious patterns (mass record access, after-hours activity, failed login spikes).
3. **No log retention policy** — No automated log retention, rotation, or archival process defined.
4. **No log export** — Audit logs are queryable via API but there is no SIEM integration or log export functionality.
5. **Read access logging** — Read/view operations on sensitive data (evidence downloads, user record views) are not consistently logged.

**Recommendation:**
- Implement log integrity controls (append-only, hash chaining)
- Add automated alerting for anomalous access patterns
- Define and implement a log retention policy (minimum 6 years for HIPAA)
- Add SIEM integration or log export capability
- Log all read operations on sensitive resources

---

### 2.3 Integrity Controls — 45 CFR 164.312(c)(1)

#### 2.3.1 Mechanism to Authenticate ePHI (ADDRESSABLE) — PASS

**Status:** Compliant for evidence files

Evidence files are hashed with SHA-256 on upload (`workers/index.js:2212-2213`) and the hash is stored in `evidence.sha256_hash`. This allows detection of unauthorized modifications.

**Gap:** No integrity verification is performed on evidence download — the hash is stored but there is no re-verification endpoint or scheduled integrity check.

**Recommendation:**
- Add an integrity verification check on evidence download/access
- Implement scheduled integrity scanning of the evidence vault

---

### 2.4 Person or Entity Authentication — 45 CFR 164.312(d) (REQUIRED)

**Status:** Compliant

Authentication is implemented through multiple mechanisms:
- Password-based authentication with PBKDF2-SHA256 (100,000 iterations) — `workers/index.js:650-667`
- Multi-Factor Authentication via TOTP with backup codes — `workers/index.js:694-738`
- Timing-safe comparison for TOTP verification — `workers/index.js:740`
- Account lockout after 5 failed attempts (15-minute lockout) — `workers/index.js:1099-1102`
- Refresh token rotation with hash-based storage — `workers/index.js:1056-1058`

**Finding ID: HIPAA-004 (High) — See Critical Findings section for JWT secret issue**

---

### 2.5 Transmission Security — 45 CFR 164.312(e)(1)

#### 2.5.1 Integrity Controls (ADDRESSABLE) — PASS

**Status:** Compliant

All traffic is served over HTTPS via Cloudflare's edge network. HSTS is enabled with `max-age=31536000; includeSubDomains` (`workers/index.js:50`). Webhook deliveries include HMAC-SHA256 signatures for payload integrity verification.

#### 2.5.2 Encryption (ADDRESSABLE) — PASS (Cloud) / PARTIAL (On-Prem)

**Status:** Compliant for cloud deployment

Cloud deployment enforces TLS via Cloudflare. However, the Docker/on-prem deployment (`docker-compose.yml:22`) exposes the API on plain HTTP (port 8787) and the frontend on port 80. No TLS termination is configured in the nginx or Docker setup.

**Finding ID: HIPAA-005 (High)**

**Recommendation:**
- Docker deployment must include TLS termination (add TLS to nginx configuration or require a reverse proxy)
- Document minimum TLS version requirement (TLS 1.2+)
- Add TLS configuration templates for on-prem deployments

---

## 3. HIPAA Administrative Safeguards Review (Software-Relevant)

### 3.1 Security Management Process — 164.308(a)(1)

#### Information System Activity Review (REQUIRED) — PARTIAL

The audit log API (`GET /api/v1/audit-log`) enables activity review. However, there are no built-in dashboards for security-focused log analysis, no automated review cadence enforcement, and no escalation workflow for suspicious activity.

### 3.2 Workforce Security — 164.308(a)(3)

#### Termination Procedures (ADDRESSABLE) — PARTIAL

**Finding ID: HIPAA-006 (Medium)**

User deactivation exists (`handleDeactivateUser`) but:
- Deactivated users' refresh tokens are not explicitly revoked on deactivation
- No API key revocation mechanism exists
- No automated offboarding workflow

**Recommendation:**
- Revoke all active tokens immediately upon user deactivation
- Add an explicit session termination step to deactivation flow

### 3.3 Contingency Plan — 164.308(a)(7)

#### Data Backup Plan (REQUIRED) — NOT ADDRESSED

**Finding ID: HIPAA-007 (High)**

No backup, disaster recovery, or business continuity documentation or tooling is present in the codebase. For Cloudflare D1, backups rely entirely on Cloudflare's infrastructure. For on-prem Docker deployments, the data volume (`forge-data`) has no backup automation.

**Recommendation:**
- Document Cloudflare D1's backup and recovery capabilities
- Implement automated backup for on-prem deployments
- Create and test a disaster recovery plan
- Document Recovery Time Objective (RTO) and Recovery Point Objective (RPO)
- Implement R2 bucket versioning for evidence vault

### 3.4 Business Associate Agreements — 164.308(b)(1)

**Note:** If ForgeComply 360 is used by healthcare organizations to manage HIPAA compliance, Forge Cyber Defense may be operating as a Business Associate. This requires:
- A BAA with Cloudflare (as a subcontractor)
- BAA templates for customers
- Documented security incident notification procedures

---

## 4. Texas Cybersecurity Framework (TAC 202) Review

TAC 202 mandates implementation of the DIR Security Control Standards Catalog (based on NIST 800-53r5). ForgeComply 360 is evaluated below against the key TAC 202 control families.

### 4.1 Access Control (AC) — Largely Compliant

| Control | Status | Notes |
|---------|--------|-------|
| AC-2 Account Management | **Pass** | RBAC with 5 role levels, account lifecycle management |
| AC-3 Access Enforcement | **Pass** | Per-endpoint role checks, org_id isolation |
| AC-7 Unsuccessful Logon Attempts | **Pass** | Lockout after 5 failures, 15-min cooldown |
| AC-8 System Use Notification | **Fail** | No login banner / system use notification |
| AC-11 Session Lock | **Pass** | Idle timeout with configurable periods |
| AC-12 Session Termination | **Pass** | JWT expiration + manual logout + token revocation |
| AC-17 Remote Access | **Pass** | HTTPS-only, MFA available |

**Finding ID: TAC-001 (Medium)**
- **AC-8 System Use Notification:** No login banner or Terms of Use acknowledgment is presented. TAC 202 (via NIST AC-8) requires a system use notification before granting access.

### 4.2 Audit and Accountability (AU) — Partially Compliant

| Control | Status | Notes |
|---------|--------|-------|
| AU-2 Event Logging | **Pass** | Comprehensive event types logged |
| AU-3 Content of Audit Records | **Pass** | Who, what, when, where (IP), how (user-agent) |
| AU-6 Audit Review, Analysis, Reporting | **Partial** | Logs viewable but no analysis/alerting |
| AU-9 Protection of Audit Information | **Fail** | No immutability or integrity controls on logs |
| AU-11 Audit Record Retention | **Fail** | No retention policy defined |
| AU-12 Audit Generation | **Pass** | System-wide audit generation at API layer |

**Finding ID: TAC-002 (High)** — Same as HIPAA-003. Audit logs lack immutability protection and retention policies.

### 4.3 Identification and Authentication (IA) — Partially Compliant

| Control | Status | Notes |
|---------|--------|-------|
| IA-2 Identification and Authentication | **Pass** | Email/password + optional MFA |
| IA-2(1) MFA for Privileged Accounts | **Partial** | MFA available but not enforced for admin/owner roles |
| IA-5 Authenticator Management | **Partial** | Password policies exist but are weak |
| IA-5(1) Password-based Authentication | **Partial** | See Finding TAC-003 |
| IA-11 Re-authentication | **Pass** | Session expiration forces re-auth |

**Finding ID: TAC-003 (High)**

Password policy is inconsistent and below TAC 202 / NIST 800-53 standards:
- Registration requires 12 characters minimum (`workers/index.js:1026`)
- Password change only requires 8 characters (`workers/index.js:1176`) — **inconsistent**
- No password complexity requirements (uppercase, lowercase, digit, special character)
- No password history enforcement (users can cycle back to previous passwords)
- No compromised password checking (e.g., Have I Been Pwned integration)

**Finding ID: TAC-004 (Medium)**
MFA is optional for all role levels including `admin` and `owner`. TAC 202 via NIST IA-2(1) requires MFA for privileged accounts.

**Recommendation:**
- Enforce consistent 12+ character minimum across all password operations
- Add password complexity rules or adopt NIST 800-63B guidance (length-based, check against breached lists)
- Enforce MFA for admin and owner roles
- Add password history tracking to prevent reuse

### 4.4 System and Communications Protection (SC) — Partially Compliant

| Control | Status | Notes |
|---------|--------|-------|
| SC-8 Transmission Confidentiality | **Pass** | TLS via Cloudflare |
| SC-13 Cryptographic Protection | **Pass** | PBKDF2, HMAC-SHA256, SHA-256 |
| SC-28 Protection of Information at Rest | **Partial** | Platform-managed, not application-managed |

### 4.5 Configuration Management (CM) — Partially Compliant

| Control | Status | Notes |
|---------|--------|-------|
| CM-2 Baseline Configuration | **Partial** | Wrangler config exists but no hardening baseline documented |
| CM-3 Configuration Change Control | **Pass** | Git-based change control, CI/CD pipeline |
| CM-6 Configuration Settings | **Partial** | No documented security configuration standards |
| CM-8 Information System Component Inventory | **Partial** | Package.json tracks dependencies but no SBOM |

**Finding ID: TAC-005 (Medium)**
No Software Bill of Materials (SBOM) is generated. TAC 202's Supply Chain Risk Management (SR) family and DIR guidance recommend SBOM generation for software assurance.

### 4.6 Incident Response (IR) — Not Implemented

**Finding ID: TAC-006 (High)**

No incident response capabilities exist in the application:
- No security incident detection or classification
- No automated notification to administrators on security events
- No incident tracking or management workflow
- TAC 202 requires reporting security incidents to DIR within 48 hours

**Recommendation:**
- Implement automated security event detection (brute force, anomalous access patterns)
- Add incident classification and tracking capability
- Create automated notification workflow for security events
- Document incident response procedures meeting TAC 202's 48-hour DIR notification requirement

### 4.7 Risk Assessment (RA) — Supported by Platform

ForgeComply 360 includes a risk register (RiskForge ERM module) that supports risk assessment workflows. This satisfies TAC 202 RA controls for the platform's users, though a risk assessment of ForgeComply 360 itself should be documented.

### 4.8 Security Awareness and Training (AT)

**Finding ID: TAC-007 (Low)**

The platform includes policy attestation workflows (`policy_attestations` table) which can support security awareness tracking. However, there is no built-in training module or integration with DIR-certified cybersecurity training programs as required by TAC 202.

### 4.9 Contingency Planning (CP) — Not Addressed

Same finding as HIPAA-007. No backup, DR, or business continuity plans documented.

---

## 5. Critical Findings

### CRIT-001: Hardcoded JWT Secret Fallback

**Severity:** CRITICAL
**HIPAA:** 164.312(d) — Authentication
**TAC 202:** IA-5 — Authenticator Management
**Location:** `workers/index.js:569, 1055, 1114, 1119, 1156, 1234, 1267`

The JWT signing secret has a hardcoded fallback value `'dev-secret-change-me'` throughout the codebase:

```javascript
env.JWT_SECRET || 'dev-secret-change-me'
```

If the `JWT_SECRET` environment variable is not set (misconfiguration, failed deployment, secret rotation error), the system silently falls back to a publicly known secret. Any attacker who discovers this can forge valid JWT tokens and gain full access to any account.

**Risk:** Complete authentication bypass, full data compromise
**Impact:** All tenant data, all user accounts, full API access

**Remediation (MUST before production):**
1. Remove the fallback entirely — fail hard if `JWT_SECRET` is not set
2. Add a startup validation that verifies `JWT_SECRET` is present and meets minimum entropy requirements (64+ characters)
3. Audit all environments to confirm `JWT_SECRET` is properly configured
4. Consider rotating the current production secret

### CRIT-002: Missing Emergency Access Procedures (HIPAA Required)

See HIPAA-001 above. This is a required HIPAA implementation specification with no implementation.

### CRIT-003: Password Change Minimum Length Inconsistency

**Severity:** CRITICAL (data integrity issue)
**Location:** `workers/index.js:1176`

Registration enforces 12-character minimum, but password change only enforces 8 characters. A user can register with a 12-character password and then immediately change it to an 8-character password, defeating the registration policy.

**Remediation:**
- Change `workers/index.js:1176` to enforce the same 12-character minimum
- Consolidate password policy into a single validation function

---

## 6. High-Priority Findings

| ID | Finding | Framework | Remediation |
|----|---------|-----------|-------------|
| HIPAA-002 | MFA secrets stored unencrypted in database | 164.312(a)(1) | Implement field-level encryption for sensitive columns |
| HIPAA-005 | Docker/on-prem deployment has no TLS | 164.312(e)(1) | Add TLS to nginx config, document TLS requirements |
| HIPAA-007 | No backup or disaster recovery plan | 164.308(a)(7) | Document and implement backup/DR procedures |
| TAC-002 | Audit logs lack immutability and retention | AU-9, AU-11 | Add write-once controls, define retention policy |
| TAC-003 | Weak and inconsistent password policies | IA-5 | Enforce 12+ chars, add complexity, prevent reuse |
| TAC-006 | No incident response capability | IR-1 through IR-8 | Implement detection, alerting, and IR workflows |

---

## 7. Medium-Priority Findings

| ID | Finding | Framework | Remediation |
|----|---------|-----------|-------------|
| HIPAA-003 | Audit logging gaps (no alerting, retention, SIEM) | 164.312(b) | Implement alerting, retention, export capabilities |
| HIPAA-006 | Token revocation gap on user deactivation | 164.308(a)(3) | Revoke all tokens on deactivation |
| TAC-001 | No system use notification / login banner | AC-8 | Add configurable login banner |
| TAC-004 | MFA not enforced for privileged accounts | IA-2(1) | Require MFA for admin/owner roles |
| TAC-005 | No SBOM generation | SR family | Add SBOM generation to CI/CD pipeline |
| CSP-001 | CSP includes `unsafe-inline` and `unsafe-eval` | SC-18 | Refactor to use nonce-based CSP |
| DOCKER-001 | Docker JWT fallback `change-this-in-production` | IA-5 | Fail on missing secrets, remove defaults |

---

## 8. Low-Priority / Informational Findings

| ID | Finding | Framework | Remediation |
|----|---------|-----------|-------------|
| TAC-007 | No built-in security training integration | AT-2 | Consider DIR training program integration |
| INFO-001 | Refresh token uses fixed salt `'refresh-salt'` | IA-5 | Use unique per-token salts for refresh token hashing |
| INFO-002 | No API versioning sunset plan | CM-3 | Document API lifecycle and deprecation policy |
| INFO-003 | `wrangler.toml` exposes D1 database ID and KV namespace ID | CM-6 | Move to environment-specific secrets where possible |
| INFO-004 | No Content-Security-Policy `report-uri` | SI-4 | Add CSP violation reporting endpoint |

---

## 9. Production Readiness Checklist

### Must Fix Before Release (Blockers)

- [ ] **CRIT-001:** Remove hardcoded JWT secret fallback; fail on missing secret
- [ ] **CRIT-002:** Document and implement emergency access procedures
- [ ] **CRIT-003:** Fix password change to enforce 12-character minimum
- [ ] **HIPAA-005:** Add TLS configuration for Docker/on-prem deployments
- [ ] **HIPAA-007:** Document backup/DR procedures (at minimum, document Cloudflare D1/R2 guarantees)

### Should Fix Before Release (High Priority)

- [ ] **HIPAA-002:** Encrypt MFA secrets at rest (field-level encryption)
- [ ] **TAC-003:** Implement consistent password policy with complexity requirements
- [ ] **TAC-006:** Add basic security event alerting (failed login spikes, account lockouts)
- [ ] **TAC-002:** Implement audit log retention policy and integrity controls
- [ ] **HIPAA-006:** Revoke tokens on user deactivation
- [ ] **TAC-004:** Enforce MFA for admin and owner roles

### Should Fix Post-Release (Medium Priority)

- [ ] **TAC-001:** Add login banner / system use notification
- [ ] **TAC-005:** Generate SBOM in CI/CD
- [ ] **CSP-001:** Migrate to nonce-based CSP, remove `unsafe-inline` and `unsafe-eval`
- [ ] **HIPAA-003:** Implement SIEM integration or log export
- [ ] **INFO-001:** Use unique salts for refresh token hashing
- [ ] **INFO-004:** Add CSP violation reporting

---

## 10. Recommendations Summary

### Immediate Actions (Pre-Release)

1. **Harden JWT configuration** — Remove all `|| 'dev-secret-change-me'` fallbacks. Add startup validation.
2. **Fix password validation** — Unify to 12-character minimum across registration and password change.
3. **Add TLS to Docker** — Configure nginx for TLS termination with certificate mounting.
4. **Document backup/DR** — At minimum, document Cloudflare's platform guarantees and on-prem backup procedures.
5. **Implement emergency access** — Create a documented break-glass procedure.

### Short-Term Actions (Within 30 Days Post-Release)

6. **Encrypt sensitive fields** — AES-256 encryption for `mfa_secret`, `mfa_backup_codes`, and any future PHI fields.
7. **Enforce MFA for privileged roles** — Make MFA mandatory for admin and owner accounts.
8. **Implement security alerting** — Automated alerts for brute-force attempts, mass data access, and privilege escalation.
9. **Audit log integrity** — Add hash-chaining or WORM-style protection for audit records.
10. **Token lifecycle** — Immediately revoke all tokens on user deactivation; add unique per-token salts.

### Medium-Term Actions (Within 90 Days)

11. **SBOM generation** — Integrate CycloneDX or SPDX into the CI/CD pipeline.
12. **CSP hardening** — Remove `unsafe-inline` and `unsafe-eval` from Content-Security-Policy.
13. **Login banner** — Add configurable system use notification compliant with NIST AC-8.
14. **Incident response workflow** — Build IR tracking and automated DIR notification capability (48-hour requirement under TAC 202).
15. **Log retention automation** — Implement automated log archival with defined retention periods.

### Architectural Considerations

- **BAA readiness** — If marketing to healthcare, ensure a BAA with Cloudflare is in place and BAA templates are available for customers.
- **TX-RAMP** — If serving Texas state agencies, ForgeComply 360's cloud deployment must undergo TX-RAMP certification.
- **FedRAMP** — Cloud deployment on Cloudflare would need to assess Cloudflare's FedRAMP authorization status for federal customers.
- **Data residency** — Document where data is stored (Cloudflare edge locations, R2 region) for customers with data sovereignty requirements.

---

## Appendix A: Files Reviewed

| File | Purpose |
|------|---------|
| `workers/index.js` | Complete API (10,609 lines) — auth, routes, security |
| `database/schema.sql` | Database schema (35 tables, 750 lines) |
| `wrangler.toml` | Cloudflare Worker configuration |
| `docker/docker-compose.yml` | On-premises deployment |
| `.github/workflows/deploy.yml` | CI/CD pipeline |
| `frontend/src/App.tsx` | Frontend routing and auth context |
| `frontend/src/utils/api.ts` | API client with token refresh |
| `frontend/src/hooks/useIdleTimeout.ts` | Session idle timeout |

## Appendix B: Framework References

- **HIPAA Security Rule:** 45 CFR Part 164, Subpart C (164.302-164.318)
- **TAC 202:** Texas Administrative Code, Title 1, Part 10, Chapter 202
- **DIR Security Control Standards Catalog v2.1** (based on NIST SP 800-53r5)
- **NIST SP 800-63B:** Digital Identity Guidelines — Authentication and Lifecycle Management
- **NIST SP 800-111:** Guide to Storage Encryption Technologies for End User Devices
- **NIST SP 800-52 Rev. 2:** Guidelines for TLS Implementations

---

*This document should be reviewed by qualified compliance personnel and legal counsel before use in any regulatory submission. Automated analysis may not capture all compliance requirements specific to your organization's deployment context.*
