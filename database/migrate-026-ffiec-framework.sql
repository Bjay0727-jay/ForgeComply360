-- ============================================================================
-- MIGRATION 026: FFIEC IT Examination Handbook (Information Security)
-- ============================================================================
-- Adds the FFIEC Information Security framework with ~90 controls across
-- 4 domains and crosswalk mappings to NIST 800-53 R5.
-- Fully idempotent — safe to re-run on every deploy (INSERT OR REPLACE).
-- ============================================================================

-- Framework definition
INSERT OR REPLACE INTO compliance_frameworks (id, name, version, category, description, control_count, governing_body, assessment_methodology)
VALUES ('ffiec-it', 'FFIEC IT Handbook', '2016', 'commercial',
  'Federal Financial Institutions Examination Council IT Examination Handbook — Information Security booklet. Provides guidance for examiners evaluating financial institution information security programs. Covers governance, risk management, security operations, and program effectiveness.',
  90, 'FFIEC', 'IT Examination');

-- ============================================================================
-- GOVERNANCE (FFIEC-GOV) — 12 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('ffiec-it', 'FFIEC-GOV-01', 'Governance', 'Information Security Culture',
 'Establish information security culture across the organization with visible commitment from senior leadership.', 'P1', 1, 1, 1, 1),
('ffiec-it', 'FFIEC-GOV-02', 'Governance', 'Security Awareness and Responsibilities',
 'Promote awareness of information security roles and responsibilities across all personnel.', 'P1', 1, 1, 1, 2),
('ffiec-it', 'FFIEC-GOV-03', 'Governance', 'Board Approval of Security Program',
 'Board of directors approves the information security program annually and provides oversight.', 'P1', 1, 1, 1, 3),
('ffiec-it', 'FFIEC-GOV-04', 'Governance', 'Information Security Officer',
 'Designate an information security officer with appropriate authority and reporting lines.', 'P1', 1, 1, 1, 4),
('ffiec-it', 'FFIEC-GOV-05', 'Governance', 'Lines of Responsibility',
 'Define clear lines of responsibility for information security across the organization.', 'P1', 1, 1, 1, 5),
('ffiec-it', 'FFIEC-GOV-06', 'Governance', 'Accountability Mechanisms',
 'Establish accountability mechanisms for security performance measurement and reporting.', 'P2', 1, 1, 1, 6),
('ffiec-it', 'FFIEC-GOV-07', 'Governance', 'Management Oversight',
 'Ensure management oversight of security program implementation and effectiveness.', 'P1', 1, 1, 1, 7),
('ffiec-it', 'FFIEC-GOV-08', 'Governance', 'Financial Resources',
 'Allocate adequate financial resources for the information security program.', 'P2', 1, 1, 1, 8),
('ffiec-it', 'FFIEC-GOV-09', 'Governance', 'Staffing and Expertise',
 'Provide sufficient staffing with appropriate expertise for security operations.', 'P1', 1, 1, 1, 9),
('ffiec-it', 'FFIEC-GOV-10', 'Governance', 'Technical Infrastructure',
 'Ensure appropriate technical infrastructure to support security controls.', 'P2', 1, 1, 1, 10),
('ffiec-it', 'FFIEC-GOV-11', 'Governance', 'Technology Maintenance Budget',
 'Budget for ongoing security technology updates and maintenance.', 'P2', 1, 1, 1, 11),
('ffiec-it', 'FFIEC-GOV-12', 'Governance', 'Tone at the Top',
 'Foster tone at the top demonstrating security commitment from senior leadership and board.', 'P1', 1, 1, 1, 12);

-- ============================================================================
-- RISK MANAGEMENT (FFIEC-RISK) — 17 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('ffiec-it', 'FFIEC-RISK-01', 'Risk Management', 'Internal Threat Identification',
 'Identify reasonably foreseeable internal threats to information systems and customer data.', 'P1', 1, 1, 1, 13),
('ffiec-it', 'FFIEC-RISK-02', 'Risk Management', 'External Threat Identification',
 'Identify reasonably foreseeable external threats including cyber attacks, natural disasters, and third-party risks.', 'P1', 1, 1, 1, 14),
('ffiec-it', 'FFIEC-RISK-03', 'Risk Management', 'Threat Intelligence',
 'Maintain threat intelligence sources and participate in information sharing organizations.', 'P1', 1, 1, 1, 15),
