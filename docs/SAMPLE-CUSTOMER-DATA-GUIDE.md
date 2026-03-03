# ForgeComply 360 - Sample Customer Dataset Guide

## Purpose

This document provides two comprehensive sample customer datasets for ForgeComply 360 platform demonstrations and Forge Reporter testing. Each scenario simulates a realistic compliance lifecycle that can be manually entered into the system to demonstrate actual workflows.

**Two Scenarios:**

| # | Customer | Scenario | Experience Type | Key Frameworks |
|---|----------|----------|----------------|----------------|
| 1 | Patriot Health Systems (PHS) | **FISMA ATO** - Full RMF lifecycle from Categorize through Authorization | Healthcare | FedRAMP Moderate, HIPAA, CMMC L2 |
| 2 | Eagle Shield Federal Services (ESFS) | **Existing ATO** - Authorized system needing continuous monitoring documents & ATO renewal | Federal | NIST 800-53 Rev 5, FISMA, CMMC L2 |

**Data Entry Methods:**

| Data Type | Entry Method | Notes |
|-----------|-------------|-------|
| Organizations, Users, Systems | Manual entry | Simulates onboarding workflow |
| Controls, Frameworks | Pre-seeded | Already in platform via seed.sql |
| Control Implementations | Manual entry | Core compliance documentation work |
| Evidence | Manual upload | Upload sample PDFs/screenshots |
| POA&Ms | Manual entry | Creates realistic remediation tracking |
| Risks, Vendors, Policies | Manual entry | Populates dashboards |
| **Nessus Vulnerability Scans** | **Automated import** | Upload .nessus XML via Scan Import |
| **Tenable Vulnerability Scans** | **Automated import** | Upload CSV via Scan Import |
| Assets | Auto-created from scan import | Or manual entry for non-scanned assets |

---

## Scenario 1: Healthcare Customer - FISMA ATO Process

### Patriot Health Systems (PHS)

> **Scenario:** Defense health contractor pursuing FedRAMP Moderate ATO for a VA electronic health records system. Currently in the RMF "Implement" and "Assess" steps. The system has NOT yet received its Authorization to Operate.

### 1.1 Organization Profile

| Field | Value |
|-------|-------|
| **Organization Name** | Patriot Health Systems |
| **Industry** | Defense Health |
| **Size** | 340 employees |
| **Experience Type** | Healthcare |
| **Subscription Tier** | Enterprise |
| **CAGE Code** | 8ABC1 |
| **DUNS** | 078451234 |
| **NAICS** | 541512 (Computer Systems Design) |
| **Annual Revenue** | $42M |
| **HQ Location** | San Antonio, TX |
| **Clearance Level** | Secret |
| **Domain** | patriothealth.com |

### 1.2 Users (8 Accounts)

All demo accounts use password: **`ForgeDemo2026!`**

| Name | Email | Role | Function |
|------|-------|------|----------|
| Marcus Chen | marcus.chen@patriothealth.com | Admin | CISO / System Owner (MFEHR) |
| Sarah Rodriguez | sarah.rodriguez@patriothealth.com | Admin | ISSO (MFEHR) |
| James Okonkwo | james.okonkwo@patriothealth.com | Analyst | Compliance Analyst / ISSO (HOAP) |
| Lisa Nakamura | lisa.nakamura@patriothealth.com | Analyst | ISSO (SCPP) |
| David Washington | david.washington@patriothealth.com | Analyst | Security Engineer / SOC Analyst |
| Emily Patel | emily.patel@patriothealth.com | Admin | System Owner (HOAP) |
| Robert Kim | robert.kim@patriothealth.com | Analyst | Junior Security Analyst |
| Demo Admin | demo@patriothealth.com | Admin | Demo access account |

### 1.3 Information Systems (3 Systems)

| System Name | Acronym | Impact Level | Status | ATO Status | Description |
|-------------|---------|-------------|--------|------------|-------------|
| MedForge Electronic Health Records | MFEHR | Moderate | Under Review | **Pursuing ATO** | Cloud-hosted EHR serving 14 VA facilities, 2.3M veteran patients. AWS GovCloud. Processes PHI/CUI. |
| SecureComm Patient Portal | SCPP | Moderate | Under Review | **Pursuing ATO** | Patient-facing web/mobile portal for record access, messaging, telehealth. VA.gov ID.me integration. |
| HealthOps Analytics Platform | HOAP | Low | Authorized | **Has ATO** (exp. Nov 2026) | Internal analytics/BI platform. De-identified health data only. Dedicated VPC, no internet access. |

### 1.4 Assets (22 Assets)

**MFEHR System Assets (10):**

