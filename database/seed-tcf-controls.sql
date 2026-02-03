-- ============================================================================
-- FORGECOMPLY 360 - TEXAS CYBERSECURITY FRAMEWORK (TCF) CONTROLS
-- 42 Security Control Objectives across 5 Functional Areas
-- Version 2.0 — Aligned with NIST CSF
-- Source: Texas DIR - Texas Cybersecurity Framework Controls and Definitions
-- ============================================================================

-- ============================================================================
-- IDENTIFY — 11 Control Objectives (TCF-ID-01 through TCF-ID-11)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('tx-csf', 'TCF-ID-01', 'Identify', 'Privacy and Confidentiality', 'Ensure appropriate security of retained information and approved sharing under defined conditions with required safeguards and assurance. Addresses HIPAA, Texas Business and Commerce Code, and agency-defined privacy policies for establishing contractual and legal agreements for data exchange and protection.', 'P1', 1, 1, 1, 1),
('tx-csf', 'TCF-ID-02', 'Identify', 'Data Classification', 'Establish a framework for managing data assets and information resources based on utility, intrinsic financial value, and impact of loss. Classify data as Restricted, Confidential, Agency-Internal, or Public with appropriate protections per state and federal law, proprietary, ethical, operational, and privacy considerations.', 'P1', 1, 1, 1, 2),
('tx-csf', 'TCF-ID-03', 'Identify', 'Critical Information Asset Inventory', 'Identify and prioritize all organizational information assets according to criticality to the business so that protections can be applied commensurate with each asset importance.', 'P1', 1, 1, 1, 3),
('tx-csf', 'TCF-ID-04', 'Identify', 'Enterprise Security Policy, Standards and Guidelines', 'Maintain the security policy framework, standards, and guidelines including acceptable use policy for agency information resources. Define enterprise standards, secure configuration standards, and an exception management process for evaluating risks associated with non-compliant conditions.', 'P1', 1, 1, 1, 4),
('tx-csf', 'TCF-ID-05', 'Identify', 'Control Oversight and Safeguard Assurance', 'Catalog required security activities and evaluate implemented control activities for maturity, scope, effectiveness, and deficiency. Ensure controls are auditable and verifiable, identify gaps, and oversee implementation for ongoing audit readiness.', 'P1', 1, 1, 1, 5),
('tx-csf', 'TCF-ID-06', 'Identify', 'Information Security Risk Management', 'Assess and evaluate risk within information resources and technology to ensure business operations deliver programs and services efficiently within acceptable tolerances for potential negative outcomes.', 'P1', 1, 1, 1, 6),
('tx-csf', 'TCF-ID-07', 'Identify', 'Security Oversight and Governance', 'Exercise board and executive management responsibilities for providing strategic direction, ensuring objectives are achieved, managing risks appropriately, and verifying enterprise resources are used responsibly.', 'P1', 1, 1, 1, 7),
('tx-csf', 'TCF-ID-08', 'Identify', 'Security Compliance and Regulatory Requirements Management', 'Monitor the legislative and industry landscape to keep security policy current. Facilitate validation audits, assessments, and reporting for compliance with applicable laws, regulations, and requirements including HIPAA Privacy, IRS Safeguard Reviews, and third-party security inquiries.', 'P1', 1, 1, 1, 8),
('tx-csf', 'TCF-ID-09', 'Identify', 'Cloud Usage and Security', 'Assess and evaluate risk associated with cloud technologies including SaaS, PaaS, and IaaS to ensure business operations deliver programs and services within acceptable risk tolerances.', 'P1', 1, 1, 1, 9),
('tx-csf', 'TCF-ID-10', 'Identify', 'Security Assessment and Authorization', 'Evaluate systems and applications for design and architecture in conjunction with existing controls to ensure current and anticipated threats are mitigated within acceptable risk tolerances. Includes periodic analysis and analysis when significant change occurs or new technology is introduced.', 'P1', 1, 1, 1, 10),
('tx-csf', 'TCF-ID-11', 'Identify', 'External Vendors and Third Party Providers', 'Evaluate third-party providers and external vendors to ensure security requirements are met for information transmitted, processed, stored, or managed by external entities. Includes contract review and development of service level agreements.', 'P1', 1, 1, 1, 11);

