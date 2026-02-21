-- ============================================================================
-- MIGRATION 028: GLBA Safeguards Rule (16 CFR Part 314)
-- ============================================================================
-- Adds the GLBA Safeguards Rule framework (amended June 2023) with
-- 45 controls across 8 sections and crosswalk mappings to NIST 800-53 R5.
-- Fully idempotent — safe to re-run on every deploy (INSERT OR REPLACE).
-- ============================================================================

-- Framework definition
INSERT OR REPLACE INTO compliance_frameworks (id, name, version, category, description, control_count, governing_body, assessment_methodology)
VALUES ('glba', 'GLBA Safeguards Rule', '2023', 'commercial',
  'Gramm-Leach-Bliley Act Safeguards Rule (16 CFR Part 314), as amended effective June 2023 by the FTC. Requires financial institutions to develop, implement, and maintain a comprehensive information security program with administrative, technical, and physical safeguards.',
  45, 'FTC', 'Regulatory Examination');

-- ============================================================================
-- PROGRAM FOUNDATION (314.3) — 4 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('glba', 'GLBA-314.3-01', 'Program Foundation', 'Information Security Program',
 'Develop, implement, and maintain a comprehensive written information security program.', 'P1', 1, 1, 1, 1),
('glba', 'GLBA-314.3-02', 'Program Foundation', 'Security and Confidentiality',
 'Ensure the security and confidentiality of customer information.', 'P1', 1, 1, 1, 2),
('glba', 'GLBA-314.3-03', 'Program Foundation', 'Threat Protection',
 'Protect against anticipated threats or hazards to security or integrity of customer information.', 'P1', 1, 1, 1, 3),
('glba', 'GLBA-314.3-04', 'Program Foundation', 'Unauthorized Access Prevention',
 'Protect against unauthorized access to or use of customer information that could result in substantial harm.', 'P1', 1, 1, 1, 4);

-- ============================================================================
-- QUALIFIED INDIVIDUAL (314.4a) — 3 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('glba', 'GLBA-314.4A-01', 'Qualified Individual', 'Qualified Individual Designation',
 'Designate a qualified individual responsible for overseeing and implementing the information security program.', 'P1', 1, 1, 1, 5),
('glba', 'GLBA-314.4A-02', 'Qualified Individual', 'Authority and Resources',
 'Ensure the qualified individual has sufficient authority and resources to implement the security program.', 'P1', 1, 1, 1, 6),
('glba', 'GLBA-314.4A-03', 'Qualified Individual', 'External Designation Oversight',
 'If using an external service provider as qualified individual, designate a senior member for direction and oversight.', 'P2', 1, 1, 1, 7);

-- ============================================================================
-- RISK ASSESSMENT (314.4b) — 5 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('glba', 'GLBA-314.4B-01', 'Risk Assessment', 'Written Risk Assessment',
 'Develop and maintain a written risk assessment identifying reasonably foreseeable internal and external risks.', 'P1', 1, 1, 1, 8),
('glba', 'GLBA-314.4B-02', 'Risk Assessment', 'Risk Evaluation Criteria',
 'Include criteria for evaluating and categorizing identified security risks or threats.', 'P1', 1, 1, 1, 9),
('glba', 'GLBA-314.4B-03', 'Risk Assessment', 'CIA Assessment',
 'Assess confidentiality, integrity, and availability of information systems and customer information.', 'P1', 1, 1, 1, 10),
('glba', 'GLBA-314.4B-04', 'Risk Assessment', 'Risk Treatment Documentation',
 'Document how identified risks will be mitigated or accepted based on risk tolerance.', 'P1', 1, 1, 1, 11),
('glba', 'GLBA-314.4B-05', 'Risk Assessment', 'Periodic Reassessment',
 'Periodically review and update the risk assessment to address changes in operations and threat landscape.', 'P1', 1, 1, 1, 12);

-- ============================================================================
-- SAFEGUARDS (314.4c) — 15 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('glba', 'GLBA-314.4C-01', 'Safeguards', 'User Authentication Controls',
 'Implement controls to authenticate and permit access only to authorized users of customer information.', 'P1', 1, 1, 1, 13),
('glba', 'GLBA-314.4C-02', 'Safeguards', 'Least Privilege Access',
 'Limit authorized user access to customer information based on need to perform job duties.', 'P1', 1, 1, 1, 14),
('glba', 'GLBA-314.4C-03', 'Safeguards', 'Access Control Review',
 'Periodically review access controls to ensure continued appropriateness.', 'P1', 1, 1, 1, 15),
('glba', 'GLBA-314.4C-04', 'Safeguards', 'Asset Identification and Management',
 'Identify and manage data, personnel, devices, systems, and facilities according to risk.', 'P1', 1, 1, 1, 16),
('glba', 'GLBA-314.4C-05', 'Safeguards', 'Encryption in Transit',
 'Encrypt all customer information in transit over external networks.', 'P1', 1, 1, 1, 17),
