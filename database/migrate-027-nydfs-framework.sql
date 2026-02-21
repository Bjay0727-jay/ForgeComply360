-- ============================================================================
-- MIGRATION 027: NY DFS 23 NYCRR 500 Cybersecurity Regulation
-- ============================================================================
-- Adds the NY DFS 23 NYCRR 500 framework (amended November 2023) with
-- ~45 controls across 16 sections and crosswalk mappings to NIST 800-53 R5.
-- Fully idempotent — safe to re-run on every deploy (INSERT OR REPLACE).
-- ============================================================================

-- Framework definition
INSERT OR REPLACE INTO compliance_frameworks (id, name, version, category, description, control_count, governing_body, assessment_methodology)
VALUES ('nydfs-500', 'NY DFS 23 NYCRR 500', '2023', 'commercial',
  'New York Department of Financial Services Cybersecurity Regulation (23 NYCRR Part 500), amended November 2023. Establishes cybersecurity requirements for financial services companies regulated by NY DFS including banks, insurance companies, and other financial institutions.',
  45, 'NY DFS', 'Regulatory Examination');

-- ============================================================================
-- CYBERSECURITY PROGRAM & GOVERNANCE (500.2-500.4) — 8 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nydfs-500', 'NYDFS-500.2-A', 'Cybersecurity Program', 'Maintain Cybersecurity Program',
 'Maintain a cybersecurity program designed to protect the confidentiality, integrity, and availability of information systems.', 'P1', 1, 1, 1, 1),
('nydfs-500', 'NYDFS-500.2-B', 'Cybersecurity Program', 'Core Cybersecurity Functions',
 'Program must perform core cybersecurity functions: identify and assess risks, protect against unauthorized access, detect cybersecurity events, respond to and recover from events.', 'P1', 1, 1, 1, 2),
('nydfs-500', 'NYDFS-500.2-C', 'Cybersecurity Program', 'Independent Audits',
 'Class A companies must have independent audits of the cybersecurity program conducted at least annually.', 'P1', 0, 1, 1, 3),
('nydfs-500', 'NYDFS-500.3-A', 'Cybersecurity Policy', 'Written Cybersecurity Policy',
 'Implement and maintain a written cybersecurity policy approved by senior officer or board.', 'P1', 1, 1, 1, 4),
('nydfs-500', 'NYDFS-500.3-B', 'Cybersecurity Policy', 'Annual Policy Approval',
 'Cybersecurity policy must be reviewed and approved by senior governing body or senior officer at least annually.', 'P1', 1, 1, 1, 5),
('nydfs-500', 'NYDFS-500.4-A', 'Cybersecurity Governance', 'Designate Qualified CISO',
 'Designate a qualified Chief Information Security Officer responsible for overseeing and implementing the cybersecurity program.', 'P1', 1, 1, 1, 6),
('nydfs-500', 'NYDFS-500.4-B', 'Cybersecurity Governance', 'CISO Annual Report',
 'CISO must report in writing at least annually to the senior governing body on the cybersecurity program.', 'P1', 1, 1, 1, 7),
('nydfs-500', 'NYDFS-500.4-C', 'Cybersecurity Governance', 'Board Cybersecurity Understanding',
 'Senior governing body must have sufficient understanding of cybersecurity to exercise effective oversight.', 'P1', 1, 1, 1, 8);

-- ============================================================================
-- VULNERABILITY MANAGEMENT (500.5) — 4 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nydfs-500', 'NYDFS-500.5-A', 'Vulnerability Management', 'Penetration Testing Program',
 'Conduct penetration testing from inside and outside information system boundaries at least annually.', 'P1', 1, 1, 1, 9),
('nydfs-500', 'NYDFS-500.5-B', 'Vulnerability Management', 'Vulnerability Assessments',
 'Conduct vulnerability assessments including automated scans and manual reviews of information systems.', 'P1', 1, 1, 1, 10),
('nydfs-500', 'NYDFS-500.5-C', 'Vulnerability Management', 'Class A Weekly Scanning',
 'Class A companies must conduct automated vulnerability scans or reviews at least weekly.', 'P1', 0, 1, 1, 11),
('nydfs-500', 'NYDFS-500.5-D', 'Vulnerability Management', 'Remediation of Material Gaps',
 'Document and remediate material gaps and weaknesses identified through testing and assessments.', 'P1', 1, 1, 1, 12);