('ffiec-it', 'FFIEC-RISK-04', 'Risk Management', 'Emerging Threat Monitoring',
 'Monitor emerging cybersecurity threats relevant to the financial sector.', 'P2', 1, 1, 1, 16),
('ffiec-it', 'FFIEC-RISK-05', 'Risk Management', 'Vulnerability Assessment',
 'Conduct vulnerability assessments of information systems on a regular basis.', 'P1', 1, 1, 1, 17),
('ffiec-it', 'FFIEC-RISK-06', 'Risk Management', 'Configuration Flaw Identification',
 'Identify system weaknesses and configuration flaws through scanning and assessment.', 'P1', 1, 1, 1, 18),
('ffiec-it', 'FFIEC-RISK-07', 'Risk Management', 'Third-Party Connection Risk',
 'Assess vulnerabilities in third-party connections and service provider interfaces.', 'P1', 1, 1, 1, 19),
('ffiec-it', 'FFIEC-RISK-08', 'Risk Management', 'Risk Assessment Program',
 'Maintain a comprehensive cybersecurity risk assessment program with documented methodology.', 'P1', 1, 1, 1, 20),
('ffiec-it', 'FFIEC-RISK-09', 'Risk Management', 'Risk Assessment Methodology',
 'Document the cybersecurity risk assessment methodology including scope, criteria, and frequency.', 'P1', 1, 1, 1, 21),
('ffiec-it', 'FFIEC-RISK-10', 'Risk Management', 'Risk Quantification',
 'Quantify likelihood and impact of identified risks using consistent measurement criteria.', 'P2', 1, 1, 1, 22),
('ffiec-it', 'FFIEC-RISK-11', 'Risk Management', 'Risk Prioritization',
 'Prioritize risks based on criticality, exposure, and potential business impact.', 'P1', 1, 1, 1, 23),
('ffiec-it', 'FFIEC-RISK-12', 'Risk Management', 'Business Impact Mapping',
 'Map risks to business impact and data criticality classifications.', 'P2', 1, 1, 1, 24),
('ffiec-it', 'FFIEC-RISK-13', 'Risk Management', 'Periodic Risk Reassessment',
 'Update risk assessments periodically and when material changes occur to systems or threat environment.', 'P1', 1, 1, 1, 25),
('ffiec-it', 'FFIEC-RISK-14', 'Risk Management', 'Key Risk Indicators',
 'Establish key risk indicators for the security program and track them over time.', 'P2', 1, 1, 1, 26),
('ffiec-it', 'FFIEC-RISK-15', 'Risk Management', 'Board Risk Reporting',
 'Report security metrics and risk posture to board and senior management regularly.', 'P1', 1, 1, 1, 27),
('ffiec-it', 'FFIEC-RISK-16', 'Risk Management', 'Control Effectiveness Monitoring',
 'Monitor control effectiveness through metrics, testing, and continuous monitoring.', 'P1', 1, 1, 1, 28),
('ffiec-it', 'FFIEC-RISK-17', 'Risk Management', 'Incident Trending',
 'Track and trend security incidents and events to identify patterns and systemic issues.', 'P2', 1, 1, 1, 29);

-- ============================================================================
-- SECURITY CONTROLS (FFIEC-CTRL) — 46 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('ffiec-it', 'FFIEC-CTRL-01', 'Security Controls', 'Information Security Policies',
 'Develop comprehensive information security policies covering all control areas.', 'P1', 1, 1, 1, 30),
('ffiec-it', 'FFIEC-CTRL-02', 'Security Controls', 'Security Standards',
 'Establish security standards aligned with risk assessment findings and industry practices.', 'P1', 1, 1, 1, 31),
('ffiec-it', 'FFIEC-CTRL-03', 'Security Controls', 'Security Procedures',
 'Document security procedures for all control areas and operational processes.', 'P1', 1, 1, 1, 32),
('ffiec-it', 'FFIEC-CTRL-04', 'Security Controls', 'Policy Review and Update',
 'Review and update policies annually or when significant changes occur.', 'P1', 1, 1, 1, 33),
('ffiec-it', 'FFIEC-CTRL-05', 'Security Controls', 'Secure Development Lifecycle',
 'Incorporate security into the system development lifecycle from design through deployment.', 'P1', 1, 1, 1, 34),
('ffiec-it', 'FFIEC-CTRL-06', 'Security Controls', 'Defense-in-Depth Architecture',
 'Design systems with defense-in-depth architecture using multiple layers of controls.', 'P1', 1, 1, 1, 35),
