-- ============================================================================
-- ForgeComply 360 - Sample Customer Seed Data
-- Customer: Patriot Health Systems (PHS)
-- Scenario: Defense health contractor pursuing FedRAMP Moderate ATO
--           + CMMC Level 2 + HIPAA for VA electronic health records system
-- Purpose:  Demonstrate full platform workflow, RBAC, & test Forge Reporter
-- ============================================================================
-- Migration 024: Run against D1 database after migrate-023 has been applied.
-- Organization:  org_001 (maps to stanley.riley@forgecyberdefense.com login)
-- Demo Password: ForgeDemo2026!
-- Password hash: PBKDF2-SHA256, 100K iterations
-- ============================================================================

-- ========================================
-- 1. ORGANIZATION
-- ========================================
INSERT OR IGNORE INTO organizations (id, name, industry, size, experience_type, subscription_tier, subscription_status, settings, max_frameworks, max_systems, max_users, created_at, updated_at)
VALUES (
  'org_001',
  'Patriot Health Systems',
  'defense_health',
  '340',
  'healthcare',
  'enterprise',
  'active',
  '{"industry": "defense_health", "employees": 340, "cage_code": "8ABC1", "duns": "078451234", "naics": "541512", "annual_revenue": "$42M", "hq_location": "San Antonio, TX", "clearance_level": "Secret", "domain": "patriothealth.com", "features": {"comply": true, "soc": true, "redops": true, "vendorguard": true, "forgeml": true}}',
  10,
  10,
  25,
  '2026-01-15 09:00:00',
  '2026-02-19 08:00:00'
);

-- ========================================
-- 2. USERS (8 demo users)
-- ========================================
-- All use password: ForgeDemo2026!
-- PBKDF2-SHA256, 100K iterations
-- Salt: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2
-- Hash: a17b334b4cfc932e35a3014a4b70ff90a8c6c903b162e3383647f86d5197a544

INSERT OR IGNORE INTO users (id, org_id, email, password_hash, salt, name, role, mfa_enabled, status, onboarding_completed, created_at, updated_at)
VALUES
  ('user-phs-001', 'org_001', 'marcus.chen@patriothealth.com',
   'a17b334b4cfc932e35a3014a4b70ff90a8c6c903b162e3383647f86d5197a544',
   'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
   'Marcus Chen', 'admin', 0, 'active', 1, '2026-01-15 09:00:00', '2026-02-19 08:00:00'),

  ('user-phs-002', 'org_001', 'sarah.rodriguez@patriothealth.com',
   'a17b334b4cfc932e35a3014a4b70ff90a8c6c903b162e3383647f86d5197a544',
   'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
   'Sarah Rodriguez', 'admin', 0, 'active', 1, '2026-01-15 09:15:00', '2026-02-18 16:30:00'),

  ('user-phs-003', 'org_001', 'james.okonkwo@patriothealth.com',
   'a17b334b4cfc932e35a3014a4b70ff90a8c6c903b162e3383647f86d5197a544',
   'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
   'James Okonkwo', 'analyst', 0, 'active', 1, '2026-01-16 10:00:00', '2026-02-19 07:45:00'),

  ('user-phs-004', 'org_001', 'lisa.nakamura@patriothealth.com',
   'a17b334b4cfc932e35a3014a4b70ff90a8c6c903b162e3383647f86d5197a544',
   'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
   'Lisa Nakamura', 'analyst', 0, 'active', 1, '2026-01-16 10:30:00', '2026-02-17 14:00:00'),

  ('user-phs-005', 'org_001', 'david.washington@patriothealth.com',
   'a17b334b4cfc932e35a3014a4b70ff90a8c6c903b162e3383647f86d5197a544',
   'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
   'David Washington', 'analyst', 0, 'active', 1, '2026-01-17 08:00:00', '2026-02-19 06:00:00'),

  ('user-phs-006', 'org_001', 'emily.patel@patriothealth.com',
   'a17b334b4cfc932e35a3014a4b70ff90a8c6c903b162e3383647f86d5197a544',
   'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
   'Emily Patel', 'admin', 0, 'active', 1, '2026-01-18 11:00:00', '2026-02-18 09:00:00'),

  ('user-phs-007', 'org_001', 'robert.kim@patriothealth.com',
   'a17b334b4cfc932e35a3014a4b70ff90a8c6c903b162e3383647f86d5197a544',
   'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
   'Robert Kim', 'analyst', 0, 'active', 1, '2026-01-20 09:00:00', '2026-02-19 08:30:00'),

  ('user-phs-demo', 'org_001', 'demo@patriothealth.com',
   'a17b334b4cfc932e35a3014a4b70ff90a8c6c903b162e3383647f86d5197a544',
   'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
   'Demo Admin', 'admin', 0, 'active', 1, datetime('now'), datetime('now'));

-- ========================================
-- 3. SYSTEMS (3 systems under authorization)
-- ========================================
INSERT OR IGNORE INTO systems (id, org_id, name, acronym, description, impact_level, status, authorization_date, authorization_expiry, system_owner, authorizing_official, security_officer, boundary_description, deployment_model, service_model, metadata, created_at, updated_at)
VALUES
  ('sys-phs-001', 'org_001', 'MedForge Electronic Health Records', 'MFEHR',
   'Cloud-hosted electronic health records system serving VA medical centers. Processes Protected Health Information (PHI) and Controlled Unclassified Information (CUI) for 2.3 million veteran patients across 14 VA facilities. Provides clinical decision support, medication management, lab integration, and telehealth capabilities.',
   'moderate', 'under_review', NULL, NULL,
   'Marcus Chen', 'VA AO', 'Sarah Rodriguez',
   'The MFEHR system boundary includes all components hosted in AWS GovCloud (US-East), including web application servers, API gateway, database cluster, and integration middleware. External connections include VA VistA system via MuleSoft ESB, laboratory information systems via HL7 FHIR, and pharmacy systems via NCPDP standards.',
   'cloud', 'SaaS',
   '{"data_types": ["PHI", "CUI", "PII", "Medical Records", "Prescription Data"], "system_type": "major_application", "isso_id": "user-phs-002"}',
   '2026-01-15 09:30:00', '2026-02-19 08:00:00'),

  ('sys-phs-002', 'org_001', 'SecureComm Patient Portal', 'SCPP',
   'Patient-facing web portal and mobile application enabling veterans to access health records, schedule appointments, message providers, request prescription refills, and participate in telehealth visits. Handles authentication via VA.gov ID.me integration.',
   'moderate', 'under_review', NULL, NULL,
   'Marcus Chen', 'VA AO', 'Lisa Nakamura',
   'The SCPP boundary includes Cloudflare-hosted frontend, API backend in AWS GovCloud, and mobile application (iOS/Android). Integrates with MFEHR via internal API gateway and VA.gov identity services for authentication.',
   'cloud', 'SaaS',
   '{"data_types": ["PHI", "PII", "Authentication Credentials"], "system_type": "major_application", "isso_id": "user-phs-004"}',
   '2026-01-15 10:00:00', '2026-02-18 16:00:00'),

  ('sys-phs-003', 'org_001', 'HealthOps Analytics Platform', 'HOAP',
   'Internal analytics and business intelligence platform processing de-identified health data for population health management, resource allocation, and quality improvement reporting to VA leadership.',
   'low', 'authorized', '2025-11-15', '2026-11-15',
   'Emily Patel', 'VA AO', 'James Okonkwo',
   'HOAP operates within a dedicated VPC in AWS GovCloud with no direct internet access. Data is received via encrypted batch transfers from MFEHR with all PHI de-identified prior to ingestion.',
   'cloud', 'SaaS',
   '{"data_types": ["De-identified Health Data", "Operational Metrics"], "system_type": "major_application", "isso_id": "user-phs-003"}',
   '2026-01-15 10:30:00', '2026-02-15 12:00:00');

-- ========================================
-- 4. ORGANIZATION FRAMEWORKS (link PHS to relevant frameworks)
-- ========================================
INSERT OR IGNORE INTO organization_frameworks (id, org_id, framework_id, enabled, is_primary) VALUES
  ('of-phs-001', 'org_001', 'fedramp-moderate', 1, 1),
  ('of-phs-002', 'org_001', 'cmmc-l2', 1, 0),
  ('of-phs-003', 'org_001', 'hipaa', 1, 0),
  ('of-phs-004', 'org_001', 'nist-800-53-r5', 1, 0),
  ('of-phs-005', 'org_001', 'nist-800-171-r3', 1, 0);