| Hostname | IP Address | Type | OS | Risk Score | Notes |
|----------|-----------|------|-----|------------|-------|
| mfehr-web-01 | 10.100.1.10 | Server | Linux | 35 | NGINX web server |
| mfehr-web-02 | 10.100.1.11 | Server | Linux | 35 | NGINX web server (HA pair) |
| mfehr-api-01 | 10.100.2.10 | Server | Linux | 72 | Node.js API server |
| mfehr-api-02 | 10.100.2.11 | Server | Linux | 45 | Node.js API server (HA pair) |
| mfehr-db-primary | 10.100.3.10 | Database | Linux | 92 | PostgreSQL primary (PHI) |
| mfehr-db-replica | 10.100.3.11 | Database | Linux | 55 | PostgreSQL read replica |
| mfehr-cache-01 | 10.100.4.10 | Server | Linux | 40 | ElastiCache Redis |
| mfehr-lb-ext | 10.100.0.10 | Network Device | Linux | 28 | AWS ALB |
| mfehr-waf | 10.100.0.5 | Network Device | - | 15 | AWS WAF |
| mfehr-esb-mulesoft | 10.100.5.10 | Application | Linux | 65 | MuleSoft ESB integration |

**SCPP System Assets (6):**

| Hostname | IP Address | Type | OS | Risk Score |
|----------|-----------|------|-----|------------|
| scpp-frontend | - | Application | - | 30 |
| scpp-api-01 | 10.100.6.10 | Server | Linux | 48 |
| scpp-api-02 | 10.100.6.11 | Server | Linux | 48 |
| scpp-auth-idme | 10.100.7.10 | Application | - | 20 |
| scpp-mobile-ios | - | Application | iOS | 25 |
| scpp-mobile-android | - | Application | Android | 25 |

**HOAP System Assets (3):**

| Hostname | IP Address | Type | OS | Risk Score |
|----------|-----------|------|-----|------------|
| hoap-etl-01 | 10.100.8.10 | Server | Linux | 15 |
| hoap-warehouse | 10.100.8.20 | Database | Linux | 18 |
| hoap-bi-tableau | 10.100.8.30 | Application | - | 12 |

**Shared Infrastructure (3):**

| Hostname | IP Address | Type | Risk Score |
|----------|-----------|------|------------|
| phs-vpn-gateway | 10.100.0.1 | Network Device | 22 |
| phs-bastion-01 | 10.100.0.50 | Server | 60 |
| phs-siem-splunk | 10.100.9.10 | Application | 18 |

### 1.5 Control Implementations (15 Documented)

Manual entry into ForgeComply 360. These represent the beginning of the SSP documentation effort.

**MFEHR - FedRAMP Moderate Controls:**

| Control ID | Status | Assessment Result | Summary |
|-----------|--------|-------------------|---------|
| AC-1 | Implemented | Satisfied | Access Control Policy PHS-AC-POL-001 v3.2. Annual review completed Jan 2026. |
| AC-2 | Implemented | Satisfied | Okta-based account management. ServiceNow approval workflows. Quarterly reviews. |
| AC-3 | Implemented | Satisfied | AWS IAM + application RBAC (12 roles, 47 permission sets). JWT enforcement. |
| AC-4 | Partially Implemented | Other Than Satisfied | Network-layer flow enforcement complete. **DLP gap** on telehealth module (POAM-PHS-2026-008). |
| AC-5 | Implemented | Satisfied | Separation of duties via RBAC. Developers cannot deploy to production. |
| AC-6 | Planned | Not Assessed | Zero trust architecture update pending per EO 14028. Target Q2 2026. |
| AU-1 | Implemented | Satisfied | Audit Policy PHS-AU-POL-001 v2.4. Annual review Dec 2025. |
| AU-2 | Implemented | Satisfied | Comprehensive audit events: auth, PHI access, config changes, API calls. Splunk + CloudTrail. |
| CM-1 | Implemented | Satisfied | Configuration Management Policy PHS-CM-POL-001 v2.1. ITIL change management via ServiceNow. |
| IR-1 | Implemented | Satisfied | Incident Response Policy PHS-IR-POL-001 v3.0. Tabletop exercise Dec 2025. |

**SCPP - FedRAMP Moderate Controls:**

| Control ID | Status | Assessment Result | Summary |
|-----------|--------|-------------------|---------|
| AC-1 | Implemented | Satisfied | Inherits from PHS organizational policy. Patient-specific procedures in PHS-SCPP-AC-001. |
| AC-2 | Partially Implemented | Other Than Satisfied | Patient accounts via ID.me. **48-hour staff deprovisioning delay** (POAM tracked). |
| AC-3 | Implemented | Satisfied | OAuth 2.0 with PKCE for patients, Okta SAML for staff. Rate limiting enforced. |
| AU-1 | Implemented | Satisfied | Inherits organizational audit policy. Patient portal-specific logging per PHS-SCPP-AU-001. |
| AU-2 | Implemented | Satisfied | All patient interactions logged. Events forwarded to Splunk within 30 seconds. |