('ffiec-it', 'FFIEC-CTRL-07', 'Security Controls', 'Hardware Asset Inventory',
 'Maintain comprehensive hardware asset inventory with ownership and classification.', 'P1', 1, 1, 1, 36),
('ffiec-it', 'FFIEC-CTRL-08', 'Security Controls', 'Software Asset Inventory',
 'Maintain comprehensive software asset inventory including versions and licensing.', 'P1', 1, 1, 1, 37),
('ffiec-it', 'FFIEC-CTRL-09', 'Security Controls', 'Data Classification',
 'Classify data based on sensitivity and criticality with defined handling requirements.', 'P1', 1, 1, 1, 38),
('ffiec-it', 'FFIEC-CTRL-10', 'Security Controls', 'Background Checks',
 'Conduct background checks for employees with access to sensitive systems and data.', 'P1', 1, 1, 1, 39),
('ffiec-it', 'FFIEC-CTRL-11', 'Security Controls', 'Least Privilege Access',
 'Implement principle of least privilege for all user access to systems and data.', 'P1', 1, 1, 1, 40),
('ffiec-it', 'FFIEC-CTRL-12', 'Security Controls', 'User Provisioning',
 'Establish formal user account provisioning process with appropriate approvals.', 'P1', 1, 1, 1, 41),
('ffiec-it', 'FFIEC-CTRL-13', 'Security Controls', 'Access Reviews',
 'Review user access rights periodically to ensure continued appropriateness.', 'P1', 1, 1, 1, 42),
('ffiec-it', 'FFIEC-CTRL-14', 'Security Controls', 'Termination Access Revocation',
 'Revoke access promptly upon termination or role change.', 'P1', 1, 1, 1, 43),
('ffiec-it', 'FFIEC-CTRL-15', 'Security Controls', 'Inactive Account Management',
 'Disable inactive accounts within a defined timeframe.', 'P1', 1, 1, 1, 44),
('ffiec-it', 'FFIEC-CTRL-16', 'Security Controls', 'Segregation of Duties',
 'Separate incompatible duties to reduce fraud risk and unauthorized activity.', 'P1', 1, 1, 1, 45),
('ffiec-it', 'FFIEC-CTRL-17', 'Security Controls', 'Confidentiality Agreements',
 'Require confidentiality agreements for personnel with access to sensitive data.', 'P2', 1, 1, 1, 46),
('ffiec-it', 'FFIEC-CTRL-18', 'Security Controls', 'Security Awareness Training',
 'Provide security awareness training to all personnel upon hire and annually.', 'P1', 1, 1, 1, 47),
('ffiec-it', 'FFIEC-CTRL-19', 'Security Controls', 'Role-Based Security Training',
 'Provide role-based security training for technical staff and administrators.', 'P1', 1, 1, 1, 48),
('ffiec-it', 'FFIEC-CTRL-20', 'Security Controls', 'Physical Access Controls',
 'Control physical access to facilities housing information systems.', 'P1', 1, 1, 1, 49),
('ffiec-it', 'FFIEC-CTRL-21', 'Security Controls', 'Physical Access Monitoring',
 'Monitor physical access with surveillance systems and access logs.', 'P2', 1, 1, 1, 50),
('ffiec-it', 'FFIEC-CTRL-22', 'Security Controls', 'Network Segmentation',
 'Implement network segmentation and security zones to limit lateral movement.', 'P1', 1, 1, 1, 51),
('ffiec-it', 'FFIEC-CTRL-23', 'Security Controls', 'Firewall Management',
 'Deploy and manage firewalls at network boundaries with documented rulesets.', 'P1', 1, 1, 1, 52),
('ffiec-it', 'FFIEC-CTRL-24', 'Security Controls', 'Intrusion Detection and Prevention',
 'Configure intrusion detection/prevention systems for network and host monitoring.', 'P1', 1, 1, 1, 53),
('ffiec-it', 'FFIEC-CTRL-25', 'Security Controls', 'Wireless Network Security',
 'Implement strong encryption and access controls for wireless networks.', 'P1', 1, 1, 1, 54),
('ffiec-it', 'FFIEC-CTRL-26', 'Security Controls', 'Configuration Management',
 'Establish configuration management plan with baseline configurations for all system types.', 'P1', 1, 1, 1, 55),
