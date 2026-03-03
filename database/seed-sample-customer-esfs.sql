-- ============================================================================
-- ForgeComply 360 - Sample Customer Seed Data
-- Customer: Eagle Shield Federal Services (ESFS)
-- Scenario: Federal IT contractor with EXISTING ATO expiring in 6 months.
--           System is authorized and in continuous monitoring. Organization
--           needs to generate/update ATO renewal documents (SSP, SAR, CM reports).
-- Frameworks: NIST 800-53 Rev 5, FISMA, CMMC Level 2
-- Purpose:  Demonstrate ATO renewal workflow, document generation, continuous
--           monitoring, and vulnerability scan import for Forge Reporter testing
-- ============================================================================
-- Run against D1 database after migrate-023 has been applied.
-- Organization:  org_002
-- Demo Password: ForgeDemo2026!
-- Password hash: PBKDF2-SHA256, 100K iterations
-- ============================================================================

-- ========================================
-- 1. ORGANIZATION
-- ========================================
INSERT OR IGNORE INTO organizations (id, name, industry, size, experience_type, subscription_tier, subscription_status, settings, max_frameworks, max_systems, max_users, created_at, updated_at)
VALUES (
  'org_002',
  'Eagle Shield Federal Services',
  'federal_it',
  '185',
  'federal',
  'federal',
  'active',
  '{"industry": "federal_it", "employees": 185, "cage_code": "7DEF2", "duns": "065823791", "naics": "541519", "annual_revenue": "$28M", "hq_location": "Reston, VA", "clearance_level": "Top Secret", "domain": "eagleshield.gov.contractor", "set_aside": "SDVOSB", "features": {"comply": true, "soc": true, "redops": true, "vendorguard": true, "forgeml": true}}',
  10,
  10,
  25,
  '2023-06-01 09:00:00',
  '2026-02-28 08:00:00'
);

-- ========================================
-- 2. USERS (6 demo users)
-- ========================================
-- All use password: ForgeDemo2026!
-- PBKDF2-SHA256, 100K iterations
-- Salt: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2
-- Hash: a17b334b4cfc932e35a3014a4b70ff90a8c6c903b162e3383647f86d5197a544

INSERT OR IGNORE INTO users (id, org_id, email, password_hash, salt, name, role, mfa_enabled, status, onboarding_completed, created_at, updated_at)
VALUES
  ('user-esfs-001', 'org_002', 'robert.hayes@eagleshield.com',
   'a17b334b4cfc932e35a3014a4b70ff90a8c6c903b162e3383647f86d5197a544',
   'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
   'Col. Robert Hayes (Ret.)', 'owner', 0, 'active', 1, '2023-06-01 09:00:00', '2026-02-28 08:00:00'),

  ('user-esfs-002', 'org_002', 'jennifer.walsh@eagleshield.com',
   'a17b334b4cfc932e35a3014a4b70ff90a8c6c903b162e3383647f86d5197a544',
   'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
   'Jennifer Walsh', 'admin', 0, 'active', 1, '2023-06-01 10:00:00', '2026-02-28 08:00:00'),

  ('user-esfs-003', 'org_002', 'michael.torres@eagleshield.com',
   'a17b334b4cfc932e35a3014a4b70ff90a8c6c903b162e3383647f86d5197a544',
   'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
   'Michael Torres', 'manager', 0, 'active', 1, '2023-06-15 09:00:00', '2026-02-28 07:00:00'),

  ('user-esfs-004', 'org_002', 'aisha.johnson@eagleshield.com',
   'a17b334b4cfc932e35a3014a4b70ff90a8c6c903b162e3383647f86d5197a544',
   'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
   'Aisha Johnson', 'analyst', 0, 'active', 1, '2023-07-01 09:00:00', '2026-02-25 16:00:00'),

  ('user-esfs-005', 'org_002', 'kevin.park@eagleshield.com',
   'a17b334b4cfc932e35a3014a4b70ff90a8c6c903b162e3383647f86d5197a544',
   'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
   'Kevin Park', 'analyst', 0, 'active', 1, '2023-07-15 09:00:00', '2026-02-28 06:00:00'),

  ('user-esfs-006', 'org_002', 'sandra.chen@eagleshield.com',
   'a17b334b4cfc932e35a3014a4b70ff90a8c6c903b162e3383647f86d5197a544',
   'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
   'Sandra Chen', 'viewer', 0, 'active', 1, '2023-08-01 09:00:00', '2026-02-20 14:00:00');

-- ========================================
-- 3. SYSTEMS (2 authorized systems)
-- ========================================
INSERT OR IGNORE INTO systems (id, org_id, name, acronym, description, impact_level, status, authorization_date, authorization_expiry, system_owner, authorizing_official, security_officer, boundary_description, deployment_model, service_model, metadata, created_at, updated_at)
VALUES
  ('sys-esfs-001', 'org_002', 'Federal Case Management System', 'FCMS',
   'Web-based case management system for DHS immigration case tracking. Processes CUI and PII including case records, applicant information, and adjudication decisions. Deployed on Azure Government Cloud (US Gov Virginia). Serves approximately 2,500 DHS case workers across 15 field offices.',
   'moderate', 'authorized', '2023-09-15', '2026-09-15',
   'Col. Robert Hayes (Ret.)', 'DHS Authorizing Official', 'Jennifer Walsh',
   'The FCMS boundary includes all components hosted in Azure Government (US Gov Virginia region): IIS web servers, .NET application tier, SQL Server 2022 Always On cluster, Active Directory Domain Services, AD FS for PIV authentication, SCCM for patch management, and Palo Alto PA-3260 firewall. External connections include DHS case data feeds via MuleSoft ESB and Splunk Enterprise SIEM.',
   'government_cloud', 'SaaS',
   '{"data_types": ["CUI", "PII", "Law Enforcement Sensitive"], "system_type": "major_application", "isso_id": "user-esfs-003", "issm_id": "user-esfs-002", "agency": "DHS", "component": "USCIS"}',
   '2023-06-01 09:00:00', '2026-02-28 08:00:00'),

  ('sys-esfs-002', 'org_002', 'Secure Document Repository', 'SDR',
   'Document storage and collaboration platform for unclassified agency materials. Built on SharePoint Server 2019 on Azure Government. Provides document versioning, workflow approvals, and search capabilities for agency staff.',
   'low', 'authorized', '2024-06-01', '2027-06-01',
   'Jennifer Walsh', 'DHS Authorizing Official', 'Michael Torres',
   'The SDR boundary includes SharePoint Server 2019, SQL Server for content database, SharePoint Search service, and backup servers. All components within a dedicated Azure Government subnet with no direct internet access.',
   'government_cloud', 'SaaS',
   '{"data_types": ["Unclassified", "FOUO"], "system_type": "minor_application", "isso_id": "user-esfs-003"}',
   '2024-03-01 09:00:00', '2026-02-28 08:00:00');

-- ========================================
-- 4. ORGANIZATION FRAMEWORKS
-- ========================================
INSERT OR IGNORE INTO organization_frameworks (id, org_id, framework_id, enabled, is_primary) VALUES
  ('of-esfs-001', 'org_002', 'nist-800-53-r5', 1, 1),
  ('of-esfs-002', 'org_002', 'cmmc-l2', 1, 0),
  ('of-esfs-003', 'org_002', 'nist-800-171-r3', 1, 0);