### 1.6 POA&Ms (8 Open Items)

| POA&M ID | System | Weakness | Risk Level | Status | Due Date |
|----------|--------|----------|-----------|--------|----------|
| POAM-PHS-2026-001 | MFEHR | Log4j RCE (CVE-2021-44228) | Critical | In Progress | 2026-02-25 |
| POAM-PHS-2026-002 | MFEHR | SQL Injection in Patient Search | Critical | In Progress | 2026-03-03 |
| POAM-PHS-2026-003 | MFEHR | Legacy TLS 1.0/1.1 Enabled | High | Open | 2026-03-01 |
| POAM-PHS-2026-004 | MFEHR | MuleSoft API Auth Bypass | High | In Progress | 2026-03-14 |
| POAM-PHS-2026-005 | MFEHR | Bastion Host Missing Patches | High | Open | 2026-03-07 |
| POAM-PHS-2026-006 | SCPP | Stored XSS in Patient Messaging | High | In Progress | 2026-03-05 |
| POAM-PHS-2026-007 | MFEHR | Incomplete DLP for Telehealth | Moderate | In Progress | 2026-03-31 |
| POAM-PHS-2026-008 | SCPP | Delayed Staff Deprovisioning | Moderate | In Progress | 2026-04-22 |

### 1.7 Vulnerability Findings (18 Findings)

| Severity | Count | Key Findings |
|----------|-------|-------------|
| Critical | 2 | Log4Shell (CVSS 9.8), SQL Injection (CVSS 9.1) |
| High | 5 | TLS 1.0/1.1 (x2), MuleSoft Auth Bypass, Missing Patches, XSS |
| Medium | 6 | Rate limiting, Redis AUTH, Health check info disclosure, CSP, Logging, Splunk UF |
| Low | 5 | Server header disclosure, Missing headers (x2), SSL cert bundle, Session timeout |

### 1.8 SSP Documents

| Document | System | Version | Status | Notes |
|----------|--------|---------|--------|-------|
| MedForge EHR System Security Plan | MFEHR | 1.0-DRAFT | In Review | 15 of 325 controls documented. Target 3PAO submission: April 2026. |
| SecureComm Patient Portal SSP | SCPP | 0.5-DRAFT | Draft | 8 of 325 controls documented. Focus on inherited controls. |

### 1.9 Security Incidents

| Incident | Severity | Status | Summary |
|----------|----------|--------|---------|
| INC-PHS-2026-001 | Medium | Closed | Brute force attack from Tor on admin account. Auto-locked. No compromise. |
| INC-PHS-2026-002 | High | Investigating | Unauthorized API calls from MuleSoft ESB to admin endpoint. Under forensic analysis. |

### 1.10 Active Integrations

| Integration | Type | Status |
|------------|------|--------|
| Splunk SIEM | siem_splunk | Active |
| AWS GovCloud | cloud_aws | Active |
| Okta Identity | identity_okta | Active |
| ServiceNow ITSM | itsm_servicenow | Active |

### 1.11 Penetration Tests (Planned)

| Engagement | Type | Target | Dates | Status |
|-----------|------|--------|-------|--------|
| MFEHR Pre-ATO Pen Test | Web App | sys-phs-001 | Mar 1-14, 2026 | Planned |
| SCPP Mobile Security Assessment | Mobile | sys-phs-002 | Mar 15-28, 2026 | Planned |

---

## Scenario 2: Federal Customer - Existing ATO with Document Requirements

### Eagle Shield Federal Services (ESFS)

> **Scenario:** Federal IT services contractor with an existing ATO that expires in 6 months. The system is authorized and in continuous monitoring, but the organization needs to generate/update required documents for ATO renewal including SSP updates, annual assessment reports, and continuous monitoring deliverables. Also testing vulnerability scan imports for ongoing compliance.

### 2.1 Organization Profile

| Field | Value |
|-------|-------|
| **Organization Name** | Eagle Shield Federal Services |
| **Industry** | Federal IT Services |
| **Size** | 185 employees |
| **Experience Type** | Federal |
| **Subscription Tier** | Federal |
| **CAGE Code** | 7DEF2 |
| **DUNS** | 065823791 |
| **NAICS** | 541519 (Other Computer Related Services) |
| **Annual Revenue** | $28M |
| **HQ Location** | Reston, VA |
| **Clearance Level** | Top Secret |
| **Domain** | eagleshield.gov.contractor |
| **Set-Aside** | SDVOSB |