-- ========================================
-- 5. ASSETS (22 assets across all systems)
-- ========================================
INSERT OR IGNORE INTO assets (id, org_id, system_id, hostname, ip_address, mac_address, asset_type, os_type, discovery_source, environment, last_seen_at, risk_score, first_seen_at, created_at, updated_at)
VALUES
  -- MFEHR System Assets
  ('asset-phs-001', 'org_001', 'sys-phs-001', 'mfehr-web-01', '10.100.1.10', 'AA:BB:CC:01:01:01', 'server', 'Linux', 'forgescan', 'production', '2026-02-19 06:00:00', 35, '2026-01-15 10:00:00', '2026-01-15 10:00:00', '2026-02-19 06:00:00'),
  ('asset-phs-002', 'org_001', 'sys-phs-001', 'mfehr-web-02', '10.100.1.11', 'AA:BB:CC:01:01:02', 'server', 'Linux', 'forgescan', 'production', '2026-02-19 06:00:00', 35, '2026-01-15 10:00:00', '2026-01-15 10:00:00', '2026-02-19 06:00:00'),
  ('asset-phs-003', 'org_001', 'sys-phs-001', 'mfehr-api-01', '10.100.2.10', 'AA:BB:CC:02:01:01', 'server', 'Linux', 'forgescan', 'production', '2026-02-19 06:00:00', 72, '2026-01-15 10:00:00', '2026-01-15 10:00:00', '2026-02-19 06:00:00'),
  ('asset-phs-004', 'org_001', 'sys-phs-001', 'mfehr-api-02', '10.100.2.11', 'AA:BB:CC:02:01:02', 'server', 'Linux', 'forgescan', 'production', '2026-02-19 06:00:00', 45, '2026-01-15 10:00:00', '2026-01-15 10:00:00', '2026-02-19 06:00:00'),
  ('asset-phs-005', 'org_001', 'sys-phs-001', 'mfehr-db-primary', '10.100.3.10', 'AA:BB:CC:03:01:01', 'database', 'Linux', 'forgescan', 'production', '2026-02-19 06:00:00', 92, '2026-01-15 10:00:00', '2026-01-15 10:00:00', '2026-02-19 06:00:00'),
  ('asset-phs-006', 'org_001', 'sys-phs-001', 'mfehr-db-replica', '10.100.3.11', 'AA:BB:CC:03:01:02', 'database', 'Linux', 'forgescan', 'production', '2026-02-19 06:00:00', 55, '2026-01-15 10:00:00', '2026-01-15 10:00:00', '2026-02-19 06:00:00'),
  ('asset-phs-007', 'org_001', 'sys-phs-001', 'mfehr-cache-01', '10.100.4.10', 'AA:BB:CC:04:01:01', 'server', 'Linux', 'forgescan', 'production', '2026-02-19 06:00:00', 40, '2026-01-15 10:00:00', '2026-01-15 10:00:00', '2026-02-19 06:00:00'),
  ('asset-phs-008', 'org_001', 'sys-phs-001', 'mfehr-lb-ext', '10.100.0.10', 'AA:BB:CC:00:01:01', 'network_device', 'Linux', 'forgescan', 'production', '2026-02-19 06:00:00', 28, '2026-01-15 10:00:00', '2026-01-15 10:00:00', '2026-02-19 06:00:00'),
  ('asset-phs-009', 'org_001', 'sys-phs-001', 'mfehr-waf', '10.100.0.5', NULL, 'network_device', NULL, 'forgescan', 'production', '2026-02-19 06:00:00', 15, '2026-01-15 10:00:00', '2026-01-15 10:00:00', '2026-02-19 06:00:00'),
  ('asset-phs-010', 'org_001', 'sys-phs-001', 'mfehr-esb-mulesoft', '10.100.5.10', 'AA:BB:CC:05:01:01', 'application', 'Linux', 'forgescan', 'production', '2026-02-19 06:00:00', 65, '2026-01-15 10:00:00', '2026-01-15 10:00:00', '2026-02-19 06:00:00'),
  -- SCPP System Assets
  ('asset-phs-011', 'org_001', 'sys-phs-002', 'scpp-frontend', NULL, NULL, 'application', NULL, 'forgescan', 'production', '2026-02-19 06:00:00', 30, '2026-01-15 10:00:00', '2026-01-15 10:00:00', '2026-02-19 06:00:00'),
  ('asset-phs-012', 'org_001', 'sys-phs-002', 'scpp-api-01', '10.100.6.10', 'AA:BB:CC:06:01:01', 'server', 'Linux', 'forgescan', 'production', '2026-02-19 06:00:00', 48, '2026-01-15 10:00:00', '2026-01-15 10:00:00', '2026-02-19 06:00:00'),
  ('asset-phs-013', 'org_001', 'sys-phs-002', 'scpp-api-02', '10.100.6.11', 'AA:BB:CC:06:01:02', 'server', 'Linux', 'forgescan', 'production', '2026-02-19 06:00:00', 48, '2026-01-15 10:00:00', '2026-01-15 10:00:00', '2026-02-19 06:00:00'),
  ('asset-phs-014', 'org_001', 'sys-phs-002', 'scpp-auth-idme', '10.100.7.10', NULL, 'application', NULL, 'manual', 'production', '2026-02-19 06:00:00', 20, '2026-01-15 10:00:00', '2026-01-15 10:00:00', '2026-02-19 06:00:00'),
  ('asset-phs-015', 'org_001', 'sys-phs-002', 'scpp-mobile-ios', NULL, NULL, 'application', 'iOS', 'manual', 'production', '2026-02-18 12:00:00', 25, '2026-01-20 09:00:00', '2026-01-20 09:00:00', '2026-02-18 12:00:00'),
  ('asset-phs-016', 'org_001', 'sys-phs-002', 'scpp-mobile-android', NULL, NULL, 'application', 'Android', 'manual', 'production', '2026-02-18 12:00:00', 25, '2026-01-20 09:00:00', '2026-01-20 09:00:00', '2026-02-18 12:00:00'),
  -- HOAP System Assets
  ('asset-phs-017', 'org_001', 'sys-phs-003', 'hoap-etl-01', '10.100.8.10', 'AA:BB:CC:08:01:01', 'server', 'Linux', 'forgescan', 'production', '2026-02-19 06:00:00', 15, '2026-01-15 10:00:00', '2026-01-15 10:00:00', '2026-02-19 06:00:00'),
  ('asset-phs-018', 'org_001', 'sys-phs-003', 'hoap-warehouse', '10.100.8.20', 'AA:BB:CC:08:02:01', 'database', 'Linux', 'forgescan', 'production', '2026-02-19 06:00:00', 18, '2026-01-15 10:00:00', '2026-01-15 10:00:00', '2026-02-19 06:00:00'),
  ('asset-phs-019', 'org_001', 'sys-phs-003', 'hoap-bi-tableau', '10.100.8.30', NULL, 'application', NULL, 'manual', 'production', '2026-02-17 15:00:00', 12, '2026-01-15 10:00:00', '2026-01-15 10:00:00', '2026-02-17 15:00:00'),
  -- Shared Infrastructure
  ('asset-phs-020', 'org_001', NULL, 'phs-vpn-gateway', '10.100.0.1', NULL, 'network_device', NULL, 'forgescan', 'production', '2026-02-19 06:00:00', 22, '2026-01-15 10:00:00', '2026-01-15 10:00:00', '2026-02-19 06:00:00'),
  ('asset-phs-021', 'org_001', NULL, 'phs-bastion-01', '10.100.0.50', 'AA:BB:CC:00:05:01', 'server', 'Linux', 'forgescan', 'production', '2026-02-19 06:00:00', 60, '2026-01-15 10:00:00', '2026-01-15 10:00:00', '2026-02-19 06:00:00'),
  ('asset-phs-022', 'org_001', NULL, 'phs-siem-splunk', '10.100.9.10', 'AA:BB:CC:09:01:01', 'application', 'Linux', 'forgescan', 'production', '2026-02-19 06:00:00', 18, '2026-01-15 10:00:00', '2026-01-15 10:00:00', '2026-02-19 06:00:00');

