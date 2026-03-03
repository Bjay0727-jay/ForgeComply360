# Sample Vulnerability Scan Files

These files are for testing the ForgeComply 360 Scan Import feature. Upload them via **SOC > Scan Import** in the platform.

## Files

| File | Scanner | Customer | Target System | Findings |
|------|---------|----------|---------------|----------|
| `esfs-fcms-nessus-scan.nessus` | Nessus | Eagle Shield Federal Services | FCMS | 24 (2C, 4H, 8M, 10L) |
| `esfs-fcms-tenable-export.csv` | Tenable.io | Eagle Shield Federal Services | FCMS | 20 (1C, 3H, 7M, 9L) |
| `phs-mfehr-nessus-scan.nessus` | Nessus | Patriot Health Systems | MFEHR | 18 (2C, 5H, 6M, 5L) |

## How to Import

1. Log in to ForgeComply 360
2. Navigate to **SOC > Scan Import**
3. Click **Import Scan**
4. Select the target system
5. Upload the file
6. Enable **Auto-create assets** and **Auto-map NIST controls**
7. Click **Upload & Process**

See `docs/SAMPLE-CUSTOMER-DATA-GUIDE.md` for full details.