### 2.2 Users (6 Accounts)

All demo accounts use password: **`ForgeDemo2026!`**

| Name | Email | Role | Function |
|------|-------|------|----------|
| Col. Robert Hayes (Ret.) | robert.hayes@eagleshield.com | Owner | CEO / Authorizing Official |
| Jennifer Walsh | jennifer.walsh@eagleshield.com | Admin | CISO / ISSM |
| Michael Torres | michael.torres@eagleshield.com | Manager | Compliance Manager / ISSO |
| Aisha Johnson | aisha.johnson@eagleshield.com | Analyst | Security Control Assessor |
| Kevin Park | kevin.park@eagleshield.com | Analyst | System Administrator / Vulnerability Analyst |
| Sandra Chen | sandra.chen@eagleshield.com | Viewer | 3PAO Liaison / Auditor |

### 2.3 Information Systems (2 Systems)

| System Name | Acronym | Impact Level | Status | ATO Status | Auth Date | Expiry | Description |
|-------------|---------|-------------|--------|------------|-----------|--------|-------------|
| Federal Case Management System | FCMS | Moderate | Authorized | **Active ATO** | 2023-09-15 | **2026-09-15** | Web-based case management for DHS. Processes CUI/PII for immigration case tracking. Azure Government Cloud. |
| Secure Document Repository | SDR | Low | Authorized | **Active ATO** | 2024-06-01 | 2027-06-01 | Document storage and collaboration for unclassified agency materials. SharePoint-based on Azure Gov. |

### 2.4 Users - Detailed Roles

| User | FCMS Role | SDR Role | Key Responsibilities |
|------|-----------|----------|---------------------|
| Robert Hayes | Authorizing Official | Authorizing Official | Signs ATO letter, reviews risk acceptance |
| Jennifer Walsh | ISSM | ISSM | Oversees security program, reviews SSP, approves POA&Ms |
| Michael Torres | ISSO | ISSO | Day-to-day security ops, control monitoring, evidence collection |
| Aisha Johnson | SCA | SCA | Conducts assessments, writes SAR, reviews control implementations |
| Kevin Park | Sys Admin | Sys Admin | Patching, scanning, system maintenance, vulnerability remediation |
| Sandra Chen | 3PAO Rep | - | Reviews documentation, conducts independent assessment |

### 2.5 Assets (16 Assets)

**FCMS System Assets (12):**

| Hostname | IP Address | Type | OS | Risk Score | Notes |
|----------|-----------|------|-----|------------|-------|
| fcms-web-01 | 10.200.1.10 | Server | Windows Server 2022 | 25 | IIS web server |
| fcms-web-02 | 10.200.1.11 | Server | Windows Server 2022 | 25 | IIS web server (HA) |
| fcms-app-01 | 10.200.2.10 | Server | Windows Server 2022 | 42 | .NET application server |
| fcms-app-02 | 10.200.2.11 | Server | Windows Server 2022 | 42 | .NET application server (HA) |
| fcms-db-primary | 10.200.3.10 | Database | Windows Server 2022 | 38 | SQL Server 2022 primary |
| fcms-db-secondary | 10.200.3.11 | Database | Windows Server 2022 | 30 | SQL Server 2022 Always On secondary |
| fcms-dc-01 | 10.200.4.10 | Server | Windows Server 2022 | 20 | Active Directory Domain Controller |
| fcms-adfs | 10.200.4.20 | Server | Windows Server 2022 | 22 | AD FS for PIV authentication |
| fcms-sccm | 10.200.5.10 | Server | Windows Server 2022 | 18 | SCCM patch management |
| fcms-splunk | 10.200.6.10 | Application | Linux | 15 | Splunk Enterprise (SIEM) |
| fcms-nessus | 10.200.6.20 | Application | Linux | 12 | Tenable Nessus scanner |
| fcms-fw-paloalto | 10.200.0.1 | Network Device | PAN-OS | 10 | Palo Alto PA-3260 firewall |

**SDR System Assets (4):**

| Hostname | IP Address | Type | OS | Risk Score |
|----------|-----------|------|-----|------------|
| sdr-sharepoint | 10.200.10.10 | Application | Windows Server 2022 | 15 |
| sdr-search | 10.200.10.20 | Server | Windows Server 2022 | 12 |
| sdr-sql | 10.200.10.30 | Database | Windows Server 2022 | 18 |
| sdr-backup | 10.200.10.40 | Server | Windows Server 2022 | 8 |

### 2.6 Frameworks & Compliance Posture