('ffiec-it', 'FFIEC-CTRL-27', 'Security Controls', 'System Hardening',
 'Harden systems by disabling unnecessary services, ports, and default credentials.', 'P1', 1, 1, 1, 56),
('ffiec-it', 'FFIEC-CTRL-28', 'Security Controls', 'Patch Management',
 'Implement patch management process with testing, deployment, and exception tracking.', 'P1', 1, 1, 1, 57),
('ffiec-it', 'FFIEC-CTRL-29', 'Security Controls', 'End-of-Life Management',
 'Manage end-of-life systems with heightened controls and documented transition plans.', 'P2', 1, 1, 1, 58),
('ffiec-it', 'FFIEC-CTRL-30', 'Security Controls', 'Anti-Malware Protection',
 'Deploy anti-malware solutions on endpoints and servers with current signatures.', 'P1', 1, 1, 1, 59),
('ffiec-it', 'FFIEC-CTRL-31', 'Security Controls', 'Data-at-Rest Encryption',
 'Protect sensitive data at rest with encryption using approved algorithms.', 'P1', 1, 1, 1, 60),
('ffiec-it', 'FFIEC-CTRL-32', 'Security Controls', 'Data-in-Transit Encryption',
 'Protect data in transit with encryption over external and internal networks.', 'P1', 1, 1, 1, 61),
('ffiec-it', 'FFIEC-CTRL-33', 'Security Controls', 'Media Disposal',
 'Sanitize media before disposal or reuse per approved sanitization methods.', 'P1', 1, 1, 1, 62),
('ffiec-it', 'FFIEC-CTRL-34', 'Security Controls', 'Shadow IT Controls',
 'Detect and control unauthorized IT systems and cloud services.', 'P2', 1, 1, 1, 63),
('ffiec-it', 'FFIEC-CTRL-35', 'Security Controls', 'Supply Chain Risk Assessment',
 'Assess supply chain risks for technology acquisitions and validate software integrity.', 'P1', 1, 1, 1, 64),
('ffiec-it', 'FFIEC-CTRL-36', 'Security Controls', 'Multi-Factor Authentication',
 'Implement multi-factor authentication for privileged accounts and remote access.', 'P1', 1, 1, 1, 65),
('ffiec-it', 'FFIEC-CTRL-37', 'Security Controls', 'Administrative Access Controls',
 'Control administrative access to operating systems with enhanced authentication.', 'P1', 1, 1, 1, 66),
('ffiec-it', 'FFIEC-CTRL-38', 'Security Controls', 'Session Management',
 'Implement session management controls including timeout and lockout.', 'P1', 1, 1, 1, 67),
('ffiec-it', 'FFIEC-CTRL-39', 'Security Controls', 'Remote Access Security',
 'Require encrypted remote access sessions with MFA and activity logging.', 'P1', 1, 1, 1, 68),
('ffiec-it', 'FFIEC-CTRL-40', 'Security Controls', 'Mobile Device Management',
 'Implement mobile device management controls for devices accessing systems.', 'P2', 1, 1, 1, 69),
('ffiec-it', 'FFIEC-CTRL-41', 'Security Controls', 'Customer-Facing Security',
 'Implement layered security for customer-facing systems including online banking.', 'P1', 1, 1, 1, 70),
('ffiec-it', 'FFIEC-CTRL-42', 'Security Controls', 'Application Security Testing',
 'Conduct secure code reviews and application vulnerability testing.', 'P1', 1, 1, 1, 71),
('ffiec-it', 'FFIEC-CTRL-43', 'Security Controls', 'Database Security',
 'Control database access with least privilege and encrypt sensitive database contents.', 'P1', 1, 1, 1, 72),
('ffiec-it', 'FFIEC-CTRL-44', 'Security Controls', 'Cryptographic Key Management',
 'Implement FIPS-validated cryptographic modules and key management procedures.', 'P1', 1, 1, 1, 73),
('ffiec-it', 'FFIEC-CTRL-45', 'Security Controls', 'Third-Party Due Diligence',
 'Conduct due diligence on third-party service providers with contractual security requirements.', 'P1', 1, 1, 1, 74),
('ffiec-it', 'FFIEC-CTRL-46', 'Security Controls', 'Cloud Service Provider Assessment',
 'Assess risks of cloud service providers including data isolation and protection.', 'P1', 1, 1, 1, 75);

