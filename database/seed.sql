-- ============================================================================
-- FORGECOMPLY 360 - SEED DATA v5.0
-- Experience Layer Configs, Frameworks, Controls, Crosswalks
-- ============================================================================

-- ============================================================================
-- EXPERIENCE LAYER CONFIGURATIONS
-- ============================================================================

INSERT OR REPLACE INTO experience_configs (experience_type, display_name, terminology, default_workflow, dashboard_widgets, nav_labels, doc_templates) VALUES
('federal', 'ForgeComply Federal',
  '{"assessment":"Authorization Assessment","assessmentShort":"ATO","milestone":"POA&M Item","system":"Information System","compliance":"Authorization","complianceVerb":"Authorize","document":"System Security Plan","documentShort":"SSP","finding":"Weakness","risk":"Risk","control":"Security Control","evidence":"Artifact","dashboard":"Mission Center","vendor":"External Service Provider"}',
  '{"steps":["Categorize","Select Controls","Implement","Assess","Authorize","Monitor"],"methodology":"NIST RMF","defaultFramework":"nist-800-53-r5"}',
  '["authorization_status","poam_summary","control_implementation_progress","continuous_monitoring_score","oscal_export_status","risk_executive_summary"]',
  '{"dashboard":"Mission Center","systems":"Information Systems","controls":"Security Controls","poams":"POA&M Tracker","evidence":"Artifact Repository","ssp":"SSP Generator","monitoring":"Continuous Monitoring","risks":"Risk Register","vendors":"External Providers","settings":"Configuration"}',
  '["ssp_oscal","sap_oscal","sar_oscal","poam_oscal","ato_package","fips199_categorization"]'
),
('enterprise', 'ForgeComply Enterprise',
  '{"assessment":"Compliance Audit","assessmentShort":"Audit","milestone":"Action Item","system":"System","compliance":"Compliance","complianceVerb":"Certify","document":"Compliance Report","documentShort":"Report","finding":"Gap","risk":"Risk","control":"Control","evidence":"Evidence","dashboard":"Dashboard","vendor":"Third-Party Vendor"}',
  '{"steps":["Scope","Map Controls","Implement","Test","Certify","Monitor"],"methodology":"Continuous Compliance","defaultFramework":"soc2-type2"}',
  '["compliance_score","control_health","audit_readiness","risk_heatmap","evidence_freshness","upcoming_deadlines"]',
  '{"dashboard":"Dashboard","systems":"Systems","controls":"Control Library","poams":"Action Items","evidence":"Evidence Vault","ssp":"Report Generator","monitoring":"Monitoring","risks":"Risk Management","vendors":"Vendor Management","settings":"Settings"}',
  '["soc2_report","iso27001_soa","pci_roc","compliance_summary","gap_analysis","executive_briefing"]'
),
('healthcare', 'ForgeComply Healthcare',
  '{"assessment":"Risk Assessment","assessmentShort":"Assessment","milestone":"Remediation Item","system":"Health IT System","compliance":"Compliance","complianceVerb":"Validate","document":"Risk Assessment Report","documentShort":"RAR","finding":"Vulnerability","risk":"Risk","control":"Safeguard","evidence":"Documentation","dashboard":"Compliance Center","vendor":"Business Associate"}',
  '{"steps":["Identify ePHI","Assess Risks","Implement Safeguards","Document","Validate","Monitor"],"methodology":"HIPAA Security Rule","defaultFramework":"hipaa"}',
  '["phi_risk_score","safeguard_implementation","breach_risk_indicators","ba_compliance_status","training_compliance","incident_response_readiness"]',
  '{"dashboard":"Compliance Center","systems":"Health IT Systems","controls":"Safeguards","poams":"Remediation Tracker","evidence":"Documentation Vault","ssp":"Assessment Reports","monitoring":"PHI Monitoring","risks":"Risk Assessment","vendors":"Business Associates","settings":"Settings"}',
  '["hipaa_risk_assessment","breach_notification_plan","baa_template","phi_inventory","security_rule_checklist","privacy_impact_assessment"]'
),
('custom', 'ForgeComply Custom',
  '{"assessment":"Assessment","assessmentShort":"Assessment","milestone":"Action Item","system":"System","compliance":"Compliance","complianceVerb":"Assess","document":"Report","documentShort":"Report","finding":"Finding","risk":"Risk","control":"Control","evidence":"Evidence","dashboard":"Dashboard","vendor":"Vendor"}',
  '{"steps":["Scope","Assess","Implement","Verify","Monitor"],"methodology":"Custom","defaultFramework":"nist-csf-2"}',
  '["compliance_score","control_health","risk_heatmap","evidence_freshness","upcoming_deadlines"]',
  '{"dashboard":"Dashboard","systems":"Systems","controls":"Controls","poams":"Action Items","evidence":"Evidence","ssp":"Reports","monitoring":"Monitoring","risks":"Risks","vendors":"Vendors","settings":"Settings"}',
  '["compliance_summary","gap_analysis","executive_briefing"]'
);

-- ============================================================================
-- COMPLIANCE FRAMEWORKS
-- ============================================================================

INSERT OR REPLACE INTO compliance_frameworks (id, name, version, category, description, control_count, governing_body, assessment_methodology) VALUES
-- Federal
('nist-800-53-r5', 'NIST SP 800-53 Rev 5', '5.1.1', 'federal', 'Security and Privacy Controls for Information Systems and Organizations', 1189, 'NIST', 'NIST RMF'),
('fedramp-low', 'FedRAMP Low', '5.0', 'federal', 'Federal Risk and Authorization Management Program - Low Baseline', 125, 'FedRAMP PMO', 'FedRAMP Assessment'),
('fedramp-moderate', 'FedRAMP Moderate', '5.0', 'federal', 'Federal Risk and Authorization Management Program - Moderate Baseline', 325, 'FedRAMP PMO', 'FedRAMP Assessment'),
('fedramp-high', 'FedRAMP High', '5.0', 'federal', 'Federal Risk and Authorization Management Program - High Baseline', 421, 'FedRAMP PMO', 'FedRAMP Assessment'),
('fisma', 'FISMA', '2014', 'federal', 'Federal Information Security Modernization Act', 0, 'OMB/DHS', 'NIST RMF'),
('stateramp', 'StateRAMP', '2.0', 'federal', 'State Risk and Authorization Management Program', 300, 'StateRAMP PMO', 'StateRAMP Assessment'),