-- ========================================
-- 5. ASSETS (16 assets)
-- ========================================
INSERT OR IGNORE INTO assets (id, org_id, system_id, hostname, ip_address, mac_address, asset_type, os_type, discovery_source, environment, last_seen_at, risk_score, created_at, updated_at)
VALUES
  -- FCMS System Assets (12)
  ('asset-esfs-001', 'org_002', 'sys-esfs-001', 'fcms-web-01', '10.200.1.10', '00:50:56:A1:01:01', 'server', 'Windows Server 2022', 'nessus', 'production', '2026-02-28 06:00:00', 25, '2023-06-15 10:00:00', '2026-02-28 06:00:00'),
  ('asset-esfs-002', 'org_002', 'sys-esfs-001', 'fcms-web-02', '10.200.1.11', '00:50:56:A1:01:02', 'server', 'Windows Server 2022', 'nessus', 'production', '2026-02-28 06:00:00', 25, '2023-06-15 10:00:00', '2026-02-28 06:00:00'),
  ('asset-esfs-003', 'org_002', 'sys-esfs-001', 'fcms-app-01', '10.200.2.10', '00:50:56:A1:02:01', 'server', 'Windows Server 2022', 'nessus', 'production', '2026-02-28 06:00:00', 42, '2023-06-15 10:00:00', '2026-02-28 06:00:00'),
  ('asset-esfs-004', 'org_002', 'sys-esfs-001', 'fcms-app-02', '10.200.2.11', '00:50:56:A1:02:02', 'server', 'Windows Server 2022', 'nessus', 'production', '2026-02-28 06:00:00', 42, '2023-06-15 10:00:00', '2026-02-28 06:00:00'),
  ('asset-esfs-005', 'org_002', 'sys-esfs-001', 'fcms-db-primary', '10.200.3.10', '00:50:56:A1:03:01', 'database', 'Windows Server 2022', 'nessus', 'production', '2026-02-28 06:00:00', 38, '2023-06-15 10:00:00', '2026-02-28 06:00:00'),
  ('asset-esfs-006', 'org_002', 'sys-esfs-001', 'fcms-db-secondary', '10.200.3.11', '00:50:56:A1:03:02', 'database', 'Windows Server 2022', 'nessus', 'production', '2026-02-28 06:00:00', 30, '2023-06-15 10:00:00', '2026-02-28 06:00:00'),
  ('asset-esfs-007', 'org_002', 'sys-esfs-001', 'fcms-dc-01', '10.200.4.10', '00:50:56:A1:04:01', 'server', 'Windows Server 2022', 'nessus', 'production', '2026-02-28 06:00:00', 20, '2023-06-15 10:00:00', '2026-02-28 06:00:00'),
  ('asset-esfs-008', 'org_002', 'sys-esfs-001', 'fcms-adfs', '10.200.4.20', '00:50:56:A1:04:02', 'server', 'Windows Server 2022', 'nessus', 'production', '2026-02-28 06:00:00', 22, '2023-06-15 10:00:00', '2026-02-28 06:00:00'),
  ('asset-esfs-009', 'org_002', 'sys-esfs-001', 'fcms-sccm', '10.200.5.10', '00:50:56:A1:05:01', 'server', 'Windows Server 2022', 'nessus', 'production', '2026-02-28 06:00:00', 18, '2023-06-15 10:00:00', '2026-02-28 06:00:00'),
  ('asset-esfs-010', 'org_002', 'sys-esfs-001', 'fcms-splunk', '10.200.6.10', '00:50:56:A1:06:01', 'application', 'Linux', 'nessus', 'production', '2026-02-28 06:00:00', 15, '2023-06-15 10:00:00', '2026-02-28 06:00:00'),
  ('asset-esfs-011', 'org_002', 'sys-esfs-001', 'fcms-nessus', '10.200.6.20', '00:50:56:A1:06:02', 'application', 'Linux', 'manual', 'production', '2026-02-28 06:00:00', 12, '2023-06-15 10:00:00', '2026-02-28 06:00:00'),
  ('asset-esfs-012', 'org_002', 'sys-esfs-001', 'fcms-fw-paloalto', '10.200.0.1', NULL, 'network_device', 'PAN-OS', 'nessus', 'production', '2026-02-28 06:00:00', 10, '2023-06-15 10:00:00', '2026-02-28 06:00:00'),
  -- SDR System Assets (4)
  ('asset-esfs-013', 'org_002', 'sys-esfs-002', 'sdr-sharepoint', '10.200.10.10', '00:50:56:A2:01:01', 'application', 'Windows Server 2022', 'nessus', 'production', '2026-02-28 06:00:00', 15, '2024-03-15 10:00:00', '2026-02-28 06:00:00'),
  ('asset-esfs-014', 'org_002', 'sys-esfs-002', 'sdr-search', '10.200.10.20', '00:50:56:A2:01:02', 'server', 'Windows Server 2022', 'nessus', 'production', '2026-02-28 06:00:00', 12, '2024-03-15 10:00:00', '2026-02-28 06:00:00'),
  ('asset-esfs-015', 'org_002', 'sys-esfs-002', 'sdr-sql', '10.200.10.30', '00:50:56:A2:01:03', 'database', 'Windows Server 2022', 'nessus', 'production', '2026-02-28 06:00:00', 18, '2024-03-15 10:00:00', '2026-02-28 06:00:00'),
  ('asset-esfs-016', 'org_002', 'sys-esfs-002', 'sdr-backup', '10.200.10.40', '00:50:56:A2:01:04', 'server', 'Windows Server 2022', 'nessus', 'production', '2026-02-28 06:00:00', 8, '2024-03-15 10:00:00', '2026-02-28 06:00:00');

