-- ============================================================================
-- MIGRATION 030: NERC CIP (Critical Infrastructure Protection)
-- ============================================================================
-- Adds the NERC CIP framework with ~55 controls across 14 CIP standards
-- and crosswalk mappings to NIST 800-53 R5.
-- First framework using the 'critical_infrastructure' category.
-- Fully idempotent — safe to re-run on every deploy (INSERT OR REPLACE).
-- ============================================================================

-- Framework definition
INSERT OR REPLACE INTO compliance_frameworks (id, name, version, category, description, control_count, governing_body, assessment_methodology)
VALUES ('nerc-cip', 'NERC CIP', '2024', 'critical_infrastructure',
  'North American Electric Reliability Corporation Critical Infrastructure Protection standards. Mandatory cybersecurity requirements for the Bulk Electric System (BES) covering asset categorization, security management, personnel, electronic security perimeters, physical security, systems security, incident response, recovery, configuration management, information protection, supply chain, and network monitoring.',
  55, 'NERC', 'Compliance Audit');

-- ============================================================================
-- CIP-002: BES Cyber System Categorization (3 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nerc-cip', 'CIP-002-R1', 'BES Cyber System Categorization', 'BES Cyber System Identification',
 'Implement a process to identify each BES Cyber System and categorize it as high, medium, or low impact.', 'P1', 1, 1, 1, 1),
('nerc-cip', 'CIP-002-R2', 'BES Cyber System Categorization', 'Categorization Review and Approval',
 'Review and obtain CIP Senior Manager approval of BES Cyber System identifications at least every 15 months.', 'P1', 1, 1, 1, 2),
('nerc-cip', 'CIP-002-R3', 'BES Cyber System Categorization', 'Asset Inventory Documentation',
 'Maintain a list of all BES Cyber Assets and associated Electronic Access Control or Monitoring Systems.', 'P1', 1, 1, 1, 3);

-- ============================================================================
-- CIP-003: Security Management Controls (4 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nerc-cip', 'CIP-003-R1', 'Security Management Controls', 'Cyber Security Plans',
 'Document and implement cyber security plans addressing awareness, physical security, electronic access, incident response, and malicious code mitigation.', 'P1', 1, 1, 1, 4),
('nerc-cip', 'CIP-003-R2', 'Security Management Controls', 'CIP Senior Manager Delegation',
 'Designate CIP Senior Manager with authority to lead, manage, and approve cybersecurity program. Document delegations of authority.', 'P1', 1, 1, 1, 5),
('nerc-cip', 'CIP-003-R3', 'Security Management Controls', 'Vendor Remote Access Controls',
 'Implement security controls for vendor electronic remote access to BES Cyber Systems.', 'P1', 1, 1, 1, 6),
('nerc-cip', 'CIP-003-R4', 'Security Management Controls', 'Transient Device and Removable Media',
 'Implement plans for Transient Cyber Asset and Removable Media malicious code risk mitigation.', 'P1', 1, 1, 1, 7);

-- ============================================================================
-- CIP-004: Personnel & Training (5 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nerc-cip', 'CIP-004-R1', 'Personnel and Training', 'Security Awareness Program',
 'Implement a security awareness program to ensure personnel understand cybersecurity risks and responsibilities.', 'P1', 1, 1, 1, 8),
('nerc-cip', 'CIP-004-R2', 'Personnel and Training', 'Cyber Security Training',
 'Provide cyber security training prior to granting access and annually (every 15 months).', 'P1', 1, 1, 1, 9),
('nerc-cip', 'CIP-004-R3', 'Personnel and Training', 'Personnel Risk Assessment',
 'Conduct personnel risk assessments including identity verification and 7-year criminal background checks.', 'P1', 1, 1, 1, 10),
('nerc-cip', 'CIP-004-R4', 'Personnel and Training', 'Access Management Program',
 'Implement access management including authorized access lists, quarterly reviews, and timely revocation.', 'P1', 1, 1, 1, 11),
('nerc-cip', 'CIP-004-R5', 'Personnel and Training', 'Access Revocation',
 'Revoke access upon reassignment or termination within 24 hours for terminated personnel.', 'P1', 1, 1, 1, 12);

-- ============================================================================
-- CIP-005: Electronic Security Perimeters (3 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nerc-cip', 'CIP-005-R1', 'Electronic Security Perimeters', 'Electronic Security Perimeter',
 'Define Electronic Security Perimeters (ESP) with all applicable Cyber Assets residing within. Implement inbound/outbound access permissions and deny-by-default.', 'P1', 1, 1, 1, 13),
('nerc-cip', 'CIP-005-R2', 'Electronic Security Perimeters', 'Remote Access Management',
 'Manage remote access with multi-factor authentication, encryption, and intermediate systems for interactive sessions.', 'P1', 1, 1, 1, 14),