-- ============================================================================
-- PROTECT — 24 Control Objectives (TCF-PR-01 through TCF-PR-24)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('tx-csf', 'TCF-PR-01', 'Protect', 'Enterprise Architecture, Roadmap and Emerging Technology', 'Maintain an enterprise information security architecture aligned with federal, state, local, and agency data security and privacy requirements. Integrate security requirements early in the system development life cycle and evaluate emerging technology for continuous improvement.', 'P1', 1, 1, 1, 12),
('tx-csf', 'TCF-PR-02', 'Protect', 'Secure System Services, Acquisition and Development', 'Ensure development and implementation of new systems meets requirements necessary to assure the security of information and resources throughout the acquisition and development lifecycle.', 'P1', 1, 1, 1, 13),
('tx-csf', 'TCF-PR-03', 'Protect', 'Security Awareness and Training', 'Define, prepare, deliver, and facilitate an ongoing security awareness campaign utilizing diverse mediums to educate the organization on security information, threats, and technology risks.', 'P1', 1, 1, 1, 14),
('tx-csf', 'TCF-PR-04', 'Protect', 'Privacy Awareness and Training', 'Define, prepare, deliver, and facilitate an ongoing privacy awareness campaign utilizing diverse mediums to educate the organization on privacy requirements, risks, and protections.', 'P1', 1, 1, 1, 15),
('tx-csf', 'TCF-PR-05', 'Protect', 'Cryptography', 'Establish rules and administrative guidelines governing the use of cryptography and key management to ensure data is not disclosed or made inaccessible due to inability to decrypt.', 'P1', 1, 1, 1, 16),
('tx-csf', 'TCF-PR-06', 'Protect', 'Secure Configuration Management', 'Ensure baseline configurations and inventories of information systems including hardware, software, firmware, and documentation are established and maintained. Enforce security configuration settings and ensure systems operate under agreed-upon configurations per organizational risk management.', 'P1', 1, 1, 1, 17),
('tx-csf', 'TCF-PR-07', 'Protect', 'Change Management', 'Establish rules and administrative guidelines to manage changes in a rational and predictable manner with necessary documentation to reduce negative impact to users of information resource systems.', 'P1', 1, 1, 1, 18),
('tx-csf', 'TCF-PR-08', 'Protect', 'Contingency Planning', 'Establish, maintain, and implement plans for emergency response, backup operations, and post-incident recovery for information systems to ensure availability of critical resources and continuity of operations in emergency situations.', 'P1', 1, 1, 1, 19),
('tx-csf', 'TCF-PR-09', 'Protect', 'Media Protection', 'Protect digital and non-digital information system media, limit access to authorized users, and ensure media is sanitized or destroyed before disposal or release for reuse. Applies to all storage devices including portable computing and communications devices.', 'P1', 1, 1, 1, 20),
('tx-csf', 'TCF-PR-10', 'Protect', 'Physical and Environmental Protection', 'Limit physical access to information systems and equipment to authorized individuals. Protect physical locations and support infrastructure, provide supporting utilities, and protect against environmental hazards.', 'P1', 1, 1, 1, 21),
('tx-csf', 'TCF-PR-11', 'Protect', 'Personnel Security', 'Ensure individuals responsible for agency information are identified with clearly defined responsibilities. Verify trustworthiness of personnel, protect information resources during personnel actions such as terminations and transfers, and apply formal sanctions for non-compliance.', 'P1', 1, 1, 1, 22),
('tx-csf', 'TCF-PR-12', 'Protect', 'Third-Party Personnel Security', 'Require all third-party providers to comply with security policies and standards. Establish personnel security requirements with roles, responsibilities, and access limits per least privilege and data minimization. Monitor providers for compliance.', 'P1', 1, 1, 1, 23),
('tx-csf', 'TCF-PR-13', 'Protect', 'System Configuration Hardening and Patch Management', 'Ensure systems are installed and maintained to prevent unauthorized access and service disruptions by configuring with appropriate parameters. Includes removal of default accounts, disablement of unnecessary protocols and services, and ongoing patch distribution and installation.', 'P1', 1, 1, 1, 24),
('tx-csf', 'TCF-PR-14', 'Protect', 'Access Control', 'Ensure access to applications, servers, databases, and network devices is limited to authorized personnel, processes acting on behalf of authorized users, or authorized devices. Implement session limits, lockout features, account expirations, and disable unused accounts.', 'P1', 1, 1, 1, 25),
('tx-csf', 'TCF-PR-15', 'Protect', 'Account Management', 'Establish standards for creation, monitoring, control, and removal of accounts. Implement request processes with authorization, data owner approval, and user acknowledgement. Conduct periodic access reviews and ensure prompt removal during role changes or termination.', 'P1', 1, 1, 1, 26),
('tx-csf', 'TCF-PR-16', 'Protect', 'Security Systems Management', 'Design, implement, configure, administer, maintain, monitor, and support security systems used to enforce security policy including firewalls, IPS, proxy servers, SIEM systems, and other control enforcement or monitoring systems.', 'P1', 1, 1, 1, 27),
('tx-csf', 'TCF-PR-17', 'Protect', 'Network Access and Perimeter Controls', 'Install network equipment to prevent unauthorized access while limiting services to authorized users. Establish a network perimeter to delineate internal systems and prevent unauthorized external access or connection without approved remote access methods.', 'P1', 1, 1, 1, 28),
('tx-csf', 'TCF-PR-18', 'Protect', 'Internet Content Filtering', 'Enforce controls to block access to Internet websites based on content categories, application types, time of day, or destination reputation. Address bandwidth preservation, inappropriate content filtering, and malware/cyber-threat prevention through Internet content.', 'P1', 1, 1, 1, 29),
('tx-csf', 'TCF-PR-19', 'Protect', 'Data Loss Prevention', 'Detect and prevent potential data breach incidents where sensitive data may be disclosed to unauthorized personnel by malicious intent or inadvertent mistake. Perform detection while data is in use at the endpoint, in motion during transmission, and at rest on storage devices.', 'P1', 1, 1, 1, 30),
('tx-csf', 'TCF-PR-20', 'Protect', 'Identification and Authentication', 'Verify the claimed identity of users, processes, or devices as a prerequisite to permitting access. Establish password standards for creation, length, complexity, distribution, retention, periodic change, and suspension or expiration of authenticators.', 'P1', 1, 1, 1, 31),
('tx-csf', 'TCF-PR-21', 'Protect', 'Spam Filtering', 'Examine digital messaging for content and filter as required to limit the effects of spam and junk messaging that can slow infrastructure and serve as a transmission vehicle for malicious code.', 'P1', 1, 1, 1, 32),
('tx-csf', 'TCF-PR-22', 'Protect', 'Portable and Remote Computing', 'Address security considerations for mobile computing devices including tablets, smartphones, and handhelds. Apply traditional controls with additional considerations for portable devices and specific configuration and enforcement of controls.', 'P1', 1, 1, 1, 33),
('tx-csf', 'TCF-PR-23', 'Protect', 'System Communications Protection', 'Control, monitor, manage, and protect communications and transmissions between information systems. Includes network architecture, data transmission inventory, and requirements for link encryption, secure protocols, integrity validation, and multi-level access restrictions.', 'P1', 1, 1, 1, 34),
('tx-csf', 'TCF-PR-24', 'Protect', 'Information Systems Currency', 'Ensure necessary knowledge, skills, hardware, software, and supporting infrastructure are available at reasonable cost. Monitor and plan future system developments to leverage modern technology and reduce technical debt.', 'P1', 1, 1, 1, 35);