-- Defense
('cmmc-l1', 'CMMC Level 1', '2.0', 'defense', 'Cybersecurity Maturity Model Certification - Level 1 (Foundational)', 17, 'DoD CIO', 'Self-Assessment'),
('cmmc-l2', 'CMMC Level 2', '2.0', 'defense', 'Cybersecurity Maturity Model Certification - Level 2 (Advanced)', 110, 'DoD CIO', 'C3PAO Assessment'),
('cmmc-l3', 'CMMC Level 3', '2.0', 'defense', 'Cybersecurity Maturity Model Certification - Level 3 (Expert)', 134, 'DoD CIO', 'DIBCAC Assessment'),
('nist-800-171-r3', 'NIST SP 800-171 Rev 3', '3.0', 'defense', 'Protecting Controlled Unclassified Information in Nonfederal Systems', 110, 'NIST', 'NIST Assessment'),
('dod-srg-il2', 'DoD Cloud SRG IL2', '1.5', 'defense', 'DoD Cloud Computing Security Requirements Guide - Impact Level 2', 261, 'DISA', 'DoD Assessment'),
('dod-srg-il4', 'DoD Cloud SRG IL4', '1.5', 'defense', 'DoD Cloud Computing Security Requirements Guide - Impact Level 4', 340, 'DISA', 'DoD Assessment'),
('dod-srg-il5', 'DoD Cloud SRG IL5', '1.5', 'defense', 'DoD Cloud Computing Security Requirements Guide - Impact Level 5', 365, 'DISA', 'DoD Assessment'),
('cjis', 'CJIS Security Policy', '5.9.4', 'defense', 'Criminal Justice Information Services Security Policy', 90, 'FBI CJIS', 'CJIS Audit'),
('irs-1075', 'IRS Publication 1075', '2024', 'federal', 'Tax Information Security Guidelines', 180, 'IRS', 'Safeguard Review'),

-- Healthcare
('hipaa', 'HIPAA Security Rule', '2013', 'healthcare', 'Health Insurance Portability and Accountability Act - Security Standards', 75, 'HHS OCR', 'Risk Assessment'),
('hitrust-csf', 'HITRUST CSF', '11.3', 'healthcare', 'Health Information Trust Alliance Common Security Framework', 156, 'HITRUST Alliance', 'HITRUST Assessment'),
('hipaa-privacy', 'HIPAA Privacy Rule', '2013', 'healthcare', 'HIPAA Standards for Privacy of Individually Identifiable Health Information', 50, 'HHS OCR', 'Privacy Assessment'),
('42-cfr-part2', '42 CFR Part 2', '2024', 'healthcare', 'Confidentiality of Substance Use Disorder Patient Records', 30, 'SAMHSA', 'Compliance Review'),
('fda-21-cfr-11', 'FDA 21 CFR Part 11', '2003', 'healthcare', 'Electronic Records and Electronic Signatures', 40, 'FDA', 'FDA Audit'),

-- Commercial
('soc2-type2', 'SOC 2 Type II', '2022', 'commercial', 'System and Organization Controls - Trust Service Criteria', 64, 'AICPA', 'CPA Audit'),
('iso-27001', 'ISO 27001:2022', '2022', 'commercial', 'Information Security Management Systems', 114, 'ISO/IEC', 'Certification Audit'),
('pci-dss-v4', 'PCI DSS v4.0.1', '4.0.1', 'commercial', 'Payment Card Industry Data Security Standard', 264, 'PCI SSC', 'QSA Assessment'),
('nist-csf-2', 'NIST CSF 2.0', '2.0', 'commercial', 'NIST Cybersecurity Framework', 108, 'NIST', 'Self-Assessment'),
('cis-controls-v8', 'CIS Controls v8.1', '8.1', 'commercial', 'Center for Internet Security Critical Security Controls', 153, 'CIS', 'CIS Assessment'),

-- Privacy
('gdpr', 'GDPR', '2018', 'privacy', 'EU General Data Protection Regulation', 99, 'European Commission', 'DPIA'),
('ccpa-cpra', 'CCPA/CPRA', '2023', 'privacy', 'California Consumer Privacy Act / California Privacy Rights Act', 45, 'California AG', 'Privacy Assessment'),
('nist-privacy', 'NIST Privacy Framework', '1.0', 'privacy', 'NIST Privacy Framework', 100, 'NIST', 'Self-Assessment');

-- ============================================================================
-- SAMPLE CONTROLS (NIST 800-53 Access Control Family)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-800-53-r5', 'AC-1', 'Access Control', 'Policy and Procedures', 'Develop, document, and disseminate an access control policy and procedures.', 'P1', 1, 1, 1, 1),
('nist-800-53-r5', 'AC-2', 'Access Control', 'Account Management', 'Define and manage information system accounts, including establishing, activating, modifying, reviewing, disabling, and removing accounts.', 'P1', 1, 1, 1, 2),
('nist-800-53-r5', 'AC-3', 'Access Control', 'Access Enforcement', 'Enforce approved authorizations for logical access to information and system resources.', 'P1', 1, 1, 1, 3),
('nist-800-53-r5', 'AC-4', 'Access Control', 'Information Flow Enforcement', 'Enforce approved authorizations for controlling the flow of information within the system and between connected systems.', 'P1', 0, 1, 1, 4),
('nist-800-53-r5', 'AC-5', 'Access Control', 'Separation of Duties', 'Separate duties of individuals to reduce risk of malevolent activity.', 'P1', 0, 1, 1, 5),
('nist-800-53-r5', 'AC-6', 'Access Control', 'Least Privilege', 'Employ the principle of least privilege, allowing only authorized accesses for users.', 'P1', 0, 1, 1, 6),
('nist-800-53-r5', 'AC-7', 'Access Control', 'Unsuccessful Logon Attempts', 'Enforce a limit of consecutive invalid logon attempts by a user.', 'P1', 1, 1, 1, 7),
('nist-800-53-r5', 'AC-8', 'Access Control', 'System Use Notification', 'Display system use notification message or banner before granting access.', 'P1', 1, 1, 1, 8),
('nist-800-53-r5', 'AC-11', 'Access Control', 'Device Lock', 'Prevent further access to the system by initiating a device lock after a period of inactivity.', 'P2', 0, 1, 1, 11),
('nist-800-53-r5', 'AC-12', 'Access Control', 'Session Termination', 'Automatically terminate a user session after defined conditions.', 'P2', 0, 1, 1, 12),
('nist-800-53-r5', 'AC-14', 'Access Control', 'Permitted Actions Without Identification', 'Identify specific user actions that can be performed without identification or authentication.', 'P3', 1, 1, 1, 14),
('nist-800-53-r5', 'AC-17', 'Access Control', 'Remote Access', 'Establish usage restrictions and implementation guidance for remote access.', 'P1', 1, 1, 1, 17),
('nist-800-53-r5', 'AC-18', 'Access Control', 'Wireless Access', 'Establish usage restrictions and implementation guidance for wireless access.', 'P1', 1, 1, 1, 18),
('nist-800-53-r5', 'AC-19', 'Access Control', 'Access Control for Mobile Devices', 'Establish usage restrictions and implementation guidance for mobile devices.', 'P1', 0, 1, 1, 19),
('nist-800-53-r5', 'AC-20', 'Access Control', 'Use of External Systems', 'Establish terms and conditions for authorized individuals to access the system from external systems.', 'P1', 1, 1, 1, 20),
('nist-800-53-r5', 'AC-22', 'Access Control', 'Publicly Accessible Content', 'Designate individuals authorized to post information onto a publicly accessible system.', 'P3', 0, 1, 1, 22);