('glba', 'GLBA-314.4C-06', 'Safeguards', 'Encryption at Rest',
 'Encrypt all customer information at rest, or implement effective compensating controls.', 'P1', 1, 1, 1, 18),
('glba', 'GLBA-314.4C-07', 'Safeguards', 'Secure Development Practices',
 'Adopt secure development practices for in-house developed applications.', 'P1', 1, 1, 1, 19),
('glba', 'GLBA-314.4C-08', 'Safeguards', 'External Application Security',
 'Evaluate the security of externally developed applications used by the organization.', 'P1', 1, 1, 1, 20),
('glba', 'GLBA-314.4C-09', 'Safeguards', 'Multi-Factor Authentication',
 'Implement multi-factor authentication for any individual accessing information systems.', 'P1', 1, 1, 1, 21),
('glba', 'GLBA-314.4C-10', 'Safeguards', 'Data Disposal Procedures',
 'Develop and implement secure disposal procedures for customer information no longer needed.', 'P1', 1, 1, 1, 22),
('glba', 'GLBA-314.4C-11', 'Safeguards', 'Data Retention Limitation',
 'Dispose of customer information within two years of last use unless business necessity or legal requirement exists.', 'P1', 1, 1, 1, 23),
('glba', 'GLBA-314.4C-12', 'Safeguards', 'Change Management',
 'Adopt and implement change management procedures for information systems.', 'P1', 1, 1, 1, 24),
('glba', 'GLBA-314.4C-13', 'Safeguards', 'Activity Monitoring',
 'Implement policies and controls to monitor authorized user activity and detect unauthorized access.', 'P1', 1, 1, 1, 25),
('glba', 'GLBA-314.4C-14', 'Safeguards', 'Unauthorized Access Detection',
 'Implement controls to detect unauthorized access to or tampering with customer information.', 'P1', 1, 1, 1, 26),
('glba', 'GLBA-314.4C-15', 'Safeguards', 'Physical Access Controls',
 'Implement physical controls to authenticate and permit access only to authorized users.', 'P2', 1, 1, 1, 27);

-- ============================================================================
-- TESTING & MONITORING (314.4d) — 4 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('glba', 'GLBA-314.4D-01', 'Testing and Monitoring', 'Safeguard Effectiveness Testing',
 'Regularly test or monitor effectiveness of key controls, systems, and procedures.', 'P1', 1, 1, 1, 28),
('glba', 'GLBA-314.4D-02', 'Testing and Monitoring', 'Continuous Monitoring or Penetration Testing',
 'Implement continuous monitoring or conduct annual penetration testing of information systems.', 'P1', 1, 1, 1, 29),
('glba', 'GLBA-314.4D-03', 'Testing and Monitoring', 'Vulnerability Assessments',
 'Conduct vulnerability assessments at least semi-annually and after material changes to systems.', 'P1', 1, 1, 1, 30),
('glba', 'GLBA-314.4D-04', 'Testing and Monitoring', 'Intrusion Detection',
 'Implement testing and monitoring capabilities to detect attacks and intrusions.', 'P1', 1, 1, 1, 31);

-- ============================================================================
-- PERSONNEL (314.4e) — 4 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('glba', 'GLBA-314.4E-01', 'Personnel', 'Security Awareness Training',
 'Provide regular security awareness training to all personnel.', 'P1', 1, 1, 1, 32),
('glba', 'GLBA-314.4E-02', 'Personnel', 'Qualified Security Personnel',
 'Utilize qualified information security personnel with current knowledge of threats.', 'P1', 1, 1, 1, 33),
('glba', 'GLBA-314.4E-03', 'Personnel', 'Security Personnel Training',
 'Provide security personnel with ongoing training on changing threats and countermeasures.', 'P1', 1, 1, 1, 34),
('glba', 'GLBA-314.4E-04', 'Personnel', 'Training Updates',
 'Update security training programs based on risk assessment findings and emerging threats.', 'P2', 1, 1, 1, 35);

-- ============================================================================
-- SERVICE PROVIDERS, EVALUATION, IR, REPORTING (314.4f-j) — 10 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('glba', 'GLBA-314.4F-01', 'Service Provider Oversight', 'Service Provider Selection',
 'Take reasonable steps to select service providers capable of maintaining appropriate safeguards.', 'P1', 1, 1, 1, 36),
('glba', 'GLBA-314.4F-02', 'Service Provider Oversight', 'Contractual Requirements',
 'Require service providers by contract to implement and maintain safeguards for customer information.', 'P1', 1, 1, 1, 37),
('glba', 'GLBA-314.4F-03', 'Service Provider Oversight', 'Periodic Assessment',
 'Periodically assess service providers based on risk and adequacy of their safeguards.', 'P1', 1, 1, 1, 38),
('glba', 'GLBA-314.4G-01', 'Program Evaluation', 'Program Adjustment',
 'Evaluate and adjust the security program based on testing results, operational changes, and risk assessments.', 'P1', 1, 1, 1, 39),
