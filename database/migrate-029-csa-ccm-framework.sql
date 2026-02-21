-- ============================================================================
-- MIGRATION 029: CSA Cloud Controls Matrix (CCM) v4.0
-- ============================================================================
-- Adds the CSA CCM v4 framework with 197 controls across 17 cloud security
-- domains and crosswalk mappings to NIST 800-53 R5.
-- Fully idempotent — safe to re-run on every deploy (INSERT OR REPLACE).
-- ============================================================================

-- Framework definition
INSERT OR REPLACE INTO compliance_frameworks (id, name, version, category, description, control_count, governing_body, assessment_methodology)
VALUES ('csa-ccm-v4', 'CSA Cloud Controls Matrix v4', '4.0', 'commercial',
  'Cloud Security Alliance Cloud Controls Matrix version 4.0 — comprehensive cloud security control framework with 197 controls across 17 domains. Used for CSA STAR certification and cloud security assessment. Covers audit, application security, business continuity, cryptography, data security, identity management, infrastructure security, and more.',
  197, 'CSA', 'STAR Certification Assessment');

-- ============================================================================
-- A&A — Audit & Assurance (6 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('csa-ccm-v4', 'A&A-01', 'Audit and Assurance', 'Audit and Assurance Policy and Procedures',
 'Establish and maintain audit and assurance policies and procedures.', 'P1', 1, 1, 1, 1),
('csa-ccm-v4', 'A&A-02', 'Audit and Assurance', 'Independent Assessments',
 'Conduct independent audit and assurance assessments according to relevant standards.', 'P1', 1, 1, 1, 2),
('csa-ccm-v4', 'A&A-03', 'Audit and Assurance', 'Risk Based Planning Assessment',
 'Plan and execute risk-based audit and assurance activities.', 'P1', 1, 1, 1, 3),
('csa-ccm-v4', 'A&A-04', 'Audit and Assurance', 'Requirements Compliance',
 'Verify compliance with all relevant requirements including legal, regulatory, and contractual.', 'P1', 1, 1, 1, 4),
('csa-ccm-v4', 'A&A-05', 'Audit and Assurance', 'Audit Management Process',
 'Define and implement an audit management process to support audit planning and reporting.', 'P2', 1, 1, 1, 5),
('csa-ccm-v4', 'A&A-06', 'Audit and Assurance', 'Remediation',
 'Establish a remediation process for identified audit findings and track to closure.', 'P1', 1, 1, 1, 6);

-- ============================================================================
-- AIS — Application & Interface Security (13 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('csa-ccm-v4', 'AIS-01', 'Application and Interface Security', 'Application and Interface Security Policy',
 'Establish policies and procedures for application and interface security.', 'P1', 1, 1, 1, 7),
('csa-ccm-v4', 'AIS-02', 'Application and Interface Security', 'Application Security Baseline',
 'Define and implement application security baseline requirements.', 'P1', 1, 1, 1, 8),
('csa-ccm-v4', 'AIS-03', 'Application and Interface Security', 'Data Integrity',
 'Implement measures to ensure data integrity in applications and interfaces.', 'P1', 1, 1, 1, 9),
('csa-ccm-v4', 'AIS-04', 'Application and Interface Security', 'Application Security Testing',
 'Conduct security testing of applications prior to deployment and after significant changes.', 'P1', 1, 1, 1, 10),
('csa-ccm-v4', 'AIS-05', 'Application and Interface Security', 'Automated Application Security Testing',
 'Implement automated application security testing in the development pipeline.', 'P1', 0, 1, 1, 11),
('csa-ccm-v4', 'AIS-06', 'Application and Interface Security', 'Automated Secure Application Deployment',
 'Automate secure application deployment processes to reduce human error.', 'P2', 0, 1, 1, 12),
('csa-ccm-v4', 'AIS-07', 'Application and Interface Security', 'Application Threat Management',
 'Identify and manage threats to applications and interfaces.', 'P1', 1, 1, 1, 13),
('csa-ccm-v4', 'AIS-08', 'Application and Interface Security', 'Secure Software Development',
 'Implement secure software development lifecycle practices.', 'P1', 1, 1, 1, 14),
('csa-ccm-v4', 'AIS-09', 'Application and Interface Security', 'Service Level Objectives',
 'Define and enforce service level objectives for application and interface security.', 'P2', 1, 1, 1, 15),
('csa-ccm-v4', 'AIS-10', 'Application and Interface Security', 'Source Code Access Restrictions',
 'Restrict access to source code and development tools to authorized personnel.', 'P1', 1, 1, 1, 16),
('csa-ccm-v4', 'AIS-11', 'Application and Interface Security', 'Unsupported Software Management',
 'Identify and manage risks from unsupported software and components.', 'P1', 1, 1, 1, 17),
('csa-ccm-v4', 'AIS-12', 'Application and Interface Security', 'Mobile Application Security',
 'Implement security controls for mobile applications accessing cloud services.', 'P2', 1, 1, 1, 18),
('csa-ccm-v4', 'AIS-13', 'Application and Interface Security', 'Customer Access Requirements',
 'Define and communicate customer access requirements for applications and APIs.', 'P2', 1, 1, 1, 19);

-- ============================================================================
-- BCR — Business Continuity Management (11 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('csa-ccm-v4', 'BCR-01', 'Business Continuity', 'Business Continuity Policy',
 'Establish business continuity management and operational resilience policies.', 'P1', 1, 1, 1, 20),
('csa-ccm-v4', 'BCR-02', 'Business Continuity', 'Impact Analysis',
 'Conduct business impact analysis to identify critical functions and dependencies.', 'P1', 1, 1, 1, 21),
('csa-ccm-v4', 'BCR-03', 'Business Continuity', 'Business Continuity Strategy',
 'Develop business continuity strategies based on impact analysis results.', 'P1', 1, 1, 1, 22),
('csa-ccm-v4', 'BCR-04', 'Business Continuity', 'Business Continuity Planning',
 'Develop and maintain business continuity plans for critical operations.', 'P1', 1, 1, 1, 23),
('csa-ccm-v4', 'BCR-05', 'Business Continuity', 'Environmental Risks',
 'Assess and mitigate environmental risks to infrastructure and operations.', 'P2', 1, 1, 1, 24),
('csa-ccm-v4', 'BCR-06', 'Business Continuity', 'Business Continuity Exercises',
 'Conduct regular exercises and tests of business continuity plans.', 'P1', 1, 1, 1, 25),
('csa-ccm-v4', 'BCR-07', 'Business Continuity', 'Equipment Maintenance',
 'Implement preventive maintenance for critical infrastructure equipment.', 'P2', 1, 1, 1, 26),
('csa-ccm-v4', 'BCR-08', 'Business Continuity', 'Equipment Power Failures',
 'Protect against equipment power failures with redundancy and backup power.', 'P1', 1, 1, 1, 27),
('csa-ccm-v4', 'BCR-09', 'Business Continuity', 'Backup and Recovery',
 'Implement backup procedures and validate recovery capabilities.', 'P1', 1, 1, 1, 28),
('csa-ccm-v4', 'BCR-10', 'Business Continuity', 'Service Availability Testing',
 'Test service availability and recovery time objectives regularly.', 'P1', 1, 1, 1, 29),
('csa-ccm-v4', 'BCR-11', 'Business Continuity', 'Restoration and Recovery',
 'Establish procedures for restoration and recovery of cloud services.', 'P1', 1, 1, 1, 30);

-- ============================================================================
-- CCC — Change Control & Configuration Management (8 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('csa-ccm-v4', 'CCC-01', 'Change Control and Configuration', 'Change Management Policy',
 'Establish change management policies and procedures for all system changes.', 'P1', 1, 1, 1, 31),
('csa-ccm-v4', 'CCC-02', 'Change Control and Configuration', 'Change Management Scope',
 'Define the scope of change management to cover all relevant assets and configurations.', 'P1', 1, 1, 1, 32),
('csa-ccm-v4', 'CCC-03', 'Change Control and Configuration', 'Change Management Technology',
 'Implement technology solutions to support change management processes.', 'P2', 1, 1, 1, 33),
('csa-ccm-v4', 'CCC-04', 'Change Control and Configuration', 'Unauthorized Change Protection',
 'Implement controls to detect and prevent unauthorized changes to production systems.', 'P1', 1, 1, 1, 34),
('csa-ccm-v4', 'CCC-05', 'Change Control and Configuration', 'Quality Testing',
 'Perform quality and security testing before deploying changes to production.', 'P1', 1, 1, 1, 35),
('csa-ccm-v4', 'CCC-06', 'Change Control and Configuration', 'Change Management Baseline',
 'Maintain baseline configurations and track deviations through change management.', 'P1', 1, 1, 1, 36),
('csa-ccm-v4', 'CCC-07', 'Change Control and Configuration', 'New Development and Acquisition',
 'Apply change management controls to new development and technology acquisitions.', 'P1', 1, 1, 1, 37),
('csa-ccm-v4', 'CCC-08', 'Change Control and Configuration', 'Exception Management',
 'Define and manage exceptions to change management procedures with appropriate approvals.', 'P2', 1, 1, 1, 38);

-- ============================================================================
-- CEK — Cryptography, Encryption & Key Management (15 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('csa-ccm-v4', 'CEK-01', 'Cryptography and Key Management', 'Encryption and Key Management Policy',
 'Establish policies for cryptography, encryption, and key management.', 'P1', 1, 1, 1, 39),
('csa-ccm-v4', 'CEK-02', 'Cryptography and Key Management', 'Sensitive Data Protection',
 'Identify and protect sensitive data using encryption where appropriate.', 'P1', 1, 1, 1, 40),
('csa-ccm-v4', 'CEK-03', 'Cryptography and Key Management', 'Data Encryption',
 'Encrypt data at rest and in transit using approved encryption standards.', 'P1', 1, 1, 1, 41),
('csa-ccm-v4', 'CEK-04', 'Cryptography and Key Management', 'Encryption Algorithm',
 'Use approved encryption algorithms that meet industry and regulatory requirements.', 'P1', 1, 1, 1, 42),
('csa-ccm-v4', 'CEK-05', 'Cryptography and Key Management', 'Encryption Change Management',
 'Apply change management to encryption implementations and configurations.', 'P2', 1, 1, 1, 43),
('csa-ccm-v4', 'CEK-06', 'Cryptography and Key Management', 'Root of Trust',
 'Establish and maintain a root of trust for cryptographic operations.', 'P1', 0, 1, 1, 44),
('csa-ccm-v4', 'CEK-07', 'Cryptography and Key Management', 'Encryption Risk Management',
 'Assess and manage risks associated with cryptographic implementations.', 'P2', 1, 1, 1, 45),
('csa-ccm-v4', 'CEK-08', 'Cryptography and Key Management', 'CSC Key Management Capability',
 'Provide customers with the capability to manage their own encryption keys.', 'P2', 0, 1, 1, 46),
('csa-ccm-v4', 'CEK-09', 'Cryptography and Key Management', 'Encryption and Key Management Audit',
 'Audit encryption and key management practices and controls regularly.', 'P1', 1, 1, 1, 47),
('csa-ccm-v4', 'CEK-10', 'Cryptography and Key Management', 'Key Generation',
 'Generate cryptographic keys using approved methods with sufficient entropy.', 'P1', 1, 1, 1, 48),
('csa-ccm-v4', 'CEK-11', 'Cryptography and Key Management', 'Key Distribution',
 'Distribute cryptographic keys securely to authorized parties.', 'P1', 1, 1, 1, 49),
('csa-ccm-v4', 'CEK-12', 'Cryptography and Key Management', 'Key Usage',
 'Define and enforce authorized uses for each cryptographic key.', 'P1', 1, 1, 1, 50),
('csa-ccm-v4', 'CEK-13', 'Cryptography and Key Management', 'Key Storage',
 'Store cryptographic keys securely with appropriate access controls.', 'P1', 1, 1, 1, 51),
('csa-ccm-v4', 'CEK-14', 'Cryptography and Key Management', 'Key Rotation',
 'Rotate cryptographic keys according to defined cryptoperiods and policies.', 'P1', 1, 1, 1, 52),
('csa-ccm-v4', 'CEK-15', 'Cryptography and Key Management', 'Key Activation',
 'Define and enforce key activation, suspension, and deactivation procedures.', 'P2', 1, 1, 1, 53);

-- ============================================================================
-- DCS — Datacenter Security (12 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('csa-ccm-v4', 'DCS-01', 'Datacenter Security', 'Off-Site Equipment Disposal Policy',
 'Establish policies for secure disposal of off-site equipment and media.', 'P1', 1, 1, 1, 54),
('csa-ccm-v4', 'DCS-02', 'Datacenter Security', 'Asset Management',
 'Implement asset management for all datacenter equipment and infrastructure.', 'P1', 1, 1, 1, 55),
('csa-ccm-v4', 'DCS-03', 'Datacenter Security', 'Controlled Access Points',
 'Establish controlled access points for physical entry to datacenter facilities.', 'P1', 1, 1, 1, 56),
('csa-ccm-v4', 'DCS-04', 'Datacenter Security', 'Off-Site Authorization',
 'Authorize and track movement of equipment to and from datacenter facilities.', 'P2', 1, 1, 1, 57),
('csa-ccm-v4', 'DCS-05', 'Datacenter Security', 'Off-Site Asset Policy Enforcement',
 'Enforce security policies for assets located outside primary datacenter facilities.', 'P2', 1, 1, 1, 58),
('csa-ccm-v4', 'DCS-06', 'Datacenter Security', 'Secure Area Authorization',
 'Authorize and control access to secure areas within the datacenter.', 'P1', 1, 1, 1, 59),
('csa-ccm-v4', 'DCS-07', 'Datacenter Security', 'Physical Security Perimeter',
 'Define and enforce physical security perimeters for datacenter facilities.', 'P1', 1, 1, 1, 60),
('csa-ccm-v4', 'DCS-08', 'Datacenter Security', 'Physical Security Measures',
 'Implement physical security measures including surveillance and access logging.', 'P1', 1, 1, 1, 61),
('csa-ccm-v4', 'DCS-09', 'Datacenter Security', 'Equipment Location',
 'Locate equipment to minimize risks from environmental threats and unauthorized access.', 'P2', 1, 1, 1, 62),
('csa-ccm-v4', 'DCS-10', 'Datacenter Security', 'Equipment Power Failures',
 'Protect datacenter equipment against power failures with UPS and generators.', 'P1', 1, 1, 1, 63),
('csa-ccm-v4', 'DCS-11', 'Datacenter Security', 'Utilities Redundancy',
 'Implement utility redundancy for power, cooling, and network connectivity.', 'P1', 0, 1, 1, 64),
('csa-ccm-v4', 'DCS-12', 'Datacenter Security', 'Environmental Monitoring',
 'Monitor datacenter environmental conditions including temperature and humidity.', 'P1', 1, 1, 1, 65);

-- ============================================================================
-- DSP — Data Security & Privacy Lifecycle Management (28 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('csa-ccm-v4', 'DSP-01', 'Data Security and Privacy', 'Security and Privacy Policy',
 'Establish data security and privacy policies and procedures.', 'P1', 1, 1, 1, 66),
('csa-ccm-v4', 'DSP-02', 'Data Security and Privacy', 'Data Inventory',
 'Maintain an inventory of data assets with classification and ownership.', 'P1', 1, 1, 1, 67),
('csa-ccm-v4', 'DSP-03', 'Data Security and Privacy', 'Data Flow Documentation',
 'Document data flows across systems, networks, and organizational boundaries.', 'P1', 1, 1, 1, 68),
('csa-ccm-v4', 'DSP-04', 'Data Security and Privacy', 'Data Classification',
 'Classify data according to sensitivity and regulatory requirements.', 'P1', 1, 1, 1, 69),
('csa-ccm-v4', 'DSP-05', 'Data Security and Privacy', 'Data Ownership',
 'Define and assign data ownership responsibilities.', 'P1', 1, 1, 1, 70),
('csa-ccm-v4', 'DSP-06', 'Data Security and Privacy', 'Handling and Labeling',
 'Implement data handling and labeling procedures based on classification.', 'P1', 1, 1, 1, 71),
('csa-ccm-v4', 'DSP-07', 'Data Security and Privacy', 'Security and Privacy by Design',
 'Incorporate security and privacy by design and default in systems and processes.', 'P1', 1, 1, 1, 72),
('csa-ccm-v4', 'DSP-08', 'Data Security and Privacy', 'Secure Disposal',
 'Implement secure data disposal procedures when data is no longer needed.', 'P1', 1, 1, 1, 73),
('csa-ccm-v4', 'DSP-09', 'Data Security and Privacy', 'Information Leakage Prevention',
 'Implement controls to prevent unauthorized information leakage.', 'P1', 1, 1, 1, 74),
('csa-ccm-v4', 'DSP-10', 'Data Security and Privacy', 'Data Masking and Anonymization',
 'Implement data masking and anonymization for non-production environments.', 'P2', 0, 1, 1, 75),
('csa-ccm-v4', 'DSP-11', 'Data Security and Privacy', 'Data Tokenization',
 'Implement data tokenization where appropriate to protect sensitive data.', 'P2', 0, 1, 1, 76),
('csa-ccm-v4', 'DSP-12', 'Data Security and Privacy', 'Data Minimization',
 'Collect and retain only the minimum data necessary for stated purposes.', 'P1', 1, 1, 1, 77),
('csa-ccm-v4', 'DSP-13', 'Data Security and Privacy', 'Data Purpose Limitation',
 'Limit use of personal data to the purposes for which it was collected.', 'P1', 1, 1, 1, 78),
('csa-ccm-v4', 'DSP-14', 'Data Security and Privacy', 'Data Accuracy and Quality',
 'Maintain data accuracy and quality throughout its lifecycle.', 'P2', 1, 1, 1, 79),
('csa-ccm-v4', 'DSP-15', 'Data Security and Privacy', 'Data Location',
 'Document and control the geographic location of stored data.', 'P1', 1, 1, 1, 80),
('csa-ccm-v4', 'DSP-16', 'Data Security and Privacy', 'Data De-Identification',
 'Implement de-identification techniques for personal data when possible.', 'P2', 0, 1, 1, 81),
('csa-ccm-v4', 'DSP-17', 'Data Security and Privacy', 'Data Retention',
 'Define and enforce data retention policies based on legal and business requirements.', 'P1', 1, 1, 1, 82),
('csa-ccm-v4', 'DSP-18', 'Data Security and Privacy', 'PII Protection',
 'Implement specific protections for personally identifiable information.', 'P1', 1, 1, 1, 83),
('csa-ccm-v4', 'DSP-19', 'Data Security and Privacy', 'Consent Management',
 'Implement consent management mechanisms for data collection and processing.', 'P1', 1, 1, 1, 84),
('csa-ccm-v4', 'DSP-20', 'Data Security and Privacy', 'Data Subject Rights',
 'Support data subject rights including access, correction, and deletion.', 'P1', 1, 1, 1, 85),
('csa-ccm-v4', 'DSP-21', 'Data Security and Privacy', 'Data Protection Impact Assessment',
 'Conduct data protection impact assessments for high-risk processing activities.', 'P1', 0, 1, 1, 86),
('csa-ccm-v4', 'DSP-22', 'Data Security and Privacy', 'Privacy Audit',
 'Conduct privacy audits to verify compliance with privacy policies and regulations.', 'P2', 0, 1, 1, 87),
('csa-ccm-v4', 'DSP-23', 'Data Security and Privacy', 'International Data Transfers',
 'Manage international data transfers in compliance with applicable regulations.', 'P1', 1, 1, 1, 88),
('csa-ccm-v4', 'DSP-24', 'Data Security and Privacy', 'Data Processing Agreements',
 'Establish data processing agreements with processors and sub-processors.', 'P1', 1, 1, 1, 89),
('csa-ccm-v4', 'DSP-25', 'Data Security and Privacy', 'Breach Notification',
 'Implement breach notification procedures compliant with applicable regulations.', 'P1', 1, 1, 1, 90),
('csa-ccm-v4', 'DSP-26', 'Data Security and Privacy', 'Privacy Training',
 'Provide privacy awareness training to personnel handling personal data.', 'P1', 1, 1, 1, 91),
('csa-ccm-v4', 'DSP-27', 'Data Security and Privacy', 'Privacy Monitoring',
 'Monitor compliance with privacy policies and data protection requirements.', 'P2', 1, 1, 1, 92),
('csa-ccm-v4', 'DSP-28', 'Data Security and Privacy', 'Customer Data Handling',
 'Define and communicate customer data handling responsibilities.', 'P1', 1, 1, 1, 93);

-- ============================================================================
-- GRC — Governance, Risk and Compliance (8 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('csa-ccm-v4', 'GRC-01', 'Governance Risk and Compliance', 'Governance Program Policy',
 'Establish a governance program with policies, procedures, and standards.', 'P1', 1, 1, 1, 94),
('csa-ccm-v4', 'GRC-02', 'Governance Risk and Compliance', 'Risk Management Program',
 'Implement an enterprise risk management program.', 'P1', 1, 1, 1, 95),
('csa-ccm-v4', 'GRC-03', 'Governance Risk and Compliance', 'Organizational Policy Reviews',
 'Review organizational policies at planned intervals or after significant changes.', 'P1', 1, 1, 1, 96),
('csa-ccm-v4', 'GRC-04', 'Governance Risk and Compliance', 'Policy Exception Process',
 'Define and implement a policy exception process with appropriate approvals.', 'P2', 1, 1, 1, 97),
('csa-ccm-v4', 'GRC-05', 'Governance Risk and Compliance', 'Information Security Program',
 'Establish an information security program aligned with business objectives.', 'P1', 1, 1, 1, 98),
('csa-ccm-v4', 'GRC-06', 'Governance Risk and Compliance', 'Governance Responsibility Model',
 'Define the governance responsibility model including roles and accountability.', 'P1', 1, 1, 1, 99),
('csa-ccm-v4', 'GRC-07', 'Governance Risk and Compliance', 'Information System Regulatory Mapping',
 'Map information systems to applicable regulatory and compliance requirements.', 'P1', 1, 1, 1, 100),
('csa-ccm-v4', 'GRC-08', 'Governance Risk and Compliance', 'Special Interest Groups',
 'Participate in relevant special interest groups and security communities.', 'P3', 0, 1, 1, 101);

-- ============================================================================
-- HRS — Human Resources Security (13 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('csa-ccm-v4', 'HRS-01', 'Human Resources Security', 'Background Screening Policy',
 'Establish policies for background screening of personnel.', 'P1', 1, 1, 1, 102),
('csa-ccm-v4', 'HRS-02', 'Human Resources Security', 'Acceptable Use of Technology',
 'Define acceptable use policies for technology resources.', 'P1', 1, 1, 1, 103),
('csa-ccm-v4', 'HRS-03', 'Human Resources Security', 'Clean Desk Policy',
 'Implement clean desk and clear screen policies.', 'P2', 1, 1, 1, 104),
('csa-ccm-v4', 'HRS-04', 'Human Resources Security', 'Remote and Home Working',
 'Establish security policies for remote and home working arrangements.', 'P1', 1, 1, 1, 105),
('csa-ccm-v4', 'HRS-05', 'Human Resources Security', 'Asset Returns',
 'Ensure return of organizational assets upon employment termination.', 'P1', 1, 1, 1, 106),
('csa-ccm-v4', 'HRS-06', 'Human Resources Security', 'Employment Termination',
 'Implement employment termination procedures including access revocation.', 'P1', 1, 1, 1, 107),
('csa-ccm-v4', 'HRS-07', 'Human Resources Security', 'Employment Agreement Process',
 'Define employment agreement processes addressing security responsibilities.', 'P1', 1, 1, 1, 108),
('csa-ccm-v4', 'HRS-08', 'Human Resources Security', 'Employment Agreement Content',
 'Include security and confidentiality clauses in employment agreements.', 'P1', 1, 1, 1, 109),
('csa-ccm-v4', 'HRS-09', 'Human Resources Security', 'Personnel Roles and Responsibilities',
 'Define and communicate security roles and responsibilities for all personnel.', 'P1', 1, 1, 1, 110),
('csa-ccm-v4', 'HRS-10', 'Human Resources Security', 'Non-Disclosure Agreements',
 'Require non-disclosure agreements for personnel with access to sensitive data.', 'P1', 1, 1, 1, 111),
('csa-ccm-v4', 'HRS-11', 'Human Resources Security', 'Security Awareness Training',
 'Provide security awareness training to all personnel.', 'P1', 1, 1, 1, 112),
('csa-ccm-v4', 'HRS-12', 'Human Resources Security', 'Personal and Sensitive Data Training',
 'Provide training on handling personal and sensitive data.', 'P1', 1, 1, 1, 113),
('csa-ccm-v4', 'HRS-13', 'Human Resources Security', 'Compliance User Responsibility',
 'Ensure users understand and acknowledge their compliance responsibilities.', 'P1', 1, 1, 1, 114);

-- ============================================================================
-- IAM — Identity & Access Management (13 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('csa-ccm-v4', 'IAM-01', 'Identity and Access Management', 'Identity and Access Management Policy',
 'Establish identity and access management policies and procedures.', 'P1', 1, 1, 1, 115),
('csa-ccm-v4', 'IAM-02', 'Identity and Access Management', 'Credential Lifecycle Management',
 'Manage the lifecycle of credentials including creation, distribution, and revocation.', 'P1', 1, 1, 1, 116),
('csa-ccm-v4', 'IAM-03', 'Identity and Access Management', 'Least Privilege',
 'Implement least privilege access control for all users and services.', 'P1', 1, 1, 1, 117),
('csa-ccm-v4', 'IAM-04', 'Identity and Access Management', 'Privileged Access Management',
 'Implement controls for management and monitoring of privileged access.', 'P1', 1, 1, 1, 118),
('csa-ccm-v4', 'IAM-05', 'Identity and Access Management', 'Segregation of Duties',
 'Enforce segregation of duties to prevent conflicts of interest.', 'P1', 1, 1, 1, 119),
('csa-ccm-v4', 'IAM-06', 'Identity and Access Management', 'User Access Reviews',
 'Conduct periodic reviews of user access rights and permissions.', 'P1', 1, 1, 1, 120),
('csa-ccm-v4', 'IAM-07', 'Identity and Access Management', 'User Access Revocation',
 'Revoke user access promptly when no longer required.', 'P1', 1, 1, 1, 121),
('csa-ccm-v4', 'IAM-08', 'Identity and Access Management', 'Password Management',
 'Implement password management controls meeting security requirements.', 'P1', 1, 1, 1, 122),
('csa-ccm-v4', 'IAM-09', 'Identity and Access Management', 'Multi-Factor Authentication',
 'Implement multi-factor authentication for access to sensitive systems.', 'P1', 1, 1, 1, 123),
('csa-ccm-v4', 'IAM-10', 'Identity and Access Management', 'Authentication and Authorization',
 'Implement authentication and authorization controls for all system access.', 'P1', 1, 1, 1, 124),
('csa-ccm-v4', 'IAM-11', 'Identity and Access Management', 'Session Management',
 'Implement session management controls including timeout and termination.', 'P1', 1, 1, 1, 125),
('csa-ccm-v4', 'IAM-12', 'Identity and Access Management', 'Safeguard Logs Integrity',
 'Protect the integrity of identity and access management logs.', 'P1', 1, 1, 1, 126),
('csa-ccm-v4', 'IAM-13', 'Identity and Access Management', 'Privileged Operations Audit',
 'Audit logging of all privileged operations and access activities.', 'P1', 1, 1, 1, 127);

-- ============================================================================
-- IPY — Interoperability & Portability (5 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('csa-ccm-v4', 'IPY-01', 'Interoperability and Portability', 'Interoperability and Portability Policy',
 'Establish policies for interoperability and portability of cloud services.', 'P2', 1, 1, 1, 128),
('csa-ccm-v4', 'IPY-02', 'Interoperability and Portability', 'Application Interface Availability',
 'Provide application interfaces to support data portability and interoperability.', 'P2', 1, 1, 1, 129),
('csa-ccm-v4', 'IPY-03', 'Interoperability and Portability', 'Secure Interoperability Management',
 'Manage interoperability securely between cloud services and external systems.', 'P1', 1, 1, 1, 130),
('csa-ccm-v4', 'IPY-04', 'Interoperability and Portability', 'Standardized Network Protocols',
 'Use standardized network protocols for cloud service interoperability.', 'P2', 1, 1, 1, 131),
('csa-ccm-v4', 'IPY-05', 'Interoperability and Portability', 'Data Request',
 'Support customer data portability requests in a timely manner.', 'P1', 1, 1, 1, 132);

-- ============================================================================
-- IVS — Infrastructure & Virtualization Security (13 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('csa-ccm-v4', 'IVS-01', 'Infrastructure and Virtualization', 'Infrastructure Security Policy',
 'Establish infrastructure and virtualization security policies.', 'P1', 1, 1, 1, 133),
('csa-ccm-v4', 'IVS-02', 'Infrastructure and Virtualization', 'Capacity and Resource Planning',
 'Plan and manage infrastructure capacity and resources.', 'P2', 1, 1, 1, 134),
('csa-ccm-v4', 'IVS-03', 'Infrastructure and Virtualization', 'Network Security',
 'Implement network security controls including segmentation and filtering.', 'P1', 1, 1, 1, 135),
('csa-ccm-v4', 'IVS-04', 'Infrastructure and Virtualization', 'OS Hardening and Base Controls',
 'Harden operating systems and implement baseline security controls.', 'P1', 1, 1, 1, 136),
('csa-ccm-v4', 'IVS-05', 'Infrastructure and Virtualization', 'Production and Non-Production Environments',
 'Separate production from non-production environments.', 'P1', 1, 1, 1, 137),
('csa-ccm-v4', 'IVS-06', 'Infrastructure and Virtualization', 'Segmentation and Segregation',
 'Implement network segmentation and tenant segregation.', 'P1', 1, 1, 1, 138),
('csa-ccm-v4', 'IVS-07', 'Infrastructure and Virtualization', 'Migration to Cloud',
 'Manage security during migration to cloud environments.', 'P2', 1, 1, 1, 139),
('csa-ccm-v4', 'IVS-08', 'Infrastructure and Virtualization', 'Network Architecture Documentation',
 'Document network architecture and maintain current diagrams.', 'P1', 1, 1, 1, 140),
('csa-ccm-v4', 'IVS-09', 'Infrastructure and Virtualization', 'Network Defense',
 'Implement network defense controls including IDS/IPS and WAF.', 'P1', 1, 1, 1, 141),
('csa-ccm-v4', 'IVS-10', 'Infrastructure and Virtualization', 'Information System Documentation',
 'Maintain documentation for all information system components.', 'P2', 1, 1, 1, 142),
('csa-ccm-v4', 'IVS-11', 'Infrastructure and Virtualization', 'Guest OS Hardening',
 'Harden guest operating systems in virtualized environments.', 'P1', 0, 1, 1, 143),
('csa-ccm-v4', 'IVS-12', 'Infrastructure and Virtualization', 'Hypervisor Hardening',
 'Harden hypervisor platforms and management interfaces.', 'P1', 0, 1, 1, 144),
('csa-ccm-v4', 'IVS-13', 'Infrastructure and Virtualization', 'Virtual Machine Security',
 'Implement security controls for virtual machine lifecycle management.', 'P1', 0, 1, 1, 145);

-- ============================================================================
-- LOG — Logging and Monitoring (14 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('csa-ccm-v4', 'LOG-01', 'Logging and Monitoring', 'Logging and Monitoring Policy',
 'Establish logging and monitoring policies and procedures.', 'P1', 1, 1, 1, 146),
('csa-ccm-v4', 'LOG-02', 'Logging and Monitoring', 'Logging Configuration',
 'Configure logging for all critical systems and security events.', 'P1', 1, 1, 1, 147),
('csa-ccm-v4', 'LOG-03', 'Logging and Monitoring', 'Security Monitoring and Alerting',
 'Implement security monitoring and alerting for detected events.', 'P1', 1, 1, 1, 148),
('csa-ccm-v4', 'LOG-04', 'Logging and Monitoring', 'Audit Logs Access and Accountability',
 'Control access to audit logs and establish accountability for log management.', 'P1', 1, 1, 1, 149),
('csa-ccm-v4', 'LOG-05', 'Logging and Monitoring', 'Audit Logs Monitoring and Response',
 'Monitor audit logs and respond to identified security events.', 'P1', 1, 1, 1, 150),
('csa-ccm-v4', 'LOG-06', 'Logging and Monitoring', 'Audit Logs Backup and Retention',
 'Back up and retain audit logs according to policy and regulatory requirements.', 'P1', 1, 1, 1, 151),
('csa-ccm-v4', 'LOG-07', 'Logging and Monitoring', 'Time Synchronization',
 'Synchronize system clocks across all systems for accurate log correlation.', 'P1', 1, 1, 1, 152),
('csa-ccm-v4', 'LOG-08', 'Logging and Monitoring', 'Audit Tools Protection',
 'Protect audit tools and log management systems from unauthorized access.', 'P1', 1, 1, 1, 153),
('csa-ccm-v4', 'LOG-09', 'Logging and Monitoring', 'Privileged Operations Logging',
 'Log all privileged operations and administrative activities.', 'P1', 1, 1, 1, 154),
('csa-ccm-v4', 'LOG-10', 'Logging and Monitoring', 'Encryption Monitoring',
 'Monitor and report on encryption status and key management activities.', 'P2', 0, 1, 1, 155),
('csa-ccm-v4', 'LOG-11', 'Logging and Monitoring', 'Wireless Access Monitoring',
 'Monitor wireless access points and connections for unauthorized activity.', 'P2', 1, 1, 1, 156),
('csa-ccm-v4', 'LOG-12', 'Logging and Monitoring', 'Network Traffic Monitoring',
 'Monitor network traffic for anomalous patterns and security events.', 'P1', 1, 1, 1, 157),
('csa-ccm-v4', 'LOG-13', 'Logging and Monitoring', 'API Monitoring',
 'Monitor API usage and access patterns for security anomalies.', 'P1', 1, 1, 1, 158),
('csa-ccm-v4', 'LOG-14', 'Logging and Monitoring', 'Threat Intelligence',
 'Integrate threat intelligence into monitoring and detection capabilities.', 'P1', 0, 1, 1, 159);

-- ============================================================================
-- SEF — Security Incident Management (8 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('csa-ccm-v4', 'SEF-01', 'Security Incident Management', 'Incident Management Policy',
 'Establish security incident management policies and procedures.', 'P1', 1, 1, 1, 160),
('csa-ccm-v4', 'SEF-02', 'Security Incident Management', 'Service Management Policy',
 'Integrate security incident management with service management processes.', 'P2', 1, 1, 1, 161),
('csa-ccm-v4', 'SEF-03', 'Security Incident Management', 'Incident Response Plans',
 'Develop and maintain incident response plans with clear escalation procedures.', 'P1', 1, 1, 1, 162),
('csa-ccm-v4', 'SEF-04', 'Security Incident Management', 'Incident Response Testing',
 'Test incident response plans regularly through exercises and simulations.', 'P1', 1, 1, 1, 163),
('csa-ccm-v4', 'SEF-05', 'Security Incident Management', 'Incident Response Metrics',
 'Define and track incident response metrics and key performance indicators.', 'P2', 1, 1, 1, 164),
('csa-ccm-v4', 'SEF-06', 'Security Incident Management', 'Event Triage Processes',
 'Implement event triage processes to classify and prioritize security events.', 'P1', 1, 1, 1, 165),
('csa-ccm-v4', 'SEF-07', 'Security Incident Management', 'Security Breach Notification',
 'Implement security breach notification procedures for affected parties.', 'P1', 1, 1, 1, 166),
('csa-ccm-v4', 'SEF-08', 'Security Incident Management', 'Points of Contact',
 'Maintain current points of contact for incident response and notification.', 'P1', 1, 1, 1, 167);

-- ============================================================================
-- STA — Supply Chain Management (14 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('csa-ccm-v4', 'STA-01', 'Supply Chain Management', 'SSRM Policy',
 'Establish Shared Security Responsibility Model policies and procedures.', 'P1', 1, 1, 1, 168),
('csa-ccm-v4', 'STA-02', 'Supply Chain Management', 'SSRM Supply Chain',
 'Apply SSRM principles throughout the supply chain.', 'P1', 1, 1, 1, 169),
('csa-ccm-v4', 'STA-03', 'Supply Chain Management', 'SSRM Control Specification',
 'Specify security controls in the shared responsibility model.', 'P1', 1, 1, 1, 170),
('csa-ccm-v4', 'STA-04', 'Supply Chain Management', 'SSRM Control Ownership',
 'Define and document control ownership between CSP and customer.', 'P1', 1, 1, 1, 171),
('csa-ccm-v4', 'STA-05', 'Supply Chain Management', 'SSRM Control Attestation',
 'Provide attestation of control implementation in shared responsibility model.', 'P2', 1, 1, 1, 172),
('csa-ccm-v4', 'STA-06', 'Supply Chain Management', 'SSRM Control Implementation',
 'Implement controls as defined in the shared responsibility model.', 'P1', 1, 1, 1, 173),
('csa-ccm-v4', 'STA-07', 'Supply Chain Management', 'Supply Chain Inventory',
 'Maintain an inventory of supply chain participants and dependencies.', 'P1', 1, 1, 1, 174),
('csa-ccm-v4', 'STA-08', 'Supply Chain Management', 'Supply Chain Risk Management',
 'Implement supply chain risk management processes.', 'P1', 1, 1, 1, 175),
('csa-ccm-v4', 'STA-09', 'Supply Chain Management', 'Supply Chain Agreements',
 'Establish security requirements in supply chain agreements.', 'P1', 1, 1, 1, 176),
('csa-ccm-v4', 'STA-10', 'Supply Chain Management', 'Supply Chain Agreement Review',
 'Review supply chain agreements periodically for security adequacy.', 'P2', 1, 1, 1, 177),
('csa-ccm-v4', 'STA-11', 'Supply Chain Management', 'Supply Chain Metrics',
 'Define and track supply chain security metrics.', 'P3', 0, 1, 1, 178),
('csa-ccm-v4', 'STA-12', 'Supply Chain Management', 'Supply Chain Right to Audit',
 'Maintain right to audit supply chain participants for security compliance.', 'P2', 1, 1, 1, 179),
('csa-ccm-v4', 'STA-13', 'Supply Chain Management', 'Supply Chain Changes',
 'Manage supply chain changes through established change management processes.', 'P2', 1, 1, 1, 180),
('csa-ccm-v4', 'STA-14', 'Supply Chain Management', 'Supply Chain Data Security Assessment',
 'Assess data security practices of supply chain participants.', 'P1', 1, 1, 1, 181);

-- ============================================================================
-- TVM — Threat & Vulnerability Management (8 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('csa-ccm-v4', 'TVM-01', 'Threat and Vulnerability Management', 'Threat and Vulnerability Policy',
 'Establish threat and vulnerability management policies and procedures.', 'P1', 1, 1, 1, 182),
('csa-ccm-v4', 'TVM-02', 'Threat and Vulnerability Management', 'Vulnerability and Patch Management',
 'Implement vulnerability and patch management processes for all systems.', 'P1', 1, 1, 1, 183),
('csa-ccm-v4', 'TVM-03', 'Threat and Vulnerability Management', 'Vulnerability Remediation Schedule',
 'Define and enforce vulnerability remediation schedules based on severity.', 'P1', 1, 1, 1, 184),
('csa-ccm-v4', 'TVM-04', 'Threat and Vulnerability Management', 'Detection Updates',
 'Keep threat detection signatures and definitions current.', 'P1', 1, 1, 1, 185),
('csa-ccm-v4', 'TVM-05', 'Threat and Vulnerability Management', 'External Library Vulnerabilities',
 'Monitor and manage vulnerabilities in external libraries and dependencies.', 'P1', 1, 1, 1, 186),
('csa-ccm-v4', 'TVM-06', 'Threat and Vulnerability Management', 'Mobile Code',
 'Implement controls for mobile code execution and management.', 'P2', 1, 1, 1, 187),
('csa-ccm-v4', 'TVM-07', 'Threat and Vulnerability Management', 'Vulnerability Identification',
 'Implement automated vulnerability identification and scanning.', 'P1', 1, 1, 1, 188),
('csa-ccm-v4', 'TVM-08', 'Threat and Vulnerability Management', 'Vulnerability Prioritization',
 'Prioritize vulnerabilities based on risk and exploitability.', 'P1', 1, 1, 1, 189);

-- ============================================================================
-- UEM — Universal Endpoint Management (14 Controls)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('csa-ccm-v4', 'UEM-01', 'Universal Endpoint Management', 'Endpoint Devices Policy',
 'Establish policies for endpoint device management and security.', 'P1', 1, 1, 1, 190),
('csa-ccm-v4', 'UEM-02', 'Universal Endpoint Management', 'Endpoint Device Encryption',
 'Encrypt data on endpoint devices accessing organizational resources.', 'P1', 1, 1, 1, 191),
('csa-ccm-v4', 'UEM-03', 'Universal Endpoint Management', 'Mobile Device Management',
 'Implement mobile device management for devices accessing cloud services.', 'P1', 1, 1, 1, 192),
('csa-ccm-v4', 'UEM-04', 'Universal Endpoint Management', 'Endpoint Inventory',
 'Maintain an inventory of all endpoint devices accessing organizational resources.', 'P1', 1, 1, 1, 193),
('csa-ccm-v4', 'UEM-05', 'Universal Endpoint Management', 'Endpoint Management',
 'Implement endpoint management solutions for configuration and compliance.', 'P1', 1, 1, 1, 194),
('csa-ccm-v4', 'UEM-06', 'Universal Endpoint Management', 'Endpoint Detection and Response',
 'Deploy endpoint detection and response capabilities.', 'P1', 0, 1, 1, 195),
('csa-ccm-v4', 'UEM-07', 'Universal Endpoint Management', 'Automatic Updates',
 'Enable automatic security updates for endpoint devices.', 'P1', 1, 1, 1, 196),
('csa-ccm-v4', 'UEM-08', 'Universal Endpoint Management', 'Endpoint Protection',
 'Deploy endpoint protection solutions including anti-malware.', 'P1', 1, 1, 1, 197),
('csa-ccm-v4', 'UEM-09', 'Universal Endpoint Management', 'Endpoint Data Loss Prevention',
 'Implement data loss prevention controls on endpoints.', 'P2', 0, 1, 1, 198),
('csa-ccm-v4', 'UEM-10', 'Universal Endpoint Management', 'Software Firewall',
 'Enable and configure software firewalls on endpoint devices.', 'P1', 1, 1, 1, 199),
('csa-ccm-v4', 'UEM-11', 'Universal Endpoint Management', 'User-Installed Software',
 'Control and monitor user-installed software on endpoint devices.', 'P2', 1, 1, 1, 200),
('csa-ccm-v4', 'UEM-12', 'Universal Endpoint Management', 'Removable Media',
 'Control the use of removable media on endpoint devices.', 'P1', 1, 1, 1, 201),
('csa-ccm-v4', 'UEM-13', 'Universal Endpoint Management', 'Remote Wipe',
 'Implement remote wipe capabilities for lost or stolen endpoint devices.', 'P1', 1, 1, 1, 202),
('csa-ccm-v4', 'UEM-14', 'Universal Endpoint Management', 'Third-Party Endpoint Security',
 'Assess and manage security posture of third-party endpoint devices.', 'P2', 0, 1, 1, 203);

-- ============================================================================
-- CROSSWALK MAPPINGS — CSA CCM v4 to NIST 800-53 R5
-- ============================================================================

INSERT OR REPLACE INTO control_crosswalks (source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence, notes) VALUES
('csa-ccm-v4', 'A&A-02', 'nist-800-53-r5', 'CA-2', 'equivalent', 0.90, 'Independent assessments maps to NIST Control Assessments'),
('csa-ccm-v4', 'AIS-04', 'nist-800-53-r5', 'SA-11', 'equivalent', 0.90, 'Application security testing maps to NIST Developer Testing'),
('csa-ccm-v4', 'AIS-08', 'nist-800-53-r5', 'SA-15', 'equivalent', 0.85, 'Secure development maps to NIST Development Process'),
('csa-ccm-v4', 'BCR-04', 'nist-800-53-r5', 'CP-2', 'equivalent', 0.90, 'Business continuity planning maps to NIST Contingency Plan'),
('csa-ccm-v4', 'BCR-09', 'nist-800-53-r5', 'CP-9', 'equivalent', 0.90, 'Backup and recovery maps to NIST System Backup'),
('csa-ccm-v4', 'CCC-04', 'nist-800-53-r5', 'CM-3', 'equivalent', 0.85, 'Unauthorized change protection maps to NIST Configuration Change Control'),
('csa-ccm-v4', 'CCC-06', 'nist-800-53-r5', 'CM-2', 'equivalent', 0.85, 'Baseline management maps to NIST Baseline Configuration'),
('csa-ccm-v4', 'CEK-03', 'nist-800-53-r5', 'SC-28', 'equivalent', 0.90, 'Data encryption maps to NIST Protection of Information at Rest'),
('csa-ccm-v4', 'CEK-10', 'nist-800-53-r5', 'SC-12', 'equivalent', 0.90, 'Key generation maps to NIST Cryptographic Key Establishment'),
('csa-ccm-v4', 'DCS-07', 'nist-800-53-r5', 'PE-3', 'equivalent', 0.85, 'Physical security perimeter maps to NIST Physical Access Control'),
('csa-ccm-v4', 'DSP-04', 'nist-800-53-r5', 'RA-2', 'equivalent', 0.85, 'Data classification maps to NIST Security Categorization'),
('csa-ccm-v4', 'DSP-08', 'nist-800-53-r5', 'MP-6', 'equivalent', 0.85, 'Secure disposal maps to NIST Media Sanitization'),
('csa-ccm-v4', 'GRC-02', 'nist-800-53-r5', 'PM-9', 'equivalent', 0.85, 'Risk management program maps to NIST Risk Management Strategy'),
('csa-ccm-v4', 'GRC-05', 'nist-800-53-r5', 'PM-1', 'equivalent', 0.85, 'Information security program maps to NIST Program Plan'),
('csa-ccm-v4', 'HRS-01', 'nist-800-53-r5', 'PS-3', 'equivalent', 0.85, 'Background screening maps to NIST Personnel Screening'),
('csa-ccm-v4', 'HRS-11', 'nist-800-53-r5', 'AT-2', 'equivalent', 0.90, 'Security awareness training maps to NIST Literacy Training'),
('csa-ccm-v4', 'IAM-03', 'nist-800-53-r5', 'AC-6', 'equivalent', 0.90, 'Least privilege maps to NIST Least Privilege'),
('csa-ccm-v4', 'IAM-05', 'nist-800-53-r5', 'AC-5', 'equivalent', 0.90, 'Segregation of duties maps to NIST Separation of Duties'),
('csa-ccm-v4', 'IAM-09', 'nist-800-53-r5', 'IA-2', 'equivalent', 0.90, 'Multi-factor authentication maps to NIST Identification and Authentication'),
('csa-ccm-v4', 'IVS-03', 'nist-800-53-r5', 'SC-7', 'equivalent', 0.85, 'Network security maps to NIST Boundary Protection'),
('csa-ccm-v4', 'IVS-04', 'nist-800-53-r5', 'CM-6', 'equivalent', 0.85, 'OS hardening maps to NIST Configuration Settings'),
('csa-ccm-v4', 'LOG-03', 'nist-800-53-r5', 'SI-4', 'equivalent', 0.85, 'Security monitoring maps to NIST System Monitoring'),
('csa-ccm-v4', 'LOG-05', 'nist-800-53-r5', 'AU-6', 'equivalent', 0.85, 'Audit log monitoring maps to NIST Audit Review'),
('csa-ccm-v4', 'SEF-03', 'nist-800-53-r5', 'IR-8', 'equivalent', 0.90, 'Incident response plans maps to NIST Incident Response Plan'),
('csa-ccm-v4', 'SEF-04', 'nist-800-53-r5', 'IR-3', 'equivalent', 0.85, 'Incident response testing maps to NIST IR Testing'),
('csa-ccm-v4', 'STA-08', 'nist-800-53-r5', 'SR-2', 'equivalent', 0.85, 'Supply chain risk management maps to NIST SCRM Plan'),
('csa-ccm-v4', 'TVM-02', 'nist-800-53-r5', 'SI-2', 'equivalent', 0.90, 'Vulnerability and patch management maps to NIST Flaw Remediation'),
('csa-ccm-v4', 'TVM-07', 'nist-800-53-r5', 'RA-5', 'equivalent', 0.90, 'Vulnerability identification maps to NIST Vulnerability Scanning'),
('csa-ccm-v4', 'UEM-02', 'nist-800-53-r5', 'SC-28', 'partial', 0.80, 'Endpoint encryption maps to NIST Protection of Information at Rest'),
('csa-ccm-v4', 'UEM-08', 'nist-800-53-r5', 'SI-3', 'equivalent', 0.85, 'Endpoint protection maps to NIST Malicious Code Protection');

-- ============================================================================
-- TRACK MIGRATION
-- ============================================================================
INSERT OR IGNORE INTO schema_migrations (version, name, description) VALUES
  ('migrate-029-csa-ccm-framework', 'csa-ccm-framework', 'CSA Cloud Controls Matrix v4 with 197 controls across 17 domains and crosswalks to NIST 800-53 R5');
