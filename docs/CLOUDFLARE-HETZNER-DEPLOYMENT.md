# Forge Cyber Defense — Full Platform Hybrid Deployment Guide
# Cloudflare + Hetzner + Xiid SealedTunnel

**Version:** 5.0.0
**Date:** 2026-02-26
**Author:** Forge Cyber Defense (SDVOSB)

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Why Cloudflare + Hetzner](#why-cloudflare--hetzner)
3. [Architecture Overview](#architecture-overview)
4. [Xiid SealedTunnel Integration](#xiid-sealedtunnel-integration)
5. [Component Placement](#component-placement)
6. [Hetzner Server Setup](#hetzner-server-setup)
7. [Full-Platform Docker Compose](#full-platform-docker-compose)
8. [Cloudflare Configuration](#cloudflare-configuration)
9. [Networking & Security](#networking--security)
10. [Forge-Reporter Integration](#forge-reporter-integration)
11. [Forge-Scan Integration](#forge-scan-integration)
12. [ForgeAI Govern Integration](#forgeai-govern-integration)
13. [CI/CD Pipeline](#cicd-pipeline)
14. [Monitoring & Observability](#monitoring--observability)
15. [Backup & Disaster Recovery](#backup--disaster-recovery)
16. [Cost Estimates](#cost-estimates)
17. [Migration Path from Pure Cloudflare](#migration-path-from-pure-cloudflare)

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

ForgeComply 360 currently supports two deployment modes:

| Mode | Stack | Best For |
|------|-------|----------|
| **Cloud-native** | Cloudflare Workers + D1 + R2 + KV | Low-ops SaaS delivery |
| **On-premises** | Docker Compose (PostgreSQL, Redis, MinIO, Ollama) | Air-gapped/SCIF environments |

A **hybrid Cloudflare + Hetzner** deployment combines the strengths of both:

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

### Why Xiid Instead of (or Alongside) Cloudflare Tunnel

| Feature | Cloudflare Tunnel | Xiid SealedTunnel |
|---------|------------------|-------------------|
| **Encryption** | QUIC/HTTP2 tunnel encryption | Triple-layer, quantum-resistant encryption |
| **Trust model** | Zero Trust (Cloudflare sees plaintext) | **Zero Knowledge** (even Xiid cannot see traffic) |
| **Port requirements** | Outbound 443 | Outbound 443 only |
| **DoD ATO** | No | **Yes** — DISA-validated, AFRL-tested |
| **FIPS compliance** | Partial | Designed for FIPS environments |
| **Collector compromise** | N/A | Attacker still cannot access private resources |
| **Moving Target Defense** | No | Yes — servers can move without IP reconfiguration |
| **Cost** | Free (basic) / $7/user (Access) | Enterprise licensing (contact Xiid) |
| **Best for** | Commercial SaaS deployments | Federal/DoD, CMMC L3, IL4/IL5, financial |

### Deployment Option 1: Xiid Replaces Cloudflare Tunnel

Use this when you need the highest security posture (federal/DoD environments):

```
Browser → Cloudflare CDN (static assets only)
       → Xiid SealedTunnel → Hetzner (API + data)
```

In this mode:
- Cloudflare Pages still serves the static frontend SPAs (CDN only)
- Cloudflare DNS is set to **DNS-only** (gray cloud) for API domains — no proxy
- All API traffic flows through Xiid SealedTunnel instead of Cloudflare Tunnel
- Cloudflare WAF is NOT in the path (Xiid handles security at the network layer)

### Deployment Option 2: Xiid + Cloudflare (Defense in Depth)

Use this for maximum layered security:

```
Browser → Cloudflare CDN + WAF → Xiid SealedTunnel → Hetzner
```

In this mode:
- Cloudflare provides Layer 7 WAF, DDoS, and bot protection
- Xiid SealedTunnel replaces `cloudflared` as the connectivity layer
- Double encryption: Cloudflare TLS + Xiid triple-layer quantum encryption
- Even if Cloudflare is compromised, Xiid's zero-knowledge model protects the origin

### Deployment Option 3: Xiid for Inter-Service Communication

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

authentication:
  # Xiid Aclave credentialless auth (FIDO2-compliant)
  method: aclave
  # Or use certificate-based auth for automated deployments
  # method: certificate
  # cert_path: /etc/xiid/certs/agent.pem
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

| Requirement | Use Cloudflare Tunnel | Use Xiid SealedTunnel |
|-------------|----------------------|----------------------|
| Commercial SaaS | Yes | Optional |
| CMMC Level 1-2 | Yes | Optional |
| CMMC Level 3 | Consider Xiid | **Yes** |
| DoD IL4/IL5 | No | **Yes** |
| FedRAMP High | Consider Xiid | **Yes** |
| HIPAA | Yes | Optional |
| Financial (SOX/PCI) | Yes | Recommended |
| Data sovereignty | Depends | **Yes** (zero knowledge) |
| Quantum-resistance requirement | No | **Yes** |
| Budget-sensitive | Yes (free) | Enterprise licensing |

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

| Spec | Hetzner Product | Monthly Cost |
|------|----------------|-------------|
| **Cloud VPS** | CPX41 (8 vCPU, 16 GB RAM, 240 GB NVMe) | ~€15.90/mo |
| **Block Storage** | 500 GB for evidence + scan data | ~€23.80/mo |
| **Total** | | **~€40/mo** |

#### Option B: Dedicated Server (Medium org, 50-500 users)

| Spec | Hetzner Product | Monthly Cost |
|------|----------------|-------------|
| **Dedicated** | AX42 (Ryzen 5 3600, 64 GB RAM, 2x512 GB NVMe) | ~€49/mo |
| **Block Storage** | 1 TB for evidence + scan data | ~€47.60/mo |
| **Total** | | **~€97/mo** |

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
  #  CONNECTIVITY (choose ONE: cloudflared OR xiid-agent)
  # ══════════════════════════════════════════════════════════════

  # Option A: Cloudflare Tunnel (standard commercial deployment)
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

Forge-Reporter is an **offline-first** SSP wizard that can operate in two modes:

### Standalone Mode (Default)
- Deployed to Cloudflare Pages as a static SPA
- All data stored in browser `localStorage`
- No backend required — ideal for classified environments
- Exports OSCAL JSON, OSCAL XML, and PDF locally

### Connected Mode (Synced with ForgeComply 360)
- Authenticates with ForgeComply 360 API via URL parameters
- Bidirectional sync: SSP data flows between Reporter and ForgeComply 360
- ForgeML AI assistance for content generation via ForgeComply's Ollama backend
- Evidence references link to the ForgeComply 360 evidence vault

### Integration Configuration

```bash
# Forge-Reporter .env for connected mode
VITE_API_URL=https://api.forgecomply360.com
VITE_SYNC_ENABLED=true
VITE_AI_ENABLED=true
```

### How It Fits in the Architecture

```
┌─────────────────────┐        ┌─────────────────────┐
│  Forge-Reporter      │  sync  │  ForgeComply 360     │
│  (Cloudflare Pages)  │───────▶│  API (Hetzner)       │
│                      │◀───────│                      │
│  Browser-only SSP    │        │  Systems, Controls,  │
│  wizard (23 sections)│        │  Evidence, SSP docs  │
└─────────────────────┘        └──────────┬───────────┘
                                          │
                                          ▼
                                ┌─────────────────────┐
                                │  Ollama (Hetzner)    │
                                │  AI-assisted SSP     │
                                │  content generation  │
                                └─────────────────────┘
```

---

## Forge-Scan Integration

Forge-Scan is the vulnerability management backbone with four sub-products:

| Sub-Product | Description | Integration Point |
|-------------|-------------|-------------------|
| **ForgeScan Engine** | Rust-based scanner (agentless + agent) | gRPC → Forge-Scan API → ForgeComply 360 |
| **ForgeScan 360** | Vuln management, asset discovery, FRS scoring | Shared PostgreSQL, feeds POA&Ms |
| **ForgeSOC** | 24/7 threat monitoring & incident response | Redis pub/sub alerts → ForgeComply 360 |
| **ForgeRedOps** | AI-powered pen testing (24 autonomous agents) | Ollama inference, findings → POA&Ms |

### Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    SCAN → COMPLY PIPELINE                      │
│                                                               │
│  ┌────────────┐    gRPC     ┌────────────┐    REST API       │
│  │ ForgeScan  │────────────▶│ ForgeScan  │──────────────┐    │
│  │ Engine     │   findings  │ 360 API    │   vuln data   │    │
│  │ (Rust)     │             │ :8444      │               │    │
│  └────────────┘             └────────────┘               │    │
│                                                           │    │
│  ┌────────────┐  threat    ┌────────────┐               │    │
│  │ ForgeSOC   │  alerts    │ Redis      │  pub/sub      │    │
│  │ (monitor)  │───────────▶│ :6379      │───────────┐   │    │
│  └────────────┘            └────────────┘           │   │    │
│                                                      │   │    │
│  ┌────────────┐  findings  ┌────────────┐           │   │    │
│  │ ForgeRedOps│───────────▶│ Ollama     │           │   │    │
│  │ (AI pentest│            │ :11434     │           │   │    │
│  └────────────┘            └────────────┘           │   │    │
│                                                      ▼   ▼    │
│                                              ┌────────────┐   │
│                                              │ForgeComply  │   │
│                                              │360 API      │   │
│                                              │:8443        │   │
│                                              │             │   │
│                                              │ Auto-creates│   │
│                                              │ • POA&Ms    │   │
│                                              │ • Risks     │   │
│                                              │ • Assets    │   │
│                                              │ • Alerts    │   │
│                                              └────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Key Integration Points

1. **Scan results → POA&Ms**: When Forge-Scan discovers vulnerabilities, ForgeComply 360 auto-creates POA&M entries
2. **Asset discovery → Systems**: Discovered assets populate the ForgeComply 360 system inventory
3. **CVE findings → Risk register**: High/critical CVEs auto-populate the RiskForge risk register
4. **Continuous monitoring**: ForgeSOC feeds ControlPulse continuous monitoring checks
5. **Shared database**: All products share PostgreSQL (separate databases) and Redis

---

## ForgeAI Govern Integration

ForgeAI Govern manages AI system governance and maps to regulatory frameworks:

| Framework | Coverage |
|-----------|----------|
| NIST AI RMF 1.0 | Full 6-dimension risk assessment |
| NIST AI 600-1 | Generative AI guidance |
| FDA SaMD | Software as Medical Device |
| ONC HTI-1 | Health IT decision support |
| HIPAA | AI-specific privacy controls |
| State laws | CO, CA, CT, NYC AI regulations |

### Integration with ForgeComply 360

```
┌─────────────────────┐        ┌─────────────────────┐
│  ForgeAI Govern      │  API   │  ForgeComply 360     │
│  :8445               │───────▶│  :8443               │
│                      │        │                      │
│  AI system registry  │        │  Maps AI controls    │
│  Risk assessments    │        │  to NIST 800-53,     │
│  Bias testing        │        │  FedRAMP, HIPAA      │
│  Maturity scoring    │        │  frameworks          │
│  Incident tracking   │        │                      │
│  Vendor assessments  │        │  Unified compliance  │
│                      │◀───────│  dashboard           │
│  Compliance status   │  sync  │  Evidence vault      │
└─────────────────────┘        └─────────────────────┘
```

### Cross-Platform SSO

All four products share the same JWT authentication:

```
User logs in → ForgeComply 360 → JWT token
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              Forge-Reporter  Forge-Scan API   ForgeAI Govern
              (URL params)    (Bearer token)   (Bearer token)
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

- [Xiid SealedTunnel Technical Overview](https://docs.xiid.com/history/3.0.0/src/technical_overview.html)
- [Xiid Products — Terniion Platform](https://www.xiid.com/products)
- [Xiid + Cytex Strategic Partnership (Feb 2026)](https://www.xiid.com/other-resources/press-release/xiid-partners-with-cytex)
- [Xiid Zero Knowledge Networking for Financial Institutions](https://www.xiid.com/blog/strengthening-cybersecurity-in-financial-institutions-with-xiids-zero-knowledge-networking)
- [Xiid Ventura Capital Funding Announcement](https://www.businesswire.com/news/home/20250904616035/en/Xiid-Announces-Strategic-Funding-from-Ventura-Capital-to-Advance-Zero-Knowledge-Networking)

---

*Document maintained by Forge Cyber Defense Engineering Team*