-- ========================================
-- 6. CONTROL IMPLEMENTATIONS (15 for MFEHR + SCPP - mixed statuses)
-- ========================================
INSERT OR IGNORE INTO control_implementations (id, org_id, system_id, framework_id, control_id, status, implementation_description, responsible_role, implementation_date, last_assessed_date, assessment_result, risk_level, metadata, created_at, updated_at)
VALUES
  -- Access Control Family (MFEHR)
  ('ci-phs-001', 'org_001', 'sys-phs-001', 'fedramp-moderate', 'AC-1', 'implemented',
   'Patriot Health Systems has developed and documented a comprehensive Access Control Policy (PHS-AC-POL-001, v3.2) that governs all access to the MedForge EHR system. The policy addresses account management, least privilege, separation of duties, remote access, and wireless access. Procedures are documented in the Access Control Procedures Manual (PHS-AC-PROC-001). The policy is reviewed annually by the CISO and distributed to all personnel via the PHS intranet. Last review completed January 2026.',
   'CISO', '2026-01-20', '2026-01-28', 'satisfied', NULL,
   '{"evidence": "PHS-AC-POL-001 v3.2 (Jan 2026), PHS-AC-PROC-001 v2.1, Distribution email receipt logs, Annual review meeting minutes", "assessed_by": "user-phs-003", "next_assessment": "2027-01-28"}',
   '2026-01-20 09:00:00', '2026-01-28 14:00:00'),

  ('ci-phs-002', 'org_001', 'sys-phs-001', 'fedramp-moderate', 'AC-2', 'implemented',
   'The MFEHR system implements comprehensive account management through integration with Okta Identity Platform. Account creation requires supervisor approval via ServiceNow workflow (SN-ACCT-001). Accounts are reviewed quarterly by system administrators using automated reports generated by ForgeComply 360. Inactive accounts are disabled after 30 days of inactivity. Temporary accounts expire automatically after 90 days. Account types include: standard user, provider, nurse, pharmacist, admin, and service accounts. All account activities are logged to Splunk SIEM.',
   'System Admin', '2026-01-20', '2026-02-05', 'satisfied', NULL,
   '{"evidence": "Okta admin console screenshots, ServiceNow approval workflows, Quarterly access review reports (Q4 2025, Q1 2026), Account disabling automation scripts, Splunk audit logs", "assessed_by": "user-phs-003", "next_assessment": "2026-05-05"}',
   '2026-01-20 09:00:00', '2026-02-05 10:00:00'),

  ('ci-phs-003', 'org_001', 'sys-phs-001', 'fedramp-moderate', 'AC-3', 'implemented',
   'Access enforcement is implemented through a combination of AWS IAM policies, application-level Role-Based Access Control (RBAC), and network security groups. The MFEHR application enforces role-based access with 12 distinct roles mapped to 47 permission sets. All API endpoints require valid JWT tokens with role claims verified on every request. Network access is restricted via AWS Security Groups allowing only necessary traffic flows. Database access is limited to application service accounts with no direct user access.',
   'Security Engineer', '2026-01-20', '2026-02-05', 'satisfied', NULL,
   '{"evidence": "AWS IAM policies, RBAC role matrix, API authorization middleware code, Security group configurations, Database access audit logs", "assessed_by": "user-phs-003", "next_assessment": "2026-05-05"}',
   '2026-01-20 09:00:00', '2026-02-05 11:00:00'),

  ('ci-phs-004', 'org_001', 'sys-phs-001', 'fedramp-moderate', 'AC-4', 'partially_implemented',
   'Information flow enforcement is implemented at the network layer using AWS Security Groups, Network ACLs, and AWS WAF rules. Application-level data flow controls prevent unauthorized disclosure of PHI through API response filtering and data masking. However, DLP integration with the outbound email gateway has not been fully configured for the new telehealth module deployed in January 2026. Remediation is tracked in POAM-PHS-2026-008.',
   'Network Engineer', '2026-01-20', '2026-02-10', 'other_than_satisfied', 'moderate',
   '{"evidence": "AWS Security Group rules, Network ACL configurations, WAF rule sets, API data masking logic, DLP gap analysis report", "assessed_by": "user-phs-003", "next_assessment": "2026-04-10", "notes": "DLP gap identified during January telehealth module deployment. POA&M created."}',
   '2026-01-20 09:00:00', '2026-02-10 09:00:00'),

  ('ci-phs-005', 'org_001', 'sys-phs-001', 'fedramp-moderate', 'AC-5', 'implemented',
   'Separation of duties is enforced through RBAC role definitions that prevent any single individual from performing conflicting functions. Developers cannot deploy to production (handled by CI/CD pipeline with separate approver). Database administrators cannot modify application code. System administrators cannot access PHI directly. Security analysts cannot modify security configurations without change management approval. Privilege conflicts are detected by automated weekly scans.',
   'CISO', '2026-01-20', '2026-02-05', 'satisfied', NULL,
   '{"evidence": "RBAC role matrix with SoD analysis, CI/CD pipeline configuration, DBA access logs, Weekly SoD scan reports", "assessed_by": "user-phs-003", "next_assessment": "2026-05-05"}',
   '2026-01-20 09:00:00', '2026-02-05 14:00:00'),

  -- Audit and Accountability Family (MFEHR)
  ('ci-phs-006', 'org_001', 'sys-phs-001', 'fedramp-moderate', 'AU-1', 'implemented',
   'Patriot Health Systems has developed Audit and Accountability Policy (PHS-AU-POL-001, v2.4) establishing requirements for audit logging, review, and retention across all MFEHR components. Procedures document specific logging configurations, review schedules, and incident escalation criteria. Policy reviewed annually and updated in December 2025 to address new NIST guidance.',
   'CISO', '2026-01-20', '2026-01-30', 'satisfied', NULL,
   '{"evidence": "PHS-AU-POL-001 v2.4, PHS-AU-PROC-001, Distribution logs, Annual review documentation", "assessed_by": "user-phs-004", "next_assessment": "2027-01-30"}',
   '2026-01-20 09:00:00', '2026-01-30 10:00:00'),

  ('ci-phs-007', 'org_001', 'sys-phs-001', 'fedramp-moderate', 'AU-2', 'implemented',
   'The MFEHR system logs the following auditable events: successful and failed authentication attempts, access to PHI records, privilege escalation, configuration changes, data exports, API calls, database queries, and security-relevant system events. Event types are configured in Splunk inputs.conf and the application logging framework (Winston). AWS CloudTrail captures all API calls to AWS services. Audit events include user identity, timestamp, event type, source/destination, and outcome.',
   'Security Engineer', '2026-01-20', '2026-02-05', 'satisfied', NULL,
   '{"evidence": "Splunk inputs.conf, Application logging configuration, CloudTrail settings, Sample audit log extracts", "assessed_by": "user-phs-004", "next_assessment": "2026-05-05"}',
   '2026-01-20 09:00:00', '2026-02-05 10:30:00'),

  -- Configuration Management (MFEHR)
  ('ci-phs-008', 'org_001', 'sys-phs-001', 'fedramp-moderate', 'CM-1', 'implemented',
   'Configuration Management Policy (PHS-CM-POL-001, v2.1) establishes requirements for baseline configurations, change management, and configuration monitoring. All changes to MFEHR follow the ITIL-based change management process documented in ServiceNow. Emergency changes require ISSO approval within 4 hours and retrospective CAB review within 48 hours.',
   'Change Manager', '2026-01-20', '2026-01-30', 'satisfied', NULL,
   '{"evidence": "PHS-CM-POL-001 v2.1, ServiceNow change management workflows, CAB meeting minutes, Emergency change logs", "assessed_by": "user-phs-003", "next_assessment": "2027-01-30"}',
   '2026-01-20 09:00:00', '2026-01-30 14:00:00'),

  -- Incident Response (MFEHR)
  ('ci-phs-009', 'org_001', 'sys-phs-001', 'fedramp-moderate', 'IR-1', 'implemented',
   'Incident Response Policy (PHS-IR-POL-001, v3.0) defines incident categories, severity levels, response procedures, and reporting requirements including HIPAA breach notification timelines. The IRP is tested annually via tabletop exercises and updated based on lessons learned. Last tabletop exercise conducted December 2025 with VA stakeholder participation.',
   'CISO', '2026-01-20', '2026-01-29', 'satisfied', NULL,
   '{"evidence": "PHS-IR-POL-001 v3.0, Tabletop exercise report (Dec 2025), Incident response team roster, Communication tree, VA notification procedures", "assessed_by": "user-phs-004", "next_assessment": "2027-01-29"}',
   '2026-01-20 09:00:00', '2026-01-29 09:00:00'),

  -- Planned control
  ('ci-phs-010', 'org_001', 'sys-phs-001', 'fedramp-moderate', 'AC-6', 'planned',
   'Access control policy update planned to incorporate new zero trust architecture requirements per EO 14028 and OMB M-22-09. Target completion Q2 2026.',
   'CISO', NULL, NULL, 'not_assessed', NULL,
   '{"notes": "Waiting on final CISA Zero Trust guidance", "next_assessment": "2026-06-30"}',
   '2026-02-01 09:00:00', '2026-02-01 09:00:00'),

  -- SCPP system controls
  ('ci-phs-011', 'org_001', 'sys-phs-002', 'fedramp-moderate', 'AC-1', 'implemented',
   'The SecureComm Patient Portal inherits the organizational Access Control Policy from PHS-AC-POL-001 and supplements it with patient-facing access procedures documented in PHS-SCPP-AC-001. Patient authentication is delegated to VA.gov ID.me service providing IAL2/AAL2 assurance.',
   'ISSO', '2026-01-22', '2026-02-08', 'satisfied', NULL,
   '{"evidence": "PHS-AC-POL-001, PHS-SCPP-AC-001, ID.me integration configuration, Patient consent forms", "assessed_by": "user-phs-004", "next_assessment": "2027-02-08"}',
   '2026-01-22 09:00:00', '2026-02-08 10:00:00'),

  ('ci-phs-012', 'org_001', 'sys-phs-002', 'fedramp-moderate', 'AC-2', 'partially_implemented',
   'Patient account management is handled through VA.gov ID.me integration. Internal staff accounts follow the same Okta-based process as MFEHR. However, the automated account deprovisioning workflow for terminated staff has a 48-hour delay due to HR system integration lag. Remediation planned for March 2026.',
   'IAM Engineer', '2026-01-22', '2026-02-08', 'other_than_satisfied', 'moderate',
   '{"evidence": "ID.me integration logs, Okta provisioning workflows, HR system sync gap analysis", "assessed_by": "user-phs-004", "next_assessment": "2026-04-08", "notes": "HR sync delay tracked in POA&M"}',
   '2026-01-22 09:00:00', '2026-02-08 11:00:00'),

  ('ci-phs-013', 'org_001', 'sys-phs-002', 'fedramp-moderate', 'AC-3', 'implemented',
   'Access enforcement in SCPP uses OAuth 2.0 with PKCE for patient sessions and Okta SAML for staff access. API gateway enforces rate limiting and validates JWT claims on every request.',
   'Security Engineer', '2026-01-22', '2026-02-08', 'satisfied', NULL,
   '{"evidence": "OAuth configuration, API gateway policies, Rate limiting rules, JWT validation middleware", "assessed_by": "user-phs-004", "next_assessment": "2026-05-08"}',
   '2026-01-22 09:00:00', '2026-02-08 14:00:00'),

  ('ci-phs-014', 'org_001', 'sys-phs-002', 'fedramp-moderate', 'AU-1', 'implemented',
   'SCPP inherits organizational Audit Policy PHS-AU-POL-001. Additional patient portal-specific audit requirements documented in PHS-SCPP-AU-001 covering patient record access, appointment scheduling, and prescription refill logging.',
   'ISSO', '2026-01-22', '2026-02-08', 'satisfied', NULL,
   '{"evidence": "PHS-AU-POL-001, PHS-SCPP-AU-001, Audit configuration screenshots", "assessed_by": "user-phs-004", "next_assessment": "2027-02-08"}',
   '2026-01-22 09:00:00', '2026-02-08 15:00:00'),

  ('ci-phs-015', 'org_001', 'sys-phs-002', 'fedramp-moderate', 'AU-2', 'implemented',
   'SCPP logs all patient interactions including login/logout, record views, appointment changes, message sends, and prescription requests. All events forwarded to Splunk within 30 seconds.',
   'Security Engineer', '2026-01-22', '2026-02-08', 'satisfied', NULL,
   '{"evidence": "Application logging config, Splunk forwarding configuration, Sample audit logs", "assessed_by": "user-phs-004", "next_assessment": "2026-05-08"}',
   '2026-01-22 09:00:00', '2026-02-08 15:30:00');