('glba', 'GLBA-314.4H-01', 'Incident Response', 'Written Incident Response Plan',
 'Develop and implement a written incident response plan with goals, roles, and procedures.', 'P1', 1, 1, 1, 40),
('glba', 'GLBA-314.4H-02', 'Incident Response', 'Incident Documentation',
 'Document and report on security events and related response activities.', 'P1', 1, 1, 1, 41),
('glba', 'GLBA-314.4H-03', 'Incident Response', 'Plan Evaluation and Revision',
 'Evaluate and revise the incident response plan following security events and at least annually.', 'P1', 1, 1, 1, 42),
('glba', 'GLBA-314.4I-01', 'Reporting', 'Annual Board Reporting',
 'Report at least annually in writing to the board or senior officer on program status and compliance.', 'P1', 1, 1, 1, 43),
('glba', 'GLBA-314.4I-02', 'Reporting', 'Material Matters Reporting',
 'Report material matters including risk assessments, testing results, security events, and policy violations.', 'P1', 1, 1, 1, 44),
('glba', 'GLBA-314.4J-01', 'FTC Notification', 'Breach Notification',
 'Notify FTC within 30 days of a notification event affecting 500 or more consumers.', 'P1', 1, 1, 1, 45);

-- ============================================================================
-- CROSSWALK MAPPINGS — GLBA to NIST 800-53 R5
-- ============================================================================

INSERT OR REPLACE INTO control_crosswalks (source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence, notes) VALUES
('glba', 'GLBA-314.3-01', 'nist-800-53-r5', 'PM-1', 'equivalent', 0.90, 'Security program maps to NIST Information Security Program Plan'),
('glba', 'GLBA-314.4A-01', 'nist-800-53-r5', 'PM-2', 'equivalent', 0.90, 'Qualified individual maps to NIST Senior Information Security Officer'),
('glba', 'GLBA-314.4B-01', 'nist-800-53-r5', 'RA-3', 'equivalent', 0.90, 'Written risk assessment maps to NIST Risk Assessment'),
('glba', 'GLBA-314.4C-02', 'nist-800-53-r5', 'AC-6', 'equivalent', 0.90, 'Least privilege maps to NIST Least Privilege'),
('glba', 'GLBA-314.4C-04', 'nist-800-53-r5', 'CM-8', 'equivalent', 0.85, 'Asset management maps to NIST System Component Inventory'),
('glba', 'GLBA-314.4C-05', 'nist-800-53-r5', 'SC-8', 'equivalent', 0.90, 'Encryption in transit maps to NIST Transmission Confidentiality'),
('glba', 'GLBA-314.4C-06', 'nist-800-53-r5', 'SC-28', 'equivalent', 0.90, 'Encryption at rest maps to NIST Protection of Information at Rest'),
('glba', 'GLBA-314.4C-09', 'nist-800-53-r5', 'IA-2', 'equivalent', 0.90, 'MFA requirement maps to NIST Identification and Authentication'),
('glba', 'GLBA-314.4C-10', 'nist-800-53-r5', 'MP-6', 'equivalent', 0.85, 'Data disposal maps to NIST Media Sanitization'),
('glba', 'GLBA-314.4C-12', 'nist-800-53-r5', 'CM-3', 'equivalent', 0.85, 'Change management maps to NIST Configuration Change Control'),
('glba', 'GLBA-314.4C-13', 'nist-800-53-r5', 'AU-2', 'equivalent', 0.85, 'Activity monitoring maps to NIST Event Logging'),
('glba', 'GLBA-314.4D-02', 'nist-800-53-r5', 'CA-8', 'equivalent', 0.85, 'Penetration testing maps to NIST Penetration Testing'),
('glba', 'GLBA-314.4D-03', 'nist-800-53-r5', 'RA-5', 'equivalent', 0.90, 'Vulnerability assessments maps to NIST Vulnerability Scanning'),
('glba', 'GLBA-314.4D-04', 'nist-800-53-r5', 'SI-4', 'equivalent', 0.85, 'Intrusion detection maps to NIST System Monitoring'),
('glba', 'GLBA-314.4E-01', 'nist-800-53-r5', 'AT-2', 'equivalent', 0.90, 'Security training maps to NIST Literacy Training'),
('glba', 'GLBA-314.4F-01', 'nist-800-53-r5', 'SA-9', 'equivalent', 0.85, 'Service provider oversight maps to NIST External System Services'),
('glba', 'GLBA-314.4H-01', 'nist-800-53-r5', 'IR-8', 'equivalent', 0.90, 'Incident response plan maps to NIST Incident Response Plan'),
('glba', 'GLBA-314.4J-01', 'nist-800-53-r5', 'IR-6', 'equivalent', 0.85, 'Breach notification maps to NIST Incident Reporting');

-- ============================================================================
-- TRACK MIGRATION
-- ============================================================================
INSERT OR IGNORE INTO schema_migrations (version, name, description) VALUES
  ('migrate-028-glba-framework', 'glba-framework', 'GLBA Safeguards Rule framework with 45 controls and crosswalks to NIST 800-53 R5');
