# ForgeComply 360 - Backup & Restore Guide

## Overview

ForgeComply 360 includes comprehensive backup capabilities to protect your compliance data:

- **Automated Daily Backups**: Runs at 2 AM UTC via Cloudflare CRON
- **Manual Backups**: Trigger via API or local scripts
- **30-Day Retention**: Automatic cleanup of backups older than 30 days

## What Gets Backed Up

| Component | Description |
|-----------|-------------|
| D1 Database | All 35+ tables including organizations, users, systems, controls, evidence, POA&Ms, risks, vendors, policies |
| R2 Evidence | Manifest of all files in the evidence vault (files are copied to backup bucket) |

## Backup Storage

Backups are stored in a separate R2 bucket: `forge-comply360-backups`

Each backup includes:
- `manifest.json` - Backup metadata and table list
- `db_[tablename].json` - JSON export of each database table
- Evidence file copies (for automated backups)

## Automated Backups

Automated backups run daily at 2 AM UTC via Cloudflare scheduled triggers.

### What Happens During Automated Backup

1. Creates timestamped backup ID (e.g., `backup_2024-12-15T02:00:00.000Z`)
2. Exports all database tables to JSON
3. Copies all evidence files from `forge-evidence` to `forge-comply360-backups`
4. Creates manifest with metadata
5. Cleans up backups older than 30 days

### Monitoring Automated Backups

Check Cloudflare Workers logs for backup execution:
```bash
npx wrangler tail --env production
```

## Manual Backups

### Via API (Requires Admin Role)

**Trigger Backup:**
```bash
curl -X POST https://forge-comply360-api.stanley-riley.workers.dev/api/v1/backups \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json"
```

**List Backups:**
```bash
curl https://forge-comply360-api.stanley-riley.workers.dev/api/v1/backups \
  -H "Authorization: Bearer <your-token>"
```

**Get Backup Details:**
```bash
curl https://forge-comply360-api.stanley-riley.workers.dev/api/v1/backups/<backup-id> \
  -H "Authorization: Bearer <your-token>"
```

### Via Local Script

```bash
# Run from project root
./scripts/backup.sh
```

This creates a local backup archive in `./backups/` directory.

## Restore

### Via API (Requires Owner Role)

**Restore from Backup:**
```bash
curl -X POST https://forge-comply360-api.stanley-riley.workers.dev/api/v1/backups/<backup-id>/restore \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"confirm": true}'
```

> **Warning**: Restore operations will overwrite existing data!

### Via Local Script

```bash
# List available local backups
./scripts/restore.sh

# Restore specific backup
./scripts/restore.sh ./backups/forge_backup_20241215_020000.tar.gz
```

## API Endpoints

| Endpoint | Method | Role Required | Description |
|----------|--------|---------------|-------------|
| `/api/v1/backups` | GET | admin | List all backups |
| `/api/v1/backups` | POST | admin | Trigger manual backup |
| `/api/v1/backups/:id` | GET | admin | Get backup details |
| `/api/v1/backups/:id` | DELETE | owner | Delete a backup |
| `/api/v1/backups/:id/restore` | POST | owner | Restore from backup |

## Backup Retention

- Automated cleanup runs during each scheduled backup
- Backups older than 30 days are automatically deleted
- Manual deletion available via API for owner role

## Best Practices

1. **Test Restores Regularly**: Periodically verify backups work by restoring to a test environment
2. **Monitor Backup Jobs**: Check Cloudflare Workers logs for backup success/failure
3. **Pre-Migration Backups**: Always trigger a manual backup before major changes
4. **Offsite Copies**: Download critical backups locally for additional protection

## Troubleshooting

### Backup Failed

1. Check Cloudflare Workers logs: `npx wrangler tail --env production`
2. Verify R2 bucket exists: `npx wrangler r2 bucket list`
3. Check D1 database connection: `npx wrangler d1 info forge-comply360-db`

### Restore Failed

1. Ensure backup exists: List backups via API
2. Check user has owner role
3. Verify `confirm: true` is included in request body
4. Review logs for specific table errors

### Missing Backup Bucket

Create the backup bucket:
```bash
npx wrangler r2 bucket create forge-comply360-backups
```

## Database Tables Backed Up

**Core Tables:**
- organizations, users, refresh_tokens
- systems, control_implementations
- evidence, evidence_control_links, evidence_schedules
- poams, poam_milestones, poam_comments, poam_affected_assets
- risks, vendors, policies, policy_attestations
- ssp_documents, audit_logs

**Reference Data:**
- compliance_frameworks, security_controls, control_crosswalks
- vulnerability_control_mappings

**Additional Tables:**
- assets, asset_vulnerabilities, vulnerability_scan_results
- notifications, notification_preferences
- continuous_monitoring_results, authorization_packages
- ato_submissions, ato_correspondence
- system_users, ports_protocols