-- ========================================
-- 7. POA&Ms (8 POA&Ms linked to findings)
-- ========================================
INSERT OR IGNORE INTO poams (id, org_id, system_id, poam_id, weakness_name, weakness_description, control_id, framework_id, risk_level, status, scheduled_completion, actual_completion, milestones, responsible_party, resources_required, vendor_dependency, cost_estimate, comments, assigned_to, created_by, created_at, updated_at)
VALUES
  ('poam-phs-001', 'org_001', 'sys-phs-001', 'POAM-PHS-2026-001',
   'Critical: Log4j Remote Code Execution (CVE-2021-44228)',
   'The database monitoring agent uses Apache Log4j 2.14.1 which is vulnerable to Log4Shell (CVE-2021-44228), allowing unauthenticated remote code execution. CVSS 9.8. Exploitation could lead to complete compromise of the database tier containing PHI for 2.3 million veterans.',
   'SI-2', 'fedramp-moderate', 'critical', 'in_progress',
   '2026-02-25', NULL,
   '[{"id": 1, "description": "Apply interim mitigation property", "due_date": "2026-02-19", "status": "completed"}, {"id": 2, "description": "Test Log4j 2.17.1 in staging", "due_date": "2026-02-21", "status": "in_progress"}, {"id": 3, "description": "Deploy to production via CR", "due_date": "2026-02-24", "status": "planned"}, {"id": 4, "description": "Verify with targeted rescan", "due_date": "2026-02-25", "status": "planned"}]',
   'David Washington',
   'DevOps Engineer (8 hrs), Security Analyst (4 hrs), Change Advisory Board approval',
   0, 5000.00,
   'Interim mitigation applied 2026-02-18 at 15:30 UTC. Staging test scheduled for 2026-02-21.',
   'user-phs-005', 'user-phs-005', '2026-02-18 08:00:00', '2026-02-19 06:00:00'),

  ('poam-phs-002', 'org_001', 'sys-phs-001', 'POAM-PHS-2026-002',
   'Critical: SQL Injection in Patient Search API',
   'The /api/v2/patients/search endpoint is vulnerable to SQL injection via double URL-encoded characters in the last_name parameter. Exploitation could expose PHI for all 2.3 million veteran patients. CVSS 9.1.',
   'SI-2', 'fedramp-moderate', 'critical', 'in_progress',
   '2026-03-03', NULL,
   '[{"id": 1, "description": "Deploy emergency WAF rule", "due_date": "2026-02-19", "status": "completed"}, {"id": 2, "description": "Refactor to parameterized queries", "due_date": "2026-02-26", "status": "in_progress"}, {"id": 3, "description": "Add input validation layer", "due_date": "2026-02-28", "status": "planned"}, {"id": 4, "description": "Penetration test verification", "due_date": "2026-03-03", "status": "planned"}]',
   'David Washington',
   'Senior Developer (24 hrs), Security Analyst (8 hrs), Penetration Tester (8 hrs)',
   0, 12000.00,
   'Emergency WAF rule deployed 2026-02-18. Development sprint started for query refactoring.',
   'user-phs-005', 'user-phs-005', '2026-02-18 08:30:00', '2026-02-19 06:00:00'),

  ('poam-phs-003', 'org_001', 'sys-phs-001', 'POAM-PHS-2026-003',
   'High: Legacy TLS Protocols Enabled',
   'Both MFEHR web servers have TLS 1.0 and TLS 1.1 enabled, violating FedRAMP requirements for TLS 1.2 minimum. Deprecated protocols are vulnerable to known attacks including POODLE and BEAST.',
   'SC-8', 'fedramp-moderate', 'high', 'open',
   '2026-03-01', NULL,
   '[{"id": 1, "description": "Update NGINX config in staging", "due_date": "2026-02-22", "status": "planned"}, {"id": 2, "description": "Client compatibility testing", "due_date": "2026-02-25", "status": "planned"}, {"id": 3, "description": "Rolling production deployment", "due_date": "2026-02-28", "status": "planned"}, {"id": 4, "description": "SSL scan verification", "due_date": "2026-03-01", "status": "planned"}]',
   'David Washington',
   'DevOps Engineer (6 hrs), QA Analyst (4 hrs)',
   0, 3000.00, NULL,
   'user-phs-005', 'user-phs-005', '2026-02-18 09:00:00', '2026-02-18 09:00:00'),

  ('poam-phs-004', 'org_001', 'sys-phs-001', 'POAM-PHS-2026-004',
   'High: MuleSoft API Authentication Bypass',
   'The MuleSoft ESB integration layer allows unauthenticated access to the HL7 FHIR message transformation endpoint from within the VPC, potentially allowing malformed HL7 messages to reach the EHR database.',
   'AC-3', 'fedramp-moderate', 'high', 'in_progress',
   '2026-03-14', NULL,
   '[{"id": 1, "description": "Apply client_id enforcement policy", "due_date": "2026-02-24", "status": "in_progress"}, {"id": 2, "description": "Configure mTLS certificates", "due_date": "2026-03-03", "status": "planned"}, {"id": 3, "description": "Implement message schema validation", "due_date": "2026-03-10", "status": "planned"}, {"id": 4, "description": "Integration testing with VA VistA", "due_date": "2026-03-14", "status": "planned"}]',
   'James Okonkwo',
   'Integration Engineer (16 hrs), Security Analyst (8 hrs), VA VistA team coordination',
   1, 8000.00,
   'Coordinating with VA VistA team for testing window in March.',
   'user-phs-003', 'user-phs-003', '2026-02-18 10:00:00', '2026-02-19 06:00:00'),

  ('poam-phs-005', 'org_001', 'sys-phs-001', 'POAM-PHS-2026-005',
   'High: Bastion Host Missing Critical Patches',
   'The bastion host has 7 critical Amazon Linux security patches pending including kernel privilege escalation fixes. Last patched 45 days ago exceeding 30-day SLA.',
   'SI-2', 'fedramp-moderate', 'high', 'open',
   '2026-03-07', NULL,
   '[{"id": 1, "description": "Apply pending patches in maintenance window", "due_date": "2026-02-22", "status": "planned"}, {"id": 2, "description": "Configure SSM Patch Manager", "due_date": "2026-02-28", "status": "planned"}, {"id": 3, "description": "Verify automated patching works", "due_date": "2026-03-07", "status": "planned"}]',
   'David Washington',
   'System Administrator (4 hrs)',
   0, 2000.00, NULL,
   'user-phs-005', 'user-phs-005', '2026-02-18 10:30:00', '2026-02-18 10:30:00'),

  ('poam-phs-006', 'org_001', 'sys-phs-002', 'POAM-PHS-2026-006',
   'High: Stored XSS in Patient Messaging',
   'The patient messaging feature does not sanitize HTML in message bodies, enabling stored XSS. A malicious patient message could execute JavaScript when viewed by a provider, potentially exfiltrating session tokens or PHI.',
   'SI-10', 'fedramp-moderate', 'high', 'in_progress',
   '2026-03-05', NULL,
   '[{"id": 1, "description": "Deploy WAF rule for XSS patterns", "due_date": "2026-02-20", "status": "completed"}, {"id": 2, "description": "Implement DOMPurify sanitization", "due_date": "2026-02-27", "status": "in_progress"}, {"id": 3, "description": "Add CSP headers", "due_date": "2026-03-01", "status": "planned"}, {"id": 4, "description": "Security regression testing", "due_date": "2026-03-05", "status": "planned"}]',
   'Lisa Nakamura',
   'Frontend Developer (12 hrs), Security Analyst (4 hrs)',
   0, 6000.00,
   'WAF rule deployed as interim control 2026-02-19.',
   'user-phs-004', 'user-phs-004', '2026-02-18 11:00:00', '2026-02-19 06:00:00'),

  ('poam-phs-007', 'org_001', 'sys-phs-001', 'POAM-PHS-2026-007',
   'Moderate: Incomplete DLP for Telehealth Module',
   'Data Loss Prevention controls are not configured for the new telehealth module deployed January 2026. Outbound communications from telehealth sessions are not scanned for PHI, creating a potential data exfiltration path.',
   'AC-4', 'fedramp-moderate', 'moderate', 'in_progress',
   '2026-03-31', NULL,
   '[{"id": 1, "description": "Define DLP policies for telehealth", "due_date": "2026-03-01", "status": "in_progress"}, {"id": 2, "description": "Configure Symantec DLP rules", "due_date": "2026-03-15", "status": "planned"}, {"id": 3, "description": "Test with synthetic PHI data", "due_date": "2026-03-22", "status": "planned"}, {"id": 4, "description": "Production deployment and verification", "due_date": "2026-03-31", "status": "planned"}]',
   'James Okonkwo',
   'DLP Analyst (20 hrs), Telehealth Team (8 hrs), Symantec Professional Services',
   1, 15000.00,
   'Symantec engagement approved 2026-02-15. Kickoff scheduled 2026-02-25.',
   'user-phs-003', 'user-phs-003', '2026-02-10 09:00:00', '2026-02-15 14:00:00'),

  ('poam-phs-008', 'org_001', 'sys-phs-002', 'POAM-PHS-2026-008',
   'Moderate: Delayed Staff Account Deprovisioning',
   'Automated deprovisioning of terminated staff accounts experiences a 48-hour delay due to HR system integration lag with Okta, exceeding the 24-hour requirement in AC-2.',
   'AC-2', 'fedramp-moderate', 'moderate', 'in_progress',
   '2026-04-22', NULL,
   '[{"id": 1, "description": "Document manual deprovisioning process", "due_date": "2026-02-15", "status": "completed"}, {"id": 2, "description": "Configure Workday webhook to Okta", "due_date": "2026-03-15", "status": "in_progress"}, {"id": 3, "description": "Test end-to-end deprovisioning", "due_date": "2026-03-22", "status": "planned"}, {"id": 4, "description": "Monitor for 30 days", "due_date": "2026-04-22", "status": "planned"}]',
   'Lisa Nakamura',
   'IAM Engineer (16 hrs), Workday Admin (8 hrs), Okta Admin (8 hrs)',
   1, 10000.00,
   'Manual process documented and in effect since 2026-02-15. Workday webhook development underway.',
   'user-phs-004', 'user-phs-004', '2026-02-08 11:00:00', '2026-02-15 09:00:00');

