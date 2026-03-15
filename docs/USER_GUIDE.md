# ForgeComply 360 Platform User Guide

**Version 5.0** | Forge Cyber Defense (SDVOSB) | March 2026

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [ForgeComply 360 (GRC Platform)](#forgecomply-360-grc-platform)
3. [Forge Reporter (SSP Authoring)](#forge-reporter-ssp-authoring)
4. [ForgeScan (Vulnerability Scanning)](#forgescan-vulnerability-scanning)
5. [Glossary of Federal Terms](#glossary-of-federal-terms)

---

## 1. Getting Started

### Registration & Onboarding

1. Navigate to the ForgeComply 360 URL and click **Register**.
2. Provide your name, email, password, organization name, industry, and size.
3. If required, enter the registration invite code provided by your administrator.
4. After registration you will be guided through the **Onboarding Wizard**:
   - Select your compliance framework(s) (NIST 800-53, FedRAMP, CMMC, HIPAA, SOC 2, etc.)
   - Create your first information system (name, acronym, impact level)
   - Optionally import existing control data (CSV, OSCAL SSP)
5. Once onboarding is complete you land on the **Dashboard**.

### Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **Viewer** | Read-only access to controls, evidence, systems |
| **Analyst** | All viewer permissions + create/edit controls, evidence, assessments |
| **Manager** | All analyst permissions + manage POA&Ms, reports, schedules, users |
| **Admin** | All manager permissions + organization settings, connectors, audit log |
| **Owner** | Full access including billing, API keys, and destructive operations |

### Multi-Factor Authentication (MFA)

MFA is available for all users via TOTP (Time-based One-Time Password). Enable it in **Settings > Security**. Backup codes are generated upon setup.

---

## 2. ForgeComply 360 (GRC Platform)

### Dashboard

The dashboard provides an at-a-glance view of your compliance posture:
- **Compliance Percentage** across all frameworks
- **Control Status** breakdown (implemented, partially implemented, planned, not implemented)
- **POA&M Status** (open, in progress, completed)
- **Risk Distribution** (critical, high, moderate, low)
- **Recent Activity** timeline
- **Framework-specific** compliance scores

### Systems Management

Navigate to **Systems** to manage your information systems.

- **Create System**: Name, acronym, description, FIPS 199 impact level (low/moderate/high), deployment model, service model.
- **System Profiles**: Boundary descriptions, system owner, authorizing official, security officer.
- **System Comparison**: Side-by-side comparison of control implementation across systems.

### Compliance Frameworks

ForgeComply 360 supports multiple compliance frameworks out of the box:
- **NIST SP 800-53 Rev 5** (full 1,189-control catalog)
- **FedRAMP** (Low, Moderate, High baselines)
- **CMMC 2.0** (Levels 1-3)
- **HIPAA** Security Rule
- **SOC 2** Trust Services Criteria
- **ISO 27001**
- **Custom Frameworks** (create your own)

### Controls

Navigate to **Controls** to view and manage control implementations.

- **Filter** by framework, family, status, system, or search text
- **Bulk Operations**: Update status, assign owners, import from CSV
- **Implementation Status**: Implemented, Partially Implemented, Planned, Not Implemented, Not Applicable
- **Control Narratives**: Document how each control is implemented
- **AI Writer**: Use ForgeML to auto-generate control narratives based on system context
- **Inheritance**: Mark controls as inherited from parent systems (common controls)
- **Crosswalks**: View control mappings across frameworks (e.g., NIST to FedRAMP)

### Evidence Management

Navigate to **Evidence** to track compliance artifacts.

- **Upload** evidence files (PDF, images, documents) to the Evidence Vault (R2 storage)
- **Link** evidence to specific controls and systems
- **Evidence Schedules**: Set recurring evidence collection reminders (daily, weekly, monthly, quarterly, annual)
- **Evidence Automation**: Create automated evidence tests that validate control effectiveness
- **Approval Workflows**: Route evidence for review and approval

### POA&M Management

Navigate to **POA&Ms** (Plan of Action & Milestones) to track remediation items.

- **Create POA&Ms** manually or auto-generate from:
  - Assessment gaps
  - Vulnerability scan findings
  - Unimplemented controls
- **Track**: Weakness name, description, risk level, scheduled completion, milestones, responsible party, cost estimate
- **Link** vulnerability findings from scans to POA&Ms
- **Status**: Open, In Progress, Completed, Accepted, Deferred
- **OSCAL POA&M Export**: Export in NIST OSCAL format

### Risk Management

Navigate to **Risks** to maintain your risk register.

- **Create** risk entries with: title, description, category, likelihood, impact, risk score
- **Treatment Plans**: Accept, mitigate, transfer, or avoid
- **Risk Matrix**: Visual likelihood-vs-impact heatmap
- **Vendor Risks**: Track third-party risk via the Vendors module

### SSP (System Security Plan) Generation

Navigate to **SSP** to build and export System Security Plans.

- **Quick SSP Builder**: Auto-populate SSP sections from system and control data
- **FISMA SSP Builder**: Full 23-section FISMA-compliant SSP with:
  - Information System Name & Identifier
  - Security Categorization (FIPS 199)
  - Information System Owner
  - Authorization Boundary
  - All control family narratives
- **Export Formats**: OSCAL JSON, DOCX, PDF
- **SSP Comparison**: Diff two SSP versions side by side

### Reports

Navigate to **Reports** to generate compliance reports.

**On-Demand Reports:**
- **Executive Summary**: High-level compliance posture for leadership
- **Compliance Posture Report**: Detailed control-by-control analysis
- **Risk Summary Report**: Risk register overview with breakdowns
- **Audit-Ready Package**: Bundled report set for auditor delivery

**Scheduled Reports:**
- Create automated report schedules (daily, weekly, monthly, quarterly)
- Email delivery to multiple recipients via Resend
- View delivery history and run status

**Data Exports (CSV):**
- Control implementations
- Compliance snapshots (90-day trend)
- Risk register

### Analytics

Navigate to **Analytics** for compliance trend data, framework comparison charts, and compliance snapshot history.

### Monitoring

Navigate to **Monitoring** for continuous compliance monitoring dashboards and alerting.

### Audit Preparation

Navigate to **Audit Prep** for pre-audit checklists, readiness scoring, and artifact organization.

### Notifications

ForgeComply 360 sends notifications for:
- POA&M status changes and approaching deadlines
- Evidence collection reminders
- Assessment completions
- Security incidents
- System changes

**Delivery options**: In-app notifications, daily email digest, instant email for critical alerts.

### Import & Export

- **Bulk Import**: Systems, controls, risks, vendors, POA&Ms via CSV
- **OSCAL Import**: Import OSCAL SSP or Catalog JSON
- **OSCAL Export**: SSP, Assessment Results, POA&M in NIST OSCAL format
- **CSV Export**: All major data types

### Integrations

- **ServiceNow CMDB**: Scheduled asset sync
- **Webhooks**: Real-time event notifications to external systems
- **API Keys**: Programmatic access via REST API
- **ForgeScan Webhook**: Receive vulnerability scan results

---

## 3. Forge Reporter (SSP Authoring)

Forge Reporter is a standalone SSP authoring tool accessible at `/reporter` or as a separate application.

### Overview

Reporter provides a guided, offline-capable interface for building FISMA/FedRAMP System Security Plans without requiring full GRC platform access.

### Launching Reporter

1. From ForgeComply 360, navigate to **Reporter** in the sidebar
2. Click **Launch Reporter** to generate a scoped 4-hour access token
3. Reporter opens in a new tab with pre-loaded system data

### SSP Authoring Workflow

1. **System Information**: Enter system name, acronym, FIPS 199 categorization, deployment model
2. **Authorization Boundary**: Describe system boundary, network diagrams, data flows
3. **System Environment**: Hardware, software, interconnections
4. **Control Families**: Work through each NIST 800-53 control family:
   - AC (Access Control)
   - AT (Awareness & Training)
   - AU (Audit & Accountability)
   - CA (Assessment, Authorization & Monitoring)
   - CM (Configuration Management)
   - CP (Contingency Planning)
   - IA (Identification & Authentication)
   - IR (Incident Response)
   - MA (Maintenance)
   - MP (Media Protection)
   - PE (Physical & Environmental Protection)
   - PL (Planning)
   - PM (Program Management)
   - PS (Personnel Security)
   - PT (PII Processing & Transparency)
   - RA (Risk Assessment)
   - SA (System & Services Acquisition)
   - SC (System & Communications Protection)
   - SI (System & Information Integrity)
   - SR (Supply Chain Risk Management)
5. **Validation**: Built-in SSP validator checks for completeness and OSCAL compliance
6. **Export**: Export as PDF, DOCX, or OSCAL JSON

### Offline Mode

Reporter caches data locally and can function without network connectivity. Changes sync when connectivity is restored.

### Validation Rules

The SSP validator checks:
- All required fields are populated
- FIPS 199 categorization is consistent
- Control narratives meet minimum length requirements
- OSCAL schema compliance (when exporting to OSCAL)

---

## 4. ForgeScan (Vulnerability Scanning)

### Overview

ForgeScan integrates vulnerability scanning data into the ForgeComply 360 compliance workflow, bridging the gap between technical security findings and GRC remediation tracking.

### Importing Scan Data

Navigate to **Scans** to import vulnerability scan results.

**Supported Scanners:**
- **Nessus** (.nessus XML files)
- **Qualys** (CSV export)
- **Tenable.io** (CSV export)

**Import Process:**
1. Click **Import Scan**
2. Select the scanner type (or use auto-detect)
3. Choose the target system
4. Set minimum severity filter (optional)
5. Enable options:
   - **Auto-create assets**: Automatically create asset records for discovered hosts
   - **Auto-map NIST controls**: Map findings to NIST 800-53 controls
6. Upload the scan file
7. Monitor import progress (auto-polls every 5 seconds)

### Vulnerability Findings

After import, findings appear with:
- **Title**: Vulnerability name
- **Severity**: Critical, High, Medium, Low, Info
- **CVSS Scores**: CVSS v2 and v3
- **Host Information**: Hostname, IP address, port, protocol
- **Plugin Details**: Plugin ID, name, family (Nessus)
- **Exploit Status**: Whether a public exploit exists
- **Patch Status**: Whether a vendor patch is published
- **Temporal Data**: First seen, last seen dates

### Linking Findings to POA&Ms

1. Navigate to a POA&M detail view
2. Click **Link Findings** to open the finding browser
3. Search and filter findings by severity, hostname, or title
4. Select findings (up to 50 visible at a time) and link them
5. Linked findings display with severity badges on the POA&M

### Auto-generating POA&Ms from Scans

1. From the scan import detail, click **Generate POA&Ms**
2. Choose grouping strategy:
   - **By Plugin**: One POA&M per vulnerability type
   - **By Asset**: One POA&M per host
   - **By CVE**: One POA&M per CVE identifier
   - **Individual**: One POA&M per finding
3. POA&Ms are created with linked findings and auto-mapped NIST controls

### ForgeScan Webhook

External scanning tools can push results via webhook:
- **Endpoint**: `POST /api/webhook/forgescan`
- **Authentication**: Bearer token or `X-Forge-API-Key` header
- **Events**: `forge.scan.completed`

### Asset Inventory

Navigate to **Assets** for the auto-discovered asset inventory:
- Hostname, IP address, OS, MAC address
- Vulnerability counts by severity
- Risk score calculations
- Scan history timeline

---

## 5. Glossary of Federal Terms

| Term | Full Name | Definition |
|------|-----------|------------|
| **SSP** | System Security Plan | A formal document describing the security controls in place or planned for an information system |
| **ATO** | Authority to Operate | Official authorization granted by an Authorizing Official to operate an information system at an acceptable level of risk |
| **POA&M** | Plan of Action & Milestones | A document identifying tasks needed to correct deficiencies in security controls |
| **ISSO** | Information System Security Officer | The individual responsible for the day-to-day security operations of an information system |
| **FIPS 199** | Federal Information Processing Standard 199 | Standard for categorizing federal information systems (Low, Moderate, High impact) |
| **OSCAL** | Open Security Controls Assessment Language | A NIST standard for machine-readable security and privacy control documentation |
| **FedRAMP** | Federal Risk and Authorization Management Program | Standardized approach to security assessment for cloud services used by federal agencies |
| **CMMC** | Cybersecurity Maturity Model Certification | DoD framework for assessing contractor cybersecurity practices |
| **FISMA** | Federal Information Security Modernization Act | Federal law requiring agencies to develop, document, and implement information security programs |
| **NIST SP 800-53** | NIST Special Publication 800-53 | Catalog of security and privacy controls for federal information systems |
| **RMF** | Risk Management Framework | NIST framework for integrating security and risk management into system development |
| **STIG** | Security Technical Implementation Guide | Configuration standard from DISA for DoD information systems |
| **CUI** | Controlled Unclassified Information | Information requiring safeguarding per federal regulation |
| **CONMON** | Continuous Monitoring | Ongoing awareness of information security, vulnerabilities, and threats |
| **RA** | Risk Assessment | Process of identifying risks to organizational operations |
| **CA** | Security Assessment & Authorization | Evaluating security controls and authorizing system operation |
| **IR** | Incident Response | Organized approach to addressing security incidents |
| **CP** | Contingency Planning | Establishing backup procedures for system recovery |
| **CM** | Configuration Management | Process for maintaining system integrity through change control |

---

## Support

For questions, feature requests, or bug reports:
- **In-app**: Use the Command Palette (Ctrl+K / Cmd+K) for quick navigation
- **Documentation**: Additional docs available in the `docs/` directory
- **Email**: Contact your Forge Cyber Defense account representative

---

*ForgeComply 360 is a product of Forge Cyber Defense, a Service-Disabled Veteran-Owned Small Business (SDVOSB).*