-- Sample HIPAA Safeguards
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('hipaa', '164.308(a)(1)', 'Administrative Safeguards', 'Security Management Process', 'Implement policies and procedures to prevent, detect, contain, and correct security violations.', 'P1', 1, 1, 1, 1),
('hipaa', '164.308(a)(2)', 'Administrative Safeguards', 'Assigned Security Responsibility', 'Identify the security official responsible for development and implementation of security policies.', 'P1', 1, 1, 1, 2),
('hipaa', '164.308(a)(3)', 'Administrative Safeguards', 'Workforce Security', 'Implement policies and procedures to ensure workforce members have appropriate access to ePHI.', 'P1', 1, 1, 1, 3),
('hipaa', '164.308(a)(4)', 'Administrative Safeguards', 'Information Access Management', 'Implement policies and procedures for authorizing access to ePHI.', 'P1', 1, 1, 1, 4),
('hipaa', '164.308(a)(5)', 'Administrative Safeguards', 'Security Awareness and Training', 'Implement a security awareness and training program for all workforce members.', 'P1', 1, 1, 1, 5),
('hipaa', '164.308(a)(6)', 'Administrative Safeguards', 'Security Incident Procedures', 'Implement policies and procedures to address security incidents.', 'P1', 1, 1, 1, 6),
('hipaa', '164.308(a)(7)', 'Administrative Safeguards', 'Contingency Plan', 'Establish and implement policies and procedures for responding to an emergency.', 'P1', 1, 1, 1, 7),
('hipaa', '164.308(a)(8)', 'Administrative Safeguards', 'Evaluation', 'Perform periodic technical and nontechnical evaluation.', 'P1', 1, 1, 1, 8),
('hipaa', '164.310(a)(1)', 'Physical Safeguards', 'Facility Access Controls', 'Implement policies and procedures to limit physical access to electronic information systems.', 'P1', 1, 1, 1, 9),
('hipaa', '164.310(b)', 'Physical Safeguards', 'Workstation Use', 'Implement policies and procedures for proper workstation use.', 'P1', 1, 1, 1, 10),
('hipaa', '164.310(c)', 'Physical Safeguards', 'Workstation Security', 'Implement physical safeguards for workstations that access ePHI.', 'P1', 1, 1, 1, 11),
('hipaa', '164.310(d)(1)', 'Physical Safeguards', 'Device and Media Controls', 'Implement policies and procedures governing the receipt and removal of hardware and electronic media.', 'P1', 1, 1, 1, 12),
('hipaa', '164.312(a)(1)', 'Technical Safeguards', 'Access Control', 'Implement technical policies and procedures for electronic systems to allow access only to authorized persons.', 'P1', 1, 1, 1, 13),
('hipaa', '164.312(b)', 'Technical Safeguards', 'Audit Controls', 'Implement hardware, software, and/or procedural mechanisms to record and examine activity.', 'P1', 1, 1, 1, 14),
('hipaa', '164.312(c)(1)', 'Technical Safeguards', 'Integrity', 'Implement policies and procedures to protect ePHI from improper alteration or destruction.', 'P1', 1, 1, 1, 15),
('hipaa', '164.312(d)', 'Technical Safeguards', 'Person or Entity Authentication', 'Implement procedures to verify that a person or entity seeking access to ePHI is the one claimed.', 'P1', 1, 1, 1, 16),
('hipaa', '164.312(e)(1)', 'Technical Safeguards', 'Transmission Security', 'Implement technical security measures to guard against unauthorized access to ePHI being transmitted.', 'P1', 1, 1, 1, 17);

