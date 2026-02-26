# Forge Cyber Defense — Full Platform Hybrid Deployment Guide
# Cloudflare + Hetzner + Xiid SealedTunnel

**Version:** 6.2.0
**Date:** 2026-02-26
**Author:** Forge Cyber Defense (SDVOSB)

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Why Cloudflare + Hetzner](#why-cloudflare--hetzner)
3. [Recommended Configuration](#recommended-configuration)
4. [Architecture Overview](#architecture-overview)
5. [Xiid SealedTunnel Integration](#xiid-sealedtunnel-integration)
6. [Cross-Domain Classification & Air-Gap Deployment](#cross-domain-classification--air-gap-deployment)
7. [Component Placement](#component-placement)
8. [Hetzner Server Setup](#hetzner-server-setup)
9. [Full-Platform Docker Compose](#full-platform-docker-compose)
10. [Cloudflare Configuration](#cloudflare-configuration)
11. [Networking & Security](#networking--security)
12. [Forge-Reporter Integration](#forge-reporter-integration)
13. [Forge-Scan Integration](#forge-scan-integration)
14. [ForgeAI Govern Integration](#forgeai-govern-integration)
15. [CI/CD Pipeline](#cicd-pipeline)
16. [NIST 800-53 Control Mapping](#nist-800-53-control-mapping)
17. [Certification Roadmap & Competitive Differentiation](#certification-roadmap--competitive-differentiation)
18. [Implementation Sprint Plan](#implementation-sprint-plan)
19. [Schema & API Changes](#schema--api-changes)
20. [Monitoring & Observability](#monitoring--observability)
21. [Backup & Disaster Recovery](#backup--disaster-recovery)
22. [Cost Estimates](#cost-estimates)
23. [Migration Path from Pure Cloudflare](#migration-path-from-pure-cloudflare)

---

## Platform Overview

The Forge Cyber Defense platform is a suite of four interconnected products:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     FORGE CYBER DEFENSE PLATFORM                        │
│                                                                         │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐  │
│  │  ForgeComply 360   │  │  Forge-Reporter    │  │   Forge-Scan      │  │
│  │  ─────────────────│  │  ─────────────────│  │  ─────────────────│  │
│  │  Enterprise GRC    │  │  NIST RMF SSP      │  │  Vulnerability    │  │
│  │  Platform          │  │  Document Wizard   │  │  Management &     │  │
│  │                    │  │                    │  │  Scanning Engine   │  │
│  │  • 28 frameworks   │  │  • 23-section SSP  │  │  • ForgeScan      │  │
│  │  • 700+ controls   │  │  • OSCAL 1.1.2     │  │  • ForgeScan 360  │  │
│  │  • Evidence vault  │  │  • AI-assisted     │  │  • ForgeSOC       │  │
│  │  • Risk register   │  │  • Offline-first   │  │  • ForgeRedOps    │  │
│  │  • POA&M tracking  │  │  • PDF/XML/JSON    │  │  • Rust engine    │  │
│  │  • ForgeML Writer  │  │  • Cloud sync      │  │  • CVE/NVD/STIG   │  │
│  └────────┬───────────┘  └────────┬───────────┘  └────────┬───────────┘  │
│           │                       │                        │              │
│           └───────────────────────┼────────────────────────┘              │
│                                   │                                       │
│                    ┌──────────────▼──────────────┐                        │
│                    │     ForgeAI Govern           │                        │
│                    │     ────────────────         │                        │
│                    │     AI Governance &          │                        │
│                    │     Risk Management          │                        │
│                    │                              │                        │
│                    │     • AI Asset Registry      │                        │
│                    │     • NIST AI RMF            │                        │
│                    │     • Algorithmic Impact     │                        │
│                    │     • Vendor Assessment      │                        │
│                    │     • Incident Management    │                        │
│                    └─────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────────┘
```

| Product | Repository | Tech Stack | Current Hosting |
|---------|-----------|-----------|-----------------|
| **ForgeComply 360** | `Bjay0727-jay/ForgeComply360` | React + CF Workers + D1/KV/R2 | Cloudflare Workers + Pages |
| **Forge-Reporter** | `Bjay0727-jay/Forge-Reporter` | React 19 + TypeScript + Vite | Cloudflare Pages |
| **Forge-Scan** | `Bjay0727-jay/Forge-Scan` | Rust (engine) + TypeScript (platform) | Cloudflare Workers |
| **ForgeAI Govern** | `Bjay0727-jay/AI-Governance` | HTML/JS + CF Workers + D1/KV/R2 | Cloudflare Workers + Pages |

---

## Why Cloudflare + Hetzner

ForgeComply 360 currently supports three deployment modes:

| Mode | Stack | Best For | Recommendation |
|------|-------|----------|---------------|
| **Cloud-native** | Cloudflare Workers + D1 + R2 + KV | Low-ops SaaS delivery | Development/staging only |
| **Hybrid (CF + Hetzner)** | Cloudflare Pages + Hetzner backend | Production SaaS + federal | **RECOMMENDED for production** |
| **On-premises** | Docker Compose (PostgreSQL, Redis, MinIO, Ollama) | Air-gapped/SCIF environments | DoD IL5/TS only |

The **hybrid Cloudflare + Hetzner** deployment combines the strengths of cloud and bare metal:

- **Cloudflare** handles what it does best: global CDN, DDoS protection, WAF, DNS, TLS termination, and static asset delivery
- **Hetzner** provides cost-effective, high-performance bare metal or cloud VMs for stateful workloads: databases, AI inference, vulnerability scanning, and background processing
- **Xiid SealedTunnel** (optional, replaces Cloudflare Tunnel) provides DoD ATO-certified, quantum-resistant, zero-knowledge network connectivity

### When to choose this architecture

- You need **PostgreSQL** instead of D1 (SQLite) for higher concurrency, full-text search, or data-residency requirements
- You want to run **Ollama/local AI** for ForgeML Writer without Workers AI usage costs
- You need **dedicated compute** for Forge-Scan's Rust vulnerability scanning engine
- You want **predictable monthly costs** (Hetzner) with **elastic edge performance** (Cloudflare)
- You require **Xiid SealedTunnel** for DoD/federal environments requiring quantum-resistant, zero-knowledge connectivity
- Your compliance framework requires data to reside in a specific jurisdiction (Hetzner Falkenstein/Nuremberg for EU, Ashburn for US)

---

## Recommended Configuration

This guide presents multiple options for each architectural decision. The table below captures the
recommended configuration for most deployments, optimized for Forge Cyber Defense's position as an
SDVOSB targeting federal/DoD procurement while maintaining a viable commercial SaaS offering.

| Decision | Recommended Option | Rationale |
|----------|-------------------|-----------|
| **Tunnel technology** | Option 2: Xiid + Cloudflare (Defense in Depth) | Cloudflare provides free L7 WAF/DDoS for commercial SaaS tier; Xiid adds quantum-resistant zero-knowledge tunneling for federal. Neither alone covers both markets |
| **Server configuration** | Option B: AX42 Dedicated (~€97/mo) | 64 GB RAM handles full 4-product stack + Ollama. Option A (16 GB) is too tight for AI inference + scanning. Option C (multi-server) is premature before 500+ users |
| **Deployment mode** | Hybrid (Cloudflare Pages + Hetzner backend) | Cloudflare Pages for global CDN (free); Hetzner for stateful workloads (PostgreSQL, Ollama, Rust scanner). Pure Cloudflare hits Workers limits; pure on-prem is only for air-gap/SCIF |
| **AI inference** | Ollama on-premises default; Claude API optional premium | Ollama on AX42 = zero marginal cost per inference; data never leaves your infrastructure. Federal customers require on-prem AI. Offer Claude API as premium tier for higher-quality generation |
| **Target classification** | FedRAMP Moderate first, IL4-ready architecture | FedRAMP Moderate covers broadest federal market (civilian agencies). SOC 2 → TX-RAMP → FedRAMP Ready → FedRAMP Moderate sequence. Keep architecture IL4-ready so DoD pivot is configuration, not re-architecture |
| **Integration pattern** | API gateway federation (planned); webhooks interim | Products share PostgreSQL instance with isolated databases. Webhook system (14+ event types) provides loose coupling now. Build toward API gateway (Kong/Caddy/Workers route) for cross-product federation |
| **SSO strategy** | ForgeComply 360 as single identity provider | ForgeComply 360 already issues scoped tokens for Reporter and validates Scan engine JWTs. Standardize all products on ForgeComply-issued tokens. Long-term: Xiid ZKP SSO → ForgeComply JWT → all products |

### Decision Flow

```
                            ┌──────────────────────────┐
                            │  What is your deployment  │
                            │  environment?              │
                            └─────────┬────────────────┘
                                      │
                   ┌──────────────────┼──────────────────┐
                   ▼                  ▼                  ▼
            Commercial SaaS      Federal/CUI         DoD IL4/IL5
            (SOC 2, HIPAA)       (FedRAMP Mod)       (CMMC L3)
                   │                  │                  │
                   ▼                  ▼                  ▼
            Option B: AX42      Option B: AX42      Option C: Multi-Server
            CF Tunnel only      Xiid + Cloudflare   Xiid replaces CF Tunnel
            Ollama default      Ollama default      Ollama mandatory
            Cloud AI optional   Cloud AI disabled   Air-gap overlay
                   │                  │                  │
                   └──────────────────┼──────────────────┘
                                      ▼
                            ForgeComply 360 = IdP
                            Webhook integration now
                            API gateway sprint planned
```

### Cost Comparison by Configuration

| Configuration | Monthly Cost | Target Market |
|--------------|-------------|---------------|
| Option B + CF Tunnel (commercial) | ~€97/mo (~$106) | SaaS customers, SOC 2, HIPAA |
| Option B + Xiid + CF (federal) | ~€97/mo + Xiid license | FedRAMP Moderate, CUI, CMMC L2 |
| Option C + Xiid only (DoD) | ~€269/mo + Xiid license | DoD IL4/IL5, CMMC L3, air-gap |

> **Start with Option B + Xiid + Cloudflare.** This configuration serves both commercial and
> federal customers from a single infrastructure. Upgrade to Option C only when scan volume,
> user count, or DoD IL5 requirements demand dedicated servers.

---

## Architecture Overview

### With Cloudflare Tunnel (Standard)

```
                        ┌─────────────────────────────────────────┐
                        │           CLOUDFLARE EDGE                │
                        │                                          │
  Browser ─────────────▶│  ┌──────────────────────────────────┐   │
                        │  │   Cloudflare Pages (CDN)          │   │
                        │  │   ForgeComply 360 SPA             │   │
                        │  │   Forge-Reporter SPA              │   │
                        │  │   ForgeAI Govern SPA              │   │
                        │  └──────────────────────────────────┘   │
                        │                                          │
                        │  ┌──────────────────────────────────┐   │
                        │  │   Cloudflare DNS + WAF            │   │
                        │  │   DDoS Protection                 │   │
                        │  │   SSL/TLS Termination             │   │
                        │  └──────────┬───────────────────────┘   │
                        └─────────────┼───────────────────────────┘
                                      │
                           ┌──────────▼──────────┐
                           │  Cloudflare Tunnel   │
                           │  (cloudflared)       │
                           └──────────┬──────────┘
                                      │
                        ┌─────────────┼───────────────────────────────┐
                        │    HETZNER SERVER(S)                         │
                        │             │                                │
                        │  ┌──────────▼──────────────────────────┐    │
                        │  │            nginx (reverse proxy)     │    │
                        │  │  /api/*  →  forgecomply-api:8443    │    │
                        │  │  /scan/* →  forgescan-api:8444      │    │
                        │  │  /ai/*   →  forgeai-api:8445        │    │
                        │  └──────────┬──────────────────────────┘    │
                        │             │                                │
                        │  ┌──────────▼─────────────────────────────┐ │
                        │  │              APPLICATION TIER            │ │
                        │  │  ┌──────────┐ ┌──────────┐ ┌─────────┐│ │
                        │  │  │ForgeComply│ │Forge-Scan│ │ForgeAI  ││ │
                        │  │  │   360 API │ │  Engine  │ │Govern   ││ │
                        │  │  │  :8443    │ │  :8444   │ │ :8445   ││ │
                        │  │  └─────┬─────┘ └─────┬────┘ └────┬────┘│ │
                        │  └────────┼─────────────┼───────────┼─────┘ │
                        │           │             │           │        │
                        │  ┌────────▼─────────────▼───────────▼─────┐ │
                        │  │              DATA TIER                   │ │
                        │  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐ │ │
                        │  │ │  PG  │ │Redis │ │MinIO │ │ Ollama │ │ │
                        │  │ │:5432 │ │:6379 │ │:9000 │ │:11434  │ │ │
                        │  │ └──────┘ └──────┘ └──────┘ └────────┘ │ │
                        │  └────────────────────────────────────────┘ │
                        │                                              │
                        │  ┌────────────────────────────────────────┐ │
                        │  │  Prometheus + Grafana (monitoring)      │ │
                        │  └────────────────────────────────────────┘ │
                        └──────────────────────────────────────────────┘
```

### With Xiid SealedTunnel (Federal/DoD)

```
                        ┌─────────────────────────────────────────┐
                        │           CLOUDFLARE EDGE                │
                        │   (CDN + WAF + DDoS only, no tunnel)    │
                        │                                          │
  Browser ─────────────▶│  ┌──────────────────────────────────┐   │
                        │  │   Cloudflare Pages (CDN)          │   │
                        │  │   Static SPAs only                │   │
                        │  └──────────────────────────────────┘   │
                        │                                          │
                        │  ┌──────────────────────────────────┐   │
                        │  │   DNS → api.forgecomply360.com    │   │
                        │  │   Proxy mode: OFF (DNS-only)      │   │
                        │  │   Traffic routes to Xiid endpoint │   │
                        │  └──────────┬───────────────────────┘   │
                        └─────────────┼───────────────────────────┘
                                      │
                  ┌───────────────────┼───────────────────────────────┐
                  │      XIID SEALEDTUNNEL LAYER                      │
                  │                   │                                │
                  │  ┌────────────────▼─────────────────────────┐     │
                  │  │         Xiid Collector (Cloud)            │     │
                  │  │   • No inbound access to private domain  │     │
                  │  │   • Anonymized authentication data        │     │
                  │  │   • Queues encrypted requests             │     │
                  │  └────────────────┬─────────────────────────┘     │
                  │                   │ Outbound-only polling          │
                  │                   │ Triple-layer quantum-resistant │
                  │                   │ encryption (port 443 only)     │
                  │  ┌────────────────▼─────────────────────────┐     │
                  │  │     Xiid SealedTunnel Agent (Hetzner)    │     │
                  │  │   • Outbound-only connections             │     │
                  │  │   • Zero open inbound ports               │     │
                  │  │   • Process-to-process encryption         │     │
                  │  │   • DoD ATO certified                     │     │
                  │  └────────────────┬─────────────────────────┘     │
                  └───────────────────┼───────────────────────────────┘
                                      │
                        ┌─────────────┼───────────────────────────────┐
                        │    HETZNER SERVER(S)                         │
                        │             │                                │
                        │  ┌──────────▼──────────────────────────┐    │
                        │  │   ForgeComply 360 + Forge-Scan +    │    │
                        │  │   ForgeAI Govern (full stack)       │    │
                        │  └─────────────────────────────────────┘    │
                        └──────────────────────────────────────────────┘
```

---

## Xiid SealedTunnel Integration

Xiid's Terniion architecture, anchored by SealedTunnel technology, eliminates attack surfaces rather than merely defending against them. By wrapping every AI inference call, agent communication channel, evidence repository, and CI/CD pipeline in outbound-only, triple-encrypted, quantum-resistant tunnels, Xiid transforms ForgeComply 360's most vulnerable components into network-invisible resources.

### Why Xiid Instead of (or Alongside) Cloudflare Tunnel

| Feature | Cloudflare Tunnel | Xiid SealedTunnel |
|---------|------------------|-------------------|
| **Encryption** | QUIC/HTTP2 tunnel encryption | Triple-layer quantum-resistant (Kyber KEX + Dilithium signatures) |
| **Trust model** | Zero Trust (Cloudflare sees plaintext) | **Zero Knowledge** (even Xiid cannot see traffic) |
| **Port requirements** | Outbound 443 | Outbound 443 only |
| **DoD ATO** | No | **Yes** — DISA-validated, AFRL-tested |
| **FIPS compliance** | Partial | FIPS 203 (Kyber) + FIPS 204 (Dilithium) aligned |
| **Collector compromise** | N/A | Attacker still cannot access private resources |
| **Moving Target Defense** | No | Yes — servers can move without IP reconfiguration |
| **Authentication** | OAuth/SAML/MFA | ZKP SSO — no credentials ever stored or transmitted |
| **AI inference sealing** | No | Process-isolated SealedTunnel per inference endpoint |
| **Agent isolation** | No | Per-agent dedicated SealedTunnel channels |
| **Cost** | Free (basic) / $7/user (Access) | Enterprise licensing (contact Xiid) |
| **Best for** | Commercial SaaS deployments | Federal/DoD, CMMC L3, IL4/IL5, financial |

### Key Differentiators Enabled by Integration

| Capability | Before Xiid | After Xiid Integration |
|-----------|-------------|----------------------|
| AI Inference Security | Claude API: standard TLS only | SealedTunnel wraps all inference calls; endpoints invisible to scanning |
| ForgeRedOps Agent Isolation | 24 agents share network infrastructure | Each agent: dedicated process-isolated SealedTunnel channel |
| RAG Knowledge Base | Vector DB accessible via network | Control mapping embeddings: closed inbound ports, poisoning prevented |
| Air-Gap Deployment | Claimed — no cryptographic enforcement | Provable: Ollama/Llama 3 inference with zero inbound ports; gateway via SealedTunnel |
| CI/CD Pipeline | GitHub Actions runners: standard auth | Runners: all inbound closed; no credential exposure; lateral movement blocked |
| Evidence Vault | SHA-256 integrity only | SealedTunnel delivery + SHA-256; tamper-proof chain of custody |
| Authentication | JWT + PBKDF2 only | Xiid Zero-Knowledge Proof SSO; no credentials ever stored or transmitted |
| Multi-Cloud Connectivity | Standard VPC peering | Cross-domain auth via Xiid SDN; Unclassified/Secret/TS isolation |
| Nessus Import Pipeline | HTTPS file upload | .nessus file transfer via SealedTunnel; Tenable SC connectivity sealed |
| SIEM / SOC Integration | Standard syslog/API | Agent audit trail: cryptographic non-repudiation; anomaly baseline |

### 6-Layer Integration Architecture

The Xiid integration operates across six distinct layers of the ForgeComply 360 architecture. Each layer addresses a specific threat vector, with SealedTunnel protection applied at the **process level** rather than the network perimeter level.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                LAYER 1: Xiid Terniion Control Plane                          │
│  ┌────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ Xiid SSO / │ │ SealedTunnel │ │ Multi-Cloud  │ │  Agent Audit / SIEM  │ │
│  │ ZKP Auth   │ │ Broker       │ │ Orchestration│ │  Non-repudiation     │ │
│  └─────┬──────┘ └──────┬───────┘ └──────┬───────┘ └──────────┬───────────┘ │
├────────┼───────────────┼────────────────┼────────────────────┼─────────────┤
│        │    LAYER 2: Cloudflare Edge (ForgeComply 360 Core)  │             │
│  ┌─────▼──────────────────┐  ┌────────────────┐  ┌──────────▼──────────┐  │
│  │ API Workers (forge-api) │  │ Evidence Vault │  │ ComplianceFoundry / │  │
│  │ Scanner auth → Xiid SSO │  │ R2 + sealed   │  │ ControlPulse drift  │  │
│  └─────┬──────────────────┘  └───────┬────────┘  └──────────┬──────────┘  │
├────────┼─────────────────────────────┼───────────────────────┼─────────────┤
│        │    LAYER 3: AI / ForgeML Inference Engine            │             │
│  ┌─────▼──────────┐  ┌──────────────▼───────┐  ┌────────────▼──────────┐  │
│  │ Claude API      │  │ Ollama/Llama 3       │  │ RAG Vector DB         │  │
│  │ (cloud SaaS)    │  │ (on-prem air-gap)    │  │ 1,189 control         │  │
│  │ Kyber+Dilithium │  │ Zero inbound ports   │  │ embeddings sealed     │  │
│  └────────────────┘  └──────────────────────┘  └────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────────┤
│             LAYER 4: ForgeScan 360 Engine                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │ Scanner Agent     │  │ Nessus Import    │  │ Cloud Connectors         │ │
│  │ Comms (STLink)    │  │ Pipeline sealed  │  │ AWS/Azure/GCP sealed     │ │
│  │ X-Scanner-Key →   │  │ .nessus via ST   │  │ Outbound-only SDK calls  │ │
│  │ Xiid SSO identity │  │ SHA-256 + sealed │  │                          │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────┤
│             LAYER 5: ForgeRedOps & ForgeSOC (Agent Isolation)              │
│  ┌──────────────────────────────────────┐  ┌──────────────────────────┐   │
│  │ ForgeRedOps: 24 Autonomous Agents     │  │ ForgeSOC SIEM Feeds      │   │
│  │ • Per-agent dedicated SealedTunnel    │  │ • Splunk/Sentinel/QRadar │   │
│  │ • Memory store isolation              │  │ • Cryptographic proof    │   │
│  │ • Closed inbound ports per agent      │  │ • Anomaly baseline       │   │
│  │ • Agent-to-agent comms sealed         │  │ • ControlPulse alerts    │   │
│  └──────────────────────────────────────┘  └──────────────────────────┘   │
├────────────────────────────────────────────────────────────────────────────┤
│             LAYER 6: CI/CD Pipeline (ForgeOps)                             │
│  ┌───────────────┐ ┌────────────────┐ ┌─────────────┐ ┌────────────────┐ │
│  │ GitHub Actions │ │ GHCR Container │ │ OPA/Rego    │ │ SBOM + NVD     │ │
│  │ Runners sealed│ │ Registry sealed│ │ Policy gates│ │ via SealedTunnel│ │
│  └───────────────┘ └────────────────┘ └─────────────┘ └────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Layer 1 — Xiid Terniion Control Plane

The Terniion control plane is the security orchestration layer above all ForgeComply 360 components. It manages the SealedTunnel broker, Zero-Knowledge authentication, multi-cloud orchestration, and the audit/SIEM integration for non-repudiable agent accountability.

| Control Plane Component | Function | ForgeComply 360 Protection Scope |
|------------------------|----------|----------------------------------|
| **Xiid SSO / ZKP Auth** | Passwordless identity via Zero Knowledge Proofs | All user sessions; service-to-service auth; eliminates stored credentials |
| **SealedTunnel Broker** | Outbound-only tunnel management; Kyber KEX; Dilithium signatures | Every component-to-component communication channel |
| **Multi-Cloud Orchestration** | Cross-domain software-defined networking | AWS GovCloud → Azure Gov → Cloudflare → On-prem; classification boundaries |
| **MLOps / AI Protection** | AI inference endpoint sealing; RAG protection | Claude API calls; Ollama/Llama 3 on-prem; vector DB; model registries |
| **Agentic AI Isolation** | Per-agent dedicated tunnel channels; memory isolation | All 24 ForgeRedOps autonomous agents; ForgeSOC agent workflows |
| **Agent Audit / SIEM** | Cryptographic proof of connection authenticity; correlation | Non-repudiable ForgeRedOps activity log; ForgeSOC anomaly baseline |

#### Layer 2 — Cloudflare Edge (ForgeComply 360 Core)

**API Workers (forge-api):** The Cloudflare Workers API is the central hub. The existing `X-Scanner-Key` header authentication is replaced with SealedTunnel-backed service identity — scanners authenticate through Xiid SSO rather than static API keys, eliminating the key rotation problem and preventing indefinite impersonation from compromised scanner binaries.

- **Connection model:** All scanner heartbeat, task retrieval, and result submission endpoints wrapped in SealedTunnel
- **Database access:** Service-to-service mTLS between Workers and D1/R2/KV sealed via Xiid rather than relying solely on Cloudflare's internal network trust
- **Artifact delivery:** Compliance artifact delivery (OSCAL JSON, SSP PDFs) to auditors and 3PAO assessors via SealedTunnel with sealed auditor read-only portal access

**Evidence Vault (R2 Storage):** The R2-based Evidence Vault stores SSPs, SARs, SAPs, and POA&M artifacts with SHA-256 integrity hashes. SealedTunnel adds a cryptographically enforced delivery layer — evidence cannot be tampered with in transit, and access is restricted to authenticated, process-isolated client applications.

**ComplianceFoundry and ControlPulse:** OSCAL artifact generation and continuous controls monitoring (2,847 automated tests/day) produce sensitive compliance data requiring secure delivery. ControlPulse drift detection alerts are delivered via SealedTunnel to SIEM integrations (Splunk, Sentinel, QRadar), preventing alert injection or suppression.

#### Layer 3 — AI / ForgeML Inference Engine

**Cloud Deployment (Claude API):** Every API call is wrapped in SealedTunnel, implementing the inference endpoint protection pattern from Xiid's AI security architecture:

| Protection Layer | Mechanism | NIST 800-53 Control |
|-----------------|-----------|---------------------|
| Endpoint invisibility | All inbound ports closed on Claude API client; outbound-only | SC-7 Boundary Protection |
| Process-to-process access | Only ForgeML process reaches Claude API — not the host or adjacent services | AC-3 Access Enforcement |
| Quantum-secure encryption | Kyber KEX + Dilithium signatures on every inference session | SC-8, SC-13 Transmission Confidentiality |
| Data leakage prevention | End-to-end encryption; query data never exposed in plaintext at endpoint | SC-28 Protection at Rest |
| Model IP protection | Model weights inaccessible; extraction attacks blocked by closed inbound ports | AC-4 Information Flow |
| Adversarial input blocking | Process isolation prevents injection from compromised adjacent services | SI-10 Information Input Validation |

**On-Premises / Air-Gap Deployment (Ollama / Llama 3) — RECOMMENDED DEFAULT:** Ollama running
llama3.1:8b on the Hetzner AX42 server is the recommended default for all deployment tiers.
Zero marginal cost per inference, compliance data never leaves your infrastructure, and federal
customers require on-prem AI. Cloud AI (Claude API) should be offered as an optional premium tier
for customers who need higher-quality generation and have no data residency constraints.

For DoD IL4/IL5 and CMMC Level 3 customers, local inference infrastructure operates with zero public IP addresses, zero inbound ports, and process-isolated SealedTunnel for inter-service communication. GPU clusters are microsegmented at the process level — a compromised training process cannot laterally reach the inference endpoint.

**RAG Control Mapping Knowledge Base:** The vector database powering ForgeComply 360's 94% accuracy control mapping (1,189 NIST 800-53 control embeddings, FedRAMP baselines, CMMC practices) is secured through process-isolated SealedTunnel connections with inbound ports closed. Embedding update operations require authenticated SealedTunnel connections with Xiid ZKP identity verification.

#### Layer 4 — ForgeScan 360 Engine

The ForgeScan Rust-based scanner binary communicates with the Cloudflare API via the existing STLink architecture (outbound-only on port 443 via loopback 127.0.0.5 through a Caddy exitpoint proxy). Xiid formalizes and cryptographically enforces this pattern:

| Communication Path | Current State | With SealedTunnel |
|-------------------|---------------|-------------------|
| Scanner → CF API heartbeat | X-Scanner-Key HTTPS | Xiid SSO identity; SealedTunnel outbound-only |
| Scanner → CF API results | POST /api/v1/scanner/tasks/:id/results | Process-to-process; no host-level network exposure |
| CF → Scanner (task pull) | Poll-based; scanner initiates outbound | Maintained outbound model; scanner never accepts inbound |
| Cloud connectors (AWS/Azure/GCP) | Standard cloud SDK auth | All cloud SDKs: outbound-only SealedTunnel; no cloud provider inbound access |
| Nessus → CF API (.nessus upload) | HTTPS multipart/form-data upload | SealedTunnel wraps file transfer; Tenable SC connectivity sealed |
| Tenable SC / Nessus Manager | Direct API integration | SealedTunnel; SHA-256 file hash deduplication + sealed delivery |

**Nessus Integration Pipeline Security:** The Nessus integration processes .nessus XML files containing vulnerability findings that feed into NIST 800-53 control mappings and POA&M generation. Upload endpoint (`POST /api/v1/scans/import`) operates via SealedTunnel — the 100MB .nessus file is never exposed on a standard HTTPS endpoint. SHA-256 file hash deduplication combined with SealedTunnel delivery provides end-to-end integrity. The `scan_imports` audit table preserves complete provenance with Xiid ZKP-verified identity for cryptographic non-repudiation.

#### Layer 5 — ForgeRedOps & ForgeSOC (Agent Isolation)

ForgeRedOps operates 24 autonomous AI penetration testing agents that test web applications, APIs, cloud configurations, and network infrastructure. These agents interact with hostile or untrusted targets. The Xiid agentic AI isolation pattern maps directly:

- **Per-agent channels:** Each of the 24 agents is assigned a dedicated, process-isolated SealedTunnel channel for communication with the ForgeComply 360 API and ForgeSOC
- **Memory isolation:** Agent memory stores (conversation history, testing state, target context) accessible only through process-isolated connections — cross-agent memory contamination blocked
- **Lateral movement prevention:** All agents operate with closed inbound ports — a compromised agent cannot directly attack other agents or the compliance platform
- **Agent coordination:** Agent-to-agent communication for coordinated testing wrapped in dedicated SealedTunnel connections; unauthorized agents cannot eavesdrop or inject content

**ForgeSOC Integration:** SIEM feeds (Splunk, Sentinel, QRadar) delivered via SealedTunnel. Xiid logging provides cryptographic non-repudiation of agent activities — SOC analysts can definitively attribute actions to specific agents, critical for FedRAMP continuous monitoring compliance documentation.

#### Layer 6 — CI/CD Pipeline (ForgeOps)

The GitHub Actions CI/CD pipeline for all Forge repositories builds Rust scanner binaries, Docker container images (GHCR), and OSCAL report generation toolchain:

| Pipeline Component | Repository | Xiid Protection |
|-------------------|-----------|-----------------|
| GitHub Actions runners | Forge-Scan, Forge-Reporter, AI-Governance | All inbound ports closed; no lateral movement between runners |
| GHCR container registry | ghcr.io/bjay0727-jay/forgescan-scanner | Registry: zero inbound access; model artifacts via SealedTunnel only |
| GitHub Releases (binaries) | linux-amd64/arm64/windows (cross-rs) | Deployment to scanners: SealedTunnel; no credential exposure |
| Forge-Reporter OSCAL gen | SSP, SAR, SAP, POA&M artifacts | Report delivery pipeline sealed; auditor access via ZKP auth |
| OPA/Rego compliance gates | Policy-as-code enforcement | Policy engine: process-isolated; gate pass/fail via sealed channels |
| SBOM generation | Dependency vulnerability scanning | NVD API calls: SealedTunnel; SBOM artifacts sealed in registry |
| AI-Governance platform | ForgeAI Govern / NIST AI RMF | AI asset registry and incident management: SealedTunnel access |

### Deployment Options

#### Option 1: Xiid Replaces Cloudflare Tunnel

Use this when you need the highest security posture (federal/DoD environments).

> **Note:** This option removes Cloudflare WAF/DDoS protection from the API path. You must
> provide your own L7 DDoS mitigation if you choose this option. See Option 2 for the
> recommended defense-in-depth approach.

```
Browser → Cloudflare CDN (static assets only)
       → Xiid SealedTunnel → Hetzner (API + data)
```

In this mode:
- Cloudflare Pages still serves the static frontend SPAs (CDN only)
- Cloudflare DNS is set to **DNS-only** (gray cloud) for API domains — no proxy
- All API traffic flows through Xiid SealedTunnel instead of Cloudflare Tunnel
- Cloudflare WAF is NOT in the path (Xiid handles security at the network layer)

#### Option 2: Xiid + Cloudflare (Defense in Depth) — RECOMMENDED

Use this for maximum layered security. **This is the recommended option** for most deployments —
it serves both commercial SaaS and federal customers from a single infrastructure:

```
Browser → Cloudflare CDN + WAF → Xiid SealedTunnel → Hetzner
```

In this mode:
- Cloudflare provides Layer 7 WAF, DDoS, and bot protection
- Xiid SealedTunnel replaces `cloudflared` as the connectivity layer
- Double encryption: Cloudflare TLS + Xiid triple-layer quantum encryption
- Even if Cloudflare is compromised, Xiid's zero-knowledge model protects the origin

#### Option 3: Xiid for Inter-Service Communication

Use Xiid to secure communication between Forge platform services across servers:

```
┌──────────────────────┐         ┌──────────────────────┐
│  Hetzner Server 1    │         │  Hetzner Server 2    │
│  ForgeComply 360 API │◄──ST──►│  Forge-Scan Engine   │
│  ForgeAI Govern API  │         │  (Rust scanner)      │
└──────────────────────┘         └──────────────────────┘
         ▲                                ▲
         │ ST                             │ ST
         ▼                                ▼
┌──────────────────────┐         ┌──────────────────────┐
│  Xiid Collector      │         │  Xiid Commander      │
│  (cloud-hosted)      │         │  (control plane)     │
└──────────────────────┘         └──────────────────────┘

ST = Xiid SealedTunnel (outbound-only, quantum-encrypted)
```

### Xiid Setup on Hetzner

```bash
# 1. Install Xiid SealedTunnel Agent on each Hetzner server
# (Download from Xiid portal after licensing)
wget https://downloads.xiid.com/sealedtunnel/latest/xiid-st-agent-linux-amd64
chmod +x xiid-st-agent-linux-amd64
mv xiid-st-agent-linux-amd64 /usr/local/bin/xiid-agent

# 2. Configure the agent
cat > /etc/xiid/config.yml << 'EOF'
agent:
  name: forgecomply-hetzner-prod
  collector_url: https://collector.xiid.com
  # Only outbound port 443 is required
  outbound_port: 443

services:
  # Expose ForgeComply 360 API via SealedTunnel
  - name: forgecomply-api
    local_address: 127.0.0.1:8443
    public_hostname: api.forgecomply360.com

  # Expose Forge-Scan API via SealedTunnel
  - name: forgescan-api
    local_address: 127.0.0.1:8444
    public_hostname: scan.forgecomply360.com

  # Expose ForgeAI Govern API via SealedTunnel
  - name: forgeai-api
    local_address: 127.0.0.1:8445
    public_hostname: ai.forgecomply360.com

  # Grafana monitoring (admin only)
  - name: grafana
    local_address: 127.0.0.1:3000
    public_hostname: monitoring.forgecomply360.com

  # ForgeRedOps per-agent channels (24 agents)
  - name: redops-agent-pool
    local_address: 127.0.0.1:8500-8523
    isolation: per-process
    channel_count: 24

authentication:
  # Xiid Aclave credentialless auth (FIDO2-compliant)
  method: aclave
  # Or use certificate-based auth for automated deployments
  # method: certificate
  # cert_path: /etc/xiid/certs/agent.pem

siem:
  # ForgeSOC SIEM feed configuration
  feeds:
    - type: splunk
      endpoint: sealed  # Delivered via SealedTunnel
    - type: sentinel
      endpoint: sealed
  audit:
    cryptographic_proof: true
    non_repudiation: true
EOF

# 3. Register the agent with Xiid Commander
xiid-agent register --config /etc/xiid/config.yml

# 4. Start the agent (systemd)
cat > /etc/systemd/system/xiid-agent.service << 'EOF'
[Unit]
Description=Xiid SealedTunnel Agent
After=network.target docker.service
Wants=docker.service

[Service]
Type=simple
ExecStart=/usr/local/bin/xiid-agent run --config /etc/xiid/config.yml
Restart=always
RestartSec=5
User=xiid
Group=xiid

[Install]
WantedBy=multi-user.target
EOF

systemctl enable xiid-agent
systemctl start xiid-agent
```

### Docker Compose with Xiid (replaces cloudflared container)

When using Xiid, replace the `cloudflared` service with:

```yaml
  # ── Xiid SealedTunnel Agent ──
  # NOTE: Xiid agent runs on the HOST (not in Docker) for maximum isolation.
  # It connects to services via host networking on 127.0.0.1.
  # Alternatively, run in Docker with host network mode:
  xiid-agent:
    image: xiid/sealedtunnel-agent:latest
    container_name: forgecomply-xiid
    restart: unless-stopped
    network_mode: host  # Required: agent needs direct host network access
    volumes:
      - /etc/xiid:/etc/xiid:ro
      - /var/run/xiid:/var/run/xiid
    environment:
      - XIID_CONFIG=/etc/xiid/config.yml
```

### Xiid vs Cloudflare Tunnel Decision Matrix

| Requirement | Use Cloudflare Tunnel | Use Xiid SealedTunnel | Recommended: Use Both |
|-------------|----------------------|----------------------|----------------------|
| Commercial SaaS | Yes | Optional | **Yes — CF WAF + Xiid** |
| CMMC Level 1-2 | Yes | Optional | **Yes — defense in depth** |
| CMMC Level 3 | Consider Xiid | **Yes** | **Yes — CF DDoS + Xiid ZKP** |
| DoD IL4/IL5 | No | **Yes** | Xiid only (CF proxy off) |
| FedRAMP Moderate | Yes | Recommended | **Yes — strongest posture** |
| FedRAMP High | Consider Xiid | **Yes** | **Yes — CF edge + Xiid** |
| HIPAA | Yes | Optional | **Yes — dual encryption** |
| Financial (SOX/PCI) | Yes | Recommended | **Yes — CF WAF + Xiid ZK** |
| Data sovereignty | Depends | **Yes** (zero knowledge) | Xiid required |
| Quantum-resistance | No | **Yes** | Xiid required |
| Budget-sensitive | Yes (free) | Enterprise licensing | CF free + Xiid license |

> **Recommendation:** The "Use Both" column reflects the defense-in-depth approach (Option 2).
> For most deployments, running both Cloudflare and Xiid provides the strongest security posture
> while maintaining Cloudflare's free WAF and DDoS protection for the commercial SaaS tier.

---

## Cross-Domain Classification & Air-Gap Deployment

ForgeComply 360's deployment model spans cloud SaaS (Cloudflare global edge), dedicated GovCloud (AWS GovCloud / Azure Government), and on-premises air-gapped environments. Xiid's multi-cloud orchestration capability directly enables the classification-boundary separation required for DoD IL4/IL5 and CMMC Level 3 deployments.

### Cross-Domain Classification Isolation

Xiid's multi-cloud orchestration enables unidirectional connections between Unclassified, Secret, and Top Secret network domains, maintaining separate boundaries while providing authorized cross-domain access:

| Domain | Components | Xiid Isolation Model |
|--------|-----------|---------------------|
| **Unclassified (CUI)** | Cloud SaaS; FedRAMP Moderate workloads; standard commercial customers | Xiid SSO + SealedTunnel for all access; standard outbound-only model |
| **Secret (DoD SRG IL4)** | Dedicated GovCloud deployment; CMMC Level 2/3 contractors; sensitive CUI | Trust relationship via Xiid SSO; unidirectional SealedTunnel; no Secret→Unclass inbound |
| **High Side (DoD IL5)** | Air-gapped on-prem; classified systems; CMMC Level 3 + DoD SRG IL5 | Air-gap gateway (edge device); SealedTunnel outbound-only; Ollama local inference; zero external deps |
| **Top Secret (future)** | Potential TS/SCI customer expansion | Xiid cross-domain auth via Trust Relationships; dedicated SealedTunnel per domain |

```
┌─────────────────────┐   Trust    ┌─────────────────────┐   Trust    ┌─────────────────────┐
│   UNCLASSIFIED       │  Xiid SSO  │   SECRET (IL4)       │  Xiid SSO  │   HIGH SIDE (IL5)    │
│                      │───────────▶│                      │───────────▶│                      │
│  Cloud SaaS          │            │  GovCloud Deploy     │            │  Air-Gapped On-Prem  │
│  FedRAMP Moderate    │   ╳ No     │  CMMC L2/L3          │   ╳ No     │  CMMC L3 + IL5       │
│  Cloudflare + Xiid   │◀──return── │  Xiid unidirectional │◀──return── │  Ollama local only   │
│                      │            │                      │            │  Zero external deps  │
└─────────────────────┘            └─────────────────────┘            └─────────────────────┘
  Standard commercial                Sensitive CUI                       Classified systems
  customers                          defense contractors                 DoD environments
```

### Air-Gap Gateway Architecture

The on-premises ForgeScan scanner communicates via the STLink pattern that already exists in the architecture. Xiid formalizes this as a provable air-gap boundary:

```
┌─────────────────────────────────────────────────────────────┐
│                  CLASSIFIED NETWORK PERIMETER                 │
│                                                               │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐  │
│  │ ForgeScan       │  │ ForgeComply    │  │ Ollama /      │  │
│  │ Scanner Agents  │  │ 360 API        │  │ Llama 3       │  │
│  │ (Rust binary)   │  │ (local mode)   │  │ (local GPU)   │  │
│  └───────┬─────────┘  └───────┬────────┘  └───────────────┘  │
│          │                    │                                │
│          └────────┬───────────┘                                │
│                   │                                            │
│          ┌────────▼────────────────────────────────────┐      │
│          │          AIR-GAP GATEWAY                      │      │
│          │   Edge device (RPi / edge server / appliance)│      │
│          │   • Aggregates multiple on-prem scanner data │      │
│          │   • Single outbound-only SealedTunnel uplink │      │
│          │   • Zero inbound connections accepted         │      │
│          │   • Loopback 127.0.0.5:443 → Caddy exitpoint│      │
│          └────────┬────────────────────────────────────┘      │
│                   │ Outbound-only SealedTunnel                 │
│                   │ (only path crossing air-gap boundary)      │
└───────────────────┼────────────────────────────────────────────┘
                    │
           ┌────────▼────────────────────────┐
           │  ForgeComply 360 Cloudflare API   │
           │  (receives sealed scan results)   │
           └───────────────────────────────────┘
```

**Key properties:**
- **Gateway aggregation:** Edge device deployed inside the classified network perimeter aggregates data from multiple on-premises scanner agents
- **Single uplink:** Gateway establishes one outbound-only SealedTunnel to the ForgeComply 360 Cloudflare API — the only network path crossing the air-gap boundary
- **Zero inbound exposure:** The gateway never accepts inbound connections — the classified network's internal resources are invisible to external networks
- **Local AI execution:** Ollama/Llama 3 inference operates completely within the classified boundary — no AI inference calls cross the air-gap; ForgeML runs on local GPU resources
- **Evidence transport:** Evidence Vault artifacts (SSPs, SARs, POA&Ms) are encrypted locally and transferred via SealedTunnel — never exposed in transit on unclassified networks

### Air-Gap Docker Compose Override

For air-gapped deployments, use an overlay that disables all external dependencies:

```yaml
# docker-compose.airgap.yml — overlay for air-gapped deployment
services:
  forgecomply-api:
    environment:
      - DEPLOYMENT_MODE=airgap
      - OLLAMA_URL=http://ollama:11434      # Local inference only
      - EXTERNAL_AI_ENABLED=false            # No Claude API calls
      - EVIDENCE_TRANSPORT=sealedtunnel      # Evidence via ST only

  ollama:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]

  # Air-gap gateway (runs on edge device, not in main cluster)
  # airgap-gateway:
  #   image: xiid/sealedtunnel-gateway:latest
  #   network_mode: host
  #   environment:
  #     - XIID_MODE=gateway
  #     - UPLINK_TARGET=api.forgecomply360.com
  #     - GATEWAY_LOOPBACK=127.0.0.5:443
```

---

## Component Placement

### What stays on Cloudflare

| Component | Service | Reason |
|-----------|---------|--------|
| ForgeComply 360 SPA | Cloudflare Pages | Global CDN, automatic SSL, instant cache purge |
| Forge-Reporter SPA | Cloudflare Pages | Static-first app, works offline, CDN-optimal |
| ForgeAI Govern SPA | Cloudflare Pages | Single-page app, global delivery |
| DNS | Cloudflare DNS | Proxy mode for WAF + DDoS (or DNS-only for Xiid) |
| WAF/DDoS | Cloudflare WAF | Layer 7 protection (when not using Xiid-only mode) |
| TLS Termination | Cloudflare Edge | Free managed certificates, TLS 1.3 |

### What moves to Hetzner

| Component | Service | Reason |
|-----------|---------|--------|
| ForgeComply 360 API | Node.js | Full runtime, no Workers constraints |
| Forge-Scan Engine | Rust binary | Needs native execution, gRPC, long-running scans |
| Forge-Scan 360 Platform | Node.js/TypeScript | Vuln management, asset discovery, risk scoring |
| ForgeAI Govern API | Node.js | AI governance, risk assessments, maturity scoring |
| ForgeSOC | Rust agents | 24/7 threat monitoring, real-time detection |
| ForgeRedOps | AI agents | Penetration testing with 24 autonomous agents |
| Database | PostgreSQL 16 | Full SQL, JSONB, full-text search, concurrent writes |
| Cache | Redis 7 | Sessions, rate limiting, pub/sub, scan queues |
| Object Storage | MinIO | Evidence vault, scan reports, AI documents |
| AI/LLM | Ollama | ForgeML Writer, ForgeRedOps AI agents |
| Tunnel | Cloudflare Tunnel OR Xiid SealedTunnel | Secure connectivity |
| Monitoring | Prometheus + Grafana | Full observability |

---

## Hetzner Server Setup

### Recommended Server Configurations

#### Option A: Single Server (Small team, up to ~50 users)

> **Caution:** Ollama requires ~8 GB RAM for llama3.1:8b inference, leaving only ~8 GB for
> PostgreSQL + Redis + MinIO + 3 API services + monitoring. This is tight for production
> workloads with concurrent scanning. Use for development/staging or very light production use only.

| Spec | Hetzner Product | Monthly Cost |
|------|----------------|-------------|
| **Cloud VPS** | CPX41 (8 vCPU, 16 GB RAM, 240 GB NVMe) | ~€15.90/mo |
| **Block Storage** | 500 GB for evidence + scan data | ~€23.80/mo |
| **Total** | | **~€40/mo** |

#### Option B: Dedicated Server (Medium org, 50-500 users) — RECOMMENDED

| Spec | Hetzner Product | Monthly Cost |
|------|----------------|-------------|
| **Dedicated** | AX42 (Ryzen 5 3600, 64 GB RAM, 2x512 GB NVMe) | ~€49/mo |
| **Block Storage** | 1 TB for evidence + scan data | ~€47.60/mo |
| **Total** | | **~€97/mo** |

**This is the recommended starting configuration.** 64 GB RAM comfortably runs the full 4-product
stack including Ollama inference. When AI inference latency becomes a bottleneck under load,
split Ollama to a dedicated server (from Option C) as the first scale-out step.

#### Option C: Multi-Server Enterprise (500+ users, full platform)

| Server | Hetzner Product | Role | Monthly Cost |
|--------|----------------|------|-------------|
| App Server 1 | CPX41 | ForgeComply API + ForgeAI API + nginx | ~€15.90 |
| App Server 2 | CPX41 | App failover | ~€15.90 |
| Scan Server | CCX33 (dedicated 8 vCPU) | Forge-Scan Engine + ForgeSOC + ForgeRedOps | ~€49.90 |
| DB Server | CPX51 (16 vCPU, 32 GB RAM) | PostgreSQL primary | ~€29.90 |
| DB Replica | CPX31 | PostgreSQL read replica | ~€11.90 |
| AI Server | CCX33 | Ollama (llama3.1:8b) | ~€49.90 |
| Storage | Volume 2 TB | MinIO evidence + scan vault | ~€95.20 |
| **Total** | | | **~€269/mo** |

### Initial Server Setup

```bash
# 1. Create server via Hetzner Cloud Console or CLI
hcloud server create \
  --name forgecomply-prod \
  --type cpx41 \
  --image ubuntu-24.04 \
  --location fsn1 \
  --ssh-key your-ssh-key

# 2. SSH into the server
ssh root@<server-ip>

# 3. System hardening
apt update && apt upgrade -y
apt install -y ufw fail2ban unattended-upgrades

# Firewall: only allow SSH (tunnel handles everything else)
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH (restrict to your IP later)
ufw enable

systemctl enable fail2ban
systemctl start fail2ban

# 4. Install Docker
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin

# 5. Create app user (never run as root)
adduser --disabled-password forgecomply
usermod -aG docker forgecomply
su - forgecomply

# 6. Clone all repositories
mkdir -p ~/forge && cd ~/forge
git clone https://github.com/Bjay0727-jay/ForgeComply360.git
git clone https://github.com/Bjay0727-jay/Forge-Reporter.git
git clone https://github.com/Bjay0727-jay/Forge-Scan.git
git clone https://github.com/Bjay0727-jay/AI-Governance.git
```

---

## Full-Platform Docker Compose

Create `docker/docker-compose.hetzner.yml`:

```yaml
services:
  # ══════════════════════════════════════════════════════════════
  #  FORGECOMPLY 360 — Enterprise GRC API
  # ══════════════════════════════════════════════════════════════
  forgecomply-api:
    build:
      context: ../ForgeComply360
      dockerfile: docker/Dockerfile.api
    container_name: forgecomply-api
    restart: unless-stopped
    ports:
      - "127.0.0.1:8443:8443"
    environment:
      - NODE_ENV=production
      - PORT=8443
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - MINIO_ENDPOINT=minio
      - MINIO_PORT=9000
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - OLLAMA_URL=http://ollama:11434
      - OLLAMA_MODEL=${OLLAMA_MODEL:-llama3.1:8b}
      - ENVIRONMENT=hetzner
      - CORS_ORIGIN=${CORS_ORIGIN}
      - RESEND_API_KEY=${RESEND_API_KEY}
      - SENTRY_DSN=${SENTRY_DSN}
      # Inter-service URLs
      - FORGESCAN_API_URL=http://forgescan-api:8444
      - FORGEAI_API_URL=http://forgeai-api:8445
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - forge-net
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8443/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 2G

  # ══════════════════════════════════════════════════════════════
  #  FORGE-SCAN — Vulnerability Scanner Engine (Rust)
  # ══════════════════════════════════════════════════════════════
  forgescan-engine:
    build:
      context: ../Forge-Scan/engine
      dockerfile: Dockerfile
    container_name: forgescan-engine
    restart: unless-stopped
    environment:
      - SCAN_DB_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/forgescan
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - GRPC_PORT=50051
      - NVD_DATA_DIR=/data/nvd
    volumes:
      - scan-data:/data
    networks:
      - forge-net
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G

  forgescan-api:
    build:
      context: ../Forge-Scan
      dockerfile: cloudflare/Dockerfile
    container_name: forgescan-api
    restart: unless-stopped
    ports:
      - "127.0.0.1:8444:8444"
    environment:
      - NODE_ENV=production
      - PORT=8444
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/forgescan
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - SCANNER_GRPC_URL=forgescan-engine:50051
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGIN=${CORS_ORIGIN}
    depends_on:
      - forgescan-engine
      - postgres
      - redis
    networks:
      - forge-net
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8444/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G

  # ══════════════════════════════════════════════════════════════
  #  FORGEAI GOVERN — AI Governance Platform
  # ══════════════════════════════════════════════════════════════
  forgeai-api:
    build:
      context: ../AI-Governance
      dockerfile: Dockerfile
    container_name: forgeai-api
    restart: unless-stopped
    ports:
      - "127.0.0.1:8445:8445"
    environment:
      - NODE_ENV=production
      - PORT=8445
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/forgeai
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - MINIO_ENDPOINT=minio
      - MINIO_PORT=9000
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - OLLAMA_URL=http://ollama:11434
      - CORS_ORIGIN=${CORS_ORIGIN_AI}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - forge-net
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8445/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G

  # ══════════════════════════════════════════════════════════════
  #  DATA TIER
  # ══════════════════════════════════════════════════════════════
  postgres:
    image: postgres:16-alpine
    container_name: forge-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-databases.sql:/docker-entrypoint-initdb.d/01-init.sql:ro
    networks:
      - forge-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
    command: >
      postgres
      -c shared_buffers=1GB
      -c effective_cache_size=3GB
      -c work_mem=16MB
      -c maintenance_work_mem=256MB
      -c max_connections=200
      -c log_min_duration_statement=1000

  redis:
    image: redis:7-alpine
    container_name: forge-redis
    restart: unless-stopped
    command: >
      redis-server
      --requirepass ${REDIS_PASSWORD}
      --appendonly yes
      --maxmemory 512mb
      --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    networks:
      - forge-net
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 768M

  minio:
    image: minio/minio:latest
    container_name: forge-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_ACCESS_KEY}
      - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}
    volumes:
      - /mnt/evidence-vault:/data
    networks:
      - forge-net
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  ollama:
    image: ollama/ollama:latest
    container_name: forge-ollama
    restart: unless-stopped
    volumes:
      - ollama-data:/root/.ollama
    networks:
      - forge-net
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G

  # ══════════════════════════════════════════════════════════════
  #  CONNECTIVITY
  #  Recommended: Run BOTH cloudflared + xiid-agent (defense in depth)
  #  Option A alone: commercial SaaS only
  #  Option B alone: DoD IL4/IL5 only (Xiid replaces CF Tunnel)
  # ══════════════════════════════════════════════════════════════

  # Option A: Cloudflare Tunnel (included in recommended defense-in-depth config)
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: forge-tunnel
    restart: unless-stopped
    command: tunnel --no-autoupdate run
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
    networks:
      - forge-net
    depends_on:
      - forgecomply-api
      - forgescan-api
      - forgeai-api
    profiles:
      - cloudflare-tunnel  # Only starts with: --profile cloudflare-tunnel

  # Option B: Xiid SealedTunnel (federal/DoD deployment)
  # NOTE: Xiid agent is best run on the HOST for maximum isolation.
  # See "Xiid Setup on Hetzner" section above.
  # If containerized:
  # xiid-agent:
  #   image: xiid/sealedtunnel-agent:latest
  #   container_name: forge-xiid
  #   restart: unless-stopped
  #   network_mode: host
  #   volumes:
  #     - /etc/xiid:/etc/xiid:ro
  #   profiles:
  #     - xiid-tunnel

  # ══════════════════════════════════════════════════════════════
  #  MONITORING
  # ══════════════════════════════════════════════════════════════
  prometheus:
    image: prom/prometheus:latest
    container_name: forge-prometheus
    restart: unless-stopped
    volumes:
      - ./config/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    networks:
      - forge-net
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=90d'
    deploy:
      resources:
        limits:
          memory: 512M

  grafana:
    image: grafana/grafana:latest
    container_name: forge-grafana
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - forge-net
    deploy:
      resources:
        limits:
          memory: 256M

volumes:
  postgres-data:
  redis-data:
  ollama-data:
  scan-data:
  prometheus-data:
  grafana-data:

networks:
  forge-net:
    driver: bridge
```

### Database Initialization Script

Create `docker/init-databases.sql`:

```sql
-- Create separate databases for each Forge product
-- (shared PostgreSQL instance, isolated databases)

CREATE DATABASE forgescan;
CREATE DATABASE forgeai;

-- Grant access to the shared user
GRANT ALL PRIVILEGES ON DATABASE forgescan TO forgecomply;
GRANT ALL PRIVILEGES ON DATABASE forgeai TO forgecomply;
```

### Environment File

Create `docker/.env.hetzner`:

```bash
# ═══════════════════════════════════════════════════
#  FORGE PLATFORM — Hetzner Deployment Configuration
# ═══════════════════════════════════════════════════

# ── Shared Database ──
DB_USER=forgecomply
DB_PASSWORD=<generate: openssl rand -hex 32>
DB_NAME=forgecomply

# ── Redis ──
REDIS_PASSWORD=<generate: openssl rand -hex 32>

# ── MinIO (Evidence + Scan Vault) ──
MINIO_ACCESS_KEY=forgecomply
MINIO_SECRET_KEY=<generate: openssl rand -hex 32>

# ── Application Secrets ──
JWT_SECRET=<generate: openssl rand -hex 64>
JWT_REFRESH_SECRET=<generate: openssl rand -hex 64>
ENCRYPTION_KEY=<generate: openssl rand -hex 32>

# ── AI ──
OLLAMA_MODEL=llama3.1:8b

# ── CORS Origins ──
CORS_ORIGIN=https://app.forgecomply360.com
CORS_ORIGIN_AI=https://ai.forgecomply360.com

# ── Connectivity (choose one) ──
# Option A: Cloudflare Tunnel
CLOUDFLARE_TUNNEL_TOKEN=<from-cloudflare-dashboard>
# Option B: Xiid SealedTunnel — configured via /etc/xiid/config.yml

# ── External Services ──
RESEND_API_KEY=
SENTRY_DSN=

# ── Monitoring ──
GRAFANA_PASSWORD=<generate: openssl rand -hex 16>

# ── Backups ──
BACKUP_RETENTION_DAYS=30
```

### Starting the Platform

```bash
# With Cloudflare Tunnel:
docker compose -f docker/docker-compose.hetzner.yml --profile cloudflare-tunnel up -d

# With Xiid SealedTunnel (agent runs on host):
docker compose -f docker/docker-compose.hetzner.yml up -d
systemctl start xiid-agent

# Pull AI model
docker exec forge-ollama ollama pull llama3.1:8b
```

---

## Cloudflare Configuration

### DNS Setup

| Record | Type | Name | Value | Proxy | Notes |
|--------|------|------|-------|-------|-------|
| ForgeComply SPA | CNAME | `app` | `forgecomply360.pages.dev` | Proxied | |
| Forge-Reporter SPA | CNAME | `reporter` | `forge-reporter.pages.dev` | Proxied | |
| ForgeAI Govern SPA | CNAME | `ai` | `ai-governance.pages.dev` | Proxied | |
| API (CF Tunnel) | CNAME | `api` | `<tunnel-id>.cfargotunnel.com` | Proxied | CF Tunnel mode |
| API (Xiid) | A | `api` | `<hetzner-ip>` | DNS-only | Xiid mode |
| Scan API (CF Tunnel) | CNAME | `scan` | `<tunnel-id>.cfargotunnel.com` | Proxied | CF Tunnel mode |
| AI API (CF Tunnel) | CNAME | `ai-api` | `<tunnel-id>.cfargotunnel.com` | Proxied | CF Tunnel mode |

### Cloudflare Tunnel Ingress (when using CF Tunnel)

```yaml
ingress:
  - hostname: api.forgecomply360.com
    service: http://forgecomply-api:8443
  - hostname: scan.forgecomply360.com
    service: http://forgescan-api:8444
  - hostname: ai-api.forgecomply360.com
    service: http://forgeai-api:8445
  - hostname: monitoring.forgecomply360.com
    service: http://grafana:3000
  - service: http_status:404
```

### Deploy All Frontends to Cloudflare Pages

```bash
# ForgeComply 360
cd ~/forge/ForgeComply360/frontend
VITE_API_URL=https://api.forgecomply360.com npm run build
npx wrangler pages deploy dist --project-name=forgecomply360 --branch=main

# Forge-Reporter
cd ~/forge/Forge-Reporter
VITE_API_URL=https://api.forgecomply360.com npm run build
npx wrangler pages deploy dist --project-name=forge-reporter --branch=main

# ForgeAI Govern
cd ~/forge/AI-Governance
# Build according to its build process
npx wrangler pages deploy dist --project-name=ai-governance --branch=main
```

---

## Networking & Security

### Network Architecture (Cloudflare Tunnel Mode)

```
Internet
    │
    ▼
┌──────────────────────┐
│   Cloudflare Edge     │  ← TLS termination, WAF, DDoS
│   (Anycast network)   │
└────────┬─────────────┘
         │ Encrypted QUIC Tunnel
         │
┌────────▼──────────────────────────────────────────────────────┐
│  Docker bridge network (forge-net)                             │
│                                                                │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│  │ ForgeComply│ │ Forge-Scan │ │ ForgeAI    │ │ Forge-Scan │ │
│  │  360 API   │ │  API       │ │ Govern API │ │  Engine    │ │
│  │  :8443     │ │  :8444     │ │  :8445     │ │  gRPC:50051│ │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ │
│        │              │              │              │          │
│  ┌─────▼──────────────▼──────────────▼──────────────▼────┐    │
│  │  PostgreSQL :5432  │  Redis :6379  │  MinIO :9000     │    │
│  │  (forgecomply DB)  │  (sessions)   │  (evidence +     │    │
│  │  (forgescan DB)    │  (scan queue) │   scan reports)  │    │
│  │  (forgeai DB)      │  (rate limit) │                  │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                │
│  ┌────────────┐  ┌────────────────────────────────────────┐   │
│  │  Ollama    │  │  Prometheus + Grafana                  │   │
│  │  :11434    │  │  (monitoring)                           │   │
│  └────────────┘  └────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

### Network Architecture (Xiid SealedTunnel Mode)

```
Internet
    │
    ▼
┌──────────────────────┐
│   Cloudflare Edge     │  ← CDN for static SPAs only
│   (Pages only)        │
└──────────────────────┘

    │ (API traffic bypasses Cloudflare)
    │
    ▼
┌──────────────────────┐
│  Xiid Collector       │  ← Zero-knowledge request queuing
│  (Xiid cloud infra)   │  ← Anonymized, encrypted
└────────┬─────────────┘
         │ Outbound-only polling (port 443)
         │ Triple-layer quantum-resistant encryption
         │
┌────────▼──────────────────────────────────────────────────────┐
│  Xiid SealedTunnel Agent (runs on Hetzner host)               │
│  • Process-to-process tunnels                                  │
│  • Zero open inbound ports                                     │
│  • Moving Target Defense capable                               │
│  • DoD ATO certified                                           │
└────────┬──────────────────────────────────────────────────────┘
         │ 127.0.0.1 loopback
         │
┌────────▼──────────────────────────────────────────────────────┐
│  Docker services (same as above)                               │
└────────────────────────────────────────────────────────────────┘
```

### Hetzner Firewall Rules

```bash
# Using Hetzner Cloud Firewall
hcloud firewall create --name forge-fw

# Only allow SSH from admin IP
hcloud firewall add-rule forge-fw \
  --direction in --protocol tcp --port 22 \
  --source-ips <YOUR_ADMIN_IP>/32

# No other inbound rules needed — both Cloudflare Tunnel
# and Xiid SealedTunnel use outbound-only connections

hcloud firewall apply-to-resource forge-fw \
  --type server --server forgecomply-prod
```

---

## Forge-Reporter Integration

Forge-Reporter (`Bjay0727-jay/Forge-Reporter`) is a **React 19 + TypeScript + Vite** offline-first NIST RMF SSP authoring engine with 23 RMF-mapped sections and full OSCAL 1.1.2 compliance validation.

**Tech stack:** React 19.2, TypeScript 5.9, Vite 7.3, Tailwind CSS 4.1, Ajv 8.18 (OSCAL schema validation), jsPDF 4.1 (PDF export), js2xmlparser 5.0 (XML export)

### Standalone Mode (Default — Offline-First)
- Deployed to Cloudflare Pages as a static SPA (`forge-reporter.pages.dev`)
- All SSP data persisted in browser `localStorage` (key: `forgecomply360-ssp-data`)
- 800ms debounced auto-save on every field change; ~294 data fields across the full SSP model
- No backend required — ideal for classified / air-gapped environments
- Exports: OSCAL JSON (validated against NIST 1.1.2 schema), OSCAL XML (namespace `http://csrc.nist.gov/ns/oscal/1.0`), multi-page PDF (A4, cover page + TOC)
- Imports: OSCAL JSON or XML with auto-detection, 50MB limit, 4-stage parsing

### Connected Mode (Bidirectional Sync with ForgeComply 360)
- Authenticates via URL hash token injection: `#token=<JWT>&ssp=<doc-id>`
- Token stored in `sessionStorage` (temporary); validated against `HEAD /api/v1/auth/me`
- Bidirectional sync via `useSync` hook with mutex-based concurrency protection
- Data transformation layer (`sspMapper.ts`, 30KB) maps between flat Reporter format and nested OSCAL `_authoring` sections stored in ForgeComply 360's `ssp_documents.oscal_json`
- ForgeML AI assistance via `POST /api/v1/ai/generate` with 3 modes: generate, refine, expand
- 24 section-specific AI prompt pairs with prompt injection mitigation (XML tag wrapping, role stripping, 10K char limit)
- Evidence references link to the ForgeComply 360 R2 Evidence Vault
- Full sync orchestrates 7 parallel entity streams via `Promise.allSettled()`: info types, ports/protocols, crypto modules, separation of duties, policies, SCRM suppliers, CM baselines

### Sync Architecture

```
ForgeComply 360 API                   Forge-Reporter SPA
(Hetzner / Workers)                   (Cloudflare Pages)

┌──────────────────────┐              ┌────────────────────────────┐
│ ssp_documents table   │◀── GET ─────│ useSync.loadFromServer()   │
│ oscal_json column     │── PUT ─────▶│ useSync.saveToServer()     │
│ _authoring.sections   │             │ useSync.fullSync()         │
│                       │             │   ├─ syncInfoTypes          │
│ POST /api/v1/ssp/     │             │   ├─ syncPortsProtocols    │
│   :id/section         │             │   ├─ syncCryptoModules     │
│ PUT  /api/v1/ssp/:id  │             │   ├─ syncSepDuties         │
│                       │             │   ├─ syncPolicies           │
│ ForgeML AI:           │             │   ├─ syncSCRMSuppliers     │
│ POST /api/v1/         │◀── AI ─────│   └─ syncCMBaselines        │
│   ai/generate         │── resp ───▶│                              │
│   (llama-3.1-8b)      │             │ sspMapper.ts (30KB):        │
│                       │             │ Backend OSCAL ↔ Flat SSPData│
└──────────────────────┘              └────────────────────────────┘
  Token via URL hash:                   localStorage: SSP data
  #token=<JWT>&ssp=<id>                 sessionStorage: access token
```

### 23-Section RMF Coverage

| Phase | Sections | RMF Steps |
|-------|---------|-----------|
| **Frontmatter** | System Info, FIPS 199, Info Types, Control Baseline, RMF Lifecycle | Prepare, Categorize, Select |
| **Architecture** | Auth Boundary, Data Flow, Network Architecture, Ports/Protocols, Interconnections, Crypto Modules (CNSA 2.0) | Implement |
| **Personnel** | Personnel & Roles, Digital Identity (IAL/AAL/FAL), Separation of Duties | Prepare, Implement |
| **Controls** | Control Implementations, Security Policies, SCRM (SP 800-161), Privacy Analysis (PTA/PIA) | Implement |
| **Plans** | Contingency Plan (RTO/RPO/MTD), Incident Response, Configuration Management | Implement |
| **Post-Auth** | Security Assessment, Authorization Decision, Continuous Monitoring (ISCM), POA&M | Assess, Authorize, Monitor |

---

## Forge-Scan Integration

Forge-Scan (`Bjay0727-jay/Forge-Scan`) is the vulnerability management backbone: a pure Rust scanner engine (13 crates) with a TypeScript platform layer (Cloudflare Workers + Hono). Four sub-products share a common event bus:

**Tech stack:** Rust 1.78 (scanner engine, 13 crates), TypeScript (Workers API + Dashboard), Cloudflare D1/R2/KV, Redis Cluster (pub/sub), Apache Kafka (event streaming)

| Sub-Product | Description | Key Metrics | Integration Point |
|-------------|-------------|-------------|-------------------|
| **ForgeScan Engine** | Rust scanner: 13 crates (network, webapp, cloud, config-audit, NVD, ingest) | 65535-port coverage | gRPC bidirectional streaming → ForgeScan 360 API → ForgeComply 360 |
| **ForgeScan 360** | Vuln management, asset discovery, FRS risk scoring | 5000+ CVE lookups | Shared PostgreSQL; auto-POA&M generation via event bus |
| **ForgeSOC** | 24/7 threat detection, incident response, SIEM correlation | 847 MITRE ATT&CK rules | Splunk/Sentinel/QRadar feeds; `forge_events` → ForgeComply ControlPulse |
| **ForgeRedOps** | AI-powered pen testing with autonomous agents | 24 agents, ~720 exploitation tests | Per-agent findings → POA&Ms; Ollama/Claude AI analysis |

### Scanner-to-API Communication (STLink Protocol)

The Rust scanner communicates via gRPC (protobuf) with REST bridge:

```
ForgeScan Engine (Rust)                  ForgeScan 360 API (Workers)
┌─────────────────────┐                 ┌─────────────────────────────┐
│ forgescan-scanner    │                 │ /api/v1/scanner/register     │
│ forgescan-agent      │                 │ /api/v1/scanner/heartbeat    │
│                      │  gRPC (mTLS)    │ /api/v1/scanner/tasks        │
│ AgentStream:         │ ──────────────▶ │ /api/v1/scanner/tasks/:id/   │
│  ├─ AgentHeartbeat   │  bidirectional  │   findings                   │
│  ├─ ScanStatus       │ ◀──────────────│                               │
│  ├─ ScanCommand      │                 │ Auth: X-Scanner-Key header   │
│  └─ Finding stream   │                 │ mTLS: cert issued at register│
│                      │                 │ Heartbeat: 30s interval      │
│ STLink outbound-only │                 │                               │
│ 127.0.0.5:443 →      │                 │ Event Bus:                    │
│ Caddy exitpoint      │                 │ forge.vulnerability.detected  │
└─────────────────────┘                 └─────────────────────────────┘
```

**Authentication (3-tier):**
- **Users:** JWT Bearer tokens (HS256, 24h expiry, RBAC: platform_admin/scan_admin/vuln_manager/remediation_owner/auditor)
- **Scanners:** `X-Scanner-Key` header with HMAC digest replay protection; registered via `POST /api/v1/scanner/register` with CSR for mTLS
- **Service-to-service:** Mutual TLS for gRPC; certificates issued by Forge CA at registration, renewed annually

### Scan-to-Comply Data Pipeline

```
Scan Execution (Rust)                                    ForgeComply 360
┌────────────┐    gRPC findings    ┌─────────────┐     ┌──────────────┐
│ ForgeScan  │ ──────────────────▶ │ Ingest       │     │ POA&M table   │
│ Engine     │    stream           │ Pipeline     │     │ auto-created  │
│ (13 crates)│                     │              │     │ with SLAs:    │
│            │                     │ Normalize →  │     │ Critical: 15d │
└────────────┘                     │ Deduplicate→ │     │ High: 30d     │
                                   │ Enrich →    │     │ Medium: 90d   │
┌────────────┐    .nessus/.csv     │ CVE lookup → │     │ 5-milestone   │
│ Nessus /   │ ──────────────────▶ │ CWE→NIST    │────▶│ template      │
│ Qualys /   │    POST /api/v1/    │ mapping →   │     │               │
│ Tenable    │    scans/import     │ FRS scoring  │     │ Risk register │
└────────────┘    SHA-256 dedup    └──────┬──────┘     │ auto-populated│
                                          │             │               │
                                   forge.vulnerability  │ Assets table  │
                                   .detected event      │ auto-created  │
                                          │             └──────────────┘
                                          ▼                     ▲
                                   ┌─────────────┐             │
                                   │ Event Bus    │ webhook/REST│
                                   │ (Kafka/Redis)│─────────────┘
                                   └──────┬──────┘
                                          │
                          ┌───────────────┼──────────────┐
                          ▼               ▼              ▼
                   ┌────────────┐  ┌──────────┐  ┌────────────┐
                   │ ForgeRedOps │  │ ForgeSOC │  │ Compliance │
                   │ auto-trigger│  │ alert    │  │ mapping    │
                   │ if critical │  │ creation │  │ CWE→800-53 │
                   └────────────┘  └──────────┘  └────────────┘
```

### Key Integration Points

1. **Scan results → POA&Ms**: ForgeComply 360's `POST /api/v1/scans/import/:id/generate-poams` auto-creates POA&M entries from vulnerability findings with FedRAMP SLA milestones (Critical: 15d, High: 30d, Medium: 90d)
2. **Asset discovery → Systems**: Scan `TargetDiscovered` events auto-create assets in ForgeComply 360's `assets` table (hostname, IP, OS, MAC, discovery source, risk score)
3. **CVE findings → Risk register**: CWE-to-NIST mapping engine (50+ hardcoded CWE→control mappings: e.g., CWE-89→SI-10/SI-2, CWE-287→IA-2/IA-5/AC-3) auto-populates RiskForge
4. **FRS Risk Scoring**: ForgeScan Risk Score (0-100) incorporates CVSS v3 + exploit maturity + CISA KEV + threat intel + asset criticality
5. **Event bus**: `forge_events` table with subscription framework enables cross-product triggers (e.g., `forge.vulnerability.detected` → auto-trigger ForgeRedOps campaign)
6. **Continuous monitoring**: ForgeSOC detection rules (847 MITRE-mapped) feed ControlPulse drift detection alerts

### Scan-to-Comply Pipeline with Xiid Sealing

When Xiid SealedTunnel is enabled, the entire scan-to-comply pipeline is cryptographically sealed:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                 SEALED SCAN → COMPLY PIPELINE                             │
│                                                                          │
│  ┌────────────────┐   SealedTunnel    ┌────────────────┐                │
│  │ ForgeScan       │ ──────────────── ▶│ ForgeComply    │                │
│  │ Engine (Rust)   │   sealed gRPC     │ 360 API        │                │
│  │ Per-agent ST    │   findings        │ :8443          │                │
│  └────────────────┘                   │                │                │
│                                        │ Auto-creates:  │                │
│  ┌────────────────┐   SealedTunnel    │ • POA&Ms       │                │
│  │ Nessus Import   │ ──────────────── ▶│ • Risks        │                │
│  │ .nessus XML     │   sealed upload   │ • Assets       │                │
│  │ SHA-256 + ST    │   100MB max       │ • Alerts       │                │
│  └────────────────┘                   └────────────────┘                │
│                                                                          │
│  ┌────────────────┐   SealedTunnel    ┌────────────────┐                │
│  │ ForgeRedOps     │ ──────────────── ▶│ ForgeSOC       │                │
│  │ 24 AI Agents    │   per-agent       │ SIEM feeds     │                │
│  │ Dedicated ST    │   isolated        │ Splunk/Sentinel│                │
│  │ per agent       │   channels        │ Crypto proof   │                │
│  └────────────────┘                   └────────────────┘                │
└──────────────────────────────────────────────────────────────────────────┘
  All connections: outbound-only, Kyber/Dilithium encrypted, zero inbound ports
```

### Nessus Import Pipeline (Xiid-Sealed)

The Nessus integration processes `.nessus` XML vulnerability files through a sealed pipeline:

1. **Upload:** `POST /api/v1/scans/import` operates via SealedTunnel — .nessus files (up to 100MB) never exposed on standard HTTPS
2. **Tenable SC integration:** Tenable Security Center or Nessus Manager connectivity via outbound-only SealedTunnel push
3. **Integrity chain:** SHA-256 file hash deduplication (`UNIQUE` on `organization_id + file_hash`) + SealedTunnel delivery = end-to-end integrity
4. **Audit chain:** `scan_imports` audit table preserves provenance — `imported_by` user authenticated via Xiid ZKP; cryptographic non-repudiation

### ForgeRedOps 24-Agent Isolation

Each ForgeRedOps autonomous penetration testing agent receives a dedicated SealedTunnel channel:

| Agent Property | Without Xiid | With Xiid SealedTunnel |
|---------------|-------------|----------------------|
| Network access | Shared infrastructure | Dedicated process-isolated channel |
| Memory stores | Network-accessible | SealedTunnel-only access |
| Inbound ports | Open for coordination | All closed per agent |
| Agent-to-agent comms | Shared message bus | Dedicated sealed connections |
| Audit attribution | Log-based | Cryptographic non-repudiation |
| Compromised agent blast radius | Entire agent infrastructure | Single isolated channel |

---

## ForgeAI Govern Integration

**Architecture:** Cloudflare Workers + D1 (SQLite) + R2 (objects) + KV (cache)
**Database:** 16 tables across `forgeai-govern-db` D1 binding
**API:** 40+ REST endpoints via Hono router (same framework as ForgeComply 360)
**Auth:** JWT HS256 + PBKDF2-SHA256 password hashing (see Cross-Platform SSO below)

### NIST AI RMF 1.0 Full 4-Function Coverage (54 Controls)

ForgeAI Govern implements the complete NIST AI Risk Management Framework across all four functions:

| Function | Sub-categories | Key Tables | Key Endpoints |
|----------|---------------|------------|---------------|
| **GOVERN** | GV-1 through GV-6 | `ai_policies`, `governance_structures` | `GET/POST /api/v1/governance/policies` |
| **MAP** | MP-1 through MP-5 | `ai_systems`, `system_contexts`, `stakeholder_impacts` | `GET/POST /api/v1/systems`, `POST /api/v1/systems/:id/contexts` |
| **MEASURE** | MS-1 through MS-4 | `risk_assessments`, `bias_evaluations`, `metrics` | `GET/POST /api/v1/assessments`, `POST /api/v1/bias/evaluate` |
| **MANAGE** | MG-1 through MG-4 | `incidents`, `mitigations`, `monitoring_plans` | `GET/POST /api/v1/incidents`, `POST /api/v1/mitigations` |

### 6-Dimension Risk Assessment Engine

Each AI system undergoes quantified risk scoring across 6 dimensions, stored in the `risk_assessments` table:

| Dimension | Assessment Criteria | Score Range |
|-----------|-------------------|-------------|
| **Technical Performance** | Accuracy, reliability, robustness | 0–100 |
| **Fairness & Bias** | Demographic parity, equalized odds, disparate impact | 0–100 |
| **Privacy** | Data minimization, purpose limitation, consent | 0–100 |
| **Security** | Adversarial robustness, model poisoning resistance | 0–100 |
| **Transparency** | Explainability, documentation completeness | 0–100 |
| **Accountability** | Governance structures, audit trails, human oversight | 0–100 |

Composite risk score: weighted average → `overall_risk_level` (Low / Medium / High / Critical)

### Regulatory Framework Coverage

| Framework | Coverage | ForgeAI Tables |
|-----------|----------|---------------|
| NIST AI RMF 1.0 | Full 4-function, 54 controls | `ai_rmf_controls`, `control_assessments` |
| NIST AI 600-1 | Generative AI supplement | `genai_evaluations` |
| FDA SaMD | Software as Medical Device classification | `samd_classifications`, `clinical_evaluations` |
| ONC HTI-1 | Health IT decision support criteria | `dst_evaluations` |
| HIPAA | AI-specific PHI/ePHI processing controls | `privacy_assessments` |
| Colorado SB 21-169 | Algorithmic discrimination prevention | `state_compliance` |
| California AB 331 | Automated decision system impact assessments | `state_compliance` |
| Connecticut SB 1103 | AI system inventory requirements | `state_compliance` |
| NYC Local Law 144 | Bias audit for automated employment tools | `bias_evaluations` |
| EU AI Act (preparatory) | Risk-tier classification mapping | `risk_assessments` |

### 7-Domain Maturity Model

Maturity scoring across 7 domains (stored in `maturity_assessments` table):

1. **Strategy & Governance** — AI policy, board oversight, ethical guidelines
2. **Risk Management** — Risk identification, assessment, mitigation lifecycle
3. **Data Management** — Data quality, lineage, privacy-preserving techniques
4. **Model Development** — MLOps practices, validation, testing protocols
5. **Deployment & Monitoring** — Production monitoring, drift detection, alerting
6. **People & Culture** — AI literacy, training, responsible AI culture
7. **Third-Party Management** — Vendor AI assessments, supply chain risk

Each domain: Level 1 (Initial) → Level 5 (Optimizing), mapped to `maturity_level` enum.

### Vendor AI Assessment Portal

Third-party AI vendor evaluations via dedicated endpoints:

- `POST /api/v1/vendors` — Register vendor with AI system inventory
- `POST /api/v1/vendors/:id/assessments` — Submit vendor risk assessment
- `GET /api/v1/vendors/:id/compliance-status` — Aggregate compliance posture
- Stored in `vendor_assessments` table (vendor_id, assessment_type, risk_score, findings JSON, remediation_plan)

### Integration with ForgeComply 360

```
┌──────────────────────────────────────────────────────────────────────────┐
│              ForgeAI Govern ↔ ForgeComply 360 INTEGRATION               │
│                                                                          │
│  ┌─────────────────────────┐           ┌──────────────────────────┐     │
│  │  ForgeAI Govern          │           │  ForgeComply 360          │     │
│  │  Workers + D1 + R2 + KV  │           │  Workers + D1 + R2 + KV  │     │
│  │                          │           │                          │     │
│  │  16 tables               │   API     │  30+ tables              │     │
│  │  40+ endpoints           │ ────────▶ │  130+ endpoints          │     │
│  │                          │           │                          │     │
│  │  ai_rmf_controls ────────│──mapping──│──▶ security_controls     │     │
│  │  risk_assessments ───────│──feeds────│──▶ risks                 │     │
│  │  incidents ──────────────│──creates──│──▶ poams                 │     │
│  │  bias_evaluations ───────│──evidence─│──▶ evidence (R2 vault)   │     │
│  │  vendor_assessments ─────│──maps─────│──▶ vendors               │     │
│  │  maturity_assessments ───│──reports──│──▶ ssp_documents         │     │
│  │                          │           │                          │     │
│  │                          │  ◀────────│  compliance_frameworks   │     │
│  │  Receives framework      │   sync    │  control_implementations │     │
│  │  mapping updates         │           │  Unified dashboard       │     │
│  └─────────────────────────┘           └──────────────────────────┘     │
│                                                                          │
│  AI Governance → NIST 800-53 Control Mapping:                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ AI RMF GOVERN (GV-1)   →  NIST PL-1  (Policy & Procedures)       │  │
│  │ AI RMF MAP (MP-2)      →  NIST RA-3  (Risk Assessment)           │  │
│  │ AI RMF MEASURE (MS-1)  →  NIST CA-7  (Continuous Monitoring)     │  │
│  │ AI RMF MANAGE (MG-2)   →  NIST IR-4  (Incident Handling)         │  │
│  │ Bias Evaluations        →  NIST AC-6  (Least Privilege)           │  │
│  │ Vendor Assessments      →  NIST SA-9  (External Services)         │  │
│  │ Maturity Assessments    →  NIST PM-1  (Program Management)        │  │
│  │ Data Privacy Assessments→  NIST SI-12 (Info Management/Retention) │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Note:** ForgeAI Govern and ForgeComply 360 currently share the same Cloudflare
Workers architecture (Hono + D1 + R2 + KV) but operate as separate Worker
deployments. Cross-product API integration requires an API gateway or federation
layer (planned — see Sprint Plan). Initial integration supports shared JWT
authentication and manual export/import of control mappings.

> **Recommendation:** Use the existing webhook system (14+ event types: `poam_update`,
> `risk_alert`, `monitoring_fail`, etc.) for loose-coupled integration now. Plan an API
> gateway (Caddy, Kong, or a Cloudflare Workers route acting as a federation layer) in
> Sprint Phase 1 to enable direct cross-product API calls. Do **not** build a shared
> database — the isolated-database-per-product model (`forgecomply`, `forgescan`, `forgeai`
> in shared PostgreSQL) is the correct architecture for independent deployability.

### ForgeAI + ForgeML Protection (Xiid-Sealed)

When Xiid is enabled, all ForgeAI Govern communications and AI inference calls are sealed:

- **AI asset registry:** 16-table AI system inventory and 6-dimension risk assessment data accessed only via SealedTunnel
- **Incident management:** AI incident tracking (`POST /api/v1/incidents`) and response workflows sealed end-to-end
- **Claude API calls:** All ForgeML inference (`@cf/meta/llama-3.1-8b-instruct` via Workers AI) wrapped in SealedTunnel with Kyber/Dilithium encryption
- **Ollama inference:** On-premises AI inference operates with zero inbound ports; GPU cluster microsegmented
- **Vendor assessments:** Third-party AI vendor evaluation data (`vendor_assessments` table) transmitted via SealedTunnel
- **NIST AI RMF compliance:** 54-control AI-specific evidence delivered with cryptographic chain of custody
- **Bias evaluation data:** Fairness metrics and demographic analysis sealed to prevent data exposure during transit

### Cross-Platform SSO — Shared JWT Authentication

All four products share JWT-based authentication with ForgeComply 360 as the identity provider.
Each product currently implements JWT independently but with compatible token validation.

> **Recommendation:** Consolidate to **ForgeComply 360 as the single identity provider** (IdP).
> ForgeComply 360 already generates scoped tokens for Forge-Reporter and validates Forge-Scan
> JWTs. ForgeAI Govern should be updated to accept ForgeComply-issued JWTs rather than
> maintaining its own user table. Additionally, standardize all products on a single JWT
> algorithm — either **HMAC-SHA384** (ForgeComply's current algorithm) or migrate to
> **RS256 (asymmetric)** so products can validate tokens without sharing the signing secret.
> Long-term: **Xiid ZKP SSO → ForgeComply 360 JWT → all products validate the same token.**

**Per-Product JWT Implementation (Code-Verified):**

| Product | Algorithm | Access Token TTL | Refresh Token | Password Hash | Auth Endpoint |
|---------|-----------|-----------------|---------------|---------------|---------------|
| **ForgeComply 360** | HMAC-SHA384 | 60 min | 7-day (httpOnly cookie) | bcrypt (10 rounds) | `POST /api/v1/auth/login` |
| **Forge-Reporter** | N/A (consumer) | Received from FC360 | N/A | N/A | URL hash: `#token=<JWT>&ssp=<id>` |
| **Forge-Scan API** | HMAC-SHA256 | 60 min | 7-day | bcrypt | `POST /api/v1/auth/login` + `X-Scanner-Key` |
| **ForgeAI Govern** | HMAC-SHA256 | 60 min | 7-day | PBKDF2-SHA256 (100K iter) | `POST /api/v1/auth/login` |

**ForgeComply 360 → Forge-Reporter Token Flow:**
```
ForgeComply 360                              Forge-Reporter
     │                                            │
     │  POST /api/v1/auth/reporter-token          │
     │  (generates scoped JWT for Reporter)        │
     │                                            │
     │  Constructs URL:                            │
     │  https://reporter.forge.example.com         │
     │  #token=<JWT>&ssp=<ssp_id>&api=<api_url>   │
     │ ──────────────────────────────────────────▶ │
     │                                            │
     │  Reporter extracts token from URL hash      │
     │  (never sent to server — client-side only)  │
     │  Validates JWT, loads SSP data via API       │
     │                                            │
```

**ForgeComply 360 → Forge-Scan Authentication:**
```
Forge-Scan Engine                           ForgeComply 360 API
     │                                            │
     │  POST /api/v1/scans/import                 │
     │  Authorization: Bearer <JWT>                │
     │  X-Scanner-Key: <scanner_api_key>          │
     │  Content-Type: multipart/form-data          │
     │ ──────────────────────────────────────────▶ │
     │                                            │
     │  Rate limited: 10 imports/hr/org            │
     │  SHA-256 dedup on file_hash + org_id        │
     │  Auto-detect: Nessus XML / Qualys / Tenable │
     │                                            │
```

**With Xiid SealedTunnel — ZKP SSO Enhancement:**
```
                           ┌───────────────────────────┐
                           │   Xiid ZKP SSO (Terniion)  │
                           │   No credentials stored     │
                           │   No credentials transmitted │
                           │   NIST 800-63-3 AAL3        │
                           └─────────┬─────────────────┘
                                     │ ZKP identity token
                                     │ (replaces password auth)
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
User logs in → ForgeComply 360 → Xiid token + JWT (HS384)
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              Forge-Reporter  Forge-Scan API   ForgeAI Govern
              (URL #hash)     (Bearer + X-Key) (Bearer token)
              Client-side     mTLS + sealed    PBKDF2 + sealed
              token inject    gRPC channel     D1 sessions

Without Xiid: standard JWT + password authentication (bcrypt/PBKDF2)
With Xiid:    ZKP SSO + JWT; biometric + device binding + continuous verification
              All inter-product API calls wrapped in SealedTunnel
              Scanner keys encrypted at rest with Kyber KEM
```

---

## CI/CD Pipeline

### GitHub Actions — Multi-Repo Deployment

```yaml
name: Deploy Forge Platform (Hybrid)

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: cd frontend && npm ci
      - run: npm test
      - run: cd frontend && npm test

  deploy-frontends:
    name: Deploy All Frontends (Cloudflare Pages)
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Deploy ForgeComply 360 frontend
        run: |
          cd frontend && npm ci
          VITE_API_URL=https://api.forgecomply360.com npm run build
          npx wrangler pages deploy dist --project-name=forgecomply360 --branch=main
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

  deploy-backend:
    name: Deploy Backend Services (Hetzner)
    runs-on: ubuntu-latest
    needs: test
    steps:
      - name: Deploy to Hetzner via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.HETZNER_HOST }}
          username: forgecomply
          key: ${{ secrets.HETZNER_SSH_KEY }}
          script: |
            cd ~/forge/ForgeComply360 && git pull origin main
            cd ~/forge/Forge-Scan && git pull origin main
            cd ~/forge/AI-Governance && git pull origin main
            cd ~/forge
            docker compose -f ForgeComply360/docker/docker-compose.hetzner.yml up -d --build
            sleep 15
            curl -sf http://localhost:8443/health || exit 1
            curl -sf http://localhost:8444/health || exit 1
            curl -sf http://localhost:8445/health || exit 1
            echo "All services healthy"

  migrate-db:
    name: Run Database Migrations
    runs-on: ubuntu-latest
    needs: deploy-backend
    steps:
      - name: Run migrations via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.HETZNER_HOST }}
          username: forgecomply
          key: ${{ secrets.HETZNER_SSH_KEY }}
          script: |
            cd ~/forge
            # ForgeComply 360 migrations
            docker compose -f ForgeComply360/docker/docker-compose.hetzner.yml exec -T postgres \
              psql -U forgecomply -d forgecomply -f /migrations/schema.sql
            # Forge-Scan migrations
            docker compose -f ForgeComply360/docker/docker-compose.hetzner.yml exec -T postgres \
              psql -U forgecomply -d forgescan -f /migrations/schema.sql
            # ForgeAI migrations
            docker compose -f ForgeComply360/docker/docker-compose.hetzner.yml exec -T postgres \
              psql -U forgecomply -d forgeai -f /migrations/schema.sql
            echo "All migrations complete"
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token (Pages + DNS) |
| `HETZNER_HOST` | Hetzner server IP or hostname |
| `HETZNER_SSH_KEY` | SSH private key for deployment user |

---

## NIST 800-53 Control Mapping

The Xiid integration directly satisfies or substantially contributes to 15 NIST 800-53 Rev 5 controls that must be documented in ForgeComply 360's own FedRAMP SSP and that customers can inherit from the platform's authorization boundary.

| Control Family | Control ID | Control Title | Xiid Implementation |
|---------------|-----------|---------------|---------------------|
| Access Control | **AC-2** | Account Management | Xiid ZKP SSO eliminates credential-based accounts for service-to-service auth; no stored passwords for inter-component communication |
| Access Control | **AC-3** | Access Enforcement | Process-to-process SealedTunnel enforces access at cryptographic level; even network-adjacent processes cannot reach components without authenticated tunnel |
| Access Control | **AC-4** | Information Flow Enforcement | Outbound-only SealedTunnel enforces unidirectional flow at architecture level for air-gapped deployments; classification boundary separation |
| Access Control | **AC-17** | Remote Access | All remote access via SealedTunnel; VPN-less architecture; no open inbound ports for remote administrator access |
| Identification & Auth | **IA-2** | ID and Auth (Org Users) | Xiid ZKP authentication; NIST 800-63-3 AAL3 capable; biometric + device binding + continuous verification |
| Identification & Auth | **IA-5** | Authenticator Management | No credentials stored by identity provider; ZKP-based — credential theft architecturally eliminated |
| System & Comms | **SC-7** | Boundary Protection | All inbound ports closed on all platform components; attack surface elimination rather than perimeter defense |
| System & Comms | **SC-8** | Transmission Confidentiality | Triple-layer Kyber/Dilithium quantum-resistant encryption on all inter-component communications |
| System & Comms | **SC-13** | Cryptographic Protection | FIPS-compatible + post-quantum crypto (Kyber KEX per FIPS 203, Dilithium signatures per FIPS 204); addresses NIST PQC mandate timeline |
| System & Comms | **SC-17** | PKI Certificates | SealedTunnel cryptographic device attestation; no traditional PKI certificate management required for inter-component comms |
| System & Comms | **SC-28** | Protection at Rest | Combined with AES-256-GCM: Xiid ensures data never exposed in transit before reaching encrypted storage |
| System Info Integrity | **SI-2** | Flaw Remediation | CI/CD pipeline (runners sealed) ensures patching pipeline cannot be compromised; SBOM + NVD via SealedTunnel |
| System Info Integrity | **SI-10** | Information Input Validation | Process isolation prevents adversarial inputs from compromised adjacent services reaching AI inference endpoints |
| Audit & Accountability | **AU-2** | Event Logging | Cryptographic proof of connection authenticity; non-repudiable agent audit trail for ForgeRedOps and ForgeSOC |
| Audit & Accountability | **AU-10** | Non-Repudiation | Xiid maintains cryptographic proof that logged activities are definitively attributed to specific agents; cannot be repudiated |

### Control Implementation Detail — AI-Specific Protections

The following controls are specifically enhanced by Xiid's AI/ML protections beyond standard implementations:

| Control | Standard Implementation | Xiid-Enhanced Implementation |
|---------|----------------------|----------------------------|
| **SC-7** (Boundary Protection) | Network firewalls, DMZ | All inbound ports closed on Claude API client; Ollama inference invisible to network scanning |
| **AC-3** (Access Enforcement) | RBAC, API keys | Only ForgeML process reaches Claude API — not the host or adjacent services; process-level isolation |
| **SC-8** (Transmission Confidentiality) | TLS 1.3 | Kyber KEX + Dilithium signatures on every inference session; quantum-resistant |
| **AC-4** (Information Flow) | Firewall rules | Model weights inaccessible; extraction attacks blocked by architectural isolation |
| **SI-10** (Input Validation) | Input sanitization | Process isolation prevents adversarial injection from compromised adjacent services |
| **AU-10** (Non-Repudiation) | Signed logs | Each ForgeRedOps agent action carries Xiid cryptographic proof of connection authenticity |

### 3PAO Assessment Readiness

Xiid provides cryptographic evidence artifacts that 3PAO assessors can independently verify — not just system owner assertions:

- **SealedTunnel audit logs:** Independently verifiable cryptographic session records for all SC/IA/AC control implementations
- **ZKP proof records:** Zero-Knowledge Proof authentication records that prove identity verification without exposing credentials
- **Chain of custody:** Cryptographic proof that Evidence Vault items were delivered via SealedTunnel — tamper-proof evidence chain
- **Agent attribution:** Non-repudiable ForgeRedOps activity logs with per-agent cryptographic proof — definitively attributable actions

---

## Certification Roadmap & Competitive Differentiation

### Certification Roadmap

> **Recommended sequence:** SOC 2 → TX-RAMP → FedRAMP Ready → FedRAMP Moderate. This progression
> builds compliance evidence incrementally. SOC 2 is achievable fastest and validates your control
> framework. TX-RAMP has a June 2026 deadline and opens 1,950+ Texas entity opportunities. FedRAMP
> Moderate covers the broadest federal market (civilian agencies). Target IL4/IL5 only when a
> specific DoD contract requires it — the architecture is already IL4-ready.

| Certification / Phase | Timeline | Xiid Impact | Priority |
|----------------------|----------|-------------|----------|
| **SOC 2 Type II** | Phase 1 (Month 1-6) | SealedTunnel satisfies multiple SOC 2 CC6 (Logical Access) and CC7 (System Operations) criteria with cryptographic evidence | **Start here** |
| **GSA Schedule 70** | Phase 1 (Month 3-6) | Xiid integration strengthens technical evaluation factors; AI security narrative differentiates from incumbent GRC vendors | Parallel with SOC 2 |
| **TX-RAMP Level 2** | Phase 2 (by June 2026) | Sealed evidence delivery + ZKP auth addresses Texas DIR data security requirements; positions platform for 1,950+ entity opportunity | **Deadline-driven** |
| **FedRAMP Ready** | Phase 2 (Month 6-12) | Xiid control implementations directly populate SC, IA, AC families in SSP; 3PAO assessment accelerated by cryptographic audit evidence | Builds on SOC 2 |
| **FedRAMP Moderate** | Phase 3 (Month 12-24) | Xiid authorization inheritance (if FedRAMP authorized) reduces assessment burden; PQC encryption addresses emerging NIST PQC mandate | **Broadest federal market** |

**TX-RAMP June 2026 deadline:** 1,950+ Texas entities need compliant platforms. The Xiid ZKP authentication and sealed evidence delivery directly address state AI legislation requirements (Colorado SB 21-169, California AB-2013) emerging alongside TX-RAMP.

### Competitive Differentiation

The Xiid integration creates competitive advantages that are architectural and auditable — not marketing claims. These are most powerful in federal procurement contexts where technical differentiation must be demonstrated to contracting officers and 3PAO assessors.

| Factor | Drata / Vanta | RegScale | Xacta (Telos) | ForgeComply 360 + Xiid |
|--------|-------------|----------|---------------|----------------------|
| **Deployment** | Cloud only | Cloud only | Cloud + limited on-prem | Cloud + GovCloud + Air-gap (cryptographically enforced) |
| **AI inference security** | No AI inference sealing | No AI inference sealing | Limited AI capabilities | Claude API + Ollama both sealed via SealedTunnel |
| **Agent isolation** | No autonomous agents | No autonomous agents | No autonomous agents | 24 ForgeRedOps agents: per-agent dedicated SealedTunnel |
| **PQC encryption** | Standard TLS only | Standard TLS only | Standard TLS only | Kyber KEX + Dilithium; Harvest-Now-Decrypt-Later protection |
| **Authentication** | OAuth/SAML/MFA | OAuth/SAML/MFA | PKI + CAC/PIV | Xiid ZKP SSO; no credentials stored or transmitted; AAL3 |
| **Multi-cloud isolation** | Logical isolation only | Logical isolation only | Network segmentation | Xiid SDN; classification-boundary separation; cross-domain Trust Relationships |
| **CMMC Level 3 / IL5** | Not applicable | Limited support | Partial support | Air-gap gateway; local Ollama; zero external runtime deps; Xiid provable boundary |
| **CI/CD security** | Standard GitHub security | Standard pipeline security | Standard pipeline security | Runners: zero inbound; no credential exposure; lateral movement blocked |
| **3PAO audit evidence** | Standard logs | Standard logs | DoD-oriented logging | Xiid cryptographic non-repudiation; ZKP proof records in audit trail |

**Federal Procurement Impact:** The Xiid integration provides the technical depth that elevates ForgeComply 360 from "another GRC tool" to "the only platform with provably secure AI inference in air-gapped environments." Competitors cannot answer "how do you protect AI inference in a classified environment" — ForgeComply 360 + Xiid has a concrete, auditable technical answer embeddable directly into FedRAMP SSPs and CMMC assessments.

---

## Implementation Sprint Plan

The Xiid integration is structured as a 5-week sprint, mirroring the Nessus integration sprint model. Each phase delivers independently testable, production-ready capabilities. The standard Xiid 90-minute deployment claim is extended to 2-3 weeks to account for ForgeComply 360's complexity and FedRAMP documentation requirements.

### Sprint Schedule

| Phase | Duration | Deliverables | Integration Points |
|-------|----------|-------------|-------------------|
| **Phase 1: Foundation** | Week 1 | Xiid commercial terms finalized; Terniion tenant provisioned; Cloudflare Workers API wrapped in SealedTunnel; X-Scanner-Key → Xiid SSO migration | forge-api Workers; API auth layer; wrangler.toml secrets migration |
| **Phase 2: AI Inference** | Week 2 | Claude API calls wrapped in SealedTunnel; on-prem Ollama configured with zero inbound ports; RAG vector DB access sealed; ForgeML process isolation | ForgeML engine; Claude API integration; vector DB; Ollama Docker config |
| **Phase 3: Agent Isolation** | Week 3 | ForgeRedOps 24-agent per-agent SealedTunnel channels; agent memory store isolation; ForgeSOC SIEM integration via SealedTunnel; audit trail cryptographic proof | ForgeRedOps agent code; ForgeSOC SIEM connectors; Splunk/Sentinel integration |
| **Phase 4: Pipeline & Nessus** | Week 4 | GitHub Actions runners sealed; GHCR model registry protected; Nessus import pipeline SealedTunnel; Tenable SC integration; Evidence Vault delivery sealed | Forge-Scan CI/CD; Forge-Reporter; Nessus API; R2 Evidence Vault |
| **Phase 5: Air-Gap & Docs** | Week 5 | On-prem air-gap gateway configuration; DoD IL4/IL5 deployment guide; FedRAMP SSP SC/IA/AC control narrative updates; 3PAO assessment readiness review | On-prem Kubernetes; Air-gap gateway; FedRAMP SSP; OSCAL artifacts |

### Immediate Actions (Week 1)

1. Initiate contact with Xiid (xiid.com) — reference MLOps and AI Governance whitepapers as integration context
2. Request FedRAMP authorization status documentation and FIPS 203/204 (Kyber/Dilithium) compliance confirmation
3. Provision Terniion tenant; establish development SealedTunnel connecting local dev environment to forge-api Worker
4. Begin Sprint Phase 1: Migrate X-Scanner-Key auth to Xiid SSO in staging environment

### Short-Term (Weeks 2-5)

5. Execute Sprint Phases 2-5 per schedule above
6. Update FedRAMP SSP control narratives for SC-7, SC-8, SC-13, IA-2, IA-5, AC-3, AC-4 to reflect Xiid implementation
7. Generate OSCAL control implementation records for all Xiid-satisfied controls
8. Prepare 3PAO assessment evidence package: SealedTunnel audit logs, ZKP proof records, cryptographic chain of custody

### Medium-Term (Month 2-3)

9. Complete SOC 2 Type II control mapping updates reflecting Xiid implementation
10. Develop sales collateral: "Provably Secure AI Compliance" narrative using Xiid integration as core differentiator
11. Negotiate channel partner arrangement with Xiid for bundled federal proposals
12. Publish air-gapped deployment guide for DoD IL5 customers — ForgeComply 360 + Xiid + on-prem Ollama

### Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| SealedTunnel coverage | 100% of inter-component comms | Network scan: zero open inbound ports on any ForgeComply 360 component |
| Authentication modernization | Zero stored credentials for service accounts | Security audit: no API keys in env vars, config files, or secret stores |
| ForgeRedOps isolation | 24/24 agents on dedicated SealedTunnel channels | Xiid console: per-agent tunnel assignment verification |
| Claude API sealing | 100% of inference calls via SealedTunnel | ForgeML logging: all calls routed through Xiid proxy; zero direct API calls |
| CI/CD runner security | Zero inbound ports on all GitHub Actions runners | GitHub Actions audit: runner network configuration verified |
| FedRAMP SSP completeness | 15 NIST 800-53 controls with Xiid implementation narratives | SSP control implementation status: Implemented (Xiid-satisfied) |
| 3PAO evidence package | Cryptographic proof records for all SC/IA/AC controls | Audit evidence vault: ZKP proof records, SealedTunnel session logs |

---

## Schema & API Changes

### Database Schema Changes

The Xiid integration adds columns to existing authentication and audit tables to support Xiid session tokens, ZKP proof records, and SealedTunnel session identifiers for complete audit chain coverage. No new tables are required.

| Table | New Column | Type | Purpose |
|-------|-----------|------|---------|
| `users` | `xiid_identity_id` | `TEXT UNIQUE` | Xiid ZKP identity binding; replaces password-based credential |
| `users` | `xiid_device_attestation` | `TEXT` | Cryptographic device binding for NIST 800-63-3 AAL3 |
| `scan_imports` | `sealed_tunnel_session_id` | `TEXT` | SealedTunnel session ID for Nessus file transfer audit |
| `scan_imports` | `xiid_imported_by` | `TEXT` | ZKP-verified identity of importing user (non-repudiable) |
| `audit_logs` | `xiid_proof_hash` | `TEXT` | Xiid cryptographic proof of connection authenticity |
| `audit_logs` | `sealed_session_ref` | `TEXT` | Reference to SealedTunnel session for full correlation |
| `evidence_items` | `sealed_delivery_proof` | `TEXT` | Cryptographic proof item was delivered via SealedTunnel |

### Migration SQL

```sql
-- Xiid integration schema additions
-- Run after Sprint Phase 1 completion

-- User identity binding
ALTER TABLE users ADD COLUMN xiid_identity_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN xiid_device_attestation TEXT;

-- Scan import audit chain
ALTER TABLE scan_imports ADD COLUMN sealed_tunnel_session_id TEXT;
ALTER TABLE scan_imports ADD COLUMN xiid_imported_by TEXT;

-- Audit log cryptographic proof
ALTER TABLE audit_logs ADD COLUMN xiid_proof_hash TEXT;
ALTER TABLE audit_logs ADD COLUMN sealed_session_ref TEXT;

-- Evidence vault delivery proof
ALTER TABLE evidence_items ADD COLUMN sealed_delivery_proof TEXT;

-- Index for audit correlation queries
CREATE INDEX idx_audit_logs_sealed_session ON audit_logs(sealed_session_ref);
CREATE INDEX idx_audit_logs_xiid_proof ON audit_logs(xiid_proof_hash);
CREATE INDEX idx_scan_imports_sealed ON scan_imports(sealed_tunnel_session_id);
```

### API Endpoint Changes

The Xiid integration modifies the authentication layer for all existing API endpoints rather than introducing new endpoints. The primary change is replacing `X-Scanner-Key` header authentication with Xiid token validation and adding SealedTunnel session verification as middleware.

| Endpoint Group | Change Type | Description |
|---------------|------------|-------------|
| `POST /api/v1/auth/*` | Replacement | Xiid ZKP SSO replaces JWT issuance for UI users; service accounts use SealedTunnel identity |
| `POST /api/v1/scanner/*` | Middleware addition | SealedTunnel session verification middleware added before X-Scanner-Key validation; both validated |
| `POST /api/v1/scans/import` | SealedTunnel required | Nessus .nessus file upload requires active SealedTunnel session; `sealed_tunnel_session_id` recorded |
| `GET /api/v1/oscal/*` | Delivery sealing | OSCAL artifact exports delivered via SealedTunnel to auditor portal; standard HTTPS fallback with warning |
| `ALL /api/v1/*` | Audit enhancement | `xiid_proof_hash` added to all audit log entries; non-repudiable activity attribution |

### Xiid Commercial Terms (Pre-Sprint)

Before committing to deep integration, resolve with Xiid:

- **FedRAMP status:** Confirm Xiid's own FedRAMP authorization status and whether ForgeComply 360 can inherit controls from Xiid's authorization boundary
- **IL5 compatibility:** Confirm Terniion compatibility with DoD IL5 accreditation requirements — specifically Kyber/Dilithium alignment with NIST PQC standards (FIPS 203, 204)
- **SLA requirements:** Contract SLA for SealedTunnel availability — ForgeComply 360's continuous authorization (24/7 ControlPulse) depends on SealedTunnel uptime; requires 99.99% SLA

---

## Monitoring & Observability

### Key Metrics Across All Services

| Metric | Source | Alert Threshold |
|--------|--------|----------------|
| ForgeComply API p99 latency | Node.js | > 2s |
| Forge-Scan scan queue depth | Redis | > 100 pending |
| Forge-Scan engine memory | Rust process | > 80% limit |
| ForgeAI risk assessment latency | Node.js | > 5s |
| PostgreSQL connections (all DBs) | pg_exporter | > 80% max |
| Redis memory usage | Redis INFO | > 80% maxmemory |
| Ollama inference latency | Custom | > 30s |
| Disk usage | node_exporter | > 85% |
| MinIO storage | MinIO metrics | > 90% capacity |
| Tunnel status (CF or Xiid) | Agent metrics | Disconnected |

---

## Backup & Disaster Recovery

### Automated Backup Schedule

| What | Frequency | Retention | Method |
|------|-----------|-----------|--------|
| PostgreSQL (all 3 DBs) | Daily 2 AM UTC | 30 days | pg_dump per DB → gzip |
| MinIO evidence + scans | Daily incremental | 90 days | mc mirror to backup volume |
| Redis RDB snapshot | Hourly | 24 hours | Automatic |
| Full system snapshot | Weekly | 4 weeks | Hetzner snapshot API |

### Backup Script

```bash
#!/bin/bash
# scripts/backup-hetzner.sh
set -euo pipefail

BACKUP_DIR="/backups/$(date +%Y%m%d)"
COMPOSE="docker compose -f ~/forge/ForgeComply360/docker/docker-compose.hetzner.yml"
mkdir -p "$BACKUP_DIR"

# 1. All PostgreSQL databases
for db in forgecomply forgescan forgeai; do
  echo "Backing up PostgreSQL database: $db"
  $COMPOSE exec -T postgres pg_dump -U forgecomply -Fc "$db" > "$BACKUP_DIR/$db.dump"
done

# 2. MinIO evidence + scan files
echo "Syncing evidence vault..."
$COMPOSE exec -T minio mc mirror --overwrite /data "$BACKUP_DIR/evidence/"

# 3. Compress
tar czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

# 4. Cleanup old backups
find /backups -name "*.tar.gz" -mtime +30 -delete

echo "Backup complete: $BACKUP_DIR.tar.gz"
```

---

## Cost Estimates

### Full Platform — Hybrid (Cloudflare + Hetzner)

| Component | Pure Cloudflare (all 4 products) | Hybrid (CF + Hetzner) |
|-----------|--------------------------------|----------------------|
| 3x Frontend hosting | Pages: Free | Pages: Free |
| ForgeComply API | Workers: $5-25/mo | Included in server |
| Forge-Scan API + Engine | Workers + Durable Objects: $10-50/mo | Included in server |
| ForgeAI Govern API | Workers: $5-15/mo | Included in server |
| 3x Databases | D1: $15-75/mo | PostgreSQL (included) |
| Cache/KV | KV: $5-15/mo | Redis (included) |
| Object storage (1TB) | R2: ~$15/mo | MinIO (block storage): ~€48/mo |
| AI inference | Workers AI: $50-200+/mo | Ollama (included) |
| CDN/WAF/DNS | Free | Free |
| Tunnel | Free | Free (CF) or Xiid license |
| **Hetzner compute** | N/A | AX42 dedicated: €49/mo |
| **Total (est.)** | **$100-400/mo** | **~€97/mo (~$106)** |

### With Xiid SealedTunnel Add-On

Xiid SealedTunnel is enterprise-licensed. Contact Xiid for pricing. Factor in:
- Per-agent licensing
- Xiid Commander (control plane) subscription
- Xiid Aclave (authentication) if using credentialless auth

---

## Migration Path from Pure Cloudflare

### Phase 1: Set Up Hetzner Infrastructure (Day 1-2)

1. Provision Hetzner server
2. Clone all four repositories
3. Deploy `docker-compose.hetzner.yml`
4. Set up connectivity (Cloudflare Tunnel or Xiid SealedTunnel)
5. Verify all APIs accessible via tunnel

### Phase 2: Data Migration (Day 2-3)

```bash
# Export ForgeComply D1 database
npx wrangler d1 export forge-comply360-db --remote --output=forgecomply-d1.sql

# Export ForgeAI D1 database
npx wrangler d1 export forgeai-db --remote --output=forgeai-d1.sql

# Convert SQLite → PostgreSQL (adjust data types)
# Key differences: datetime → timestamptz, integer booleans → boolean

# Import to PostgreSQL on Hetzner
psql -h localhost -U forgecomply -d forgecomply < forgecomply-pg.sql
psql -h localhost -U forgecomply -d forgeai < forgeai-pg.sql

# Sync R2 evidence files to MinIO
rclone sync r2:forge-evidence minio:forge-evidence
```

### Phase 3: DNS Cutover (Day 3)

1. Update DNS records to point API domains to tunnel/Xiid
2. Rebuild all frontends with new API URLs
3. Deploy frontends to Cloudflare Pages
4. Monitor error rates for 24 hours

### Phase 4: Decommission Old Stack (Day 7+)

1. Verify all data consistent across all 4 products
2. Remove old Workers deployments
3. Keep D1/R2 as read-only backup for 30 days
4. Delete after verification period

---

## Quick Start Summary

```bash
# 1. Provision Hetzner server (AX42 recommended for full platform)
# 2. SSH in, install Docker, create app user

# 3. Clone all repos
mkdir ~/forge && cd ~/forge
git clone https://github.com/Bjay0727-jay/ForgeComply360.git
git clone https://github.com/Bjay0727-jay/Forge-Reporter.git
git clone https://github.com/Bjay0727-jay/Forge-Scan.git
git clone https://github.com/Bjay0727-jay/AI-Governance.git

# 4. Configure secrets
cp ForgeComply360/docker/.env.hetzner.example ForgeComply360/docker/.env.hetzner
# Edit with generated secrets

# 5. Start platform with Cloudflare Tunnel
docker compose -f ForgeComply360/docker/docker-compose.hetzner.yml \
  --profile cloudflare-tunnel up -d

# OR with Xiid SealedTunnel (after installing agent on host)
docker compose -f ForgeComply360/docker/docker-compose.hetzner.yml up -d
systemctl start xiid-agent

# 6. Pull AI model
docker exec forge-ollama ollama pull llama3.1:8b

# 7. Verify all services
curl https://api.forgecomply360.com/health      # ForgeComply 360
curl https://scan.forgecomply360.com/health      # Forge-Scan
curl https://ai-api.forgecomply360.com/health    # ForgeAI Govern
```

---

## References

### External
- [Xiid SealedTunnel Technical Overview](https://docs.xiid.com/history/3.0.0/src/technical_overview.html)
- [Xiid Products — Terniion Platform](https://www.xiid.com/products)
- [Xiid + Cytex Strategic Partnership (Feb 2026)](https://www.xiid.com/other-resources/press-release/xiid-partners-with-cytex)
- [Xiid Zero Knowledge Networking for Financial Institutions](https://www.xiid.com/blog/strengthening-cybersecurity-in-financial-institutions-with-xiids-zero-knowledge-networking)
- [Xiid Ventura Capital Funding Announcement](https://www.businesswire.com/news/home/20250904616035/en/Xiid-Announces-Strategic-Funding-from-Ventura-Capital-to-Advance-Zero-Knowledge-Networking)

### Internal
- ForgeComply 360 Xiid Integration Design Document v1.0 (Feb 2026) — `docs/ForgeComply360_Xiid_Integration_Design (1).docx`
- ForgeComply 360 Xiid Architecture Diagram — `docs/xiid-forgecomply-architecture.svg`

---

*Document maintained by Forge Cyber Defense Engineering Team*
