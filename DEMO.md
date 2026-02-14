# ForgeComply 360 - Demo Environment Guide

## Quick Access

| Resource | URL |
|----------|-----|
| **Demo Frontend** | https://demo.forgecomply360.pages.dev |
| **Demo API** | https://forge-comply360-api-demo.stanley-riley.workers.dev |

---

## Login Credentials

All demo accounts use the password: **`Demo123!`**

| Name | Email | Role | Use Case |
|------|-------|------|----------|
| Sarah Mitchell | sarah.mitchell@forgefederal.com | Owner | CISO, executive dashboards, full access |
| James Chen | james.chen@forgefederal.com | Admin | System administration, user management |
| Maria Rodriguez | maria.rodriguez@forgefederal.com | Manager | Compliance management, approvals |
| David Kim | david.kim@forgefederal.com | Analyst | Day-to-day compliance work |
| Emily Watson | emily.watson@forgefederal.com | Viewer | Auditor liaison, read-only access |

---

## Demo Scenario: Forge Federal Solutions, Inc.

A government contractor managing compliance for 3 information systems across NIST 800-53 and CMMC Level 2 frameworks.

### Organization Profile
- **Company**: Forge Federal Solutions, Inc.
- **Industry**: Defense & Aerospace
- **Experience Type**: Federal
- **Subscription**: Enterprise (all features enabled)

### Information Systems

| System | Acronym | Impact Level | Status | Notes |
|--------|---------|--------------|--------|-------|
| Enterprise Mission Platform | EMP | High | Authorized | ATO expiring in ~45 days |
| Cloud Data Analytics | CDA | Moderate | Authorized | Full year authorization |
| Development Sandbox | DEV-SBX | Low | Under Review | In assessment phase |

---

## Demo Data Summary

| Category | Count | Key Highlights |
|----------|-------|----------------|
| **Users** | 5 | All roles represented (owner, admin, manager, analyst, viewer) |
| **Systems** | 3 | High/Moderate/Low impact levels |
| **Control Implementations** | 47 | Mixed statuses across NIST 800-53 |
| **Evidence Records** | 40 | Includes expired and expiring items |
| **POA&Ms** | 20 | Open, in-progress, overdue items |
| **Risks** | 25 | Critical, High, Moderate, Low levels |
| **Vendors** | 15 | Various criticality tiers |
| **Policies** | 10 | With attestation tracking |
| **Assets** | 30 | Servers, workstations, cloud resources |
| **Monitoring Checks** | 20 | Automated compliance checks |

---

## Dashboard Alerts (Pre-configured)

The demo data is structured to trigger these dashboard alerts:

| Alert Type | Count | Demo Value |
|------------|-------|------------|
| ATO Expiring Soon | 1 | EMP system authorization expiring |
| Evidence Expired | 3 | Shows compliance gaps |
| Evidence Expiring Soon | 10+ | Renewal workflow demo |
| POA&Ms Overdue | 5+ | Urgency indicators |
| Risks Requiring Treatment | 4+ | Risk management demo |
| Vendor Assessments Due | 3 | Third-party risk |

---

## Feature Walkthrough

### 1. Dashboard
- View compliance score and health metrics
- Review actionable recommendations
- See system-level compliance breakdown

### 2. Controls & Compliance
- Browse NIST 800-53 Rev 5 controls
- View implementation status by system
- See evidence linked to controls

### 3. POA&M Management
- View open, in-progress, and completed POA&Ms
- Check milestones and comments
- Review overdue items highlighted in red

### 4. Evidence Management
- Upload and manage compliance evidence
- View expiry tracking and alerts
- Link evidence to controls

### 5. Risk Register
- View risk heat map
- Review treatment plans
- Track risk mitigation progress

### 6. Vendor Management
- Third-party risk assessments
- Contract tracking
- Assessment scheduling

### 7. Policy Management
- Policy document library
- Attestation tracking
- Review cycle management

### 8. Asset Inventory
- Server and workstation tracking
- Vulnerability scan results
- Risk scoring by asset

### 9. Continuous Monitoring
- Automated compliance checks
- Pass/fail/warning status
- Trend analysis

---

## Resetting Demo Data

If you need to reset the demo environment to its initial state:

```bash
# 1. Clear existing data and re-apply schema
npm run db:migrate:demo

# 2. Load seed data (frameworks, templates)
npm run db:seed:demo

# 3. Add missing tables (assets, vulnerability_findings, etc.)
npm run db:demo-tables

# 4. Load comprehensive demo data
npm run db:demo-data
```

**Note**: You may also need to re-add the `status` column to users:
```bash
npx wrangler d1 execute forge-comply360-db-demo --remote --command="ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active';"
```

---

## Environment Configuration

### Cloudflare Resources (Demo)

| Resource | Name/ID |
|----------|---------|
| Worker | forge-comply360-api-demo |
| D1 Database | forge-comply360-db-demo |
| KV Namespace | forge-comply360-kv-demo |
| R2 Bucket (Evidence) | forge-evidence-demo |
| R2 Bucket (Backups) | forge-comply360-backups-demo |

### Required Secrets

The demo worker requires these secrets (already configured):
- `JWT_SECRET` - For authentication tokens

---

## Troubleshooting

### "Internal server error" on login
- Check that `JWT_SECRET` is set: `npx wrangler secret list --env demo`
- If missing: `echo "your-secret-key-here" | npx wrangler secret put JWT_SECRET --env demo`

### "Session expired" message
- Password hashes may be incorrect format
- Re-run `npm run db:demo-data` to reset user credentials

### Missing data in certain sections
- Some tables may be missing from schema
- Run `npm run db:demo-tables` to add missing tables

---

## Support

For issues with the demo environment:
- Check Cloudflare Workers logs: `npx wrangler tail forge-comply360-api-demo`
- Query demo database: `npx wrangler d1 execute forge-comply360-db-demo --remote --command="YOUR SQL"`

---

*Forge Cyber Defense - Service-Disabled Veteran-Owned Small Business (SDVOSB)*
