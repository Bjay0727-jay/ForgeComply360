# ForgeComply 360 Architecture Overview

**Version:** 5.0.0
**Developer:** Forge Cyber Defense (SDVOSB)

---

## Executive Summary

ForgeComply 360 is an enterprise-grade Governance, Risk, and Compliance (GRC) platform built on modern cloud-native architecture. It leverages Cloudflare's edge computing infrastructure to deliver a globally distributed, highly available compliance management solution.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │   Browser   │  │  Mobile App │  │   API/CLI   │                  │
│  │   (React)   │  │   (Future)  │  │  Consumers  │                  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                  │
└─────────┼────────────────┼────────────────┼─────────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE EDGE NETWORK                         │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Cloudflare Pages                          │    │
│  │                 (Static Frontend Hosting)                    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   Cloudflare Workers                         │    │
│  │                    (API Backend)                             │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │    │
│  │  │  Auth   │  │ Systems │  │Controls │  │Evidence │        │    │
│  │  │ Handler │  │ Handler │  │ Handler │  │ Handler │  ...   │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │    │
│  └─────────────────────────────────────────────────────────────┘    │
│           │              │              │              │             │
│  ┌────────┴──────────────┴──────────────┴──────────────┴───────┐    │
│  │                      DATA LAYER                              │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │    │
│  │  │   D1    │  │   KV    │  │   R2    │  │   AI    │        │    │
│  │  │Database │  │  Cache  │  │ Storage │  │ Workers │        │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                │
│  │ Resend  │  │ Sentry  │  │ Webhooks│  │  OSCAL  │                │
│  │ (Email) │  │ (Errors)│  │ (Events)│  │ (Import)│                │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Core Design Principles

### 1. Single Engine, Multiple Experiences

The platform uses a unified backend API that serves multiple frontend experiences:

```
┌─────────────────────────────────────────────────────────┐
│                    SINGLE API ENGINE                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Federal  │  │Enterprise│  │Healthcare│  │  Custom │ │
│  │Experience│  │Experience│  │Experience│  │Experience│ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                                                          │
│  - Terminology      - Widgets       - Navigation        │
│  - Workflows        - Branding      - Features          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Experience configurations include:**
- Custom terminology (e.g., "ATO" vs "Certification")
- Tailored dashboards and widgets
- Industry-specific workflows
- Custom navigation and feature visibility

### 2. Multi-Tenant Architecture

Each organization has isolated data with strict boundary enforcement:

```
┌─────────────────────────────────────────────────────────┐
│                    MULTI-TENANCY                         │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │   Organization A │  │   Organization B │              │
│  │  ┌─────────────┐│  │  ┌─────────────┐│              │
│  │  │   Users     ││  │  │   Users     ││              │
│  │  │   Systems   ││  │  │   Systems   ││              │
│  │  │   Controls  ││  │  │   Controls  ││              │
│  │  │   Evidence  ││  │  │   Evidence  ││              │
│  │  └─────────────┘│  │  └─────────────┘│              │
│  └─────────────────┘  └─────────────────┘              │
│           │                    │                        │
│           └────────────────────┘                        │
│                    ▼                                     │
│            Shared Framework Data                         │
│         (NIST, FedRAMP, HIPAA, etc.)                    │
└─────────────────────────────────────────────────────────┘
```

### 3. Edge-First Computing

All API logic runs at Cloudflare's edge locations (300+ cities globally):

- **Low Latency:** Requests processed at nearest edge location
- **High Availability:** Automatic failover across edge network
- **Global Scale:** No single point of failure

---

## Technology Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework with concurrent features |
| TypeScript | Type safety and developer experience |
| Vite | Fast build tool and dev server |
| TailwindCSS | Utility-first styling |
| React Router | Client-side routing |
| Recharts | Data visualization |
| Zod | Runtime schema validation |
| jsPDF | PDF generation |

### Backend

| Technology | Purpose |
|------------|---------|
| Cloudflare Workers | Serverless compute at edge |
| D1 Database | SQLite-compatible serverless database |
| KV | Low-latency key-value storage |
| R2 | S3-compatible object storage |
| Workers AI | AI/ML inference at edge |

### External Services

| Service | Purpose |
|---------|---------|
| Sentry | Error tracking and monitoring |
| Resend | Transactional email delivery |

---

## Database Schema

### Entity Relationship Overview

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│organizations│──────│   users     │──────│   systems   │
└─────────────┘      └─────────────┘      └─────────────┘
       │                                         │
       │                                         │
       ▼                                         ▼
┌─────────────┐                          ┌─────────────┐
│  frameworks │                          │implementations│
│  (enabled)  │                          └─────────────┘
└─────────────┘                                 │
       │                                         │
       ▼                                         ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  controls   │──────│  crosswalks │      │  evidence   │
└─────────────┘      └─────────────┘      └─────────────┘
       │
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│    risks    │ │    poams    │ │  policies   │
└─────────────┘ └─────────────┘ └─────────────┘
```

