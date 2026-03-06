# ForgeComply 360 — Database Migrations

Production database: `forge-production` (`fe250bed-40a9-443a-a6c7-4b59bf8a0dac`)

## Migration Files

Run in order. Each migration is idempotent (uses `IF NOT EXISTS` / `INSERT OR IGNORE`).

| File | Description | Records |
|------|-------------|---------|
| `0001_initial_schema.sql` | Complete schema — 27 tables, 31 indexes | — |
| `0002_seed_frameworks.sql` | Compliance frameworks (NIST, FedRAMP, CMMC, HIPAA, SOC 2, StateRAMP) | 10 |
| `0003_seed_nist_800_53_controls.sql` | NIST 800-53 Rev 5 control library with FedRAMP baseline flags | 1,035 |
| `0004_seed_forge_production.sql` | Forge Cyber Defense org, team users, and 3 systems (FC360, FSOC, FROS) | 8 |
| `0005_seed_fc360_implementations.sql` | FC360 FedRAMP Moderate control implementations | 336 |

## FedRAMP Baseline Counts

| Baseline | Controls |
|----------|----------|
| Low | 166 |
| Moderate | 334 |
| High | 599 |

## Running Against D1

D1 only accepts **single SQL statements** per API call. For migration files with multiple statements:

```bash
# Using wrangler
npx wrangler d1 execute forge-production --file=migrations/0001_initial_schema.sql

# Or via API (single statement at a time)
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{account_id}/d1/database/{database_id}/query" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"sql": "..."}'
```

**Important:** `0003_seed_nist_800_53_controls.sql` contains multi-row INSERT statements (100 rows each) and one large UPDATE. Each statement must be executed separately. The file uses semicolons as delimiters between statements.

## Control Generator Script

`scripts/build_controls.js` is the source-of-truth generator for the NIST 800-53 Rev 5 control library. It contains:

- All 20 control families with base controls and enhancements
- Official FedRAMP Low, Moderate, and High baseline mappings
- Generates SQL INSERT batch files

```bash
node scripts/build_controls.js
```

## Schema Notes

- **scan_imports** + vulnerability_findings/assets extensions support Nessus, Qualys, and Rapid7 scanner integration
- **control_definitions** uses `UNIQUE(framework_id, control_id)` — safe for re-runs
- **control_implementations** uses `UNIQUE(system_id, control_definition_id)` — one implementation per control per system
- FC360 responsibility model: `inherited` (Cloudflare PE/MP), `shared` (AU/CM/CP/IR/MA/SC/SI), `provider` (everything else)

## Production State After All Migrations

```
organizations:            1  (Forge Cyber Defense)
users:                    4  (owner + admin + analyst + auditor)
systems:                  3  (FC360 Moderate, FSOC Moderate, FROS High)
compliance_frameworks:   10
control_definitions:  1,035  (NIST 800-53 Rev 5)
control_implementations: 336  (FC360 FedRAMP Moderate)
scan_imports:             0  (ready for customer scans)
poams:                    0  (clean)
assets:                   0  (clean)
vulnerability_findings:   0  (clean)
```