('nerc-cip', 'CIP-005-R3', 'Electronic Security Perimeters', 'Vendor Remote Access Controls',
 'Identify and control vendor remote access sessions with ability to disable connections.', 'P1', 0, 1, 1, 15);

-- ============================================================================
-- CIP-006: Physical Security (3 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nerc-cip', 'CIP-006-R1', 'Physical Security', 'Physical Security Plan',
 'Implement physical security plan with defined perimeters, two or more access controls, monitoring, logging, visitor escort, and continuous surveillance.', 'P1', 1, 1, 1, 16),
('nerc-cip', 'CIP-006-R2', 'Physical Security', 'Physical Access Control Systems',
 'Implement and manage physical access control systems for BES Cyber System facilities.', 'P1', 1, 1, 1, 17),
('nerc-cip', 'CIP-006-R3', 'Physical Security', 'Maintenance and Testing',
 'Maintain and test physical security equipment and access control mechanisms at least annually.', 'P1', 1, 1, 1, 18);

-- ============================================================================
-- CIP-007: Systems Security Management (5 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nerc-cip', 'CIP-007-R1', 'Systems Security Management', 'Ports and Services Management',
 'Enable only needed logical and physical ports and services on BES Cyber Systems.', 'P1', 1, 1, 1, 19),
('nerc-cip', 'CIP-007-R2', 'Systems Security Management', 'Security Patch Management',
 'Implement patch management process with evaluation at least every 35 days, testing, and installation or documented mitigation.', 'P1', 1, 1, 1, 20),
('nerc-cip', 'CIP-007-R3', 'Systems Security Management', 'Malicious Code Prevention',
 'Deploy malware prevention tools with current signatures, detection, and alerting capabilities.', 'P1', 1, 1, 1, 21),
('nerc-cip', 'CIP-007-R4', 'Systems Security Management', 'Security Event Monitoring',
 'Log security events, generate alerts, review logs at least every 15 days, and retain for minimum 90 days.', 'P1', 1, 1, 1, 22),
('nerc-cip', 'CIP-007-R5', 'Systems Security Management', 'System Access Controls',
 'Implement authentication, unique identification, password complexity, default password changes, and failed login attempt limiting.', 'P1', 1, 1, 1, 23);

-- ============================================================================
-- CIP-008: Incident Reporting and Response (4 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nerc-cip', 'CIP-008-R1', 'Incident Reporting and Response', 'Incident Response Plan',
 'Develop cyber security incident response plan with roles, responsibilities, handling processes, and contact information.', 'P1', 1, 1, 1, 24),
('nerc-cip', 'CIP-008-R2', 'Incident Reporting and Response', 'Incident Response Testing',
 'Test incident response plan at least every 15 months and retain test records.', 'P1', 1, 1, 1, 25),
('nerc-cip', 'CIP-008-R3', 'Incident Reporting and Response', 'Plan Review and Update',
 'Update plan within 90 days of test or incident. Notify personnel within 90 days of changes. Document lessons learned.', 'P1', 1, 1, 1, 26),
('nerc-cip', 'CIP-008-R4', 'Incident Reporting and Response', 'Reportable Incident Notification',
 'Notify E-ISAC within 1 hour of determining a reportable Cyber Security Incident has occurred.', 'P1', 1, 1, 1, 27);

-- ============================================================================
-- CIP-009: Recovery Plans (3 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nerc-cip', 'CIP-009-R1', 'Recovery Plans', 'Recovery Plan Specifications',
 'Develop recovery plans specifying conditions for activation, roles, backup procedures, and data storage.', 'P1', 1, 1, 1, 28),
('nerc-cip', 'CIP-009-R2', 'Recovery Plans', 'Recovery Plan Testing',
 'Test recovery plan at least every 15 months. Verify backup processes and data preservation during recovery.', 'P1', 1, 1, 1, 29),
('nerc-cip', 'CIP-009-R3', 'Recovery Plans', 'Recovery Plan Maintenance',
 'Update recovery plan within 90 days of test or activation. Notify personnel of changes and document lessons learned.', 'P1', 1, 1, 1, 30);

-- ============================================================================
-- CIP-010: Configuration Change Management & Vulnerability Assessment (4 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nerc-cip', 'CIP-010-R1', 'Configuration and Vulnerability Management', 'Configuration Change Management',
 'Maintain baseline configurations, authorize changes, document changes, verify controls after changes, and update baselines within 30 days.', 'P1', 1, 1, 1, 31),
('nerc-cip', 'CIP-010-R2', 'Configuration and Vulnerability Management', 'Configuration Monitoring',
 'Monitor for unauthorized configuration changes at least every 35 days with alerting and investigation procedures.', 'P1', 0, 1, 1, 32),