| Framework | FCMS Status | SDR Status |
|-----------|------------|------------|
| NIST 800-53 Rev 5 | 312/325 controls implemented (96%) | 125/125 controls implemented (100%) |
| FISMA | Annual assessment due July 2026 | Annual assessment due March 2027 |
| CMMC Level 2 | 108/110 practices met (98%) | N/A |

### 2.7 Control Implementations (FCMS - Key Samples for Manual Entry)

Enter these to demonstrate an authorized system's compliance posture:

| Control ID | Family | Status | Assessment | Summary |
|-----------|--------|--------|------------|---------|
| AC-1 | Access Control | Implemented | Satisfied | ESFS-AC-POL-001 v4.1. PIV-based authentication required. Annual review completed Dec 2025. |
| AC-2 | Access Control | Implemented | Satisfied | Active Directory account management. PIV enrollment via USAccess. 90-day access reviews. Automated disabling after 45 days inactive. |
| AC-2(1) | Access Control | Implemented | Satisfied | Automated account management via PowerShell scripts. Nightly inactive account scan. Automated disabling with manager notification. |
| AC-3 | Access Control | Implemented | Satisfied | RBAC via AD security groups. 8 role tiers with case-level access control. All access logged to Splunk. |
| AC-4 | Access Control | Implemented | Satisfied | Palo Alto PA-3260 enforces information flow. App-ID rules restrict traffic by application. SSL decryption for outbound inspection. |
| AC-5 | Access Control | Implemented | Satisfied | Case adjudicators cannot modify system config. Sys admins cannot access case data. DB admins require dual approval for schema changes. |
| AC-6 | Access Control | Implemented | Satisfied | Least privilege enforced. Admin accounts separate from user accounts. JIT access for elevated privileges via CyberArk PAM. |
| AC-7 | Access Control | Implemented | Satisfied | 5 failed login attempts = 15-minute lockout. 10 failures = permanent lock requiring helpdesk reset. Alert generated after 3 failures. |
| AC-8 | Access Control | Implemented | Satisfied | DoD-standard warning banner displayed at login. Users must acknowledge before access granted. |
| AC-11 | Access Control | Implemented | Satisfied | 15-minute session lock via Group Policy. PIV re-authentication required to unlock. |
| AC-17 | Access Control | Implemented | Satisfied | Remote access via Cisco AnyConnect VPN with PIV + PIN. Split tunneling disabled. Always-on VPN for government-furnished equipment. |
| AU-1 | Audit | Implemented | Satisfied | ESFS-AU-POL-001 v3.3. Comprehensive audit requirements for all system components. |
| AU-2 | Audit | Implemented | Satisfied | Windows Event Logs, IIS logs, SQL Server audit, AD DS audit. All forwarded to Splunk within 60 seconds. |
| AU-3 | Audit | Implemented | Satisfied | Events contain: user, timestamp, event type, source/dest, outcome. CUI access events include data classification tag. |
| AU-6 | Audit | Implemented | Satisfied | Splunk dashboards reviewed daily by SOC. Weekly audit review meetings. Quarterly deep-dive by ISSO. |
| CA-1 | Assessment | Implemented | Satisfied | ESFS-CA-POL-001 v2.2. Annual assessment program. Independent assessor (3PAO) engagement. |
| CA-2 | Assessment | Implemented | Satisfied | Annual security assessment completed Aug 2025 by Coalfire (3PAO). 4 findings identified, all remediated. |
| CA-7 | Assessment | Implemented | Satisfied | Continuous monitoring via Nessus (weekly), Splunk (continuous), SCCM compliance (daily). Monthly ISSO review. |
| CM-1 | Config Mgmt | Implemented | Satisfied | ESFS-CM-POL-001 v3.0. DISA STIG baselines for all Windows components. Monthly compliance scans. |
| CM-2 | Config Mgmt | Implemented | Satisfied | Baselines: DISA STIG for Windows Server 2022, SQL Server 2022, IIS 10. Managed via SCCM + GPO. |
| CM-6 | Config Mgmt | Partially Implemented | Other Than Satisfied | STIG compliance at 94.2% for FCMS servers. 18 deviations documented with risk acceptance. **2 deviations pending remediation.** |
| IA-1 | Identification | Implemented | Satisfied | ESFS-IA-POL-001 v2.5. PIV authentication per HSPD-12. Password policy per NIST SP 800-63B. |
| IA-2 | Identification | Implemented | Satisfied | Multi-factor authentication: PIV card + PIN for all users. CAC accepted for DoD personnel. |
| IR-1 | Incident Response | Implemented | Satisfied | ESFS-IR-POL-001 v3.1. CISA reporting requirements. Annual tabletop exercise (last: Oct 2025). |
| RA-5 | Risk Assessment | Implemented | Satisfied | Weekly Nessus vulnerability scans (credentialed). Monthly web app scans. Quarterly penetration tests. |
| SC-8 | Comms Protection | Implemented | Satisfied | TLS 1.2/1.3 only. FIPS 140-2 validated modules. All data encrypted in transit. |
| SC-28 | Comms Protection | Implemented | Satisfied | Azure Storage Service Encryption for data at rest. SQL Server TDE enabled. BitLocker on all endpoints. |
| SI-2 | System Integrity | Implemented | Satisfied | SCCM Patch Tuesday compliance. Critical patches within 72 hours. Monthly patch cycle for others. |
| SI-4 | System Integrity | Implemented | Satisfied | Splunk Enterprise with custom correlation rules. Palo Alto Threat Prevention. CrowdStrike Falcon EDR. |