-- ========================================
-- 6. CONTROL IMPLEMENTATIONS (12 key controls for FCMS)
-- ========================================
INSERT OR IGNORE INTO control_implementations (id, org_id, system_id, framework_id, control_id, status, implementation_description, responsible_role, implementation_date, last_assessed_date, assessment_result, risk_level, metadata, created_at, updated_at)
VALUES
  ('ci-esfs-001', 'org_002', 'sys-esfs-001', 'nist-800-53-r5', 'AC-1', 'implemented',
   'Eagle Shield has developed Access Control Policy ESFS-AC-POL-001 v4.1 governing all access to the FCMS system. PIV-based authentication is mandatory for all users per HSPD-12 requirements. The policy is reviewed annually (last review December 2025) and addresses account management, least privilege, separation of duties, remote access via Cisco AnyConnect VPN, and session management. Procedures are documented in ESFS-AC-PROC-001 v3.2.',
   'CISO', '2023-07-01', '2025-08-15', 'satisfied', NULL,
   '{"evidence": "ESFS-AC-POL-001 v4.1, ESFS-AC-PROC-001 v3.2, Annual review minutes Dec 2025", "assessed_by": "user-esfs-004", "next_assessment": "2026-08-15"}',
   '2023-07-01 09:00:00', '2025-12-15 14:00:00'),

  ('ci-esfs-002', 'org_002', 'sys-esfs-001', 'nist-800-53-r5', 'AC-2', 'implemented',
   'Account management for FCMS is performed through Active Directory with PIV enrollment via USAccess. New accounts require supervisor approval via ServiceNow workflow. Access reviews conducted every 90 days by ISSO Torres. Accounts inactive for 45 days are automatically disabled via scheduled PowerShell task. Terminated users are deprovisioned within 24 hours per HR integration with Workday.',
   'ISSO', '2023-07-01', '2025-08-15', 'satisfied', NULL,
   '{"evidence": "AD account management procedures, ServiceNow workflows, 90-day access review reports, Workday-AD integration logs", "assessed_by": "user-esfs-004", "next_assessment": "2026-08-15"}',
   '2023-07-01 09:00:00', '2025-08-15 10:00:00'),

  ('ci-esfs-003', 'org_002', 'sys-esfs-001', 'nist-800-53-r5', 'AC-3', 'implemented',
   'Access enforcement uses AD security groups with 8 role tiers providing case-level access control. Role-Based Access Control ensures case adjudicators can only access cases assigned to their field office. All access decisions are logged to Splunk Enterprise for audit. Database-level security enforces row-level filtering based on authenticated user context.',
   'Security Engineer', '2023-07-01', '2025-08-15', 'satisfied', NULL,
   '{"evidence": "AD security group matrix, RBAC role definitions, Splunk access logs, SQL Server row-level security config", "assessed_by": "user-esfs-004", "next_assessment": "2026-08-15"}',
   '2023-07-01 09:00:00', '2025-08-15 11:00:00'),

  ('ci-esfs-004', 'org_002', 'sys-esfs-001', 'nist-800-53-r5', 'AU-2', 'implemented',
   'FCMS logs all auditable events across all system tiers: Windows Event Logs (Security, System, Application), IIS access logs with W3C extended format, SQL Server audit (login/logout, schema changes, data access), AD DS audit (authentication, group changes, policy changes). All events are forwarded to Splunk Enterprise within 60 seconds via Splunk Universal Forwarder. Minimum 365-day retention.',
   'ISSO', '2023-07-01', '2025-08-15', 'satisfied', NULL,
   '{"evidence": "Splunk UF configuration, Windows audit policy GPO, IIS logging config, SQL Server audit spec", "assessed_by": "user-esfs-004", "next_assessment": "2026-08-15"}',
   '2023-07-01 09:00:00', '2025-08-15 14:00:00'),

  ('ci-esfs-005', 'org_002', 'sys-esfs-001', 'nist-800-53-r5', 'CA-7', 'implemented',
   'Continuous monitoring is performed through automated and manual checks: Tenable Nessus credentialed scans weekly (all assets), Splunk correlation rules for security events (continuous), SCCM STIG compliance baseline scans (daily), CrowdStrike Falcon EDR monitoring (continuous). ISSO Torres reviews monthly continuous monitoring reports. Quarterly deep-dive reviews with ISSM Walsh.',
   'ISSO', '2023-09-15', '2025-08-15', 'satisfied', NULL,
   '{"evidence": "Nessus scan schedules, Splunk dashboards, SCCM compliance reports, CrowdStrike policy config, Monthly ConMon reports", "assessed_by": "user-esfs-004", "next_assessment": "2026-08-15"}',
   '2023-09-15 09:00:00', '2025-08-15 14:00:00'),

  ('ci-esfs-006', 'org_002', 'sys-esfs-001', 'nist-800-53-r5', 'CM-2', 'implemented',
   'Security configuration baselines for FCMS use DISA STIGs: Windows Server 2022 STIG V1R5, SQL Server 2022 STIG V1R1, IIS 10 STIG V2R4, .NET Framework STIG V2R1. Baselines enforced via SCCM compliance baselines and Group Policy Objects. Deviations documented in POA&M with risk acceptance from AO.',
   'System Administrator', '2023-07-01', '2025-08-15', 'satisfied', NULL,
   '{"evidence": "SCCM baseline reports, GPO settings export, STIG checklist results", "assessed_by": "user-esfs-004", "next_assessment": "2026-08-15"}',
   '2023-07-01 09:00:00', '2025-08-15 15:00:00'),

  ('ci-esfs-007', 'org_002', 'sys-esfs-001', 'nist-800-53-r5', 'CM-6', 'partially_implemented',
   'STIG compliance for FCMS servers is at 94.2% based on latest SCCM scan. 18 configuration deviations are documented: 16 have risk acceptance from AO with documented business justification and compensating controls. 2 deviations remain pending remediation (SMBv1 on legacy print integration, PowerShell v2 engine for legacy scripts). Remediation tracked in POA&M.',
   'System Administrator', '2023-07-01', '2026-02-15', 'other_than_satisfied', 'moderate',
   '{"evidence": "SCCM STIG compliance report (94.2%), Risk acceptance forms for 16 deviations, POA&M for 2 pending items", "assessed_by": "user-esfs-004", "next_assessment": "2026-05-15", "notes": "2 STIG deviations pending remediation. See POAM-ESFS-2025-012 and POAM-ESFS-2025-013."}',
   '2023-07-01 09:00:00', '2026-02-15 10:00:00'),

  ('ci-esfs-008', 'org_002', 'sys-esfs-001', 'nist-800-53-r5', 'IA-2', 'implemented',
   'Multi-factor authentication is enforced for all FCMS users: PIV card + PIN for federal employees via AD FS, CAC + PIN for DoD personnel. Password-based authentication is disabled for interactive logons. Service accounts use Managed Service Accounts (gMSA) with automatic password rotation. CyberArk PAM provides just-in-time elevated access for administrative functions.',
   'ISSO', '2023-07-01', '2025-08-15', 'satisfied', NULL,
   '{"evidence": "AD FS PIV configuration, Group Policy logon settings, CyberArk vault config, gMSA configuration", "assessed_by": "user-esfs-004", "next_assessment": "2026-08-15"}',
   '2023-07-01 09:00:00', '2025-08-15 16:00:00'),

  ('ci-esfs-009', 'org_002', 'sys-esfs-001', 'nist-800-53-r5', 'RA-5', 'implemented',
   'Vulnerability management uses Tenable Nessus Professional for weekly credentialed scans of all FCMS assets. Web application scans performed monthly using Burp Suite Pro. Quarterly penetration testing by Coalfire (3PAO). Critical vulnerabilities remediated within 72 hours per SLA. High within 30 days. Medium within 90 days. Scan results reviewed weekly by Sys Admin Park and monthly by ISSO Torres.',
   'System Administrator', '2023-07-01', '2025-08-15', 'satisfied', NULL,
   '{"evidence": "Nessus scan schedule, Weekly scan reports, Quarterly pentest reports, Remediation SLA tracking", "assessed_by": "user-esfs-004", "next_assessment": "2026-08-15"}',
   '2023-07-01 09:00:00', '2025-08-15 09:00:00'),

  ('ci-esfs-010', 'org_002', 'sys-esfs-001', 'nist-800-53-r5', 'SC-8', 'implemented',
   'All data in transit is encrypted using TLS 1.2 or TLS 1.3 with FIPS 140-2 validated modules. IIS configured with only FIPS-approved cipher suites. Internal service-to-service communication uses mutual TLS certificates. VPN connections use AES-256-GCM via Cisco AnyConnect. All deprecated protocols (SSLv3, TLS 1.0, TLS 1.1) are disabled.',
   'Security Engineer', '2023-07-01', '2025-08-15', 'satisfied', NULL,
   '{"evidence": "IIS TLS configuration, Cipher suite policy, mTLS certificates, Cisco AnyConnect config, Qualys SSL Labs scan", "assessed_by": "user-esfs-004", "next_assessment": "2026-08-15"}',
   '2023-07-01 09:00:00', '2025-08-15 10:00:00'),

  ('ci-esfs-011', 'org_002', 'sys-esfs-001', 'nist-800-53-r5', 'SI-2', 'implemented',
   'Patch management uses SCCM with monthly Patch Tuesday deployment cycle. Critical and high severity patches applied within 72 hours of release via expedited change request. Regular patches deployed during monthly maintenance window (third Saturday). Patch compliance monitored daily via SCCM dashboard. Current compliance: 97.3% for FCMS assets.',
   'System Administrator', '2023-07-01', '2025-08-15', 'satisfied', NULL,
   '{"evidence": "SCCM patch compliance reports, Change management records, Monthly patch deployment logs", "assessed_by": "user-esfs-004", "next_assessment": "2026-08-15"}',
   '2023-07-01 09:00:00', '2025-08-15 11:00:00'),

  ('ci-esfs-012', 'org_002', 'sys-esfs-001', 'nist-800-53-r5', 'IR-1', 'implemented',
   'Incident Response Policy ESFS-IR-POL-001 v3.1 defines incident categories, severity levels, response procedures, and CISA reporting requirements. Annual tabletop exercise conducted October 2025 with DHS stakeholder participation. Incident response team includes ISSM Walsh (commander), ISSO Torres (coordinator), Park (technical lead), and Johnson (documentation). 24/7 on-call rotation for critical incidents.',
   'ISSM', '2023-07-01', '2025-10-15', 'satisfied', NULL,
   '{"evidence": "ESFS-IR-POL-001 v3.1, Tabletop exercise report (Oct 2025), IRT roster and contact tree, CISA reporting procedures", "assessed_by": "user-esfs-004", "next_assessment": "2026-10-15"}',
   '2023-07-01 09:00:00', '2025-10-15 14:00:00');