-- ========================================
-- 8. VULNERABILITY FINDINGS (18 findings)
-- ========================================
INSERT OR IGNORE INTO vulnerability_findings (id, org_id, asset_id, scan_id, title, description, severity, cvss_score, affected_component, remediation_guidance, status, related_poam_id, first_seen_at, last_seen_at, created_at, updated_at)
VALUES
  -- Critical (2)
  ('find-phs-001', 'org_001', 'asset-phs-005', 'scan-phs-20260218',
   'Apache Log4j Remote Code Execution (Log4Shell)',
   'The MedForge EHR database monitoring agent uses Apache Log4j 2.14.1 which is vulnerable to CVE-2021-44228. This vulnerability allows unauthenticated remote code execution via specially crafted log messages. The database monitoring agent processes external input from application health checks.',
   'critical', 9.8, 'log4j-core-2.14.1.jar',
   'Immediately upgrade Log4j to version 2.17.1 or later. As interim mitigation, set log4j2.formatMsgNoLookups=true system property.',
   'in_progress', 'poam-phs-001',
   '2026-02-18 07:15:00', '2026-02-19 06:00:00', '2026-02-18 07:15:00', '2026-02-19 06:00:00'),

  ('find-phs-002', 'org_001', 'asset-phs-003', 'scan-phs-20260218',
   'SQL Injection in Patient Search API',
   'The /api/v2/patients/search endpoint is vulnerable to SQL injection through the last_name parameter. The parameterized query implementation has a bypass when special characters are URL-encoded twice. This could allow unauthorized access to the entire patient database containing PHI for 2.3 million veterans.',
   'critical', 9.1, 'MFEHR API v2.4.1 - /api/v2/patients/search',
   'Implement prepared statements for all database queries. Add secondary input validation layer. Deploy WAF rule to block double-encoded characters.',
   'in_progress', 'poam-phs-002',
   '2026-02-18 07:22:00', '2026-02-19 06:00:00', '2026-02-18 07:22:00', '2026-02-19 06:00:00'),

  -- High (5)
  ('find-phs-003', 'org_001', 'asset-phs-001', 'scan-phs-20260218',
   'TLS 1.0/1.1 Enabled on Web Server',
   'The MFEHR web server (mfehr-web-01) has TLS 1.0 and TLS 1.1 protocols enabled alongside TLS 1.2/1.3. Deprecated TLS versions are vulnerable to POODLE, BEAST, and other protocol downgrade attacks. FedRAMP requires disabling TLS versions below 1.2.',
   'high', 7.4, 'NGINX 1.24.0 - TLS configuration',
   'Modify NGINX ssl_protocols directive to allow only TLSv1.2 and TLSv1.3. Update ssl_ciphers to use only FIPS-approved cipher suites.',
   'open', 'poam-phs-003',
   '2026-02-18 07:30:00', '2026-02-18 07:30:00', '2026-02-18 07:30:00', '2026-02-18 07:30:00'),

  ('find-phs-004', 'org_001', 'asset-phs-002', 'scan-phs-20260218',
   'TLS 1.0/1.1 Enabled on Web Server',
   'The MFEHR web server (mfehr-web-02) has identical TLS misconfiguration as mfehr-web-01.',
   'high', 7.4, 'NGINX 1.24.0 - TLS configuration',
   'Apply same TLS configuration fix as mfehr-web-01.',
   'open', 'poam-phs-003',
   '2026-02-18 07:30:00', '2026-02-18 07:30:00', '2026-02-18 07:30:00', '2026-02-18 07:30:00'),

  ('find-phs-005', 'org_001', 'asset-phs-010', 'scan-phs-20260218',
   'MuleSoft Anypoint Platform Authentication Bypass',
   'The MuleSoft ESB integration layer has a misconfigured API policy that allows unauthenticated access to the HL7 FHIR message transformation endpoint. An attacker on the internal network could submit malformed HL7 messages directly to the EHR database.',
   'high', 8.1, 'MuleSoft Anypoint 4.4.0 - API Gateway Policy',
   'Apply client_id enforcement policy to all API endpoints. Implement mutual TLS for service-to-service communication. Add message schema validation.',
   'in_progress', 'poam-phs-004',
   '2026-02-18 08:00:00', '2026-02-19 06:00:00', '2026-02-18 08:00:00', '2026-02-19 06:00:00'),

  ('find-phs-006', 'org_001', 'asset-phs-021', 'scan-phs-20260218',
   'Bastion Host Missing Critical OS Patches',
   'The bastion host (phs-bastion-01) is missing 7 critical Amazon Linux security patches including kernel updates addressing privilege escalation vulnerabilities. Last patched 45 days ago exceeding the 30-day patch SLA.',
   'high', 7.8, 'Amazon Linux 2023 kernel 6.1.56',
   'Apply all pending security patches via yum update. Review and enforce automated patching via AWS Systems Manager Patch Manager.',
   'in_progress', 'poam-phs-005',
   '2026-02-18 08:15:00', '2026-02-19 06:00:00', '2026-02-18 08:15:00', '2026-02-19 06:00:00'),

  ('find-phs-007', 'org_001', 'asset-phs-012', 'scan-phs-20260218',
   'Cross-Site Scripting (XSS) in Patient Messaging',
   'The patient messaging feature in SecureComm Patient Portal does not properly sanitize HTML content in message bodies. Stored XSS is possible when a patient submits a message containing JavaScript that executes when viewed by a provider.',
   'high', 7.1, 'SCPP v1.8.2 - /api/v1/messages',
   'Implement server-side HTML sanitization using DOMPurify. Add Content-Security-Policy headers. Enable HttpOnly flag on all session cookies.',
   'open', 'poam-phs-006',
   '2026-02-18 08:30:00', '2026-02-18 08:30:00', '2026-02-18 08:30:00', '2026-02-18 08:30:00'),

  -- Medium (6)
  ('find-phs-008', 'org_001', 'asset-phs-003', 'scan-phs-20260218',
   'Missing Rate Limiting on Authentication Endpoint',
   'The /api/v2/auth/login endpoint lacks rate limiting, allowing unlimited authentication attempts. This enables brute-force password attacks against staff accounts.',
   'medium', 5.3, 'MFEHR API v2.4.1 - /api/v2/auth/login',
   'Implement rate limiting: max 5 attempts per account per 15-minute window. Add account lockout after 10 failed attempts. Implement CAPTCHA after 3 failures.',
   'open', NULL,
   '2026-02-18 09:00:00', '2026-02-18 09:00:00', '2026-02-18 09:00:00', '2026-02-18 09:00:00'),

  ('find-phs-009', 'org_001', 'asset-phs-007', 'scan-phs-20260218',
   'Redis Instance Without Authentication',
   'The ElastiCache Redis instance (mfehr-cache-01) does not require authentication for connections from within the VPC. While network-level controls restrict access to application servers, defense in depth requires Redis AUTH.',
   'medium', 5.9, 'ElastiCache Redis 7.0 - AUTH configuration',
   'Enable Redis AUTH with a strong password stored in AWS Secrets Manager. Rotate the password quarterly.',
   'open', NULL,
   '2026-02-18 09:15:00', '2026-02-18 09:15:00', '2026-02-18 09:15:00', '2026-02-18 09:15:00'),

  ('find-phs-010', 'org_001', 'asset-phs-008', 'scan-phs-20260218',
   'Load Balancer Health Check Exposes Version Information',
   'The ALB health check endpoint /health returns detailed version information including application version, framework version, and database driver version in the response body.',
   'medium', 4.3, 'AWS ALB - /health endpoint',
   'Modify health check to return only HTTP 200 status without body content. Move detailed health information to an authenticated /admin/health endpoint.',
   'remediated', NULL,
   '2026-02-18 09:30:00', '2026-02-19 06:00:00', '2026-02-18 09:30:00', '2026-02-19 06:00:00'),

  ('find-phs-011', 'org_001', 'asset-phs-011', 'scan-phs-20260218',
   'Content Security Policy Not Configured',
   'The SecureComm Patient Portal frontend does not implement Content Security Policy (CSP) headers, increasing the risk of XSS and data injection attacks.',
   'medium', 5.0, 'Cloudflare Pages - HTTP Headers',
   'Configure CSP headers via Cloudflare Transform Rules. Recommended policy: default-src self; script-src self cdn.example.com; style-src self unsafe-inline.',
   'in_progress', NULL,
   '2026-02-18 09:45:00', '2026-02-19 06:00:00', '2026-02-18 09:45:00', '2026-02-19 06:00:00'),

  ('find-phs-012', 'org_001', 'asset-phs-017', 'scan-phs-20260218',
   'AWS Glue Job Logging Insufficient',
   'The HOAP ETL Glue jobs do not log sufficient detail for security audit requirements. Job execution logs lack source data lineage and transformation details required by HIPAA audit trail requirements.',
   'medium', 4.0, 'AWS Glue ETL Jobs - Logging Configuration',
   'Enable detailed Glue job logging. Configure CloudWatch log groups with appropriate retention. Add data lineage tracking to ETL scripts.',
   'open', NULL,
   '2026-02-18 10:00:00', '2026-02-18 10:00:00', '2026-02-18 10:00:00', '2026-02-18 10:00:00'),

  ('find-phs-013', 'org_001', 'asset-phs-022', 'scan-phs-20260218',
   'Splunk Universal Forwarder Outdated',
   'The Splunk Universal Forwarder on the SIEM server is version 9.0.3, which is 2 versions behind current. While no critical CVEs exist for this version, maintaining current software is required by CM-3.',
   'medium', 4.5, 'Splunk Universal Forwarder 9.0.3',
   'Upgrade Splunk Universal Forwarder to version 9.2.x. Test log forwarding after upgrade.',
   'open', NULL,
   '2026-02-18 10:15:00', '2026-02-18 10:15:00', '2026-02-18 10:15:00', '2026-02-18 10:15:00'),

  -- Low (5)
  ('find-phs-014', 'org_001', 'asset-phs-001', 'scan-phs-20260218',
   'HTTP Server Header Disclosure',
   'Web server response headers include Server: nginx/1.24.0, revealing specific software version information.',
   'low', 3.1, 'NGINX 1.24.0 - Response Headers',
   'Add server_tokens off; to NGINX configuration to suppress version information.',
   'open', NULL,
   '2026-02-18 10:30:00', '2026-02-18 10:30:00', '2026-02-18 10:30:00', '2026-02-18 10:30:00'),

  ('find-phs-015', 'org_001', 'asset-phs-012', 'scan-phs-20260218',
   'Missing X-Content-Type-Options Header',
   'The SCPP API responses do not include X-Content-Type-Options: nosniff header.',
   'low', 2.6, 'SCPP API v1.8.2 - Response Headers',
   'Add X-Content-Type-Options: nosniff to all API responses via middleware.',
   'remediated', NULL,
   '2026-02-18 10:45:00', '2026-02-19 06:00:00', '2026-02-18 10:45:00', '2026-02-19 06:00:00'),

  ('find-phs-016', 'org_001', 'asset-phs-013', 'scan-phs-20260218',
   'Missing X-Content-Type-Options Header',
   'SCPP API server 02 has same missing header as server 01.',
   'low', 2.6, 'SCPP API v1.8.2 - Response Headers',
   'Apply same fix as scpp-api-01.',
   'remediated', NULL,
   '2026-02-18 10:45:00', '2026-02-19 06:00:00', '2026-02-18 10:45:00', '2026-02-19 06:00:00'),

  ('find-phs-017', 'org_001', 'asset-phs-018', 'scan-phs-20260218',
   'Redshift Cluster Not Using Latest SSL Certificate',
   'The HOAP Redshift cluster is using an older AWS SSL certificate bundle (rds-combined-ca-bundle-2019.pem) instead of the current 2024 bundle.',
   'low', 2.1, 'Amazon Redshift - SSL Configuration',
   'Update SSL certificate bundle to rds-combined-ca-bundle-2024.pem. Update JDBC connection strings in ETL jobs.',
   'open', NULL,
   '2026-02-18 11:00:00', '2026-02-18 11:00:00', '2026-02-18 11:00:00', '2026-02-18 11:00:00'),

  ('find-phs-018', 'org_001', 'asset-phs-019', 'scan-phs-20260218',
   'Tableau Server Using Default Session Timeout',
   'The Tableau Server is using the default 240-minute session timeout instead of the organizational requirement of 30 minutes for applications processing health data.',
   'low', 3.3, 'Tableau Server 2023.3 - Session Configuration',
   'Configure wgserver.session.idle_limit to 30 minutes in TSM CLI. Restart Tableau Server.',
   'open', NULL,
   '2026-02-18 11:15:00', '2026-02-18 11:15:00', '2026-02-18 11:15:00', '2026-02-18 11:15:00');