-- ============================================================================
-- DETECT — 4 Control Objectives (TCF-DE-01 through TCF-DE-04)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('tx-csf', 'TCF-DE-01', 'Detect', 'Vulnerability Assessment', 'Assess and monitor vulnerability detection and remediation including patch management, configuration management, and system, database, and application security vulnerabilities. Test and evaluate security controls and perform periodic penetration testing with risk-based prioritization.', 'P1', 1, 1, 1, 36),
('tx-csf', 'TCF-DE-02', 'Detect', 'Malware Protection', 'Prevent, detect, and clean up malicious code including viruses, worms, Trojans, spyware, and similar variants. Implement protection at host, network, and gateway perimeter layers with periodic updates to address evolving threats.', 'P1', 1, 1, 1, 37),
('tx-csf', 'TCF-DE-03', 'Detect', 'Security Monitoring and Event Analysis', 'Analyze security events and alerts from security enforcement devices and log collection facilities across the enterprise. Includes alert configuration, event correlation, periodic reporting, and analysis of events from content filtering, spam prevention, and email encryption systems.', 'P1', 1, 1, 1, 38),
('tx-csf', 'TCF-DE-04', 'Detect', 'Audit Logging and Accountability', 'Establish processes, policies, and procedures to create accurate and verifiable records of system-relevant actions, whether manual or automated, for investigatory and accountability purposes.', 'P1', 1, 1, 1, 39);