### Key Tables (34 Total)

| Category | Tables |
|----------|--------|
| Core | organizations, users, refresh_tokens, experience_configs |
| Frameworks | compliance_frameworks, security_controls, control_crosswalks, organization_frameworks |
| Systems | systems, control_implementations, ssp_documents |
| Evidence | evidence, evidence_control_links, evidence_schedules, monitoring_check_results |
| Risk/POA&M | risks, poams, poam_milestones, poam_comments, vendors |
| Policies | policies, policy_attestations, policy_control_links, audit_checklist_items |
| AI | ai_templates, ai_documents |
| Workflow | approval_requests, notifications, notification_preferences, audit_logs |
| Scoring | compliance_snapshots, addon_modules, organization_addons |

---

## API Architecture

### Request Flow

```
┌─────────┐    ┌─────────────────────────────────────────────────┐
│ Request │───▶│              Cloudflare Worker                   │
└─────────┘    │  ┌─────────────────────────────────────────────┐│
               │  │ 1. CORS Handling                            ││
               │  │    - Validate origin                        ││
               │  │    - Set security headers                   ││
               │  ├─────────────────────────────────────────────┤│
               │  │ 2. Rate Limiting                            ││
               │  │    - Check request count                    ││
               │  │    - Return 429 if exceeded                 ││
               │  ├─────────────────────────────────────────────┤│
               │  │ 3. Authentication                           ││
               │  │    - Validate JWT token                     ││
               │  │    - Check token expiration                 ││
               │  │    - Refresh if needed                      ││
               │  ├─────────────────────────────────────────────┤│
               │  │ 4. Authorization                            ││
               │  │    - Verify org membership                  ││
               │  │    - Check role permissions                 ││
               │  ├─────────────────────────────────────────────┤│
               │  │ 5. Input Validation                         ││
               │  │    - Validate request body                  ││
               │  │    - Sanitize inputs                        ││
               │  ├─────────────────────────────────────────────┤│
               │  │ 6. Business Logic                           ││
               │  │    - Process request                        ││
               │  │    - Database operations                    ││
               │  │    - AI inference (if needed)               ││
               │  ├─────────────────────────────────────────────┤│
               │  │ 7. Audit Logging                            ││
               │  │    - Log action to audit_logs               ││
               │  │    - Send to Sentry if error                ││
               │  └─────────────────────────────────────────────┘│
               └─────────────────────────────────────────────────┘
                                      │
                                      ▼
                              ┌─────────────┐
                              │  Response   │
                              └─────────────┘
```

### Authentication Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION FLOW                          │
│                                                                   │
│  ┌─────────┐                                    ┌─────────────┐  │
│  │  Login  │───────────────────────────────────▶│   Verify    │  │
│  │ Request │                                    │  Password   │  │
│  └─────────┘                                    └──────┬──────┘  │
│                                                        │         │
│                                    ┌───────────────────┴───────┐ │
│                                    ▼                           ▼ │
│                          ┌─────────────────┐          ┌────────┐ │
│                          │  MFA Required?  │──Yes────▶│  MFA   │ │
│                          └────────┬────────┘          │ Verify │ │
│                                   │No                 └───┬────┘ │
│                                   ▼                       │      │
│                          ┌─────────────────┐              │      │
│                          │  Generate JWT   │◀─────────────┘      │
│                          │  Access Token   │                     │
│                          │  Refresh Token  │                     │
│                          └────────┬────────┘                     │
│                                   │                              │
│                                   ▼                              │
│                          ┌─────────────────┐                     │
│                          │ Store in        │                     │
│                          │ sessionStorage  │                     │
│                          └─────────────────┘                     │
└──────────────────────────────────────────────────────────────────┘
```

### Token Refresh Flow

```
Access Token (15 min) ──expires──▶ Refresh Token (7 days) ──▶ New Tokens
         │                                    │
         │                                    │
         ▼                                    ▼
   API Requests                          Silent Refresh
   with Bearer Token                     on 401 Response
