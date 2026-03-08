#!/usr/bin/env node
// generate-implementations.js — Generate FedRAMP Moderate control implementation narratives
// for 2 demo systems: MFEHR (sys-phs-001) and FC360 (sys-001)

const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'database');
const OUTPUT = path.join(DB_DIR, 'migrate-040-control-implementations.sql');

function sqlEscape(s) { return (s || '').replace(/'/g, "''").replace(/[\r\n]+/g, ' ').replace(/;/g, ','); }

// ============================================================================
// System Profiles
// ============================================================================

const SYSTEMS = {
  'sys-phs-001': {
    org_id: 'org_001',
    name: 'MedForge Electronic Health Records',
    acronym: 'MFEHR',
    hosting: 'AWS GovCloud (US-East)',
    auth: 'Okta SSO with FIDO2/PIV MFA, Azure AD federation for VA users',
    db: 'Amazon RDS PostgreSQL 15 (encrypted with AWS KMS CMK)',
    monitoring: 'Splunk Enterprise SIEM with 365-day retention, CrowdStrike Falcon EDR on all endpoints',
    firewall: 'AWS Network Firewall with Palo Alto VM-Series',
    vpn: 'Cisco AnyConnect VPN with certificate-based authentication',
    siem: 'Splunk Enterprise',
    edr: 'CrowdStrike Falcon',
    scanner: 'Tenable Nessus Professional',
    sccm: 'SCCM for configuration management and STIG enforcement',
    idp: 'Okta',
    policyPrefix: 'PHS-POL',
    procPrefix: 'PHS-PROC',
    orgName: 'Patriot Health Systems',
    industry: 'defense health',
    dataTypes: 'PHI, CUI, PII, and medical records',
    certAuth: 'VA Authorizing Official',
    isso: 'Sarah Rodriguez',
    issm: 'Marcus Chen',
    sysAdmin: 'DevOps Engineering Team',
    ciso: 'Dr. James Whitfield',
    incidentEmail: 'soc@patriothealth.com',
    ticketSystem: 'ServiceNow',
    cicd: 'GitLab CI/CD with DAST scanning',
    container: 'Amazon EKS with Aqua Security',
  },
  'sys-001': {
    org_id: 'org_001',
    name: 'ForgeComply 360 Platform',
    acronym: 'FC360',
    hosting: 'Cloudflare Workers edge infrastructure (200+ global PoPs)',
    auth: 'JWT with PBKDF2-SHA256 (100K iterations), TOTP-based MFA via authenticator app',
    db: 'Cloudflare D1 (SQLite-based, AES-256 encryption at rest)',
    monitoring: 'Cloudflare Analytics with real-time dashboards, custom SOC alerting via Workers',
    firewall: 'Cloudflare WAF with managed rulesets and custom rules',
    vpn: 'Cloudflare Access Zero Trust tunnels',
    siem: 'Cloudflare Logpush to R2 with 365-day retention',
    edr: 'CrowdStrike Falcon on development workstations',
    scanner: 'Snyk for dependency scanning, Cloudflare Security Center',
    sccm: 'Infrastructure-as-code via Wrangler with version-controlled configs',
    idp: 'Built-in authentication with Cloudflare Access overlay',
    policyPrefix: 'FCD-POL',
    procPrefix: 'FCD-PROC',
    orgName: 'Forge Cyber Defense',
    industry: 'cybersecurity SaaS',
    dataTypes: 'federal compliance data, CUI, and system security artifacts',
    certAuth: 'FedRAMP PMO / 3PAO',
    isso: 'Stanley Riley',
    issm: 'Chief Security Officer',
    sysAdmin: 'Platform Engineering Team',
    ciso: 'Stanley Riley',
    incidentEmail: 'incident@forgecyberdefense.com',
    ticketSystem: 'Linear',
    cicd: 'GitHub Actions with automated security scanning',
    container: 'Cloudflare Workers (serverless, no containers)',
  },
};

// ============================================================================
// FedRAMP Moderate Control IDs (287 from migrate-036)
// ============================================================================

const FEDRAMP_MOD_CONTROLS = fs.readFileSync(
  path.join(DB_DIR, 'migrate-036-fedramp-controls.sql'), 'utf8'
).match(/VALUES \('fedramp-moderate', '([^']+)'/g)
  .map(m => m.match(/'([^']+)'$/)[1])
  .sort();

console.log(`FedRAMP Moderate controls: ${FEDRAMP_MOD_CONTROLS.length}`);

// ============================================================================
// Status Assignment (target: 60% impl, 20% partial, 12% planned, 3% alt, 5% N/A)
// ============================================================================

function getControlFamily(controlId) {
  return controlId.replace(/-\d+.*$/, '');
}

function isEnhancement(controlId) {
  return /\(\d+\)/.test(controlId);
}

// Controls that are not applicable for cloud-only systems
const NOT_APPLICABLE_CONTROLS = new Set([
  'PE-1', 'PE-2', 'PE-3', 'PE-4', 'PE-5', 'PE-6', 'PE-6(1)', 'PE-8', 'PE-9',
  'PE-10', 'PE-11', 'PE-12', 'PE-13', 'PE-13(1)', 'PE-14',
]);

// Controls with alternative implementations
const ALTERNATIVE_CONTROLS = new Set([
  'SC-18', 'PE-15', 'PE-16', 'PE-17', 'MA-3', 'MA-3(1)', 'MA-3(2)', 'MA-3(3)', 'MA-6',
]);

// Controls that are planned (not yet implemented)
const PLANNED_CONTROLS = new Set([
  'SA-10', 'SA-11', 'SA-15', 'SA-15(3)', 'SA-22', 'SR-1', 'SR-2', 'SR-2(1)',
  'SR-3', 'SR-5', 'SR-6', 'SR-8', 'SR-10', 'SR-11', 'SR-11(1)', 'SR-11(2)', 'SR-12',
  'SI-7(7)', 'SI-4(5)', 'SI-8(2)', 'CM-12', 'CM-12(1)', 'RA-9',
  'CA-7(4)', 'CP-2(8)', 'CP-9(8)', 'IA-12(5)', 'IR-3(2)', 'IR-6(3)',
  'RA-5(11)', 'SA-4(10)', 'SA-9(2)', 'SC-7(8)',
  'AU-6(3)', 'CM-3(4)', 'IA-12(2)', 'IA-12(3)',
]);

// Controls that are partially implemented
const PARTIAL_CONTROLS = new Set([
  'AC-2(13)', 'AC-6(10)', 'AC-20(1)', 'AC-21',
  'AU-9(4)', 'AU-7(1)',
  'CM-2(7)', 'CM-3(2)', 'CM-4(2)', 'CM-7(2)', 'CM-10', 'CM-11',
  'CP-6(3)', 'CP-7(2)', 'CP-7(3)', 'CP-8', 'CP-8(1)', 'CP-8(2)', 'CP-9(1)',
  'IA-5(6)', 'IA-8(4)', 'IA-11',
  'IR-4(1)', 'IR-5', 'IR-7(1)',
  'MA-1', 'MA-2', 'MA-4', 'MA-5',
  'MP-1', 'MP-2', 'MP-3', 'MP-4', 'MP-5', 'MP-6', 'MP-7',
  'PL-8', 'PL-10', 'PL-11',
  'PS-9',
  'RA-3(1)', 'RA-5(5)', 'RA-7',
  'SA-1', 'SA-2', 'SA-3', 'SA-4(9)', 'SA-5', 'SA-8', 'SA-9',
  'SC-17', 'SC-23',
  'SI-2(2)', 'SI-4(4)', 'SI-7(1)', 'SI-8', 'SI-10', 'SI-11', 'SI-12',
]);

function getStatus(controlId) {
  if (NOT_APPLICABLE_CONTROLS.has(controlId)) return 'not_applicable';
  if (ALTERNATIVE_CONTROLS.has(controlId)) return 'alternative';
  if (PLANNED_CONTROLS.has(controlId)) return 'planned';
  if (PARTIAL_CONTROLS.has(controlId)) return 'partially_implemented';
  return 'implemented';
}

// ============================================================================
// Responsible Role Assignment
// ============================================================================

function getResponsibleRole(controlId, sys) {
  const family = getControlFamily(controlId);
  switch (family) {
    case 'AC': return 'ISSO';
    case 'AT': return 'Training Manager';
    case 'AU': return 'Security Engineer';
    case 'CA': return 'ISSO';
    case 'CM': return 'System Administrator';
    case 'CP': return 'Contingency Planning Coordinator';
    case 'IA': return 'Identity Administrator';
    case 'IR': return 'Incident Response Lead';
    case 'MA': return 'System Administrator';
    case 'MP': return 'Information Security Officer';
    case 'PE': return 'Facilities Manager';
    case 'PL': return sys.ciso;
    case 'PM': return sys.ciso;
    case 'PS': return 'HR Security Liaison';
    case 'PT': return 'Privacy Officer';
    case 'RA': return 'Risk Assessment Lead';
    case 'SA': return 'Acquisition Security Lead';
    case 'SC': return 'Network Security Engineer';
    case 'SI': return 'Security Engineer';
    case 'SR': return 'Supply Chain Risk Manager';
    default: return 'ISSO';
  }
}

// ============================================================================
// Narrative Templates by Family
// ============================================================================

function generateNarrative(controlId, status, sys) {
  const family = getControlFamily(controlId);
  const s = sys; // shorthand
  const enhNum = controlId.match(/\((\d+)\)/)?.[1];
  const baseId = controlId.replace(/\(\d+\)/, '');

  // For N/A controls
  if (status === 'not_applicable') {
    return `This control is not applicable to ${s.name} (${s.acronym}). The ${s.acronym} system is hosted entirely on ${s.hosting} and does not maintain physical data center facilities. Physical and environmental protections are the responsibility of the cloud service provider under the shared responsibility model. ${s.orgName} has documented this scoping determination in ${s.policyPrefix}-SCOPE-001 and validated it with the ${s.certAuth}.`;
  }

  // For alternative controls
  if (status === 'alternative') {
    return `${s.orgName} implements an alternative control for ${controlId} within the ${s.acronym} system boundary. The original control requirement is addressed through compensating controls documented in ${s.policyPrefix}-ALT-${baseId.replace('-', '')} and approved by the ${s.certAuth}. The compensating control provides equivalent or greater protection through ${s.monitoring} continuous monitoring and automated enforcement via ${s.firewall}. Risk acceptance for this alternative implementation was signed by the AO on the most recent authorization date.`;
  }

  // For planned controls
  if (status === 'planned') {
    const quarter = 'Q3 FY2026';
    return `Implementation of ${controlId} for ${s.acronym} is planned for completion by ${quarter}. ${s.orgName} has drafted the implementation approach in ${s.procPrefix}-${baseId.replace('-', '')}-PLAN and allocated resources from the ${s.sysAdmin}. The planned implementation will leverage ${s.hosting} capabilities and integrate with existing ${s.monitoring} monitoring infrastructure. This item is tracked in POA&M item POAM-${s.acronym}-2026-${controlId.replace(/[^A-Z0-9]/g, '')} with monthly status reviews by the ${s.isso}.`;
  }

  // For partially implemented controls
  if (status === 'partially_implemented') {
    return generatePartialNarrative(controlId, sys);
  }

  // Implemented — family-specific narratives
  return generateImplementedNarrative(controlId, sys);
}

function generatePartialNarrative(controlId, sys) {
  const s = sys;
  const baseId = controlId.replace(/\(\d+\)/, '');
  const family = getControlFamily(controlId);

  const partialTemplates = {
    AC: `${s.orgName} has partially implemented ${controlId} for the ${s.acronym} system. Core access control mechanisms are operational through ${s.auth}, enforcing role-based access with least privilege principles. However, automated access review workflows for ${controlId} requirements are still being configured in ${s.ticketSystem}. The ${s.isso} conducts manual quarterly reviews as an interim measure. Full automation is targeted for completion by Q3 FY2026, tracked in POA&M item POAM-${s.acronym}-2026-${baseId.replace('-', '')}. Current policy documentation exists in ${s.policyPrefix}-AC-001 v2.1.`,
    AU: `Audit capabilities for ${controlId} within ${s.acronym} are partially operational. ${s.siem} collects and correlates security events from ${s.hosting} infrastructure components, providing baseline audit coverage. Advanced audit analysis features specified by ${controlId} are being integrated, with ${s.sysAdmin} configuring additional log sources and correlation rules. Interim manual review processes are documented in ${s.procPrefix}-AU-002. Completion estimated Q3 FY2026 per POA&M POAM-${s.acronym}-2026-${baseId.replace('-', '')}.`,
    CM: `Configuration management for ${controlId} is partially implemented in the ${s.acronym} environment. ${s.sccm} enforces baseline configurations across managed components on ${s.hosting}. However, automated deviation detection and remediation workflows for all ${controlId} sub-requirements are still being validated. The ${s.sysAdmin} performs weekly manual configuration audits as a compensating measure. Full implementation is tracked in POA&M POAM-${s.acronym}-2026-${baseId.replace('-', '')} with target completion Q3 FY2026.`,
    CP: `Contingency planning control ${controlId} for ${s.acronym} is partially addressed. Core disaster recovery procedures are documented in ${s.policyPrefix}-CP-001, and ${s.hosting} provides infrastructure-level redundancy. Testing of the full ${controlId} requirements, including tabletop exercises and functional recovery tests, has been partially completed. The Contingency Planning Coordinator is scheduling additional tests per ${s.procPrefix}-CP-TEST-001. POA&M POAM-${s.acronym}-2026-${baseId.replace('-', '')} tracks remaining items.`,
    IA: `Identity and authentication control ${controlId} for ${s.acronym} is partially implemented. ${s.auth} provides primary authentication with MFA enforcement for all privileged and non-privileged users. Specific ${controlId} enhancements requiring additional identity proofing or federation capabilities are in progress. ${s.idp} configuration updates are being tested in the staging environment by the Identity Administrator. Target completion is Q3 FY2026, tracked in POA&M POAM-${s.acronym}-2026-${baseId.replace('-', '')}.`,
    IR: `Incident response capability for ${controlId} within ${s.acronym} is partially operational. ${s.orgName} maintains an incident response plan (${s.policyPrefix}-IR-001 v3.0) with defined procedures for detection, containment, and recovery. ${s.monitoring} provides real-time alerting to ${s.incidentEmail}. However, specific ${controlId} requirements for automated response orchestration are still being integrated. The Incident Response Lead is coordinating with ${s.sysAdmin} to complete automation. POA&M POAM-${s.acronym}-2026-${baseId.replace('-', '')} tracks this item.`,
    SA: `System and services acquisition control ${controlId} for ${s.acronym} is partially implemented. ${s.orgName} has established procurement security requirements in ${s.policyPrefix}-SA-001 covering supply chain risk, secure development practices, and third-party assessment requirements. Specific ${controlId} provisions for enhanced developer security testing and evidence collection are being incorporated into vendor contracts. The Acquisition Security Lead coordinates with legal and procurement. POA&M POAM-${s.acronym}-2026-${baseId.replace('-', '')} tracks completion.`,
    SI: `System and information integrity control ${controlId} for ${s.acronym} is partially operational. ${s.edr} provides malicious code protection and ${s.scanner} performs regular vulnerability scanning across ${s.hosting} components. Specific ${controlId} requirements for advanced integrity verification or automated remediation are being configured. The Security Engineer is implementing additional detection rules and response playbooks. Interim manual processes are documented in ${s.procPrefix}-SI-001. POA&M POAM-${s.acronym}-2026-${baseId.replace('-', '')} tracks completion.`,
  };

  return partialTemplates[family] || `${s.orgName} has partially implemented ${controlId} for the ${s.acronym} system. Core requirements are operational, with specific sub-requirements under active development. Implementation progress is tracked in POA&M item POAM-${s.acronym}-2026-${baseId.replace('-', '')}. The ${s.isso} reviews implementation status monthly. Policy documentation exists in ${s.policyPrefix}-${family}-001. Full implementation is targeted for Q3 FY2026 with ${s.sysAdmin} leading the technical effort on ${s.hosting}.`;
}

function generateImplementedNarrative(controlId, sys) {
  const s = sys;
  const family = getControlFamily(controlId);
  const baseId = controlId.replace(/\(\d+\)/, '');
  const enhNum = controlId.match(/\((\d+)\)/)?.[1];

  // Build family-specific narratives
  const narratives = {
    AC: () => {
      if (controlId === 'AC-1') return `${s.orgName} has developed and maintains Access Control Policy ${s.policyPrefix}-AC-001 v4.0 governing all access to the ${s.acronym} system. The policy addresses account management, access enforcement, information flow, separation of duties, least privilege, remote access, wireless access, and mobile device controls. Procedures are documented in ${s.procPrefix}-AC-001 v3.1. The ${s.ciso} reviews and updates the policy annually, with the most recent review completed January 2026. All personnel with ${s.acronym} access acknowledge the policy during onboarding and annually thereafter.`;
      if (controlId === 'AC-2') return `Account management for ${s.acronym} is performed through ${s.idp} with automated provisioning and deprovisioning workflows. New accounts require supervisor approval via ${s.ticketSystem} workflow. ${s.isso} conducts access reviews every 90 days using automated reports from ${s.auth}. Accounts inactive for 45 days are automatically disabled. Terminated users are deprovisioned within 24 hours per HR integration. All account lifecycle events are logged to ${s.siem} for audit purposes. Emergency accounts require AO approval and are limited to 72-hour validity.`;
      if (controlId === 'AC-3') return `Access enforcement in ${s.acronym} uses role-based access control (RBAC) with eight defined role tiers. ${s.auth} enforces authentication requirements before granting access. ${s.db} implements row-level security for data isolation between organizational units. All access decisions are logged to ${s.siem}. API endpoints enforce authorization checks using middleware that validates JWT claims against role permissions. Administrative access requires additional MFA step-up authentication.`;
      if (controlId === 'AC-4') return `Information flow enforcement within ${s.acronym} is implemented through ${s.firewall} rules that restrict data movement between security domains. ${s.hosting} network segmentation isolates ${s.dataTypes} processing from public-facing components. Data loss prevention rules in ${s.firewall} prevent unauthorized transmission of ${s.dataTypes}. All cross-boundary data flows are logged and monitored by ${s.siem}.`;
      if (enhNum) return `${s.orgName} implements ${controlId} for the ${s.acronym} system. This enhancement to ${baseId} is enforced through ${s.auth} with additional technical controls provided by ${s.hosting}. The ${getResponsibleRole(controlId, s)} ensures configuration compliance through ${s.sccm}. Implementation details are documented in ${s.procPrefix}-AC-${baseId.split('-')[1]}(${enhNum}) and verified during quarterly security assessments. All relevant activities are monitored by ${s.siem}.`;
      return `${s.orgName} enforces ${controlId} within the ${s.acronym} system boundary using ${s.auth} for authentication and authorization. Access control policies defined in ${s.policyPrefix}-AC-001 specify requirements for ${controlId}. Technical enforcement is provided through ${s.hosting} security controls and ${s.firewall}. The ${s.isso} monitors compliance through ${s.siem} dashboards and conducts quarterly access reviews per ${s.procPrefix}-AC-REVIEW-001.`;
    },
    AT: () => {
      if (controlId === 'AT-1') return `${s.orgName} maintains Security Awareness and Training Policy ${s.policyPrefix}-AT-001 v3.0. The policy establishes requirements for role-based security training, annual awareness refresher training, and specialized training for personnel with significant security responsibilities within the ${s.acronym} system. The Training Manager coordinates training delivery and tracks completion through ${s.ticketSystem}. Policy is reviewed annually by the ${s.ciso}.`;
      return `${s.orgName} implements ${controlId} through its comprehensive security training program documented in ${s.policyPrefix}-AT-001. All ${s.acronym} users complete annual security awareness training covering ${s.dataTypes} handling, phishing recognition, and incident reporting. Role-based training is provided to system administrators, developers, and security personnel. Training completion is tracked in ${s.ticketSystem} with automated reminders for overdue training. The Training Manager reports completion metrics to the ${s.ciso} monthly.`;
    },
    AU: () => {
      if (controlId === 'AU-1') return `${s.orgName} has established Audit and Accountability Policy ${s.policyPrefix}-AU-001 v3.0 for the ${s.acronym} system. The policy defines auditable events, audit record content requirements, audit storage capacity, audit review and analysis procedures, and audit record retention (365 days minimum). Procedures are documented in ${s.procPrefix}-AU-001. The Security Engineer maintains audit infrastructure on ${s.hosting} with events forwarded to ${s.siem}.`;
      if (controlId === 'AU-2') return `${s.acronym} logs all auditable events across all system tiers: application events (authentication, authorization decisions, data access, configuration changes), infrastructure events from ${s.hosting}, database audit logs from ${s.db}, and network events from ${s.firewall}. Event types are reviewed annually and updated based on threat intelligence. All events are forwarded to ${s.siem} within 60 seconds for real-time correlation and alerting. The Security Engineer maintains the audit event catalog in ${s.procPrefix}-AU-002.`;
      if (controlId === 'AU-12') return `${s.acronym} generates audit records for all events defined in AU-2 at each processing component. ${s.hosting} infrastructure generates platform-level audit records. Application code generates structured audit entries for business logic events. ${s.db} generates query audit logs. All audit generation is configured per ${s.procPrefix}-AU-012 and validated monthly by the Security Engineer. Audit generation cannot be disabled without ${s.isso} approval and change control via ${s.ticketSystem}.`;
      return `${s.orgName} implements ${controlId} for the ${s.acronym} system. ${s.siem} provides centralized audit management with automated collection from ${s.hosting} infrastructure, ${s.db} audit logs, and application event streams. Audit records include timestamp, source, event type, user identity, outcome, and affected resources. The Security Engineer reviews audit configurations quarterly per ${s.procPrefix}-AU-001. Audit data is retained for 365 days with integrity protections.`;
    },
    CA: () => {
      if (controlId === 'CA-1') return `${s.orgName} maintains Security Assessment and Authorization Policy ${s.policyPrefix}-CA-001 v2.0 for the ${s.acronym} system. The policy establishes requirements for security control assessments, system authorization, continuous monitoring, and plan of action and milestones management. The ${s.isso} coordinates assessment activities with the ${s.certAuth}. Procedures are documented in ${s.procPrefix}-CA-001 and reviewed annually.`;
      if (controlId === 'CA-7') return `Continuous monitoring for ${s.acronym} is performed through automated and manual checks: ${s.scanner} vulnerability scans (weekly for all assets), ${s.siem} correlation rules (continuous real-time monitoring), ${s.sccm} configuration compliance (daily baseline checks), and ${s.edr} endpoint monitoring (continuous). The ${s.isso} reviews monthly continuous monitoring reports and conducts quarterly deep-dive reviews. Findings are tracked in POA&M with risk-prioritized remediation timelines.`;
      return `${s.orgName} implements ${controlId} for the ${s.acronym} system as part of its security assessment program. The ${s.isso} coordinates with the ${s.certAuth} to ensure compliance with FedRAMP assessment requirements. Implementation details are documented in ${s.procPrefix}-CA-${baseId.split('-')[1]}. Assessment artifacts are maintained in the ${s.acronym} security authorization package and reviewed during annual assessments.`;
    },
    CM: () => {
      if (controlId === 'CM-1') return `${s.orgName} has established Configuration Management Policy ${s.policyPrefix}-CM-001 v3.0 for the ${s.acronym} system. The policy covers baseline configurations, change management, security impact analysis, access restrictions for change, least functionality, and configuration settings. ${s.sccm} enforces baselines across ${s.hosting} infrastructure. The System Administrator maintains the CM program with ${s.isso} oversight. Procedures documented in ${s.procPrefix}-CM-001.`;
      if (controlId === 'CM-2') return `Security configuration baselines for ${s.acronym} are established and maintained using ${s.sccm}. Baselines cover ${s.hosting} infrastructure, ${s.db} configurations, application settings, and network device configurations from ${s.firewall}. Baseline deviations require change control approval via ${s.ticketSystem} with security impact analysis. The System Administrator reviews and updates baselines quarterly. Current baselines are documented in ${s.procPrefix}-CM-002.`;
      if (controlId === 'CM-6') return `${s.acronym} enforces security configuration settings through ${s.sccm} with automated compliance checking. Configuration settings align with vendor hardening guides and CIS benchmarks for ${s.hosting} components. Deviations are documented with business justification and compensating controls, approved by the ${s.isso}. Compliance scans run daily with results reported to ${s.siem}. The System Administrator remediates non-compliant settings within 30 days per ${s.procPrefix}-CM-006.`;
      return `${s.orgName} implements ${controlId} for the ${s.acronym} system through ${s.sccm} and infrastructure-as-code practices. Configuration changes are managed through ${s.ticketSystem} with security impact analysis by the ${s.isso}. ${s.hosting} configurations are version-controlled and deployed through ${s.cicd}. The System Administrator reviews configuration compliance weekly using ${s.sccm} reports.`;
    },
    CP: () => {
      if (controlId === 'CP-1') return `${s.orgName} maintains Contingency Planning Policy ${s.policyPrefix}-CP-001 v2.0 for the ${s.acronym} system. The policy covers contingency plan development, testing, training, backup and recovery, alternate processing and storage sites, and telecommunications. The Contingency Planning Coordinator maintains the plan with annual reviews and updates. Procedures documented in ${s.procPrefix}-CP-001.`;
      if (controlId === 'CP-9') return `${s.acronym} data backups are performed automatically by ${s.db} with the following schedule: full backups daily (retained 30 days), incremental backups every 6 hours, and transaction log backups every 15 minutes. Backups are encrypted using AES-256 and stored in a geographically separate region. Backup integrity is verified weekly through automated restore testing. The System Administrator monitors backup completion via ${s.siem} alerts.`;
      return `${s.orgName} implements ${controlId} for the ${s.acronym} system as part of its business continuity program. ${s.hosting} provides infrastructure-level resilience with automatic failover capabilities. The Contingency Planning Coordinator maintains recovery procedures in ${s.procPrefix}-CP-${baseId.split('-')[1]} and coordinates annual testing. Recovery objectives are: RTO of 4 hours and RPO of 1 hour for ${s.dataTypes}.`;
    },
    IA: () => {
      if (controlId === 'IA-1') return `${s.orgName} maintains Identification and Authentication Policy ${s.policyPrefix}-IA-001 v3.0 for the ${s.acronym} system. The policy establishes requirements for user identification, authenticator management, MFA, device identification, and federated identity. ${s.auth} serves as the primary identity provider. The Identity Administrator manages the IA infrastructure. Procedures documented in ${s.procPrefix}-IA-001.`;
      if (controlId === 'IA-2') return `All ${s.acronym} users are uniquely identified and authenticated through ${s.auth}. Network and local access requires valid credentials verified against the ${s.idp} identity store. Session tokens are cryptographically signed and expire after 8 hours of inactivity. Failed authentication attempts are logged to ${s.siem} and accounts are locked after 5 consecutive failures. The Identity Administrator manages user provisioning per ${s.procPrefix}-IA-002.`;
      if (controlId === 'IA-2(1)') return `${s.acronym} enforces multi-factor authentication for all privileged access through ${s.auth}. Privileged users must present a valid password plus a second factor (hardware token or authenticator application) before accessing administrative functions. MFA is enforced at the ${s.idp} level and cannot be bypassed. MFA configuration is documented in ${s.procPrefix}-IA-002-01 and audited quarterly.`;
      return `${s.orgName} implements ${controlId} for the ${s.acronym} system through ${s.auth} and ${s.idp}. Authentication policies enforce password complexity (16-character minimum, no dictionary words), account lockout (5 attempts), and session management. The Identity Administrator reviews authentication configurations quarterly. All authentication events are logged to ${s.siem} for security monitoring.`;
    },
    IR: () => {
      if (controlId === 'IR-1') return `${s.orgName} maintains Incident Response Policy ${s.policyPrefix}-IR-001 v3.0 for the ${s.acronym} system. The policy establishes the incident response program including preparation, detection and analysis, containment, eradication, recovery, and post-incident activities. The Incident Response Lead coordinates the program with 24/7 coverage via ${s.incidentEmail}. Procedures documented in ${s.procPrefix}-IR-001, reviewed annually.`;
      if (controlId === 'IR-4') return `${s.acronym} incident handling follows the process defined in ${s.procPrefix}-IR-004: (1) Detection via ${s.siem} and ${s.edr} automated alerts, (2) Triage by SOC analysts within 15 minutes, (3) Containment actions per severity-specific playbooks, (4) Eradication and recovery with change control, (5) Lessons learned within 5 business days. All incidents are tracked in ${s.ticketSystem} with classification per ${s.policyPrefix}-IR-001. The Incident Response Lead briefs ${s.ciso} on significant incidents within 1 hour.`;
      return `${s.orgName} implements ${controlId} for the ${s.acronym} system as part of its incident response program. ${s.monitoring} provides detection capabilities with automated alerting to ${s.incidentEmail}. The Incident Response Lead coordinates response activities per ${s.procPrefix}-IR-${baseId.split('-')[1]}. Incident metrics are reported to the ${s.ciso} monthly and used to improve detection and response procedures.`;
    },
    MA: () => {
      return `${s.orgName} implements ${controlId} for the ${s.acronym} system. System maintenance is scheduled during approved maintenance windows and requires change control approval via ${s.ticketSystem}. ${s.hosting} infrastructure maintenance is managed by the cloud service provider under the shared responsibility model. Application-level maintenance is performed by the ${s.sysAdmin} using ${s.cicd} pipelines. Maintenance activities are logged to ${s.siem} and reviewed by the ${s.isso}. Policy documented in ${s.policyPrefix}-MA-001.`;
    },
    MP: () => {
      return `${s.orgName} implements ${controlId} for the ${s.acronym} system. As a cloud-hosted system on ${s.hosting}, physical media protections are primarily the responsibility of the CSP. ${s.orgName} enforces digital media controls including encryption of ${s.dataTypes} at rest using ${s.db} encryption and in transit via TLS 1.3. Removable media usage is restricted by endpoint security policies enforced through ${s.edr}. Policy documented in ${s.policyPrefix}-MP-001 with procedures in ${s.procPrefix}-MP-001.`;
    },
    PE: () => {
      return `${s.orgName} implements ${controlId} through the ${s.hosting} cloud service provider under the shared responsibility model. Physical and environmental protections for the underlying infrastructure are inherited from the CSP's FedRAMP authorization. ${s.orgName} verifies CSP physical security controls annually through review of the CSP's FedRAMP authorization package and continuous monitoring reports. Office facilities housing development workstations are secured with badge access, visitor logs, and camera surveillance per ${s.policyPrefix}-PE-001.`;
    },
    PL: () => {
      if (controlId === 'PL-1') return `${s.orgName} maintains Planning Policy ${s.policyPrefix}-PL-001 v2.0 for the ${s.acronym} system. The policy establishes requirements for system security plans, rules of behavior, security architecture, and information security workforce development. The ${s.ciso} reviews and updates the policy annually. Procedures are documented in ${s.procPrefix}-PL-001.`;
      if (controlId === 'PL-2') return `The ${s.acronym} System Security Plan (SSP) is maintained by the ${s.isso} and documents the system boundary, operating environment, security categorization, control implementations, and interconnections. The SSP is reviewed and updated at least annually or upon significant system changes. The current SSP version addresses all 287 FedRAMP Moderate baseline controls. The SSP is stored in the ${s.acronym} authorization package and available for ${s.certAuth} review.`;
      return `${s.orgName} implements ${controlId} for the ${s.acronym} system. The ${s.ciso} oversees planning activities with the ${s.isso} responsible for day-to-day security planning. Planning documents are maintained in the ${s.acronym} authorization package and reviewed annually. Implementation details documented in ${s.procPrefix}-PL-${baseId.split('-')[1]}.`;
    },
    PS: () => {
      if (controlId === 'PS-1') return `${s.orgName} maintains Personnel Security Policy ${s.policyPrefix}-PS-001 v2.0. The policy establishes requirements for position risk designation, personnel screening, personnel termination and transfer, access agreements, third-party personnel security, and personnel sanctions. HR Security Liaison coordinates with the ${s.isso} on personnel security matters. Procedures documented in ${s.procPrefix}-PS-001, reviewed annually.`;
      return `${s.orgName} implements ${controlId} through its personnel security program documented in ${s.policyPrefix}-PS-001. Personnel with access to ${s.acronym} and ${s.dataTypes} undergo background investigations commensurate with position risk designation. The HR Security Liaison coordinates with the ${s.isso} on access agreements, transfers, and terminations. Personnel actions affecting system access are processed within 24 hours through ${s.ticketSystem} workflows.`;
    },
    RA: () => {
      if (controlId === 'RA-1') return `${s.orgName} maintains Risk Assessment Policy ${s.policyPrefix}-RA-001 v2.0 for the ${s.acronym} system. The policy establishes requirements for security categorization, risk assessments, vulnerability scanning, and risk response. The Risk Assessment Lead coordinates annual risk assessments with input from the ${s.isso} and system owners. Procedures documented in ${s.procPrefix}-RA-001.`;
      if (controlId === 'RA-5') return `Vulnerability scanning for ${s.acronym} is performed using ${s.scanner} on the following schedule: authenticated scans of all system components weekly, web application scans monthly, and ad-hoc scans within 72 hours of new vulnerability disclosures. Scan results are correlated with threat intelligence in ${s.siem}. Critical vulnerabilities are remediated within 30 days, high within 90 days per ${s.procPrefix}-RA-005. The Risk Assessment Lead reviews scan reports and tracks remediation in ${s.ticketSystem}.`;
      return `${s.orgName} implements ${controlId} for the ${s.acronym} system as part of its risk management program. Risk assessments are conducted annually and upon significant system changes. ${s.scanner} provides technical vulnerability data, while threat intelligence from ${s.siem} informs risk prioritization. The Risk Assessment Lead maintains the risk register and reports findings to the ${s.ciso}. Documentation maintained in ${s.procPrefix}-RA-${baseId.split('-')[1]}.`;
    },
    SA: () => {
      return `${s.orgName} implements ${controlId} for the ${s.acronym} system through its acquisition and development security program. Security requirements are incorporated into system development lifecycle activities per ${s.policyPrefix}-SA-001. ${s.cicd} enforces automated security testing including SAST, DAST, and dependency scanning before deployment to ${s.hosting}. The Acquisition Security Lead reviews third-party components and services for security compliance. Documentation maintained in ${s.procPrefix}-SA-${baseId.split('-')[1]}.`;
    },
    SC: () => {
      if (controlId === 'SC-1') return `${s.orgName} maintains System and Communications Protection Policy ${s.policyPrefix}-SC-001 v3.0 for the ${s.acronym} system. The policy addresses boundary protection, transmission confidentiality, cryptographic protections, denial of service protection, and session management. The Network Security Engineer implements technical controls on ${s.hosting} with ${s.firewall}. Procedures documented in ${s.procPrefix}-SC-001, reviewed annually.`;
      if (controlId === 'SC-7') return `${s.acronym} boundary protection is implemented through ${s.firewall} with deny-all, permit-by-exception rules. Network segmentation isolates ${s.dataTypes} processing, management interfaces, and public-facing services. All inbound traffic is inspected for malicious content. Outbound traffic is filtered to prevent data exfiltration. ${s.monitoring} provides real-time visibility into boundary traffic. The Network Security Engineer reviews firewall rules quarterly per ${s.procPrefix}-SC-007.`;
      if (controlId === 'SC-8') return `${s.acronym} protects transmitted ${s.dataTypes} using TLS 1.3 for all external communications. HSTS headers enforce encrypted connections with a minimum 1-year max-age directive. Internal service-to-service communication uses mutual TLS (mTLS) with certificate validation. Certificate management is automated through ${s.hosting} certificate services. The Network Security Engineer monitors certificate expiration and TLS configuration compliance via ${s.siem}.`;
      if (controlId === 'SC-28') return `${s.acronym} protects ${s.dataTypes} at rest using ${s.db} native encryption (AES-256). Encryption keys are managed through the cloud provider's key management service with annual key rotation. Backup data is encrypted using separate encryption keys. The Network Security Engineer validates encryption configurations quarterly. Encryption status is monitored through ${s.siem} compliance dashboards.`;
      return `${s.orgName} implements ${controlId} for the ${s.acronym} system. ${s.firewall} and ${s.hosting} security features provide network-level protections. Cryptographic controls use FIPS 140-2 validated modules for ${s.dataTypes} protection. The Network Security Engineer maintains SC controls per ${s.procPrefix}-SC-${baseId.split('-')[1]} with configurations validated through ${s.sccm} compliance scans.`;
    },
    SI: () => {
      if (controlId === 'SI-1') return `${s.orgName} maintains System and Information Integrity Policy ${s.policyPrefix}-SI-001 v3.0 for the ${s.acronym} system. The policy covers flaw remediation, malicious code protection, information system monitoring, security alerts, software and information integrity, and spam protection. The Security Engineer implements technical controls. Procedures documented in ${s.procPrefix}-SI-001, reviewed annually by the ${s.ciso}.`;
      if (controlId === 'SI-2') return `Flaw remediation for ${s.acronym} follows the patching schedule in ${s.procPrefix}-SI-002: critical patches within 30 days, high within 60 days, moderate within 90 days. ${s.scanner} identifies vulnerabilities and ${s.sccm} deploys patches to ${s.hosting} components. The Security Engineer validates patch deployment through compliance scans. Emergency patches follow the expedited change control process in ${s.ticketSystem}. Patch status is reported to the ${s.isso} weekly.`;
      if (controlId === 'SI-3') return `Malicious code protection for ${s.acronym} is provided by ${s.edr} deployed on all endpoints and servers. Signature updates are applied automatically within 4 hours of release. Real-time scanning covers file access, email attachments, and web downloads. ${s.edr} behavioral analysis detects zero-day threats. Alerts are forwarded to ${s.siem} for correlation. The Security Engineer reviews malware detection events daily per ${s.procPrefix}-SI-003.`;
      if (controlId === 'SI-4') return `${s.acronym} information system monitoring is implemented through ${s.monitoring}. ${s.siem} performs real-time event correlation with custom detection rules for ${s.dataTypes} protection scenarios. ${s.edr} monitors endpoint activity for anomalous behavior. Network monitoring via ${s.firewall} detects unauthorized connections. The Security Engineer reviews monitoring dashboards daily and tunes detection rules monthly per ${s.procPrefix}-SI-004. Automated alerts notify ${s.incidentEmail} within 5 minutes of detection.`;
      return `${s.orgName} implements ${controlId} for the ${s.acronym} system. ${s.edr} and ${s.siem} provide defense-in-depth for system integrity. ${s.scanner} validates system integrity through regular scans. The Security Engineer maintains SI controls per ${s.procPrefix}-SI-${baseId.split('-')[1]} and reports findings to the ${s.isso}. All integrity events are logged to ${s.siem} for continuous monitoring.`;
    },
    SR: () => {
      return `${s.orgName} implements ${controlId} for the ${s.acronym} system through its supply chain risk management program. Third-party components deployed on ${s.hosting} are assessed for security risks before acquisition. ${s.cicd} includes dependency vulnerability scanning using ${s.scanner}. The Supply Chain Risk Manager maintains the approved vendor list and reviews supply chain risks quarterly. Documentation maintained in ${s.policyPrefix}-SR-001 and ${s.procPrefix}-SR-${baseId.split('-')[1]}.`;
    },
  };

  const generator = narratives[family];
  if (generator) return generator();

  // Fallback for any unmapped families
  return `${s.orgName} implements ${controlId} for the ${s.acronym} system in accordance with ${s.policyPrefix}-${family}-001. Technical controls are enforced through ${s.hosting} security features and monitored by ${s.siem}. The ${getResponsibleRole(controlId, s)} ensures ongoing compliance through quarterly reviews and continuous monitoring. Implementation details are documented in ${s.procPrefix}-${family}-${baseId.split('-')[1]}.`;
}

// ============================================================================
// Assessment Result and Risk Level
// ============================================================================

function getAssessmentResult(status) {
  switch (status) {
    case 'implemented': return 'satisfied';
    case 'partially_implemented': return 'other_than_satisfied';
    case 'planned': return 'not_assessed';
    case 'alternative': return 'satisfied';
    case 'not_applicable': return 'not_assessed';
    default: return 'not_assessed';
  }
}

function getRiskLevel(status) {
  switch (status) {
    case 'partially_implemented': return "'moderate'";
    case 'planned': return "'moderate'";
    default: return 'NULL';
  }
}

// ============================================================================
// Main Generation
// ============================================================================

function main() {
  const lines = [];
  lines.push('-- ============================================================================');
  lines.push('-- Migration: migrate-040-control-implementations.sql');
  lines.push('-- FedRAMP Moderate control implementations for MFEHR and FC360 demo systems');
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push('-- Total: 574 implementation records (287 controls x 2 systems)');
  lines.push('-- ============================================================================');

  // Insert org and system definitions (INSERT OR IGNORE for idempotency)
  lines.push('');
  lines.push('-- Organization and system prerequisites (idempotent)');
  lines.push("INSERT OR IGNORE INTO organizations (id, name, subscription_tier) VALUES ('org_001', 'Patriot Health Systems', 'enterprise');");
  lines.push('');
  lines.push("INSERT OR IGNORE INTO systems (id, org_id, name, acronym, description, impact_level, status, deployment_model, service_model) VALUES ('sys-phs-001', 'org_001', 'MedForge Electronic Health Records', 'MFEHR', 'Cloud-hosted EHR system serving VA medical centers', 'moderate', 'authorized', 'cloud', 'SaaS');");
  lines.push('');
  lines.push("INSERT OR IGNORE INTO systems (id, org_id, name, acronym, description, impact_level, status, deployment_model, service_model) VALUES ('sys-001', 'org_001', 'ForgeComply 360 Platform', 'FC360', 'Enterprise compliance automation platform hosted on Cloudflare edge infrastructure', 'moderate', 'authorized', 'cloud', 'SaaS');");

  const statusCounts = {};
  let totalInserts = 0;

  for (const [sysId, sys] of Object.entries(SYSTEMS)) {
    lines.push('');
    lines.push('-- ============================================================================');
    lines.push(`-- ${sys.name} (${sys.acronym}) — ${sysId}`);
    lines.push('-- ============================================================================');

    for (const controlId of FEDRAMP_MOD_CONTROLS) {
      const status = getStatus(controlId);
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      const narrative = generateNarrative(controlId, status, sys);
      const role = getResponsibleRole(controlId, sys);
      const assessmentResult = getAssessmentResult(status);
      const riskLevel = getRiskLevel(status);
      const implDate = status === 'planned' ? 'NULL' : "'2026-01-20'";
      const assessDate = assessmentResult === 'not_assessed' ? 'NULL' : "'2026-02-15'";

      const metadata = {
        evidence: `${sys.policyPrefix}-${getControlFamily(controlId)}-001, ${sys.procPrefix}-${getControlFamily(controlId)}-${controlId.replace(/[^0-9]/g, '').substring(0, 3) || '001'}`,
        assessed_by: sysId === 'sys-phs-001' ? 'user-phs-002' : 'user-001',
        next_assessment: '2026-08-15',
      };

      lines.push(
        `INSERT OR REPLACE INTO control_implementations (org_id, system_id, framework_id, control_id, status, implementation_description, responsible_role, implementation_date, last_assessed_date, assessment_result, risk_level, metadata, created_at, updated_at) ` +
        `VALUES ('${sys.org_id}', '${sysId}', 'fedramp-moderate', '${sqlEscape(controlId)}', '${status}', '${sqlEscape(narrative)}', '${sqlEscape(role)}', ${implDate}, ${assessDate}, ${assessmentResult === 'not_assessed' ? 'NULL' : `'${assessmentResult}'`}, ${riskLevel}, '${sqlEscape(JSON.stringify(metadata))}', '2026-01-20 09:00:00', '2026-02-15 14:00:00');`
      );
      totalInserts++;
    }
  }

  fs.writeFileSync(OUTPUT, lines.join('\n'));
  const fileSize = (fs.statSync(OUTPUT).size / 1024).toFixed(1);

  console.log(`\nGenerated: ${OUTPUT} (${fileSize} KB)`);
  console.log(`Total implementation records: ${totalInserts}`);
  console.log('\nStatus distribution (both systems combined):');
  for (const [status, count] of Object.entries(statusCounts).sort()) {
    const pct = ((count / totalInserts) * 100).toFixed(1);
    console.log(`  ${status}: ${count} (${pct}%)`);
  }
}

main();