-- ============================================================================
-- AUDIT TRAIL (500.6) — 3 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nydfs-500', 'NYDFS-500.6-A1', 'Audit Trail', 'Financial Transaction Reconstruction',
 'Maintain systems that can reconstruct material financial transactions to support normal operations.', 'P1', 1, 1, 1, 13),
('nydfs-500', 'NYDFS-500.6-A2', 'Audit Trail', 'Cybersecurity Event Detection',
 'Maintain audit trails designed to detect and respond to cybersecurity events.', 'P1', 1, 1, 1, 14),
('nydfs-500', 'NYDFS-500.6-B', 'Audit Trail', 'Audit Trail Retention',
 'Retain records of financial transactions for 5 years and cybersecurity event audit trails for 3 years.', 'P1', 1, 1, 1, 15);

-- ============================================================================
-- ACCESS PRIVILEGES (500.7) — 5 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nydfs-500', 'NYDFS-500.7-A', 'Access Privileges', 'Limit User Access Privileges',
 'Limit user access privileges to information systems that provide access to nonpublic information.', 'P1', 1, 1, 1, 16),
('nydfs-500', 'NYDFS-500.7-B', 'Access Privileges', 'Periodic Access Review',
 'Periodically review all user access privileges and remove access no longer necessary.', 'P1', 1, 1, 1, 17),
('nydfs-500', 'NYDFS-500.7-C', 'Access Privileges', 'Privileged Access Management',
 'Implement privileged access management solution to manage and monitor privileged accounts.', 'P1', 1, 1, 1, 18),
('nydfs-500', 'NYDFS-500.7-D', 'Access Privileges', 'Common Password Blocking',
 'Implement automated method to block commonly used passwords for all user accounts.', 'P1', 1, 1, 1, 19),
('nydfs-500', 'NYDFS-500.7-E', 'Access Privileges', 'Privileged Activity Monitoring',
 'Monitor activity of privileged users and implement alerts for anomalous activity.', 'P1', 1, 1, 1, 20);

-- ============================================================================
-- APPLICATION SECURITY & RISK ASSESSMENT (500.8-500.9) — 5 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nydfs-500', 'NYDFS-500.8-A', 'Application Security', 'Secure Development Practices',
 'Implement written procedures for secure development of in-house applications.', 'P1', 1, 1, 1, 21),
('nydfs-500', 'NYDFS-500.8-B', 'Application Security', 'External Application Evaluation',
 'Evaluate and assess the security of externally developed applications.', 'P1', 1, 1, 1, 22),
('nydfs-500', 'NYDFS-500.9-A', 'Risk Assessment', 'Periodic Risk Assessment',
 'Conduct periodic risk assessment of information systems sufficient to inform cybersecurity program design.', 'P1', 1, 1, 1, 23),
('nydfs-500', 'NYDFS-500.9-B', 'Risk Assessment', 'Risk Assessment Updates',
 'Update risk assessments whenever a change in business or technology causes material change in cyber risk.', 'P1', 1, 1, 1, 24),
('nydfs-500', 'NYDFS-500.9-C', 'Risk Assessment', 'Annual Risk Assessment Review',
 'Review and update the risk assessment at least annually.', 'P1', 1, 1, 1, 25);

-- ============================================================================
-- PERSONNEL, THIRD-PARTY, MFA (500.10-500.12) — 7 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nydfs-500', 'NYDFS-500.10-A', 'Cybersecurity Personnel', 'Qualified Security Personnel',
 'Utilize qualified cybersecurity personnel sufficient to manage the cybersecurity program.', 'P1', 1, 1, 1, 26),
('nydfs-500', 'NYDFS-500.10-B', 'Cybersecurity Personnel', 'Threat Intelligence',
 'Provide cybersecurity personnel with threat intelligence updates and ongoing training.', 'P1', 1, 1, 1, 27),
('nydfs-500', 'NYDFS-500.11-A', 'Third-Party Security', 'Third-Party Security Policy',
 'Implement written policy for oversight of third-party service provider security practices.', 'P1', 1, 1, 1, 28),