('nerc-cip', 'CIP-010-R3', 'Configuration and Vulnerability Management', 'Vulnerability Assessment',
 'Conduct vulnerability assessments at least every 15 months and for new assets. Document results and create action plans for findings.', 'P1', 1, 1, 1, 33),
('nerc-cip', 'CIP-010-R4', 'Configuration and Vulnerability Management', 'Transient Cyber Asset Management',
 'Implement plans for managing Transient Cyber Assets and Removable Media before connection to BES Cyber Systems.', 'P1', 1, 1, 1, 34);

-- ============================================================================
-- CIP-011: Information Protection (2 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nerc-cip', 'CIP-011-R1', 'Information Protection', 'Information Protection Program',
 'Identify BES Cyber System Information (BCSI) and implement methods to protect and securely handle it.', 'P1', 1, 1, 1, 35),
('nerc-cip', 'CIP-011-R2', 'Information Protection', 'Media Reuse and Disposal',
 'Sanitize or destroy media containing BCSI prior to reuse or disposal. Implement key management for encrypted media.', 'P1', 1, 1, 1, 36);

-- ============================================================================
-- CIP-012: Communications Between Control Centers (2 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nerc-cip', 'CIP-012-R1', 'Control Center Communications', 'Communication Link Protection',
 'Implement plans to mitigate risks of unauthorized disclosure, modification, and loss of availability for communication links between control centers.', 'P1', 0, 1, 1, 37),
('nerc-cip', 'CIP-012-R2', 'Control Center Communications', 'Data Integrity Protection',
 'Protect integrity and confidentiality of real-time data transmitted between control centers.', 'P1', 0, 1, 1, 38);

-- ============================================================================
-- CIP-013: Supply Chain Risk Management (2 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nerc-cip', 'CIP-013-R1', 'Supply Chain Risk Management', 'Supply Chain Risk Management Plan',
 'Develop supply chain risk management plans covering vendor risk assessment, software integrity, remote access controls, vulnerability disclosure, patch verification, and incident coordination.', 'P1', 0, 1, 1, 39),
('nerc-cip', 'CIP-013-R2', 'Supply Chain Risk Management', 'Supply Chain Plan Implementation',
 'Implement and document supply chain risk management plans for applicable BES Cyber Systems.', 'P1', 0, 1, 1, 40);

-- ============================================================================
-- CIP-014: Physical Security of Transmission Stations (4 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nerc-cip', 'CIP-014-R1', 'Transmission Station Physical Security', 'Risk Assessment',
 'Conduct initial and periodic risk assessments of transmission stations and substations.', 'P1', 0, 0, 1, 41),
('nerc-cip', 'CIP-014-R2', 'Transmission Station Physical Security', 'Third-Party Verification',
 'Have an unaffiliated third party verify the risk assessment results.', 'P1', 0, 0, 1, 42),
('nerc-cip', 'CIP-014-R4', 'Transmission Station Physical Security', 'Threat and Vulnerability Evaluation',
 'Evaluate potential physical threats and vulnerabilities to identified critical facilities.', 'P1', 0, 0, 1, 43),
('nerc-cip', 'CIP-014-R5', 'Transmission Station Physical Security', 'Physical Security Plan',
 'Develop and implement documented physical security plans for identified critical facilities.', 'P1', 0, 0, 1, 44);

-- ============================================================================
-- CIP-015: Internal Network Security Monitoring (3 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nerc-cip', 'CIP-015-R1', 'Network Security Monitoring', 'Network Monitoring and Detection',
 'Implement network data feeds for monitoring. Detect and evaluate anomalous network activity within BES Cyber Systems.', 'P1', 0, 1, 1, 45),
('nerc-cip', 'CIP-015-R2', 'Network Security Monitoring', 'Anomaly Data Retention',
 'Retain data related to detected anomalous network activity for investigation and analysis.', 'P1', 0, 1, 1, 46),
('nerc-cip', 'CIP-015-R3', 'Network Security Monitoring', 'Monitoring Data Protection',
 'Protect the integrity and availability of network monitoring data from unauthorized modification.', 'P1', 0, 1, 1, 47);

-- ============================================================================
-- CROSSWALK MAPPINGS — NERC CIP to NIST 800-53 R5
-- ============================================================================