### 2.8 POA&Ms (5 Items - Mix of Open and Completed)

| POA&M ID | System | Weakness | Risk | Status | Due Date |
|----------|--------|----------|------|--------|----------|
| POAM-ESFS-2025-012 | FCMS | STIG Deviation: SMBv1 enabled on legacy print server | Moderate | In Progress | 2026-04-30 |
| POAM-ESFS-2025-013 | FCMS | STIG Deviation: PowerShell v2 engine not disabled | Low | Open | 2026-05-15 |
| POAM-ESFS-2026-001 | FCMS | OpenSSL 3.0.x vulnerability (CVE-2024-12797) | High | In Progress | 2026-03-30 |
| POAM-ESFS-2026-002 | FCMS | SQL Server unpatched cumulative update | Medium | Open | 2026-04-15 |
| POAM-ESFS-2025-010 | FCMS | Expired service account password rotation | High | Completed | 2026-01-15 |

### 2.9 Documents Needed for ATO Renewal

These are the key deliverables that should be generated/tracked in ForgeComply 360:

| Document | Status | Responsible | Due Date | Notes |
|----------|--------|-------------|----------|-------|
| System Security Plan (SSP) v4.2 | In Review | ISSO (Torres) | 2026-06-01 | Annual update with all CM changes from past year |
| Security Assessment Report (SAR) | Planned | 3PAO (Chen) | 2026-07-31 | Annual independent assessment |
| Plan of Action & Milestones | Current | ISSO (Torres) | Monthly | Ongoing. 4 active items as of March 2026 |
| Risk Assessment Report (RAR) | Draft | SCA (Johnson) | 2026-06-15 | Update risk register with new threat data |
| Continuous Monitoring Report | Current | ISSO (Torres) | Monthly | March 2026 report due April 5 |
| Privacy Impact Assessment (PIA) | Approved | ISSM (Walsh) | 2026-09-01 | Updated for new PII fields added in v3.7 |
| Configuration Management Plan | Approved | Sys Admin (Park) | 2026-09-01 | Updated Dec 2025 |
| Incident Response Plan | Approved | ISSM (Walsh) | 2026-09-01 | Tested Oct 2025. No updates needed. |
| Contingency Plan | In Review | Sys Admin (Park) | 2026-06-01 | BIA updated for Azure region changes |
| Authorization Letter Renewal | Pending | AO (Hayes) | 2026-09-15 | Depends on SAR findings and POA&M status |

### 2.10 Risks (ESFS Risk Register)

| Risk ID | Title | Category | Likelihood | Impact | Score | Treatment | Status |
|---------|-------|----------|-----------|--------|-------|-----------|--------|
| RISK-ESFS-001 | ATO Expiration Gap | Compliance | 2 | 5 | 10 | Mitigate | In Treatment |
| RISK-ESFS-002 | Insider Threat - Privileged Users | Operational | 2 | 4 | 8 | Mitigate | Monitored |
| RISK-ESFS-003 | Third-Party Cloud Provider Outage | Technical | 3 | 4 | 12 | Transfer | Monitored |
| RISK-ESFS-004 | Supply Chain Compromise (SolarWinds-type) | Technical | 2 | 5 | 10 | Mitigate | In Treatment |
| RISK-ESFS-005 | PII Data Breach via Application Vuln | Compliance | 2 | 5 | 10 | Mitigate | In Treatment |
| RISK-ESFS-006 | Ransomware Attack | Technical | 3 | 5 | 15 | Mitigate | In Treatment |
| RISK-ESFS-007 | Key Personnel Departure (ISSO) | Operational | 3 | 3 | 9 | Mitigate | Monitored |
| RISK-ESFS-008 | Budget Cuts Impacting Security Tools | Financial | 2 | 3 | 6 | Accept | Accepted |

### 2.11 Vendors (6 Third-Party Providers)