-- ========================================
-- 7. POA&Ms (5 items - mix of statuses)
-- ========================================
INSERT OR IGNORE INTO poams (id, org_id, system_id, poam_id, weakness_name, weakness_description, control_id, framework_id, risk_level, status, scheduled_completion, actual_completion, milestones, responsible_party, resources_required, vendor_dependency, cost_estimate, comments, assigned_to, created_by, created_at, updated_at)
VALUES
  ('poam-esfs-001', 'org_002', 'sys-esfs-001', 'POAM-ESFS-2025-012',
   'STIG Deviation: SMBv1 Enabled on Legacy Print Server Integration',
   'SMBv1 protocol is enabled on fcms-app-01 to support legacy print server integration with the agency print room. The legacy print server (HP DesignJet T1700) requires SMBv1 for print job submission. DISA STIG V-254247 requires SMBv1 to be disabled. Risk accepted by AO with compensating controls (network segmentation, monitoring) while replacement printer is procured.',
   'CM-6', 'nist-800-53-r5', 'moderate', 'in_progress',
   '2026-04-30', NULL,
   '[{"id": 1, "description": "Submit procurement request for SMBv3-compatible printer", "due_date": "2026-01-15", "status": "completed"}, {"id": 2, "description": "Receive and configure replacement printer", "due_date": "2026-03-30", "status": "in_progress"}, {"id": 3, "description": "Migrate print workflows to new printer", "due_date": "2026-04-15", "status": "planned"}, {"id": 4, "description": "Disable SMBv1 and verify", "due_date": "2026-04-30", "status": "planned"}]',
   'Kevin Park',
   'System Administrator (8 hrs), Procurement ($12K for printer)',
   1, 12000.00,
   'Procurement approved Jan 2026. HP DesignJet Z9+ Pro ordered. Expected delivery March 2026. Compensating controls: dedicated VLAN for print traffic, Palo Alto App-ID rule restricting SMBv1 to print server only, Splunk alert for any SMBv1 traffic outside print VLAN.',
   'user-esfs-005', 'user-esfs-003', '2025-09-15 09:00:00', '2026-02-28 08:00:00'),

  ('poam-esfs-002', 'org_002', 'sys-esfs-001', 'POAM-ESFS-2025-013',
   'STIG Deviation: PowerShell v2 Engine Not Disabled',
   'PowerShell v2 engine remains enabled on fcms-app-01 and fcms-app-02 to support a legacy batch processing script that is incompatible with PowerShell 5.1. DISA STIG V-254258 requires PowerShell v2 to be disabled to prevent security bypass. Script modernization effort underway.',
   'CM-6', 'nist-800-53-r5', 'low', 'open',
   '2026-05-15', NULL,
   '[{"id": 1, "description": "Analyze legacy script dependencies on PS2", "due_date": "2026-03-01", "status": "completed"}, {"id": 2, "description": "Rewrite script for PowerShell 5.1/7", "due_date": "2026-04-15", "status": "planned"}, {"id": 3, "description": "Test modernized script in staging", "due_date": "2026-05-01", "status": "planned"}, {"id": 4, "description": "Deploy and disable PS2 engine", "due_date": "2026-05-15", "status": "planned"}]',
   'Kevin Park',
   'Developer (24 hrs), QA Analyst (8 hrs)',
   0, 5000.00,
   'Analysis complete. Script uses PS2-specific WMI cmdlets. Rewrite to use CIM cmdlets in PS5.1 is straightforward but requires regression testing of 47 batch jobs.',
   'user-esfs-005', 'user-esfs-003', '2025-09-15 10:00:00', '2026-02-15 14:00:00'),

  ('poam-esfs-003', 'org_002', 'sys-esfs-001', 'POAM-ESFS-2026-001',
   'High: OpenSSL 3.0.x Remote Code Execution (CVE-2024-12797)',
   'IIS web servers fcms-web-01 and fcms-web-02 have OpenSSL 3.0.9 installed, which is vulnerable to CVE-2024-12797 allowing remote code execution via crafted TLS handshake. CVSS 9.8. Exploitation could compromise the web tier and provide access to case management data.',
   'SI-2', 'nist-800-53-r5', 'high', 'in_progress',
   '2026-03-30', NULL,
   '[{"id": 1, "description": "Test OpenSSL 3.0.15 in staging", "due_date": "2026-03-07", "status": "completed"}, {"id": 2, "description": "Deploy to fcms-web-01 via change request", "due_date": "2026-03-14", "status": "in_progress"}, {"id": 3, "description": "Deploy to fcms-web-02", "due_date": "2026-03-21", "status": "planned"}, {"id": 4, "description": "Verify with targeted Nessus rescan", "due_date": "2026-03-30", "status": "planned"}]',
   'Kevin Park',
   'System Administrator (8 hrs), Change Advisory Board approval',
   0, 3000.00,
   'Staging test passed 2026-03-05. CR submitted for production deployment. fcms-web-01 scheduled for March 14 maintenance window.',
   'user-esfs-005', 'user-esfs-005', '2026-02-28 08:00:00', '2026-03-05 10:00:00'),

  ('poam-esfs-004', 'org_002', 'sys-esfs-001', 'POAM-ESFS-2026-002',
   'Medium: SQL Server Unpatched Cumulative Update (CU15)',
   'SQL Server 2022 on fcms-db-primary is running CU12, missing CU15 which addresses information disclosure and elevation of privilege vulnerabilities. CVSS 7.8. Patching requires Always On failover coordination.',
   'SI-2', 'nist-800-53-r5', 'moderate', 'open',
   '2026-04-15', NULL,
   '[{"id": 1, "description": "Download CU15 and test in dev", "due_date": "2026-03-15", "status": "planned"}, {"id": 2, "description": "Apply to secondary (failover)", "due_date": "2026-03-22", "status": "planned"}, {"id": 3, "description": "Failover and apply to primary", "due_date": "2026-04-05", "status": "planned"}, {"id": 4, "description": "Verify and update SCCM baseline", "due_date": "2026-04-15", "status": "planned"}]',
   'Kevin Park',
   'DBA (16 hrs), System Administrator (8 hrs)',
   0, 4000.00,
   'Requires coordinated Always On failover. Scheduling with DHS for April maintenance window.',
   'user-esfs-005', 'user-esfs-005', '2026-02-28 09:00:00', '2026-02-28 09:00:00'),

  ('poam-esfs-005', 'org_002', 'sys-esfs-001', 'POAM-ESFS-2025-010',
   'High: Expired Service Account Password Rotation',
   'Three service accounts in Active Directory had passwords older than 365 days, violating IA-5(1) requirements. Accounts used for SQL Server Agent, SCCM client push, and Splunk forwarder service.',
   'IA-5', 'nist-800-53-r5', 'high', 'completed',
   '2026-01-15', '2026-01-12',
   '[{"id": 1, "description": "Inventory all service accounts", "due_date": "2025-12-15", "status": "completed"}, {"id": 2, "description": "Convert to gMSA where possible", "due_date": "2026-01-05", "status": "completed"}, {"id": 3, "description": "Rotate remaining passwords", "due_date": "2026-01-10", "status": "completed"}, {"id": 4, "description": "Implement monitoring for password age", "due_date": "2026-01-15", "status": "completed"}]',
   'Kevin Park',
   'System Administrator (12 hrs)',
   0, 2000.00,
   'Remediation completed ahead of schedule. 2 of 3 accounts converted to gMSA with automatic rotation. Remaining account (Splunk forwarder) rotated manually and added to quarterly rotation schedule. PowerShell monitoring script deployed to alert on accounts > 90 days old.',
   'user-esfs-005', 'user-esfs-003', '2025-11-01 09:00:00', '2026-01-12 14:00:00');

