# ForgeComply 360 — Authentication Options Review & Recommendation

**Prepared for:** Forge Cyber Defense (SDVOSB)
**Application:** ForgeComply 360 v5.0.0 — Enterprise GRC Platform
**Review Date:** 2026-03-01
**Classification:** Internal — Architecture Decision Record
**Status:** Draft for Leadership Review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Authentication Architecture](#2-current-authentication-architecture)
3. [Option A: SAML 2.0 Enterprise SSO](#3-option-a-saml-20-enterprise-sso)
4. [Option B: OpenID Connect (OIDC) / OAuth 2.0](#4-option-b-openid-connect-oidc--oauth-20)
5. [Option C: PKI + CAC/PIV Certificate Authentication](#5-option-c-pki--cacpiv-certificate-authentication)
6. [Option D: Xiid Zero-Knowledge Authentication](#6-option-d-xiid-zero-knowledge-authentication)
7. [Comparative Analysis Matrix](#7-comparative-analysis-matrix)
8. [NIST 800-53 IA Control Mapping](#8-nist-800-53-ia-control-mapping)
9. [Recommended Phased Implementation Roadmap](#9-recommended-phased-implementation-roadmap)
10. [Database & Schema Impact](#10-database--schema-impact)
11. [Risk Assessment](#11-risk-assessment)
12. [Appendices](#12-appendices)

---

## 1. Executive Summary

### Purpose

This document evaluates authentication enhancement options for ForgeComply 360 to meet the requirements of federal, defense, healthcare, and enterprise compliance frameworks. The platform currently serves organizations subject to NIST 800-53, FedRAMP (Moderate/High), CMMC Level 3, HIPAA, TAC 202, and DoD IL5 — each with specific authentication mandates.

### Current State

ForgeComply 360 implements **JWT bearer token authentication with PBKDF2-SHA384 password hashing and optional TOTP MFA**. This provides a solid commercial-grade authentication foundation that satisfies NIST SP 800-63-3 AAL1 (without MFA) and AAL2 (with TOTP MFA enabled).

### Gap Analysis

| Requirement | Current State | Gap |
|------------|---------------|-----|
| Enterprise SSO (SAML/OIDC) | Not implemented | Enterprise customers cannot federate identity |
| Federated Identity (IA-8) | Not implemented | No cross-organization authentication |
| PIV/CAC Acceptance (IA-2(12)) | Not implemented | Cannot accept federal PIV credentials |
| PKI-Based Authentication (IA-5(2)) | Not implemented | No certificate-based authentication |
| MFA Enforcement for Privileged Accounts | Soft recommendation only | Admin/owner roles can bypass MFA |
| AAL3 Authentication | Not available | No hardware-bound authenticator support |

### Recommendation Summary

| Option | Compliance Value | Effort | Priority | Recommendation |
|--------|-----------------|--------|----------|----------------|
| **OIDC / OAuth 2.0** | FedRAMP, CMMC, HIPAA, enterprise SSO | 4-6 weeks | **Phase 2** | Implement first — lowest complexity, highest ROI |
| **SAML 2.0** | FedRAMP, enterprise legacy IdPs | 6-8 weeks | **Phase 3** | Implement second — required by enterprise customers using ADFS/legacy |
| **PKI + CAC/PIV** | FedRAMP High, DoD IL5, HSPD-12 | 8-12 weeks | **Phase 4** | Implement third — mandatory for DoD market entry |
| **Xiid ZKP Auth** | AAL3, quantum-resistant | Parallel | **Phase 5** | Enable when Xiid integration matures |

**Immediate action (Phase 1):** Harden MFA enforcement from soft recommendation to hard requirement for admin/owner roles.

---

## 2. Current Authentication Architecture

### 2.1 Authentication Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    CURRENT AUTHENTICATION FLOW                            │
│                                                                           │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────┐                  │
│  │  Browser  │────▶│  Login Page  │────▶│  POST /auth  │                  │
│  │   (SPA)   │     │  (React)     │     │  /login      │                  │
│  └──────────┘     └──────────────┘     └──────┬───────┘                  │
│                                                │                          │
│                           ┌────────────────────┼────────────────┐         │
│                           ▼                    ▼                ▼         │
│                   ┌──────────────┐   ┌──────────────┐  ┌────────────┐    │
│                   │  Verify      │   │  Account     │  │  Rate      │    │
│                   │  Password    │   │  Lockout     │  │  Limit     │    │
│                   │  (PBKDF2)    │   │  Check       │  │  Check     │    │
│                   └──────┬───────┘   └──────────────┘  └────────────┘    │
│                          │                                                │
│                  ┌───────┴────────┐                                       │
│                  ▼                ▼                                       │
│          ┌──────────────┐ ┌──────────────┐                               │
│          │  MFA Enabled │ │  No MFA      │                               │
│          │  → TOTP      │ │  → JWT Token │                               │
│          │    Challenge │ │    Issued    │                               │
│          └──────┬───────┘ └──────────────┘                               │
│                 ▼                                                         │
│          ┌──────────────┐                                                │
│          │  Verify TOTP │                                                │
│          │  or Backup   │                                                │
│          │  Code        │                                                │
│          └──────┬───────┘                                                │
│                 ▼                                                         │
│          ┌──────────────┐     ┌──────────────┐                           │
│          │  JWT Access  │     │  Refresh     │                           │
│          │  Token (1hr) │     │  Token (7d)  │                           │
│          └──────────────┘     └──────────────┘                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 What's Already Implemented

| Feature | Implementation | Evidence |
|---------|---------------|----------|
| **JWT Tokens** | HS384 (HMAC-SHA384), 60-min access, 7-day refresh | `workers/index.js:745-794` |
| **Password Hashing** | PBKDF2-SHA384, 100K iterations, per-user salt | `workers/index.js:837-855` |
| **TOTP MFA** | 6-digit TOTP, backup codes, AES-GCM encrypted secrets | `workers/index.js:1003-1079` |
| **Account Lockout** | 5 failed attempts → 15-minute lockout | `workers/index.js:1503-1519` |
| **Rate Limiting** | 10 req/min per IP for auth endpoints, KV-backed | `workers/index.js:236-239` |
| **Brute Force Detection** | 10+ failed logins/hour → security incident | CRON-triggered analysis |
| **Password Policy** | 12+ chars, complexity rules, NIST SP 800-63B compliant | `workers/index.js:877-888` |
| **Breach Check** | Have I Been Pwned k-Anonymity API | `workers/index.js` |
| **Password History** | Last 12 passwords tracked | `database/schema.sql` |
| **Emergency Access** | Break-glass endpoint with audit trail | `workers/index.js` |
| **RBAC** | 5 roles: viewer, analyst, manager, admin, owner | `database/schema.sql:57` |
| **Session Timeout** | Configurable (15/30/60 min), idle detection | `frontend/src/hooks/useIdleTimeout.ts` |
| **System Use Banner** | NIST AC-8 / TAC 202 login banner | `frontend/src/pages/LoginPage.tsx:137-140` |

### 2.3 NIST SP 800-63-3 Assessment

| Level | Current | With TOTP MFA | Target |
|-------|---------|---------------|--------|
| **IAL** (Identity Assurance) | IAL1 (self-asserted) | IAL1 | IAL2+ (with IdP proofing) |
| **AAL** (Authenticator Assurance) | AAL1 (password only) | AAL2 (password + TOTP) | AAL3 (hardware-bound) |
| **FAL** (Federation Assurance) | N/A (no federation) | N/A | FAL2 (encrypted assertions) |

### 2.4 Key Gap: MFA Enforcement

The current implementation recommends but does not enforce MFA for privileged accounts:

```
workers/index.js:1544-1549:
  // TAC 202 / NIST IA-2(1): Flag MFA requirement for privileged accounts
  // Allows login but signals the frontend to prompt MFA setup
  const mfaSetupNeeded = ['admin', 'owner'].includes(user.role) && !user.mfa_enabled;
```

Admin/owner users receive `mfa_setup_recommended: true` in the login response but are **not blocked** from accessing the system without MFA. This fails NIST IA-2(1) enforcement requirements for FedRAMP Moderate and above.

---

## 3. Option A: SAML 2.0 Enterprise SSO

### 3.1 Protocol Overview

SAML 2.0 (Security Assertion Markup Language) is an XML-based open standard for exchanging authentication and authorization data between an Identity Provider (IdP) and a Service Provider (SP).

**Key Characteristics:**
- XML-based assertions with digital signatures
- SP-initiated and IdP-initiated SSO flows
- Attribute statements for role/group mapping
- Session management via SAML logout
- Metadata exchange for trust establishment

**Common Identity Providers:**
- Microsoft Entra ID (Azure AD) / ADFS
- Okta
- PingFederate / PingOne
- Shibboleth (open source, common in higher education and government)
- OneLogin

### 3.2 SP-Initiated SSO Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    SAML 2.0 SP-INITIATED SSO FLOW                         │
│                                                                           │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────────────┐          │
│  │  Browser  │────▶│  ForgeComply │────▶│  Generate SAML       │          │
│  │  (SPA)    │     │  Login Page  │     │  AuthnRequest        │          │
│  └──────────┘     └──────────────┘     └──────────┬───────────┘          │
│                                                    │                      │
│                                                    ▼                      │
│                                        ┌──────────────────────┐          │
│                                        │  Redirect to IdP     │          │
│                                        │  (SAML AuthnRequest) │          │
│                                        └──────────┬───────────┘          │
│                                                    │                      │
│                                                    ▼                      │
│                                        ┌──────────────────────┐          │
│                                        │  Identity Provider   │          │
│                                        │  - User authenticates│          │
│                                        │  - MFA at IdP level  │          │
│                                        │  - Returns SAML      │          │
│                                        │    Response/Assertion │          │
│                                        └──────────┬───────────┘          │
│                                                    │                      │
│                                                    ▼                      │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  ForgeComply API (SAML ACS Endpoint)                              │    │
│  │  1. Validate XML signature against IdP certificate                │    │
│  │  2. Verify assertion conditions (audience, time)                  │    │
│  │  3. Extract attributes (email, name, groups/roles)                │    │
│  │  4. JIT provision or match existing user                          │    │
│  │  5. Issue ForgeComply JWT access + refresh tokens                 │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Architecture by Deployment Mode

**Cloud (Cloudflare Workers):**
- Worker acts as SAML Service Provider
- IdP metadata stored in KV namespace
- XML signature verification via Web Crypto API
- Note: `fast-xml-parser` is already a dependency (`package.json:39`)
- Challenge: XML canonicalization and signature verification are complex in Workers

**Xiid + Hetzner (Production):**
- SAML SP behind Xiid SealedTunnel
- IdP accessible via SealedTunnel egress (or Xiid SSO as SAML proxy)
- Hetzner API server handles assertion processing

**On-Premises / Air-Gap:**
- Local IdP required (ADFS, Shibboleth, or Keycloak)
- IdP and SP on same network — no external connectivity needed
- Air-gap compatible with local IdP deployment
- Docker Compose extended to include local IdP container

### 3.4 NIST 800-53 Control Mapping

| Control | Requirement | SAML Coverage |
|---------|-------------|---------------|
| **IA-2** | Uniquely identify and authenticate users | Compliant — IdP provides unique identity assertions |
| **IA-2(1)** | MFA for privileged accounts | Conditional — depends on IdP MFA policy enforcement |
| **IA-2(2)** | MFA for non-privileged accounts | Conditional — depends on IdP MFA policy |
| **IA-2(6)** | Access separate device for MFA | Conditional — if IdP enforces hardware MFA |
| **IA-2(12)** | PIV credential acceptance | Not directly — but IdP can proxy PIV authentication |
| **IA-5** | Authenticator management | Offloaded to IdP — password policies managed centrally |
| **IA-8** | Non-organizational user auth | Compliant — SAML federation enables cross-org authentication |
| **IA-8(1)** | PIV credentials from other agencies | Not directly supported via SAML alone |
| **IA-12** | Identity proofing | Depends on IdP's IAL level |

### 3.5 Compliance Framework Assessment

| Framework | SAML Status | Notes |
|-----------|-------------|-------|
| **FedRAMP Moderate** | Acceptable | SAML is a recognized federation protocol |
| **FedRAMP High** | Acceptable | Must pair with IdP-enforced MFA |
| **CMMC Level 3** | Compliant | Satisfies AC.L2-3.1.1, AC.L2-3.1.3 with MFA |
| **HIPAA** | Acceptable | Unique user identification preserved |
| **DoD IL5** | Acceptable | CAC/PIV authentication is preferred; SAML can proxy |
| **TAC 202** | Compliant | Meets IA-2 requirements |

### 3.6 Implementation Considerations

**Effort:** 6-8 weeks

**Dependencies:**
- XML signature verification library or custom implementation
- `fast-xml-parser` (already in `package.json`) for XML parsing
- XML canonicalization (C14N) for signature verification
- IdP metadata management UI

**Risks:**
- XML signature wrapping attacks — must validate canonicalized XML
- Complex error handling for malformed SAML responses
- Clock skew between SP and IdP can cause assertion rejection
- Large SAML responses may exceed Cloudflare Workers memory limits

**Frontend Changes:**
- SSO button(s) on `LoginPage.tsx` with IdP discovery
- IdP selection for multi-tenant SSO
- SAML relay state handling

---

## 4. Option B: OpenID Connect (OIDC) / OAuth 2.0

### 4.1 Protocol Overview

OpenID Connect (OIDC) is an identity layer built on top of OAuth 2.0. It uses JSON Web Tokens (JWT) for identity assertions, making it a natural fit for ForgeComply 360's existing JWT-based architecture.

**Key Characteristics:**
- JSON/JWT-based (no XML complexity)
- Authorization Code flow with PKCE (Proof Key for Code Exchange)
- ID tokens carry identity claims
- UserInfo endpoint for additional profile data
- Discovery document (`.well-known/openid-configuration`) for auto-configuration

**Common Identity Providers:**
- Microsoft Entra ID (Azure AD)
- Okta / Auth0
- Google Workspace
- Keycloak (open source, self-hosted)
- Login.gov (federal civilian agency SSO)

### 4.2 Authorization Code + PKCE Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    OIDC AUTHORIZATION CODE + PKCE FLOW                    │
│                                                                           │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────────────┐          │
│  │  Browser  │────▶│  ForgeComply │────▶│  Generate PKCE       │          │
│  │  (SPA)    │     │  Login Page  │     │  code_verifier +     │          │
│  │           │     │  "SSO Login" │     │  code_challenge      │          │
│  └──────────┘     └──────────────┘     └──────────┬───────────┘          │
│                                                    │                      │
│                                                    ▼                      │
│                                        ┌──────────────────────┐          │
│                                        │  Redirect to IdP     │          │
│                                        │  /authorize endpoint │          │
│                                        │  + code_challenge    │          │
│                                        │  + state + nonce     │          │
│                                        └──────────┬───────────┘          │
│                                                    │                      │
│                                                    ▼                      │
│                                        ┌──────────────────────┐          │
│                                        │  Identity Provider   │          │
│                                        │  - User authenticates│          │
│                                        │  - MFA at IdP level  │          │
│                                        │  - Consent (if new)  │          │
│                                        │  - Returns auth code │          │
│                                        └──────────┬───────────┘          │
│                                                    │                      │
│                                                    ▼                      │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  ForgeComply API (OIDC Callback Endpoint)                         │    │
│  │  1. Validate state parameter (anti-CSRF)                          │    │
│  │  2. Exchange auth code + code_verifier for tokens at IdP          │    │
│  │  3. Validate ID token (signature, issuer, audience, nonce)        │    │
│  │  4. Extract claims (sub, email, name, groups)                     │    │
│  │  5. JIT provision or match existing user                          │    │
│  │  6. Issue ForgeComply JWT access + refresh tokens                 │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Architecture by Deployment Mode

**Cloud (Cloudflare Workers) — Best Fit:**
- Worker handles `/api/v1/auth/oidc/authorize` and `/api/v1/auth/oidc/callback`
- PKCE state stored in KV with short TTL
- ID token validation via JWKS (IdP's public keys)
- JSON-native protocol — no XML parsing complexity
- **Reference pattern:** ServiceNow OAuth2 implementation already exists at `workers/index.js:14103-14201`, providing a proven code pattern for OAuth state management, authorization URL generation, and token exchange within Cloudflare Workers

**Xiid + Hetzner (Production):**
- OIDC callback via Xiid SealedTunnel
- IdP token endpoint accessed via SealedTunnel egress
- Hetzner API server processes token exchange

**On-Premises / Air-Gap:**
- **Keycloak** added to Docker Compose stack as self-hosted OIDC provider
- Keycloak supports LDAP/Active Directory backend integration
- Fully air-gap compatible — no external IdP needed
- Keycloak also provides SAML bridge if needed

### 4.4 NIST 800-53 Control Mapping

| Control | Requirement | OIDC Coverage |
|---------|-------------|---------------|
| **IA-2** | Uniquely identify and authenticate users | Compliant — IdP provides unique `sub` claim |
| **IA-2(1)** | MFA for privileged accounts | Conditional — enforce via IdP `acr` claim or `amr` values |
| **IA-2(2)** | MFA for non-privileged accounts | Conditional — configurable at IdP level |
| **IA-2(6)** | Access separate device for MFA | Conditional — if IdP enforces hardware MFA |
| **IA-2(12)** | PIV credential acceptance | Not directly — but IdP can integrate PIV |
| **IA-5** | Authenticator management | Offloaded to IdP |
| **IA-8** | Non-organizational user auth | Compliant — OIDC federation with multiple IdPs |
| **IA-8(1)** | PIV from other agencies | Not directly via OIDC alone |
| **IA-12** | Identity proofing | Depends on IdP's IAL; Login.gov provides IAL2 |

### 4.5 Compliance Framework Assessment

| Framework | OIDC Status | Notes |
|-----------|-------------|-------|
| **FedRAMP Moderate** | Acceptable | OIDC is a recognized federation protocol |
| **FedRAMP High** | Acceptable | Must pair with IdP-enforced MFA |
| **CMMC Level 3** | Compliant | Satisfies MFA requirements |
| **HIPAA** | Acceptable | Preserves unique user identification |
| **DoD IL5** | Acceptable | Login.gov integration for civilian; CAC preferred for DoD |
| **TAC 202** | Compliant | Meets IA-2 requirements |

### 4.6 Implementation Considerations

**Effort:** 4-6 weeks (lowest among all options)

**Why OIDC First:**
1. JSON/JWT native — aligns with existing token infrastructure
2. PKCE provides SPA-friendly security without backend secrets
3. Existing OAuth2 pattern in codebase (ServiceNow connector) accelerates development
4. Login.gov uses OIDC — directly relevant for federal civilian customers
5. Keycloak provides free, battle-tested on-prem OIDC with SAML bridge
6. Simpler error handling than SAML XML

**Dependencies:**
- JWKS (JSON Web Key Set) verification for ID token validation
- PKCE code challenge/verifier generation (Web Crypto compatible)
- State management in KV (anti-CSRF)

**Risks:**
- Token validation must verify `at_hash`, nonce, and audience
- Clock skew handling for token expiration
- IdP discovery endpoint must be reachable (challenge for air-gap without Keycloak)

**Frontend Changes:**
- "Sign in with SSO" button on `LoginPage.tsx`
- IdP selection dropdown for multi-tenant organizations
- PKCE flow initiation from SPA
- Callback page to handle authorization code redirect

---

## 5. Option C: PKI + CAC/PIV Certificate Authentication

### 5.1 Protocol Overview

Public Key Infrastructure (PKI) certificate-based authentication uses X.509 digital certificates stored on hardware tokens for strong authentication. In the U.S. federal/DoD context, this primarily means:

- **CAC (Common Access Card):** DoD-issued smart card with X.509 certificates, required for all DoD personnel and contractors for logical and physical access
- **PIV (Personal Identity Verification):** FIPS 201-compliant credential for federal civilian employees (HSPD-12 mandate)

**Key Characteristics:**
- Mutual TLS (mTLS) — server and client authenticate each other
- Hardware-bound private keys (cannot be exported from smart card)
- Certificate chain validation against trusted Certificate Authorities
- OCSP (Online Certificate Status Protocol) / CRL (Certificate Revocation List) for revocation checking
- Inherently multi-factor: something you have (card) + something you know (PIN)

### 5.2 CAC/PIV Authentication Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    PKI / CAC / PIV AUTHENTICATION FLOW                    │
│                                                                           │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────────────┐          │
│  │  Browser  │     │  CAC Reader  │     │  Smart Card          │          │
│  │  + CAC    │────▶│  Middleware  │────▶│  - X.509 Certificate │          │
│  │  Reader   │     │  (OS-level)  │     │  - Private Key       │          │
│  └────┬─────┘     └──────────────┘     │  - PIN Protection    │          │
│       │                                 └──────────────────────┘          │
│       │                                                                   │
│       ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  TLS Handshake (Mutual TLS)                                       │    │
│  │  1. Server presents its certificate                               │    │
│  │  2. Server requests client certificate (CertificateRequest)       │    │
│  │  3. Browser prompts user to select certificate from CAC           │    │
│  │  4. User enters CAC PIN                                           │    │
│  │  5. Client sends certificate + signed challenge                   │    │
│  │  6. Server validates certificate chain against DoD Root CA        │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│       │                                                                   │
│       ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Reverse Proxy (Nginx) — mTLS Termination                        │    │
│  │  1. Validates client certificate against trusted CA bundle        │    │
│  │  2. Checks OCSP/CRL for revocation                               │    │
│  │  3. Extracts Subject DN, SAN email, EDIPI                        │    │
│  │  4. Forwards to API via headers:                                  │    │
│  │     X-Client-Cert-DN: /C=US/O=U.S. Government/.../CN=DOE.JOHN   │    │
│  │     X-Client-Cert-Serial: 1234567890                              │    │
│  │     X-Client-Cert-Verify: SUCCESS                                 │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│       │                                                                   │
│       ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  ForgeComply API                                                  │    │
│  │  1. Verify X-Client-Cert-Verify == SUCCESS                        │    │
│  │  2. Extract EDIPI from Subject DN                                 │    │
│  │  3. Map certificate identity to user record                       │    │
│  │  4. Auto-provision user if JIT enabled                            │    │
│  │  5. Issue JWT (MFA not required — CAC IS multi-factor)            │    │
│  │  6. Audit log: certificate-based authentication event             │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Architecture by Deployment Mode

**On-Premises / Air-Gap (Primary Target):**
```
┌──────────────────────────────────────────────────────────────────────────┐
│                    ON-PREM CAC/PIV DEPLOYMENT                             │
│                                                                           │
│  ┌──────────────────┐                                                    │
│  │  DoD SIPRNet /   │                                                    │
│  │  NIPRNet Client  │──── CAC + PIN ────┐                                │
│  └──────────────────┘                    │                                │
│                                           ▼                               │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Nginx Reverse Proxy (forgecomply-frontend container)             │    │
│  │                                                                    │    │
│  │  ssl_verify_client on;                                            │    │
│  │  ssl_client_certificate /etc/nginx/ssl/dod-root-ca-bundle.pem;   │    │
│  │  ssl_crl /etc/nginx/ssl/dod-crl-bundle.pem;                      │    │
│  │  ssl_ocsp on;  # or leaf for air-gap with local OCSP responder   │    │
│  │                                                                    │    │
│  │  proxy_set_header X-Client-Cert-DN $ssl_client_s_dn;             │    │
│  │  proxy_set_header X-Client-Cert-Serial $ssl_client_serial;       │    │
│  │  proxy_set_header X-Client-Cert-Verify $ssl_client_verify;       │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                              │                                            │
│                              ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  ForgeComply API (forgecomply-api container)                      │    │
│  │  - Reads X-Client-Cert-* headers                                  │    │
│  │  - Maps EDIPI/DN to user record                                   │    │
│  │  - Issues JWT session token                                       │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Local PKI Infrastructure                                         │    │
│  │  - DoD Root CA bundle (manually updated in air-gap)               │    │
│  │  - CRL distribution point (local mirror or manual update)         │    │
│  │  - Optional: local OCSP responder for real-time revocation        │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

**Xiid + Hetzner (Production):**
- Xiid SealedTunnel terminates or passes through mTLS
- Nginx on Hetzner handles client certificate verification
- OCSP/CRL accessible via internet (non-air-gap)
- Certificate-to-user mapping at application layer

**Cloud (Cloudflare Workers):**
- Cloudflare mTLS (requires Enterprise plan or Cloudflare Access)
- Client certificate details in `CF-Client-Cert-*` headers
- Cloudflare handles certificate chain validation
- Worker reads validated certificate attributes from headers
- Limitation: requires Cloudflare Enterprise for full mTLS control

### 5.4 NIST 800-53 Control Mapping

| Control | Requirement | PKI/CAC/PIV Coverage |
|---------|-------------|---------------------|
| **IA-2** | Uniquely identify and authenticate users | **Compliant** — certificate DN uniquely identifies user |
| **IA-2(1)** | MFA for privileged accounts | **Compliant** — CAC is inherently MFA (card + PIN) |
| **IA-2(2)** | MFA for non-privileged accounts | **Compliant** — same mechanism for all users |
| **IA-2(5)** | Individual auth with group auth | **Compliant** — each CAC uniquely identifies individual |
| **IA-2(6)** | Separate device for auth | **Compliant** — CAC IS a separate physical device |
| **IA-2(12)** | Acceptance of PIV credentials | **Directly Compliant** — primary purpose of this option |
| **IA-5(2)** | PKI-based authentication | **Directly Compliant** — X.509 certificate validation |
| **IA-5(2)(a)** | Construct certification path | **Compliant** — chain validated to DoD Root CA |
| **IA-5(2)(b)** | Enforce access to private key | **Compliant** — private key locked on smart card |
| **IA-5(2)(c)** | Map identity to account | **Compliant** — EDIPI/DN mapped to user record |
| **IA-8(1)** | PIV from other agencies | **Compliant** — trust DoD/Federal Bridge CA |
| **SC-12** | Cryptographic key management | **Compliant** — PKI provides key lifecycle management |
| **SC-17** | PKI certificates | **Compliant** — issued by authorized DoD/Federal CAs |

### 5.5 Compliance Framework Assessment

| Framework | PKI/CAC Status | Notes |
|-----------|---------------|-------|
| **FedRAMP High** | **Required** | PIV mandated for privileged access to high-impact systems |
| **FedRAMP Moderate** | Strongly recommended | PIV preferred for federal users |
| **CMMC Level 3** | Compliant | CAC/PKI satisfies all MFA requirements |
| **DoD IL5** | **Required** | CAC is the standard authenticator on DoD networks |
| **HSPD-12** | **Directly addresses** | Federal mandate for PIV-based logical access |
| **HIPAA** | Exceeds requirements | Hardware-based authentication exceeds HIPAA minimum |
| **TAC 202** | Exceeds requirements | PKI exceeds IA-2 requirements |

### 5.6 Implementation Considerations

**Effort:** 8-12 weeks (highest complexity)

**Dependencies:**
- X.509 certificate parsing (Subject DN, SAN, EDIPI extraction)
- OCSP client for online revocation checking
- CRL parsing and caching for air-gap environments
- DoD Root CA bundle management (periodic updates)
- Nginx mTLS configuration
- CAC middleware testing (Windows: built-in; macOS: OpenSC; Linux: pcscd/OpenSC)

**Key Design Decisions:**
- CAC authentication bypasses MFA prompt (CAC IS multi-factor)
- Fallback to password + MFA when CAC reader unavailable
- EDIPI as primary user mapping key (unique DoD identifier)
- Certificate-to-role mapping (certificate OU/policy OID → RBAC role)

**Air-Gap Specific Requirements:**
- Local CRL mirror updated via sneakernet/data diode
- CRL update frequency: daily minimum for DoD CRLs
- DoD Root CA bundle: updated during maintenance windows
- No OCSP dependency in fully air-gapped environment

**Existing Schema Awareness:**
The `ssp_digital_identity` table (`database/migrate-020-fisma-ssp-tables.sql:81-87`) already models PIV as a valid MFA method:
```sql
mfa_methods TEXT,  -- JSON array: ["PIV", "TOTP", "SMS", ...]
```
This indicates the data model is already PKI-aware at the SSP documentation level.

**Risks:**
- Certificate revocation latency in air-gap environments
- CAC middleware compatibility across browsers and operating systems
- Expired certificates cause authentication failure (must handle gracefully)
- DoD CA bundle size and update frequency
- Testing requires physical CAC/PIV cards or test certificates

---

## 6. Option D: Xiid Zero-Knowledge Authentication

### 6.1 Overview

Xiid Zero-Knowledge Authentication (ZKA) is a passwordless, quantum-resistant authentication mechanism provided at the infrastructure layer by the Xiid Terniion control plane. Based on the Xiid SealedTunnel integration already planned for the production deployment, ZKA offers:

- **Zero-Knowledge Proof (ZKP):** User proves identity without transmitting credentials
- **AAL3 Assurance:** Meets the highest NIST SP 800-63-3 authenticator assurance level
- **Quantum-Resistant:** Uses Kyber (key exchange) and Dilithium (digital signatures) — CNSA 2.0 compliant
- **Passwordless:** Eliminates password-based attack vectors entirely
- **No Credential Storage:** Nothing to breach on the server side

### 6.2 Architecture Integration

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    XIID ZERO-KNOWLEDGE AUTH FLOW                          │
│                                                                           │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────────────┐          │
│  │  Browser  │────▶│  Xiid Client │────▶│  Xiid Terniion       │          │
│  │  + Xiid   │     │  Agent       │     │  Control Plane       │          │
│  │  Agent    │     │              │     │                      │          │
│  └──────────┘     └──────────────┘     │  - ZKP Verification  │          │
│                                         │  - Identity Assertion │          │
│                                         │  - Kyber/Dilithium   │          │
│                                         └──────────┬───────────┘          │
│                                                    │                      │
│                                                    ▼                      │
│                                        ┌──────────────────────┐          │
│                                        │  Xiid SealedTunnel   │          │
│                                        │  (authenticated      │          │
│                                        │   session context)    │          │
│                                        └──────────┬───────────┘          │
│                                                    │                      │
│                                                    ▼                      │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  ForgeComply API (Hetzner)                                        │    │
│  │  - Receives authenticated identity from Xiid trust layer         │    │
│  │  - Maps Xiid identity to ForgeComply user                         │    │
│  │  - Issues application-level JWT for session management            │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Compliance Impact

| Aspect | Assessment |
|--------|-----------|
| **AAL Level** | AAL3 — hardware-bound, verifier-impersonation resistant |
| **CNSA 2.0** | Compliant — quantum-resistant algorithms |
| **FedRAMP** | Exceeds all authentication requirements |
| **Credential Storage Risk** | Eliminated — zero-knowledge architecture |

### 6.4 Considerations

| Factor | Assessment |
|--------|-----------|
| **Deployment scope** | Xiid+Hetzner mode only — not available for cloud or on-prem |
| **Vendor dependency** | Requires Xiid partnership and infrastructure |
| **Maturity** | Architecture defined; implementation pending Xiid GA |
| **Complementary role** | Does not replace application-level auth for non-Xiid deployments |
| **User experience** | Passwordless — best UX of all options |

### 6.5 Recommendation

Include Xiid ZKA as a **Phase 5 enhancement** that runs parallel to other implementations. When the Xiid integration matures, it provides the strongest authentication option for the production Xiid+Hetzner deployment, while OIDC/SAML/PKI serve the cloud and on-prem deployment modes.

---

## 7. Comparative Analysis Matrix

### 7.1 Feature Comparison

| Criteria | Current (JWT+MFA) | OIDC | SAML 2.0 | PKI/CAC/PIV | Xiid ZKA |
|----------|--------------------|------|----------|-------------|----------|
| **SSO Federation** | No | Yes | Yes | No (direct auth) | Yes |
| **MFA Built-In** | Optional TOTP | IdP-dependent | IdP-dependent | Inherent (card+PIN) | Inherent (ZKP) |
| **AAL Level** | AAL1-2 | AAL1-3 (IdP) | AAL1-3 (IdP) | AAL2-3 | AAL3 |
| **Passwordless** | No | Possible | Possible | Yes (cert-based) | Yes |
| **Air-Gap Compatible** | Yes | Yes (Keycloak) | Yes (local IdP) | Yes (local CRL) | No |
| **Cloud Compatible** | Yes | Yes | Yes | Partial (Enterprise) | Xiid+Hetzner only |
| **On-Prem Compatible** | Yes | Yes | Yes | Yes (best fit) | No |
| **Protocol Format** | JWT | JSON/JWT | XML | X.509/TLS | Proprietary |
| **User Experience** | Username+password | Redirect to IdP | Redirect to IdP | Insert card+PIN | Passwordless |

### 7.2 Compliance Coverage

| Framework | Current | +OIDC | +SAML | +PKI/CAC | +Xiid ZKA |
|-----------|---------|-------|-------|----------|-----------|
| **FedRAMP Moderate** | Partial | Full | Full | Exceeds | Exceeds |
| **FedRAMP High** | Gap | Partial | Partial | **Full** | Exceeds |
| **CMMC Level 3** | Partial | Full | Full | Full | Exceeds |
| **DoD IL5** | Gap | Partial | Partial | **Full** | Exceeds |
| **HIPAA** | Full | Full | Full | Exceeds | Exceeds |
| **TAC 202** | Full | Full | Full | Exceeds | Exceeds |
| **HSPD-12** | Gap | Gap | Gap | **Full** | N/A |

### 7.3 Implementation Effort

| Factor | OIDC | SAML 2.0 | PKI/CAC/PIV | Xiid ZKA |
|--------|------|----------|-------------|----------|
| **Duration** | 4-6 weeks | 6-8 weeks | 8-12 weeks | Parallel |
| **Backend complexity** | Low | Medium-High | High | Medium |
| **Frontend changes** | Moderate | Moderate | Low | Low |
| **Testing complexity** | Low | Medium | High (hardware) | Medium |
| **Existing code leverage** | High (ServiceNow OAuth) | Medium (XML parser) | Low | Low |
| **Ongoing maintenance** | Low | Medium | High (CRL/OCSP) | Low |

### 7.4 Decision Matrix (Weighted Scoring)

| Criteria (Weight) | OIDC | SAML | PKI/CAC | Xiid ZKA |
|--------------------|------|------|---------|----------|
| Compliance coverage (30%) | 8 | 8 | 10 | 10 |
| Implementation effort (20%) | 9 | 6 | 4 | 7 |
| Deployment mode coverage (20%) | 9 | 9 | 8 | 3 |
| Customer demand (15%) | 9 | 8 | 7 | 4 |
| Maintenance burden (15%) | 9 | 6 | 5 | 8 |
| **Weighted Score** | **8.7** | **7.5** | **7.0** | **6.4** |

**Conclusion:** OIDC provides the best balance of compliance coverage, implementation efficiency, and deployment compatibility, making it the recommended first implementation.

---

## 8. NIST 800-53 IA Control Mapping

### Full Matrix: IA Family Controls

| Control | Description | Current State | +OIDC | +SAML | +PKI/CAC | +Xiid ZKA |
|---------|-------------|---------------|-------|-------|----------|-----------|
| **IA-1** | Policy and Procedures | Documented | No change | No change | No change | No change |
| **IA-2** | Identification and Authentication (Org Users) | Compliant (local) | Enhanced (federated) | Enhanced (federated) | Enhanced (cert-based) | Enhanced (ZKP) |
| **IA-2(1)** | MFA for Privileged Accounts | **Partial** (soft enforce) | Conditional (IdP) | Conditional (IdP) | **Compliant** (inherent) | **Compliant** (AAL3) |
| **IA-2(2)** | MFA for Non-Privileged Accounts | Optional | Conditional (IdP) | Conditional (IdP) | **Compliant** (inherent) | **Compliant** (AAL3) |
| **IA-2(5)** | Individual Auth with Group Auth | Compliant | Compliant | Compliant | **Compliant** | Compliant |
| **IA-2(6)** | Access via Separate Device | Not implemented | Conditional (IdP) | Conditional (IdP) | **Compliant** (card) | **Compliant** |
| **IA-2(8)** | Replay-Resistant Auth | Partial (JWT exp) | **Compliant** (nonce) | **Compliant** (assertions) | **Compliant** (TLS) | **Compliant** (ZKP) |
| **IA-2(12)** | PIV Credential Acceptance | **Not implemented** | Not applicable | Not applicable | **Compliant** | N/A |
| **IA-3** | Device Identification | Not implemented | Not applicable | Not applicable | Partial (cert DN) | Compliant |
| **IA-4** | Identifier Management | Compliant (UUID) | Enhanced (federated ID) | Enhanced (SAML NameID) | Enhanced (EDIPI) | Enhanced (Xiid ID) |
| **IA-5** | Authenticator Management | Compliant | Offloaded to IdP | Offloaded to IdP | PKI-managed | ZKP-based |
| **IA-5(1)** | Password-Based Auth | Compliant (NIST 800-63B) | IdP-managed | IdP-managed | N/A (passwordless) | N/A (passwordless) |
| **IA-5(2)** | PKI-Based Auth | **Not implemented** | Not applicable | Not applicable | **Compliant** | N/A |
| **IA-5(2)(a)** | Validate certification path | N/A | N/A | N/A | **Compliant** | N/A |
| **IA-5(2)(b)** | Enforce authorized key access | N/A | N/A | N/A | **Compliant** (smart card) | N/A |
| **IA-5(2)(c)** | Map identity to account | N/A | N/A | N/A | **Compliant** (DN mapping) | N/A |
| **IA-6** | Authenticator Feedback | Compliant (masked) | Compliant | Compliant | Compliant | Compliant |
| **IA-7** | Cryptographic Module Auth | Compliant (Web Crypto) | Compliant | Compliant | **Enhanced** (FIPS 140-2 card) | Enhanced (Kyber) |
| **IA-8** | Non-Organizational Users | **Not implemented** | **Compliant** (federation) | **Compliant** (federation) | **Compliant** (cross-agency PIV) | N/A |
| **IA-8(1)** | PIV from Other Agencies | **Not implemented** | Not applicable | Not applicable | **Compliant** (Federal Bridge CA) | N/A |
| **IA-8(2)** | External Authenticators | Not implemented | **Compliant** | **Compliant** | **Compliant** | N/A |
| **IA-11** | Re-Authentication | Compliant (session timeout) | Enhanced | Enhanced | Enhanced (re-verify) | Enhanced |
| **IA-12** | Identity Proofing | Not applicable | IdP-dependent (IAL) | IdP-dependent (IAL) | **IAL3** (in-person proofing) | AAL3 |

### FedRAMP Baseline Requirements Highlighted

**FedRAMP Moderate (minimum):**
- IA-2(1) MFA for privileged: **OIDC/SAML sufficient** (with IdP-enforced MFA)
- IA-2(2) MFA for non-privileged: **OIDC/SAML sufficient**
- IA-2(12) PIV: Required for **federal** users accessing government systems
- IA-8 Non-org users: **OIDC/SAML** enables federation

**FedRAMP High (additional):**
- IA-2(12) PIV: **PKI/CAC required** for privileged access
- IA-5(2) PKI-based auth: **PKI/CAC required**
- IA-8(1) PIV from other agencies: **PKI/CAC required**

---

## 9. Recommended Phased Implementation Roadmap

### Phase 1: Harden Current Authentication (Immediate — 1 week)

**Objective:** Close the MFA enforcement gap identified in HIPAA/TAC 202 compliance review.

**Changes:**
- Convert MFA soft recommendation to hard requirement for admin/owner roles
- Block JWT token issuance for admin/owner without MFA enabled
- Return `mfa_setup_required: true` (instead of `mfa_setup_recommended`) and withhold access/refresh tokens until MFA is configured
- Update `LoginPage.tsx` MFA setup flow to be mandatory, not dismissible

**Code Impact:**
- `workers/index.js:1544-1572` — Change soft flag to hard block
- `frontend/src/pages/LoginPage.tsx:142-163` — Update MFA setup required UI

**Compliance Value:** Closes IA-2(1) gap for FedRAMP Moderate, HIPAA, TAC 202.

---

### Phase 2: OIDC / OAuth 2.0 Integration (Short-term — 4-6 weeks)

**Objective:** Enable enterprise SSO with federated identity for cloud and on-prem deployments.

**New API Endpoints:**
```
GET  /api/v1/auth/sso/providers          — List configured IdPs for org
POST /api/v1/auth/sso/oidc/authorize     — Initiate OIDC auth flow
POST /api/v1/auth/sso/oidc/callback      — Handle OIDC callback, issue JWT
```

**Key Implementation Details:**
- Authorization Code + PKCE flow
- Multi-IdP support per organization
- JIT (Just-In-Time) user provisioning from IdP claims
- Role mapping from IdP groups/claims to ForgeComply RBAC roles
- Enforce IdP-level MFA via `acr_values` parameter or `amr` claim verification
- Reference implementation: ServiceNow OAuth pattern at `workers/index.js:14103-14201`

**On-Prem Addition:**
- Add optional Keycloak container to `docker-compose.yml` for self-hosted OIDC
- Keycloak provides LDAP/AD backend integration for existing directory services

**Compliance Value:** Satisfies IA-2, IA-5, IA-8 for FedRAMP Moderate, CMMC Level 3, HIPAA. Enables Login.gov integration for federal civilian agencies.

---

### Phase 3: SAML 2.0 Support (Medium-term — 6-8 weeks)

**Objective:** Support enterprise customers using SAML-based identity providers (ADFS, Okta SAML, PingFederate).

**New API Endpoints:**
```
GET  /api/v1/auth/sso/saml/metadata      — SP metadata document
POST /api/v1/auth/sso/saml/acs           — Assertion Consumer Service
GET  /api/v1/auth/sso/saml/slo           — Single Logout
```

**Key Implementation Details:**
- SP-initiated and IdP-initiated SSO flows
- XML signature verification using Web Crypto API
- `fast-xml-parser` for SAML response parsing (already in dependencies)
- SAML assertion attribute-to-role mapping
- IdP metadata import (XML upload or URL fetch)
- Shared IdP configuration infrastructure with OIDC (multi-protocol support)

**Compliance Value:** Same IA controls as OIDC, plus compatibility with government/enterprise SAML IdPs that do not support OIDC.

---

### Phase 4: PKI + CAC/PIV Authentication (Long-term — 8-12 weeks)

**Objective:** Enable certificate-based authentication for DoD and federal civilian environments.

**Implementation by Deployment Mode:**

**On-Prem (Primary — weeks 1-6):**
- Nginx mTLS configuration with DoD Root CA bundle
- Certificate header parsing in API
- EDIPI extraction and user mapping
- CRL caching and scheduled update mechanism
- Air-gap CRL distribution documentation

**Xiid + Hetzner (weeks 4-8):**
- Nginx mTLS on Hetzner API proxy
- OCSP stapling configuration
- Certificate validation via SealedTunnel

**Cloud (weeks 6-12):**
- Cloudflare mTLS configuration (Enterprise plan required)
- `CF-Client-Cert-*` header parsing in Worker
- Cloudflare Access integration for certificate policy

**New API Endpoints:**
```
POST /api/v1/auth/certificate             — Certificate-based authentication
GET  /api/v1/auth/certificate/status       — Certificate validation status
POST /api/v1/admin/certificates/ca-bundle  — Upload trusted CA bundle
GET  /api/v1/admin/certificates/crl-status — CRL freshness check
```

**Compliance Value:** Directly satisfies IA-2(12), IA-5(2), IA-8(1), SC-12, SC-17 — **mandatory for FedRAMP High and DoD IL5**.

---

### Phase 5: Xiid Zero-Knowledge Authentication (Parallel)

**Objective:** Enable passwordless AAL3 authentication for Xiid+Hetzner deployments.

**Implementation:**
- Integrate Xiid identity assertions into ForgeComply auth pipeline
- Map Xiid-authenticated identity to ForgeComply user accounts
- Optional: use Xiid ZKA as the primary auth method, with OIDC/SAML as fallback

**Timeline:** Parallel to Phases 2-4, dependent on Xiid SSO GA availability.

**Compliance Value:** AAL3, quantum-resistant, zero credential storage — exceeds all current compliance framework requirements.

---

### Implementation Timeline Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION TIMELINE                                 │
│                                                                           │
│  Phase 1: MFA Hardening                                                  │
│  ├──────┤                                                                │
│  Week 1                                                                  │
│                                                                           │
│  Phase 2: OIDC / OAuth 2.0                                               │
│  ├────────────────────────────────────────┤                              │
│  Weeks 2-7                                                               │
│                                                                           │
│  Phase 3: SAML 2.0                                                       │
│           ├──────────────────────────────────────────────┤               │
│           Weeks 6-13                                                     │
│                                                                           │
│  Phase 4: PKI / CAC / PIV                                                │
│                    ├────────────────────────────────────────────────────┤ │
│                    Weeks 10-21                                           │
│                                                                           │
│  Phase 5: Xiid ZKA                                                       │
│  ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤ │
│  Parallel (dependent on Xiid GA)                                         │
│                                                                           │
│  0        4        8       12       16       20       24                 │
│  └────────┴────────┴────────┴────────┴────────┴────────┘                │
│                          Weeks                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Database & Schema Impact

### 10.1 New Tables

**`identity_providers` — IdP Configuration (Phase 2/3)**
```sql
CREATE TABLE IF NOT EXISTS identity_providers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                          -- Display name ("Okta SSO", "Agency ADFS")
  protocol TEXT NOT NULL CHECK (protocol IN ('oidc', 'saml', 'pki', 'xiid')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'testing')),
  -- OIDC fields
  oidc_issuer TEXT,                            -- e.g., https://login.microsoftonline.com/{tenant}/v2.0
  oidc_client_id TEXT,
  oidc_client_secret_encrypted TEXT,           -- AES-GCM encrypted
  oidc_scopes TEXT DEFAULT 'openid profile email',
  oidc_jwks_uri TEXT,
  -- SAML fields
  saml_entity_id TEXT,
  saml_sso_url TEXT,
  saml_slo_url TEXT,
  saml_certificate TEXT,                       -- IdP signing certificate (PEM)
  saml_name_id_format TEXT DEFAULT 'emailAddress',
  -- Common fields
  role_mapping TEXT DEFAULT '{}',              -- JSON: {"IdP_group": "forgecomply_role"}
  auto_provision INTEGER DEFAULT 1,            -- JIT user provisioning
  default_role TEXT DEFAULT 'analyst',
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

**`user_external_identities` — Federated User Mapping (Phase 2/3)**
```sql
CREATE TABLE IF NOT EXISTS user_external_identities (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idp_id TEXT NOT NULL REFERENCES identity_providers(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,                   -- IdP subject identifier
  external_email TEXT,
  external_name TEXT,
  last_login_at TEXT,
  metadata TEXT DEFAULT '{}',                  -- Additional IdP claims
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(idp_id, external_id)
);
```

**`user_certificates` — PKI Certificate Mapping (Phase 4)**
```sql
CREATE TABLE IF NOT EXISTS user_certificates (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_dn TEXT NOT NULL,                    -- /C=US/O=U.S. Government/.../CN=DOE.JOHN
  issuer_dn TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  edipi TEXT,                                  -- DoD Electronic Data Interchange Personal Identifier
  san_email TEXT,                              -- Subject Alternative Name email
  not_before TEXT NOT NULL,
  not_after TEXT NOT NULL,
  fingerprint_sha256 TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(subject_dn, serial_number)
);
```

### 10.2 Users Table Extensions

```sql
ALTER TABLE users ADD COLUMN auth_method TEXT DEFAULT 'local'
  CHECK (auth_method IN ('local', 'oidc', 'saml', 'pki', 'xiid'));
ALTER TABLE users ADD COLUMN external_id TEXT;
ALTER TABLE users ADD COLUMN edipi TEXT;
```

Note: `password_hash` becomes optional for SSO-only users (`auth_method != 'local'`).

### 10.3 Migration Strategy

- All schema changes are additive (new tables, new columns)
- No breaking changes to existing data
- Existing users default to `auth_method = 'local'`
- Each phase adds its schema changes as a numbered migration file

---

## 11. Risk Assessment

### 11.1 Implementation Risks

| Option | Risk | Likelihood | Impact | Mitigation |
|--------|------|-----------|--------|------------|
| **OIDC** | IdP-specific quirks in token format | Medium | Low | Test with multiple IdPs; use OIDC conformance test suite |
| **OIDC** | PKCE state management in distributed Workers | Low | Medium | Use KV with short TTL; include binding to user session |
| **SAML** | XML signature wrapping attack | Medium | High | Use strict canonicalization; validate signature references |
| **SAML** | SAML response size exceeds Worker memory | Low | Medium | Set maximum assertion size; reject oversized responses |
| **PKI** | CRL staleness in air-gap environments | High | High | Automated CRL update scripts; freshness alerting |
| **PKI** | CAC middleware compatibility issues | Medium | Medium | Cross-browser/OS testing matrix; graceful fallback |
| **Xiid** | Xiid SSO GA timeline uncertainty | Medium | Low | Parallel implementation; not on critical path |

### 11.2 Security Risks

| Option | Risk | Mitigation |
|--------|------|------------|
| **OIDC** | Token injection via manipulated callback | Validate state parameter; verify nonce in ID token |
| **OIDC** | IdP compromise propagates to ForgeComply | Monitor IdP security advisories; support IdP rotation |
| **SAML** | Assertion replay | Enforce NotOnOrAfter; track consumed assertion IDs |
| **SAML** | Signature bypass via XML manipulation | Strict reference validation; reject unsigned assertions |
| **PKI** | Revoked certificate accepted (stale CRL) | OCSP where available; CRL freshness threshold alerts |
| **PKI** | Man-in-the-middle if mTLS misconfigured | Strict mTLS enforcement; no fallback to non-mTLS |

### 11.3 Compliance Risk of NOT Implementing

| Scenario | Affected Frameworks | Business Impact |
|----------|-------------------|-----------------|
| No SSO federation | FedRAMP (IA-8), enterprise customers | Cannot sell to organizations requiring federated identity |
| No PKI/CAC support | FedRAMP High, DoD IL5, HSPD-12 | **Cannot enter DoD market** — CAC is mandatory on DoD networks |
| No MFA enforcement | FedRAMP Moderate (IA-2(1)), HIPAA | Audit finding; potential ATO denial |
| No AAL3 option | FedRAMP High (high-value assets) | Limited to moderate-impact deployments |

---

## 12. Appendices

### Appendix A: NIST SP 800-63-3 AAL Level Requirements

| AAL Level | Authenticator Requirements | Applicable Options |
|-----------|---------------------------|-------------------|
| **AAL1** | Single factor (password) | Current (without MFA) |
| **AAL2** | Two factors; one must be either a multi-factor authenticator or two single-factor authenticators | Current + TOTP, OIDC/SAML with IdP MFA |
| **AAL3** | Two factors; one must be a hardware cryptographic authenticator | PKI/CAC/PIV, Xiid ZKA |

Key AAL2 requirements:
- Approved cryptographic algorithms
- Authentication intent (user action required)
- Verifier-impersonation resistance (for physical authenticators)

Key AAL3 requirements (beyond AAL2):
- Hardware-based authenticator (tamper-resistant)
- Verifier-impersonation resistance required
- Verifier-compromise resistance required

### Appendix B: FedRAMP Authentication Requirements by Impact Level

| Control | Low | Moderate | High |
|---------|-----|----------|------|
| IA-2 | Required | Required | Required |
| IA-2(1) MFA Privileged | Required | Required | Required |
| IA-2(2) MFA Non-Privileged | — | Required | Required |
| IA-2(5) Individual with Group | — | — | Required |
| IA-2(8) Replay Resistant | — | Required | Required |
| IA-2(12) PIV Acceptance | — | Conditional | Required |
| IA-5(2) PKI-Based Auth | — | — | Required |
| IA-8 Non-Org Users | Required | Required | Required |
| IA-8(1) PIV Other Agencies | — | Conditional | Required |

### Appendix C: CMMC Level 3 Access Control Practices

| Practice | Description | Auth Options |
|----------|-------------|-------------|
| AC.L2-3.1.1 | Limit system access to authorized users | All options |
| AC.L2-3.1.3 | Control flow of CUI per authorizations | All options |
| IA.L2-3.5.3 | Use MFA for local and network access | TOTP, PKI/CAC, OIDC+MFA |
| IA.L2-3.5.4 | Employ replay-resistant auth | OIDC (nonce), SAML (assertion), PKI (TLS), Xiid (ZKP) |

### Appendix D: DoD IL5 Authentication Mandates

- **Primary:** CAC (Common Access Card) with DoD-issued PKI certificates
- **Alternative:** Approved External Certificate Authority (ECA) for contractors
- **Network:** SIPRNet requires CAC authentication at all access points
- **NIPRNet:** CAC required for all DoD applications
- **Cross-domain:** Authentication must be maintained across security domains

### Appendix E: Glossary

| Term | Definition |
|------|-----------|
| **AAL** | Authenticator Assurance Level (NIST SP 800-63-3) |
| **ACS** | Assertion Consumer Service (SAML endpoint) |
| **CAC** | Common Access Card (DoD smart card) |
| **CRL** | Certificate Revocation List |
| **EDIPI** | Electronic Data Interchange Personal Identifier (10-digit DoD number) |
| **FAL** | Federation Assurance Level (NIST SP 800-63-3) |
| **HSPD-12** | Homeland Security Presidential Directive 12 |
| **IAL** | Identity Assurance Level (NIST SP 800-63-3) |
| **IdP** | Identity Provider |
| **JIT** | Just-In-Time (user provisioning) |
| **mTLS** | Mutual TLS (both client and server authenticate) |
| **OCSP** | Online Certificate Status Protocol |
| **OIDC** | OpenID Connect |
| **PIV** | Personal Identity Verification (FIPS 201) |
| **PKCE** | Proof Key for Code Exchange (OAuth extension) |
| **SAML** | Security Assertion Markup Language |
| **SP** | Service Provider (in SAML context) |
| **ZKA** | Zero-Knowledge Authentication |
| **ZKP** | Zero-Knowledge Proof |

---

*Prepared by Forge Cyber Defense Engineering Team*
*Classification: Internal — Architecture Decision Record*
*Next Review: Upon completion of Phase 2 implementation*