-- Sample SOC 2 Trust Service Criteria
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('soc2-type2', 'CC1.1', 'Control Environment', 'COSO Principle 1', 'The entity demonstrates a commitment to integrity and ethical values.', 'P1', 1, 1, 1, 1),
('soc2-type2', 'CC1.2', 'Control Environment', 'COSO Principle 2', 'The board of directors demonstrates independence from management and exercises oversight.', 'P1', 1, 1, 1, 2),
('soc2-type2', 'CC1.3', 'Control Environment', 'COSO Principle 3', 'Management establishes structures, reporting lines, and appropriate authorities and responsibilities.', 'P1', 1, 1, 1, 3),
('soc2-type2', 'CC2.1', 'Communication and Information', 'COSO Principle 13', 'The entity obtains or generates and uses relevant, quality information.', 'P1', 1, 1, 1, 4),
('soc2-type2', 'CC3.1', 'Risk Assessment', 'COSO Principle 6', 'The entity specifies objectives with sufficient clarity to enable the identification and assessment of risks.', 'P1', 1, 1, 1, 5),
('soc2-type2', 'CC3.2', 'Risk Assessment', 'COSO Principle 7', 'The entity identifies risks to the achievement of its objectives and analyzes risks as a basis for determining how risks should be managed.', 'P1', 1, 1, 1, 6),
('soc2-type2', 'CC4.1', 'Monitoring Activities', 'COSO Principle 16', 'The entity selects, develops, and performs ongoing evaluations to ascertain whether controls are present and functioning.', 'P1', 1, 1, 1, 7),
('soc2-type2', 'CC5.1', 'Control Activities', 'COSO Principle 10', 'The entity selects and develops control activities that contribute to the mitigation of risks.', 'P1', 1, 1, 1, 8),
('soc2-type2', 'CC5.2', 'Control Activities', 'COSO Principle 11', 'The entity also selects and develops general control activities over technology.', 'P1', 1, 1, 1, 9),
('soc2-type2', 'CC6.1', 'Logical and Physical Access Controls', 'Logical Access Security', 'The entity implements logical access security software, infrastructure, and architectures.', 'P1', 1, 1, 1, 10),
('soc2-type2', 'CC6.2', 'Logical and Physical Access Controls', 'User Registration', 'Prior to issuing system credentials, the entity registers and authorizes new internal and external users.', 'P1', 1, 1, 1, 11),
('soc2-type2', 'CC6.3', 'Logical and Physical Access Controls', 'Role-Based Access', 'The entity authorizes, modifies, or removes access to data, software, functions, and other protected resources based on roles.', 'P1', 1, 1, 1, 12),
('soc2-type2', 'CC6.6', 'Logical and Physical Access Controls', 'System Boundaries', 'The entity implements logical access security measures to protect against threats from sources outside its system boundaries.', 'P1', 1, 1, 1, 13),
('soc2-type2', 'CC7.1', 'System Operations', 'Infrastructure Monitoring', 'To meet its objectives, the entity uses detection and monitoring procedures.', 'P1', 1, 1, 1, 14),
('soc2-type2', 'CC7.2', 'System Operations', 'Anomaly Detection', 'The entity monitors system components and the operation of those components for anomalies.', 'P1', 1, 1, 1, 15),
('soc2-type2', 'CC7.3', 'System Operations', 'Security Event Evaluation', 'The entity evaluates security events to determine whether they could or have resulted in a failure.', 'P1', 1, 1, 1, 16),
('soc2-type2', 'CC7.4', 'System Operations', 'Incident Response', 'The entity responds to identified security incidents by executing a defined incident response program.', 'P1', 1, 1, 1, 17),
('soc2-type2', 'CC8.1', 'Change Management', 'Change Authorization', 'The entity authorizes, designs, develops, configures, documents, tests, approves, and implements changes.', 'P1', 1, 1, 1, 18),
('soc2-type2', 'CC9.1', 'Risk Mitigation', 'Risk Identification and Assessment', 'The entity identifies, selects, and develops risk mitigation activities.', 'P1', 1, 1, 1, 19);

-- ============================================================================
-- CROSSWALK MAPPINGS
-- ============================================================================

-- NIST 800-53 AC-2 <-> HIPAA / SOC 2 / CMMC
INSERT OR REPLACE INTO control_crosswalks (source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence) VALUES
('nist-800-53-r5', 'AC-1', 'hipaa', '164.308(a)(1)', 'partial', 0.8),
('nist-800-53-r5', 'AC-2', 'hipaa', '164.308(a)(3)', 'partial', 0.85),
('nist-800-53-r5', 'AC-2', 'hipaa', '164.308(a)(4)', 'partial', 0.85),
('nist-800-53-r5', 'AC-2', 'soc2-type2', 'CC6.2', 'equivalent', 0.9),
('nist-800-53-r5', 'AC-2', 'soc2-type2', 'CC6.3', 'partial', 0.8),
('nist-800-53-r5', 'AC-3', 'hipaa', '164.312(a)(1)', 'equivalent', 0.9),
('nist-800-53-r5', 'AC-3', 'soc2-type2', 'CC6.1', 'equivalent', 0.9),
('nist-800-53-r5', 'AC-6', 'soc2-type2', 'CC6.3', 'equivalent', 0.85),
('nist-800-53-r5', 'AC-7', 'hipaa', '164.312(a)(1)', 'partial', 0.7),
('nist-800-53-r5', 'AC-17', 'soc2-type2', 'CC6.1', 'partial', 0.75),
('nist-800-53-r5', 'AC-17', 'soc2-type2', 'CC6.6', 'partial', 0.8),
('hipaa', '164.308(a)(1)', 'soc2-type2', 'CC3.1', 'partial', 0.75),
('hipaa', '164.308(a)(5)', 'soc2-type2', 'CC1.1', 'partial', 0.7),
('hipaa', '164.308(a)(6)', 'soc2-type2', 'CC7.3', 'equivalent', 0.85),
('hipaa', '164.308(a)(6)', 'soc2-type2', 'CC7.4', 'equivalent', 0.85),
('hipaa', '164.312(b)', 'soc2-type2', 'CC7.1', 'equivalent', 0.9),
('hipaa', '164.312(b)', 'soc2-type2', 'CC7.2', 'partial', 0.8),
('nist-800-53-r5', 'AC-2', 'cmmc-l2', 'AC.L2-3.1.1', 'equivalent', 0.95),
('nist-800-53-r5', 'AC-3', 'cmmc-l2', 'AC.L2-3.1.2', 'equivalent', 0.95),
('nist-800-53-r5', 'AC-5', 'cmmc-l2', 'AC.L2-3.1.4', 'equivalent', 0.95),
('nist-800-53-r5', 'AC-6', 'cmmc-l2', 'AC.L2-3.1.5', 'equivalent', 0.95),
('nist-800-53-r5', 'AC-7', 'cmmc-l2', 'AC.L2-3.1.8', 'equivalent', 0.95),
('nist-800-53-r5', 'AC-17', 'cmmc-l2', 'AC.L2-3.1.12', 'equivalent', 0.95);

-- ============================================================================
-- SAMPLE CMMC L2 CONTROLS
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('cmmc-l2', 'AC.L2-3.1.1', 'Access Control', 'Authorized Access Control', 'Limit system access to authorized users, processes acting on behalf of authorized users, and devices.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'AC.L2-3.1.2', 'Access Control', 'Transaction and Function Control', 'Limit system access to the types of transactions and functions that authorized users are permitted to execute.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'AC.L2-3.1.3', 'Access Control', 'CUI Flow Control', 'Control the flow of CUI in accordance with approved authorizations.', 'P1', 1, 1, 1, 3),
('cmmc-l2', 'AC.L2-3.1.4', 'Access Control', 'Separation of Duties', 'Separate the duties of individuals to reduce the risk of malevolent activity without collusion.', 'P1', 1, 1, 1, 4),
('cmmc-l2', 'AC.L2-3.1.5', 'Access Control', 'Least Privilege', 'Employ the principle of least privilege, including for specific security functions and privileged accounts.', 'P1', 1, 1, 1, 5),
('cmmc-l2', 'AC.L2-3.1.7', 'Access Control', 'Privileged Functions', 'Prevent non-privileged users from executing privileged functions and capture execution in audit logs.', 'P1', 1, 1, 1, 7),
('cmmc-l2', 'AC.L2-3.1.8', 'Access Control', 'Unsuccessful Logon Attempts', 'Limit unsuccessful logon attempts.', 'P1', 1, 1, 1, 8),
('cmmc-l2', 'AC.L2-3.1.12', 'Access Control', 'Remote Access Control', 'Monitor and control remote access sessions.', 'P1', 1, 1, 1, 12),
('cmmc-l2', 'AC.L2-3.1.20', 'Access Control', 'External Connections', 'Verify and control/limit connections to and use of external systems.', 'P1', 1, 1, 1, 20);