-- ========================================
-- 8. RISKS (8 risk register entries)
-- ========================================
INSERT OR IGNORE INTO risks (id, org_id, system_id, risk_id, title, description, category, likelihood, impact, risk_level, treatment, treatment_plan, treatment_due_date, owner, status, related_controls, created_at, updated_at)
VALUES
  ('risk-esfs-001', 'org_002', 'sys-esfs-001', 'RISK-ESFS-001',
   'ATO Expiration Gap', 'FCMS ATO expires September 15, 2026. If annual assessment and SSP updates are not completed in time, a gap in authorization could force system shutdown, disrupting DHS case processing for 2,500 users.',
   'compliance', 2, 5, 'high', 'mitigate',
   'Maintain aggressive ATO renewal timeline: SSP update by June, 3PAO assessment by July, AO review by August. Weekly status tracking with ISSM.',
   '2026-08-31', 'Jennifer Walsh', 'in_treatment', '["CA-2", "CA-6", "PL-2"]',
   '2025-12-01 09:00:00', '2026-02-28 08:00:00'),

  ('risk-esfs-002', 'org_002', 'sys-esfs-001', 'RISK-ESFS-002',
   'Insider Threat - Privileged Users', 'System administrators and DBAs have elevated access to CUI/PII case data. Malicious or negligent insider could exfiltrate or modify case records affecting immigration decisions.',
   'operational', 2, 4, 'moderate', 'mitigate',
   'CyberArk PAM for JIT access. Splunk UBA for anomaly detection. Quarterly privileged access reviews. Background reinvestigation every 5 years.',
   '2026-06-30', 'Jennifer Walsh', 'monitored', '["AC-2", "AC-5", "AC-6", "AU-6", "PS-3"]',
   '2023-09-15 09:00:00', '2026-02-28 08:00:00'),

  ('risk-esfs-003', 'org_002', 'sys-esfs-001', 'RISK-ESFS-003',
   'Third-Party Cloud Provider Outage', 'Azure Government region outage could render FCMS unavailable. RPO 4 hours, RTO 8 hours per current DR plan. Extended outage could impact case processing deadlines.',
   'technical', 3, 4, 'high', 'transfer',
   'Azure SLA (99.99% availability). DR plan to secondary Azure Gov region. Annual DR test. Cyber insurance coverage for business interruption.',
   '2026-09-15', 'Kevin Park', 'monitored', '["CP-2", "CP-7", "CP-10"]',
   '2023-09-15 09:00:00', '2026-02-28 08:00:00'),

  ('risk-esfs-004', 'org_002', 'sys-esfs-001', 'RISK-ESFS-004',
   'Supply Chain Compromise', 'Third-party software libraries or vendor products could contain embedded vulnerabilities or backdoors (e.g., SolarWinds-type attack). FCMS uses 47 third-party components.',
   'technical', 2, 5, 'high', 'mitigate',
   'SBOM generation for all components. Dependabot automated vulnerability scanning. Vendor security assessment program. Zero trust architecture for internal services.',
   '2026-06-30', 'Jennifer Walsh', 'in_treatment', '["SA-9", "SA-12", "SR-3", "SR-6"]',
   '2024-01-15 09:00:00', '2026-02-28 08:00:00'),

  ('risk-esfs-005', 'org_002', 'sys-esfs-001', 'RISK-ESFS-005',
   'PII Data Breach via Application Vulnerability', 'SQL injection, XSS, or other OWASP Top 10 vulnerabilities in the FCMS web application could expose PII for immigration cases.',
   'compliance', 2, 5, 'high', 'mitigate',
   'Monthly web application scans. Quarterly penetration testing. Secure coding training for developers. WAF rules for common attack patterns.',
   '2026-06-30', 'Michael Torres', 'in_treatment', '["RA-5", "SA-11", "SI-2", "SI-10"]',
   '2023-09-15 09:00:00', '2026-02-28 08:00:00'),

  ('risk-esfs-006', 'org_002', 'sys-esfs-001', 'RISK-ESFS-006',
   'Ransomware Attack', 'Ransomware infection could encrypt FCMS data and systems, causing extended downtime and potential data loss. Federal systems are increasingly targeted.',
   'technical', 3, 5, 'critical', 'mitigate',
   'CrowdStrike Falcon EDR. Immutable Azure backups. Network segmentation via Palo Alto. Monthly phishing simulations. Incident response playbook for ransomware.',
   '2026-06-30', 'Jennifer Walsh', 'in_treatment', '["CP-9", "IR-4", "SI-3", "SI-4"]',
   '2024-06-01 09:00:00', '2026-02-28 08:00:00'),

  ('risk-esfs-007', 'org_002', NULL, 'RISK-ESFS-007',
   'Key Personnel Departure (ISSO)', 'Loss of ISSO Torres would impact continuous monitoring, ATO renewal timeline, and institutional knowledge. Single point of failure for day-to-day security operations.',
   'operational', 3, 3, 'moderate', 'mitigate',
   'Cross-training Johnson as backup ISSO. Document all procedures in ForgeComply 360. Succession plan briefed to ISSM Walsh.',
   '2026-06-30', 'Jennifer Walsh', 'monitored', '["PS-2", "PL-2"]',
   '2025-06-01 09:00:00', '2026-02-28 08:00:00'),

  ('risk-esfs-008', 'org_002', NULL, 'RISK-ESFS-008',
   'Budget Cuts Impacting Security Tools', 'Potential federal budget constraints could reduce funding for security tooling renewals (CrowdStrike, Splunk, Tenable licenses total $85K/year).',
   'financial', 2, 3, 'moderate', 'accept',
   'Risk accepted by CEO. Current contract includes 2-year tool licenses through 2027. Explore open-source alternatives as contingency.',
   NULL, 'Col. Robert Hayes (Ret.)', 'accepted', '["PM-3", "PM-9"]',
   '2025-10-01 09:00:00', '2026-02-28 08:00:00');