INSERT OR REPLACE INTO control_crosswalks (source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence, notes) VALUES
('nerc-cip', 'CIP-002-R1', 'nist-800-53-r5', 'RA-2', 'equivalent', 0.85, 'BES Cyber System categorization maps to NIST Security Categorization'),
('nerc-cip', 'CIP-003-R1', 'nist-800-53-r5', 'PL-1', 'equivalent', 0.85, 'Cyber security plans maps to NIST Security Planning Policy'),
('nerc-cip', 'CIP-004-R1', 'nist-800-53-r5', 'AT-2', 'equivalent', 0.90, 'Security awareness program maps to NIST Literacy Training'),
('nerc-cip', 'CIP-004-R2', 'nist-800-53-r5', 'AT-3', 'equivalent', 0.85, 'Cyber security training maps to NIST Role-Based Training'),
('nerc-cip', 'CIP-004-R3', 'nist-800-53-r5', 'PS-3', 'equivalent', 0.90, 'Personnel risk assessment maps to NIST Personnel Screening'),
('nerc-cip', 'CIP-004-R4', 'nist-800-53-r5', 'AC-2', 'equivalent', 0.85, 'Access management maps to NIST Account Management'),
('nerc-cip', 'CIP-005-R1', 'nist-800-53-r5', 'SC-7', 'equivalent', 0.90, 'Electronic security perimeter maps to NIST Boundary Protection'),
('nerc-cip', 'CIP-005-R2', 'nist-800-53-r5', 'AC-17', 'equivalent', 0.85, 'Remote access management maps to NIST Remote Access'),
('nerc-cip', 'CIP-005-R2', 'nist-800-53-r5', 'IA-2', 'partial', 0.80, 'MFA for remote access maps to NIST Identification and Authentication'),
('nerc-cip', 'CIP-006-R1', 'nist-800-53-r5', 'PE-3', 'equivalent', 0.90, 'Physical security plan maps to NIST Physical Access Control'),
('nerc-cip', 'CIP-007-R1', 'nist-800-53-r5', 'CM-7', 'equivalent', 0.90, 'Ports and services management maps to NIST Least Functionality'),
('nerc-cip', 'CIP-007-R2', 'nist-800-53-r5', 'SI-2', 'equivalent', 0.90, 'Patch management maps to NIST Flaw Remediation'),
('nerc-cip', 'CIP-007-R3', 'nist-800-53-r5', 'SI-3', 'equivalent', 0.85, 'Malicious code prevention maps to NIST Malicious Code Protection'),
('nerc-cip', 'CIP-007-R4', 'nist-800-53-r5', 'AU-2', 'equivalent', 0.85, 'Security event monitoring maps to NIST Event Logging'),
('nerc-cip', 'CIP-007-R5', 'nist-800-53-r5', 'IA-5', 'equivalent', 0.85, 'System access controls maps to NIST Authenticator Management'),
('nerc-cip', 'CIP-008-R1', 'nist-800-53-r5', 'IR-8', 'equivalent', 0.90, 'Incident response plan maps to NIST Incident Response Plan'),
('nerc-cip', 'CIP-008-R2', 'nist-800-53-r5', 'IR-3', 'equivalent', 0.85, 'Incident response testing maps to NIST IR Testing'),
('nerc-cip', 'CIP-009-R1', 'nist-800-53-r5', 'CP-2', 'equivalent', 0.90, 'Recovery plan maps to NIST Contingency Plan'),
('nerc-cip', 'CIP-009-R2', 'nist-800-53-r5', 'CP-4', 'equivalent', 0.85, 'Recovery plan testing maps to NIST Contingency Plan Testing'),
('nerc-cip', 'CIP-010-R1', 'nist-800-53-r5', 'CM-2', 'equivalent', 0.85, 'Configuration management maps to NIST Baseline Configuration'),
('nerc-cip', 'CIP-010-R1', 'nist-800-53-r5', 'CM-3', 'equivalent', 0.85, 'Change management maps to NIST Configuration Change Control'),
('nerc-cip', 'CIP-010-R3', 'nist-800-53-r5', 'RA-5', 'equivalent', 0.90, 'Vulnerability assessment maps to NIST Vulnerability Scanning'),
('nerc-cip', 'CIP-011-R1', 'nist-800-53-r5', 'SC-28', 'equivalent', 0.85, 'Information protection maps to NIST Protection of Information at Rest'),
('nerc-cip', 'CIP-011-R2', 'nist-800-53-r5', 'MP-6', 'equivalent', 0.85, 'Media disposal maps to NIST Media Sanitization'),
('nerc-cip', 'CIP-012-R1', 'nist-800-53-r5', 'SC-8', 'equivalent', 0.85, 'Communication link protection maps to NIST Transmission Confidentiality'),
('nerc-cip', 'CIP-013-R1', 'nist-800-53-r5', 'SR-2', 'equivalent', 0.85, 'Supply chain risk management maps to NIST SCRM Plan'),
('nerc-cip', 'CIP-015-R1', 'nist-800-53-r5', 'SI-4', 'equivalent', 0.85, 'Network monitoring maps to NIST System Monitoring');

-- ============================================================================
-- TRACK MIGRATION
-- ============================================================================
INSERT OR IGNORE INTO schema_migrations (version, name, description) VALUES
  ('migrate-030-nerc-cip-framework', 'nerc-cip-framework', 'NERC CIP framework with 47 controls across 14 standards and crosswalks to NIST 800-53 R5');