```

---

## Security Architecture

### Defense in Depth

```
┌─────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Layer 1: Edge Security (Cloudflare)                        │ │
│  │ - DDoS protection                                          │ │
│  │ - WAF rules                                                │ │
│  │ - Bot management                                           │ │
│  │ - SSL/TLS termination                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Layer 2: Application Security                              │ │
│  │ - CORS validation                                          │ │
│  │ - Rate limiting                                            │ │
│  │ - Input validation                                         │ │
│  │ - SQL injection prevention (parameterized queries)         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Layer 3: Authentication & Authorization                    │ │
│  │ - JWT token validation                                     │ │
│  │ - MFA support (TOTP)                                       │ │
│  │ - Role-based access control                                │ │
│  │ - Organization isolation                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Layer 4: Data Security                                     │ │
│  │ - Encryption at rest (D1, R2)                             │ │
│  │ - Encryption in transit (TLS 1.3)                         │ │
│  │ - Session token storage (sessionStorage)                   │ │
│  │ - Password hashing (bcrypt)                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Layer 5: Security Headers                                  │ │
│  │ - Content-Security-Policy                                  │ │
│  │ - Strict-Transport-Security                               │ │
│  │ - X-Content-Type-Options                                  │ │
│  │ - X-Frame-Options                                         │ │
│  │ - Referrer-Policy                                         │ │
│  │ - Permissions-Policy                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **viewer** | Read-only access to assigned systems |
| **analyst** | viewer + Create/edit implementations, evidence |
| **manager** | analyst + Create systems, manage POAMs, approve workflows |
| **admin** | manager + User management, organization settings |
| **owner** | admin + Billing, delete organization, transfer ownership |

---

## Feature Architecture

### Control Inheritance

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONTROL INHERITANCE                           │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 Enterprise Cloud (Parent)                │    │
│  │  AC-1: Implemented ─────────────────────┐               │    │
│  │  AC-2: Implemented ─────────────────────┤               │    │
│  │  SC-8: Implemented ─────────────────────┤               │    │
│  └─────────────────────────────────────────┼───────────────┘    │
│                                             │                    │
│              ┌──────────────────────────────┼───────┐            │
│              ▼                              ▼       ▼            │
│  ┌───────────────────────┐    ┌───────────────────────┐         │
│  │   App System A        │    │   App System B        │         │
│  │   (Child)             │    │   (Child)             │         │
│  │                       │    │                       │         │
│  │   AC-1: Inherited ◀───│    │   AC-1: Inherited ◀───│         │
│  │   AC-2: Inherited ◀───│    │   AC-2: Partial       │         │
│  │   SC-8: Inherited ◀───│    │   SC-8: Inherited ◀───│         │
│  │   AU-2: Implemented   │    │   AU-2: Planned       │         │
│  └───────────────────────┘    └───────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Compliance Scoring

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLIANCE SCORING ENGINE                     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Dimension Weights                     │    │
│  │                                                          │    │
│  │  ┌────────────────────────────────────────────────────┐ │    │
│  │  │ Control Implementation         │████████████│ 40%  │ │    │
│  │  ├────────────────────────────────────────────────────┤ │    │
│  │  │ Evidence Coverage              │█████████   │ 30%  │ │    │
│  │  ├────────────────────────────────────────────────────┤ │    │
│  │  │ Risk Management                │██████      │ 20%  │ │    │
│  │  ├────────────────────────────────────────────────────┤ │    │
│  │  │ Policy Attestation             │███         │ 10%  │ │    │
│  │  └────────────────────────────────────────────────────┘ │    │
│  │                                                          │    │
│  │  Overall Score: 82 ──▶ Letter Grade: B                  │    │
│  │                                                          │    │
│  │  Grade Scale: A (90-100), B (80-89), C (70-79),         │    │
│  │               D (60-69), F (<60)                        │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Continuous Monitoring