-- ========================================
-- 9. VENDORS (6 third-party providers)
-- ========================================
INSERT OR IGNORE INTO vendors (id, org_id, name, description, category, criticality, risk_tier, status, contact_name, contact_email, contract_start, contract_end, last_assessment_date, next_assessment_date, overall_risk_score, data_classification, has_baa, metadata, created_at, updated_at)
VALUES
  ('vendor-esfs-001', 'org_002', 'Microsoft Azure Government', 'Cloud infrastructure provider (IaaS/PaaS) for FCMS and SDR. Azure Government Cloud certified for FedRAMP High, DoD IL4/IL5.', 'Cloud Service Provider', 'critical', 1, 'approved', 'Federal Account Team', 'federal-support@microsoft.com', '2023-06-01', '2026-06-01', '2025-06-15', '2026-06-01', 15, 'CUI', 1, '{"fedramp_status": "High", "dod_il": "IL5", "soc2_report": "2025-03-15"}', '2023-06-01 09:00:00', '2026-02-28 08:00:00'),

  ('vendor-esfs-002', 'org_002', 'CrowdStrike', 'Endpoint Detection and Response (EDR) platform. Falcon Complete managed detection for all FCMS endpoints.', 'Endpoint Security', 'high', 1, 'approved', 'Federal Sales', 'fedsales@crowdstrike.com', '2024-01-01', '2027-01-01', '2025-07-01', '2026-07-01', 12, 'Telemetry', 0, '{"fedramp_status": "Moderate", "authorization": "FedRAMP Authorized"}', '2024-01-01 09:00:00', '2026-02-28 08:00:00'),

  ('vendor-esfs-003', 'org_002', 'Splunk (Cisco)', 'Security Information and Event Management (SIEM). Splunk Enterprise for log aggregation, correlation, and security analytics.', 'SIEM / Log Management', 'high', 1, 'approved', 'Federal Team', 'federal@splunk.com', '2023-06-01', '2026-06-01', '2025-08-01', '2026-08-01', 10, 'Log Data', 0, '{"fedramp_status": "High", "deployment": "On-premise in Azure Gov"}', '2023-06-01 09:00:00', '2026-02-28 08:00:00'),

  ('vendor-esfs-004', 'org_002', 'Cisco', 'VPN and network security. AnyConnect VPN for remote access. ISE for network access control.', 'Network Security', 'high', 2, 'approved', 'Federal SE', 'federal@cisco.com', '2023-06-01', '2026-06-01', '2025-09-01', '2026-09-01', 8, 'Network Traffic', 0, '{"fedramp_status": "High", "products": ["AnyConnect", "ISE"]}', '2023-06-01 09:00:00', '2026-02-28 08:00:00'),

  ('vendor-esfs-005', 'org_002', 'Tenable', 'Vulnerability management platform. Nessus Professional for weekly credentialed scanning of all FCMS and SDR assets.', 'Vulnerability Management', 'medium', 2, 'active', 'SE', 'sales@tenable.com', '2023-06-01', '2026-06-01', '2025-10-01', '2026-10-01', 6, 'Scan Results', 0, '{"deployment": "On-premise scanner in Azure Gov"}', '2023-06-01 09:00:00', '2026-02-28 08:00:00'),

  ('vendor-esfs-006', 'org_002', 'Coalfire', 'Third-Party Assessment Organization (3PAO). Conducts annual independent security assessments for ATO renewal.', 'Assessment Services', 'medium', 3, 'active', 'Federal Practice Lead', 'federal@coalfire.com', '2023-08-01', '2026-08-01', '2025-08-15', '2026-12-01', 5, 'Assessment Data', 1, '{"certifications": ["ISO 17020", "ISO 27001"], "3pao_listing": "FedRAMP PMO"}', '2023-08-01 09:00:00', '2026-02-28 08:00:00');

