# ForgeComply 360™

**AI-Powered Governance, Risk & Compliance Platform**

[![CI](https://github.com/Bjay0727-jay/ForgeComply360/actions/workflows/ci.yml/badge.svg)](https://github.com/Bjay0727-jay/ForgeComply360/actions/workflows/ci.yml)
[![Platform](https://img.shields.io/badge/platform-Cloudflare%20Workers-orange)](https://workers.cloudflare.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-72%25-blue)](https://www.typescriptlang.org)

ForgeComply 360 is an enterprise GRC platform built on Cloudflare's edge computing infrastructure. It provides multi-tenant compliance management across 25+ regulatory frameworks, including FedRAMP, CMMC 2.0, FISMA/RMF, HIPAA, SOC 2, and ISO 27001.

**Built by [Forge Cyber Defense](https://www.forgecyberdefense.com)** — Service-Disabled Veteran-Owned Small Business (SDVOSB) | 100% U.S.-Based Operations

---

## Platform Capabilities

| Module | Description |
|--------|-------------|
| **Multi-Framework Compliance** | Unified control management across FedRAMP, CMMC, HIPAA, SOC 2, ISO 27001, NIST CSF, and 19+ additional frameworks |
| **System Security Plans** | SSP authoring with OSCAL 1.1.2 export via ForgeComply 360 Reporter |
| **Risk Register** | Centralized risk tracking with quantitative and qualitative scoring |
| **POA&M Management** | Plan of Action & Milestones lifecycle tracking with remediation workflows |
| **Control Implementation** | NIST 800-53 Rev 5 control catalog with implementation status tracking |
| **Evidence Management** | Secure evidence collection, organization, and audit-ready packaging |
| **Continuous Monitoring** | ConMon dashboard with automated assessment scheduling |
| **Asset Inventory** | Information system and component inventory with boundary mapping |
| **ForgeML AI Engine** | AI-assisted narrative generation for control implementations and SSP content |
| **Multi-Tenant** | Complete data isolation with tenant-scoped access at every layer |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Cloudflare CDN + WAF + DDoS                │
│              SSL Termination · Edge Caching                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐     │
│  │   Frontend    │  │  API Workers   │  │  R2 Storage   │    │
│  │  Cloudflare   │  │  Cloudflare    │  │  Evidence &   │    │
│  │    Pages      │  │   Workers      │  │  Documents    │    │
│  └──────┬───────┘  └──────┬────────┘  └──────────────┘     │
│         │                  │                                 │
│         │           ┌──────┴────────┐                       │
│         │           │  Cloudflare D1 │                       │
│         │           │   (SQLite)     │                       │
│         │           │  Multi-tenant  │                       │
│         │           └───────────────┘                       │
│         │           ┌───────────────┐                       │
│         └──────────▶│  Cloudflare KV │                       │
│                     │  Sessions &    │                       │
│                     │  Config Cache  │                       │
│                     └───────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### Connected Products

| Product | Repository | Integration |
|---------|-----------|-------------|
| **ForgeComply 360 Reporter** | [Forge-Reporter](https://github.com/Bjay0727-jay/Forge-Reporter) | SSP authoring engine with OSCAL 1.1.2 validation; syncs bidirectionally with ForgeComply 360 API |
| **ForgeAI Govern™** | [AI-Governance](https://github.com/Bjay0727-jay/AI-Governance) | Healthcare AI governance module (NIST AI RMF, FDA SaMD, HIPAA) |
| **ForgeScan 360** | [Forge-Scan](https://github.com/Bjay0727-jay/Forge-Scan) | Vulnerability scanner; findings feed into risk register and POA&M |

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | TypeScript SPA | Responsive compliance dashboard with role-based views |
| API | Cloudflare Workers (TypeScript) | Edge-deployed REST API with JWT authentication |
| Database | Cloudflare D1 (SQLite) | Multi-tenant data storage with row-level isolation |
| File Storage | Cloudflare R2 | Evidence files, SSP documents, assessment artifacts |
| Cache | Cloudflare KV | Session management, feature flags, configuration |
| Auth | JWT + PBKDF2-SHA256 | Stateless auth with 100K iteration password hashing |
| AI Engine | ForgeML | AI-assisted compliance narrative generation |
| CI/CD | GitHub Actions | Automated testing and deployment pipeline |

## Project Structure

```
ForgeComply360/
├── .github/workflows/     # CI/CD pipeline
├── database/              # Schema, migrations, seed data
├── docker/                # Container deployment configs
├── docs/                  # Documentation & compliance reviews
├── frontend/              # TypeScript SPA
├── scripts/               # Deployment & utility scripts
├── workers/               # Cloudflare Worker API handlers
├── vitest.config.ts       # Test configuration
├── wrangler.toml          # Cloudflare Worker configuration
├── DEPLOYMENT.md          # Deployment guide
└── package.json
```

## Compliance Framework Coverage

### Tier 1 — Full Control Catalog + Implementation Tracking
- **NIST 800-53 Rev 5** — Complete control catalog (1,189 controls across 20 families)
- **FedRAMP** — Low, Moderate, High baselines with continuous monitoring
- **CMMC 2.0** — Levels 1-3 practice mapping
- **FISMA/RMF** — Full Risk Management Framework lifecycle
- **HIPAA** — Security Rule, Privacy Rule, Breach Notification

### Tier 2 — Control Mapping + Gap Analysis
- **SOC 2** — Trust Services Criteria (Type I & II)
- **ISO 27001:2022** — Annex A controls
- **NIST CSF 2.0** — Govern, Identify, Protect, Detect, Respond, Recover
- **NIST 800-171 Rev 3** — CUI protection requirements
- **StateRAMP** — State/local government cloud compliance

### Tier 3 — Cross-Walk Mapping
- PCI DSS 4.0, HITRUST CSF, CIS Controls v8, CISA CPGs, TX-RAMP, and additional frameworks

## Quick Start

### Prerequisites

- Node.js 18+
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account with Workers, D1, R2, and KV enabled

### Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions, or use the automated deploy script:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Create tenant and admin user |
| POST | `/api/v1/auth/login` | Authenticate, receive JWT |
| POST | `/api/v1/auth/refresh` | Refresh access token |

### Systems & Assets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/v1/systems` | List/create information systems |
| GET/PUT/DELETE | `/api/v1/systems/:id` | Get/update/delete system |
| GET/POST | `/api/v1/assets` | List/create system components |

### Compliance & Controls
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/controls` | List control catalog (filterable by framework) |
| GET/POST | `/api/v1/implementations` | List/record control implementations |
| GET | `/api/v1/frameworks` | List supported compliance frameworks |
| GET | `/api/v1/crosswalk/:controlId` | Get cross-framework mappings |

### POA&M
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/v1/poam` | List/create POA&M items |
| PUT/DELETE | `/api/v1/poam/:id` | Update/delete POA&M item |

### SSP Integration (Reporter)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/v1/ssp` | List/create System Security Plans |
| GET/PUT | `/api/v1/ssp/:id` | Get/update SSP data |
| POST | `/api/v1/ssp/:id/export` | Export SSP as OSCAL JSON |

### Dashboard & Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard/stats` | Compliance posture overview |
| GET | `/api/v1/reports/compliance` | Framework compliance report |
| GET | `/api/v1/reports/executive` | Executive summary |

## Security

- **Authentication:** JWT with 15-minute access tokens, 7-day refresh rotation
- **Password Hashing:** PBKDF2-SHA256 with 100,000 iterations
- **Authorization:** Role-based access control (admin, compliance_lead, auditor, viewer)
- **Data Isolation:** Tenant-scoped queries at database layer
- **Encryption:** TLS 1.2+ in transit, AES-256 at rest via Cloudflare
- **Account Protection:** Auto-lockout after 5 failed attempts
- **Audit Trail:** Immutable logging for all compliance activities
- **Infrastructure:** Cloudflare WAF, DDoS protection, Bot management

## Environment Variables

```bash
# Required
JWT_SECRET=<generate with: openssl rand -base64 32>

# Optional - ForgeML AI features
ANTHROPIC_API_KEY=<your key>

# Optional - Email notifications
SMTP_HOST=smtp.sendgrid.net
SMTP_API_KEY=<your key>
```

## License

Proprietary — Forge Cyber Defense LLC. All rights reserved. See [LICENSE](./LICENSE).

---

**Forge Cyber Defense LLC** | [forgecyberdefense.com](https://www.forgecyberdefense.com) | Plano, Texas | SDVOSB Certified