| Vendor | Category | Criticality | Risk Tier | Status | BAA | Assessment Due |
|--------|----------|------------|-----------|--------|-----|---------------|
| Microsoft Azure Government | CSP / IaaS | Critical | 1 | Approved | Yes | 2026-06-01 |
| CrowdStrike | EDR / Endpoint Security | High | 1 | Approved | No | 2026-07-01 |
| Splunk (Cisco) | SIEM / Log Management | High | 1 | Approved | No | 2026-08-01 |
| Cisco | VPN / Network Security | High | 2 | Approved | No | 2026-09-01 |
| Tenable | Vulnerability Management | Medium | 2 | Active | No | 2026-10-01 |
| Coalfire | 3PAO Assessment Services | Medium | 3 | Active | Yes | 2026-12-01 |

### 2.12 Policies (8 Key Policies)

| Policy | Category | Version | Status | Owner | Review Date |
|--------|----------|---------|--------|-------|-------------|
| ESFS-AC-POL-001 Access Control | access_control | 4.1 | Published | Walsh | 2026-12-15 |
| ESFS-AU-POL-001 Audit & Accountability | security | 3.3 | Published | Walsh | 2026-12-15 |
| ESFS-CA-POL-001 Assessment & Authorization | security | 2.2 | Published | Walsh | 2026-12-15 |
| ESFS-CM-POL-001 Configuration Management | security | 3.0 | Published | Torres | 2026-12-15 |
| ESFS-IA-POL-001 Identification & Authentication | access_control | 2.5 | Published | Walsh | 2026-12-15 |
| ESFS-IR-POL-001 Incident Response | incident_response | 3.1 | Published | Walsh | 2026-12-15 |
| ESFS-SC-POL-001 System & Communications Protection | security | 2.8 | Published | Torres | 2026-12-15 |
| ESFS-SI-POL-001 System & Information Integrity | security | 2.6 | Published | Torres | 2026-12-15 |

---

## Vulnerability Scan Import Files

ForgeComply 360 supports automated import of vulnerability scan data. The following sample files are provided for testing the import workflow.

### Import Workflow

1. Navigate to **SOC > Scan Import** in ForgeComply 360
2. Click **Import Scan**
3. Select the target system (FCMS or MFEHR)
4. Upload the scan file (.nessus or .csv)
5. Configure options:
   - **Minimum severity:** Select threshold (recommended: Low)
   - **Auto-create assets:** Enable to create asset records from scan hosts
   - **Auto-map NIST controls:** Enable to link findings to relevant controls
6. Click **Upload & Process**
7. Review imported findings in the vulnerability dashboard
8. Generate POA&Ms from critical/high findings

### Sample Files Provided

| File | Scanner | Format | Customer | Findings | Notes |
|------|---------|--------|----------|----------|-------|
| `sample-scans/esfs-fcms-nessus-scan.nessus` | Nessus | XML | ESFS / FCMS | 24 findings | Credentialed Windows scan |
| `sample-scans/esfs-fcms-tenable-export.csv` | Tenable.io | CSV | ESFS / FCMS | 20 findings | Tenable.io vulnerability export |
| `sample-scans/phs-mfehr-nessus-scan.nessus` | Nessus | XML | PHS / MFEHR | 18 findings | Credentialed Linux scan |

### Expected Results After Import

**ESFS FCMS Nessus Scan (24 findings):**
- 2 Critical: OpenSSL RCE, SMB Remote Code Execution
- 4 High: SQL Server unpatched, Windows LSASS vuln, IIS misconfiguration, Expired certificate
- 8 Medium: STIG deviations, missing patches, weak cipher suites, audit policy gaps
- 10 Low/Info: Banner disclosures, unnecessary services, informational findings

**ESFS FCMS Tenable CSV (20 findings):**
- 1 Critical: Windows Print Spooler RCE (PrintNightmare variant)
- 3 High: .NET Framework vulnerability, ADFS token signing weakness, PowerShell execution policy
- 7 Medium: Windows Defender exclusions, SMBv1 remnants, certificate warnings
- 9 Low/Info: Windows feature configurations, registry settings

**PHS MFEHR Nessus Scan (18 findings):**
- 2 Critical: Log4Shell, SQL Injection detection
- 5 High: TLS misconfigurations, MuleSoft bypass, missing patches, XSS
- 6 Medium: Rate limiting, Redis AUTH, info disclosure, CSP, logging
- 5 Low: Header disclosures, certificate issues, session settings

---

## Data Entry Sequence (Recommended Order)

### For Manual Entry Workflow

Follow this sequence when manually entering data to simulate a real deployment:

**Phase 1: Foundation (Day 1)**
1. Create Organization (PHS or ESFS)
2. Create Users and assign roles
3. Create Information Systems with boundary descriptions
4. Enable relevant compliance frameworks

**Phase 2: Compliance Baseline (Day 1-2)**
5. Document Control Implementations (start with AC, AU, CM families)
6. Create Policies and link to control families
7. Upload initial evidence artifacts (policy documents, screenshots)

**Phase 3: Risk & Vulnerability (Day 2-3)**
8. **Import Nessus scan** via Scan Import page (automated)
9. **Import Tenable scan** via Scan Import page (automated)
10. Review auto-created assets and findings
11. Create POA&Ms from critical/high findings (auto-generate option available)
12. Enter Risk Register items

**Phase 4: Vendor & Monitoring (Day 3)**
13. Add Vendors with assessment schedules
14. Configure Monitoring Checks
15. Set up Alert Rules
16. Create Evidence Schedules for recurring collections

**Phase 5: Documents & Review (Day 4)**
17. Generate SSP document using ForgeML AI Writer
18. Create/update continuous monitoring deliverables
19. Review dashboards for completeness
20. Run Forge Reporter exports

### For Automated Import (SQL Seed)

The existing PHS data can be loaded via SQL:

```bash
# Load PHS sample customer data (Scenario 1)
npm run db:seed:demo  # If using demo environment
# OR
wrangler d1 execute forge-comply360-db --remote --file=database/seed-sample-customer-phs.sql

# Load ESFS sample customer data (Scenario 2)
wrangler d1 execute forge-comply360-db --remote --file=database/seed-sample-customer-esfs.sql
```

**Note:** Vulnerability scan files (.nessus, .csv) should always be imported via the UI to test the full import pipeline. They cannot be loaded via SQL seed.

---

## Dashboard Alerts Expected

After loading all data, these dashboard alerts should be visible:

### PHS (Healthcare - FISMA ATO)

| Alert | Count | Demo Value |
|-------|-------|------------|
| Systems Pending ATO | 2 | MFEHR and SCPP under review |
| Critical POA&Ms | 2 | Log4Shell and SQL Injection |
| High POA&Ms | 3 | TLS, MuleSoft, Bastion patches |
| Evidence Gaps | 310+ | Controls without documented evidence |
| Open Incidents | 1 | MuleSoft unauthorized access |
| Vulnerability Findings (Critical) | 2 | Requires immediate attention |

### ESFS (Federal - Existing ATO)

| Alert | Count | Demo Value |
|-------|-------|------------|
| ATO Expiring Soon | 1 | FCMS ATO expires Sept 15, 2026 |
| SSP Update Needed | 1 | Annual SSP refresh required |
| SAR Assessment Due | 1 | Annual 3PAO assessment |
| POA&Ms Open | 4 | 2 STIG deviations + 2 vulnerability items |
| Vendor Assessments Due | 3 | Azure, CrowdStrike, Splunk |
| Continuous Monitoring Report | 1 | Monthly report pending |
| Risk Items Requiring Treatment | 4 | Active risk mitigation items |

---

## Technical Notes

### Password Hashing

All demo accounts use PBKDF2-SHA256 with 100K iterations:
- **Password:** `ForgeDemo2026!`
- **Salt:** `a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2`
- **Hash:** `a17b334b4cfc932e35a3014a4b70ff90a8c6c903b162e3383647f86d5197a544`

### Scan Import Technical Details

The platform's scan import supports:
- **Nessus (.nessus):** XML format parsed via fast-xml-parser. Expects `NessusClientData_v2` root element.
- **Tenable.io (.csv):** CSV export with columns: Plugin ID, Host, Risk, CVE, CVSS, Port, Protocol, Name, Family, Synopsis, Description, Solution.
- **Qualys (.csv):** CSV export with columns: IP, DNS, QID, Title, Severity, CVE ID, CVSS, Solution, Results.

Auto-detection works based on file extension and CSV header inspection.

### ID Conventions

| Entity | Prefix | Example |
|--------|--------|---------|
| Organization | org_ | org_002 |
| User | user-esfs- | user-esfs-001 |
| System | sys-esfs- | sys-esfs-001 |
| Asset | asset-esfs- | asset-esfs-001 |
| POA&M | poam-esfs- | poam-esfs-001 |
| Finding | find-esfs- | find-esfs-001 |
| Control Impl | ci-esfs- | ci-esfs-001 |
| Risk | risk-esfs- | risk-esfs-001 |
| Vendor | vendor-esfs- | vendor-esfs-001 |
| Policy | policy-esfs- | policy-esfs-001 |

---

*Forge Cyber Defense - Service-Disabled Veteran-Owned Small Business (SDVOSB)*