-- ============================================================================
-- RESPOND — 2 Control Objectives (TCF-RS-01 through TCF-RS-02)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('tx-csf', 'TCF-RS-01', 'Respond', 'Cyber-Security Incident Response', 'Establish an operational incident handling capability including preparation, detection, analysis, containment, recovery, and response activities. Track, document, and report incidents to appropriate officials and authorities.', 'P1', 1, 1, 1, 40),
('tx-csf', 'TCF-RS-02', 'Respond', 'Privacy Incident Response', 'Manage events, issues, inquiries, and incidents from investigation through resolution. Notify and escalate to appropriate personnel and coordinate activities for timely isolation, containment, impact analysis, and remediation of privacy breaches, loss, theft, and unauthorized access.', 'P1', 1, 1, 1, 41);

-- ============================================================================
-- RECOVER — 1 Control Objective (TCF-RC-01)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('tx-csf', 'TCF-RC-01', 'Recover', 'Disaster Recovery Procedures', 'Manage recovery of data and applications in the event of loss or damage from natural disasters, system failures, intentional or unintentional human acts, data entry errors, or operator errors.', 'P1', 1, 1, 1, 42);

-- ============================================================================
-- CONTROL CROSSWALKS — TCF to NIST CSF 2.0 Mappings
-- The TCF functional areas directly align with NIST CSF functions.
-- These crosswalks enable organizations to demonstrate dual compliance.
-- ============================================================================