-- ========================================
-- 10. POLICIES (8 key policies)
-- ========================================
INSERT OR IGNORE INTO policies (id, org_id, title, category, description, content, status, version, effective_date, review_date, owner_id, metadata, created_by, created_at, updated_at)
VALUES
  ('policy-esfs-001', 'org_002', 'ESFS-AC-POL-001 Access Control Policy', 'access_control',
   'Comprehensive access control policy governing all access to Eagle Shield information systems. Covers account management, least privilege, separation of duties, remote access, session management, and wireless access per NIST 800-53 AC family requirements.',
   NULL, 'published', '4.1', '2025-12-15', '2026-12-15', 'user-esfs-002',
   '{"control_families": ["AC"], "pages": 28, "last_updated_by": "user-esfs-002"}',
   'user-esfs-002', '2023-06-15 09:00:00', '2025-12-15 14:00:00'),

  ('policy-esfs-002', 'org_002', 'ESFS-AU-POL-001 Audit and Accountability Policy', 'security',
   'Audit and accountability policy establishing requirements for audit logging, monitoring, review, retention, and protection across all ESFS systems. Includes CISA and agency reporting requirements.',
   NULL, 'published', '3.3', '2025-12-15', '2026-12-15', 'user-esfs-002',
   '{"control_families": ["AU"], "pages": 22}',
   'user-esfs-002', '2023-06-15 09:00:00', '2025-12-15 14:00:00'),

  ('policy-esfs-003', 'org_002', 'ESFS-CA-POL-001 Assessment and Authorization Policy', 'security',
   'Security assessment and authorization policy defining annual assessment program, 3PAO engagement procedures, ATO renewal process, and continuous monitoring requirements.',
   NULL, 'published', '2.2', '2025-12-15', '2026-12-15', 'user-esfs-002',
   '{"control_families": ["CA"], "pages": 18}',
   'user-esfs-002', '2023-06-15 09:00:00', '2025-12-15 14:00:00'),

  ('policy-esfs-004', 'org_002', 'ESFS-CM-POL-001 Configuration Management Policy', 'security',
   'Configuration management policy establishing DISA STIG baselines, change management procedures, configuration monitoring, and deviation documentation requirements.',
   NULL, 'published', '3.0', '2025-12-15', '2026-12-15', 'user-esfs-003',
   '{"control_families": ["CM"], "pages": 24}',
   'user-esfs-003', '2023-06-15 09:00:00', '2025-12-15 14:00:00'),

  ('policy-esfs-005', 'org_002', 'ESFS-IA-POL-001 Identification and Authentication Policy', 'access_control',
   'Identification and authentication policy mandating PIV/CAC authentication per HSPD-12, password requirements per NIST SP 800-63B, and multi-factor authentication for all access.',
   NULL, 'published', '2.5', '2025-12-15', '2026-12-15', 'user-esfs-002',
   '{"control_families": ["IA"], "pages": 16}',
   'user-esfs-002', '2023-06-15 09:00:00', '2025-12-15 14:00:00'),

  ('policy-esfs-006', 'org_002', 'ESFS-IR-POL-001 Incident Response Policy', 'incident_response',
   'Incident response policy defining incident categories, severity levels, response procedures, communication protocols, CISA reporting requirements, and annual testing schedule.',
   NULL, 'published', '3.1', '2025-10-15', '2026-10-15', 'user-esfs-002',
   '{"control_families": ["IR"], "pages": 32}',
   'user-esfs-002', '2023-06-15 09:00:00', '2025-10-15 14:00:00'),

  ('policy-esfs-007', 'org_002', 'ESFS-SC-POL-001 System and Communications Protection Policy', 'security',
   'System and communications protection policy governing encryption standards, boundary protection, TLS requirements, FIPS 140-2 module usage, and network architecture.',
   NULL, 'published', '2.8', '2025-12-15', '2026-12-15', 'user-esfs-003',
   '{"control_families": ["SC"], "pages": 20}',
   'user-esfs-003', '2023-06-15 09:00:00', '2025-12-15 14:00:00'),

  ('policy-esfs-008', 'org_002', 'ESFS-SI-POL-001 System and Information Integrity Policy', 'security',
   'System and information integrity policy covering patch management SLAs, vulnerability scanning requirements, malicious code protection, security alerts, and software verification.',
   NULL, 'published', '2.6', '2025-12-15', '2026-12-15', 'user-esfs-003',
   '{"control_families": ["SI"], "pages": 18}',
   'user-esfs-003', '2023-06-15 09:00:00', '2025-12-15 14:00:00');

-- ========================================
-- 11. SSP DOCUMENTS
-- ========================================
INSERT OR IGNORE INTO ssp_documents (id, org_id, system_id, framework_id, title, version, status, oscal_json, generated_by, approved_by, approved_at, metadata, created_at, updated_at)
VALUES
  ('ssp-esfs-001', 'org_002', 'sys-esfs-001', 'nist-800-53-r5',
   'Federal Case Management System (FCMS) System Security Plan', '4.1', 'approved',
   '{"system-security-plan": {"uuid": "ssp-esfs-001", "metadata": {"title": "FCMS System Security Plan", "last-modified": "2025-08-15T00:00:00Z", "version": "4.1", "oscal-version": "1.1.2"}, "import-profile": {"href": "NIST_800-53_Rev5_Moderate"}, "system-characteristics": {"system-name": "Federal Case Management System", "system-id": "FCMS", "security-sensitivity-level": "moderate", "authorization-boundary": {"description": "Azure Government US Gov Virginia"}}}}',
   'user-esfs-003', 'user-esfs-001', '2025-09-01 14:00:00',
   '{"document_path": "/documents/ssp/FCMS_SSP_v4.1_APPROVED.json", "notes": "Approved SSP from last annual assessment cycle. v4.2 update needed for ATO renewal - due June 2026. Changes since v4.1: New CrowdStrike EDR deployment, Azure region migration to US Gov Virginia, 3 new user roles added.", "ato_letter_date": "2023-09-15", "ato_expiry": "2026-09-15", "last_3pao_assessment": "2025-08-15", "next_3pao_assessment": "2026-07-31"}',
   '2023-07-01 09:00:00', '2025-09-01 14:00:00'),

  ('ssp-esfs-002', 'org_002', 'sys-esfs-002', 'nist-800-53-r5',
   'Secure Document Repository (SDR) System Security Plan', '2.0', 'approved',
   '{"system-security-plan": {"uuid": "ssp-esfs-002", "metadata": {"title": "SDR System Security Plan", "last-modified": "2024-05-15T00:00:00Z", "version": "2.0", "oscal-version": "1.1.2"}, "import-profile": {"href": "NIST_800-53_Rev5_Low"}, "system-characteristics": {"system-name": "Secure Document Repository", "system-id": "SDR", "security-sensitivity-level": "low"}}}',
   'user-esfs-003', 'user-esfs-001', '2024-06-01 14:00:00',
   '{"document_path": "/documents/ssp/SDR_SSP_v2.0_APPROVED.json", "notes": "Current approved SSP. ATO valid through June 2027. No significant changes since last assessment.", "ato_letter_date": "2024-06-01", "ato_expiry": "2027-06-01"}',
   '2024-03-01 09:00:00', '2024-06-01 14:00:00');