-- ============================================================================
-- OPERATIONS & ASSURANCE (FFIEC-OPS) — 15 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('ffiec-it', 'FFIEC-OPS-01', 'Operations and Assurance', 'Threat Intelligence Monitoring',
 'Monitor threat intelligence sources for threats relevant to the institution.', 'P1', 1, 1, 1, 76),
('ffiec-it', 'FFIEC-OPS-02', 'Operations and Assurance', 'Continuous Monitoring',
 'Implement continuous monitoring of networks, systems, and user behavior.', 'P1', 1, 1, 1, 77),
('ffiec-it', 'FFIEC-OPS-03', 'Operations and Assurance', 'SIEM Capabilities',
 'Deploy SIEM capabilities for security event correlation and alerting.', 'P1', 1, 1, 1, 78),
('ffiec-it', 'FFIEC-OPS-04', 'Operations and Assurance', 'Incident Detection',
 'Establish incident detection capabilities with defined identification criteria.', 'P1', 1, 1, 1, 79),
('ffiec-it', 'FFIEC-OPS-05', 'Operations and Assurance', 'Incident Classification',
 'Classify and prioritize security incidents based on severity and impact.', 'P1', 1, 1, 1, 80),
('ffiec-it', 'FFIEC-OPS-06', 'Operations and Assurance', 'Incident Response Plan',
 'Develop and maintain an incident response plan with defined roles and procedures.', 'P1', 1, 1, 1, 81),
('ffiec-it', 'FFIEC-OPS-07', 'Operations and Assurance', 'Incident Containment and Recovery',
 'Contain, eradicate, and recover from security incidents with documented procedures.', 'P1', 1, 1, 1, 82),
('ffiec-it', 'FFIEC-OPS-08', 'Operations and Assurance', 'Post-Incident Review',
 'Conduct post-incident review and lessons learned for all significant incidents.', 'P1', 1, 1, 1, 83),
('ffiec-it', 'FFIEC-OPS-09', 'Operations and Assurance', 'Business Continuity Planning',
 'Develop and test business continuity and disaster recovery plans annually.', 'P1', 1, 1, 1, 84),
('ffiec-it', 'FFIEC-OPS-10', 'Operations and Assurance', 'Backup and Recovery',
 'Maintain backup systems and data with tested recovery procedures.', 'P1', 1, 1, 1, 85),
('ffiec-it', 'FFIEC-OPS-11', 'Operations and Assurance', 'Centralized Log Management',
 'Centralize log collection from all critical systems with integrity protections.', 'P1', 1, 1, 1, 86),
('ffiec-it', 'FFIEC-OPS-12', 'Operations and Assurance', 'Log Retention',
 'Retain logs according to legal and regulatory requirements with protected storage.', 'P1', 1, 1, 1, 87),
('ffiec-it', 'FFIEC-OPS-13', 'Operations and Assurance', 'Penetration Testing',
 'Conduct penetration testing of external and internal facing systems regularly.', 'P1', 1, 1, 1, 88),
('ffiec-it', 'FFIEC-OPS-14', 'Operations and Assurance', 'Vulnerability Scanning and Remediation',
 'Scan systems for vulnerabilities regularly and remediate based on severity.', 'P1', 1, 1, 1, 89),
('ffiec-it', 'FFIEC-OPS-15', 'Operations and Assurance', 'Independent Security Audits',
 'Conduct independent information security audits with findings reported to board.', 'P1', 1, 1, 1, 90);

-- ============================================================================
-- CROSSWALK MAPPINGS — FFIEC to NIST 800-53 R5
-- ============================================================================