-- IDENTIFY crosswalks (TCF → NIST CSF 2.0)
INSERT OR REPLACE INTO control_crosswalks (source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence, notes) VALUES
('tx-csf', 'TCF-ID-01', 'nist-800-53-r5', 'PT-1', 'partial', 0.80, 'TCF Privacy and Confidentiality maps to NIST privacy policy and procedures'),
('tx-csf', 'TCF-ID-02', 'nist-800-53-r5', 'RA-2', 'equivalent', 0.85, 'TCF Data Classification maps to NIST Security Categorization'),
('tx-csf', 'TCF-ID-03', 'nist-800-53-r5', 'CM-8', 'equivalent', 0.90, 'TCF Critical Asset Inventory maps to NIST Information System Component Inventory'),
('tx-csf', 'TCF-ID-04', 'nist-800-53-r5', 'PL-1', 'equivalent', 0.85, 'TCF Enterprise Security Policy maps to NIST Security Planning Policy and Procedures'),
('tx-csf', 'TCF-ID-05', 'nist-800-53-r5', 'CA-2', 'equivalent', 0.85, 'TCF Control Oversight maps to NIST Security Assessments'),
('tx-csf', 'TCF-ID-06', 'nist-800-53-r5', 'RA-3', 'equivalent', 0.90, 'TCF Risk Management maps to NIST Risk Assessment'),
('tx-csf', 'TCF-ID-07', 'nist-800-53-r5', 'PM-1', 'equivalent', 0.85, 'TCF Security Governance maps to NIST Information Security Program Plan'),
('tx-csf', 'TCF-ID-08', 'nist-800-53-r5', 'CA-7', 'partial', 0.75, 'TCF Compliance Management maps to NIST Continuous Monitoring'),
('tx-csf', 'TCF-ID-09', 'nist-800-53-r5', 'SA-9', 'partial', 0.80, 'TCF Cloud Usage maps to NIST External Information System Services'),
('tx-csf', 'TCF-ID-10', 'nist-800-53-r5', 'CA-6', 'equivalent', 0.85, 'TCF Security Assessment and Authorization maps to NIST Security Authorization'),
('tx-csf', 'TCF-ID-11', 'nist-800-53-r5', 'SR-1', 'partial', 0.80, 'TCF External Vendors maps to NIST Supply Chain Risk Management Policy'),

-- PROTECT crosswalks (TCF → NIST 800-53 R5)
('tx-csf', 'TCF-PR-01', 'nist-800-53-r5', 'SA-8', 'partial', 0.80, 'TCF Enterprise Architecture maps to NIST Security and Privacy Engineering Principles'),
('tx-csf', 'TCF-PR-02', 'nist-800-53-r5', 'SA-3', 'equivalent', 0.85, 'TCF Secure System Services maps to NIST System Development Life Cycle'),
('tx-csf', 'TCF-PR-03', 'nist-800-53-r5', 'AT-2', 'equivalent', 0.90, 'TCF Security Awareness maps to NIST Security Awareness Training'),
('tx-csf', 'TCF-PR-04', 'nist-800-53-r5', 'AT-1', 'partial', 0.80, 'TCF Privacy Awareness maps to NIST Security Awareness and Training Policy'),
('tx-csf', 'TCF-PR-05', 'nist-800-53-r5', 'SC-12', 'equivalent', 0.85, 'TCF Cryptography maps to NIST Cryptographic Key Establishment and Management'),
('tx-csf', 'TCF-PR-06', 'nist-800-53-r5', 'CM-2', 'equivalent', 0.90, 'TCF Secure Configuration Management maps to NIST Baseline Configuration'),
('tx-csf', 'TCF-PR-07', 'nist-800-53-r5', 'CM-3', 'equivalent', 0.90, 'TCF Change Management maps to NIST Configuration Change Control'),
('tx-csf', 'TCF-PR-08', 'nist-800-53-r5', 'CP-2', 'equivalent', 0.90, 'TCF Contingency Planning maps to NIST Contingency Plan'),
('tx-csf', 'TCF-PR-09', 'nist-800-53-r5', 'MP-1', 'equivalent', 0.90, 'TCF Media Protection maps to NIST Media Protection Policy and Procedures'),
('tx-csf', 'TCF-PR-10', 'nist-800-53-r5', 'PE-1', 'equivalent', 0.90, 'TCF Physical and Environmental maps to NIST Physical and Environmental Protection'),
('tx-csf', 'TCF-PR-11', 'nist-800-53-r5', 'PS-1', 'equivalent', 0.90, 'TCF Personnel Security maps to NIST Personnel Security Policy and Procedures'),
('tx-csf', 'TCF-PR-12', 'nist-800-53-r5', 'PS-7', 'equivalent', 0.85, 'TCF Third-Party Personnel maps to NIST External Personnel Security'),
('tx-csf', 'TCF-PR-13', 'nist-800-53-r5', 'SI-2', 'equivalent', 0.85, 'TCF System Hardening and Patch Mgmt maps to NIST Flaw Remediation'),
('tx-csf', 'TCF-PR-14', 'nist-800-53-r5', 'AC-1', 'equivalent', 0.90, 'TCF Access Control maps to NIST Access Control Policy and Procedures'),
('tx-csf', 'TCF-PR-15', 'nist-800-53-r5', 'AC-2', 'equivalent', 0.90, 'TCF Account Management maps to NIST Account Management'),
('tx-csf', 'TCF-PR-16', 'nist-800-53-r5', 'SI-4', 'partial', 0.80, 'TCF Security Systems Management maps to NIST Information System Monitoring'),
('tx-csf', 'TCF-PR-17', 'nist-800-53-r5', 'SC-7', 'equivalent', 0.85, 'TCF Network Access and Perimeter maps to NIST Boundary Protection'),
('tx-csf', 'TCF-PR-18', 'nist-800-53-r5', 'SC-18', 'partial', 0.75, 'TCF Internet Content Filtering maps to NIST Mobile Code restrictions'),
('tx-csf', 'TCF-PR-19', 'nist-800-53-r5', 'SC-28', 'partial', 0.80, 'TCF Data Loss Prevention maps to NIST Protection of Information at Rest'),
('tx-csf', 'TCF-PR-20', 'nist-800-53-r5', 'IA-1', 'equivalent', 0.90, 'TCF Identification and Authentication maps to NIST I&A Policy and Procedures'),
('tx-csf', 'TCF-PR-21', 'nist-800-53-r5', 'SI-8', 'equivalent', 0.85, 'TCF Spam Filtering maps to NIST Spam Protection'),
('tx-csf', 'TCF-PR-22', 'nist-800-53-r5', 'AC-19', 'equivalent', 0.85, 'TCF Portable and Remote Computing maps to NIST Access Control for Mobile Devices'),
('tx-csf', 'TCF-PR-23', 'nist-800-53-r5', 'SC-8', 'equivalent', 0.85, 'TCF System Communications Protection maps to NIST Transmission Confidentiality and Integrity'),
('tx-csf', 'TCF-PR-24', 'nist-800-53-r5', 'SA-22', 'partial', 0.75, 'TCF Information Systems Currency maps to NIST Unsupported System Components'),