-- ============================================================================
-- ADD-ON MODULES
-- ============================================================================

INSERT OR REPLACE INTO addon_modules (id, name, description, price_monthly) VALUES
('forgesoc', 'ForgeSOC', 'Security operations center integration with SIEM correlation', 2500),
('forgeredops', 'ForgeRedOps', 'AI-powered penetration testing and attack simulation', 3000),
('forgeml-advanced', 'ForgeML Advanced', 'Advanced AI narrative generation with custom model training', 1500),
('vendorguard', 'VendorGuard TPRM', 'Third-party risk management with automated questionnaires', 2000),
('premium-support', 'Premium Support', '24/7 support with dedicated customer success manager', 5000);

-- ============================================================================
-- FORGEML AI WRITER - BUILT-IN TEMPLATES
-- ============================================================================

INSERT OR REPLACE INTO ai_templates (id, org_id, name, description, category, system_prompt, user_prompt_template, variables, is_builtin) VALUES
('tpl-control-narrative', NULL, 'Control Implementation Narrative',
  'Generate a professional implementation narrative describing how a security control is implemented within the system. Suitable for SSP documentation.',
  'control_narrative',
  'You are a senior cybersecurity compliance consultant with 15+ years of experience writing System Security Plans (SSPs) for federal agencies and regulated industries. You write clear, specific, implementation-focused narratives that satisfy assessor expectations. Use professional third-person language. Be specific about technologies, processes, and responsible parties. Each narrative should address the WHO, WHAT, WHEN, WHERE, and HOW of control implementation. Do not use generic or vague language.',
  'Write a detailed control implementation narrative for the following:

System: {{system_name}} ({{system_acronym}})
Impact Level: {{impact_level}}
Framework: {{framework_name}}
Control ID: {{control_id}}
Control Title: {{control_title}}
Control Description: {{control_description}}

Current Implementation Status: {{implementation_status}}
Organization: {{org_name}}
Industry: {{industry}}

{{#additional_context}}Additional Context: {{additional_context}}{{/additional_context}}

Write a professional implementation narrative (200-400 words) that describes exactly how this control is implemented. Include specific technologies, processes, roles, and frequencies where appropriate.',
  '[{"name":"additional_context","label":"Additional Context","description":"Any specific details about how this control is implemented in your environment","type":"textarea","required":false}]',
  1
),

('tpl-poam-remediation', NULL, 'POA&M Remediation Plan',
  'Generate a detailed Plan of Action & Milestones remediation plan with specific steps, timelines, and resource requirements.',
  'poam',
  'You are a senior cybersecurity compliance consultant specializing in POA&M (Plan of Action & Milestones) development for federal and regulated environments. You create actionable, specific remediation plans with clear milestones, resource requirements, and risk-based prioritization. Your plans satisfy FISMA and OMB reporting requirements.',
  'Create a detailed POA&M remediation plan for the following weakness:

System: {{system_name}}
Weakness: {{weakness_name}}
Description: {{weakness_description}}
Control: {{control_id}} - {{control_title}}
Risk Level: {{risk_level}}
Framework: {{framework_name}}

{{#additional_context}}Additional Context: {{additional_context}}{{/additional_context}}

Generate a comprehensive remediation plan that includes:
1. Root cause analysis
2. Specific remediation steps (numbered)
3. Milestones with target completion dates (relative, e.g., "Week 1-2")
4. Required resources (personnel, tools, budget estimates)
5. Risk reduction expected after remediation
6. Verification/validation steps to confirm remediation effectiveness',
  '[{"name":"additional_context","label":"Additional Context","description":"Current environment details, constraints, or existing remediation efforts","type":"textarea","required":false}]',
  1
),

('tpl-risk-assessment', NULL, 'Risk Assessment Narrative',
  'Generate a formal risk assessment narrative with likelihood/impact analysis and treatment recommendations.',
  'risk',
  'You are a senior risk management professional with expertise in enterprise risk management (ERM) frameworks including NIST 800-30, ISO 31000, and COSO ERM. You write formal risk assessments that clearly articulate threats, vulnerabilities, likelihood, impact, and treatment strategies. Your assessments are data-driven and defensible.',
  'Perform a formal risk assessment for the following:

Organization: {{org_name}}
System: {{system_name}}
Risk Title: {{risk_title}}
Risk Description: {{risk_description}}
Risk Category: {{risk_category}}
Current Likelihood: {{likelihood}} (1-5 scale)
Current Impact: {{impact}} (1-5 scale)

{{#additional_context}}Additional Context: {{additional_context}}{{/additional_context}}

Generate a comprehensive risk assessment narrative that includes:
1. Threat source and event description
2. Vulnerability analysis
3. Likelihood justification (why the chosen rating is appropriate)
4. Impact analysis across dimensions (operational, financial, reputational, compliance)
5. Risk treatment recommendation (accept, mitigate, transfer, or avoid)
6. Recommended mitigation controls if applicable
7. Residual risk estimate after treatment',
  '[{"name":"additional_context","label":"Additional Context","description":"Existing controls, threat intelligence, or environmental factors","type":"textarea","required":false}]',
  1
),

('tpl-executive-summary', NULL, 'Executive Compliance Summary',
  'Generate a board-level executive summary of compliance posture and key metrics.',
  'executive',
  'You are a CISO-level compliance executive who writes concise, business-oriented reports for board members and senior leadership. You translate technical compliance status into business risk language. Your reports focus on what matters: risk exposure, compliance gaps, resource needs, and strategic recommendations. Use clear headers, bullet points, and avoid technical jargon.',
  'Write an executive compliance summary report for:

Organization: {{org_name}}
Industry: {{industry}}
Primary Framework: {{framework_name}}
Total Controls: {{total_controls}}
Implemented: {{implemented_count}}
Partially Implemented: {{partial_count}}
Not Implemented: {{not_implemented_count}}
Open POA&Ms: {{open_poams}}
Overall Compliance Score: {{compliance_score}}%

{{#additional_context}}Additional Context: {{additional_context}}{{/additional_context}}

Generate a 1-page executive summary that includes:
1. Compliance posture overview (2-3 sentences)
2. Key achievements since last report
3. Critical gaps and risks (top 3-5)
4. Resource and budget implications
5. Strategic recommendations (3-5 actionable items)
6. Timeline and next steps',
  '[{"name":"total_controls","label":"Total Controls","description":"Total number of applicable controls","type":"number","required":true},{"name":"implemented_count","label":"Implemented Controls","description":"Number of fully implemented controls","type":"number","required":true},{"name":"partial_count","label":"Partially Implemented","description":"Number of partially implemented controls","type":"number","required":true},{"name":"not_implemented_count","label":"Not Implemented","description":"Number of not implemented controls","type":"number","required":true},{"name":"open_poams","label":"Open POA&Ms","description":"Number of open POA&M items","type":"number","required":true},{"name":"compliance_score","label":"Compliance Score %","description":"Overall compliance percentage","type":"number","required":true},{"name":"additional_context","label":"Additional Context","description":"Recent events, upcoming audits, or leadership concerns","type":"textarea","required":false}]',
  1
),

('tpl-gap-analysis', NULL, 'Gap Analysis Report',
  'Generate a detailed gap analysis comparing current compliance state against framework requirements.',
  'gap_analysis',
  'You are a senior compliance analyst specializing in gap analysis and readiness assessments. You systematically evaluate an organization''s current security posture against framework requirements, identify gaps, and prioritize remediation efforts. Your reports are structured, actionable, and suitable for presentation to auditors and management.',
  'Perform a gap analysis for:

Organization: {{org_name}}
System: {{system_name}}
Target Framework: {{framework_name}}
Current Maturity Level: {{maturity_level}}
Assessment Scope: {{scope}}

{{#additional_context}}Additional Context: {{additional_context}}{{/additional_context}}

Generate a structured gap analysis report that includes:
1. Executive summary of readiness level
2. Methodology used for the assessment
3. Key findings organized by control family
4. Gap severity classification (Critical / High / Medium / Low)
5. Prioritized remediation roadmap
6. Resource estimates for achieving compliance
7. Recommended timeline to target authorization/certification',
  '[{"name":"maturity_level","label":"Current Maturity Level","description":"Current security maturity (e.g., Initial, Developing, Defined, Managed, Optimized)","type":"text","required":true},{"name":"scope","label":"Assessment Scope","description":"What is being assessed (e.g., entire system, specific control families)","type":"text","required":true},{"name":"additional_context","label":"Additional Context","description":"Known gaps, recent changes, or specific areas of concern","type":"textarea","required":false}]',
  1
),

('tpl-audit-response', NULL, 'Audit Response Letter',
  'Generate a formal response to audit findings with corrective action plans.',
  'audit_response',
  'You are a senior compliance officer experienced in responding to audit findings from 3PAOs, OIG offices, and external auditors. You write professional, structured responses that acknowledge findings, provide context, and outline specific corrective actions. Your tone is cooperative and solution-oriented while protecting the organization''s interests.',
  'Draft a formal audit response for:

Organization: {{org_name}}
Audit Finding ID: {{finding_id}}
Finding Title: {{finding_title}}
Finding Description: {{finding_description}}
Severity: {{severity}}
Auditor Recommendation: {{auditor_recommendation}}

{{#additional_context}}Additional Context: {{additional_context}}{{/additional_context}}

Generate a formal audit response letter that includes:
1. Acknowledgment of the finding
2. Management response (agree, partially agree, or disagree with justification)
3. Root cause analysis
4. Corrective Action Plan (CAP) with specific steps
5. Responsible party and target completion date
6. Evidence that will demonstrate remediation
7. Request for finding closure criteria if applicable',
  '[{"name":"finding_id","label":"Finding ID","description":"The audit finding identifier","type":"text","required":true},{"name":"finding_title","label":"Finding Title","description":"Title of the audit finding","type":"text","required":true},{"name":"finding_description","label":"Finding Description","description":"Full description of what the auditor found","type":"textarea","required":true},{"name":"severity","label":"Severity","description":"Finding severity (Critical, High, Medium, Low)","type":"text","required":true},{"name":"auditor_recommendation","label":"Auditor Recommendation","description":"What the auditor recommended","type":"textarea","required":true},{"name":"additional_context","label":"Additional Context","description":"Existing mitigations, timeline constraints, or management position","type":"textarea","required":false}]',
  1
),

('tpl-vendor-risk', NULL, 'Vendor Risk Assessment',
  'Generate a third-party vendor risk assessment report evaluating security and compliance posture.',
  'vendor',
  'You are a third-party risk management (TPRM) specialist experienced in evaluating vendor security posture for regulated industries. You assess vendors against industry frameworks, evaluate data handling practices, and provide risk ratings with specific recommendations. Your assessments satisfy SOC 2, HIPAA, and FedRAMP third-party requirements.',
  'Perform a vendor risk assessment for:

Organization: {{org_name}}
Vendor Name: {{vendor_name}}
Vendor Category: {{vendor_category}}
Service Description: {{service_description}}
Data Classification: {{data_classification}}
Criticality: {{criticality}}

{{#additional_context}}Additional Context: {{additional_context}}{{/additional_context}}

Generate a comprehensive vendor risk assessment that includes:
1. Vendor overview and service scope
2. Data flow and access analysis
3. Security posture evaluation (encryption, access controls, incident response)
4. Compliance certifications evaluation (SOC 2, ISO 27001, FedRAMP, etc.)
5. Risk rating (Critical / High / Medium / Low) with justification
6. Contractual requirements and SLA recommendations
7. Monitoring and reassessment frequency recommendation
8. Conditions for continued vendor engagement',
  '[{"name":"vendor_name","label":"Vendor Name","description":"Name of the vendor being assessed","type":"text","required":true},{"name":"vendor_category","label":"Category","description":"Vendor category (e.g., Cloud Provider, SaaS, Consulting)","type":"text","required":true},{"name":"service_description","label":"Service Description","description":"What services the vendor provides","type":"textarea","required":true},{"name":"data_classification","label":"Data Classification","description":"Classification of data the vendor accesses (Public, Internal, Confidential, Restricted)","type":"text","required":true},{"name":"criticality","label":"Criticality","description":"How critical is this vendor (Low, Medium, High, Critical)","type":"text","required":true},{"name":"additional_context","label":"Additional Context","description":"Existing certifications, past incidents, or specific concerns","type":"textarea","required":false}]',
  1
);

-- ============================================================================
-- ATO PACKAGE DOCUMENT TEMPLATES (9 additional)
-- See database/migrate-002-ato-document-templates.sql for full definitions
-- These are duplicated here for fresh installs
-- ============================================================================

INSERT OR REPLACE INTO ai_templates (id, org_id, name, description, category, system_prompt, user_prompt_template, variables, is_builtin, created_at, updated_at) VALUES ('tpl-sar', NULL, 'Security Assessment Report (SAR)', 'Generate a Security Assessment Report documenting control test results and risk determinations.', 'custom', 'You are a senior 3PAO assessor with 15+ years of experience conducting security assessments per NIST SP 800-53A. Write SARs that satisfy FedRAMP and FISMA requirements.', 'Generate a Security Assessment Report (SAR) for: Organization: {{org_name}}, System: {{system_name}} ({{system_acronym}}), Impact Level: {{impact_level}}, Assessment Date Range: {{assessment_date_range}}, Assessment Type: {{assessment_type}}, Lead Assessor: {{lead_assessor}}, Framework: {{framework_name}}. {{#additional_context}}Additional Context: {{additional_context}}{{/additional_context}} Include: 1. Executive Summary 2. Scope and Methodology 3. System Description 4. Results Summary 5. Detailed Findings 6. Risk Determination 7. Recommendations 8. Attestation', '[{"name":"assessment_date_range","label":"Assessment Date Range","type":"text","required":true},{"name":"assessment_type","label":"Assessment Type","type":"text","required":true},{"name":"lead_assessor","label":"Lead Assessor","type":"text","required":true},{"name":"framework_name","label":"Framework","type":"text","required":true},{"name":"additional_context","label":"Additional Context","type":"textarea","required":false}]', 1, datetime('now'), datetime('now'));

INSERT OR REPLACE INTO ai_templates (id, org_id, name, description, category, system_prompt, user_prompt_template, variables, is_builtin, created_at, updated_at) VALUES ('tpl-isra', NULL, 'Information System Risk Assessment (ISRA)', 'Generate a formal risk assessment per NIST SP 800-30.', 'custom', 'You are a senior risk management professional specializing in NIST SP 800-30 Rev 1 risk assessments with 5x5 risk matrix.', 'Generate an ISRA for: Organization: {{org_name}}, System: {{system_name}} ({{system_acronym}}), Impact Level: {{impact_level}}, Date: {{assessment_date}}, Prepared By: {{prepared_by}}, Description: {{system_description}}. {{#additional_context}}Additional: {{additional_context}}{{/additional_context}} Include: 1. Purpose/Scope 2. System Characterization 3. Threat Sources 4. Threat Events 5. Vulnerabilities 6. Likelihood 7. Impact 8. Risk Matrix 9. Recommendations 10. Summary', '[{"name":"assessment_date","label":"Assessment Date","type":"text","required":true},{"name":"prepared_by","label":"Prepared By","type":"text","required":true},{"name":"system_description","label":"System Description","type":"textarea","required":true},{"name":"additional_context","label":"Additional Context","type":"textarea","required":false}]', 1, datetime('now'), datetime('now'));

INSERT OR REPLACE INTO ai_templates (id, org_id, name, description, category, system_prompt, user_prompt_template, variables, is_builtin, created_at, updated_at) VALUES ('tpl-pia', NULL, 'Privacy Impact Assessment (PIA)', 'Evaluate PII collection, use, sharing, and safeguards.', 'custom', 'You are a senior privacy officer with expertise in the Privacy Act, E-Government Act, OMB A-130, and NIST SP 800-122.', 'Generate a PIA for: Organization: {{org_name}}, System: {{system_name}} ({{system_acronym}}), Impact Level: {{impact_level}}, PII Types: {{pii_types}}, Records: {{record_count}}, Subjects: {{data_subjects}}. {{#additional_context}}Additional: {{additional_context}}{{/additional_context}} Include: 1. Overview 2. PII Inventory 3. Authority 4. Purpose 5. Data Flow 6. Sharing 7. Safeguards 8. Individual Rights 9. Risk Assessment 10. Determination', '[{"name":"pii_types","label":"PII Types","type":"textarea","required":true},{"name":"record_count","label":"Record Count","type":"text","required":true},{"name":"data_subjects","label":"Data Subjects","type":"text","required":true},{"name":"additional_context","label":"Additional Context","type":"textarea","required":false}]', 1, datetime('now'), datetime('now'));

INSERT OR REPLACE INTO ai_templates (id, org_id, name, description, category, system_prompt, user_prompt_template, variables, is_builtin, created_at, updated_at) VALUES ('tpl-iscp', NULL, 'Information System Contingency Plan (ISCP)', 'Generate a BC/DR contingency plan per NIST SP 800-34.', 'custom', 'You are a senior BC/DR specialist with expertise in NIST SP 800-34 Rev 1. Write operational, action-oriented ISCPs.', 'Generate an ISCP for: Organization: {{org_name}}, System: {{system_name}} ({{system_acronym}}), Impact Level: {{impact_level}}, RTO: {{rto}}, RPO: {{rpo}}, Alternate Site: {{alternate_site}}, Coordinator: {{plan_coordinator}}. {{#additional_context}}Additional: {{additional_context}}{{/additional_context}} Include: 1. Introduction 2. ConOps 3. Notification/Activation 4. Recovery 5. Reconstitution 6. Contacts 7. Backups 8. Alternate Site 9. Maintenance 10. Checklists', '[{"name":"rto","label":"RTO","type":"text","required":true},{"name":"rpo","label":"RPO","type":"text","required":true},{"name":"alternate_site","label":"Alternate Site","type":"text","required":true},{"name":"plan_coordinator","label":"ISCP Coordinator","type":"text","required":true},{"name":"additional_context","label":"Additional Context","type":"textarea","required":false}]', 1, datetime('now'), datetime('now'));

INSERT OR REPLACE INTO ai_templates (id, org_id, name, description, category, system_prompt, user_prompt_template, variables, is_builtin, created_at, updated_at) VALUES ('tpl-cmp', NULL, 'Configuration Management Plan (CMP)', 'Generate a CM plan covering change management and baseline management.', 'custom', 'You are a senior CM specialist with expertise in NIST SP 800-128. Write implementable CM procedures.', 'Generate a CMP for: Organization: {{org_name}}, System: {{system_name}} ({{system_acronym}}), Impact Level: {{impact_level}}, CM Tools: {{cm_tools}}, CCB Chair: {{ccb_chair}}. {{#additional_context}}Additional: {{additional_context}}{{/additional_context}} Include: 1. Introduction 2. Governance 3. Identification 4. Baselines 5. Change Control 6. Monitoring 7. Status Accounting 8. Patch Management 9. Secure Config Standards 10. Maintenance', '[{"name":"cm_tools","label":"CM Tools","type":"text","required":true},{"name":"ccb_chair","label":"CCB Chair","type":"text","required":true},{"name":"additional_context","label":"Additional Context","type":"textarea","required":false}]', 1, datetime('now'), datetime('now'));

INSERT OR REPLACE INTO ai_templates (id, org_id, name, description, category, system_prompt, user_prompt_template, variables, is_builtin, created_at, updated_at) VALUES ('tpl-isa', NULL, 'Interconnection Security Agreement (ISA/MOU)', 'Generate an ISA/MOU for system interconnections.', 'custom', 'You are a senior cybersecurity compliance specialist drafting ISAs/MOUs per NIST SP 800-47 Rev 1. Use formal contractual language.', 'Generate an ISA/MOU for: Org A: {{org_name}}, System A: {{system_name}} ({{system_acronym}}), Impact: {{impact_level}}, Org B: {{partner_org}}, System B: {{partner_system}}, Partner Impact: {{partner_impact_level}}, Type: {{interconnection_type}}, Data: {{data_classification}}. {{#additional_context}}Additional: {{additional_context}}{{/additional_context}} Include: 1. Purpose 2. System Descriptions 3. Interconnection Details 4. Security Controls 5. Data Handling 6. User Management 7. Incident Response 8. Contingency 9. Rules of Behavior 10. Terms 11. Signatures', '[{"name":"partner_org","label":"Partner Organization","type":"text","required":true},{"name":"partner_system","label":"Partner System","type":"text","required":true},{"name":"partner_impact_level","label":"Partner Impact Level","type":"text","required":true},{"name":"interconnection_type","label":"Interconnection Type","type":"text","required":true},{"name":"data_classification","label":"Data Classification","type":"text","required":true},{"name":"additional_context","label":"Additional Context","type":"textarea","required":false}]', 1, datetime('now'), datetime('now'));

INSERT OR REPLACE INTO ai_templates (id, org_id, name, description, category, system_prompt, user_prompt_template, variables, is_builtin, created_at, updated_at) VALUES ('tpl-ato-letter', NULL, 'Authorization to Operate (ATO) Letter', 'Generate a formal AO authorization memorandum.', 'custom', 'You are a senior AO writing formal authorization memorandums per NIST SP 800-37 Rev 2. Use government memorandum format.', 'Generate an ATO Letter for: Organization: {{org_name}}, System: {{system_name}} ({{system_acronym}}), Impact: {{impact_level}}, Decision: {{auth_decision}}, Date: {{auth_date}}, Expiry: {{auth_expiry}}, AO: {{authorizing_official}}, Owner: {{system_owner}}, ISSO: {{isso_name}}, POA&Ms: {{open_poams_count}}, Risk: {{overall_risk}}. {{#conditions}}Conditions: {{conditions}}{{/conditions}} Include: 1. Memorandum Header 2. References 3. Purpose 4. System Description 5. Assessment Summary 6. Risk Determination 7. Decision 8. Conditions 9. POA&M Requirements 10. Duration 11. Signature', '[{"name":"auth_decision","label":"Decision","type":"text","required":true},{"name":"auth_date","label":"Auth Date","type":"text","required":true},{"name":"auth_expiry","label":"Expiry","type":"text","required":true},{"name":"authorizing_official","label":"AO Name","type":"text","required":true},{"name":"system_owner","label":"System Owner","type":"text","required":true},{"name":"isso_name","label":"ISSO","type":"text","required":true},{"name":"open_poams_count","label":"Open POA&Ms","type":"text","required":true},{"name":"overall_risk","label":"Risk Level","type":"text","required":true},{"name":"conditions","label":"Conditions","type":"textarea","required":false}]', 1, datetime('now'), datetime('now'));

INSERT OR REPLACE INTO ai_templates (id, org_id, name, description, category, system_prompt, user_prompt_template, variables, is_builtin, created_at, updated_at) VALUES ('tpl-fips199', NULL, 'FIPS 199 Security Categorization', 'Generate a FIPS 199 impact level determination memorandum.', 'custom', 'You are a senior cybersecurity specialist with expertise in FIPS 199 and NIST SP 800-60. Use high-water mark approach.', 'Generate a FIPS 199 Categorization for: Organization: {{org_name}}, System: {{system_name}} ({{system_acronym}}), Purpose: {{system_purpose}}, Info Types: {{information_types}}, Proposed Level: {{impact_level}}. {{#additional_context}}Additional: {{additional_context}}{{/additional_context}} Include: 1. System ID 2. Information Types 3. Confidentiality Impact 4. Integrity Impact 5. Availability Impact 6. Summary Table 7. Overall Categorization 8. SC Designation 9. Justification 10. Signatures', '[{"name":"system_purpose","label":"System Purpose","type":"textarea","required":true},{"name":"information_types","label":"Information Types","type":"textarea","required":true},{"name":"additional_context","label":"Additional Context","type":"textarea","required":false}]', 1, datetime('now'), datetime('now'));

INSERT OR REPLACE INTO ai_templates (id, org_id, name, description, category, system_prompt, user_prompt_template, variables, is_builtin, created_at, updated_at) VALUES ('tpl-cptt', NULL, 'Contingency Plan Tabletop Exercise Report', 'Generate a tabletop exercise after-action report.', 'custom', 'You are a senior BC/DR specialist who documents tabletop exercises per NIST SP 800-84 and 800-34. Write factual after-action reports.', 'Generate a CPTT Report for: Organization: {{org_name}}, System: {{system_name}} ({{system_acronym}}), Impact: {{impact_level}}, Date: {{exercise_date}}, Facilitator: {{facilitator}}, Scenario: {{scenario_type}}, Participants: {{participants}}. {{#additional_context}}Additional: {{additional_context}}{{/additional_context}} Include: 1. Overview 2. Scenario 3. Participants Table 4. Timeline 5. Observations 6. Gaps 7. Corrective Actions 8. Lessons Learned 9. Plan Updates 10. Next Exercise', '[{"name":"exercise_date","label":"Exercise Date","type":"text","required":true},{"name":"facilitator","label":"Facilitator","type":"text","required":true},{"name":"scenario_type","label":"Scenario Type","type":"text","required":true},{"name":"participants","label":"Participants","type":"textarea","required":true},{"name":"additional_context","label":"Additional Context","type":"textarea","required":false}]', 1, datetime('now'), datetime('now'));