```
┌─────────────────────────────────────────────────────────────────┐
│                   CONTINUOUS MONITORING                          │
│                                                                  │
│  ┌─────────────────┐                                            │
│  │  Scheduled Jobs │                                            │
│  │  (CRON Triggers)│                                            │
│  │                 │                                            │
│  │  0 6 * * *      │──Daily──▶ Evidence Schedule Checks         │
│  │  (6 AM UTC)     │          Compliance Alerts                 │
│  │                 │          Email Digests                     │
│  │                 │                                            │
│  │  0 8 * * 1      │──Weekly─▶ Weekly Summary Digest            │
│  │  (Mon 8 AM UTC) │                                            │
│  └─────────────────┘                                            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Monitoring Checks                       │    │
│  │                                                          │    │
│  │  • Evidence freshness validation                        │    │
│  │  • POA&M deadline tracking                              │    │
│  │  • ATO expiration alerts                                │    │
│  │  • Compliance drift detection                           │    │
│  │  • Risk level changes                                   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                        App.tsx                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    ErrorBoundary                           │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │                    AuthProvider                      │ │ │
│  │  │  ┌────────────────────────────────────────────────┐ │ │ │
│  │  │  │                ToastProvider                   │ │ │ │
│  │  │  │  ┌──────────────────────────────────────────┐ │ │ │ │
│  │  │  │  │              Routes                      │ │ │ │ │
│  │  │  │  │  ┌────────────────────────────────────┐ │ │ │ │ │
│  │  │  │  │  │            Layout                  │ │ │ │ │ │
│  │  │  │  │  │  ┌──────────────────────────────┐ │ │ │ │ │ │
│  │  │  │  │  │  │    Sidebar    │    Main     │ │ │ │ │ │ │
│  │  │  │  │  │  │               │   Content   │ │ │ │ │ │ │
│  │  │  │  │  │  │               │  ┌───────┐  │ │ │ │ │ │ │
│  │  │  │  │  │  │               │  │ Page  │  │ │ │ │ │ │ │
│  │  │  │  │  │  │               │  └───────┘  │ │ │ │ │ │ │
│  │  │  │  │  │  └──────────────────────────────┘ │ │ │ │ │ │
│  │  │  │  │  └────────────────────────────────────┘ │ │ │ │ │
│  │  │  │  └──────────────────────────────────────────┘ │ │ │ │
│  │  │  └────────────────────────────────────────────────┘ │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Code Splitting

Routes are lazy-loaded for optimal bundle size:

```typescript
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ControlsPage = lazy(() => import('./pages/ControlsPage'));
const SystemsPage = lazy(() => import('./pages/SystemsPage'));
// ... 40+ lazy-loaded pages
```

### State Management

| State Type | Technology | Use Case |
|------------|------------|----------|
| Server State | React Query patterns | API data fetching/caching |
| Auth State | React Context | User session, tokens |
| UI State | React useState/useReducer | Form state, modals |
| URL State | React Router | Filters, pagination |

---

## Data Flow

### API Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       DATA FLOW                                  │
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │   User   │───▶│  React   │───▶│   API    │───▶│    D1    │  │
│  │  Action  │    │Component │    │ Endpoint │    │ Database │  │
│  └──────────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘  │
│                       │               │               │         │
│                       │◀──────────────┴───────────────┘         │
│                       │          JSON Response                  │
│                       ▼                                         │
│                 ┌──────────┐                                    │
│                 │   Zod    │  Schema Validation                 │
│                 │ Validate │  (Type Safety)                     │
│                 └────┬─────┘                                    │
│                       │                                         │
│                       ▼                                         │
│                 ┌──────────┐                                    │
│                 │  Update  │                                    │
│                 │   State  │                                    │
│                 └────┬─────┘                                    │
│                       │                                         │
│                       ▼                                         │
│                 ┌──────────┐                                    │
│                 │  Re-render│                                   │
│                 │    UI    │                                    │
│                 └──────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT PIPELINE                           │
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │   Git    │───▶│  GitHub  │───▶│  Build   │───▶│ Cloudflare│  │
│  │   Push   │    │  Actions │    │  & Test  │    │  Deploy   │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                                                                  │
│  Environments:                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Development  ──▶  Staging  ──▶  Production             │    │
│  │  (local)          (staging)     (main branch)            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Infrastructure:                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  • Workers: forge-comply360-api.workers.dev             │    │
│  │  • Pages: forgecomply360.pages.dev                      │    │
│  │  • D1: forge-comply360-db                               │    │
│  │  • R2: forge-evidence                                   │    │
│  │  • KV: Session cache                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### Supported Integrations

| Category | Integration |
|----------|-------------|
| **Email** | Resend (transactional emails) |
| **Error Tracking** | Sentry (frontend + backend) |
| **Webhooks** | Custom webhook endpoints |
| **Import Formats** | CSV, JSON, OSCAL SSP/Catalog |
| **Export Formats** | PDF, CSV, OSCAL |
| **Security Scanners** | Nessus (via scan import) |

### Webhook Events

```json
{
  "events": [
    "poam.created",
    "poam.updated",
    "poam.completed",
    "evidence.uploaded",
    "implementation.updated",
    "risk.created",
    "risk.level_changed",
    "ato.expiring",
    "compliance.score_changed"
  ]
}
```

---

## Performance Considerations

### Optimization Strategies

1. **Edge Computing:** API runs at 300+ edge locations
2. **Code Splitting:** 40+ lazy-loaded route chunks
3. **Database Indexing:** Optimized queries with proper indexes
4. **Caching:** KV for session data, browser caching for static assets
5. **Compression:** Gzip compression for API responses
6. **CDN:** Static assets served from Cloudflare CDN

### Bundle Analysis

| Bundle | Size (gzip) |
|--------|-------------|
| Main bundle | ~54 KB |
| React vendor | ~54 KB |
| Charts vendor | ~105 KB |
| PDF vendor | ~138 KB |
| Total initial | ~250 KB |

---

## Future Architecture Considerations

### Planned Enhancements

1. **Real-time Updates:** WebSocket support for live dashboard updates
2. **Mobile App:** React Native app sharing business logic
3. **SSO Integration:** SAML/OIDC enterprise authentication
4. **Advanced Analytics:** Time-series compliance trending
5. **API Gateway:** Rate limiting, API key management
6. **Multi-region:** Active-active deployment across regions

---

*Document maintained by Forge Cyber Defense Engineering Team*
*Last updated: February 2025*