('nydfs-500', 'NYDFS-500.11-B', 'Third-Party Security', 'Third-Party Risk Assessment',
 'Identify and risk-assess all third parties with access to information systems or nonpublic information.', 'P1', 1, 1, 1, 29),
('nydfs-500', 'NYDFS-500.11-C', 'Third-Party Security', 'Third-Party Due Diligence',
 'Conduct due diligence and periodic assessment of third-party security practices.', 'P1', 1, 1, 1, 30),
('nydfs-500', 'NYDFS-500.12-A', 'Multi-Factor Authentication', 'MFA for System Access',
 'Implement multi-factor authentication for any individual accessing information systems.', 'P1', 1, 1, 1, 31),
('nydfs-500', 'NYDFS-500.12-B', 'Multi-Factor Authentication', 'MFA for Privileged Accounts',
 'Require MFA for all privileged accounts and all remote access to information systems.', 'P1', 1, 1, 1, 32);

-- ============================================================================
-- ASSET MANAGEMENT, MONITORING, ENCRYPTION (500.13-500.15) — 7 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nydfs-500', 'NYDFS-500.13-A', 'Asset Management', 'Asset Inventory',
 'Implement policies and procedures for asset inventory including owner, location, classification, and support expiration.', 'P1', 1, 1, 1, 33),
('nydfs-500', 'NYDFS-500.13-B', 'Asset Management', 'Data Retention and Disposal',
 'Implement data retention policies and secure disposal procedures for nonpublic information.', 'P1', 1, 1, 1, 34),
('nydfs-500', 'NYDFS-500.14-A', 'Monitoring and Training', 'Risk-Based Monitoring',
 'Implement risk-based monitoring controls including malicious code protection and user activity monitoring.', 'P1', 1, 1, 1, 35),
('nydfs-500', 'NYDFS-500.14-B', 'Monitoring and Training', 'Annual Cybersecurity Training',
 'Provide annual cybersecurity awareness training to all personnel including social engineering scenarios.', 'P1', 1, 1, 1, 36),
('nydfs-500', 'NYDFS-500.15-A', 'Encryption', 'Encryption Policies',
 'Implement encryption policies and procedures for protection of nonpublic information.', 'P1', 1, 1, 1, 37),
('nydfs-500', 'NYDFS-500.15-B', 'Encryption', 'Encryption in Transit',
 'Encrypt nonpublic information in transit over external networks using industry standards.', 'P1', 1, 1, 1, 38),
('nydfs-500', 'NYDFS-500.15-C', 'Encryption', 'Encryption at Rest',
 'Encrypt nonpublic information at rest, or implement compensating controls with documented infeasibility justification.', 'P1', 1, 1, 1, 39);

-- ============================================================================
-- INCIDENT RESPONSE & NOTIFICATION (500.16-500.17) — 6 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nydfs-500', 'NYDFS-500.16-A', 'Incident Response', 'Written Incident Response Plan',
 'Establish a written incident response plan addressing response, recovery, and ransomware procedures.', 'P1', 1, 1, 1, 40),
('nydfs-500', 'NYDFS-500.16-B', 'Incident Response', 'Recovery from Backups',
 'Maintain tested backup and recovery capabilities to restore systems after cybersecurity events.', 'P1', 1, 1, 1, 41),
('nydfs-500', 'NYDFS-500.16-C', 'Incident Response', 'Root Cause Analysis',
 'Prepare and maintain capacity to perform root cause analysis of cybersecurity events.', 'P1', 1, 1, 1, 42),
('nydfs-500', 'NYDFS-500.17-A', 'Notification', '72-Hour Event Notification',
 'Notify Superintendent within 72 hours of determining a cybersecurity event has occurred.', 'P1', 1, 1, 1, 43),
('nydfs-500', 'NYDFS-500.17-B', 'Notification', 'Ransomware Incident Notification',
 'Notify Superintendent within 72 hours of any ransomware deployment within a material part of systems.', 'P1', 1, 1, 1, 44),
('nydfs-500', 'NYDFS-500.17-C', 'Notification', 'Annual Certification',
 'Submit annual certification of compliance to the Superintendent by April 15, signed by CEO and CISO.', 'P1', 1, 1, 1, 45);

-- ============================================================================
-- CROSSWALK MAPPINGS — NY DFS to NIST 800-53 R5
-- ============================================================================