-- DETECT crosswalks (TCF → NIST 800-53 R5)
('tx-csf', 'TCF-DE-01', 'nist-800-53-r5', 'RA-5', 'equivalent', 0.90, 'TCF Vulnerability Assessment maps to NIST Vulnerability Monitoring and Scanning'),
('tx-csf', 'TCF-DE-02', 'nist-800-53-r5', 'SI-3', 'equivalent', 0.90, 'TCF Malware Protection maps to NIST Malicious Code Protection'),
('tx-csf', 'TCF-DE-03', 'nist-800-53-r5', 'SI-4', 'equivalent', 0.85, 'TCF Security Monitoring maps to NIST Information System Monitoring'),
('tx-csf', 'TCF-DE-04', 'nist-800-53-r5', 'AU-1', 'equivalent', 0.90, 'TCF Audit Logging maps to NIST Audit and Accountability Policy and Procedures'),

-- RESPOND crosswalks (TCF → NIST 800-53 R5)
('tx-csf', 'TCF-RS-01', 'nist-800-53-r5', 'IR-1', 'equivalent', 0.90, 'TCF Cyber-Security Incident Response maps to NIST Incident Response Policy and Procedures'),
('tx-csf', 'TCF-RS-02', 'nist-800-53-r5', 'IR-6', 'partial', 0.80, 'TCF Privacy Incident Response maps to NIST Incident Reporting'),

-- RECOVER crosswalk (TCF → NIST 800-53 R5)
('tx-csf', 'TCF-RC-01', 'nist-800-53-r5', 'CP-10', 'equivalent', 0.90, 'TCF Disaster Recovery maps to NIST Information System Recovery and Reconstitution');
