# ForgeComply 360 — Cloudflare + Hetzner Hybrid Deployment Guide

**Version:** 5.0.0
**Date:** 2026-02-26
**Author:** Forge Cyber Defense (SDVOSB)

---

## Table of Contents

1. [Why Cloudflare + Hetzner](#why-cloudflare--hetzner)
2. [Architecture Overview](#architecture-overview)
3. [Component Placement](#component-placement)
4. [Hetzner Server Setup](#hetzner-server-setup)
5. [Cloudflare Configuration](#cloudflare-configuration)
6. [Networking & Security](#networking--security)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Monitoring & Observability](#monitoring--observability)
9. [Backup & Disaster Recovery](#backup--disaster-recovery)
10. [Cost Estimates](#cost-estimates)
11. [Migration Path from Pure Cloudflare](#migration-path-from-pure-cloudflare)

---

## Why Cloudflare + Hetzner

ForgeComply 360 currently supports two deployment modes:

| Mode | Stack | Best For |
|------|-------|----------|
| **Cloud-native** | Cloudflare Workers + D1 + R2 + KV | Low-ops SaaS delivery |
| **On-premises** | Docker Compose (PostgreSQL, Redis, MinIO, Ollama) | Air-gapped/SCIF environments |

A **hybrid Cloudflare + Hetzner** deployment combines the strengths of both:

- **Cloudflare** handles what it does best: global CDN, DDoS protection, WAF, DNS, TLS termination, and static asset delivery
- **Hetzner** provides cost-effective, high-performance bare metal or cloud VMs for stateful workloads: databases, AI inference, object storage, and background processing

### When to choose this architecture

- You need **PostgreSQL** instead of D1 (SQLite) for higher concurrency, full-text search, or compliance with data-residency requirements (Hetzner has EU and US data centers)
- You want to run **Ollama/local AI** for ForgeML Writer without Workers AI usage costs
- You need **dedicated compute** for large evidence vaults or heavy compliance workloads
- You want **predictable monthly costs** (Hetzner) with **elastic edge performance** (Cloudflare)
- Your compliance framework requires data to reside in a specific jurisdiction (Hetzner Falkenstein/Nuremberg for EU, Ashburn for US)

---

## Architecture Overview

```
                        ┌─────────────────────────────────────┐
                        │         CLOUDFLARE EDGE              │
                        │                                      │
  Browser ─────────────▶│  ┌──────────────────────────────┐   │
                        │  │   Cloudflare Pages (CDN)      │   │
                        │  │   React SPA + Static Assets   │   │
                        │  └──────────────────────────────┘   │
                        │                                      │
                        │  ┌──────────────────────────────┐   │
                        │  │   Cloudflare DNS + WAF        │   │
                        │  │   DDoS Protection             │   │
                        │  │   SSL/TLS Termination         │   │
                        │  │   Rate Limiting (WAF rules)   │   │
                        │  └──────────┬───────────────────┘   │
                        │             │ Proxy to origin        │
                        └─────────────┼───────────────────────┘
                                      │
                           ┌──────────▼──────────┐
                           │  Cloudflare Tunnel   │
                           │  (cloudflared)       │
                           └──────────┬──────────┘
                                      │ Encrypted tunnel
                        ┌─────────────┼───────────────────────┐
                        │    HETZNER SERVER(S)                 │
                        │             │                        │
                        │  ┌──────────▼──────────┐            │
                        │  │     nginx           │            │
                        │  │  (reverse proxy)    │            │
                        │  └──────────┬──────────┘            │
                        │             │                        │
                        │  ┌──────────▼──────────┐            │
                        │  │   Node.js API       │            │
                        │  │  (forgecomply-api)   │            │
                        │  │   Port 8443         │            │
                        │  └──┬──────┬──────┬────┘            │
                        │     │      │      │                  │
                        │  ┌──▼──┐┌──▼──┐┌──▼──┐  ┌────────┐ │
                        │  │ PG  ││Redis││MinIO│  │ Ollama │ │
                        │  │:5432││:6379││:9000│  │ :11434 │ │
                        │  └─────┘└─────┘└─────┘  └────────┘ │
                        │                                      │
                        │  ┌──────────────────────────────┐   │
                        │  │  Prometheus + Grafana         │   │
                        │  │  (monitoring)                  │   │
                        │  └──────────────────────────────┘   │
                        └──────────────────────────────────────┘
```

---

## Component Placement

### What stays on Cloudflare

| Component | Service | Reason |
|-----------|---------|--------|
| Frontend SPA | Cloudflare Pages | Global CDN, automatic SSL, instant cache purge |
| DNS | Cloudflare DNS | Proxy mode enables WAF + DDoS protection |
| WAF/DDoS | Cloudflare WAF | Layer 7 protection, bot management, rate limiting |
| TLS Termination | Cloudflare Edge | Free managed certificates, TLS 1.3 |
| Edge Caching | Cloudflare Cache | Cache static API responses (framework data, control catalogs) |
| Tunnel | Cloudflare Tunnel | Secure connectivity to Hetzner without exposing ports |

### What moves to Hetzner

| Component | Service | Reason |
|-----------|---------|--------|
| API Server | Node.js (Express or Fastify) | Full Node.js runtime (not limited to Workers edge constraints) |
| Database | PostgreSQL 15+ | Full SQL, JSONB, full-text search, concurrent writes |
| Cache | Redis 7+ | Fast session store, rate limiting, pub/sub for real-time |
| Object Storage | MinIO (S3-compatible) | Evidence vault, unlimited storage, no egress fees |
| AI/LLM | Ollama | Local AI inference for ForgeML Writer, no per-request cost |
| Backups | Automated scripts | PostgreSQL pg_dump + MinIO sync |
| Monitoring | Prometheus + Grafana | Full observability stack |

---

## Hetzner Server Setup

### Recommended Server Configurations

#### Option A: Single Server (Small/Medium deployments, up to ~50 users)

| Spec | Hetzner Product | Monthly Cost |
|------|----------------|-------------|
| **Cloud VPS** | CPX41 (8 vCPU, 16 GB RAM, 240 GB NVMe) | ~€15.90/mo |
| **Block Storage** | 500 GB for evidence vault | ~€23.80/mo |
| **Total** | | **~€40/mo** |

#### Option B: Dedicated Server (Large deployments, 50-500 users)

| Spec | Hetzner Product | Monthly Cost |
|------|----------------|-------------|
| **Dedicated** | AX42 (Ryzen 5 3600, 64 GB RAM, 2×512 GB NVMe) | ~€49/mo |
| **Block Storage** | 1 TB for evidence vault | ~€47.60/mo |
| **Total** | | **~€97/mo** |

#### Option C: Multi-Server (Enterprise, 500+ users, HA required)

| Server | Hetzner Product | Role | Monthly Cost |
|--------|----------------|------|-------------|
| App Server 1 | CPX41 | API + nginx | ~€15.90 |
| App Server 2 | CPX41 | API + nginx (failover) | ~€15.90 |
| DB Server | CPX51 (16 vCPU, 32 GB RAM) | PostgreSQL primary | ~€29.90 |
| DB Replica | CPX31 | PostgreSQL read replica | ~€11.90 |
| AI Server | CCX33 (8 dedicated vCPU, 32 GB RAM) | Ollama + GPU | ~€49.90 |
| Storage | Volume 2 TB | MinIO evidence vault | ~€95.20 |
| **Total** | | | **~€219/mo** |

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

# Firewall: only allow SSH and Cloudflare Tunnel
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH (restrict to your IP later)
ufw enable

# fail2ban for SSH brute force protection
systemctl enable fail2ban
systemctl start fail2ban

# 4. Install Docker
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin

# 5. Create app user (never run as root)
adduser --disabled-password forgecomply
usermod -aG docker forgecomply
su - forgecomply

# 6. Clone the repository
git clone https://github.com/Bjay0727-jay/ForgeComply360.git
cd ForgeComply360
```

### Docker Compose for Hetzner

Create `docker/docker-compose.hetzner.yml`:

```yaml
services:
  # ── API Server ──
  api:
    build:
      context: ..
      dockerfile: docker/Dockerfile.api
    container_name: forgecomply-api
    restart: unless-stopped
    ports:
      - "127.0.0.1:8443:8443"  # Only bind to localhost (Cloudflare Tunnel handles external)
    environment:
      - NODE_ENV=production
      - PORT=8443
      - DATABASE_URL=postgresql://${DB_USER:-forgecomply}:${DB_PASSWORD}@postgres:5432/${DB_NAME:-forgecomply}
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
      - CORS_ORIGIN=${CORS_ORIGIN:-https://app.forgecomply360.com}
      - RESEND_API_KEY=${RESEND_API_KEY}
      - SENTRY_DSN=${SENTRY_DSN}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - forgecomply-net
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

  # ── PostgreSQL ──
  postgres:
    image: postgres:16-alpine
    container_name: forgecomply-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=${DB_USER:-forgecomply}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME:-forgecomply}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backups/postgres:/backups
    networks:
      - forgecomply-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-forgecomply}"]
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
      -c log_connections=on

  # ── Redis ──
  redis:
    image: redis:7-alpine
    container_name: forgecomply-redis
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
      - forgecomply-net
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

  # ── MinIO (Evidence Vault) ──
  minio:
    image: minio/minio:latest
    container_name: forgecomply-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_ACCESS_KEY}
      - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}
    volumes:
      - /mnt/evidence-vault:/data  # Mount Hetzner block storage here
    networks:
      - forgecomply-net
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

  # ── Ollama (ForgeML Writer AI) ──
  ollama:
    image: ollama/ollama:latest
    container_name: forgecomply-ollama
    restart: unless-stopped
    volumes:
      - ollama-data:/root/.ollama
    networks:
      - forgecomply-net
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
    # Uncomment for GPU support on Hetzner dedicated servers:
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: 1
    #           capabilities: [gpu]

  # ── Cloudflare Tunnel ──
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: forgecomply-tunnel
    restart: unless-stopped
    command: tunnel --no-autoupdate run
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
    networks:
      - forgecomply-net
    depends_on:
      - api

  # ── Automated Backups ──
  backup:
    image: postgres:16-alpine
    container_name: forgecomply-backup
    restart: "no"
    entrypoint: /bin/sh
    command: >
      -c "pg_dump -h postgres -U ${DB_USER:-forgecomply} ${DB_NAME:-forgecomply} |
          gzip > /backups/forge-$(date +%Y%m%d-%H%M%S).sql.gz &&
          find /backups -name '*.sql.gz' -mtime +${BACKUP_RETENTION_DAYS:-30} -delete"
    environment:
      - PGPASSWORD=${DB_PASSWORD}
    volumes:
      - ./backups/postgres:/backups
    networks:
      - forgecomply-net
    profiles:
      - backup

volumes:
  postgres-data:
  redis-data:
  ollama-data:

networks:
  forgecomply-net:
    driver: bridge
```

### Environment File

Create `docker/.env.hetzner`:

```bash
# ── Database ──
DB_USER=forgecomply
DB_PASSWORD=<generate-with: openssl rand -hex 32>
DB_NAME=forgecomply

# ── Redis ──
REDIS_PASSWORD=<generate-with: openssl rand -hex 32>

# ── MinIO (Evidence Vault) ──
MINIO_ACCESS_KEY=forgecomply
MINIO_SECRET_KEY=<generate-with: openssl rand -hex 32>

# ── Application Secrets ──
JWT_SECRET=<generate-with: openssl rand -hex 64>
JWT_REFRESH_SECRET=<generate-with: openssl rand -hex 64>
ENCRYPTION_KEY=<generate-with: openssl rand -hex 32>

# ── AI ──
OLLAMA_MODEL=llama3.1:8b

# ── Cloudflare Tunnel ──
CLOUDFLARE_TUNNEL_TOKEN=<from-cloudflare-dashboard>

# ── External Services (optional) ──
RESEND_API_KEY=
SENTRY_DSN=

# ── Frontend ──
CORS_ORIGIN=https://app.forgecomply360.com

# ── Backups ──
BACKUP_RETENTION_DAYS=30
```

---

## Cloudflare Configuration

### Step 1: DNS Setup

Point your domain to Cloudflare (proxy mode enabled):

| Record | Type | Name | Value | Proxy |
|--------|------|------|-------|-------|
| Frontend | CNAME | `app` | `forgecomply360.pages.dev` | Proxied |
| API | CNAME | `api` | `<tunnel-id>.cfargotunnel.com` | Proxied |

### Step 2: Create a Cloudflare Tunnel

```bash
# Install cloudflared on your local machine (for initial setup)
brew install cloudflared  # macOS
# or: apt install cloudflared  # Debian/Ubuntu

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create forgecomply-hetzner

# Note the tunnel ID and credentials file path
# Copy the tunnel token for the Docker environment

# Configure the tunnel routing
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  # API traffic
  - hostname: api.forgecomply360.com
    service: http://api:8443
    originRequest:
      noTLSVerify: true
  # MinIO console (admin only, restrict via Cloudflare Access)
  - hostname: storage.forgecomply360.com
    service: http://minio:9001
  # Catch-all
  - service: http_status:404
EOF

# Route DNS
cloudflared tunnel route dns forgecomply-hetzner api.forgecomply360.com
```

### Step 3: Cloudflare Pages (Frontend)

The frontend continues to deploy to Cloudflare Pages. Update the build environment variable:

```bash
# In Cloudflare Pages dashboard → Settings → Environment variables:
VITE_API_URL=https://api.forgecomply360.com

# Or deploy via CLI:
cd frontend
VITE_API_URL=https://api.forgecomply360.com npm run build
npx wrangler pages deploy dist --project-name=forgecomply360 --branch=main
```

### Step 4: Cloudflare WAF Rules

Create these WAF custom rules in the Cloudflare dashboard:

| Rule | Expression | Action |
|------|-----------|--------|
| Block non-API paths | `http.host eq "api.forgecomply360.com" and not starts_with(http.request.uri.path, "/api/") and not http.request.uri.path eq "/health"` | Block |
| Rate limit auth | `http.host eq "api.forgecomply360.com" and starts_with(http.request.uri.path, "/api/v1/auth/")` | Rate limit: 20 req/min |
| Rate limit API | `http.host eq "api.forgecomply360.com" and starts_with(http.request.uri.path, "/api/")` | Rate limit: 300 req/min |
| Block bad bots | `cf.bot_management.score lt 30` | Challenge |

### Step 5: Cloudflare Access (Optional but Recommended)

Protect admin endpoints with Cloudflare Zero Trust Access:

```
Application: ForgeComply Admin
Domain: api.forgecomply360.com/api/v1/admin/*
Policy: Allow only users with @forgecyberdefense.com emails
Auth method: One-time PIN via email
```

### Step 6: Cache Rules

Configure caching for static API responses:

| Path | Cache TTL | Reason |
|------|-----------|--------|
| `/api/v1/frameworks` | 1 hour | Framework catalog rarely changes |
| `/api/v1/controls?framework=*` | 1 hour | Control catalog is static reference data |
| `/api/v1/experience` | 5 minutes | Experience configs change infrequently |
| `/api/v1/crosswalks` | 1 hour | Crosswalk mappings are reference data |
| Everything else | No cache | Dynamic, user-specific data |

---

## Networking & Security

### Network Architecture

```
Internet
    │
    ▼
┌─────────────────────┐
│   Cloudflare Edge    │  ← TLS termination, WAF, DDoS protection
│   (Anycast network)  │
└────────┬────────────┘
         │ Encrypted Cloudflare Tunnel (QUIC/HTTP2)
         │ (No ports exposed on Hetzner server)
         │
┌────────▼────────────┐
│  cloudflared agent   │  ← Runs inside Docker on Hetzner
│  (outbound only)     │
└────────┬────────────┘
         │ Internal Docker network
         │
┌────────▼────────────────────────────────────────┐
│  Docker bridge network (172.28.0.0/16)           │
│  ┌─────────┐ ┌─────────┐ ┌──────┐ ┌──────────┐ │
│  │   API   │ │  Postgres│ │Redis │ │  MinIO   │ │
│  │ :8443   │ │  :5432   │ │:6379 │ │  :9000   │ │
│  └─────────┘ └─────────┘ └──────┘ └──────────┘ │
└──────────────────────────────────────────────────┘
```

**Key security properties:**

1. **No public ports** — The Hetzner server exposes zero ports to the internet (except SSH). All traffic routes through Cloudflare Tunnel (outbound-only connection).
2. **End-to-end encryption** — Cloudflare terminates external TLS, tunnel uses encrypted QUIC, and internal services communicate over the isolated Docker network.
3. **WAF protection** — All requests pass through Cloudflare WAF before reaching the origin.
4. **IP hiding** — The Hetzner server's real IP is never exposed to the public internet.

### Hetzner Firewall Rules

```bash
# Using Hetzner Cloud Firewall (recommended over UFW for cloud VMs)
hcloud firewall create --name forgecomply-fw

# Only allow SSH from your admin IP
hcloud firewall add-rule forgecomply-fw \
  --direction in --protocol tcp --port 22 \
  --source-ips <YOUR_ADMIN_IP>/32

# Block everything else inbound (cloudflared uses outbound connections)
# No additional inbound rules needed!

# Apply to server
hcloud firewall apply-to-resource forgecomply-fw \
  --type server --server forgecomply-prod
```

### TLS Configuration

| Segment | TLS Provider | Certificate |
|---------|-------------|-------------|
| Browser → Cloudflare | Cloudflare Edge | Free Universal SSL (managed) |
| Cloudflare → Hetzner | Cloudflare Tunnel | Automatic (QUIC tunnel encryption) |
| Internal services | Not needed | Docker network is isolated |

Set Cloudflare SSL/TLS mode to **Full (Strict)** if you install an origin certificate, or **Full** if using self-signed certs on the origin.

---

## CI/CD Pipeline

### GitHub Actions Workflow

Update `.github/workflows/deploy.yml` to handle the hybrid deployment:

```yaml
name: Deploy ForgeComply 360 (Hybrid)

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

  deploy-frontend:
    name: Deploy Frontend (Cloudflare Pages)
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run build
        env:
          VITE_API_URL: https://api.forgecomply360.com
      - run: npx wrangler pages deploy frontend/dist --project-name=forgecomply360 --branch=main
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

  deploy-api:
    name: Deploy API (Hetzner)
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Hetzner via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.HETZNER_HOST }}
          username: forgecomply
          key: ${{ secrets.HETZNER_SSH_KEY }}
          script: |
            cd ~/ForgeComply360
            git pull origin main
            docker compose -f docker/docker-compose.hetzner.yml pull
            docker compose -f docker/docker-compose.hetzner.yml up -d --build api
            # Wait for health check
            sleep 10
            curl -sf http://localhost:8443/health || exit 1
            echo "API deployment successful"

  migrate-db:
    name: Run Database Migrations
    runs-on: ubuntu-latest
    needs: deploy-api
    steps:
      - uses: actions/checkout@v4

      - name: Run migrations via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.HETZNER_HOST }}
          username: forgecomply
          key: ${{ secrets.HETZNER_SSH_KEY }}
          script: |
            cd ~/ForgeComply360
            # Run PostgreSQL migrations
            docker compose -f docker/docker-compose.hetzner.yml exec -T postgres \
              psql -U forgecomply -d forgecomply -f /migrations/schema.sql
            echo "Migrations complete"
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token (Pages deploy) |
| `HETZNER_HOST` | Hetzner server IP or hostname |
| `HETZNER_SSH_KEY` | SSH private key for deployment user |

---

## Monitoring & Observability

### Prometheus + Grafana Stack

Add to `docker-compose.hetzner.yml`:

```yaml
  prometheus:
    image: prom/prometheus:latest
    container_name: forgecomply-prometheus
    restart: unless-stopped
    volumes:
      - ./config/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    networks:
      - forgecomply-net
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=90d'
    deploy:
      resources:
        limits:
          memory: 512M

  grafana:
    image: grafana/grafana:latest
    container_name: forgecomply-grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_ROOT_URL=https://monitoring.forgecomply360.com
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - forgecomply-net
    deploy:
      resources:
        limits:
          memory: 256M
```

### Key Metrics to Monitor

| Metric | Source | Alert Threshold |
|--------|--------|----------------|
| API response time (p99) | Node.js | > 2s |
| API error rate | Node.js | > 1% |
| PostgreSQL connections | pg_exporter | > 80% max |
| PostgreSQL replication lag | pg_exporter | > 10s |
| Redis memory usage | Redis INFO | > 80% maxmemory |
| Disk usage | node_exporter | > 85% |
| MinIO storage | MinIO metrics | > 90% capacity |
| Ollama inference latency | Custom | > 30s |
| Cloudflare Tunnel status | cloudflared | Disconnected |
| SSL certificate expiry | Cloudflare | < 14 days |

### Health Check Endpoint

The existing `/health` endpoint should be extended to check all dependencies:

```
GET /health → 200 OK
{
  "status": "healthy",
  "version": "5.0.0",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "minio": "ok",
    "ollama": "ok"
  }
}
```

---

## Backup & Disaster Recovery

### Automated Backup Schedule

| What | Frequency | Retention | Method |
|------|-----------|-----------|--------|
| PostgreSQL full dump | Daily at 2 AM UTC | 30 days | pg_dump → gzip → local + offsite |
| PostgreSQL WAL archives | Continuous | 7 days | pg_basebackup for PITR |
| MinIO evidence files | Daily incremental | 90 days | mc mirror to backup volume |
| Redis RDB snapshot | Hourly | 24 hours | Automatic (appendonly + RDB) |
| Full system snapshot | Weekly | 4 weeks | Hetzner snapshot API |

### Backup Script

```bash
#!/bin/bash
# scripts/backup-hetzner.sh
set -euo pipefail

BACKUP_DIR="/backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# 1. PostgreSQL
echo "Backing up PostgreSQL..."
docker compose -f docker/docker-compose.hetzner.yml exec -T postgres \
  pg_dump -U forgecomply -Fc forgecomply > "$BACKUP_DIR/postgres.dump"

# 2. MinIO evidence files
echo "Syncing evidence vault..."
docker compose -f docker/docker-compose.hetzner.yml exec -T minio \
  mc mirror --overwrite /data "$BACKUP_DIR/evidence/"

# 3. Compress
echo "Compressing backup..."
tar czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

# 4. Upload to offsite storage (Hetzner Storage Box or Cloudflare R2)
# rclone copy "$BACKUP_DIR.tar.gz" r2:forge-backups/

# 5. Cleanup old backups
find /backups -name "*.tar.gz" -mtime +30 -delete

echo "Backup complete: $BACKUP_DIR.tar.gz"
```

### Disaster Recovery Plan

| Scenario | RTO | RPO | Procedure |
|----------|-----|-----|-----------|
| API container crash | < 1 min | 0 | Docker auto-restart |
| Server failure | < 30 min | < 24 hours | Restore from Hetzner snapshot + latest backup |
| Database corruption | < 1 hour | < 1 hour | Restore from pg_dump or WAL PITR |
| Full data center loss | < 4 hours | < 24 hours | Spin up new Hetzner server in different DC, restore backups |

---

## Cost Estimates

### Hybrid (Cloudflare + Hetzner) vs. Pure Cloudflare

| Component | Pure Cloudflare | Hybrid (CF + Hetzner) |
|-----------|----------------|----------------------|
| Frontend hosting | Pages: Free | Pages: Free |
| API compute | Workers: $5-25/mo | Hetzner CPX41: €15.90/mo |
| Database | D1: $5-25/mo | PostgreSQL (included) |
| Cache/KV | KV: $5/mo | Redis (included) |
| Object storage | R2: $0.015/GB/mo | MinIO (block storage): €0.0476/GB/mo |
| AI inference | Workers AI: $0.01-0.10/req | Ollama (included) |
| DDoS/WAF | Free tier | Free tier |
| DNS | Free | Free |
| Tunnel | Free | Free |
| **Total (50 users, 100GB evidence)** | **~$50-100/mo** | **~€45/mo (~$49)** |
| **Total (500 users, 1TB evidence)** | **~$200-500/mo** | **~€120/mo (~$131)** |

### Cost Advantages of Hybrid

- **No egress fees**: Hetzner has 20 TB included traffic
- **Predictable pricing**: Fixed monthly cost regardless of request volume
- **AI at zero marginal cost**: Ollama runs unlimited inferences
- **Storage is cheap**: Hetzner block storage at €0.0476/GB vs R2 at $0.015/GB (but no request fees)

---

## Migration Path from Pure Cloudflare

If you are currently running on the pure Cloudflare stack (Workers + D1 + R2 + KV), follow these steps to migrate:

### Phase 1: Set Up Hetzner Infrastructure (Day 1-2)

1. Provision Hetzner server
2. Install Docker and deploy `docker-compose.hetzner.yml`
3. Set up Cloudflare Tunnel
4. Verify API is accessible via tunnel

### Phase 2: Data Migration (Day 2-3)

```bash
# Export D1 database to SQL
npx wrangler d1 export forge-comply360-db --remote --output=d1-export.sql

# Convert SQLite → PostgreSQL (adjust data types)
# Key differences: datetime → timestamptz, integer booleans → boolean
# Use pgloader or manual conversion script

# Import to PostgreSQL on Hetzner
psql -h <hetzner-ip> -U forgecomply -d forgecomply < d1-export-pg.sql

# Sync R2 evidence files to MinIO
# Use rclone with R2 + S3 providers configured
rclone sync r2:forge-evidence minio:forge-evidence
```

### Phase 3: DNS Cutover (Day 3)

1. Update Cloudflare DNS: point `api.forgecomply360.com` to tunnel
2. Update Cloudflare Pages env: `VITE_API_URL=https://api.forgecomply360.com`
3. Rebuild and deploy frontend
4. Monitor error rates for 24 hours

### Phase 4: Decommission Old Stack (Day 7)

1. Verify all data is consistent
2. Remove old Workers deployment
3. Keep D1/R2 as read-only backup for 30 days
4. Delete after verification period

---

## Quick Start Summary

```bash
# 1. Provision Hetzner server (CPX41 recommended)
# 2. SSH in and set up Docker

# 3. Clone repo
git clone https://github.com/Bjay0727-jay/ForgeComply360.git
cd ForgeComply360

# 4. Configure secrets
cp docker/.env.hetzner.example docker/.env.hetzner
# Edit docker/.env.hetzner with generated secrets

# 5. Start all services
docker compose -f docker/docker-compose.hetzner.yml up -d

# 6. Pull AI model
docker exec forgecomply-ollama ollama pull llama3.1:8b

# 7. Create Cloudflare Tunnel (on your local machine)
cloudflared tunnel create forgecomply-hetzner
cloudflared tunnel route dns forgecomply-hetzner api.forgecomply360.com
# Copy tunnel token to docker/.env.hetzner

# 8. Restart tunnel container
docker compose -f docker/docker-compose.hetzner.yml restart cloudflared

# 9. Deploy frontend to Cloudflare Pages
cd frontend
VITE_API_URL=https://api.forgecomply360.com npm run build
npx wrangler pages deploy dist --project-name=forgecomply360 --branch=main

# 10. Verify
curl https://api.forgecomply360.com/health
# → {"status":"healthy"}
```

---

*Document maintained by Forge Cyber Defense Engineering Team*