-- ========================================
-- 12. MONITORING CHECKS (6 continuous monitoring checks)
-- ========================================
INSERT OR IGNORE INTO monitoring_checks (id, org_id, system_id, control_id, framework_id, check_type, check_name, check_description, frequency, last_run_at, last_result, last_result_details, is_active, created_at, updated_at)
VALUES
  ('mc-esfs-001', 'org_002', 'sys-esfs-001', 'RA-5', 'nist-800-53-r5', 'automated',
   'Weekly Nessus Vulnerability Scan', 'Credentialed Nessus scan of all FCMS assets. Checks for missing patches, misconfigurations, and known vulnerabilities.',
   'weekly', '2026-02-28 02:00:00', 'warning',
   '{"total_findings": 24, "critical": 2, "high": 4, "medium": 8, "low": 10, "scan_duration_minutes": 285}',
   1, '2023-09-15 09:00:00', '2026-02-28 07:00:00'),

  ('mc-esfs-002', 'org_002', 'sys-esfs-001', 'CM-2', 'nist-800-53-r5', 'automated',
   'SCCM STIG Compliance Baseline', 'Daily SCCM compliance scan against DISA STIG baselines for all Windows servers.',
   'daily', '2026-02-28 06:00:00', 'warning',
   '{"compliance_percentage": 94.2, "total_settings": 412, "compliant": 388, "non_compliant": 24, "servers_scanned": 10}',
   1, '2023-09-15 09:00:00', '2026-02-28 06:30:00'),

  ('mc-esfs-003', 'org_002', 'sys-esfs-001', 'SI-4', 'nist-800-53-r5', 'automated',
   'Splunk Security Monitoring', 'Continuous Splunk correlation rules monitoring for security events, anomalies, and policy violations.',
   'continuous', '2026-02-28 08:00:00', 'pass',
   '{"alerts_24h": 3, "critical_alerts": 0, "high_alerts": 0, "medium_alerts": 2, "low_alerts": 1, "events_processed_24h": 2847291}',
   1, '2023-09-15 09:00:00', '2026-02-28 08:00:00'),

  ('mc-esfs-004', 'org_002', 'sys-esfs-001', 'SI-2', 'nist-800-53-r5', 'automated',
   'SCCM Patch Compliance Check', 'Daily patch compliance assessment via SCCM. Verifies all critical and important patches are applied within SLA.',
   'daily', '2026-02-28 06:00:00', 'pass',
   '{"compliance_percentage": 97.3, "critical_missing": 0, "important_missing": 2, "servers_compliant": 11, "servers_total": 12}',
   1, '2023-09-15 09:00:00', '2026-02-28 06:30:00'),

  ('mc-esfs-005', 'org_002', 'sys-esfs-001', 'AC-2', 'nist-800-53-r5', 'manual',
   'Quarterly Access Review', 'Manual review of all FCMS user accounts, group memberships, and privileges. Conducted by ISSO with ISSM oversight.',
   'quarterly', '2026-01-15 14:00:00', 'pass',
   '{"accounts_reviewed": 2847, "disabled_inactive": 23, "privilege_changes": 5, "orphaned_accounts": 0, "reviewer": "Michael Torres"}',
   1, '2023-09-15 09:00:00', '2026-01-15 16:00:00'),

  ('mc-esfs-006', 'org_002', 'sys-esfs-001', 'AU-6', 'nist-800-53-r5', 'hybrid',
   'Monthly Audit Log Review', 'ISSO reviews Splunk dashboards and generates monthly audit report. Automated pre-screening with manual analysis of flagged events.',
   'monthly', '2026-02-01 14:00:00', 'pass',
   '{"events_reviewed": 847291, "anomalies_flagged": 12, "anomalies_investigated": 12, "incidents_created": 0, "reviewer": "Michael Torres"}',
   1, '2023-09-15 09:00:00', '2026-02-01 16:00:00');

-- ========================================
-- 13. AUDIT LOG ENTRIES
-- ========================================
INSERT OR IGNORE INTO audit_logs (id, org_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at)
VALUES
  ('log-esfs-001', 'org_002', 'user-esfs-005', 'scan_completed', 'vulnerability_scan', 'scan-esfs-20260228',
   '{"findings": 24, "critical": 2, "high": 4, "medium": 8, "low": 10}', '10.200.6.20', 'Nessus/10.7.1', '2026-02-28 07:00:00'),
  ('log-esfs-002', 'org_002', 'user-esfs-003', 'poam_updated', 'poam', 'poam-esfs-003',
   '{"old_status": "open", "new_status": "in_progress"}', '10.200.99.50', 'Mozilla/5.0', '2026-03-05 10:00:00'),
  ('log-esfs-003', 'org_002', 'user-esfs-004', 'control_assessed', 'control_implementation', 'ci-esfs-007',
   '{"assessment_result": "other_than_satisfied", "notes": "2 STIG deviations still pending"}', '10.200.99.55', 'Mozilla/5.0', '2026-02-15 10:00:00'),
  ('log-esfs-004', 'org_002', 'user-esfs-001', 'login_success', 'session', NULL,
   '{"mfa": true, "method": "PIV", "ip": "10.200.99.10"}', '10.200.99.10', 'Mozilla/5.0', '2026-02-28 08:00:00'),
  ('log-esfs-005', 'org_002', 'user-esfs-003', 'ssp_reviewed', 'ssp_document', 'ssp-esfs-001',
   '{"action": "annual_review_initiated", "target_version": "4.2"}', '10.200.99.50', 'Mozilla/5.0', '2026-02-15 09:00:00');

-- ========================================
-- 14. NOTIFICATIONS
-- ========================================
INSERT OR IGNORE INTO notifications (id, org_id, recipient_user_id, type, title, message, resource_type, resource_id, details, is_read, read_at, created_at)
VALUES
  ('notif-esfs-001', 'org_002', 'user-esfs-002', 'compliance_alert',
   'ATO Expiration Warning - FCMS',
   'The FCMS Authorization to Operate expires on September 15, 2026 (198 days). Annual SSP update and 3PAO assessment must be completed before renewal.',
   'system', 'sys-esfs-001',
   '{"days_remaining": 198, "ato_expiry": "2026-09-15"}',
   1, '2026-02-28 08:30:00', '2026-02-28 08:00:00'),

  ('notif-esfs-002', 'org_002', 'user-esfs-003', 'vulnerability',
   'Weekly Scan Complete - 2 Critical Findings',
   'Weekly Nessus scan of FCMS assets completed. 24 findings: 2 Critical (OpenSSL RCE, SMB RCE), 4 High, 8 Medium, 10 Low.',
   'vulnerability_scan', 'scan-esfs-20260228',
   '{"total": 24, "critical": 2, "high": 4, "medium": 8, "low": 10}',
   1, '2026-02-28 08:00:00', '2026-02-28 07:00:00'),

  ('notif-esfs-003', 'org_002', 'user-esfs-005', 'poam_update',
   'POA&M Due Date Approaching',
   'POAM-ESFS-2026-001 (OpenSSL vulnerability) deployment to fcms-web-01 scheduled for March 14 maintenance window.',
   'poam', 'poam-esfs-003',
   '{"poam_id": "poam-esfs-003", "due_date": "2026-03-30"}',
   0, NULL, '2026-03-01 08:00:00'),

  ('notif-esfs-004', 'org_002', 'user-esfs-006', 'compliance_alert',
   'Annual Assessment Planning',
   'The annual 3PAO assessment for FCMS is scheduled for July 2026. Sandra Chen (3PAO liaison) should begin coordinating with Coalfire for engagement scheduling.',
   'system', 'sys-esfs-001',
   '{"assessment_target": "2026-07-31", "3pao": "Coalfire"}',
   0, NULL, '2026-03-01 09:00:00');

-- ============================================================================
-- LOGIN CREDENTIALS
-- ============================================================================
-- Demo Accounts (all use password: ForgeDemo2026!):
--   robert.hayes@eagleshield.com       owner     (CEO/AO)
--   jennifer.walsh@eagleshield.com     admin     (CISO/ISSM)
--   michael.torres@eagleshield.com     manager   (ISSO)
--   aisha.johnson@eagleshield.com      analyst   (SCA)
--   kevin.park@eagleshield.com         analyst   (Sys Admin)
--   sandra.chen@eagleshield.com        viewer    (3PAO Rep)
-- ============================================================================
