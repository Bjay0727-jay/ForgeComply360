# ForgeComply 360 — Cloudflare Deployment Verification

**Date**: 2026-03-06
**Account**: Stanley.riley@forgecyberdefense.com (`a819beba814a038e048a4b39dad86c63`)

## D1 Database: `forge-production`

**UUID**: `fe250bed-40a9-443a-a6c7-4b59bf8a0dac`
**Size**: 1,040,384 bytes

| Resource                | Expected | Actual | Status |
|-------------------------|----------|--------|--------|
| Tables                  | 27       | 27     | PASS   |
| Indexes                 | 31       | 31     | PASS   |
| Organizations           | 1        | 1      | PASS   |
| Users                   | 4        | 4      | PASS   |
| Systems                 | 3        | 3      | PASS   |
| Compliance Frameworks   | 10       | 10     | PASS   |
| Control Definitions     | 1,035    | 1,035  | PASS   |
| Control Implementations | 336      | 336    | PASS   |
| Scan Imports            | 0        | 0      | PASS   |
| POAMs                   | 0        | 0      | PASS   |
| Assets                  | 0        | 0      | PASS   |
| Vulnerability Findings  | 0        | 0      | PASS   |

### FedRAMP Baseline Counts (from control_definitions)

| Baseline | Actual |
|----------|--------|
| Low      | 166    |
| Moderate | 336    |
| High     | 607    |

### Organization
- Forge Cyber Defense

### Users
| Email | Role |
|-------|------|
| stanley.riley@forgecyberdefense.com | owner |
| admin@forgecyberdefense.com | admin |
| analyst@forgecyberdefense.com | analyst |
| auditor@forgecyberdefense.com | analyst |

### Systems
| Name | Impact Level |
|------|-------------|
| ForgeComply 360 Platform | moderate |
| ForgeSOC Security Operations | moderate |
| ForgeRedOps Offensive Security | high |

### Compliance Frameworks (10)
1. NIST Special Publication 800-53 Revision 5
2. FedRAMP High Baseline
3. FedRAMP Moderate Baseline
4. FedRAMP Low Baseline
5. Cybersecurity Maturity Model Certification Level 2
6. Cybersecurity Maturity Model Certification Level 3
7. NIST Special Publication 800-171
8. StateRAMP Security Framework
9. SOC 2 Trust Services Criteria
10. HIPAA Security Rule

## Workers

| Worker | Status | Last Modified |
|--------|--------|---------------|
| forge-comply360-api | Deployed | 2026-03-06 |
| forge-comply360-api-demo | Deployed | 2026-03-06 |

## KV Namespaces

| Namespace | ID |
|-----------|----|
| forge-comply360-kv | a3323bb1cfa14271a286170864082869 |
| forge-comply360-api-forge-comply360-kv-demo | b114779cb4864349b611010bc7056cd7 |

## R2 Buckets

| Bucket | Created |
|--------|---------|
| forge-comply360-backups | 2026-02-08 |
| forge-comply360-backups-demo | 2026-02-12 |
| forge-evidence | 2026-01-23 |
| forge-evidence-demo | 2026-02-12 |

## Result

All 5 database migrations verified. All infrastructure (Workers, KV, R2, D1) confirmed deployed and operational.