INSERT OR REPLACE INTO control_crosswalks (source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence, notes) VALUES
('ffiec-it', 'FFIEC-GOV-03', 'nist-800-53-r5', 'PM-1', 'equivalent', 0.90, 'Board approval maps to NIST Information Security Program Plan'),
('ffiec-it', 'FFIEC-GOV-04', 'nist-800-53-r5', 'PM-2', 'equivalent', 0.90, 'ISO designation maps to NIST Senior Information Security Officer'),
('ffiec-it', 'FFIEC-RISK-05', 'nist-800-53-r5', 'RA-5', 'equivalent', 0.90, 'Vulnerability assessment maps directly to NIST Vulnerability Scanning'),
('ffiec-it', 'FFIEC-RISK-08', 'nist-800-53-r5', 'RA-3', 'equivalent', 0.90, 'Risk assessment program maps to NIST Risk Assessment'),
('ffiec-it', 'FFIEC-RISK-03', 'nist-800-53-r5', 'PM-16', 'equivalent', 0.85, 'Threat intelligence maps to NIST Threat Awareness Program'),
('ffiec-it', 'FFIEC-CTRL-11', 'nist-800-53-r5', 'AC-6', 'equivalent', 0.90, 'Least privilege maps directly to NIST Least Privilege'),
('ffiec-it', 'FFIEC-CTRL-13', 'nist-800-53-r5', 'AC-2', 'equivalent', 0.85, 'Access reviews maps to NIST Account Management'),
('ffiec-it', 'FFIEC-CTRL-16', 'nist-800-53-r5', 'AC-5', 'equivalent', 0.90, 'Segregation of duties maps to NIST Separation of Duties'),
('ffiec-it', 'FFIEC-CTRL-18', 'nist-800-53-r5', 'AT-2', 'equivalent', 0.90, 'Security awareness training maps to NIST Literacy Training'),
('ffiec-it', 'FFIEC-CTRL-22', 'nist-800-53-r5', 'SC-7', 'equivalent', 0.85, 'Network segmentation maps to NIST Boundary Protection'),
('ffiec-it', 'FFIEC-CTRL-26', 'nist-800-53-r5', 'CM-2', 'equivalent', 0.85, 'Configuration management maps to NIST Baseline Configuration'),
('ffiec-it', 'FFIEC-CTRL-28', 'nist-800-53-r5', 'SI-2', 'equivalent', 0.90, 'Patch management maps to NIST Flaw Remediation'),
('ffiec-it', 'FFIEC-CTRL-31', 'nist-800-53-r5', 'SC-28', 'equivalent', 0.85, 'Data-at-rest encryption maps to NIST Protection of Information at Rest'),
('ffiec-it', 'FFIEC-CTRL-32', 'nist-800-53-r5', 'SC-8', 'equivalent', 0.85, 'Data-in-transit encryption maps to NIST Transmission Confidentiality'),
('ffiec-it', 'FFIEC-CTRL-36', 'nist-800-53-r5', 'IA-2', 'equivalent', 0.90, 'MFA maps to NIST Identification and Authentication'),
('ffiec-it', 'FFIEC-CTRL-39', 'nist-800-53-r5', 'AC-17', 'equivalent', 0.85, 'Remote access security maps to NIST Remote Access'),
('ffiec-it', 'FFIEC-CTRL-42', 'nist-800-53-r5', 'SA-11', 'equivalent', 0.85, 'Application security testing maps to NIST Developer Testing'),
('ffiec-it', 'FFIEC-CTRL-44', 'nist-800-53-r5', 'SC-12', 'equivalent', 0.85, 'Key management maps to NIST Cryptographic Key Establishment'),
('ffiec-it', 'FFIEC-CTRL-45', 'nist-800-53-r5', 'SA-9', 'equivalent', 0.85, 'Third-party due diligence maps to NIST External System Services'),
('ffiec-it', 'FFIEC-OPS-02', 'nist-800-53-r5', 'SI-4', 'equivalent', 0.85, 'Continuous monitoring maps to NIST System Monitoring'),
('ffiec-it', 'FFIEC-OPS-06', 'nist-800-53-r5', 'IR-8', 'equivalent', 0.90, 'Incident response plan maps to NIST Incident Response Plan'),
('ffiec-it', 'FFIEC-OPS-09', 'nist-800-53-r5', 'CP-2', 'equivalent', 0.85, 'Business continuity planning maps to NIST Contingency Plan'),
('ffiec-it', 'FFIEC-OPS-11', 'nist-800-53-r5', 'AU-6', 'equivalent', 0.85, 'Centralized log management maps to NIST Audit Review'),
('ffiec-it', 'FFIEC-OPS-13', 'nist-800-53-r5', 'CA-8', 'equivalent', 0.90, 'Penetration testing maps directly to NIST Penetration Testing'),
('ffiec-it', 'FFIEC-OPS-15', 'nist-800-53-r5', 'CA-2', 'equivalent', 0.85, 'Independent audits maps to NIST Control Assessments');

-- ============================================================================
-- TRACK MIGRATION
-- ============================================================================
INSERT OR IGNORE INTO schema_migrations (version, name, description) VALUES
  ('migrate-026-ffiec-framework', 'ffiec-framework', 'FFIEC IT Handbook framework with 90 controls and crosswalks to NIST 800-53 R5');