-- ========================================
-- 9. SECURITY ALERTS (6 alerts showing SOC activity)
-- ========================================
INSERT OR IGNORE INTO security_alerts (id, org_id, alert_rule_id, title, description, severity, source, source_event_id, affected_assets, indicators, raw_event, status, assigned_to, resolution_notes, resolved_at, related_incident_id, related_poams, created_at, updated_at)
VALUES
  ('alert-phs-001', 'org_001', NULL,
   'Multiple Failed Login Attempts - Admin Account',
   'Detected 23 failed login attempts for user marcus.chen@patriothealth.com within a 5-minute window from IP 185.234.72.19 (Tor exit node). Account locked after 10th attempt per policy.',
   'high', 'Splunk SIEM', 'SPL-20260217-44821',
   '["asset-phs-003"]', '["185.234.72.19", "tor_exit_node", "brute_force"]',
   '{"event_type": "auth_failure", "count": 23, "src_ip": "185.234.72.19", "dest_user": "marcus.chen@patriothealth.com", "time_window": "300s"}',
   'resolved', 'user-phs-005',
   'Confirmed brute force attempt from Tor exit node. Account was automatically locked after 10 failures. IP added to WAF block list. User account unlocked after verification via out-of-band phone call. No successful authentication detected.',
   '2026-02-17 15:45:00', NULL, '[]',
   '2026-02-17 14:22:00', '2026-02-17 15:45:00'),

  ('alert-phs-002', 'org_001', NULL,
   'Unusual Data Export Volume Detected',
   'User lisa.nakamura@patriothealth.com exported 12,847 patient records from the MFEHR system in a single query. This exceeds the normal threshold of 500 records per export.',
   'high', 'ForgeComply DLP', 'DLP-20260218-00112',
   '["asset-phs-005", "asset-phs-003"]', '["bulk_export", "phi", "above_threshold"]',
   '{"event_type": "data_export", "records": 12847, "user": "lisa.nakamura@patriothealth.com", "table": "patient_records"}',
   'resolved', 'user-phs-002',
   'Investigation confirmed legitimate business need. User was generating quarterly population health report for VA leadership per approved request PHS-REQ-2026-0087. Export audit trail verified. Manager approval confirmed. No data exfiltration.',
   '2026-02-18 11:30:00', NULL, '[]',
   '2026-02-18 09:15:00', '2026-02-18 11:30:00'),

  ('alert-phs-003', 'org_001', NULL,
   'Unauthorized API Access Attempt',
   'Detected API calls to /api/v2/admin/users endpoint from an IP address not in the allowed CIDR range. Source IP 10.100.5.10 (mfehr-esb-mulesoft) attempted to access administrative endpoints.',
   'medium', 'AWS WAF', 'WAF-20260218-88234',
   '["asset-phs-010", "asset-phs-003"]', '["unauthorized_api", "lateral_movement_attempt"]',
   '{"event_type": "api_access_denied", "src_ip": "10.100.5.10", "endpoint": "/api/v2/admin/users", "method": "GET"}',
   'investigating', 'user-phs-005', NULL, NULL, NULL, '[]',
   '2026-02-18 16:30:00', '2026-02-19 06:00:00'),

  ('alert-phs-004', 'org_001', NULL,
   'SSL Certificate Expiring Within 30 Days',
   'The SSL certificate for api-internal.patriothealth.com expires on 2026-03-18. Automated renewal failed due to DNS validation error.',
   'medium', 'Certificate Monitor', 'CERT-20260219-001',
   '["asset-phs-003", "asset-phs-004"]', '["certificate_expiry", "renewal_failure"]',
   '{"event_type": "cert_expiry_warning", "domain": "api-internal.patriothealth.com", "expiry": "2026-03-18", "days_remaining": 27}',
   'acknowledged', 'user-phs-005', NULL, NULL, NULL, '[]',
   '2026-02-19 06:00:00', '2026-02-19 08:00:00'),

  ('alert-phs-005', 'org_001', NULL,
   'GuardDuty: Cryptocurrency Mining DNS Query',
   'AWS GuardDuty detected DNS queries to known cryptocurrency mining pools from instance i-0abc123def (mfehr-cache-01). Finding type: CryptoCurrency:EC2/BitcoinTool.B!DNS.',
   'high', 'AWS GuardDuty', 'GD-20260216-7723',
   '["asset-phs-007"]', '["cryptocurrency_mining", "dns_query", "pool.minergate.com"]',
   '{"event_type": "guardduty_finding", "type": "CryptoCurrency:EC2/BitcoinTool.B!DNS", "instance": "i-0abc123def"}',
   'resolved', 'user-phs-005',
   'Investigation revealed false positive. DNS query originated from a security scanning tool (ForgeScan) that includes cryptocurrency mining domain checks as part of its DNS policy validation. GuardDuty finding suppressed with documented justification.',
   '2026-02-16 18:00:00', NULL, '[]',
   '2026-02-16 14:30:00', '2026-02-16 18:00:00'),

  ('alert-phs-006', 'org_001', NULL,
   'PHI Access Outside Business Hours',
   'Provider account dr.thompson@va.gov accessed 47 patient records between 02:00-03:30 AM EST, outside normal clinical hours.',
   'medium', 'MFEHR Audit Log', 'AUDIT-20260219-0034',
   '["asset-phs-005"]', '["after_hours_access", "phi", "bulk_access"]',
   '{"event_type": "phi_access", "user": "dr.thompson@va.gov", "records_accessed": 47, "time_range": "02:00-03:30 EST"}',
   'new', NULL, NULL, NULL, NULL, '[]',
   '2026-02-19 07:45:00', '2026-02-19 07:45:00');