INSERT OR REPLACE INTO control_crosswalks (source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence, notes) VALUES
('nydfs-500', 'NYDFS-500.2-A', 'nist-800-53-r5', 'PM-1', 'equivalent', 0.90, 'Cybersecurity program maps to NIST Information Security Program Plan'),
('nydfs-500', 'NYDFS-500.4-A', 'nist-800-53-r5', 'PM-2', 'equivalent', 0.90, 'CISO designation maps to NIST Senior Information Security Officer'),
('nydfs-500', 'NYDFS-500.5-A', 'nist-800-53-r5', 'CA-8', 'equivalent', 0.90, 'Penetration testing maps to NIST Penetration Testing'),
('nydfs-500', 'NYDFS-500.5-B', 'nist-800-53-r5', 'RA-5', 'equivalent', 0.90, 'Vulnerability assessments maps to NIST Vulnerability Scanning'),
('nydfs-500', 'NYDFS-500.6-A2', 'nist-800-53-r5', 'AU-2', 'equivalent', 0.85, 'Audit trail for events maps to NIST Event Logging'),
('nydfs-500', 'NYDFS-500.6-B', 'nist-800-53-r5', 'AU-11', 'equivalent', 0.85, 'Audit retention maps to NIST Audit Record Retention'),
('nydfs-500', 'NYDFS-500.7-A', 'nist-800-53-r5', 'AC-6', 'equivalent', 0.90, 'Access limitations maps to NIST Least Privilege'),
('nydfs-500', 'NYDFS-500.7-B', 'nist-800-53-r5', 'AC-2', 'equivalent', 0.85, 'Access review maps to NIST Account Management'),
('nydfs-500', 'NYDFS-500.8-A', 'nist-800-53-r5', 'SA-11', 'equivalent', 0.85, 'Secure development maps to NIST Developer Testing'),
('nydfs-500', 'NYDFS-500.9-A', 'nist-800-53-r5', 'RA-3', 'equivalent', 0.90, 'Risk assessment maps to NIST Risk Assessment'),
('nydfs-500', 'NYDFS-500.11-A', 'nist-800-53-r5', 'SA-9', 'equivalent', 0.85, 'Third-party policy maps to NIST External System Services'),
('nydfs-500', 'NYDFS-500.12-A', 'nist-800-53-r5', 'IA-2', 'equivalent', 0.90, 'MFA requirement maps to NIST Identification and Authentication'),
('nydfs-500', 'NYDFS-500.13-A', 'nist-800-53-r5', 'CM-8', 'equivalent', 0.85, 'Asset inventory maps to NIST System Component Inventory'),
('nydfs-500', 'NYDFS-500.14-A', 'nist-800-53-r5', 'SI-4', 'equivalent', 0.85, 'Risk-based monitoring maps to NIST System Monitoring'),
('nydfs-500', 'NYDFS-500.14-B', 'nist-800-53-r5', 'AT-2', 'equivalent', 0.90, 'Annual training maps to NIST Literacy Training'),
('nydfs-500', 'NYDFS-500.15-B', 'nist-800-53-r5', 'SC-8', 'equivalent', 0.85, 'Encryption in transit maps to NIST Transmission Confidentiality'),
('nydfs-500', 'NYDFS-500.15-C', 'nist-800-53-r5', 'SC-28', 'equivalent', 0.85, 'Encryption at rest maps to NIST Protection of Information at Rest'),
('nydfs-500', 'NYDFS-500.16-A', 'nist-800-53-r5', 'IR-8', 'equivalent', 0.90, 'Incident response plan maps to NIST Incident Response Plan'),
('nydfs-500', 'NYDFS-500.17-A', 'nist-800-53-r5', 'IR-6', 'equivalent', 0.85, '72-hour notification maps to NIST Incident Reporting'),
('nydfs-500', 'NYDFS-500.5-D', 'nist-800-53-r5', 'SI-2', 'equivalent', 0.85, 'Remediation maps to NIST Flaw Remediation');

-- ============================================================================
-- TRACK MIGRATION
-- ============================================================================
INSERT OR IGNORE INTO schema_migrations (version, name, description) VALUES
  ('migrate-027-nydfs-framework', 'nydfs-framework', 'NY DFS 23 NYCRR 500 framework with 45 controls and crosswalks to NIST 800-53 R5');