-- ========================================
-- 10. SECURITY INCIDENTS (2 incidents)
-- ========================================
INSERT OR IGNORE INTO security_incidents (id, org_id, incident_type, severity, title, description, source_ip, affected_user_id, status, detected_at, resolved_at, details, created_at, updated_at)
VALUES
  ('inc-phs-001', 'org_001', 'unauthorized_access', 'medium',
   'Brute Force Attack on Admin Account',
   'Coordinated brute force attack targeting administrative account marcus.chen@patriothealth.com from multiple Tor exit nodes. Account was locked automatically after 10 failed attempts. No successful authentication detected. Attack lasted approximately 45 minutes across 3 source IPs.',
   '185.234.72.19', 'user-phs-001',
   'closed', '2026-02-17 14:22:00', '2026-02-17 15:45:00',
   '{"incident_number": "INC-PHS-2026-001", "commander_id": "user-phs-002", "affected_systems": ["sys-phs-001"], "timeline": [{"timestamp": "2026-02-17T14:22:00Z", "event": "First failed login detected from 185.234.72.19"}, {"timestamp": "2026-02-17T14:27:00Z", "event": "Account locked after 10 failures"}, {"timestamp": "2026-02-17T14:30:00Z", "event": "Alert escalated to SOC"}, {"timestamp": "2026-02-17T15:00:00Z", "event": "Two additional Tor IPs identified: 91.219.236.196, 178.175.131.194"}, {"timestamp": "2026-02-17T15:15:00Z", "event": "All 3 IPs blocked at WAF"}, {"timestamp": "2026-02-17T15:30:00Z", "event": "User account verified and unlocked via phone verification"}, {"timestamp": "2026-02-17T15:45:00Z", "event": "Incident closed - no compromise detected"}], "root_cause": "Automated brute force attack from Tor network targeting known admin email address. Email was likely harvested from public LinkedIn profile or conference speaker list.", "impact_assessment": "No data breach or unauthorized access occurred. Account lockout policy functioned as designed. No PHI exposure.", "lessons_learned": "Recommend implementing CAPTCHA after 3 failed attempts. Consider hiding specific account existence in login error messages. Add Tor exit node IP block list to WAF proactively.", "related_alerts": ["alert-phs-001"]}',
   '2026-02-17 16:00:00', '2026-02-17 16:00:00'),

  ('inc-phs-002', 'org_001', 'unauthorized_access', 'high',
   'Unauthorized API Access from Integration Layer',
   'MuleSoft ESB server (mfehr-esb-mulesoft) was observed making unauthorized API calls to the admin user management endpoint. Under investigation to determine if this is a misconfiguration or potential compromise of the integration server.',
   '10.100.5.10', NULL,
   'investigating', '2026-02-18 16:30:00', NULL,
   '{"incident_number": "INC-PHS-2026-002", "commander_id": "user-phs-002", "affected_systems": ["sys-phs-001"], "timeline": [{"timestamp": "2026-02-18T16:30:00Z", "event": "WAF blocked unauthorized API call from 10.100.5.10 to /api/v2/admin/users"}, {"timestamp": "2026-02-18T16:45:00Z", "event": "Alert triaged by SOC analyst David Washington"}, {"timestamp": "2026-02-18T17:00:00Z", "event": "Additional unauthorized calls identified in last 72 hours: 14 blocked requests"}, {"timestamp": "2026-02-19T06:00:00Z", "event": "Network traffic capture initiated on MuleSoft server for forensic analysis"}], "related_alerts": ["alert-phs-003"]}',
   '2026-02-18 17:00:00', '2026-02-19 06:00:00');

-- ========================================
-- 11. SSP DOCUMENTS (2 SSPs in progress)
-- ========================================
INSERT OR IGNORE INTO ssp_documents (id, org_id, system_id, framework_id, title, version, status, oscal_json, generated_by, approved_by, metadata, created_at, updated_at)
VALUES
  ('ssp-phs-001', 'org_001', 'sys-phs-001', 'fedramp-moderate',
   'MedForge EHR System Security Plan', '1.0-DRAFT', 'in_review',
   '{"system-security-plan": {"uuid": "ssp-phs-001", "metadata": {"title": "MedForge EHR System Security Plan", "last-modified": "2026-02-15T00:00:00Z", "version": "1.0-DRAFT", "oscal-version": "1.1.2"}, "import-profile": {"href": "FedRAMP_Moderate_Baseline"}, "system-characteristics": {"system-name": "MedForge Electronic Health Records", "system-id": "MFEHR", "security-sensitivity-level": "moderate"}}}',
   'user-phs-003', NULL,
   '{"reviewed_by": "user-phs-002", "document_path": "/documents/ssp/MFEHR_SSP_v1.0_DRAFT.json", "notes": "FedRAMP Moderate SSP - First draft under ISSO review. 15 of 325 controls documented, 310 remaining. Target submission to 3PAO: April 2026."}',
   '2026-01-25 09:00:00', '2026-02-15 14:00:00'),

  ('ssp-phs-002', 'org_001', 'sys-phs-002', 'fedramp-moderate',
   'SecureComm Patient Portal System Security Plan', '0.5-DRAFT', 'draft',
   '{"system-security-plan": {"uuid": "ssp-phs-002", "metadata": {"title": "SecureComm Patient Portal System Security Plan", "last-modified": "2026-02-10T00:00:00Z", "version": "0.5-DRAFT", "oscal-version": "1.1.2"}, "import-profile": {"href": "FedRAMP_Moderate_Baseline"}, "system-characteristics": {"system-name": "SecureComm Patient Portal", "system-id": "SCPP", "security-sensitivity-level": "moderate"}}}',
   'user-phs-004', NULL,
   '{"document_path": "/documents/ssp/SCPP_SSP_v0.5_DRAFT.json", "notes": "Initial draft. Focus on documenting system boundary and inherited controls from MFEHR. 8 of 325 controls documented."}',
   '2026-02-05 09:00:00', '2026-02-10 16:00:00');

-- ========================================
-- 12. PENTEST ENGAGEMENTS (2)
-- ========================================
INSERT OR IGNORE INTO pentest_engagements (id, org_id, name, engagement_type, scope_description, rules_of_engagement, target_systems, start_date, end_date, status, lead_tester_id, team_members, findings_summary, report_path, created_at, updated_at)
VALUES
  ('pentest-phs-001', 'org_001',
   'MFEHR Pre-ATO Penetration Test', 'web_app',
   'Comprehensive web application penetration test of the MedForge EHR system including all API endpoints, authentication mechanisms, session management, and data handling. Includes OWASP Top 10 testing and PHI-specific data exposure scenarios.',
   'Testing authorized for MFEHR staging environment only (staging.mfehr.patriothealth.com). No testing against production. No denial of service attacks. No social engineering. Testing window: M-F 08:00-18:00 EST. Emergency contact: David Washington (user-phs-005).',
   '["sys-phs-001"]', '2026-03-01', '2026-03-14',
   'planned', 'user-phs-005', '["user-phs-005", "user-phs-007"]',
   NULL, NULL, '2026-02-15 09:00:00', '2026-02-15 09:00:00'),

  ('pentest-phs-002', 'org_001',
   'SCPP Mobile Application Security Assessment', 'mobile',
   'Security assessment of the SecureComm Patient Portal iOS and Android mobile applications. Includes static analysis, dynamic analysis, API security testing, and data-at-rest encryption verification.',
   'Testing authorized against mobile app builds from TestFlight (iOS) and Firebase App Distribution (Android). API testing against staging endpoint only. No patient data to be used in testing - synthetic test data provided.',
   '["sys-phs-002"]', '2026-03-15', '2026-03-28',
   'planned', 'user-phs-005', '["user-phs-005"]',
   NULL, NULL, '2026-02-15 10:00:00', '2026-02-15 10:00:00');

-- ========================================
-- 13. INTEGRATIONS (4 active integrations)
-- ========================================
INSERT OR IGNORE INTO integrations (id, org_id, name, integration_type, config_encrypted, status, last_sync_at, error_message, created_by, created_at, updated_at)
VALUES
  ('int-phs-001', 'org_001', 'Splunk SIEM', 'siem_splunk',
   '{"host": "phs-siem-splunk.internal", "port": 8089, "index": "forgecomply"}',
   'active', '2026-02-19 06:00:00', NULL, 'user-phs-005', '2026-01-20 09:00:00', '2026-02-19 06:00:00'),
  ('int-phs-002', 'org_001', 'AWS GovCloud', 'cloud_aws',
   '{"region": "us-gov-east-1", "role_arn": "arn:aws-us-gov:iam::123456789012:role/ForgeComplyReadOnly"}',
   'active', '2026-02-19 05:00:00', NULL, 'user-phs-001', '2026-01-20 10:00:00', '2026-02-19 05:00:00'),
  ('int-phs-003', 'org_001', 'Okta Identity', 'identity_okta',
   '{"domain": "patriothealth.okta.com", "api_token": "encrypted"}',
   'active', '2026-02-19 04:00:00', NULL, 'user-phs-002', '2026-01-20 11:00:00', '2026-02-19 04:00:00'),
  ('int-phs-004', 'org_001', 'ServiceNow ITSM', 'itsm_servicenow',
   '{"instance": "patriothealth.service-now.com"}',
   'active', '2026-02-18 22:00:00', NULL, 'user-phs-002', '2026-01-20 14:00:00', '2026-02-18 22:00:00');

-- ========================================
-- 14. NOTIFICATIONS (recent activity)
-- ========================================
INSERT OR IGNORE INTO notifications (id, org_id, recipient_user_id, type, title, message, resource_type, resource_id, details, is_read, read_at, created_at)
VALUES
  ('notif-phs-001', 'org_001', 'user-phs-001', 'vulnerability',
   'Critical Vulnerability Detected',
   'ForgeScan detected a critical vulnerability (Log4Shell) on mfehr-db-primary. POAM-PHS-2026-001 has been automatically created.',
   'vulnerability_finding', 'find-phs-001',
   '{"finding_id": "find-phs-001", "poam_id": "poam-phs-001"}',
   1, '2026-02-18 08:05:00', '2026-02-18 07:15:00'),

  ('notif-phs-002', 'org_001', 'user-phs-001', 'vulnerability',
   'Critical Vulnerability Detected',
   'ForgeScan detected SQL Injection in Patient Search API. POAM-PHS-2026-002 created.',
   'vulnerability_finding', 'find-phs-002',
   '{"finding_id": "find-phs-002", "poam_id": "poam-phs-002"}',
   1, '2026-02-18 08:30:00', '2026-02-18 07:22:00'),

  ('notif-phs-003', 'org_001', 'user-phs-005', 'vulnerability',
   'Vulnerability Scan Complete',
   'Weekly infrastructure scan completed. 18 findings: 2 Critical, 5 High, 6 Medium, 5 Low.',
   'vulnerability_scan', 'scan-phs-20260218',
   '{"scan_id": "scan-phs-20260218", "total": 18, "critical": 2, "high": 5, "medium": 6, "low": 5}',
   1, '2026-02-18 12:00:00', '2026-02-18 11:30:00'),

  ('notif-phs-004', 'org_001', 'user-phs-002', 'compliance_alert',
   'Security Incident Opened',
   'INC-PHS-2026-002: Unauthorized API access from MuleSoft integration server. Investigation initiated.',
   'security_incident', 'inc-phs-002',
   '{"incident_id": "inc-phs-002"}',
   1, '2026-02-18 17:15:00', '2026-02-18 17:00:00'),

  ('notif-phs-005', 'org_001', 'user-phs-003', 'compliance_alert',
   'SSP Review Reminder',
   'The MFEHR SSP (v1.0-DRAFT) has been in review status for 4 days. 310 controls still require documentation.',
   'ssp_document', 'ssp-phs-001',
   '{"ssp_id": "ssp-phs-001"}',
   0, NULL, '2026-02-19 08:00:00'),

  ('notif-phs-006', 'org_001', 'user-phs-006', 'poam_update',
   'POA&M Due Date Approaching',
   'POAM-PHS-2026-005 (Bastion Host Patches) is due in 3 days. Current status: Open.',
   'poam', 'poam-phs-005',
   '{"poam_id": "poam-phs-005"}',
   0, NULL, '2026-02-19 08:00:00');

-- ========================================
-- 15. AUDIT LOGS (recent activity trail)
-- ========================================
INSERT OR IGNORE INTO audit_logs (id, org_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at)
VALUES
  ('log-phs-001', 'org_001', 'user-phs-005', 'scan_initiated', 'vulnerability_scan', 'scan-phs-20260218',
   '{"scan_type": "full", "targets": "all_systems"}', '10.100.0.50', 'ForgeScan/2.1', '2026-02-18 02:00:00'),
  ('log-phs-002', 'org_001', 'user-phs-005', 'scan_completed', 'vulnerability_scan', 'scan-phs-20260218',
   '{"findings": 18, "critical": 2, "high": 5, "medium": 6, "low": 5}', '10.100.0.50', 'ForgeScan/2.1', '2026-02-18 06:45:00'),
  ('log-phs-003', 'org_001', 'user-phs-005', 'poam_created', 'poam', 'poam-phs-001',
   '{"poam_id": "POAM-PHS-2026-001", "risk_level": "critical"}', '10.100.0.50', 'Mozilla/5.0', '2026-02-18 08:00:00'),
  ('log-phs-004', 'org_001', 'user-phs-005', 'poam_created', 'poam', 'poam-phs-002',
   '{"poam_id": "POAM-PHS-2026-002", "risk_level": "critical"}', '10.100.0.50', 'Mozilla/5.0', '2026-02-18 08:30:00'),
  ('log-phs-005', 'org_001', 'user-phs-005', 'finding_updated', 'vulnerability_finding', 'find-phs-001',
   '{"old_status": "open", "new_status": "in_progress"}', '10.100.0.50', 'Mozilla/5.0', '2026-02-18 09:00:00'),
  ('log-phs-006', 'org_001', 'user-phs-003', 'ssp_updated', 'ssp_document', 'ssp-phs-001',
   '{"old_status": "draft", "new_status": "in_review"}', '10.20.5.122', 'Mozilla/5.0', '2026-02-15 14:00:00'),
  ('log-phs-007', 'org_001', 'user-phs-002', 'incident_created', 'security_incident', 'inc-phs-002',
   '{"incident_number": "INC-PHS-2026-002", "severity": "high"}', '10.20.5.88', 'Mozilla/5.0', '2026-02-18 17:00:00'),
  ('log-phs-008', 'org_001', 'user-phs-001', 'login_success', 'session', NULL,
   '{"mfa": true, "ip": "10.20.5.100"}', '10.20.5.100', 'Mozilla/5.0', '2026-02-19 08:00:00'),
  ('log-phs-009', 'org_001', 'user-phs-004', 'control_assessed', 'control_implementation', 'ci-phs-012',
   '{"old_assessment": "not_assessed", "new_assessment": "other_than_satisfied"}', '10.20.5.95', 'Mozilla/5.0', '2026-02-08 11:00:00'),
  ('log-phs-010', 'org_001', 'user-phs-005', 'finding_remediated', 'vulnerability_finding', 'find-phs-010',
   '{"old_status": "open", "new_status": "remediated"}', '10.100.0.50', 'Mozilla/5.0', '2026-02-18 14:00:00');

-- ========================================
-- 16. ALERT RULES (4 configured rules)
-- ========================================
INSERT OR IGNORE INTO alert_rules (id, org_id, name, description, rule_type, conditions, severity, mitre_tactics, mitre_techniques, compliance_controls, notification_channels, is_enabled, created_by, created_at, updated_at)
VALUES
  ('rule-phs-001', 'org_001', 'Brute Force Detection',
   'Alert on 10+ failed login attempts from single IP within 5 minutes',
   'threshold',
   '{"metric": "failed_logins", "threshold": 10, "window_seconds": 300, "group_by": "source_ip"}',
   'high', '["TA0001"]', '["T1110"]', '["AC-7", "SI-4"]',
   '["in_app", "email", "slack"]', 1, 'user-phs-005',
   '2026-01-20 09:00:00', '2026-01-20 09:00:00'),

  ('rule-phs-002', 'org_001', 'Bulk PHI Export Detection',
   'Alert when user exports more than 500 patient records in single query',
   'threshold',
   '{"metric": "phi_records_exported", "threshold": 500, "window_seconds": 60, "group_by": "user_id"}',
   'high', '["TA0010"]', '["T1567"]', '["AC-3", "AU-12", "SC-28"]',
   '["in_app", "email"]', 1, 'user-phs-002',
   '2026-01-22 14:00:00', '2026-01-22 14:00:00'),

  ('rule-phs-003', 'org_001', 'After-Hours PHI Access',
   'Alert on PHI access outside 06:00-22:00 local time for non-emergency users',
   'anomaly',
   '{"metric": "phi_access", "time_restriction": {"start": "06:00", "end": "22:00", "timezone": "America/New_York"}, "exclude_roles": ["emergency_provider"]}',
   'medium', '["TA0009"]', '["T1530"]', '["AC-2", "AC-3", "AU-6"]',
   '["in_app"]', 1, 'user-phs-002',
   '2026-01-25 10:00:00', '2026-01-25 10:00:00'),

  ('rule-phs-004', 'org_001', 'Critical Vulnerability Auto-POA&M',
   'Automatically create POA&M for any critical or high vulnerability finding',
   'signature',
   '{"event_type": "new_vulnerability", "severity": ["critical", "high"], "auto_action": "create_poam"}',
   'critical', '[]', '[]', '["RA-5", "SI-2"]',
   '["in_app", "email", "slack"]', 1, 'user-phs-005',
   '2026-01-20 09:00:00', '2026-01-20 09:00:00');

-- ============================================================================
-- LOGIN CREDENTIALS
-- ============================================================================
-- Primary Admin:
--   Email:    stanley.riley@forgecyberdefense.com
--   Password: (your existing password)
--   Role:     owner (full access)
--
-- Demo Accounts (all use password: ForgeDemo2026!):
--   marcus.chen@patriothealth.com      admin    (CISO)
--   sarah.rodriguez@patriothealth.com  admin    (ISSO)
--   emily.patel@patriothealth.com      admin    (Sys Owner)
--   james.okonkwo@patriothealth.com    analyst  (Compliance)
--   lisa.nakamura@patriothealth.com    analyst  (ISSO SCPP)
--   david.washington@patriothealth.com analyst  (Security Eng)
--   robert.kim@patriothealth.com       analyst  (Junior Analyst)
--   demo@patriothealth.com             admin    (Demo Admin)
-- ============================================================================

-- Track migration
INSERT OR IGNORE INTO schema_migrations (version, name, description) VALUES
  ('migrate-024-seed-phs-sample-data', 'seed-phs-sample-data', 'Seed Patriot Health Systems demo customer data');
