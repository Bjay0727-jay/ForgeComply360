-- ============================================================================
-- FORGECOMPLY 360 - EXPANDED CONTROLS SEED DATA
-- 700+ controls across 8 major compliance frameworks
-- ============================================================================

-- ============================================================================
-- NIST 800-53 Rev 5 - AWARENESS AND TRAINING (AT) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-800-53-r5', 'AT-1', 'Awareness and Training', 'Policy and Procedures', 'Develop, document, and disseminate an awareness and training policy and procedures that address purpose, scope, roles, responsibilities, management commitment, coordination, and compliance.', 'P1', 1, 1, 1, 1),
('nist-800-53-r5', 'AT-2', 'Awareness and Training', 'Literacy Training and Awareness', 'Provide security and privacy literacy training to system users including awareness of security risks and applicable policies, standards, and procedures.', 'P1', 1, 1, 1, 2),
('nist-800-53-r5', 'AT-3', 'Awareness and Training', 'Role-Based Training', 'Provide role-based security and privacy training to personnel with assigned security roles and responsibilities before authorizing access and at required frequency thereafter.', 'P1', 0, 1, 1, 3),
('nist-800-53-r5', 'AT-4', 'Awareness and Training', 'Training Records', 'Document and monitor information security and privacy training activities including basic security awareness training and specific role-based training.', 'P2', 0, 1, 1, 4);

-- ============================================================================
-- NIST 800-53 Rev 5 - AUDIT AND ACCOUNTABILITY (AU) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-800-53-r5', 'AU-1', 'Audit and Accountability', 'Policy and Procedures', 'Develop, document, and disseminate an audit and accountability policy and procedures that address purpose, scope, roles, responsibilities, management commitment, coordination, and compliance.', 'P1', 1, 1, 1, 1),
('nist-800-53-r5', 'AU-2', 'Audit and Accountability', 'Event Logging', 'Identify the types of events that the system is capable of logging in support of the audit function and coordinate the event logging function with other entities requiring audit-related information.', 'P1', 1, 1, 1, 2),
('nist-800-53-r5', 'AU-3', 'Audit and Accountability', 'Content of Audit Records', 'Ensure that audit records contain information that establishes what type of event occurred, when it occurred, where it occurred, the source, the outcome, and the identity of individuals or subjects associated with the event.', 'P1', 1, 1, 1, 3),
('nist-800-53-r5', 'AU-4', 'Audit and Accountability', 'Audit Log Storage Capacity', 'Allocate audit log storage capacity and configure auditing to reduce the likelihood of such capacity being exceeded.', 'P1', 1, 1, 1, 4),
('nist-800-53-r5', 'AU-5', 'Audit and Accountability', 'Response to Audit Logging Process Failures', 'Alert designated personnel or roles in the event of an audit logging process failure and take defined additional actions.', 'P1', 1, 1, 1, 5),
('nist-800-53-r5', 'AU-6', 'Audit and Accountability', 'Audit Record Review, Analysis, and Reporting', 'Review and analyze system audit records for indications of inappropriate or unusual activity and report findings to designated personnel or roles.', 'P1', 1, 1, 1, 6),
('nist-800-53-r5', 'AU-7', 'Audit and Accountability', 'Audit Record Reduction and Report Generation', 'Provide and implement an audit record reduction and report generation capability that supports on-demand audit review, analysis, and reporting requirements.', 'P2', 0, 1, 1, 7),
('nist-800-53-r5', 'AU-8', 'Audit and Accountability', 'Time Stamps', 'Use internal system clocks to generate time stamps for audit records and record time stamps that map to Coordinated Universal Time or Greenwich Mean Time.', 'P1', 1, 1, 1, 8),
('nist-800-53-r5', 'AU-9', 'Audit and Accountability', 'Protection of Audit Information', 'Protect audit information and audit logging tools from unauthorized access, modification, and deletion.', 'P1', 1, 1, 1, 9),
('nist-800-53-r5', 'AU-11', 'Audit and Accountability', 'Audit Record Retention', 'Retain audit records for a defined time period to provide support for after-the-fact investigations of incidents and to meet regulatory and organizational information retention requirements.', 'P2', 1, 1, 1, 11),
('nist-800-53-r5', 'AU-12', 'Audit and Accountability', 'Audit Record Generation', 'Provide audit record generation capability for the event types the system is capable of auditing on all information system and network components.', 'P1', 1, 1, 1, 12);

-- ============================================================================
-- NIST 800-53 Rev 5 - ASSESSMENT, AUTHORIZATION, AND MONITORING (CA) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-800-53-r5', 'CA-1', 'Assessment, Authorization, and Monitoring', 'Policy and Procedures', 'Develop, document, and disseminate an assessment, authorization, and monitoring policy and procedures that address purpose, scope, roles, responsibilities, management commitment, coordination, and compliance.', 'P1', 1, 1, 1, 1),
('nist-800-53-r5', 'CA-2', 'Assessment, Authorization, and Monitoring', 'Control Assessments', 'Develop a control assessment plan and assess the controls in the system and its environment of operation to determine the extent to which the controls are implemented correctly, operating as intended, and producing the desired outcome.', 'P1', 1, 1, 1, 2),
('nist-800-53-r5', 'CA-3', 'Assessment, Authorization, and Monitoring', 'Information Exchange', 'Approve and manage the exchange of information between the system and other systems using interconnection security agreements, information exchange security agreements, or other formal exchange agreements.', 'P1', 1, 1, 1, 3),
('nist-800-53-r5', 'CA-5', 'Assessment, Authorization, and Monitoring', 'Plan of Action and Milestones', 'Develop a plan of action and milestones for the system to document the planned remediation actions to correct weaknesses or deficiencies noted during the assessment of the controls.', 'P1', 1, 1, 1, 5),
('nist-800-53-r5', 'CA-6', 'Assessment, Authorization, and Monitoring', 'Authorization', 'Assign a senior official as the authorizing official for the system and ensure the authorizing official authorizes the system for processing before commencing operations.', 'P1', 1, 1, 1, 6),
('nist-800-53-r5', 'CA-7', 'Assessment, Authorization, and Monitoring', 'Continuous Monitoring', 'Develop a system-level continuous monitoring strategy and implement continuous monitoring in accordance with the organization-level continuous monitoring strategy.', 'P1', 1, 1, 1, 7),
('nist-800-53-r5', 'CA-8', 'Assessment, Authorization, and Monitoring', 'Penetration Testing', 'Conduct penetration testing at a defined frequency on defined systems or system components.', 'P2', 0, 0, 1, 8),
('nist-800-53-r5', 'CA-9', 'Assessment, Authorization, and Monitoring', 'Internal System Connections', 'Authorize internal connections of information system components and document the interface characteristics, security and privacy requirements, and the nature of the information communicated.', 'P2', 1, 1, 1, 9);

-- ============================================================================
-- NIST 800-53 Rev 5 - CONFIGURATION MANAGEMENT (CM) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-800-53-r5', 'CM-1', 'Configuration Management', 'Policy and Procedures', 'Develop, document, and disseminate a configuration management policy and procedures that address purpose, scope, roles, responsibilities, management commitment, coordination, and compliance.', 'P1', 1, 1, 1, 1),
('nist-800-53-r5', 'CM-2', 'Configuration Management', 'Baseline Configuration', 'Develop, document, and maintain a current baseline configuration of the system under configuration control.', 'P1', 1, 1, 1, 2),
('nist-800-53-r5', 'CM-3', 'Configuration Management', 'Configuration Change Control', 'Determine and document the types of changes to the system that are configuration-controlled and manage configuration changes to the system using a systematic approach.', 'P1', 0, 1, 1, 3),
('nist-800-53-r5', 'CM-4', 'Configuration Management', 'Impact Analyses', 'Analyze changes to the system to determine potential security and privacy impacts prior to change implementation.', 'P2', 0, 1, 1, 4),
('nist-800-53-r5', 'CM-5', 'Configuration Management', 'Access Restrictions for Change', 'Define, document, approve, and enforce physical and logical access restrictions associated with changes to the system.', 'P1', 0, 1, 1, 5),
('nist-800-53-r5', 'CM-6', 'Configuration Management', 'Configuration Settings', 'Establish and document configuration settings for components employed within the system that reflect the most restrictive mode consistent with operational requirements.', 'P1', 1, 1, 1, 6),
('nist-800-53-r5', 'CM-7', 'Configuration Management', 'Least Functionality', 'Configure the system to provide only mission-essential capabilities and prohibit or restrict the use of functions, ports, protocols, software, and services as defined.', 'P1', 1, 1, 1, 7),
('nist-800-53-r5', 'CM-8', 'Configuration Management', 'System Component Inventory', 'Develop and document an inventory of system components that accurately reflects the system, includes all components within the system boundary, and is at a level of granularity deemed necessary for tracking and reporting.', 'P1', 1, 1, 1, 8),
('nist-800-53-r5', 'CM-9', 'Configuration Management', 'Configuration Management Plan', 'Develop, document, and implement a configuration management plan for the system that addresses roles, responsibilities, and configuration management processes and procedures.', 'P1', 0, 1, 1, 9),
('nist-800-53-r5', 'CM-10', 'Configuration Management', 'Software Usage Restrictions', 'Use software and associated documentation in accordance with contract agreements and copyright laws and track the use of software and associated documentation protected by quantity licenses.', 'P2', 0, 1, 1, 10),
('nist-800-53-r5', 'CM-11', 'Configuration Management', 'User-Installed Software', 'Establish and enforce policies governing the installation of software by users and enforce software installation policies through automated methods.', 'P1', 0, 1, 1, 11);

-- ============================================================================
-- NIST 800-53 Rev 5 - CONTINGENCY PLANNING (CP) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-800-53-r5', 'CP-1', 'Contingency Planning', 'Policy and Procedures', 'Develop, document, and disseminate a contingency planning policy and procedures that address purpose, scope, roles, responsibilities, management commitment, coordination, and compliance.', 'P1', 1, 1, 1, 1),
('nist-800-53-r5', 'CP-2', 'Contingency Planning', 'Contingency Plan', 'Develop a contingency plan for the system that identifies essential mission and business functions, provides recovery objectives, restoration priorities, metrics, and roles and responsibilities.', 'P1', 1, 1, 1, 2),
('nist-800-53-r5', 'CP-3', 'Contingency Planning', 'Contingency Training', 'Provide contingency training to system users consistent with assigned roles and responsibilities within a defined time period of assuming a contingency role or responsibility.', 'P1', 0, 1, 1, 3),
('nist-800-53-r5', 'CP-4', 'Contingency Planning', 'Contingency Plan Testing', 'Test the contingency plan for the system at a defined frequency using defined tests to determine the effectiveness of the plan and the readiness to execute the plan.', 'P1', 0, 1, 1, 4),
('nist-800-53-r5', 'CP-6', 'Contingency Planning', 'Alternate Storage Site', 'Establish an alternate storage site, including necessary agreements to permit the storage and retrieval of system backup information.', 'P1', 0, 1, 1, 6),
('nist-800-53-r5', 'CP-7', 'Contingency Planning', 'Alternate Processing Site', 'Establish an alternate processing site, including necessary agreements to permit the transfer and resumption of system operations within defined time periods.', 'P1', 0, 1, 1, 7),
('nist-800-53-r5', 'CP-8', 'Contingency Planning', 'Telecommunications Services', 'Establish alternate telecommunications services including necessary agreements to permit the resumption of system operations within defined time periods when primary telecommunications capabilities are unavailable.', 'P1', 0, 1, 1, 8),
('nist-800-53-r5', 'CP-9', 'Contingency Planning', 'System Backup', 'Conduct backups of user-level information, system-level information, and system documentation at a defined frequency and protect the confidentiality, integrity, and availability of backup information.', 'P1', 1, 1, 1, 9),
('nist-800-53-r5', 'CP-10', 'Contingency Planning', 'System Recovery and Reconstitution', 'Provide for the recovery and reconstitution of the system to a known state within a defined time period after a disruption, compromise, or failure.', 'P1', 1, 1, 1, 10);

-- ============================================================================
-- NIST 800-53 Rev 5 - IDENTIFICATION AND AUTHENTICATION (IA) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-800-53-r5', 'IA-1', 'Identification and Authentication', 'Policy and Procedures', 'Develop, document, and disseminate an identification and authentication policy and procedures that address purpose, scope, roles, responsibilities, management commitment, coordination, and compliance.', 'P1', 1, 1, 1, 1),
('nist-800-53-r5', 'IA-2', 'Identification and Authentication', 'Identification and Authentication (Organizational Users)', 'Uniquely identify and authenticate organizational users and associate that unique identification with processes acting on behalf of those users.', 'P1', 1, 1, 1, 2),
('nist-800-53-r5', 'IA-3', 'Identification and Authentication', 'Device Identification and Authentication', 'Uniquely identify and authenticate devices before establishing a local, remote, or network connection.', 'P1', 0, 1, 1, 3),
('nist-800-53-r5', 'IA-4', 'Identification and Authentication', 'Identifier Management', 'Manage system identifiers by receiving authorization from organizational personnel to assign an individual, group, role, service, or device identifier.', 'P1', 1, 1, 1, 4),
('nist-800-53-r5', 'IA-5', 'Identification and Authentication', 'Authenticator Management', 'Manage system authenticators by verifying the identity of the individual, group, role, service, or device receiving the authenticator as part of the initial authenticator distribution.', 'P1', 1, 1, 1, 5),
('nist-800-53-r5', 'IA-6', 'Identification and Authentication', 'Authentication Feedback', 'Obscure feedback of authentication information during the authentication process to protect the information from possible exploitation by unauthorized individuals.', 'P2', 1, 1, 1, 6),
('nist-800-53-r5', 'IA-7', 'Identification and Authentication', 'Cryptographic Module Authentication', 'Implement mechanisms for authentication to a cryptographic module that meet applicable federal laws, executive orders, directives, policies, regulations, standards, and guidelines.', 'P1', 1, 1, 1, 7),
('nist-800-53-r5', 'IA-8', 'Identification and Authentication', 'Identification and Authentication (Non-Organizational Users)', 'Uniquely identify and authenticate non-organizational users or processes acting on behalf of non-organizational users.', 'P1', 1, 1, 1, 8),
('nist-800-53-r5', 'IA-11', 'Identification and Authentication', 'Re-authentication', 'Require users to re-authenticate when defined circumstances or situations require re-authentication.', 'P1', 1, 1, 1, 11),
('nist-800-53-r5', 'IA-12', 'Identification and Authentication', 'Identity Proofing', 'Identity proof users that require accounts for logical access to systems based on appropriate identity assurance level requirements.', 'P1', 0, 1, 1, 12);

-- ============================================================================
-- NIST 800-53 Rev 5 - INCIDENT RESPONSE (IR) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-800-53-r5', 'IR-1', 'Incident Response', 'Policy and Procedures', 'Develop, document, and disseminate an incident response policy and procedures that address purpose, scope, roles, responsibilities, management commitment, coordination, and compliance.', 'P1', 1, 1, 1, 1),
('nist-800-53-r5', 'IR-2', 'Incident Response', 'Incident Response Training', 'Provide incident response training to system users consistent with assigned roles and responsibilities within a defined time period of assuming an incident response role or responsibility.', 'P1', 0, 1, 1, 2),
('nist-800-53-r5', 'IR-3', 'Incident Response', 'Incident Response Testing', 'Test the effectiveness of the incident response capability for the system at a defined frequency using defined tests.', 'P2', 0, 1, 1, 3),
('nist-800-53-r5', 'IR-4', 'Incident Response', 'Incident Handling', 'Implement an incident handling capability for incidents that is consistent with the incident response plan and includes preparation, detection and analysis, containment, eradication, and recovery.', 'P1', 1, 1, 1, 4),
('nist-800-53-r5', 'IR-5', 'Incident Response', 'Incident Monitoring', 'Track and document incidents on an ongoing basis.', 'P1', 1, 1, 1, 5),
('nist-800-53-r5', 'IR-6', 'Incident Response', 'Incident Reporting', 'Require personnel to report suspected incidents to the organizational incident response capability within a defined time period and report incident information to defined authorities.', 'P1', 1, 1, 1, 6),
('nist-800-53-r5', 'IR-7', 'Incident Response', 'Incident Response Assistance', 'Provide an incident response support resource, integral to the organizational incident response capability, that offers advice and assistance to users of the system for the handling and reporting of incidents.', 'P1', 1, 1, 1, 7),
('nist-800-53-r5', 'IR-8', 'Incident Response', 'Incident Response Plan', 'Develop an incident response plan that provides the organization with a roadmap for implementing its incident response capability.', 'P1', 1, 1, 1, 8);

-- ============================================================================
-- NIST 800-53 Rev 5 - MAINTENANCE (MA) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-800-53-r5', 'MA-1', 'Maintenance', 'Policy and Procedures', 'Develop, document, and disseminate a system maintenance policy and procedures that address purpose, scope, roles, responsibilities, management commitment, coordination, and compliance.', 'P1', 1, 1, 1, 1),
('nist-800-53-r5', 'MA-2', 'Maintenance', 'Controlled Maintenance', 'Schedule, document, and review records of maintenance and repairs on system components in accordance with manufacturer or vendor specifications.', 'P1', 1, 1, 1, 2),
('nist-800-53-r5', 'MA-3', 'Maintenance', 'Maintenance Tools', 'Approve, control, and monitor the use of system maintenance tools and maintain the tools on an ongoing basis.', 'P2', 0, 1, 1, 3),
('nist-800-53-r5', 'MA-4', 'Maintenance', 'Nonlocal Maintenance', 'Approve and monitor nonlocal maintenance and diagnostic activities and require strong authentication for the establishment of nonlocal maintenance and diagnostic sessions.', 'P1', 0, 1, 1, 4),
('nist-800-53-r5', 'MA-5', 'Maintenance', 'Maintenance Personnel', 'Establish a process for maintenance personnel authorization and maintain a list of authorized maintenance organizations or personnel.', 'P1', 1, 1, 1, 5),
('nist-800-53-r5', 'MA-6', 'Maintenance', 'Timely Maintenance', 'Obtain maintenance support or spare parts for defined system components within a defined time period of failure.', 'P2', 0, 0, 1, 6);

-- ============================================================================
-- NIST 800-53 Rev 5 - MEDIA PROTECTION (MP) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-800-53-r5', 'MP-1', 'Media Protection', 'Policy and Procedures', 'Develop, document, and disseminate a media protection policy and procedures that address purpose, scope, roles, responsibilities, management commitment, coordination, and compliance.', 'P1', 1, 1, 1, 1),
('nist-800-53-r5', 'MP-2', 'Media Protection', 'Media Access', 'Restrict access to defined types of digital and non-digital media to defined personnel or roles.', 'P1', 1, 1, 1, 2),
('nist-800-53-r5', 'MP-3', 'Media Protection', 'Media Marking', 'Mark system media indicating the distribution limitations, handling caveats, and applicable security markings of the information.', 'P2', 0, 1, 1, 3),
('nist-800-53-r5', 'MP-4', 'Media Protection', 'Media Storage', 'Physically control and securely store digital and non-digital media within controlled areas using defined security controls.', 'P2', 0, 1, 1, 4),
('nist-800-53-r5', 'MP-5', 'Media Protection', 'Media Transport', 'Protect and control digital and non-digital media during transport outside of controlled areas using defined security controls.', 'P1', 0, 1, 1, 5),
('nist-800-53-r5', 'MP-6', 'Media Protection', 'Media Sanitization', 'Sanitize system media prior to disposal, release out of organizational control, or release for reuse using defined sanitization techniques and procedures.', 'P1', 1, 1, 1, 6),
('nist-800-53-r5', 'MP-7', 'Media Protection', 'Media Use', 'Restrict the use of defined types of system media on defined systems or system components using defined controls.', 'P1', 1, 1, 1, 7);

-- ============================================================================
-- NIST 800-53 Rev 5 - PHYSICAL AND ENVIRONMENTAL PROTECTION (PE) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-800-53-r5', 'PE-1', 'Physical and Environmental Protection', 'Policy and Procedures', 'Develop, document, and disseminate a physical and environmental protection policy and procedures that address purpose, scope, roles, responsibilities, management commitment, coordination, and compliance.', 'P1', 1, 1, 1, 1),
('nist-800-53-r5', 'PE-2', 'Physical and Environmental Protection', 'Physical Access Authorizations', 'Develop, approve, and maintain a list of individuals with authorized access to the facility where the system resides.', 'P1', 1, 1, 1, 2),
('nist-800-53-r5', 'PE-3', 'Physical and Environmental Protection', 'Physical Access Control', 'Enforce physical access authorizations at defined entry and exit points to the facility by verifying individual access authorizations before granting access.', 'P1', 1, 1, 1, 3),
('nist-800-53-r5', 'PE-4', 'Physical and Environmental Protection', 'Access Control for Transmission', 'Control physical access to system distribution and transmission lines within organizational facilities using defined security controls.', 'P2', 0, 1, 1, 4),
('nist-800-53-r5', 'PE-5', 'Physical and Environmental Protection', 'Access Control for Output Devices', 'Control physical access to output from defined output devices to prevent unauthorized individuals from obtaining the output.', 'P2', 0, 1, 1, 5),
('nist-800-53-r5', 'PE-6', 'Physical and Environmental Protection', 'Monitoring Physical Access', 'Monitor physical access to the facility where the system resides to detect and respond to physical security incidents.', 'P1', 1, 1, 1, 6),
('nist-800-53-r5', 'PE-8', 'Physical and Environmental Protection', 'Visitor Access Records', 'Maintain visitor access records to the facility where the system resides for a defined time period and review visitor access records at a defined frequency.', 'P2', 1, 1, 1, 8),
('nist-800-53-r5', 'PE-9', 'Physical and Environmental Protection', 'Power Equipment and Cabling', 'Protect power equipment and power cabling for the system from damage and destruction.', 'P1', 0, 1, 1, 9),
('nist-800-53-r5', 'PE-10', 'Physical and Environmental Protection', 'Emergency Shutoff', 'Provide the capability of shutting off power to the system or individual system components in emergency situations.', 'P1', 0, 1, 1, 10),
('nist-800-53-r5', 'PE-11', 'Physical and Environmental Protection', 'Emergency Power', 'Provide an uninterruptible power supply to facilitate an orderly shutdown of the system in the event of a primary power source loss.', 'P1', 0, 1, 1, 11),
('nist-800-53-r5', 'PE-12', 'Physical and Environmental Protection', 'Emergency Lighting', 'Employ and maintain automatic emergency lighting for the system that activates in the event of a power outage or disruption and covers emergency exits and evacuation routes.', 'P1', 1, 1, 1, 12),
('nist-800-53-r5', 'PE-13', 'Physical and Environmental Protection', 'Fire Protection', 'Employ and maintain fire detection and suppression systems that are supported by an independent energy source.', 'P1', 1, 1, 1, 13),
('nist-800-53-r5', 'PE-14', 'Physical and Environmental Protection', 'Environmental Controls', 'Maintain temperature and humidity levels within the facility where the system resides at acceptable levels and monitor environmental conditions at a defined frequency.', 'P1', 1, 1, 1, 14),
('nist-800-53-r5', 'PE-15', 'Physical and Environmental Protection', 'Water Damage Protection', 'Protect the system from damage resulting from water leakage by providing master shutoff or isolation valves that are accessible, working properly, and known to key personnel.', 'P1', 1, 1, 1, 15),
('nist-800-53-r5', 'PE-16', 'Physical and Environmental Protection', 'Delivery and Removal', 'Authorize and control the entry and exit of defined types of system components to and from the facility and maintain records of the items.', 'P2', 1, 1, 1, 16),
('nist-800-53-r5', 'PE-17', 'Physical and Environmental Protection', 'Alternate Work Site', 'Determine and document the alternate work sites allowed for use by employees and employ controls at alternate work sites equivalent to those at the primary work site.', 'P2', 0, 1, 1, 17);

-- ============================================================================
-- NIST 800-53 Rev 5 - PLANNING (PL) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-800-53-r5', 'PL-1', 'Planning', 'Policy and Procedures', 'Develop, document, and disseminate a planning policy and procedures that address purpose, scope, roles, responsibilities, management commitment, coordination, and compliance.', 'P1', 1, 1, 1, 1),
('nist-800-53-r5', 'PL-2', 'Planning', 'System Security and Privacy Plans', 'Develop security and privacy plans for the system that describe the controls in place or planned and the rules of behavior for individuals accessing the system.', 'P1', 1, 1, 1, 2),
('nist-800-53-r5', 'PL-4', 'Planning', 'Rules of Behavior', 'Establish and provide to individuals requiring access to the system, the rules that describe their responsibilities and expected behavior for information and system usage, security, and privacy.', 'P2', 1, 1, 1, 4),
('nist-800-53-r5', 'PL-8', 'Planning', 'Security and Privacy Architectures', 'Develop security and privacy architectures for the system that describe the requirements and approach to be taken for protecting the confidentiality, integrity, and availability of organizational information.', 'P1', 0, 1, 1, 8);

-- ============================================================================
-- NIST 800-53 Rev 5 - PERSONNEL SECURITY (PS) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-800-53-r5', 'PS-1', 'Personnel Security', 'Policy and Procedures', 'Develop, document, and disseminate a personnel security policy and procedures that address purpose, scope, roles, responsibilities, management commitment, coordination, and compliance.', 'P1', 1, 1, 1, 1),
('nist-800-53-r5', 'PS-2', 'Personnel Security', 'Position Risk Designation', 'Assign a risk designation to all organizational positions and establish screening criteria for individuals filling those positions.', 'P1', 1, 1, 1, 2),
('nist-800-53-r5', 'PS-3', 'Personnel Security', 'Personnel Screening', 'Screen individuals prior to authorizing access to the system and rescreen individuals at a defined frequency.', 'P1', 1, 1, 1, 3),
('nist-800-53-r5', 'PS-4', 'Personnel Security', 'Personnel Termination', 'Upon termination of individual employment, disable system access within a defined time period, terminate or revoke any authenticators associated with the individual, and conduct exit interviews.', 'P1', 1, 1, 1, 4),
('nist-800-53-r5', 'PS-5', 'Personnel Security', 'Personnel Transfer', 'Review and confirm ongoing operational need for current logical and physical access authorizations to systems and facilities when individuals are reassigned or transferred.', 'P2', 1, 1, 1, 5),
('nist-800-53-r5', 'PS-6', 'Personnel Security', 'Access Agreements', 'Develop and document access agreements for organizational systems and review and update access agreements at a defined frequency.', 'P2', 1, 1, 1, 6),
('nist-800-53-r5', 'PS-7', 'Personnel Security', 'External Personnel Security', 'Establish personnel security requirements including security roles and responsibilities for external providers and require external providers to comply with personnel security policies.', 'P1', 1, 1, 1, 7),
('nist-800-53-r5', 'PS-8', 'Personnel Security', 'Personnel Sanctions', 'Employ a formal sanctions process for individuals failing to comply with established information security and privacy policies and procedures.', 'P2', 1, 1, 1, 8);

-- ============================================================================
-- NIST 800-53 Rev 5 - RISK ASSESSMENT (RA) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-800-53-r5', 'RA-1', 'Risk Assessment', 'Policy and Procedures', 'Develop, document, and disseminate a risk assessment policy and procedures that address purpose, scope, roles, responsibilities, management commitment, coordination, and compliance.', 'P1', 1, 1, 1, 1),
('nist-800-53-r5', 'RA-2', 'Risk Assessment', 'Security Categorization', 'Categorize the system and information it processes, stores, and transmits and document the security categorization results in the security plan.', 'P1', 1, 1, 1, 2),
('nist-800-53-r5', 'RA-3', 'Risk Assessment', 'Risk Assessment', 'Conduct a risk assessment to identify threats to and vulnerabilities in the system and determine the likelihood and magnitude of harm from unauthorized access, use, disclosure, disruption, modification, or destruction.', 'P1', 1, 1, 1, 3),
('nist-800-53-r5', 'RA-5', 'Risk Assessment', 'Vulnerability Monitoring and Scanning', 'Monitor and scan for vulnerabilities in the system and hosted applications at a defined frequency or when new vulnerabilities potentially affecting the system are identified and reported.', 'P1', 1, 1, 1, 5),
('nist-800-53-r5', 'RA-7', 'Risk Assessment', 'Risk Response', 'Respond to findings from security and privacy assessments, monitoring, and audits in accordance with organizational risk tolerance.', 'P1', 1, 1, 1, 7),
('nist-800-53-r5', 'RA-9', 'Risk Assessment', 'Criticality Analysis', 'Identify critical system components and functions by performing a criticality analysis at a defined decision point in the system development life cycle.', 'P1', 0, 0, 1, 9);

-- ============================================================================
-- NIST 800-53 Rev 5 - SYSTEM AND SERVICES ACQUISITION (SA) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-800-53-r5', 'SA-1', 'System and Services Acquisition', 'Policy and Procedures', 'Develop, document, and disseminate a system and services acquisition policy and procedures that address purpose, scope, roles, responsibilities, management commitment, coordination, and compliance.', 'P1', 1, 1, 1, 1),
('nist-800-53-r5', 'SA-2', 'System and Services Acquisition', 'Allocation of Resources', 'Determine the high-level information security and privacy requirements for the system in mission and business process planning and allocate the resources needed to adequately protect the system.', 'P1', 1, 1, 1, 2),
('nist-800-53-r5', 'SA-3', 'System and Services Acquisition', 'System Development Life Cycle', 'Acquire, develop, and manage the system using a system development life cycle methodology that incorporates information security and privacy considerations.', 'P1', 1, 1, 1, 3),
('nist-800-53-r5', 'SA-4', 'System and Services Acquisition', 'Acquisition Process', 'Include security and privacy functional requirements, strength requirements, assurance requirements, documentation requirements, and acceptance criteria in system acquisition contracts.', 'P1', 1, 1, 1, 4),
('nist-800-53-r5', 'SA-5', 'System and Services Acquisition', 'System Documentation', 'Obtain or develop administrator documentation and user documentation for the system that describes secure configuration, installation, and operation.', 'P2', 1, 1, 1, 5),
('nist-800-53-r5', 'SA-8', 'System and Services Acquisition', 'Security and Privacy Engineering Principles', 'Apply systems security and privacy engineering principles in the specification, design, development, implementation, and modification of the system and system components.', 'P1', 0, 1, 1, 8),
('nist-800-53-r5', 'SA-9', 'System and Services Acquisition', 'External System Services', 'Require that providers of external system services comply with organizational security and privacy requirements and employ defined controls.', 'P1', 1, 1, 1, 9),
('nist-800-53-r5', 'SA-10', 'System and Services Acquisition', 'Developer Configuration Management', 'Require the developer of the system to perform configuration management during system design, development, implementation, and operation.', 'P1', 0, 1, 1, 10),
('nist-800-53-r5', 'SA-11', 'System and Services Acquisition', 'Developer Testing and Evaluation', 'Require the developer of the system to create a security and privacy assessment plan, implement the plan, and produce evidence of the results.', 'P1', 0, 1, 1, 11),
('nist-800-53-r5', 'SA-22', 'System and Services Acquisition', 'Unsupported System Components', 'Replace system components when support for the components is no longer available from the developer, vendor, or manufacturer and provide ongoing monitoring of the availability of support.', 'P1', 0, 1, 1, 22);

-- ============================================================================
-- NIST 800-53 Rev 5 - SYSTEM AND COMMUNICATIONS PROTECTION (SC) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-800-53-r5', 'SC-1', 'System and Communications Protection', 'Policy and Procedures', 'Develop, document, and disseminate a system and communications protection policy and procedures that address purpose, scope, roles, responsibilities, management commitment, coordination, and compliance.', 'P1', 1, 1, 1, 1),
('nist-800-53-r5', 'SC-2', 'System and Communications Protection', 'Separation of System and User Functionality', 'Separate user functionality including user interface services from system management functionality.', 'P1', 0, 1, 1, 2),
('nist-800-53-r5', 'SC-4', 'System and Communications Protection', 'Information in Shared System Resources', 'Prevent unauthorized and unintended information transfer via shared system resources.', 'P1', 0, 1, 1, 4),
('nist-800-53-r5', 'SC-5', 'System and Communications Protection', 'Denial-of-Service Protection', 'Protect against or limit the effects of denial-of-service attacks by employing defined controls.', 'P1', 1, 1, 1, 5),
('nist-800-53-r5', 'SC-7', 'System and Communications Protection', 'Boundary Protection', 'Monitor and control communications at the external managed interfaces to the system and at key internal boundaries within the system.', 'P1', 1, 1, 1, 7),
('nist-800-53-r5', 'SC-8', 'System and Communications Protection', 'Transmission Confidentiality and Integrity', 'Protect the confidentiality and integrity of transmitted information using cryptographic mechanisms or alternative physical controls.', 'P1', 0, 1, 1, 8),
('nist-800-53-r5', 'SC-10', 'System and Communications Protection', 'Network Disconnect', 'Terminate the network connection associated with a communications session at the end of the session or after a defined time period of inactivity.', 'P2', 0, 1, 1, 10),
('nist-800-53-r5', 'SC-12', 'System and Communications Protection', 'Cryptographic Key Establishment and Management', 'Establish and manage cryptographic keys when cryptography is employed within the system in accordance with defined key management requirements.', 'P1', 1, 1, 1, 12),
('nist-800-53-r5', 'SC-13', 'System and Communications Protection', 'Cryptographic Protection', 'Determine the cryptographic uses and implement the types of cryptography required for each specified cryptographic use in accordance with applicable laws and policies.', 'P1', 1, 1, 1, 13),
('nist-800-53-r5', 'SC-15', 'System and Communications Protection', 'Collaborative Computing Devices and Applications', 'Prohibit remote activation of collaborative computing devices and applications with defined exceptions and provide an explicit indication of use to users physically present at the devices.', 'P1', 1, 1, 1, 15),
('nist-800-53-r5', 'SC-17', 'System and Communications Protection', 'Public Key Infrastructure Certificates', 'Issue public key certificates under an appropriate certificate policy or obtain public key certificates from an approved service provider.', 'P1', 0, 1, 1, 17),
('nist-800-53-r5', 'SC-18', 'System and Communications Protection', 'Mobile Code', 'Define acceptable and unacceptable mobile code and mobile code technologies and establish usage restrictions and implementation guidelines for acceptable mobile code.', 'P2', 0, 1, 1, 18),
('nist-800-53-r5', 'SC-20', 'System and Communications Protection', 'Secure Name/Address Resolution Service (Authoritative Source)', 'Provide additional data origin authentication and integrity verification artifacts along with the authoritative name resolution data the system returns in response to external name/address resolution queries.', 'P1', 1, 1, 1, 20),
('nist-800-53-r5', 'SC-21', 'System and Communications Protection', 'Secure Name/Address Resolution Service (Recursive or Caching Resolver)', 'Request and perform data origin authentication and data integrity verification on the name/address resolution responses the system receives from authoritative sources.', 'P1', 1, 1, 1, 21),
('nist-800-53-r5', 'SC-22', 'System and Communications Protection', 'Architecture and Provisioning for Name/Address Resolution Service', 'Ensure the systems that collectively provide name/address resolution service are fault-tolerant and implement internal and external role separation.', 'P1', 1, 1, 1, 22),
('nist-800-53-r5', 'SC-23', 'System and Communications Protection', 'Session Authenticity', 'Protect the authenticity of communications sessions to prevent unauthorized substitution of session identifiers.', 'P1', 0, 1, 1, 23),
('nist-800-53-r5', 'SC-28', 'System and Communications Protection', 'Protection of Information at Rest', 'Protect the confidentiality and integrity of information at rest using cryptographic mechanisms or alternative physical controls.', 'P1', 0, 1, 1, 28),
('nist-800-53-r5', 'SC-39', 'System and Communications Protection', 'Process Isolation', 'Maintain a separate execution domain for each executing system process.', 'P1', 1, 1, 1, 39);

-- ============================================================================
-- NIST 800-53 Rev 5 - SYSTEM AND INFORMATION INTEGRITY (SI) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-800-53-r5', 'SI-1', 'System and Information Integrity', 'Policy and Procedures', 'Develop, document, and disseminate a system and information integrity policy and procedures that address purpose, scope, roles, responsibilities, management commitment, coordination, and compliance.', 'P1', 1, 1, 1, 1),
('nist-800-53-r5', 'SI-2', 'System and Information Integrity', 'Flaw Remediation', 'Identify, report, and correct system flaws and install security-relevant software and firmware updates within a defined time period of the release of the updates.', 'P1', 1, 1, 1, 2),
('nist-800-53-r5', 'SI-3', 'System and Information Integrity', 'Malicious Code Protection', 'Implement malicious code protection mechanisms at system entry and exit points and at workstations, servers, or mobile computing devices on the network.', 'P1', 1, 1, 1, 3),
('nist-800-53-r5', 'SI-4', 'System and Information Integrity', 'System Monitoring', 'Monitor the system to detect attacks, indicators of potential attacks, unauthorized local, network, and remote connections, and identify unauthorized use of the system.', 'P1', 1, 1, 1, 4),
('nist-800-53-r5', 'SI-5', 'System and Information Integrity', 'Security Alerts, Advisories, and Directives', 'Receive system security alerts, advisories, and directives from defined external organizations on an ongoing basis and generate internal security alerts, advisories, and directives.', 'P1', 1, 1, 1, 5),
('nist-800-53-r5', 'SI-6', 'System and Information Integrity', 'Security and Privacy Function Verification', 'Verify the correct operation of security and privacy functions at defined states and transitions and notify defined personnel of failed security and privacy verification tests.', 'P1', 0, 0, 1, 6),
('nist-800-53-r5', 'SI-7', 'System and Information Integrity', 'Software, Firmware, and Information Integrity', 'Employ integrity verification tools to detect unauthorized changes to software, firmware, and information.', 'P1', 0, 1, 1, 7),
('nist-800-53-r5', 'SI-8', 'System and Information Integrity', 'Spam Protection', 'Employ spam protection mechanisms at system entry and exit points and at workstations, servers, or mobile computing devices on the network.', 'P2', 0, 1, 1, 8),
('nist-800-53-r5', 'SI-10', 'System and Information Integrity', 'Information Input Validation', 'Check the validity of information inputs to the system to verify that inputs match specified definitions for format and content.', 'P1', 0, 1, 1, 10),
('nist-800-53-r5', 'SI-11', 'System and Information Integrity', 'Error Handling', 'Generate error messages that provide information necessary for corrective actions without revealing information that could be exploited by adversaries.', 'P2', 0, 1, 1, 11),
('nist-800-53-r5', 'SI-12', 'System and Information Integrity', 'Information Management and Retention', 'Manage and retain information within the system and information output from the system in accordance with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines.', 'P2', 1, 1, 1, 12),
('nist-800-53-r5', 'SI-16', 'System and Information Integrity', 'Memory Protection', 'Implement controls to protect the system memory from unauthorized code execution.', 'P1', 0, 1, 1, 16);

-- ============================================================================
-- NIST 800-53 Rev 5 - SUPPLY CHAIN RISK MANAGEMENT (SR) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-800-53-r5', 'SR-1', 'Supply Chain Risk Management', 'Policy and Procedures', 'Develop, document, and disseminate a supply chain risk management policy and procedures that address purpose, scope, roles, responsibilities, management commitment, coordination, and compliance.', 'P1', 1, 1, 1, 1),
('nist-800-53-r5', 'SR-2', 'Supply Chain Risk Management', 'Supply Chain Risk Management Plan', 'Develop a plan for managing supply chain risks associated with the research, development, design, manufacturing, acquisition, delivery, integration, operations, maintenance, and disposal of systems and system components.', 'P1', 1, 1, 1, 2),
('nist-800-53-r5', 'SR-3', 'Supply Chain Risk Management', 'Supply Chain Controls and Processes', 'Establish a process or processes to identify and address weaknesses or deficiencies in the supply chain elements and processes.', 'P1', 1, 1, 1, 3),
('nist-800-53-r5', 'SR-5', 'Supply Chain Risk Management', 'Acquisition Strategies, Tools, and Methods', 'Employ acquisition strategies, contract tools, and procurement methods to protect against, identify, and mitigate supply chain risks.', 'P1', 0, 1, 1, 5),
('nist-800-53-r5', 'SR-6', 'Supply Chain Risk Management', 'Supplier Assessments and Reviews', 'Assess and review the supply chain-related risks associated with suppliers or contractors and the system, system component, or system service they provide.', 'P1', 0, 1, 1, 6),
('nist-800-53-r5', 'SR-8', 'Supply Chain Risk Management', 'Notification Agreements', 'Establish agreements and procedures with entities involved in the supply chain for notification of supply chain compromises and results of assessments or audits.', 'P2', 0, 1, 1, 8),
('nist-800-53-r5', 'SR-11', 'Supply Chain Risk Management', 'Component Authenticity', 'Develop and implement anti-counterfeit policy and procedures that include the means to detect and prevent counterfeit components from entering the system.', 'P2', 0, 1, 1, 11);

-- ============================================================================
-- NIST 800-53 Rev 5 - PROGRAM MANAGEMENT (PM) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-800-53-r5', 'PM-1', 'Program Management', 'Information Security Program Plan', 'Develop and disseminate an organization-wide information security program plan that provides an overview of the requirements for the security program and a description of the security program management controls.', 'P1', 1, 1, 1, 1),
('nist-800-53-r5', 'PM-2', 'Program Management', 'Information Security Program Leadership Role', 'Appoint a senior information security officer with the mission and resources to coordinate, develop, implement, and maintain an organization-wide information security program.', 'P1', 1, 1, 1, 2),
('nist-800-53-r5', 'PM-3', 'Program Management', 'Information Security and Privacy Resources', 'Include the resources needed to implement the information security and privacy programs in capital planning and investment control processes and document all exceptions to this requirement.', 'P1', 1, 1, 1, 3),
('nist-800-53-r5', 'PM-4', 'Program Management', 'Plan of Action and Milestones Process', 'Implement a process to ensure that plans of action and milestones for the information security, privacy, and supply chain risk management programs are maintained and document the remedial actions.', 'P1', 1, 1, 1, 4),
('nist-800-53-r5', 'PM-5', 'Program Management', 'System Inventory', 'Develop and maintain an inventory of organizational systems.', 'P1', 1, 1, 1, 5),
('nist-800-53-r5', 'PM-6', 'Program Management', 'Measures of Performance', 'Develop, monitor, and report on the results of information security and privacy measures of performance.', 'P1', 1, 1, 1, 6),
('nist-800-53-r5', 'PM-9', 'Program Management', 'Risk Management Strategy', 'Develop a comprehensive strategy to manage risk to organizational operations and assets, individuals, other organizations, and the Nation associated with the operation and use of organizational systems.', 'P1', 1, 1, 1, 9),
('nist-800-53-r5', 'PM-10', 'Program Management', 'Authorization Process', 'Manage the security and privacy state of organizational systems and the environments in which those systems operate through authorization processes.', 'P1', 1, 1, 1, 10),
('nist-800-53-r5', 'PM-11', 'Program Management', 'Mission and Business Process Definition', 'Define organizational mission and business processes with consideration for information security and privacy and the resulting risk to organizational operations, assets, individuals, and other organizations.', 'P1', 1, 1, 1, 11);

-- ============================================================================
-- NIST 800-53 Rev 5 - PII PROCESSING AND TRANSPARENCY (PT) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-800-53-r5', 'PT-1', 'PII Processing and Transparency', 'Policy and Procedures', 'Develop, document, and disseminate a personally identifiable information processing and transparency policy and procedures that address purpose, scope, roles, responsibilities, management commitment, coordination, and compliance.', 'P1', 1, 1, 1, 1),
('nist-800-53-r5', 'PT-2', 'PII Processing and Transparency', 'Authority to Process Personally Identifiable Information', 'Determine and document the legal authority that permits the collection, use, maintenance, and sharing of personally identifiable information.', 'P1', 1, 1, 1, 2),
('nist-800-53-r5', 'PT-3', 'PII Processing and Transparency', 'Personally Identifiable Information Processing Purposes', 'Identify and document the purpose for processing personally identifiable information and describe the purpose in the related system of records notice or privacy impact assessment.', 'P1', 1, 1, 1, 3),
('nist-800-53-r5', 'PT-4', 'PII Processing and Transparency', 'Consent', 'Implement mechanisms to obtain consent from individuals for the processing of their personally identifiable information and provide a means for individuals to revoke consent.', 'P1', 0, 1, 1, 4),
('nist-800-53-r5', 'PT-5', 'PII Processing and Transparency', 'Privacy Notice', 'Provide notice to individuals about the processing of personally identifiable information that is available prior to or at the time of collection.', 'P1', 0, 1, 1, 5);

-- ============================================================================
-- FEDRAMP MODERATE BASELINE - ACCESS CONTROL (AC) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('fedramp-moderate', 'AC-1', 'Access Control', 'Policy and Procedures', 'Develop, document, and disseminate an access control policy and procedures consistent with FedRAMP requirements.', 'P1', 0, 1, 1, 1),
('fedramp-moderate', 'AC-2', 'Access Control', 'Account Management', 'Manage information system accounts including establishing, activating, modifying, reviewing, disabling, and removing accounts per FedRAMP requirements.', 'P1', 0, 1, 1, 2),
('fedramp-moderate', 'AC-3', 'Access Control', 'Access Enforcement', 'Enforce approved authorizations for logical access to information and system resources in accordance with applicable FedRAMP access control policies.', 'P1', 0, 1, 1, 3),
('fedramp-moderate', 'AC-4', 'Access Control', 'Information Flow Enforcement', 'Enforce approved authorizations for controlling the flow of information within the system and between connected systems based on FedRAMP policy.', 'P1', 0, 1, 1, 4),
('fedramp-moderate', 'AC-5', 'Access Control', 'Separation of Duties', 'Separate duties of individuals to reduce the risk of malevolent activity without collusion as required by FedRAMP.', 'P1', 0, 1, 1, 5),
('fedramp-moderate', 'AC-6', 'Access Control', 'Least Privilege', 'Employ the principle of least privilege allowing only authorized accesses for users which are necessary to accomplish assigned organizational tasks.', 'P1', 0, 1, 1, 6),
('fedramp-moderate', 'AC-7', 'Access Control', 'Unsuccessful Logon Attempts', 'Enforce a limit of consecutive invalid logon attempts by a user during a defined time period per FedRAMP requirements.', 'P1', 0, 1, 1, 7),
('fedramp-moderate', 'AC-8', 'Access Control', 'System Use Notification', 'Display an approved system use notification message or banner before granting access to the system consistent with FedRAMP requirements.', 'P1', 0, 1, 1, 8),
('fedramp-moderate', 'AC-11', 'Access Control', 'Device Lock', 'Prevent further access to the system by initiating a device lock after a defined period of inactivity as specified in FedRAMP guidelines.', 'P2', 0, 1, 1, 11),
('fedramp-moderate', 'AC-12', 'Access Control', 'Session Termination', 'Automatically terminate a user session after conditions defined by FedRAMP are met.', 'P2', 0, 1, 1, 12),
('fedramp-moderate', 'AC-17', 'Access Control', 'Remote Access', 'Establish and document usage restrictions, configuration and connection requirements, and implementation guidance for each type of remote access allowed.', 'P1', 0, 1, 1, 17),
('fedramp-moderate', 'AC-18', 'Access Control', 'Wireless Access', 'Establish configuration requirements, connection requirements, and implementation guidance for wireless access per FedRAMP standards.', 'P1', 0, 1, 1, 18),
('fedramp-moderate', 'AC-19', 'Access Control', 'Access Control for Mobile Devices', 'Establish usage restrictions, configuration requirements, and connection requirements for organization-controlled mobile devices.', 'P1', 0, 1, 1, 19),
('fedramp-moderate', 'AC-20', 'Access Control', 'Use of External Systems', 'Establish terms and conditions allowing authorized individuals to access the system from external systems consistent with FedRAMP trust requirements.', 'P1', 0, 1, 1, 20),
('fedramp-moderate', 'AC-22', 'Access Control', 'Publicly Accessible Content', 'Designate individuals authorized to post information onto a publicly accessible system and ensure publicly accessible information does not contain nonpublic data.', 'P2', 0, 1, 1, 22);

-- ============================================================================
-- FEDRAMP MODERATE BASELINE - AWARENESS AND TRAINING (AT) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('fedramp-moderate', 'AT-1', 'Awareness and Training', 'Policy and Procedures', 'Develop, document, and disseminate an awareness and training policy and procedures per FedRAMP requirements.', 'P1', 0, 1, 1, 1),
('fedramp-moderate', 'AT-2', 'Awareness and Training', 'Literacy Training and Awareness', 'Provide security and privacy literacy training to system users as required by the FedRAMP moderate baseline.', 'P1', 0, 1, 1, 2),
('fedramp-moderate', 'AT-3', 'Awareness and Training', 'Role-Based Training', 'Provide role-based security and privacy training to personnel with assigned security roles consistent with FedRAMP requirements.', 'P1', 0, 1, 1, 3),
('fedramp-moderate', 'AT-4', 'Awareness and Training', 'Training Records', 'Document and monitor information security and privacy training activities as required by FedRAMP.', 'P2', 0, 1, 1, 4);

-- ============================================================================
-- FEDRAMP MODERATE BASELINE - AUDIT AND ACCOUNTABILITY (AU) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('fedramp-moderate', 'AU-1', 'Audit and Accountability', 'Policy and Procedures', 'Develop, document, and disseminate an audit and accountability policy and procedures per FedRAMP requirements.', 'P1', 0, 1, 1, 1),
('fedramp-moderate', 'AU-2', 'Audit and Accountability', 'Event Logging', 'Identify the types of events that the system is capable of logging in support of the audit function consistent with FedRAMP audit requirements.', 'P1', 0, 1, 1, 2),
('fedramp-moderate', 'AU-3', 'Audit and Accountability', 'Content of Audit Records', 'Ensure that audit records contain information establishing what type of event occurred, when, where, the source, outcome, and identity of associated subjects per FedRAMP.', 'P1', 0, 1, 1, 3),
('fedramp-moderate', 'AU-4', 'Audit and Accountability', 'Audit Log Storage Capacity', 'Allocate audit log storage capacity and configure auditing to reduce the likelihood of capacity being exceeded per FedRAMP requirements.', 'P1', 0, 1, 1, 4),
('fedramp-moderate', 'AU-5', 'Audit and Accountability', 'Response to Audit Logging Process Failures', 'Alert designated personnel in the event of an audit logging process failure and take FedRAMP-defined additional actions.', 'P1', 0, 1, 1, 5),
('fedramp-moderate', 'AU-6', 'Audit and Accountability', 'Audit Record Review, Analysis, and Reporting', 'Review and analyze system audit records at the frequency required by FedRAMP for indications of inappropriate or unusual activity.', 'P1', 0, 1, 1, 6),
('fedramp-moderate', 'AU-7', 'Audit and Accountability', 'Audit Record Reduction and Report Generation', 'Provide and implement an audit record reduction and report generation capability as required by FedRAMP moderate baseline.', 'P2', 0, 1, 1, 7),
('fedramp-moderate', 'AU-8', 'Audit and Accountability', 'Time Stamps', 'Use internal system clocks to generate time stamps for audit records that map to UTC as required by FedRAMP.', 'P1', 0, 1, 1, 8),
('fedramp-moderate', 'AU-9', 'Audit and Accountability', 'Protection of Audit Information', 'Protect audit information and audit logging tools from unauthorized access, modification, and deletion per FedRAMP requirements.', 'P1', 0, 1, 1, 9),
('fedramp-moderate', 'AU-11', 'Audit and Accountability', 'Audit Record Retention', 'Retain audit records for the minimum time period required by FedRAMP to provide support for after-the-fact investigations.', 'P2', 0, 1, 1, 11),
('fedramp-moderate', 'AU-12', 'Audit and Accountability', 'Audit Record Generation', 'Provide audit record generation capability for the event types the system is capable of auditing as required by FedRAMP.', 'P1', 0, 1, 1, 12);

-- ============================================================================
-- FEDRAMP MODERATE BASELINE - ASSESSMENT, AUTHORIZATION, AND MONITORING (CA) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('fedramp-moderate', 'CA-1', 'Assessment, Authorization, and Monitoring', 'Policy and Procedures', 'Develop, document, and disseminate an assessment, authorization, and monitoring policy and procedures per FedRAMP requirements.', 'P1', 0, 1, 1, 1),
('fedramp-moderate', 'CA-2', 'Assessment, Authorization, and Monitoring', 'Control Assessments', 'Assess controls in the system using a FedRAMP-accredited 3PAO to determine the extent to which controls are implemented correctly and producing desired outcomes.', 'P1', 0, 1, 1, 2),
('fedramp-moderate', 'CA-3', 'Assessment, Authorization, and Monitoring', 'Information Exchange', 'Approve and manage the exchange of information between the system and other systems using interconnection security agreements per FedRAMP.', 'P1', 0, 1, 1, 3),
('fedramp-moderate', 'CA-5', 'Assessment, Authorization, and Monitoring', 'Plan of Action and Milestones', 'Develop and maintain a plan of action and milestones documenting planned remediation actions per FedRAMP POA&M requirements.', 'P1', 0, 1, 1, 5),
('fedramp-moderate', 'CA-6', 'Assessment, Authorization, and Monitoring', 'Authorization', 'Obtain a FedRAMP authorization to operate by submitting the authorization package to the FedRAMP PMO or authorizing official.', 'P1', 0, 1, 1, 6),
('fedramp-moderate', 'CA-7', 'Assessment, Authorization, and Monitoring', 'Continuous Monitoring', 'Implement continuous monitoring in accordance with the FedRAMP continuous monitoring strategy and ConMon requirements.', 'P1', 0, 1, 1, 7),
('fedramp-moderate', 'CA-9', 'Assessment, Authorization, and Monitoring', 'Internal System Connections', 'Authorize and document internal connections of system components per FedRAMP internal system connection requirements.', 'P2', 0, 1, 1, 9);

-- ============================================================================
-- FEDRAMP MODERATE BASELINE - CONFIGURATION MANAGEMENT (CM) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('fedramp-moderate', 'CM-1', 'Configuration Management', 'Policy and Procedures', 'Develop, document, and disseminate a configuration management policy and procedures per FedRAMP requirements.', 'P1', 0, 1, 1, 1),
('fedramp-moderate', 'CM-2', 'Configuration Management', 'Baseline Configuration', 'Develop, document, and maintain a current baseline configuration of the system under configuration control per FedRAMP.', 'P1', 0, 1, 1, 2),
('fedramp-moderate', 'CM-3', 'Configuration Management', 'Configuration Change Control', 'Manage configuration changes to the system using a systematic approach per FedRAMP change management requirements.', 'P1', 0, 1, 1, 3),
('fedramp-moderate', 'CM-4', 'Configuration Management', 'Impact Analyses', 'Analyze changes to the system to determine potential security and privacy impacts prior to change implementation per FedRAMP.', 'P2', 0, 1, 1, 4),
('fedramp-moderate', 'CM-5', 'Configuration Management', 'Access Restrictions for Change', 'Define, document, approve, and enforce physical and logical access restrictions associated with changes per FedRAMP requirements.', 'P1', 0, 1, 1, 5),
('fedramp-moderate', 'CM-6', 'Configuration Management', 'Configuration Settings', 'Establish and document configuration settings for components that reflect the most restrictive mode consistent with FedRAMP operational requirements.', 'P1', 0, 1, 1, 6),
('fedramp-moderate', 'CM-7', 'Configuration Management', 'Least Functionality', 'Configure the system to provide only mission-essential capabilities and restrict use of functions, ports, protocols, and services per FedRAMP.', 'P1', 0, 1, 1, 7),
('fedramp-moderate', 'CM-8', 'Configuration Management', 'System Component Inventory', 'Develop and document an inventory of system components that accurately reflects the system per FedRAMP inventory requirements.', 'P1', 0, 1, 1, 8),
('fedramp-moderate', 'CM-9', 'Configuration Management', 'Configuration Management Plan', 'Develop and implement a configuration management plan for the system per FedRAMP configuration management requirements.', 'P1', 0, 1, 1, 9),
('fedramp-moderate', 'CM-10', 'Configuration Management', 'Software Usage Restrictions', 'Use software in accordance with contract agreements and copyright laws and track usage of quantity-licensed software per FedRAMP.', 'P2', 0, 1, 1, 10),
('fedramp-moderate', 'CM-11', 'Configuration Management', 'User-Installed Software', 'Establish and enforce policies governing user-installed software per FedRAMP requirements.', 'P1', 0, 1, 1, 11);

-- ============================================================================
-- FEDRAMP MODERATE BASELINE - CONTINGENCY PLANNING (CP) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('fedramp-moderate', 'CP-1', 'Contingency Planning', 'Policy and Procedures', 'Develop, document, and disseminate a contingency planning policy and procedures per FedRAMP requirements.', 'P1', 0, 1, 1, 1),
('fedramp-moderate', 'CP-2', 'Contingency Planning', 'Contingency Plan', 'Develop a contingency plan for the system that identifies essential mission and business functions per FedRAMP requirements.', 'P1', 0, 1, 1, 2),
('fedramp-moderate', 'CP-3', 'Contingency Planning', 'Contingency Training', 'Provide contingency training to system users consistent with assigned roles per FedRAMP training requirements.', 'P1', 0, 1, 1, 3),
('fedramp-moderate', 'CP-4', 'Contingency Planning', 'Contingency Plan Testing', 'Test the contingency plan at the frequency required by FedRAMP to determine effectiveness and organizational readiness.', 'P1', 0, 1, 1, 4),
('fedramp-moderate', 'CP-6', 'Contingency Planning', 'Alternate Storage Site', 'Establish an alternate storage site including necessary agreements for storage and retrieval of backup information per FedRAMP.', 'P1', 0, 1, 1, 6),
('fedramp-moderate', 'CP-7', 'Contingency Planning', 'Alternate Processing Site', 'Establish an alternate processing site for transfer and resumption of system operations per FedRAMP requirements.', 'P1', 0, 1, 1, 7),
('fedramp-moderate', 'CP-8', 'Contingency Planning', 'Telecommunications Services', 'Establish alternate telecommunications services for resumption of system operations per FedRAMP requirements.', 'P1', 0, 1, 1, 8),
('fedramp-moderate', 'CP-9', 'Contingency Planning', 'System Backup', 'Conduct backups of user-level, system-level, and documentation information at FedRAMP-defined frequency.', 'P1', 0, 1, 1, 9),
('fedramp-moderate', 'CP-10', 'Contingency Planning', 'System Recovery and Reconstitution', 'Provide for recovery and reconstitution of the system to a known state per FedRAMP recovery time and point objectives.', 'P1', 0, 1, 1, 10);

-- ============================================================================
-- FEDRAMP MODERATE BASELINE - IDENTIFICATION AND AUTHENTICATION (IA) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('fedramp-moderate', 'IA-1', 'Identification and Authentication', 'Policy and Procedures', 'Develop, document, and disseminate an identification and authentication policy and procedures per FedRAMP requirements.', 'P1', 0, 1, 1, 1),
('fedramp-moderate', 'IA-2', 'Identification and Authentication', 'Identification and Authentication (Organizational Users)', 'Uniquely identify and authenticate organizational users with multi-factor authentication as required by FedRAMP.', 'P1', 0, 1, 1, 2),
('fedramp-moderate', 'IA-3', 'Identification and Authentication', 'Device Identification and Authentication', 'Uniquely identify and authenticate devices before establishing connections per FedRAMP device authentication requirements.', 'P1', 0, 1, 1, 3),
('fedramp-moderate', 'IA-4', 'Identification and Authentication', 'Identifier Management', 'Manage system identifiers by receiving authorization and assigning identifiers per FedRAMP identifier management requirements.', 'P1', 0, 1, 1, 4),
('fedramp-moderate', 'IA-5', 'Identification and Authentication', 'Authenticator Management', 'Manage system authenticators by verifying identity and establishing initial authenticator content per FedRAMP requirements.', 'P1', 0, 1, 1, 5),
('fedramp-moderate', 'IA-6', 'Identification and Authentication', 'Authentication Feedback', 'Obscure feedback of authentication information during the authentication process per FedRAMP requirements.', 'P2', 0, 1, 1, 6),
('fedramp-moderate', 'IA-7', 'Identification and Authentication', 'Cryptographic Module Authentication', 'Implement mechanisms for authentication to a cryptographic module meeting FIPS 140 validation requirements per FedRAMP.', 'P1', 0, 1, 1, 7),
('fedramp-moderate', 'IA-8', 'Identification and Authentication', 'Identification and Authentication (Non-Organizational Users)', 'Uniquely identify and authenticate non-organizational users per FedRAMP requirements for external user access.', 'P1', 0, 1, 1, 8);

-- ============================================================================
-- FEDRAMP MODERATE BASELINE - INCIDENT RESPONSE (IR) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('fedramp-moderate', 'IR-1', 'Incident Response', 'Policy and Procedures', 'Develop, document, and disseminate an incident response policy and procedures per FedRAMP requirements.', 'P1', 0, 1, 1, 1),
('fedramp-moderate', 'IR-2', 'Incident Response', 'Incident Response Training', 'Provide incident response training to system users consistent with FedRAMP training requirements.', 'P1', 0, 1, 1, 2),
('fedramp-moderate', 'IR-3', 'Incident Response', 'Incident Response Testing', 'Test the incident response capability at the frequency required by FedRAMP using defined tests.', 'P2', 0, 1, 1, 3),
('fedramp-moderate', 'IR-4', 'Incident Response', 'Incident Handling', 'Implement an incident handling capability consistent with the FedRAMP incident response requirements and US-CERT reporting.', 'P1', 0, 1, 1, 4),
('fedramp-moderate', 'IR-5', 'Incident Response', 'Incident Monitoring', 'Track and document incidents on an ongoing basis per FedRAMP continuous monitoring requirements.', 'P1', 0, 1, 1, 5),
('fedramp-moderate', 'IR-6', 'Incident Response', 'Incident Reporting', 'Report incidents to FedRAMP and US-CERT within FedRAMP-defined time periods.', 'P1', 0, 1, 1, 6),
('fedramp-moderate', 'IR-7', 'Incident Response', 'Incident Response Assistance', 'Provide an incident response support resource integral to the organizational incident response capability per FedRAMP.', 'P1', 0, 1, 1, 7),
('fedramp-moderate', 'IR-8', 'Incident Response', 'Incident Response Plan', 'Develop an incident response plan consistent with FedRAMP requirements that provides a roadmap for implementing incident response.', 'P1', 0, 1, 1, 8);

-- ============================================================================
-- FEDRAMP MODERATE BASELINE - MAINTENANCE (MA) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('fedramp-moderate', 'MA-1', 'Maintenance', 'Policy and Procedures', 'Develop, document, and disseminate a system maintenance policy and procedures per FedRAMP requirements.', 'P1', 0, 1, 1, 1),
('fedramp-moderate', 'MA-2', 'Maintenance', 'Controlled Maintenance', 'Schedule, document, and review maintenance records per FedRAMP maintenance requirements.', 'P1', 0, 1, 1, 2),
('fedramp-moderate', 'MA-3', 'Maintenance', 'Maintenance Tools', 'Approve, control, and monitor the use of system maintenance tools per FedRAMP requirements.', 'P2', 0, 1, 1, 3),
('fedramp-moderate', 'MA-4', 'Maintenance', 'Nonlocal Maintenance', 'Approve and monitor nonlocal maintenance and diagnostic activities with strong authentication per FedRAMP.', 'P1', 0, 1, 1, 4),
('fedramp-moderate', 'MA-5', 'Maintenance', 'Maintenance Personnel', 'Establish a process for maintenance personnel authorization per FedRAMP personnel security requirements.', 'P1', 0, 1, 1, 5);

-- ============================================================================
-- FEDRAMP MODERATE BASELINE - MEDIA PROTECTION (MP) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('fedramp-moderate', 'MP-1', 'Media Protection', 'Policy and Procedures', 'Develop, document, and disseminate a media protection policy and procedures per FedRAMP requirements.', 'P1', 0, 1, 1, 1),
('fedramp-moderate', 'MP-2', 'Media Protection', 'Media Access', 'Restrict access to defined types of digital and non-digital media per FedRAMP media access requirements.', 'P1', 0, 1, 1, 2),
('fedramp-moderate', 'MP-3', 'Media Protection', 'Media Marking', 'Mark system media indicating distribution limitations and applicable security markings per FedRAMP.', 'P2', 0, 1, 1, 3),
('fedramp-moderate', 'MP-4', 'Media Protection', 'Media Storage', 'Physically control and securely store digital and non-digital media per FedRAMP storage requirements.', 'P2', 0, 1, 1, 4),
('fedramp-moderate', 'MP-5', 'Media Protection', 'Media Transport', 'Protect and control media during transport outside of controlled areas per FedRAMP transport requirements.', 'P1', 0, 1, 1, 5),
('fedramp-moderate', 'MP-6', 'Media Protection', 'Media Sanitization', 'Sanitize system media prior to disposal or release per FedRAMP sanitization requirements.', 'P1', 0, 1, 1, 6),
('fedramp-moderate', 'MP-7', 'Media Protection', 'Media Use', 'Restrict the use of defined types of system media per FedRAMP usage restrictions.', 'P1', 0, 1, 1, 7);

-- ============================================================================
-- FEDRAMP MODERATE BASELINE - PHYSICAL AND ENVIRONMENTAL PROTECTION (PE) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('fedramp-moderate', 'PE-1', 'Physical and Environmental Protection', 'Policy and Procedures', 'Develop, document, and disseminate a physical and environmental protection policy and procedures per FedRAMP requirements.', 'P1', 0, 1, 1, 1),
('fedramp-moderate', 'PE-2', 'Physical and Environmental Protection', 'Physical Access Authorizations', 'Develop, approve, and maintain a list of individuals with authorized access to the facility per FedRAMP requirements.', 'P1', 0, 1, 1, 2),
('fedramp-moderate', 'PE-3', 'Physical and Environmental Protection', 'Physical Access Control', 'Enforce physical access authorizations at entry and exit points per FedRAMP physical security requirements.', 'P1', 0, 1, 1, 3),
('fedramp-moderate', 'PE-6', 'Physical and Environmental Protection', 'Monitoring Physical Access', 'Monitor physical access to the facility to detect and respond to physical security incidents per FedRAMP.', 'P1', 0, 1, 1, 6),
('fedramp-moderate', 'PE-8', 'Physical and Environmental Protection', 'Visitor Access Records', 'Maintain visitor access records per FedRAMP visitor management requirements.', 'P2', 0, 1, 1, 8),
('fedramp-moderate', 'PE-12', 'Physical and Environmental Protection', 'Emergency Lighting', 'Employ and maintain automatic emergency lighting per FedRAMP facility requirements.', 'P1', 0, 1, 1, 12),
('fedramp-moderate', 'PE-13', 'Physical and Environmental Protection', 'Fire Protection', 'Employ and maintain fire detection and suppression systems per FedRAMP facility requirements.', 'P1', 0, 1, 1, 13),
('fedramp-moderate', 'PE-14', 'Physical and Environmental Protection', 'Environmental Controls', 'Maintain temperature and humidity levels within acceptable levels per FedRAMP environmental requirements.', 'P1', 0, 1, 1, 14),
('fedramp-moderate', 'PE-15', 'Physical and Environmental Protection', 'Water Damage Protection', 'Protect the system from water damage per FedRAMP facility protection requirements.', 'P1', 0, 1, 1, 15),
('fedramp-moderate', 'PE-16', 'Physical and Environmental Protection', 'Delivery and Removal', 'Authorize and control entry and exit of system components and maintain records per FedRAMP.', 'P2', 0, 1, 1, 16);

-- ============================================================================
-- FEDRAMP MODERATE BASELINE - PLANNING (PL) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('fedramp-moderate', 'PL-1', 'Planning', 'Policy and Procedures', 'Develop, document, and disseminate a planning policy and procedures per FedRAMP requirements.', 'P1', 0, 1, 1, 1),
('fedramp-moderate', 'PL-2', 'Planning', 'System Security and Privacy Plans', 'Develop the System Security Plan per FedRAMP SSP template requirements.', 'P1', 0, 1, 1, 2),
('fedramp-moderate', 'PL-4', 'Planning', 'Rules of Behavior', 'Establish and provide rules of behavior for system access per FedRAMP requirements.', 'P2', 0, 1, 1, 4);

-- ============================================================================
-- FEDRAMP MODERATE BASELINE - PERSONNEL SECURITY (PS) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('fedramp-moderate', 'PS-1', 'Personnel Security', 'Policy and Procedures', 'Develop, document, and disseminate a personnel security policy and procedures per FedRAMP requirements.', 'P1', 0, 1, 1, 1),
('fedramp-moderate', 'PS-2', 'Personnel Security', 'Position Risk Designation', 'Assign risk designations to all positions per FedRAMP personnel security requirements.', 'P1', 0, 1, 1, 2),
('fedramp-moderate', 'PS-3', 'Personnel Security', 'Personnel Screening', 'Screen individuals prior to authorizing access per FedRAMP screening requirements.', 'P1', 0, 1, 1, 3),
('fedramp-moderate', 'PS-4', 'Personnel Security', 'Personnel Termination', 'Upon termination disable system access and conduct exit procedures per FedRAMP requirements.', 'P1', 0, 1, 1, 4),
('fedramp-moderate', 'PS-5', 'Personnel Security', 'Personnel Transfer', 'Review and confirm ongoing access needs when individuals are transferred per FedRAMP requirements.', 'P2', 0, 1, 1, 5),
('fedramp-moderate', 'PS-6', 'Personnel Security', 'Access Agreements', 'Develop and document access agreements per FedRAMP requirements.', 'P2', 0, 1, 1, 6),
('fedramp-moderate', 'PS-7', 'Personnel Security', 'External Personnel Security', 'Establish personnel security requirements for external providers per FedRAMP third-party requirements.', 'P1', 0, 1, 1, 7),
('fedramp-moderate', 'PS-8', 'Personnel Security', 'Personnel Sanctions', 'Employ a formal sanctions process for personnel failing to comply with security policies per FedRAMP.', 'P2', 0, 1, 1, 8);

-- ============================================================================
-- FEDRAMP MODERATE BASELINE - RISK ASSESSMENT (RA) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('fedramp-moderate', 'RA-1', 'Risk Assessment', 'Policy and Procedures', 'Develop, document, and disseminate a risk assessment policy and procedures per FedRAMP requirements.', 'P1', 0, 1, 1, 1),
('fedramp-moderate', 'RA-2', 'Risk Assessment', 'Security Categorization', 'Categorize the system using FIPS 199 and document results in the FedRAMP SSP.', 'P1', 0, 1, 1, 2),
('fedramp-moderate', 'RA-3', 'Risk Assessment', 'Risk Assessment', 'Conduct a risk assessment per FedRAMP risk assessment methodology and document results.', 'P1', 0, 1, 1, 3),
('fedramp-moderate', 'RA-5', 'Risk Assessment', 'Vulnerability Monitoring and Scanning', 'Monitor and scan for vulnerabilities at FedRAMP-defined frequency and remediate per FedRAMP vulnerability management requirements.', 'P1', 0, 1, 1, 5);

-- ============================================================================
-- FEDRAMP MODERATE BASELINE - SYSTEM AND SERVICES ACQUISITION (SA) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('fedramp-moderate', 'SA-1', 'System and Services Acquisition', 'Policy and Procedures', 'Develop, document, and disseminate a system and services acquisition policy and procedures per FedRAMP requirements.', 'P1', 0, 1, 1, 1),
('fedramp-moderate', 'SA-2', 'System and Services Acquisition', 'Allocation of Resources', 'Determine security requirements and allocate resources needed per FedRAMP system acquisition requirements.', 'P1', 0, 1, 1, 2),
('fedramp-moderate', 'SA-3', 'System and Services Acquisition', 'System Development Life Cycle', 'Manage the system using a SDLC methodology incorporating security considerations per FedRAMP.', 'P1', 0, 1, 1, 3),
('fedramp-moderate', 'SA-4', 'System and Services Acquisition', 'Acquisition Process', 'Include security functional and assurance requirements in acquisition contracts per FedRAMP.', 'P1', 0, 1, 1, 4),
('fedramp-moderate', 'SA-5', 'System and Services Acquisition', 'System Documentation', 'Obtain or develop administrator and user documentation per FedRAMP documentation requirements.', 'P2', 0, 1, 1, 5),
('fedramp-moderate', 'SA-9', 'System and Services Acquisition', 'External System Services', 'Require external service providers to comply with FedRAMP security requirements and employ required controls.', 'P1', 0, 1, 1, 9);

-- ============================================================================
-- FEDRAMP MODERATE BASELINE - SYSTEM AND COMMUNICATIONS PROTECTION (SC) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('fedramp-moderate', 'SC-1', 'System and Communications Protection', 'Policy and Procedures', 'Develop, document, and disseminate a system and communications protection policy and procedures per FedRAMP requirements.', 'P1', 0, 1, 1, 1),
('fedramp-moderate', 'SC-2', 'System and Communications Protection', 'Separation of System and User Functionality', 'Separate user functionality from system management functionality per FedRAMP requirements.', 'P1', 0, 1, 1, 2),
('fedramp-moderate', 'SC-4', 'System and Communications Protection', 'Information in Shared System Resources', 'Prevent unauthorized information transfer via shared system resources per FedRAMP requirements.', 'P1', 0, 1, 1, 4),
('fedramp-moderate', 'SC-5', 'System and Communications Protection', 'Denial-of-Service Protection', 'Protect against denial-of-service attacks per FedRAMP protection requirements.', 'P1', 0, 1, 1, 5),
('fedramp-moderate', 'SC-7', 'System and Communications Protection', 'Boundary Protection', 'Monitor and control communications at managed interfaces per FedRAMP boundary protection requirements.', 'P1', 0, 1, 1, 7),
('fedramp-moderate', 'SC-8', 'System and Communications Protection', 'Transmission Confidentiality and Integrity', 'Protect confidentiality and integrity of transmitted information using FIPS-validated cryptography per FedRAMP.', 'P1', 0, 1, 1, 8),
('fedramp-moderate', 'SC-10', 'System and Communications Protection', 'Network Disconnect', 'Terminate network connections after defined period of inactivity per FedRAMP requirements.', 'P2', 0, 1, 1, 10),
('fedramp-moderate', 'SC-12', 'System and Communications Protection', 'Cryptographic Key Establishment and Management', 'Establish and manage cryptographic keys per FedRAMP key management requirements.', 'P1', 0, 1, 1, 12),
('fedramp-moderate', 'SC-13', 'System and Communications Protection', 'Cryptographic Protection', 'Implement FIPS-validated cryptography per FedRAMP cryptographic requirements.', 'P1', 0, 1, 1, 13),
('fedramp-moderate', 'SC-15', 'System and Communications Protection', 'Collaborative Computing Devices and Applications', 'Prohibit remote activation of collaborative computing devices per FedRAMP requirements.', 'P1', 0, 1, 1, 15),
('fedramp-moderate', 'SC-20', 'System and Communications Protection', 'Secure Name/Address Resolution Service (Authoritative Source)', 'Provide data origin authentication for authoritative name resolution per FedRAMP.', 'P1', 0, 1, 1, 20),
('fedramp-moderate', 'SC-21', 'System and Communications Protection', 'Secure Name/Address Resolution Service (Recursive or Caching Resolver)', 'Perform data origin authentication and integrity verification on name resolution responses per FedRAMP.', 'P1', 0, 1, 1, 21),
('fedramp-moderate', 'SC-22', 'System and Communications Protection', 'Architecture and Provisioning for Name/Address Resolution Service', 'Ensure name resolution services are fault-tolerant per FedRAMP availability requirements.', 'P1', 0, 1, 1, 22),
('fedramp-moderate', 'SC-23', 'System and Communications Protection', 'Session Authenticity', 'Protect the authenticity of communications sessions per FedRAMP session management requirements.', 'P1', 0, 1, 1, 23),
('fedramp-moderate', 'SC-28', 'System and Communications Protection', 'Protection of Information at Rest', 'Protect information at rest using FIPS-validated encryption per FedRAMP data-at-rest requirements.', 'P1', 0, 1, 1, 28),
('fedramp-moderate', 'SC-39', 'System and Communications Protection', 'Process Isolation', 'Maintain separate execution domains for each executing system process per FedRAMP requirements.', 'P1', 0, 1, 1, 39);

-- ============================================================================
-- FEDRAMP MODERATE BASELINE - SYSTEM AND INFORMATION INTEGRITY (SI) FAMILY
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('fedramp-moderate', 'SI-1', 'System and Information Integrity', 'Policy and Procedures', 'Develop, document, and disseminate a system and information integrity policy and procedures per FedRAMP requirements.', 'P1', 0, 1, 1, 1),
('fedramp-moderate', 'SI-2', 'System and Information Integrity', 'Flaw Remediation', 'Identify, report, and correct system flaws within FedRAMP-defined time periods based on severity.', 'P1', 0, 1, 1, 2),
('fedramp-moderate', 'SI-3', 'System and Information Integrity', 'Malicious Code Protection', 'Implement malicious code protection mechanisms at system entry and exit points per FedRAMP requirements.', 'P1', 0, 1, 1, 3),
('fedramp-moderate', 'SI-4', 'System and Information Integrity', 'System Monitoring', 'Monitor the system to detect attacks and unauthorized connections per FedRAMP continuous monitoring requirements.', 'P1', 0, 1, 1, 4),
('fedramp-moderate', 'SI-5', 'System and Information Integrity', 'Security Alerts, Advisories, and Directives', 'Receive and respond to security alerts and directives from FedRAMP, US-CERT, and other authoritative sources.', 'P1', 0, 1, 1, 5),
('fedramp-moderate', 'SI-7', 'System and Information Integrity', 'Software, Firmware, and Information Integrity', 'Employ integrity verification tools to detect unauthorized changes per FedRAMP integrity requirements.', 'P1', 0, 1, 1, 7),
('fedramp-moderate', 'SI-8', 'System and Information Integrity', 'Spam Protection', 'Employ spam protection mechanisms at system entry and exit points per FedRAMP requirements.', 'P2', 0, 1, 1, 8),
('fedramp-moderate', 'SI-10', 'System and Information Integrity', 'Information Input Validation', 'Check the validity of information inputs per FedRAMP input validation requirements.', 'P1', 0, 1, 1, 10),
('fedramp-moderate', 'SI-11', 'System and Information Integrity', 'Error Handling', 'Generate error messages that provide corrective information without revealing exploitable details per FedRAMP.', 'P2', 0, 1, 1, 11),
('fedramp-moderate', 'SI-12', 'System and Information Integrity', 'Information Management and Retention', 'Manage and retain information in accordance with FedRAMP and federal records management requirements.', 'P2', 0, 1, 1, 12),
('fedramp-moderate', 'SI-16', 'System and Information Integrity', 'Memory Protection', 'Implement controls to protect system memory from unauthorized code execution per FedRAMP requirements.', 'P1', 0, 1, 1, 16);

-- ============================================================================
-- HIPAA SECURITY RULE - EXPANDED SAFEGUARDS
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('hipaa', '164.308(a)(1)(ii)(A)', 'Administrative Safeguards', 'Risk Analysis', 'Conduct an accurate and thorough assessment of the potential risks and vulnerabilities to the confidentiality, integrity, and availability of ePHI.', 'P1', 1, 1, 1, 18),
('hipaa', '164.308(a)(1)(ii)(B)', 'Administrative Safeguards', 'Risk Management', 'Implement security measures sufficient to reduce risks and vulnerabilities to a reasonable and appropriate level.', 'P1', 1, 1, 1, 19),
('hipaa', '164.308(a)(1)(ii)(C)', 'Administrative Safeguards', 'Sanction Policy', 'Apply appropriate sanctions against workforce members who fail to comply with security policies and procedures.', 'P1', 1, 1, 1, 20),
('hipaa', '164.308(a)(1)(ii)(D)', 'Administrative Safeguards', 'Information System Activity Review', 'Implement procedures to regularly review records of information system activity such as audit logs, access reports, and security incident tracking reports.', 'P1', 1, 1, 1, 21),
('hipaa', '164.308(a)(3)(ii)(A)', 'Administrative Safeguards', 'Authorization and/or Supervision', 'Implement procedures for the authorization and/or supervision of workforce members who work with ePHI.', 'P1', 1, 1, 1, 22),
('hipaa', '164.308(a)(3)(ii)(B)', 'Administrative Safeguards', 'Workforce Clearance Procedure', 'Implement procedures to determine that the access of a workforce member to ePHI is appropriate.', 'P1', 1, 1, 1, 23),
('hipaa', '164.308(a)(3)(ii)(C)', 'Administrative Safeguards', 'Termination Procedures', 'Implement procedures for terminating access to ePHI when employment or access arrangement ends.', 'P1', 1, 1, 1, 24),
('hipaa', '164.308(a)(4)(ii)(B)', 'Administrative Safeguards', 'Access Authorization', 'Implement policies and procedures for granting access to ePHI through workstation, program, process, or other mechanism.', 'P1', 1, 1, 1, 25),
('hipaa', '164.308(a)(4)(ii)(C)', 'Administrative Safeguards', 'Access Establishment and Modification', 'Implement policies and procedures that establish, document, review, and modify access rights to workstations, transactions, programs, or processes.', 'P1', 1, 1, 1, 26),
('hipaa', '164.308(a)(5)(ii)(A)', 'Administrative Safeguards', 'Security Reminders', 'Provide periodic security updates and reminders to workforce members on security policies and procedures.', 'P1', 1, 1, 1, 27),
('hipaa', '164.308(a)(5)(ii)(B)', 'Administrative Safeguards', 'Protection from Malicious Software', 'Implement procedures for guarding against, detecting, and reporting malicious software.', 'P1', 1, 1, 1, 28),
('hipaa', '164.308(a)(5)(ii)(C)', 'Administrative Safeguards', 'Log-in Monitoring', 'Implement procedures for monitoring log-in attempts and reporting discrepancies.', 'P1', 1, 1, 1, 29),
('hipaa', '164.308(a)(5)(ii)(D)', 'Administrative Safeguards', 'Password Management', 'Implement procedures for creating, changing, and safeguarding passwords.', 'P1', 1, 1, 1, 30),
('hipaa', '164.308(a)(6)(ii)', 'Administrative Safeguards', 'Response and Reporting', 'Identify and respond to suspected or known security incidents; mitigate harmful effects and document incidents and outcomes.', 'P1', 1, 1, 1, 31),
('hipaa', '164.308(a)(7)(ii)(A)', 'Administrative Safeguards', 'Data Backup Plan', 'Establish and implement procedures to create and maintain retrievable exact copies of ePHI.', 'P1', 1, 1, 1, 32),
('hipaa', '164.308(a)(7)(ii)(B)', 'Administrative Safeguards', 'Disaster Recovery Plan', 'Establish and implement procedures to restore any loss of data from a disaster.', 'P1', 1, 1, 1, 33),
('hipaa', '164.308(a)(7)(ii)(C)', 'Administrative Safeguards', 'Emergency Mode Operation Plan', 'Establish and implement procedures to enable continuation of critical business processes during an emergency.', 'P1', 1, 1, 1, 34),
('hipaa', '164.308(a)(7)(ii)(D)', 'Administrative Safeguards', 'Testing and Revision Procedures', 'Implement procedures for periodic testing and revision of contingency plans.', 'P1', 1, 1, 1, 35),
('hipaa', '164.308(a)(7)(ii)(E)', 'Administrative Safeguards', 'Applications and Data Criticality Analysis', 'Assess the relative criticality of specific applications and data in support of contingency plan components.', 'P1', 1, 1, 1, 36),
('hipaa', '164.308(b)(1)', 'Administrative Safeguards', 'Business Associate Contracts', 'Obtain satisfactory assurances from business associates regarding safeguarding ePHI through written contracts.', 'P1', 1, 1, 1, 37),
('hipaa', '164.310(a)(2)(i)', 'Physical Safeguards', 'Contingency Operations', 'Establish procedures that allow facility access in support of restoration of data under the disaster recovery and emergency mode operations plans.', 'P1', 1, 1, 1, 38),
('hipaa', '164.310(a)(2)(ii)', 'Physical Safeguards', 'Facility Security Plan', 'Implement policies and procedures to safeguard the facility and equipment therein from unauthorized physical access, tampering, and theft.', 'P1', 1, 1, 1, 39),
('hipaa', '164.310(a)(2)(iii)', 'Physical Safeguards', 'Access Control and Validation Procedures', 'Implement procedures to control and validate physical access to facilities based on role or function.', 'P1', 1, 1, 1, 40),
('hipaa', '164.310(a)(2)(iv)', 'Physical Safeguards', 'Maintenance Records', 'Implement policies and procedures to document repairs and modifications to physical components of a facility related to security.', 'P1', 1, 1, 1, 41),
('hipaa', '164.312(a)(2)(i)', 'Technical Safeguards', 'Unique User Identification', 'Assign a unique name and/or number for identifying and tracking user identity.', 'P1', 1, 1, 1, 42),
('hipaa', '164.312(a)(2)(ii)', 'Technical Safeguards', 'Emergency Access Procedure', 'Establish and implement procedures for obtaining necessary ePHI during an emergency.', 'P1', 1, 1, 1, 43),
('hipaa', '164.312(a)(2)(iii)', 'Technical Safeguards', 'Automatic Logoff', 'Implement electronic procedures that terminate an electronic session after a predetermined time of inactivity.', 'P1', 1, 1, 1, 44),
('hipaa', '164.312(a)(2)(iv)', 'Technical Safeguards', 'Encryption and Decryption', 'Implement a mechanism to encrypt and decrypt ePHI.', 'P1', 1, 1, 1, 45),
('hipaa', '164.312(c)(2)', 'Technical Safeguards', 'Mechanism to Authenticate ePHI', 'Implement electronic mechanisms to corroborate that ePHI has not been altered or destroyed in an unauthorized manner.', 'P1', 1, 1, 1, 46),
('hipaa', '164.312(e)(2)(i)', 'Technical Safeguards', 'Integrity Controls', 'Implement security measures to ensure that electronically transmitted ePHI is not improperly modified without detection.', 'P1', 1, 1, 1, 47),
('hipaa', '164.312(e)(2)(ii)', 'Technical Safeguards', 'Encryption', 'Implement a mechanism to encrypt ePHI whenever deemed appropriate during transmission.', 'P1', 1, 1, 1, 48),
('hipaa', '164.314(a)(1)', 'Organizational Requirements', 'Business Associate Contracts or Other Arrangements', 'Ensure satisfactory assurances from business associates that they will appropriately safeguard ePHI.', 'P1', 1, 1, 1, 49),
('hipaa', '164.316(a)', 'Documentation Requirements', 'Policies and Procedures', 'Implement reasonable and appropriate policies and procedures to comply with the Security Rule standards and implementation specifications.', 'P1', 1, 1, 1, 50),
('hipaa', '164.316(b)(1)', 'Documentation Requirements', 'Documentation', 'Maintain written policies and procedures and written records of required actions, activities, or assessments.', 'P1', 1, 1, 1, 51),
('hipaa', '164.316(b)(2)(i)', 'Documentation Requirements', 'Time Limit', 'Retain required documentation for 6 years from the date of creation or the date when it was last in effect.', 'P1', 1, 1, 1, 52),
('hipaa', '164.316(b)(2)(ii)', 'Documentation Requirements', 'Availability', 'Make documentation available to those persons responsible for implementing applicable policies and procedures.', 'P1', 1, 1, 1, 53),
('hipaa', '164.316(b)(2)(iii)', 'Documentation Requirements', 'Updates', 'Review and update documentation periodically in response to environmental or operational changes.', 'P1', 1, 1, 1, 54);

-- ============================================================================
-- SOC 2 TYPE II - EXPANDED TRUST SERVICE CRITERIA
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('soc2-type2', 'CC1.4', 'Control Environment', 'COSO Principle 4', 'The entity demonstrates a commitment to attract, develop, and retain competent individuals in alignment with objectives.', 'P1', 1, 1, 1, 20),
('soc2-type2', 'CC1.5', 'Control Environment', 'COSO Principle 5', 'The entity holds individuals accountable for their internal control responsibilities in pursuit of objectives.', 'P1', 1, 1, 1, 21),
('soc2-type2', 'CC2.2', 'Communication and Information', 'COSO Principle 14', 'The entity internally communicates information, including objectives and responsibilities for internal control.', 'P1', 1, 1, 1, 22),
('soc2-type2', 'CC2.3', 'Communication and Information', 'COSO Principle 15', 'The entity communicates with external parties regarding matters affecting the functioning of internal control.', 'P1', 1, 1, 1, 23),
('soc2-type2', 'CC3.3', 'Risk Assessment', 'COSO Principle 8', 'The entity considers the potential for fraud in assessing risks to the achievement of objectives.', 'P1', 1, 1, 1, 24),
('soc2-type2', 'CC3.4', 'Risk Assessment', 'COSO Principle 9', 'The entity identifies and assesses changes that could significantly impact the system of internal control.', 'P1', 1, 1, 1, 25),
('soc2-type2', 'CC4.2', 'Monitoring Activities', 'COSO Principle 17', 'The entity evaluates and communicates internal control deficiencies in a timely manner to responsible parties.', 'P1', 1, 1, 1, 26),
('soc2-type2', 'CC5.3', 'Control Activities', 'COSO Principle 12', 'The entity deploys control activities through policies that establish expectations and procedures that put policies into action.', 'P1', 1, 1, 1, 27),
('soc2-type2', 'CC6.4', 'Logical and Physical Access Controls', 'Physical Access Restriction', 'The entity restricts physical access to facilities and protected information assets to authorized personnel.', 'P1', 1, 1, 1, 28),
('soc2-type2', 'CC6.5', 'Logical and Physical Access Controls', 'Access Retirement', 'The entity discontinues logical and physical protections over physical assets only after the ability to read or recover data has been diminished.', 'P1', 1, 1, 1, 29),
('soc2-type2', 'CC6.7', 'Logical and Physical Access Controls', 'Data Transmission Security', 'The entity restricts the transmission, movement, and removal of information to authorized internal and external users and processes.', 'P1', 1, 1, 1, 30),
('soc2-type2', 'CC6.8', 'Logical and Physical Access Controls', 'Malicious Software Prevention', 'The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software.', 'P1', 1, 1, 1, 31),
('soc2-type2', 'CC7.5', 'System Operations', 'Incident Recovery', 'The entity identifies, develops, and implements activities to recover from identified security incidents.', 'P1', 1, 1, 1, 32),
('soc2-type2', 'CC9.2', 'Risk Mitigation', 'Vendor and Business Partner Risk', 'The entity assesses and manages risks associated with vendors and business partners.', 'P1', 1, 1, 1, 33),
('soc2-type2', 'A1.1', 'Availability', 'System Capacity', 'The entity maintains, monitors, and evaluates current processing capacity and use of system components.', 'P1', 1, 1, 1, 34),
('soc2-type2', 'A1.2', 'Availability', 'Recovery Operations', 'The entity authorizes, designs, develops or acquires, implements, operates, approves, maintains, and monitors environmental protections and recovery infrastructure.', 'P1', 1, 1, 1, 35),
('soc2-type2', 'A1.3', 'Availability', 'Recovery Testing', 'The entity tests recovery plan procedures supporting system recovery to meet its objectives.', 'P1', 1, 1, 1, 36),
('soc2-type2', 'C1.1', 'Confidentiality', 'Confidential Information Identification', 'The entity identifies and maintains confidential information to meet the entity''s objectives related to confidentiality.', 'P1', 1, 1, 1, 37),
('soc2-type2', 'C1.2', 'Confidentiality', 'Confidential Information Disposal', 'The entity disposes of confidential information to meet the entity''s objectives related to confidentiality.', 'P1', 1, 1, 1, 38),
('soc2-type2', 'PI1.1', 'Processing Integrity', 'Processing Accuracy', 'The entity implements policies and procedures over system processing to result in products, services, and reporting to meet the entity''s objectives.', 'P1', 1, 1, 1, 39),
('soc2-type2', 'PI1.2', 'Processing Integrity', 'System Inputs', 'The entity implements policies and procedures over system inputs that result in products, services, and reporting to meet the entity''s objectives.', 'P1', 1, 1, 1, 40),
('soc2-type2', 'PI1.3', 'Processing Integrity', 'System Outputs', 'The entity implements policies and procedures over system processing to ensure the completeness, accuracy, and timeliness of system outputs.', 'P1', 1, 1, 1, 41),
('soc2-type2', 'P1.1', 'Privacy', 'Privacy Notice', 'The entity provides notice to data subjects about its privacy practices to meet its objectives related to privacy.', 'P1', 1, 1, 1, 42),
('soc2-type2', 'P1.2', 'Privacy', 'Choice and Consent', 'The entity communicates choices available regarding the collection, use, retention, disclosure, and disposal of personal information.', 'P1', 1, 1, 1, 43),
('soc2-type2', 'P1.3', 'Privacy', 'Personal Information Collection', 'The entity collects personal information consistent with its privacy commitments and system requirements.', 'P1', 1, 1, 1, 44),
('soc2-type2', 'P1.4', 'Privacy', 'Personal Information Use', 'The entity limits the use of personal information to the purposes identified in the entity''s objectives related to privacy.', 'P1', 1, 1, 1, 45),
('soc2-type2', 'P1.5', 'Privacy', 'Personal Information Retention', 'The entity retains personal information consistent with the entity''s objectives related to privacy.', 'P1', 1, 1, 1, 46),
('soc2-type2', 'P1.6', 'Privacy', 'Personal Information Disposal', 'The entity securely disposes of personal information to meet the entity''s objectives related to privacy.', 'P1', 1, 1, 1, 47),
('soc2-type2', 'P1.7', 'Privacy', 'Data Quality', 'The entity collects and maintains accurate, up-to-date, complete, and relevant personal information.', 'P1', 1, 1, 1, 48),
('soc2-type2', 'P1.8', 'Privacy', 'Data Subject Rights', 'The entity provides data subjects with access to their personal information for review and correction.', 'P1', 1, 1, 1, 49);

-- ============================================================================
-- CMMC LEVEL 2 - ALL REMAINING PRACTICES
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
-- Access Control (remaining)
('cmmc-l2', 'AC.L2-3.1.6', 'Access Control', 'Non-Privileged Account Use', 'Use non-privileged accounts or roles when accessing nonsecurity functions.', 'P1', 1, 1, 1, 6),
('cmmc-l2', 'AC.L2-3.1.9', 'Access Control', 'Privacy and Security Notices', 'Provide privacy and security notices consistent with applicable CUI rules.', 'P1', 1, 1, 1, 9),
('cmmc-l2', 'AC.L2-3.1.10', 'Access Control', 'Session Lock', 'Use session lock with pattern-hiding displays to prevent access and viewing of data after a period of inactivity.', 'P1', 1, 1, 1, 10),
('cmmc-l2', 'AC.L2-3.1.11', 'Access Control', 'Session Termination', 'Terminate (automatically) a user session after a defined condition.', 'P1', 1, 1, 1, 11),
('cmmc-l2', 'AC.L2-3.1.13', 'Access Control', 'Remote Access Encryption', 'Employ cryptographic mechanisms to protect the confidentiality of remote access sessions.', 'P1', 1, 1, 1, 13),
('cmmc-l2', 'AC.L2-3.1.14', 'Access Control', 'Remote Access Routing', 'Route remote access via managed access control points.', 'P1', 1, 1, 1, 14),
('cmmc-l2', 'AC.L2-3.1.15', 'Access Control', 'Privileged Remote Access', 'Authorize remote execution of privileged commands and remote access to security-relevant information.', 'P1', 1, 1, 1, 15),
('cmmc-l2', 'AC.L2-3.1.16', 'Access Control', 'Wireless Access Authorization', 'Authorize wireless access prior to allowing such connections.', 'P1', 1, 1, 1, 16),
('cmmc-l2', 'AC.L2-3.1.17', 'Access Control', 'Wireless Access Protection', 'Protect wireless access using authentication and encryption.', 'P1', 1, 1, 1, 17),
('cmmc-l2', 'AC.L2-3.1.18', 'Access Control', 'Mobile Device Connection', 'Control connection of mobile devices.', 'P1', 1, 1, 1, 18),
('cmmc-l2', 'AC.L2-3.1.19', 'Access Control', 'CUI Encryption on Mobile', 'Encrypt CUI on mobile devices and mobile computing platforms.', 'P1', 1, 1, 1, 19),
('cmmc-l2', 'AC.L2-3.1.21', 'Access Control', 'Portable Storage Use', 'Limit use of portable storage devices on external systems.', 'P1', 1, 1, 1, 21),
('cmmc-l2', 'AC.L2-3.1.22', 'Access Control', 'Publicly Accessible Content', 'Control information posted or processed on publicly accessible systems.', 'P1', 1, 1, 1, 22),
-- Awareness and Training
('cmmc-l2', 'AT.L2-3.2.1', 'Awareness and Training', 'Role-Based Risk Awareness', 'Ensure that managers, systems administrators, and users of organizational systems are made aware of the security risks associated with their activities.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'AT.L2-3.2.2', 'Awareness and Training', 'Role-Based Training', 'Ensure that personnel are trained to carry out their assigned information security-related duties and responsibilities.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'AT.L2-3.2.3', 'Awareness and Training', 'Insider Threat Awareness', 'Provide security awareness training on recognizing and reporting potential indicators of insider threat.', 'P1', 1, 1, 1, 3),
-- Audit and Accountability
('cmmc-l2', 'AU.L2-3.3.1', 'Audit and Accountability', 'System Auditing', 'Create and retain system audit logs and records to the extent needed to enable the monitoring, analysis, investigation, and reporting of unlawful or unauthorized system activity.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'AU.L2-3.3.2', 'Audit and Accountability', 'User Accountability', 'Ensure that the actions of individual system users can be uniquely traced to those users so they can be held accountable.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'AU.L2-3.3.3', 'Audit and Accountability', 'Event Review', 'Review and update logged events.', 'P1', 1, 1, 1, 3),
('cmmc-l2', 'AU.L2-3.3.4', 'Audit and Accountability', 'Audit Failure Alerting', 'Alert in the event of an audit logging process failure.', 'P1', 1, 1, 1, 4),
('cmmc-l2', 'AU.L2-3.3.5', 'Audit and Accountability', 'Audit Correlation', 'Correlate audit record review, analysis, and reporting processes for investigation and response to indications of unlawful activity.', 'P1', 1, 1, 1, 5),
('cmmc-l2', 'AU.L2-3.3.6', 'Audit and Accountability', 'Audit Reduction and Reporting', 'Provide audit record reduction and report generation to support on-demand analysis and reporting.', 'P1', 1, 1, 1, 6),
('cmmc-l2', 'AU.L2-3.3.7', 'Audit and Accountability', 'Authoritative Time Source', 'Provide a system capability that compares and synchronizes internal system clocks with an authoritative source.', 'P1', 1, 1, 1, 7),
('cmmc-l2', 'AU.L2-3.3.8', 'Audit and Accountability', 'Audit Protection', 'Protect audit information and audit logging tools from unauthorized access, modification, and deletion.', 'P1', 1, 1, 1, 8),
('cmmc-l2', 'AU.L2-3.3.9', 'Audit and Accountability', 'Audit Management', 'Limit management of audit logging functionality to a subset of privileged users.', 'P1', 1, 1, 1, 9),
-- Configuration Management
('cmmc-l2', 'CM.L2-3.4.1', 'Configuration Management', 'System Baselining', 'Establish and maintain baseline configurations and inventories of organizational systems throughout the system development life cycle.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'CM.L2-3.4.2', 'Configuration Management', 'Security Configuration Enforcement', 'Establish and enforce security configuration settings for information technology products employed in organizational systems.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'CM.L2-3.4.3', 'Configuration Management', 'System Change Management', 'Track, review, approve or disapprove, and log changes to organizational systems.', 'P1', 1, 1, 1, 3),
('cmmc-l2', 'CM.L2-3.4.4', 'Configuration Management', 'Impact Analysis', 'Analyze the security impact of changes prior to implementation.', 'P1', 1, 1, 1, 4),
('cmmc-l2', 'CM.L2-3.4.5', 'Configuration Management', 'Access Restrictions for Change', 'Define, document, approve, and enforce physical and logical access restrictions associated with changes to organizational systems.', 'P1', 1, 1, 1, 5),
('cmmc-l2', 'CM.L2-3.4.6', 'Configuration Management', 'Least Functionality', 'Employ the principle of least functionality by configuring organizational systems to provide only essential capabilities.', 'P1', 1, 1, 1, 6),
('cmmc-l2', 'CM.L2-3.4.7', 'Configuration Management', 'Nonessential Functionality', 'Restrict, disable, or prevent the use of nonessential programs, functions, ports, protocols, and services.', 'P1', 1, 1, 1, 7),
('cmmc-l2', 'CM.L2-3.4.8', 'Configuration Management', 'Application Execution Policy', 'Apply deny-by-exception policy to prevent the use of unauthorized software.', 'P1', 1, 1, 1, 8),
('cmmc-l2', 'CM.L2-3.4.9', 'Configuration Management', 'User-Installed Software', 'Control and monitor user-installed software.', 'P1', 1, 1, 1, 9),
-- Identification and Authentication
('cmmc-l2', 'IA.L2-3.5.1', 'Identification and Authentication', 'Identification', 'Identify system users, processes acting on behalf of users, and devices.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'IA.L2-3.5.2', 'Identification and Authentication', 'Authentication', 'Authenticate (or verify) the identities of users, processes, or devices, as a prerequisite to allowing access.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'IA.L2-3.5.3', 'Identification and Authentication', 'Multifactor Authentication', 'Use multifactor authentication for local and network access to privileged accounts and for network access to non-privileged accounts.', 'P1', 1, 1, 1, 3),
('cmmc-l2', 'IA.L2-3.5.4', 'Identification and Authentication', 'Replay-Resistant Authentication', 'Employ replay-resistant authentication mechanisms for network access to privileged and non-privileged accounts.', 'P1', 1, 1, 1, 4),
('cmmc-l2', 'IA.L2-3.5.5', 'Identification and Authentication', 'Identifier Reuse Prevention', 'Prevent reuse of identifiers for a defined period.', 'P1', 1, 1, 1, 5),
('cmmc-l2', 'IA.L2-3.5.6', 'Identification and Authentication', 'Identifier Inactivity', 'Disable identifiers after a defined period of inactivity.', 'P1', 1, 1, 1, 6),
('cmmc-l2', 'IA.L2-3.5.7', 'Identification and Authentication', 'Password Complexity', 'Enforce a minimum password complexity and change of characters when new passwords are created.', 'P1', 1, 1, 1, 7),
('cmmc-l2', 'IA.L2-3.5.8', 'Identification and Authentication', 'Password Reuse', 'Prohibit password reuse for a specified number of generations.', 'P1', 1, 1, 1, 8),
('cmmc-l2', 'IA.L2-3.5.9', 'Identification and Authentication', 'Temporary Passwords', 'Allow temporary password use for system logons with an immediate change to a permanent password.', 'P1', 1, 1, 1, 9),
('cmmc-l2', 'IA.L2-3.5.10', 'Identification and Authentication', 'Cryptographic Password Storage', 'Store and transmit only cryptographically-protected passwords.', 'P1', 1, 1, 1, 10),
('cmmc-l2', 'IA.L2-3.5.11', 'Identification and Authentication', 'Obscure Feedback', 'Obscure feedback of authentication information.', 'P1', 1, 1, 1, 11),
-- Incident Response
('cmmc-l2', 'IR.L2-3.6.1', 'Incident Response', 'Incident Handling', 'Establish an operational incident-handling capability for organizational systems that includes preparation, detection, analysis, containment, recovery, and user response activities.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'IR.L2-3.6.2', 'Incident Response', 'Incident Reporting', 'Track, document, and report incidents to designated officials and/or authorities both internal and external to the organization.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'IR.L2-3.6.3', 'Incident Response', 'Incident Response Testing', 'Test the organizational incident response capability.', 'P1', 1, 1, 1, 3),
-- Maintenance
('cmmc-l2', 'MA.L2-3.7.1', 'Maintenance', 'System Maintenance', 'Perform maintenance on organizational systems.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'MA.L2-3.7.2', 'Maintenance', 'Maintenance Control', 'Provide controls on the tools, techniques, mechanisms, and personnel used to conduct system maintenance.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'MA.L2-3.7.3', 'Maintenance', 'Equipment Sanitization', 'Ensure equipment removed for off-site maintenance is sanitized of any CUI.', 'P1', 1, 1, 1, 3),
('cmmc-l2', 'MA.L2-3.7.4', 'Maintenance', 'Media Inspection', 'Check media containing diagnostic and test programs for malicious code before use on organizational systems.', 'P1', 1, 1, 1, 4),
('cmmc-l2', 'MA.L2-3.7.5', 'Maintenance', 'Nonlocal Maintenance', 'Require multifactor authentication to establish nonlocal maintenance sessions and terminate such sessions when nonlocal maintenance is complete.', 'P1', 1, 1, 1, 5),
('cmmc-l2', 'MA.L2-3.7.6', 'Maintenance', 'Maintenance Personnel', 'Supervise the maintenance activities of maintenance personnel without required access authorization.', 'P1', 1, 1, 1, 6),
-- Media Protection
('cmmc-l2', 'MP.L2-3.8.1', 'Media Protection', 'Media Protection', 'Protect (i.e., physically control and securely store) system media containing CUI, both paper and digital.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'MP.L2-3.8.2', 'Media Protection', 'Media Access', 'Limit access to CUI on system media to authorized users.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'MP.L2-3.8.3', 'Media Protection', 'Media Sanitization', 'Sanitize or destroy system media containing CUI before disposal or release for reuse.', 'P1', 1, 1, 1, 3),
('cmmc-l2', 'MP.L2-3.8.4', 'Media Protection', 'Media Marking', 'Mark media with necessary CUI markings and distribution limitations.', 'P1', 1, 1, 1, 4),
('cmmc-l2', 'MP.L2-3.8.5', 'Media Protection', 'Media Accountability', 'Control access to media containing CUI and maintain accountability for media during transport outside of controlled areas.', 'P1', 1, 1, 1, 5),
('cmmc-l2', 'MP.L2-3.8.6', 'Media Protection', 'Portable Storage Encryption', 'Implement cryptographic mechanisms to protect the confidentiality of CUI stored on digital media during transport.', 'P1', 1, 1, 1, 6),
('cmmc-l2', 'MP.L2-3.8.7', 'Media Protection', 'Removable Media Use', 'Control the use of removable media on system components.', 'P1', 1, 1, 1, 7),
('cmmc-l2', 'MP.L2-3.8.8', 'Media Protection', 'Shared Media', 'Prohibit the use of portable storage devices when such devices have no identifiable owner.', 'P1', 1, 1, 1, 8),
('cmmc-l2', 'MP.L2-3.8.9', 'Media Protection', 'CUI Backup Protection', 'Protect the confidentiality of backup CUI at storage locations.', 'P1', 1, 1, 1, 9),
-- Personnel Security
('cmmc-l2', 'PS.L2-3.9.1', 'Personnel Security', 'Personnel Screening', 'Screen individuals prior to authorizing access to organizational systems containing CUI.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'PS.L2-3.9.2', 'Personnel Security', 'Personnel Actions', 'Ensure that organizational systems containing CUI are protected during and after personnel actions such as terminations and transfers.', 'P1', 1, 1, 1, 2),
-- Physical Protection
('cmmc-l2', 'PE.L2-3.10.1', 'Physical Protection', 'Physical Access Limits', 'Limit physical access to organizational systems, equipment, and the respective operating environments to authorized individuals.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'PE.L2-3.10.2', 'Physical Protection', 'Physical Access Monitoring', 'Protect and monitor the physical facility and support infrastructure for organizational systems.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'PE.L2-3.10.3', 'Physical Protection', 'Escort Visitors', 'Escort visitors and monitor visitor activity.', 'P1', 1, 1, 1, 3),
('cmmc-l2', 'PE.L2-3.10.4', 'Physical Protection', 'Physical Access Logs', 'Maintain audit logs of physical access.', 'P1', 1, 1, 1, 4),
('cmmc-l2', 'PE.L2-3.10.5', 'Physical Protection', 'Physical Access Devices', 'Control and manage physical access devices.', 'P1', 1, 1, 1, 5),
('cmmc-l2', 'PE.L2-3.10.6', 'Physical Protection', 'Alternative Work Sites', 'Enforce safeguarding measures for CUI at alternative work sites.', 'P1', 1, 1, 1, 6),
-- Risk Assessment
('cmmc-l2', 'RA.L2-3.11.1', 'Risk Assessment', 'Risk Assessments', 'Periodically assess the risk to organizational operations, assets, and individuals resulting from the operation of organizational systems and the processing, storage, or transmission of CUI.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'RA.L2-3.11.2', 'Risk Assessment', 'Vulnerability Scanning', 'Scan for vulnerabilities in organizational systems and applications periodically and when new vulnerabilities affecting those systems are identified.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'RA.L2-3.11.3', 'Risk Assessment', 'Vulnerability Remediation', 'Remediate vulnerabilities in accordance with risk assessments.', 'P1', 1, 1, 1, 3),
-- Security Assessment
('cmmc-l2', 'CA.L2-3.12.1', 'Security Assessment', 'Security Control Assessment', 'Periodically assess the security controls in organizational systems to determine if the controls are effective in their application.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'CA.L2-3.12.2', 'Security Assessment', 'Plan of Action', 'Develop and implement plans of action designed to correct deficiencies and reduce or eliminate vulnerabilities in organizational systems.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'CA.L2-3.12.3', 'Security Assessment', 'Security Control Monitoring', 'Monitor security controls on an ongoing basis to ensure the continued effectiveness of the controls.', 'P1', 1, 1, 1, 3),
('cmmc-l2', 'CA.L2-3.12.4', 'Security Assessment', 'System Security Plan', 'Develop, document, and periodically update system security plans that describe system boundaries, system environments, how security requirements are implemented, and relationships with other systems.', 'P1', 1, 1, 1, 4),
-- System and Communications Protection
('cmmc-l2', 'SC.L2-3.13.1', 'System and Communications Protection', 'Boundary Protection', 'Monitor, control, and protect communications at the external boundaries and key internal boundaries of organizational systems.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'SC.L2-3.13.2', 'System and Communications Protection', 'Security Architecture', 'Employ architectural designs, software development techniques, and systems engineering principles that promote effective information security.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'SC.L2-3.13.3', 'System and Communications Protection', 'Role Separation', 'Separate user functionality from system management functionality.', 'P1', 1, 1, 1, 3),
('cmmc-l2', 'SC.L2-3.13.4', 'System and Communications Protection', 'Shared Resource Control', 'Prevent unauthorized and unintended information transfer via shared system resources.', 'P1', 1, 1, 1, 4),
('cmmc-l2', 'SC.L2-3.13.5', 'System and Communications Protection', 'Public Access Separation', 'Implement subnetworks for publicly accessible system components that are physically or logically separated from internal networks.', 'P1', 1, 1, 1, 5),
('cmmc-l2', 'SC.L2-3.13.6', 'System and Communications Protection', 'Network Communication by Exception', 'Deny network communications traffic by default and allow by exception.', 'P1', 1, 1, 1, 6),
('cmmc-l2', 'SC.L2-3.13.7', 'System and Communications Protection', 'Split Tunneling', 'Prevent remote devices from simultaneously establishing non-remote connections and connections to the organizational system.', 'P1', 1, 1, 1, 7),
('cmmc-l2', 'SC.L2-3.13.8', 'System and Communications Protection', 'CUI Encryption in Transit', 'Implement cryptographic mechanisms to prevent unauthorized disclosure of CUI during transmission.', 'P1', 1, 1, 1, 8),
('cmmc-l2', 'SC.L2-3.13.9', 'System and Communications Protection', 'Network Disconnect', 'Terminate network connections associated with communications sessions at the end of the sessions or after a defined period of inactivity.', 'P1', 1, 1, 1, 9),
('cmmc-l2', 'SC.L2-3.13.10', 'System and Communications Protection', 'Cryptographic Key Management', 'Establish and manage cryptographic keys for cryptography employed in organizational systems.', 'P1', 1, 1, 1, 10),
('cmmc-l2', 'SC.L2-3.13.11', 'System and Communications Protection', 'CUI Encryption at Rest', 'Employ FIPS-validated cryptography when used to protect the confidentiality of CUI.', 'P1', 1, 1, 1, 11),
('cmmc-l2', 'SC.L2-3.13.12', 'System and Communications Protection', 'Collaborative Device Control', 'Prohibit remote activation of collaborative computing devices and provide indication of devices in use to users present at the device.', 'P1', 1, 1, 1, 12),
('cmmc-l2', 'SC.L2-3.13.13', 'System and Communications Protection', 'Mobile Code', 'Control and monitor the use of mobile code.', 'P1', 1, 1, 1, 13),
('cmmc-l2', 'SC.L2-3.13.14', 'System and Communications Protection', 'VoIP', 'Control and monitor the use of Voice over Internet Protocol technologies.', 'P1', 1, 1, 1, 14),
('cmmc-l2', 'SC.L2-3.13.15', 'System and Communications Protection', 'Communications Authenticity', 'Protect the authenticity of communications sessions.', 'P1', 1, 1, 1, 15),
('cmmc-l2', 'SC.L2-3.13.16', 'System and Communications Protection', 'Data at Rest Protection', 'Protect the confidentiality of CUI at rest.', 'P1', 1, 1, 1, 16),
-- System and Information Integrity
('cmmc-l2', 'SI.L2-3.14.1', 'System and Information Integrity', 'Flaw Remediation', 'Identify, report, and correct system flaws in a timely manner.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'SI.L2-3.14.2', 'System and Information Integrity', 'Malicious Code Protection', 'Provide protection from malicious code at designated locations within organizational systems.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'SI.L2-3.14.3', 'System and Information Integrity', 'Security Alerts', 'Monitor system security alerts and advisories and take action in response.', 'P1', 1, 1, 1, 3),
('cmmc-l2', 'SI.L2-3.14.4', 'System and Information Integrity', 'Update Malicious Code Protection', 'Update malicious code protection mechanisms when new releases are available.', 'P1', 1, 1, 1, 4),
('cmmc-l2', 'SI.L2-3.14.5', 'System and Information Integrity', 'System and File Scanning', 'Perform periodic scans of organizational systems and real-time scans of files from external sources.', 'P1', 1, 1, 1, 5),
('cmmc-l2', 'SI.L2-3.14.6', 'System and Information Integrity', 'System Monitoring', 'Monitor organizational systems, including inbound and outbound communications traffic, to detect attacks and indicators of potential attacks.', 'P1', 1, 1, 1, 6),
('cmmc-l2', 'SI.L2-3.14.7', 'System and Information Integrity', 'Unauthorized Use Detection', 'Identify unauthorized use of organizational systems.', 'P1', 1, 1, 1, 7);

-- ============================================================================
-- ISO 27001:2022 ANNEX A CONTROLS
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
-- Organizational Controls
('iso-27001', 'A.5.1', 'Organizational Controls', 'Policies for Information Security', 'Management direction and support for information security through policies, review, and approval.', 'P1', 1, 1, 1, 1),
('iso-27001', 'A.5.2', 'Organizational Controls', 'Information Security Roles', 'Define and allocate information security roles and responsibilities.', 'P1', 1, 1, 1, 2),
('iso-27001', 'A.5.3', 'Organizational Controls', 'Segregation of Duties', 'Conflicting duties and areas of responsibility shall be segregated.', 'P1', 1, 1, 1, 3),
('iso-27001', 'A.5.4', 'Organizational Controls', 'Management Responsibilities', 'Management shall require all personnel to apply information security per established policies.', 'P1', 1, 1, 1, 4),
('iso-27001', 'A.5.5', 'Organizational Controls', 'Contact with Authorities', 'Establish and maintain appropriate contacts with relevant authorities.', 'P1', 1, 1, 1, 5),
('iso-27001', 'A.5.6', 'Organizational Controls', 'Contact with Special Interest Groups', 'Maintain appropriate contacts with special interest groups or security forums.', 'P1', 1, 1, 1, 6),
('iso-27001', 'A.5.7', 'Organizational Controls', 'Threat Intelligence', 'Collect and analyze information relating to information security threats.', 'P1', 1, 1, 1, 7),
('iso-27001', 'A.5.8', 'Organizational Controls', 'Information Security in Project Management', 'Integrate information security into project management practices.', 'P1', 1, 1, 1, 8),
('iso-27001', 'A.5.9', 'Organizational Controls', 'Inventory of Information Assets', 'Develop and maintain an inventory of information and other associated assets.', 'P1', 1, 1, 1, 9),
('iso-27001', 'A.5.10', 'Organizational Controls', 'Acceptable Use of Assets', 'Rules for acceptable use of information and assets shall be identified and documented.', 'P1', 1, 1, 1, 10),
('iso-27001', 'A.5.11', 'Organizational Controls', 'Return of Assets', 'Personnel and other interested parties shall return all organizational assets upon change or termination.', 'P1', 1, 1, 1, 11),
('iso-27001', 'A.5.12', 'Organizational Controls', 'Classification of Information', 'Information shall be classified according to information security needs based on confidentiality, integrity, and availability.', 'P1', 1, 1, 1, 12),
('iso-27001', 'A.5.13', 'Organizational Controls', 'Labelling of Information', 'Develop and implement appropriate set of procedures for information labelling.', 'P1', 1, 1, 1, 13),
('iso-27001', 'A.5.14', 'Organizational Controls', 'Information Transfer', 'Information transfer rules, procedures, or agreements shall be in place for all types of transfer.', 'P1', 1, 1, 1, 14),
('iso-27001', 'A.5.15', 'Organizational Controls', 'Access Control', 'Rules to control physical and logical access shall be established and implemented.', 'P1', 1, 1, 1, 15),
('iso-27001', 'A.5.16', 'Organizational Controls', 'Identity Management', 'The full life cycle of identities shall be managed.', 'P1', 1, 1, 1, 16),
('iso-27001', 'A.5.17', 'Organizational Controls', 'Authentication Information', 'Allocation and management of authentication information shall be controlled.', 'P1', 1, 1, 1, 17),
('iso-27001', 'A.5.18', 'Organizational Controls', 'Access Rights', 'Access rights to information shall be provisioned, reviewed, modified, and removed per policy.', 'P1', 1, 1, 1, 18),
('iso-27001', 'A.5.19', 'Organizational Controls', 'Supplier Relationships', 'Processes and procedures for managing information security risks with supplier relationships shall be defined.', 'P1', 1, 1, 1, 19),
('iso-27001', 'A.5.20', 'Organizational Controls', 'Supplier Agreements', 'Relevant information security requirements shall be established and agreed upon with suppliers.', 'P1', 1, 1, 1, 20),
('iso-27001', 'A.5.21', 'Organizational Controls', 'ICT Supply Chain', 'Processes for managing information security risks associated with the ICT supply chain shall be defined.', 'P1', 1, 1, 1, 21),
('iso-27001', 'A.5.22', 'Organizational Controls', 'Supplier Monitoring', 'Regularly monitor, review, and manage change to supplier information security practices.', 'P1', 1, 1, 1, 22),
('iso-27001', 'A.5.23', 'Organizational Controls', 'Cloud Services Security', 'Processes for acquisition, use, management, and exit from cloud services shall be established.', 'P1', 1, 1, 1, 23),
('iso-27001', 'A.5.24', 'Organizational Controls', 'Incident Management Planning', 'Plan and prepare for information security incident management by defining roles, responsibilities, and procedures.', 'P1', 1, 1, 1, 24),
('iso-27001', 'A.5.25', 'Organizational Controls', 'Security Event Assessment', 'Assess information security events and decide if they are to be categorized as incidents.', 'P1', 1, 1, 1, 25),
('iso-27001', 'A.5.26', 'Organizational Controls', 'Incident Response', 'Information security incidents shall be responded to in accordance with documented procedures.', 'P1', 1, 1, 1, 26),
('iso-27001', 'A.5.27', 'Organizational Controls', 'Learning from Incidents', 'Knowledge gained from information security incidents shall be used to strengthen and improve controls.', 'P1', 1, 1, 1, 27),
('iso-27001', 'A.5.28', 'Organizational Controls', 'Collection of Evidence', 'Procedures for identification, collection, acquisition, and preservation of evidence shall be established.', 'P1', 1, 1, 1, 28),
('iso-27001', 'A.5.29', 'Organizational Controls', 'Information Security During Disruption', 'Plan how to maintain information security at an appropriate level during disruption.', 'P1', 1, 1, 1, 29),
('iso-27001', 'A.5.30', 'Organizational Controls', 'ICT Readiness for Business Continuity', 'ICT readiness shall be planned, implemented, maintained, and tested based on business continuity objectives.', 'P1', 1, 1, 1, 30),
('iso-27001', 'A.5.31', 'Organizational Controls', 'Legal Requirements', 'Identify, document, and keep up to date legal, statutory, regulatory, and contractual requirements.', 'P1', 1, 1, 1, 31),
('iso-27001', 'A.5.32', 'Organizational Controls', 'Intellectual Property Rights', 'Implement appropriate procedures to protect intellectual property rights.', 'P1', 1, 1, 1, 32),
('iso-27001', 'A.5.33', 'Organizational Controls', 'Protection of Records', 'Records shall be protected from loss, destruction, falsification, unauthorized access, and unauthorized release.', 'P1', 1, 1, 1, 33),
('iso-27001', 'A.5.34', 'Organizational Controls', 'Privacy and PII Protection', 'Identify and meet requirements for preservation of privacy and protection of PII.', 'P1', 1, 1, 1, 34),
('iso-27001', 'A.5.35', 'Organizational Controls', 'Independent Review', 'The organization''s approach to managing information security shall be independently reviewed at planned intervals.', 'P1', 1, 1, 1, 35),
('iso-27001', 'A.5.36', 'Organizational Controls', 'Compliance with Policies', 'Compliance with the information security policy, topic-specific policies, rules, and standards shall be regularly reviewed.', 'P1', 1, 1, 1, 36),
('iso-27001', 'A.5.37', 'Organizational Controls', 'Documented Operating Procedures', 'Operating procedures for information processing facilities shall be documented and made available.', 'P1', 1, 1, 1, 37),
-- People Controls
('iso-27001', 'A.6.1', 'People Controls', 'Screening', 'Background verification checks on all candidates shall be carried out prior to joining the organization.', 'P1', 1, 1, 1, 38),
('iso-27001', 'A.6.2', 'People Controls', 'Terms and Conditions of Employment', 'Employment agreements shall state the employees'' and the organization''s information security responsibilities.', 'P1', 1, 1, 1, 39),
('iso-27001', 'A.6.3', 'People Controls', 'Information Security Awareness and Training', 'Personnel shall receive appropriate information security awareness education and training.', 'P1', 1, 1, 1, 40),
('iso-27001', 'A.6.4', 'People Controls', 'Disciplinary Process', 'A disciplinary process shall be formalized and communicated to take actions against personnel who violate policies.', 'P1', 1, 1, 1, 41),
('iso-27001', 'A.6.5', 'People Controls', 'Post-Employment Responsibilities', 'Information security responsibilities that remain valid after termination or change of employment shall be defined and enforced.', 'P1', 1, 1, 1, 42),
('iso-27001', 'A.6.6', 'People Controls', 'Confidentiality Agreements', 'Confidentiality or non-disclosure agreements reflecting the needs for protection of information shall be agreed upon.', 'P1', 1, 1, 1, 43),
('iso-27001', 'A.6.7', 'People Controls', 'Remote Working', 'Security measures shall be implemented when personnel are working remotely.', 'P1', 1, 1, 1, 44),
('iso-27001', 'A.6.8', 'People Controls', 'Information Security Event Reporting', 'Personnel shall report observed or suspected information security events through appropriate channels.', 'P1', 1, 1, 1, 45),
-- Physical Controls
('iso-27001', 'A.7.1', 'Physical Controls', 'Physical Security Perimeters', 'Security perimeters shall be defined and used to protect areas containing information and information processing facilities.', 'P1', 1, 1, 1, 46),
('iso-27001', 'A.7.2', 'Physical Controls', 'Physical Entry', 'Secure areas shall be protected by appropriate entry controls to ensure only authorized personnel are allowed access.', 'P1', 1, 1, 1, 47),
('iso-27001', 'A.7.3', 'Physical Controls', 'Securing Offices and Facilities', 'Physical security for offices, rooms, and facilities shall be designed and implemented.', 'P1', 1, 1, 1, 48),
('iso-27001', 'A.7.4', 'Physical Controls', 'Physical Security Monitoring', 'Premises shall be continuously monitored for unauthorized physical access.', 'P1', 1, 1, 1, 49),
('iso-27001', 'A.7.5', 'Physical Controls', 'Environmental Protection', 'Protection against physical and environmental threats such as natural disasters shall be designed and implemented.', 'P1', 1, 1, 1, 50),
('iso-27001', 'A.7.6', 'Physical Controls', 'Working in Secure Areas', 'Security measures for working in secure areas shall be designed and implemented.', 'P1', 1, 1, 1, 51),
('iso-27001', 'A.7.7', 'Physical Controls', 'Clear Desk and Clear Screen', 'Clear desk rules for papers and removable storage and clear screen rules for information processing facilities shall be defined.', 'P1', 1, 1, 1, 52),
('iso-27001', 'A.7.8', 'Physical Controls', 'Equipment Siting and Protection', 'Equipment shall be sited and protected to reduce risks from environmental threats and unauthorized access.', 'P1', 1, 1, 1, 53),
('iso-27001', 'A.7.9', 'Physical Controls', 'Security of Assets Off-Premises', 'Off-site assets shall be protected considering different risks of working outside organization premises.', 'P1', 1, 1, 1, 54),
('iso-27001', 'A.7.10', 'Physical Controls', 'Storage Media', 'Storage media shall be managed through their life cycle of acquisition, use, transportation, and disposal.', 'P1', 1, 1, 1, 55),
('iso-27001', 'A.7.11', 'Physical Controls', 'Supporting Utilities', 'Information processing facilities shall be protected from power failures and other disruptions caused by failures in supporting utilities.', 'P1', 1, 1, 1, 56),
('iso-27001', 'A.7.12', 'Physical Controls', 'Cabling Security', 'Cables carrying power, data, or supporting information services shall be protected from interception and damage.', 'P1', 1, 1, 1, 57),
('iso-27001', 'A.7.13', 'Physical Controls', 'Equipment Maintenance', 'Equipment shall be maintained correctly to ensure availability, integrity, and confidentiality of information.', 'P1', 1, 1, 1, 58),
('iso-27001', 'A.7.14', 'Physical Controls', 'Secure Disposal', 'Items of equipment containing storage media shall be verified to ensure that any sensitive data has been removed or overwritten.', 'P1', 1, 1, 1, 59),
-- Technological Controls
('iso-27001', 'A.8.1', 'Technological Controls', 'User Endpoint Devices', 'Information stored on, processed by, or accessible via user endpoint devices shall be protected.', 'P1', 1, 1, 1, 60),
('iso-27001', 'A.8.2', 'Technological Controls', 'Privileged Access Rights', 'The allocation and use of privileged access rights shall be restricted and managed.', 'P1', 1, 1, 1, 61),
('iso-27001', 'A.8.3', 'Technological Controls', 'Information Access Restriction', 'Access to information and other associated assets shall be restricted per the access control policy.', 'P1', 1, 1, 1, 62),
('iso-27001', 'A.8.4', 'Technological Controls', 'Access to Source Code', 'Read and write access to source code, development tools, and software libraries shall be appropriately managed.', 'P1', 1, 1, 1, 63),
('iso-27001', 'A.8.5', 'Technological Controls', 'Secure Authentication', 'Secure authentication technologies and procedures shall be established based on access control policies.', 'P1', 1, 1, 1, 64),
('iso-27001', 'A.8.6', 'Technological Controls', 'Capacity Management', 'The use of resources shall be monitored and adjusted in line with current and expected capacity requirements.', 'P1', 1, 1, 1, 65),
('iso-27001', 'A.8.7', 'Technological Controls', 'Protection Against Malware', 'Protection against malware shall be implemented and supported by appropriate user awareness.', 'P1', 1, 1, 1, 66),
('iso-27001', 'A.8.8', 'Technological Controls', 'Technical Vulnerability Management', 'Information about technical vulnerabilities of systems shall be obtained and appropriate measures taken.', 'P1', 1, 1, 1, 67),
('iso-27001', 'A.8.9', 'Technological Controls', 'Configuration Management', 'Configurations, including security configurations, of hardware, software, services, and networks shall be established and managed.', 'P1', 1, 1, 1, 68),
('iso-27001', 'A.8.10', 'Technological Controls', 'Information Deletion', 'Information stored in information systems, devices, or any other storage media shall be deleted when no longer required.', 'P1', 1, 1, 1, 69),
('iso-27001', 'A.8.11', 'Technological Controls', 'Data Masking', 'Data masking shall be used in accordance with the policy on access control and business requirements, considering applicable legislation.', 'P1', 1, 1, 1, 70),
('iso-27001', 'A.8.12', 'Technological Controls', 'Data Leakage Prevention', 'Data leakage prevention measures shall be applied to systems, networks, and other devices that process or transmit sensitive information.', 'P1', 1, 1, 1, 71),
('iso-27001', 'A.8.13', 'Technological Controls', 'Information Backup', 'Backup copies of information, software, and systems shall be maintained and regularly tested.', 'P1', 1, 1, 1, 72),
('iso-27001', 'A.8.14', 'Technological Controls', 'Redundancy', 'Information processing facilities shall be implemented with redundancy sufficient to meet availability requirements.', 'P1', 1, 1, 1, 73),
('iso-27001', 'A.8.15', 'Technological Controls', 'Logging', 'Logs recording activities, exceptions, faults, and other relevant events shall be produced, stored, protected, and analyzed.', 'P1', 1, 1, 1, 74),
('iso-27001', 'A.8.16', 'Technological Controls', 'Monitoring Activities', 'Networks, systems, and applications shall be monitored for anomalous behavior and appropriate actions taken.', 'P1', 1, 1, 1, 75),
('iso-27001', 'A.8.17', 'Technological Controls', 'Clock Synchronization', 'The clocks of information processing systems used by the organization shall be synchronized to approved time sources.', 'P1', 1, 1, 1, 76),
('iso-27001', 'A.8.18', 'Technological Controls', 'Privileged Utility Programs', 'The use of utility programs that might be capable of overriding system controls shall be restricted and controlled.', 'P1', 1, 1, 1, 77),
('iso-27001', 'A.8.19', 'Technological Controls', 'Software Installation', 'Procedures and measures shall be implemented to securely manage software installation on operational systems.', 'P1', 1, 1, 1, 78),
('iso-27001', 'A.8.20', 'Technological Controls', 'Networks Security', 'Networks and network devices shall be secured, managed, and controlled to protect information in systems and applications.', 'P1', 1, 1, 1, 79),
('iso-27001', 'A.8.21', 'Technological Controls', 'Security of Network Services', 'Security mechanisms, service levels, and service requirements of network services shall be identified and implemented.', 'P1', 1, 1, 1, 80),
('iso-27001', 'A.8.22', 'Technological Controls', 'Segregation of Networks', 'Groups of information services, users, and information systems shall be segregated in networks.', 'P1', 1, 1, 1, 81),
('iso-27001', 'A.8.23', 'Technological Controls', 'Web Filtering', 'Access to external websites shall be managed to reduce exposure to malicious content.', 'P1', 1, 1, 1, 82),
('iso-27001', 'A.8.24', 'Technological Controls', 'Use of Cryptography', 'Rules for the effective use of cryptography, including cryptographic key management, shall be defined and implemented.', 'P1', 1, 1, 1, 83),
('iso-27001', 'A.8.25', 'Technological Controls', 'Secure Development Life Cycle', 'Rules for the secure development of software and systems shall be established and applied.', 'P1', 1, 1, 1, 84),
('iso-27001', 'A.8.26', 'Technological Controls', 'Application Security Requirements', 'Information security requirements shall be identified, specified, and approved when developing or acquiring applications.', 'P1', 1, 1, 1, 85),
('iso-27001', 'A.8.27', 'Technological Controls', 'Secure Architecture Principles', 'Principles for engineering secure systems shall be established, documented, maintained, and applied.', 'P1', 1, 1, 1, 86),
('iso-27001', 'A.8.28', 'Technological Controls', 'Secure Coding', 'Secure coding principles shall be applied to software development.', 'P1', 1, 1, 1, 87),
('iso-27001', 'A.8.29', 'Technological Controls', 'Security Testing', 'Security testing processes shall be defined and implemented in the development life cycle.', 'P1', 1, 1, 1, 88),
('iso-27001', 'A.8.30', 'Technological Controls', 'Outsourced Development', 'The organization shall direct, monitor, and review the activities related to outsourced system development.', 'P1', 1, 1, 1, 89),
('iso-27001', 'A.8.31', 'Technological Controls', 'Separation of Environments', 'Development, testing, and production environments shall be separated and secured.', 'P1', 1, 1, 1, 90),
('iso-27001', 'A.8.32', 'Technological Controls', 'Change Management', 'Changes to information processing facilities and information systems shall be subject to change management procedures.', 'P1', 1, 1, 1, 91),
('iso-27001', 'A.8.33', 'Technological Controls', 'Test Information', 'Test information shall be appropriately selected, protected, and managed.', 'P1', 1, 1, 1, 92),
('iso-27001', 'A.8.34', 'Technological Controls', 'Audit Testing Protection', 'Audit tests and other assurance activities involving assessment of operational systems shall be planned and agreed upon.', 'P1', 1, 1, 1, 93);

-- ============================================================================
-- NIST CYBERSECURITY FRAMEWORK 2.0
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
-- GOVERN
('nist-csf-2', 'GV.OC-01', 'Govern', 'Organizational Context - Mission', 'The organizational mission is understood and informs cybersecurity risk management.', 'P1', 1, 1, 1, 1),
('nist-csf-2', 'GV.OC-02', 'Govern', 'Organizational Context - Stakeholders', 'Internal and external stakeholders are understood, and their needs and expectations are understood and considered.', 'P1', 1, 1, 1, 2),
('nist-csf-2', 'GV.OC-03', 'Govern', 'Organizational Context - Legal Requirements', 'Legal, regulatory, and contractual requirements regarding cybersecurity are understood and managed.', 'P1', 1, 1, 1, 3),
('nist-csf-2', 'GV.OC-04', 'Govern', 'Organizational Context - Critical Objectives', 'Critical objectives, capabilities, and services that stakeholders depend on are understood and communicated.', 'P1', 1, 1, 1, 4),
('nist-csf-2', 'GV.OC-05', 'Govern', 'Organizational Context - Outcomes', 'Outcomes, capabilities, and services that the organization depends on are understood and communicated.', 'P1', 1, 1, 1, 5),
('nist-csf-2', 'GV.RM-01', 'Govern', 'Risk Management - Objectives', 'Risk management objectives are established and agreed upon by organizational stakeholders.', 'P1', 1, 1, 1, 6),
('nist-csf-2', 'GV.RM-02', 'Govern', 'Risk Management - Risk Appetite', 'Risk appetite and risk tolerance statements are established, communicated, and maintained.', 'P1', 1, 1, 1, 7),
('nist-csf-2', 'GV.RM-03', 'Govern', 'Risk Management - Priorities', 'Cybersecurity risk management activities and outcomes are included in enterprise risk management processes.', 'P1', 1, 1, 1, 8),
('nist-csf-2', 'GV.RM-04', 'Govern', 'Risk Management - Strategic Direction', 'Strategic direction that describes appropriate risk response options is established and communicated.', 'P1', 1, 1, 1, 9),
('nist-csf-2', 'GV.RM-05', 'Govern', 'Risk Management - Communication', 'Lines of communication across the organization are established for cybersecurity risks.', 'P1', 1, 1, 1, 10),
('nist-csf-2', 'GV.RM-06', 'Govern', 'Risk Management - Standardized Method', 'A standardized method for calculating, documenting, categorizing, and prioritizing cybersecurity risks is established.', 'P1', 1, 1, 1, 11),
('nist-csf-2', 'GV.RM-07', 'Govern', 'Risk Management - Opportunity', 'Strategic opportunities (positive risks) are characterized and communicated.', 'P1', 1, 1, 1, 12),
('nist-csf-2', 'GV.RR-01', 'Govern', 'Roles and Responsibilities - Leadership', 'Organizational leadership is responsible and accountable for cybersecurity risk and fosters a culture of risk management.', 'P1', 1, 1, 1, 13),
('nist-csf-2', 'GV.RR-02', 'Govern', 'Roles and Responsibilities - Defined', 'Roles, responsibilities, and authorities related to cybersecurity risk management are established and communicated.', 'P1', 1, 1, 1, 14),
('nist-csf-2', 'GV.RR-03', 'Govern', 'Roles and Responsibilities - Resources', 'Adequate resources are allocated commensurate with cybersecurity risk strategy, roles, and needs.', 'P1', 1, 1, 1, 15),
('nist-csf-2', 'GV.RR-04', 'Govern', 'Roles and Responsibilities - Workforce', 'Cybersecurity is included in human resources practices.', 'P1', 1, 1, 1, 16),
('nist-csf-2', 'GV.PO-01', 'Govern', 'Policy - Established', 'Policy for managing cybersecurity risks is established based on organizational context, cybersecurity strategy, and priorities.', 'P1', 1, 1, 1, 17),
('nist-csf-2', 'GV.PO-02', 'Govern', 'Policy - Reviewed', 'Policy for managing cybersecurity risks is reviewed, updated, communicated, and enforced.', 'P1', 1, 1, 1, 18),
('nist-csf-2', 'GV.OV-01', 'Govern', 'Oversight - Results', 'Cybersecurity risk management strategy outcomes are reviewed to inform and adjust strategy and direction.', 'P1', 1, 1, 1, 19),
('nist-csf-2', 'GV.OV-02', 'Govern', 'Oversight - Adjustments', 'The cybersecurity risk management strategy is reviewed and adjusted to ensure coverage of organizational requirements.', 'P1', 1, 1, 1, 20),
('nist-csf-2', 'GV.OV-03', 'Govern', 'Oversight - Performance', 'Organizational cybersecurity risk management performance is evaluated and reviewed for adjustments needed.', 'P1', 1, 1, 1, 21),
('nist-csf-2', 'GV.SC-01', 'Govern', 'Supply Chain - Program', 'A cybersecurity supply chain risk management program, strategy, objectives, policies, and processes are established.', 'P1', 1, 1, 1, 22),
('nist-csf-2', 'GV.SC-02', 'Govern', 'Supply Chain - Roles', 'Cybersecurity roles and responsibilities for suppliers, customers, and partners are established and coordinated.', 'P1', 1, 1, 1, 23),
('nist-csf-2', 'GV.SC-03', 'Govern', 'Supply Chain - Integration', 'Cybersecurity supply chain risk management is integrated into cybersecurity and enterprise risk management.', 'P1', 1, 1, 1, 24),
('nist-csf-2', 'GV.SC-04', 'Govern', 'Supply Chain - Prioritization', 'Suppliers are known and prioritized by criticality.', 'P1', 1, 1, 1, 25),
('nist-csf-2', 'GV.SC-05', 'Govern', 'Supply Chain - Requirements', 'Requirements to address cybersecurity risks in supply chains are established and communicated to suppliers.', 'P1', 1, 1, 1, 26),
-- IDENTIFY
('nist-csf-2', 'ID.AM-01', 'Identify', 'Asset Management - Hardware', 'Inventories of hardware managed by the organization are maintained.', 'P1', 1, 1, 1, 27),
('nist-csf-2', 'ID.AM-02', 'Identify', 'Asset Management - Software', 'Inventories of software, services, and systems managed by the organization are maintained.', 'P1', 1, 1, 1, 28),
('nist-csf-2', 'ID.AM-03', 'Identify', 'Asset Management - Network', 'Representations of the organization''s authorized network communication and data flows are maintained.', 'P1', 1, 1, 1, 29),
('nist-csf-2', 'ID.AM-04', 'Identify', 'Asset Management - External Services', 'Inventories of services provided by suppliers are maintained.', 'P1', 1, 1, 1, 30),
('nist-csf-2', 'ID.AM-05', 'Identify', 'Asset Management - Prioritization', 'Assets are prioritized based on classification, criticality, resources, and impact on the mission.', 'P1', 1, 1, 1, 31),
('nist-csf-2', 'ID.AM-07', 'Identify', 'Asset Management - Data', 'Inventories of data and corresponding metadata for designated data types are maintained.', 'P1', 1, 1, 1, 32),
('nist-csf-2', 'ID.AM-08', 'Identify', 'Asset Management - Lifecycle', 'Systems, hardware, software, and services are managed through their life cycles.', 'P1', 1, 1, 1, 33),
('nist-csf-2', 'ID.RA-01', 'Identify', 'Risk Assessment - Vulnerabilities', 'Vulnerabilities in assets are identified, validated, and recorded.', 'P1', 1, 1, 1, 34),
('nist-csf-2', 'ID.RA-02', 'Identify', 'Risk Assessment - Threat Intelligence', 'Cyber threat intelligence is received from information sharing forums and sources.', 'P1', 1, 1, 1, 35),
('nist-csf-2', 'ID.RA-03', 'Identify', 'Risk Assessment - Threats', 'Internal and external threats to the organization are identified and recorded.', 'P1', 1, 1, 1, 36),
('nist-csf-2', 'ID.RA-04', 'Identify', 'Risk Assessment - Impact', 'Potential impacts and likelihoods of threats exploiting vulnerabilities are identified and recorded.', 'P1', 1, 1, 1, 37),
('nist-csf-2', 'ID.RA-05', 'Identify', 'Risk Assessment - Prioritization', 'Threats, vulnerabilities, likelihoods, and impacts are used to understand inherent risk and inform risk response.', 'P1', 1, 1, 1, 38),
('nist-csf-2', 'ID.RA-06', 'Identify', 'Risk Assessment - Response', 'Risk responses are chosen, prioritized, planned, tracked, and communicated.', 'P1', 1, 1, 1, 39),
('nist-csf-2', 'ID.RA-07', 'Identify', 'Risk Assessment - Changes', 'Changes and exceptions are managed, assessed for risk impact, recorded, and tracked.', 'P1', 1, 1, 1, 40),
('nist-csf-2', 'ID.RA-08', 'Identify', 'Risk Assessment - Residual Risk', 'Processes for receiving, analyzing, and responding to vulnerability disclosures are established.', 'P1', 1, 1, 1, 41),
('nist-csf-2', 'ID.RA-10', 'Identify', 'Risk Assessment - Critical Suppliers', 'Critical suppliers are assessed prior to acquisition.', 'P1', 1, 1, 1, 42),
('nist-csf-2', 'ID.IM-01', 'Identify', 'Improvement - Lessons Learned', 'Improvements are identified from evaluations of processes.', 'P1', 1, 1, 1, 43),
('nist-csf-2', 'ID.IM-02', 'Identify', 'Improvement - Testing', 'Improvements are identified from security tests and exercises.', 'P1', 1, 1, 1, 44),
('nist-csf-2', 'ID.IM-03', 'Identify', 'Improvement - Stakeholder Input', 'Improvements are identified from execution of operational processes, procedures, and activities.', 'P1', 1, 1, 1, 45),
('nist-csf-2', 'ID.IM-04', 'Identify', 'Improvement - Implementation', 'Incident response plans and other cybersecurity plans are established, communicated, maintained, and improved.', 'P1', 1, 1, 1, 46),
-- PROTECT
('nist-csf-2', 'PR.AA-01', 'Protect', 'Identity Management - Identities', 'Identities and credentials for authorized users, services, and hardware are managed by the organization.', 'P1', 1, 1, 1, 47),
('nist-csf-2', 'PR.AA-02', 'Protect', 'Identity Management - Provisioning', 'Identities are proofed and bound to credentials based on the context of interactions.', 'P1', 1, 1, 1, 48),
('nist-csf-2', 'PR.AA-03', 'Protect', 'Identity Management - MFA', 'Users, services, and hardware are authenticated.', 'P1', 1, 1, 1, 49),
('nist-csf-2', 'PR.AA-04', 'Protect', 'Identity Management - Assertions', 'Identity assertions are protected, conveyed, and verified.', 'P1', 1, 1, 1, 50),
('nist-csf-2', 'PR.AA-05', 'Protect', 'Access Control - Permissions', 'Access permissions, entitlements, and authorizations are defined, managed, enforced, and reviewed.', 'P1', 1, 1, 1, 51),
('nist-csf-2', 'PR.AA-06', 'Protect', 'Access Control - Physical', 'Physical access to assets is managed, monitored, and enforced commensurate with risk.', 'P1', 1, 1, 1, 52),
('nist-csf-2', 'PR.AT-01', 'Protect', 'Awareness and Training - Awareness', 'Personnel are provided with awareness and training so that they possess the knowledge and skills to perform general tasks.', 'P1', 1, 1, 1, 53),
('nist-csf-2', 'PR.AT-02', 'Protect', 'Awareness and Training - Privileged', 'Individuals in specialized roles are provided with awareness and training for those roles.', 'P1', 1, 1, 1, 54),
('nist-csf-2', 'PR.DS-01', 'Protect', 'Data Security - At Rest', 'The confidentiality, integrity, and availability of data-at-rest are protected.', 'P1', 1, 1, 1, 55),
('nist-csf-2', 'PR.DS-02', 'Protect', 'Data Security - In Transit', 'The confidentiality, integrity, and availability of data-in-transit are protected.', 'P1', 1, 1, 1, 56),
('nist-csf-2', 'PR.DS-10', 'Protect', 'Data Security - Integrity', 'The confidentiality, integrity, and availability of data-in-use are protected.', 'P1', 1, 1, 1, 57),
('nist-csf-2', 'PR.DS-11', 'Protect', 'Data Security - Backups', 'Backups of data are created, protected, maintained, and tested.', 'P1', 1, 1, 1, 58),
('nist-csf-2', 'PR.PS-01', 'Protect', 'Platform Security - Configuration', 'Configuration management practices are established and applied.', 'P1', 1, 1, 1, 59),
('nist-csf-2', 'PR.PS-02', 'Protect', 'Platform Security - Software Maintenance', 'Software is maintained, replaced, and removed commensurate with risk.', 'P1', 1, 1, 1, 60),
('nist-csf-2', 'PR.PS-03', 'Protect', 'Platform Security - Hardware Maintenance', 'Hardware is maintained, replaced, and removed commensurate with risk.', 'P1', 1, 1, 1, 61),
('nist-csf-2', 'PR.PS-04', 'Protect', 'Platform Security - Log Generation', 'Log records are generated and made available for continuous monitoring.', 'P1', 1, 1, 1, 62),
('nist-csf-2', 'PR.PS-05', 'Protect', 'Platform Security - Installation', 'Installation and execution of unauthorized software are prevented.', 'P1', 1, 1, 1, 63),
('nist-csf-2', 'PR.PS-06', 'Protect', 'Platform Security - Secure Development', 'Secure software development practices are integrated and their performance is monitored.', 'P1', 1, 1, 1, 64),
('nist-csf-2', 'PR.IR-01', 'Protect', 'Technology Resilience - Networks', 'Networks and environments are protected from unauthorized logical access and usage.', 'P1', 1, 1, 1, 65),
('nist-csf-2', 'PR.IR-02', 'Protect', 'Technology Resilience - Adequate Capacity', 'The organization''s technology assets are protected from environmental threats.', 'P1', 1, 1, 1, 66),
-- DETECT
('nist-csf-2', 'DE.CM-01', 'Detect', 'Continuous Monitoring - Networks', 'Networks and network services are monitored to find potentially adverse events.', 'P1', 1, 1, 1, 67),
('nist-csf-2', 'DE.CM-02', 'Detect', 'Continuous Monitoring - Physical', 'The physical environment is monitored to find potentially adverse events.', 'P1', 1, 1, 1, 68),
('nist-csf-2', 'DE.CM-03', 'Detect', 'Continuous Monitoring - Personnel Activity', 'Personnel activity and technology usage are monitored to find potentially adverse events.', 'P1', 1, 1, 1, 69),
('nist-csf-2', 'DE.CM-06', 'Detect', 'Continuous Monitoring - External Services', 'External service provider activities and services are monitored to find potentially adverse events.', 'P1', 1, 1, 1, 70),
('nist-csf-2', 'DE.CM-09', 'Detect', 'Continuous Monitoring - Computing Hardware', 'Computing hardware and software, runtime environments, and their data are monitored.', 'P1', 1, 1, 1, 71),
('nist-csf-2', 'DE.AE-02', 'Detect', 'Adverse Event Analysis - Correlation', 'Potentially adverse events are analyzed to better understand associated activities.', 'P1', 1, 1, 1, 72),
('nist-csf-2', 'DE.AE-03', 'Detect', 'Adverse Event Analysis - Information Merged', 'Information is correlated from multiple sources.', 'P1', 1, 1, 1, 73),
('nist-csf-2', 'DE.AE-04', 'Detect', 'Adverse Event Analysis - Impact Estimated', 'The estimated impact and scope of adverse events are understood.', 'P1', 1, 1, 1, 74),
('nist-csf-2', 'DE.AE-06', 'Detect', 'Adverse Event Analysis - Declared', 'Information on adverse events is provided to authorized staff and tools.', 'P1', 1, 1, 1, 75),
('nist-csf-2', 'DE.AE-07', 'Detect', 'Adverse Event Analysis - Cyber Threat Intelligence', 'Cyber threat intelligence and other contextual information are integrated into the analysis.', 'P1', 1, 1, 1, 76),
('nist-csf-2', 'DE.AE-08', 'Detect', 'Adverse Event Analysis - Incident Declared', 'Incidents are declared when adverse events meet the defined incident criteria.', 'P1', 1, 1, 1, 77),
-- RESPOND
('nist-csf-2', 'RS.MA-01', 'Respond', 'Incident Management - Plan Executed', 'The incident response plan is executed in coordination with relevant third parties once an incident is declared.', 'P1', 1, 1, 1, 78),
('nist-csf-2', 'RS.MA-02', 'Respond', 'Incident Management - Triage', 'Incident reports are triaged and validated.', 'P1', 1, 1, 1, 79),
('nist-csf-2', 'RS.MA-03', 'Respond', 'Incident Management - Categorized', 'Incidents are categorized and prioritized.', 'P1', 1, 1, 1, 80),
('nist-csf-2', 'RS.MA-04', 'Respond', 'Incident Management - Escalated', 'Incidents are escalated or elevated as needed.', 'P1', 1, 1, 1, 81),
('nist-csf-2', 'RS.MA-05', 'Respond', 'Incident Management - Criteria Applied', 'The criteria for initiating incident recovery are applied.', 'P1', 1, 1, 1, 82),
('nist-csf-2', 'RS.AN-03', 'Respond', 'Incident Analysis - Root Cause', 'Analysis is performed to determine what has taken place during an incident and the root cause.', 'P1', 1, 1, 1, 83),
('nist-csf-2', 'RS.AN-06', 'Respond', 'Incident Analysis - Evidence Collected', 'Actions performed during an investigation are recorded and the integrity of evidence is preserved.', 'P1', 1, 1, 1, 84),
('nist-csf-2', 'RS.AN-07', 'Respond', 'Incident Analysis - Artifacts Collected', 'Incident data and metadata are collected and their integrity and provenance are preserved.', 'P1', 1, 1, 1, 85),
('nist-csf-2', 'RS.AN-08', 'Respond', 'Incident Analysis - Magnitude Estimated', 'An incident''s magnitude is estimated and validated.', 'P1', 1, 1, 1, 86),
('nist-csf-2', 'RS.CO-02', 'Respond', 'Incident Reporting - Internal Stakeholders', 'Internal and external stakeholders are notified of incidents.', 'P1', 1, 1, 1, 87),
('nist-csf-2', 'RS.CO-03', 'Respond', 'Incident Reporting - Information Shared', 'Information is shared with designated internal and external stakeholders.', 'P1', 1, 1, 1, 88),
('nist-csf-2', 'RS.MI-01', 'Respond', 'Incident Mitigation - Contained', 'Incidents are contained.', 'P1', 1, 1, 1, 89),
('nist-csf-2', 'RS.MI-02', 'Respond', 'Incident Mitigation - Eradicated', 'Incidents are eradicated.', 'P1', 1, 1, 1, 90),
-- RECOVER
('nist-csf-2', 'RC.RP-01', 'Recover', 'Recovery Plan - Executed', 'The recovery portion of the incident response plan is executed once initiated from the incident response process.', 'P1', 1, 1, 1, 91),
('nist-csf-2', 'RC.RP-02', 'Recover', 'Recovery Plan - Selection', 'Recovery actions are selected, scoped, prioritized, and performed.', 'P1', 1, 1, 1, 92),
('nist-csf-2', 'RC.RP-03', 'Recover', 'Recovery Plan - Verification', 'The integrity of backups and other restoration assets is verified before using them for restoration.', 'P1', 1, 1, 1, 93),
('nist-csf-2', 'RC.RP-04', 'Recover', 'Recovery Plan - Critical Functions', 'Critical mission functions and cybersecurity risk management are considered to establish post-incident operational norms.', 'P1', 1, 1, 1, 94),
('nist-csf-2', 'RC.RP-05', 'Recover', 'Recovery Plan - Data Restored', 'The integrity of restored assets is verified, systems and services are restored, and normal operating status is confirmed.', 'P1', 1, 1, 1, 95),
('nist-csf-2', 'RC.RP-06', 'Recover', 'Recovery Plan - End Declared', 'The end of incident recovery is declared based on criteria and the incident is closed.', 'P1', 1, 1, 1, 96),
('nist-csf-2', 'RC.CO-03', 'Recover', 'Recovery Communication - Status Updates', 'Recovery activities and progress in restoring operational capabilities are communicated to designated stakeholders.', 'P1', 1, 1, 1, 97),
('nist-csf-2', 'RC.CO-04', 'Recover', 'Recovery Communication - Public Updates', 'Public updates on incident recovery are shared using approved methods and messaging.', 'P1', 1, 1, 1, 98);

-- ============================================================================
-- PCI DSS v4.0.1 - KEY REQUIREMENTS
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
-- Requirement 1
('pci-dss-v4', '1.1.1', 'Requirement 1 - Network Security Controls', 'Security Policies Defined', 'All security policies and operational procedures for Requirement 1 are documented, kept up to date, in use, and known to all affected parties.', 'P1', 1, 1, 1, 1),
('pci-dss-v4', '1.2.1', 'Requirement 1 - Network Security Controls', 'NSC Configuration Standards', 'Configuration standards for NSC rulesets are defined, implemented, and maintained.', 'P1', 1, 1, 1, 2),
('pci-dss-v4', '1.2.5', 'Requirement 1 - Network Security Controls', 'Permitted Services and Ports', 'All services, protocols, and ports allowed are identified, approved, and have a defined business need.', 'P1', 1, 1, 1, 3),
('pci-dss-v4', '1.3.1', 'Requirement 1 - Network Security Controls', 'Inbound Traffic Restriction', 'Inbound traffic to the CDE is restricted to only that which is necessary.', 'P1', 1, 1, 1, 4),
('pci-dss-v4', '1.3.2', 'Requirement 1 - Network Security Controls', 'Outbound Traffic Restriction', 'Outbound traffic from the CDE is restricted to only that which is necessary.', 'P1', 1, 1, 1, 5),
('pci-dss-v4', '1.4.1', 'Requirement 1 - Network Security Controls', 'NSC Between Trusted and Untrusted', 'NSCs are implemented between trusted and untrusted networks.', 'P1', 1, 1, 1, 6),
('pci-dss-v4', '1.4.2', 'Requirement 1 - Network Security Controls', 'Inbound Traffic to DMZ', 'Inbound traffic from untrusted networks to the DMZ is controlled.', 'P1', 1, 1, 1, 7),
('pci-dss-v4', '1.5.1', 'Requirement 1 - Network Security Controls', 'Rogue Wireless Detection', 'Risks to the CDE from computing devices that are able to connect to both untrusted networks and the CDE are mitigated.', 'P1', 1, 1, 1, 8),
-- Requirement 2
('pci-dss-v4', '2.1.1', 'Requirement 2 - Secure Configurations', 'Security Policies Defined', 'All security policies and procedures for applying secure configurations are documented, in use, and known to all affected parties.', 'P1', 1, 1, 1, 9),
('pci-dss-v4', '2.2.1', 'Requirement 2 - Secure Configurations', 'Configuration Standards', 'Configuration standards are developed, implemented, and maintained for all system components.', 'P1', 1, 1, 1, 10),
('pci-dss-v4', '2.2.2', 'Requirement 2 - Secure Configurations', 'Vendor Default Accounts', 'Vendor default accounts are managed according to requirements.', 'P1', 1, 1, 1, 11),
('pci-dss-v4', '2.2.4', 'Requirement 2 - Secure Configurations', 'Unnecessary Services', 'Only necessary services, protocols, daemons, and functions are enabled and all unnecessary are removed or disabled.', 'P1', 1, 1, 1, 12),
('pci-dss-v4', '2.2.5', 'Requirement 2 - Secure Configurations', 'Insecure Service Security', 'If any insecure services are present, the business justification is documented and additional security features are implemented.', 'P1', 1, 1, 1, 13),
('pci-dss-v4', '2.2.7', 'Requirement 2 - Secure Configurations', 'Non-Console Access Encryption', 'All non-console administrative access is encrypted using strong cryptography.', 'P1', 1, 1, 1, 14),
('pci-dss-v4', '2.3.1', 'Requirement 2 - Secure Configurations', 'Wireless Environments', 'Wireless environments are configured and managed securely for all wireless vendor defaults.', 'P1', 1, 1, 1, 15),
-- Requirement 3
('pci-dss-v4', '3.1.1', 'Requirement 3 - Protect Stored Data', 'Security Policies Defined', 'All security policies and procedures for protecting stored account data are documented, in use, and known to all affected parties.', 'P1', 1, 1, 1, 16),
('pci-dss-v4', '3.2.1', 'Requirement 3 - Protect Stored Data', 'Data Retention Policy', 'Account data storage amount and retention time are limited per policy with defined data retention and disposal processes.', 'P1', 1, 1, 1, 17),
('pci-dss-v4', '3.3.1', 'Requirement 3 - Protect Stored Data', 'SAD Not Stored After Auth', 'Sensitive authentication data is not stored after authorization even if encrypted.', 'P1', 1, 1, 1, 18),
('pci-dss-v4', '3.4.1', 'Requirement 3 - Protect Stored Data', 'PAN Masked When Displayed', 'PAN is masked when displayed such that only personnel with a business need can see the full PAN.', 'P1', 1, 1, 1, 19),
('pci-dss-v4', '3.5.1', 'Requirement 3 - Protect Stored Data', 'PAN Rendered Unreadable', 'PAN is rendered unreadable anywhere it is stored by using strong cryptography.', 'P1', 1, 1, 1, 20),
('pci-dss-v4', '3.6.1', 'Requirement 3 - Protect Stored Data', 'Key Management Procedures', 'Procedures are defined and implemented to protect cryptographic keys used to protect stored account data.', 'P1', 1, 1, 1, 21),
('pci-dss-v4', '3.7.1', 'Requirement 3 - Protect Stored Data', 'Key Management Policies', 'Key management policies and procedures are implemented to include generation, distribution, storage, and destruction of keys.', 'P1', 1, 1, 1, 22),
-- Requirement 4
('pci-dss-v4', '4.1.1', 'Requirement 4 - Cryptography in Transit', 'Security Policies Defined', 'All security policies and procedures for protecting cardholder data in transit are documented, in use, and known to all affected parties.', 'P1', 1, 1, 1, 23),
('pci-dss-v4', '4.2.1', 'Requirement 4 - Cryptography in Transit', 'Strong Cryptography for Transmission', 'Strong cryptography and security protocols are implemented to safeguard PAN during transmission over open, public networks.', 'P1', 1, 1, 1, 24),
('pci-dss-v4', '4.2.1.1', 'Requirement 4 - Cryptography in Transit', 'Certificate Inventory', 'An inventory of the entity''s trusted keys and certificates is maintained.', 'P1', 1, 1, 1, 25),
('pci-dss-v4', '4.2.2', 'Requirement 4 - Cryptography in Transit', 'PAN Secured in Messaging', 'PAN is secured with strong cryptography whenever it is sent via end-user messaging technologies.', 'P1', 1, 1, 1, 26),
-- Requirement 5
('pci-dss-v4', '5.1.1', 'Requirement 5 - Malware Protection', 'Security Policies Defined', 'All security policies and procedures for protecting against malware are documented, in use, and known to all affected parties.', 'P1', 1, 1, 1, 27),
('pci-dss-v4', '5.2.1', 'Requirement 5 - Malware Protection', 'Anti-Malware Deployed', 'An anti-malware solution is deployed on all system components except those identified as not at risk.', 'P1', 1, 1, 1, 28),
('pci-dss-v4', '5.2.2', 'Requirement 5 - Malware Protection', 'Periodic Evaluations', 'The deployed anti-malware solution detects all known types of malware and removes, blocks, or contains them.', 'P1', 1, 1, 1, 29),
('pci-dss-v4', '5.3.1', 'Requirement 5 - Malware Protection', 'Current Anti-Malware', 'The anti-malware solution is kept current via automatic updates.', 'P1', 1, 1, 1, 30),
('pci-dss-v4', '5.3.2', 'Requirement 5 - Malware Protection', 'Periodic Scans', 'The anti-malware solution performs periodic scans and active or real-time scans.', 'P1', 1, 1, 1, 31),
('pci-dss-v4', '5.3.4', 'Requirement 5 - Malware Protection', 'Audit Logs Enabled', 'Audit logs for the anti-malware solution are enabled and retained.', 'P1', 1, 1, 1, 32),
-- Requirement 6
('pci-dss-v4', '6.1.1', 'Requirement 6 - Secure Systems', 'Security Policies Defined', 'All security policies and procedures for developing secure systems are documented, in use, and known to all affected parties.', 'P1', 1, 1, 1, 33),
('pci-dss-v4', '6.2.1', 'Requirement 6 - Secure Systems', 'Secure Development', 'Bespoke and custom software are developed securely covering the full software development lifecycle.', 'P1', 1, 1, 1, 34),
('pci-dss-v4', '6.2.4', 'Requirement 6 - Secure Systems', 'Secure Coding Techniques', 'Software engineering techniques or other methods are defined and used to prevent or mitigate common software attacks.', 'P1', 1, 1, 1, 35),
('pci-dss-v4', '6.3.1', 'Requirement 6 - Secure Systems', 'Vulnerability Identification', 'Security vulnerabilities are identified and managed with a defined process.', 'P1', 1, 1, 1, 36),
('pci-dss-v4', '6.3.3', 'Requirement 6 - Secure Systems', 'Critical Patches', 'All applicable security patches and updates are installed within defined timeframes.', 'P1', 1, 1, 1, 37),
('pci-dss-v4', '6.4.1', 'Requirement 6 - Secure Systems', 'Web Application Protection', 'For public-facing web applications, new threats and vulnerabilities are addressed on an ongoing basis.', 'P1', 1, 1, 1, 38),
('pci-dss-v4', '6.4.2', 'Requirement 6 - Secure Systems', 'WAF Deployment', 'For public-facing web applications, an automated technical solution is deployed that detects and prevents web-based attacks.', 'P1', 1, 1, 1, 39),
('pci-dss-v4', '6.5.1', 'Requirement 6 - Secure Systems', 'Change Management', 'Changes to all system components in the production environment are managed through a change control process.', 'P1', 1, 1, 1, 40),
-- Requirement 7
('pci-dss-v4', '7.1.1', 'Requirement 7 - Access Restriction', 'Security Policies Defined', 'All security policies and procedures for restricting access are documented, in use, and known to all affected parties.', 'P1', 1, 1, 1, 41),
('pci-dss-v4', '7.2.1', 'Requirement 7 - Access Restriction', 'Access Control Model', 'An access control model is defined and includes granting access based on business and access requirements.', 'P1', 1, 1, 1, 42),
('pci-dss-v4', '7.2.2', 'Requirement 7 - Access Restriction', 'Appropriate Access Assigned', 'Access is assigned to users, including privileged users, based on job classification and function.', 'P1', 1, 1, 1, 43),
('pci-dss-v4', '7.2.5', 'Requirement 7 - Access Restriction', 'Application and System Account Access', 'All application and system accounts and related access privileges are assigned and managed per least privilege.', 'P1', 1, 1, 1, 44),
('pci-dss-v4', '7.3.1', 'Requirement 7 - Access Restriction', 'Access Control Systems', 'An access control system is in place that restricts access based on a user''s need to know.', 'P1', 1, 1, 1, 45),
-- Requirement 8
('pci-dss-v4', '8.1.1', 'Requirement 8 - Identify and Authenticate', 'Security Policies Defined', 'All security policies and procedures for identity and authentication are documented, in use, and known to all affected parties.', 'P1', 1, 1, 1, 46),
('pci-dss-v4', '8.2.1', 'Requirement 8 - Identify and Authenticate', 'Unique User IDs', 'All users are assigned a unique ID before access to system components or cardholder data is allowed.', 'P1', 1, 1, 1, 47),
('pci-dss-v4', '8.2.2', 'Requirement 8 - Identify and Authenticate', 'Shared and Group Accounts', 'Group, shared, or generic accounts or other shared authentication credentials are only used when necessary on an exception basis.', 'P1', 1, 1, 1, 48),
('pci-dss-v4', '8.3.1', 'Requirement 8 - Identify and Authenticate', 'Multi-Factor Authentication', 'All user access to system components for users and administrators is authenticated via at least one authentication factor.', 'P1', 1, 1, 1, 49),
('pci-dss-v4', '8.3.6', 'Requirement 8 - Identify and Authenticate', 'Password Complexity', 'If passwords/passphrases are used, they meet a minimum level of complexity and are changed periodically.', 'P1', 1, 1, 1, 50),
('pci-dss-v4', '8.3.9', 'Requirement 8 - Identify and Authenticate', 'Password Uniqueness', 'If passwords/passphrases are used as authentication factors, they are not the same as any of the last four passwords used.', 'P1', 1, 1, 1, 51),
('pci-dss-v4', '8.4.2', 'Requirement 8 - Identify and Authenticate', 'MFA for CDE Access', 'MFA is implemented for all access into the CDE.', 'P1', 1, 1, 1, 52),
('pci-dss-v4', '8.6.1', 'Requirement 8 - Identify and Authenticate', 'System Account Management', 'If accounts used by systems or applications can be used for interactive login, they are managed as follows.', 'P1', 1, 1, 1, 53),
-- Requirement 9
('pci-dss-v4', '9.1.1', 'Requirement 9 - Physical Access', 'Security Policies Defined', 'All security policies and procedures for restricting physical access are documented, in use, and known to all affected parties.', 'P1', 1, 1, 1, 54),
('pci-dss-v4', '9.2.1', 'Requirement 9 - Physical Access', 'Facility Entry Controls', 'Appropriate facility entry controls are in place to restrict physical access to systems in the CDE.', 'P1', 1, 1, 1, 55),
('pci-dss-v4', '9.3.1', 'Requirement 9 - Physical Access', 'Visitor Authorization', 'Procedures are implemented for authorizing and managing physical access of visitors.', 'P1', 1, 1, 1, 56),
('pci-dss-v4', '9.4.1', 'Requirement 9 - Physical Access', 'Media Physical Security', 'All media with cardholder data is physically secured.', 'P1', 1, 1, 1, 57),
('pci-dss-v4', '9.4.5', 'Requirement 9 - Physical Access', 'Media Inventory', 'An inventory of all electronic media with cardholder data is maintained.', 'P1', 1, 1, 1, 58),
('pci-dss-v4', '9.4.7', 'Requirement 9 - Physical Access', 'Media Destruction', 'All media with cardholder data is destroyed when no longer needed for business or legal reasons.', 'P1', 1, 1, 1, 59),
-- Requirement 10
('pci-dss-v4', '10.1.1', 'Requirement 10 - Logging and Monitoring', 'Security Policies Defined', 'All security policies and procedures for logging and monitoring are documented, in use, and known to all affected parties.', 'P1', 1, 1, 1, 60),
('pci-dss-v4', '10.2.1', 'Requirement 10 - Logging and Monitoring', 'Audit Logs Enabled', 'Audit logs are enabled and active for all system components and cardholder data.', 'P1', 1, 1, 1, 61),
('pci-dss-v4', '10.2.2', 'Requirement 10 - Logging and Monitoring', 'Event Logging', 'Audit logs record all events defined as requiring logging.', 'P1', 1, 1, 1, 62),
('pci-dss-v4', '10.3.1', 'Requirement 10 - Logging and Monitoring', 'Log Protection', 'Read access to audit logs files is limited to those with a job-related need.', 'P1', 1, 1, 1, 63),
('pci-dss-v4', '10.3.2', 'Requirement 10 - Logging and Monitoring', 'Tamper Protection', 'Audit log files are protected to prevent modifications by individuals.', 'P1', 1, 1, 1, 64),
('pci-dss-v4', '10.4.1', 'Requirement 10 - Logging and Monitoring', 'Log Review', 'Audit logs are reviewed to identify anomalies or suspicious activity at least once daily.', 'P1', 1, 1, 1, 65),
('pci-dss-v4', '10.5.1', 'Requirement 10 - Logging and Monitoring', 'Log Retention', 'Retain audit log history for at least 12 months with at least the most recent 3 months immediately available for analysis.', 'P1', 1, 1, 1, 66),
('pci-dss-v4', '10.7.1', 'Requirement 10 - Logging and Monitoring', 'Logging Failure Detection', 'Failures of critical security control systems are detected, reported, and responded to promptly.', 'P1', 1, 1, 1, 67),
-- Requirement 11
('pci-dss-v4', '11.1.1', 'Requirement 11 - Security Testing', 'Security Policies Defined', 'All security policies and procedures for regularly testing security are documented, in use, and known to all affected parties.', 'P1', 1, 1, 1, 68),
('pci-dss-v4', '11.2.1', 'Requirement 11 - Security Testing', 'Wireless Access Points', 'Authorized and unauthorized wireless access points are managed with detection and identification of all authorized and unauthorized wireless APs on a quarterly basis.', 'P1', 1, 1, 1, 69),
('pci-dss-v4', '11.3.1', 'Requirement 11 - Security Testing', 'Internal Vulnerability Scans', 'Internal vulnerability scans are performed at least once every three months.', 'P1', 1, 1, 1, 70),
('pci-dss-v4', '11.3.2', 'Requirement 11 - Security Testing', 'External Vulnerability Scans', 'External vulnerability scans are performed at least once every three months by an ASV.', 'P1', 1, 1, 1, 71),
('pci-dss-v4', '11.4.1', 'Requirement 11 - Security Testing', 'Internal Penetration Testing', 'A penetration testing methodology is defined, documented, and implemented by the entity.', 'P1', 1, 1, 1, 72),
('pci-dss-v4', '11.5.1', 'Requirement 11 - Security Testing', 'Change Detection', 'A change-detection mechanism is deployed to alert personnel to unauthorized modification of critical files.', 'P1', 1, 1, 1, 73),
('pci-dss-v4', '11.6.1', 'Requirement 11 - Security Testing', 'Payment Page Monitoring', 'A change-and tamper-detection mechanism is deployed on payment pages to alert personnel to unauthorized modification.', 'P1', 1, 1, 1, 74),
-- Requirement 12
('pci-dss-v4', '12.1.1', 'Requirement 12 - Security Policies', 'Information Security Policy', 'An overall information security policy is established, published, maintained, and disseminated to all relevant personnel.', 'P1', 1, 1, 1, 75),
('pci-dss-v4', '12.3.1', 'Requirement 12 - Security Policies', 'Risk Assessment', 'Each PCI DSS requirement that provides flexibility for how frequently it is performed is supported by a targeted risk analysis.', 'P1', 1, 1, 1, 76),
('pci-dss-v4', '12.4.1', 'Requirement 12 - Security Policies', 'PCI DSS Compliance Program', 'Responsibility is established for the protection of cardholder data and a PCI DSS compliance program.', 'P1', 1, 1, 1, 77),
('pci-dss-v4', '12.5.2', 'Requirement 12 - Security Policies', 'PCI DSS Scope Documentation', 'PCI DSS scope is documented and confirmed at least once every 12 months and upon significant change to the in-scope environment.', 'P1', 1, 1, 1, 78),
('pci-dss-v4', '12.6.1', 'Requirement 12 - Security Policies', 'Security Awareness Program', 'A formal security awareness program is implemented to make all personnel aware of the cardholder data security policy.', 'P1', 1, 1, 1, 79),
('pci-dss-v4', '12.8.1', 'Requirement 12 - Security Policies', 'Service Provider Management', 'A list of all third-party service providers with which account data is shared or that could affect security is maintained.', 'P1', 1, 1, 1, 80),
('pci-dss-v4', '12.10.1', 'Requirement 12 - Security Policies', 'Incident Response Plan', 'An incident response plan exists and is ready to be activated in the event of a suspected or confirmed security incident.', 'P1', 1, 1, 1, 81);

-- ============================================================================
-- CROSSWALK MAPPINGS - NIST 800-53 as Hub
-- Maps controls across all 8 frameworks via NIST 800-53
-- ============================================================================

-- NIST 800-53 ↔ FedRAMP Moderate (direct mapping, same control IDs)
INSERT OR REPLACE INTO control_crosswalks (source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence) VALUES
('nist-800-53-r5', 'AT-1', 'fedramp-moderate', 'AT-1', 'equivalent', 0.95),
('nist-800-53-r5', 'AT-2', 'fedramp-moderate', 'AT-2', 'equivalent', 0.95),
('nist-800-53-r5', 'AT-3', 'fedramp-moderate', 'AT-3', 'equivalent', 0.95),
('nist-800-53-r5', 'AU-1', 'fedramp-moderate', 'AU-1', 'equivalent', 0.95),
('nist-800-53-r5', 'AU-2', 'fedramp-moderate', 'AU-2', 'equivalent', 0.95),
('nist-800-53-r5', 'AU-3', 'fedramp-moderate', 'AU-3', 'equivalent', 0.95),
('nist-800-53-r5', 'AU-4', 'fedramp-moderate', 'AU-4', 'equivalent', 0.95),
('nist-800-53-r5', 'AU-5', 'fedramp-moderate', 'AU-5', 'equivalent', 0.95),
('nist-800-53-r5', 'AU-6', 'fedramp-moderate', 'AU-6', 'equivalent', 0.95),
('nist-800-53-r5', 'AU-8', 'fedramp-moderate', 'AU-8', 'equivalent', 0.95),
('nist-800-53-r5', 'AU-9', 'fedramp-moderate', 'AU-9', 'equivalent', 0.95),
('nist-800-53-r5', 'AU-11', 'fedramp-moderate', 'AU-11', 'equivalent', 0.95),
('nist-800-53-r5', 'AU-12', 'fedramp-moderate', 'AU-12', 'equivalent', 0.95),
('nist-800-53-r5', 'CA-1', 'fedramp-moderate', 'CA-1', 'equivalent', 0.95),
('nist-800-53-r5', 'CA-2', 'fedramp-moderate', 'CA-2', 'equivalent', 0.95),
('nist-800-53-r5', 'CA-3', 'fedramp-moderate', 'CA-3', 'equivalent', 0.95),
('nist-800-53-r5', 'CA-5', 'fedramp-moderate', 'CA-5', 'equivalent', 0.95),
('nist-800-53-r5', 'CA-6', 'fedramp-moderate', 'CA-6', 'equivalent', 0.95),
('nist-800-53-r5', 'CA-7', 'fedramp-moderate', 'CA-7', 'equivalent', 0.95),
('nist-800-53-r5', 'CM-1', 'fedramp-moderate', 'CM-1', 'equivalent', 0.95),
('nist-800-53-r5', 'CM-2', 'fedramp-moderate', 'CM-2', 'equivalent', 0.95),
('nist-800-53-r5', 'CM-3', 'fedramp-moderate', 'CM-3', 'equivalent', 0.95),
('nist-800-53-r5', 'CM-4', 'fedramp-moderate', 'CM-4', 'equivalent', 0.95),
('nist-800-53-r5', 'CM-5', 'fedramp-moderate', 'CM-5', 'equivalent', 0.95),
('nist-800-53-r5', 'CM-6', 'fedramp-moderate', 'CM-6', 'equivalent', 0.95),
('nist-800-53-r5', 'CM-7', 'fedramp-moderate', 'CM-7', 'equivalent', 0.95),
('nist-800-53-r5', 'CM-8', 'fedramp-moderate', 'CM-8', 'equivalent', 0.95),
('nist-800-53-r5', 'CP-1', 'fedramp-moderate', 'CP-1', 'equivalent', 0.95),
('nist-800-53-r5', 'CP-2', 'fedramp-moderate', 'CP-2', 'equivalent', 0.95),
('nist-800-53-r5', 'CP-3', 'fedramp-moderate', 'CP-3', 'equivalent', 0.95),
('nist-800-53-r5', 'CP-4', 'fedramp-moderate', 'CP-4', 'equivalent', 0.95),
('nist-800-53-r5', 'CP-9', 'fedramp-moderate', 'CP-9', 'equivalent', 0.95),
('nist-800-53-r5', 'CP-10', 'fedramp-moderate', 'CP-10', 'equivalent', 0.95),
('nist-800-53-r5', 'IA-1', 'fedramp-moderate', 'IA-1', 'equivalent', 0.95),
('nist-800-53-r5', 'IA-2', 'fedramp-moderate', 'IA-2', 'equivalent', 0.95),
('nist-800-53-r5', 'IA-4', 'fedramp-moderate', 'IA-4', 'equivalent', 0.95),
('nist-800-53-r5', 'IA-5', 'fedramp-moderate', 'IA-5', 'equivalent', 0.95),
('nist-800-53-r5', 'IR-1', 'fedramp-moderate', 'IR-1', 'equivalent', 0.95),
('nist-800-53-r5', 'IR-2', 'fedramp-moderate', 'IR-2', 'equivalent', 0.95),
('nist-800-53-r5', 'IR-4', 'fedramp-moderate', 'IR-4', 'equivalent', 0.95),
('nist-800-53-r5', 'IR-5', 'fedramp-moderate', 'IR-5', 'equivalent', 0.95),
('nist-800-53-r5', 'IR-6', 'fedramp-moderate', 'IR-6', 'equivalent', 0.95),
('nist-800-53-r5', 'IR-8', 'fedramp-moderate', 'IR-8', 'equivalent', 0.95),
('nist-800-53-r5', 'MA-1', 'fedramp-moderate', 'MA-1', 'equivalent', 0.95),
('nist-800-53-r5', 'MA-2', 'fedramp-moderate', 'MA-2', 'equivalent', 0.95),
('nist-800-53-r5', 'MA-4', 'fedramp-moderate', 'MA-4', 'equivalent', 0.95),
('nist-800-53-r5', 'MA-5', 'fedramp-moderate', 'MA-5', 'equivalent', 0.95),
('nist-800-53-r5', 'PE-1', 'fedramp-moderate', 'PE-1', 'equivalent', 0.95),
('nist-800-53-r5', 'PE-2', 'fedramp-moderate', 'PE-2', 'equivalent', 0.95),
('nist-800-53-r5', 'PE-3', 'fedramp-moderate', 'PE-3', 'equivalent', 0.95),
('nist-800-53-r5', 'PE-6', 'fedramp-moderate', 'PE-6', 'equivalent', 0.95),
('nist-800-53-r5', 'PL-1', 'fedramp-moderate', 'PL-1', 'equivalent', 0.95),
('nist-800-53-r5', 'PL-2', 'fedramp-moderate', 'PL-2', 'equivalent', 0.95),
('nist-800-53-r5', 'PS-1', 'fedramp-moderate', 'PS-1', 'equivalent', 0.95),
('nist-800-53-r5', 'PS-2', 'fedramp-moderate', 'PS-2', 'equivalent', 0.95),
('nist-800-53-r5', 'PS-3', 'fedramp-moderate', 'PS-3', 'equivalent', 0.95),
('nist-800-53-r5', 'RA-1', 'fedramp-moderate', 'RA-1', 'equivalent', 0.95),
('nist-800-53-r5', 'RA-5', 'fedramp-moderate', 'RA-5', 'equivalent', 0.95),
('nist-800-53-r5', 'SA-1', 'fedramp-moderate', 'SA-1', 'equivalent', 0.95),
('nist-800-53-r5', 'SA-4', 'fedramp-moderate', 'SA-4', 'equivalent', 0.95),
('nist-800-53-r5', 'SC-1', 'fedramp-moderate', 'SC-1', 'equivalent', 0.95),
('nist-800-53-r5', 'SC-7', 'fedramp-moderate', 'SC-7', 'equivalent', 0.95),
('nist-800-53-r5', 'SC-8', 'fedramp-moderate', 'SC-8', 'equivalent', 0.95),
('nist-800-53-r5', 'SC-12', 'fedramp-moderate', 'SC-12', 'equivalent', 0.95),
('nist-800-53-r5', 'SC-13', 'fedramp-moderate', 'SC-13', 'equivalent', 0.95),
('nist-800-53-r5', 'SI-1', 'fedramp-moderate', 'SI-1', 'equivalent', 0.95),
('nist-800-53-r5', 'SI-2', 'fedramp-moderate', 'SI-2', 'equivalent', 0.95),
('nist-800-53-r5', 'SI-3', 'fedramp-moderate', 'SI-3', 'equivalent', 0.95),
('nist-800-53-r5', 'SI-4', 'fedramp-moderate', 'SI-4', 'equivalent', 0.95),
('nist-800-53-r5', 'SI-5', 'fedramp-moderate', 'SI-5', 'equivalent', 0.95);

-- NIST 800-53 ↔ HIPAA
INSERT OR REPLACE INTO control_crosswalks (source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence) VALUES
('nist-800-53-r5', 'AT-1', 'hipaa', '164.308(a)(5)', 'partial', 0.8),
('nist-800-53-r5', 'AT-2', 'hipaa', '164.308(a)(5)(ii)(A)', 'equivalent', 0.85),
('nist-800-53-r5', 'AU-2', 'hipaa', '164.312(b)', 'equivalent', 0.9),
('nist-800-53-r5', 'AU-6', 'hipaa', '164.308(a)(1)(ii)(D)', 'equivalent', 0.85),
('nist-800-53-r5', 'AU-9', 'hipaa', '164.312(b)', 'partial', 0.75),
('nist-800-53-r5', 'CA-2', 'hipaa', '164.308(a)(8)', 'equivalent', 0.85),
('nist-800-53-r5', 'CM-6', 'hipaa', '164.312(a)(1)', 'partial', 0.7),
('nist-800-53-r5', 'CP-1', 'hipaa', '164.308(a)(7)', 'equivalent', 0.85),
('nist-800-53-r5', 'CP-2', 'hipaa', '164.308(a)(7)(ii)(B)', 'equivalent', 0.9),
('nist-800-53-r5', 'CP-9', 'hipaa', '164.308(a)(7)(ii)(A)', 'equivalent', 0.9),
('nist-800-53-r5', 'CP-10', 'hipaa', '164.308(a)(7)(ii)(C)', 'equivalent', 0.85),
('nist-800-53-r5', 'IA-1', 'hipaa', '164.312(d)', 'partial', 0.8),
('nist-800-53-r5', 'IA-2', 'hipaa', '164.312(a)(2)(i)', 'equivalent', 0.9),
('nist-800-53-r5', 'IA-5', 'hipaa', '164.308(a)(5)(ii)(D)', 'partial', 0.75),
('nist-800-53-r5', 'IR-1', 'hipaa', '164.308(a)(6)', 'equivalent', 0.85),
('nist-800-53-r5', 'IR-4', 'hipaa', '164.308(a)(6)(ii)', 'equivalent', 0.9),
('nist-800-53-r5', 'IR-6', 'hipaa', '164.308(a)(6)(ii)', 'partial', 0.8),
('nist-800-53-r5', 'MA-1', 'hipaa', '164.310(a)(2)(iv)', 'partial', 0.7),
('nist-800-53-r5', 'MP-2', 'hipaa', '164.310(d)(1)', 'equivalent', 0.85),
('nist-800-53-r5', 'PE-1', 'hipaa', '164.310(a)(1)', 'equivalent', 0.85),
('nist-800-53-r5', 'PE-2', 'hipaa', '164.310(a)(2)(iii)', 'equivalent', 0.85),
('nist-800-53-r5', 'PE-3', 'hipaa', '164.310(a)(2)(ii)', 'equivalent', 0.85),
('nist-800-53-r5', 'PS-3', 'hipaa', '164.308(a)(3)(ii)(B)', 'equivalent', 0.85),
('nist-800-53-r5', 'PS-4', 'hipaa', '164.308(a)(3)(ii)(C)', 'equivalent', 0.85),
('nist-800-53-r5', 'RA-1', 'hipaa', '164.308(a)(1)(ii)(A)', 'equivalent', 0.9),
('nist-800-53-r5', 'RA-3', 'hipaa', '164.308(a)(1)(ii)(B)', 'equivalent', 0.9),
('nist-800-53-r5', 'SC-8', 'hipaa', '164.312(e)(1)', 'equivalent', 0.9),
('nist-800-53-r5', 'SC-13', 'hipaa', '164.312(a)(2)(iv)', 'equivalent', 0.85),
('nist-800-53-r5', 'SC-28', 'hipaa', '164.312(a)(2)(iv)', 'partial', 0.8),
('nist-800-53-r5', 'SI-2', 'hipaa', '164.308(a)(5)(ii)(B)', 'partial', 0.7),
('nist-800-53-r5', 'SI-3', 'hipaa', '164.308(a)(5)(ii)(B)', 'equivalent', 0.85),
('nist-800-53-r5', 'SI-4', 'hipaa', '164.308(a)(5)(ii)(C)', 'partial', 0.75),
('nist-800-53-r5', 'PL-1', 'hipaa', '164.316(a)', 'equivalent', 0.85);

-- NIST 800-53 ↔ SOC 2
INSERT OR REPLACE INTO control_crosswalks (source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence) VALUES
('nist-800-53-r5', 'AT-2', 'soc2-type2', 'CC1.4', 'partial', 0.75),
('nist-800-53-r5', 'AU-2', 'soc2-type2', 'CC7.1', 'equivalent', 0.85),
('nist-800-53-r5', 'AU-6', 'soc2-type2', 'CC7.2', 'equivalent', 0.85),
('nist-800-53-r5', 'CA-2', 'soc2-type2', 'CC4.1', 'equivalent', 0.85),
('nist-800-53-r5', 'CA-7', 'soc2-type2', 'CC4.1', 'partial', 0.8),
('nist-800-53-r5', 'CM-3', 'soc2-type2', 'CC8.1', 'equivalent', 0.9),
('nist-800-53-r5', 'CM-6', 'soc2-type2', 'CC5.2', 'partial', 0.75),
('nist-800-53-r5', 'CP-1', 'soc2-type2', 'A1.2', 'partial', 0.8),
('nist-800-53-r5', 'CP-4', 'soc2-type2', 'A1.3', 'equivalent', 0.85),
('nist-800-53-r5', 'CP-9', 'soc2-type2', 'A1.2', 'partial', 0.8),
('nist-800-53-r5', 'IA-2', 'soc2-type2', 'CC6.1', 'equivalent', 0.85),
('nist-800-53-r5', 'IA-5', 'soc2-type2', 'CC6.1', 'partial', 0.8),
('nist-800-53-r5', 'IR-4', 'soc2-type2', 'CC7.4', 'equivalent', 0.9),
('nist-800-53-r5', 'IR-5', 'soc2-type2', 'CC7.5', 'equivalent', 0.85),
('nist-800-53-r5', 'PE-3', 'soc2-type2', 'CC6.4', 'equivalent', 0.85),
('nist-800-53-r5', 'PL-1', 'soc2-type2', 'CC5.3', 'partial', 0.75),
('nist-800-53-r5', 'RA-3', 'soc2-type2', 'CC3.2', 'equivalent', 0.85),
('nist-800-53-r5', 'RA-5', 'soc2-type2', 'CC7.1', 'partial', 0.8),
('nist-800-53-r5', 'SA-9', 'soc2-type2', 'CC9.2', 'equivalent', 0.85),
('nist-800-53-r5', 'SC-7', 'soc2-type2', 'CC6.6', 'equivalent', 0.85),
('nist-800-53-r5', 'SC-8', 'soc2-type2', 'CC6.7', 'equivalent', 0.9),
('nist-800-53-r5', 'SC-28', 'soc2-type2', 'C1.1', 'partial', 0.75),
('nist-800-53-r5', 'SI-3', 'soc2-type2', 'CC6.8', 'equivalent', 0.85);

-- NIST 800-53 ↔ CMMC L2 (via NIST 800-171)
INSERT OR REPLACE INTO control_crosswalks (source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence) VALUES
('nist-800-53-r5', 'AT-2', 'cmmc-l2', 'AT.L2-3.2.1', 'equivalent', 0.95),
('nist-800-53-r5', 'AT-3', 'cmmc-l2', 'AT.L2-3.2.2', 'equivalent', 0.95),
('nist-800-53-r5', 'AU-2', 'cmmc-l2', 'AU.L2-3.3.1', 'equivalent', 0.95),
('nist-800-53-r5', 'AU-3', 'cmmc-l2', 'AU.L2-3.3.2', 'equivalent', 0.95),
('nist-800-53-r5', 'AU-6', 'cmmc-l2', 'AU.L2-3.3.5', 'equivalent', 0.95),
('nist-800-53-r5', 'AU-8', 'cmmc-l2', 'AU.L2-3.3.7', 'equivalent', 0.95),
('nist-800-53-r5', 'AU-9', 'cmmc-l2', 'AU.L2-3.3.8', 'equivalent', 0.95),
('nist-800-53-r5', 'CM-2', 'cmmc-l2', 'CM.L2-3.4.1', 'equivalent', 0.95),
('nist-800-53-r5', 'CM-6', 'cmmc-l2', 'CM.L2-3.4.2', 'equivalent', 0.95),
('nist-800-53-r5', 'CM-3', 'cmmc-l2', 'CM.L2-3.4.3', 'equivalent', 0.95),
('nist-800-53-r5', 'CM-4', 'cmmc-l2', 'CM.L2-3.4.4', 'equivalent', 0.95),
('nist-800-53-r5', 'CM-7', 'cmmc-l2', 'CM.L2-3.4.6', 'equivalent', 0.95),
('nist-800-53-r5', 'IA-2', 'cmmc-l2', 'IA.L2-3.5.1', 'equivalent', 0.95),
('nist-800-53-r5', 'IA-5', 'cmmc-l2', 'IA.L2-3.5.7', 'partial', 0.85),
('nist-800-53-r5', 'IR-2', 'cmmc-l2', 'IR.L2-3.6.1', 'partial', 0.85),
('nist-800-53-r5', 'IR-4', 'cmmc-l2', 'IR.L2-3.6.1', 'equivalent', 0.95),
('nist-800-53-r5', 'IR-6', 'cmmc-l2', 'IR.L2-3.6.2', 'equivalent', 0.95),
('nist-800-53-r5', 'MA-2', 'cmmc-l2', 'MA.L2-3.7.1', 'equivalent', 0.95),
('nist-800-53-r5', 'MA-4', 'cmmc-l2', 'MA.L2-3.7.5', 'equivalent', 0.95),
('nist-800-53-r5', 'MP-2', 'cmmc-l2', 'MP.L2-3.8.1', 'equivalent', 0.95),
('nist-800-53-r5', 'MP-6', 'cmmc-l2', 'MP.L2-3.8.3', 'equivalent', 0.95),
('nist-800-53-r5', 'PE-2', 'cmmc-l2', 'PE.L2-3.10.1', 'equivalent', 0.95),
('nist-800-53-r5', 'PE-6', 'cmmc-l2', 'PE.L2-3.10.2', 'equivalent', 0.95),
('nist-800-53-r5', 'PS-3', 'cmmc-l2', 'PS.L2-3.9.1', 'equivalent', 0.95),
('nist-800-53-r5', 'PS-4', 'cmmc-l2', 'PS.L2-3.9.2', 'equivalent', 0.95),
('nist-800-53-r5', 'RA-3', 'cmmc-l2', 'RA.L2-3.11.1', 'equivalent', 0.95),
('nist-800-53-r5', 'RA-5', 'cmmc-l2', 'RA.L2-3.11.2', 'equivalent', 0.95),
('nist-800-53-r5', 'CA-2', 'cmmc-l2', 'CA.L2-3.12.1', 'equivalent', 0.95),
('nist-800-53-r5', 'CA-5', 'cmmc-l2', 'CA.L2-3.12.2', 'equivalent', 0.95),
('nist-800-53-r5', 'SC-7', 'cmmc-l2', 'SC.L2-3.13.1', 'equivalent', 0.95),
('nist-800-53-r5', 'SC-8', 'cmmc-l2', 'SC.L2-3.13.8', 'equivalent', 0.95),
('nist-800-53-r5', 'SC-13', 'cmmc-l2', 'SC.L2-3.13.11', 'equivalent', 0.95),
('nist-800-53-r5', 'SI-2', 'cmmc-l2', 'SI.L2-3.14.1', 'equivalent', 0.95),
('nist-800-53-r5', 'SI-3', 'cmmc-l2', 'SI.L2-3.14.2', 'equivalent', 0.95),
('nist-800-53-r5', 'SI-4', 'cmmc-l2', 'SI.L2-3.14.6', 'equivalent', 0.95);

-- NIST 800-53 ↔ ISO 27001
INSERT OR REPLACE INTO control_crosswalks (source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence) VALUES
('nist-800-53-r5', 'AC-1', 'iso-27001', 'A.5.1', 'partial', 0.8),
('nist-800-53-r5', 'AC-2', 'iso-27001', 'A.5.18', 'equivalent', 0.85),
('nist-800-53-r5', 'AC-3', 'iso-27001', 'A.8.3', 'equivalent', 0.85),
('nist-800-53-r5', 'AC-5', 'iso-27001', 'A.5.3', 'equivalent', 0.9),
('nist-800-53-r5', 'AC-6', 'iso-27001', 'A.8.2', 'equivalent', 0.85),
('nist-800-53-r5', 'AT-2', 'iso-27001', 'A.6.3', 'equivalent', 0.85),
('nist-800-53-r5', 'AU-2', 'iso-27001', 'A.8.15', 'equivalent', 0.85),
('nist-800-53-r5', 'AU-8', 'iso-27001', 'A.8.17', 'equivalent', 0.9),
('nist-800-53-r5', 'CA-2', 'iso-27001', 'A.5.35', 'partial', 0.75),
('nist-800-53-r5', 'CM-2', 'iso-27001', 'A.8.9', 'equivalent', 0.85),
('nist-800-53-r5', 'CM-3', 'iso-27001', 'A.8.32', 'equivalent', 0.85),
('nist-800-53-r5', 'CP-1', 'iso-27001', 'A.5.30', 'equivalent', 0.85),
('nist-800-53-r5', 'CP-9', 'iso-27001', 'A.8.13', 'equivalent', 0.9),
('nist-800-53-r5', 'IA-2', 'iso-27001', 'A.8.5', 'equivalent', 0.85),
('nist-800-53-r5', 'IA-5', 'iso-27001', 'A.5.17', 'equivalent', 0.85),
('nist-800-53-r5', 'IR-1', 'iso-27001', 'A.5.24', 'equivalent', 0.85),
('nist-800-53-r5', 'IR-4', 'iso-27001', 'A.5.26', 'equivalent', 0.9),
('nist-800-53-r5', 'IR-5', 'iso-27001', 'A.5.27', 'equivalent', 0.85),
('nist-800-53-r5', 'MA-2', 'iso-27001', 'A.7.13', 'equivalent', 0.85),
('nist-800-53-r5', 'MP-6', 'iso-27001', 'A.7.14', 'equivalent', 0.85),
('nist-800-53-r5', 'PE-2', 'iso-27001', 'A.7.2', 'equivalent', 0.85),
('nist-800-53-r5', 'PE-3', 'iso-27001', 'A.7.1', 'equivalent', 0.85),
('nist-800-53-r5', 'PS-2', 'iso-27001', 'A.6.1', 'equivalent', 0.85),
('nist-800-53-r5', 'PS-4', 'iso-27001', 'A.6.5', 'equivalent', 0.85),
('nist-800-53-r5', 'RA-3', 'iso-27001', 'A.5.7', 'partial', 0.75),
('nist-800-53-r5', 'RA-5', 'iso-27001', 'A.8.8', 'equivalent', 0.85),
('nist-800-53-r5', 'SA-4', 'iso-27001', 'A.5.20', 'partial', 0.8),
('nist-800-53-r5', 'SA-9', 'iso-27001', 'A.5.19', 'equivalent', 0.85),
('nist-800-53-r5', 'SC-7', 'iso-27001', 'A.8.22', 'equivalent', 0.85),
('nist-800-53-r5', 'SC-8', 'iso-27001', 'A.8.24', 'equivalent', 0.85),
('nist-800-53-r5', 'SC-12', 'iso-27001', 'A.8.24', 'partial', 0.8),
('nist-800-53-r5', 'SI-2', 'iso-27001', 'A.8.8', 'partial', 0.8),
('nist-800-53-r5', 'SI-3', 'iso-27001', 'A.8.7', 'equivalent', 0.9),
('nist-800-53-r5', 'SI-4', 'iso-27001', 'A.8.16', 'equivalent', 0.85),
('nist-800-53-r5', 'SA-8', 'iso-27001', 'A.8.27', 'equivalent', 0.85);

-- NIST 800-53 ↔ NIST CSF 2.0
INSERT OR REPLACE INTO control_crosswalks (source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence) VALUES
('nist-800-53-r5', 'AC-1', 'nist-csf-2', 'GV.PO-01', 'partial', 0.8),
('nist-800-53-r5', 'AC-2', 'nist-csf-2', 'PR.AA-01', 'equivalent', 0.85),
('nist-800-53-r5', 'AC-3', 'nist-csf-2', 'PR.AA-05', 'equivalent', 0.85),
('nist-800-53-r5', 'AT-2', 'nist-csf-2', 'PR.AT-01', 'equivalent', 0.9),
('nist-800-53-r5', 'AT-3', 'nist-csf-2', 'PR.AT-02', 'equivalent', 0.9),
('nist-800-53-r5', 'AU-2', 'nist-csf-2', 'DE.CM-01', 'partial', 0.8),
('nist-800-53-r5', 'AU-6', 'nist-csf-2', 'DE.AE-02', 'equivalent', 0.85),
('nist-800-53-r5', 'CA-2', 'nist-csf-2', 'ID.RA-01', 'partial', 0.8),
('nist-800-53-r5', 'CA-7', 'nist-csf-2', 'DE.CM-01', 'equivalent', 0.85),
('nist-800-53-r5', 'CM-2', 'nist-csf-2', 'PR.PS-01', 'equivalent', 0.85),
('nist-800-53-r5', 'CM-8', 'nist-csf-2', 'ID.AM-01', 'equivalent', 0.85),
('nist-800-53-r5', 'CP-2', 'nist-csf-2', 'RC.RP-01', 'partial', 0.8),
('nist-800-53-r5', 'CP-9', 'nist-csf-2', 'PR.DS-11', 'equivalent', 0.9),
('nist-800-53-r5', 'IA-2', 'nist-csf-2', 'PR.AA-03', 'equivalent', 0.9),
('nist-800-53-r5', 'IR-1', 'nist-csf-2', 'RS.MA-01', 'equivalent', 0.85),
('nist-800-53-r5', 'IR-4', 'nist-csf-2', 'RS.MI-01', 'equivalent', 0.85),
('nist-800-53-r5', 'IR-5', 'nist-csf-2', 'ID.IM-01', 'partial', 0.8),
('nist-800-53-r5', 'IR-6', 'nist-csf-2', 'RS.CO-02', 'equivalent', 0.85),
('nist-800-53-r5', 'PE-2', 'nist-csf-2', 'PR.AA-06', 'equivalent', 0.85),
('nist-800-53-r5', 'PM-9', 'nist-csf-2', 'GV.RM-01', 'equivalent', 0.85),
('nist-800-53-r5', 'RA-3', 'nist-csf-2', 'ID.RA-04', 'equivalent', 0.9),
('nist-800-53-r5', 'RA-5', 'nist-csf-2', 'ID.RA-01', 'equivalent', 0.85),
('nist-800-53-r5', 'SA-9', 'nist-csf-2', 'GV.SC-05', 'partial', 0.8),
('nist-800-53-r5', 'SC-7', 'nist-csf-2', 'PR.IR-01', 'equivalent', 0.85),
('nist-800-53-r5', 'SC-8', 'nist-csf-2', 'PR.DS-02', 'equivalent', 0.9),
('nist-800-53-r5', 'SC-28', 'nist-csf-2', 'PR.DS-01', 'equivalent', 0.9),
('nist-800-53-r5', 'SI-2', 'nist-csf-2', 'PR.PS-02', 'partial', 0.8),
('nist-800-53-r5', 'SI-4', 'nist-csf-2', 'DE.CM-09', 'equivalent', 0.85),
('nist-800-53-r5', 'SR-1', 'nist-csf-2', 'GV.SC-01', 'equivalent', 0.85);

-- NIST 800-53 ↔ PCI DSS v4.0
INSERT OR REPLACE INTO control_crosswalks (source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence) VALUES
('nist-800-53-r5', 'AC-2', 'pci-dss-v4', '7.2.1', 'partial', 0.8),
('nist-800-53-r5', 'AC-3', 'pci-dss-v4', '7.3.1', 'equivalent', 0.85),
('nist-800-53-r5', 'AC-7', 'pci-dss-v4', '8.3.6', 'partial', 0.75),
('nist-800-53-r5', 'AT-2', 'pci-dss-v4', '12.6.1', 'equivalent', 0.85),
('nist-800-53-r5', 'AU-2', 'pci-dss-v4', '10.2.1', 'equivalent', 0.85),
('nist-800-53-r5', 'AU-6', 'pci-dss-v4', '10.4.1', 'equivalent', 0.85),
('nist-800-53-r5', 'AU-9', 'pci-dss-v4', '10.3.2', 'equivalent', 0.85),
('nist-800-53-r5', 'AU-11', 'pci-dss-v4', '10.5.1', 'equivalent', 0.9),
('nist-800-53-r5', 'CM-3', 'pci-dss-v4', '6.5.1', 'equivalent', 0.85),
('nist-800-53-r5', 'CM-6', 'pci-dss-v4', '2.2.1', 'equivalent', 0.85),
('nist-800-53-r5', 'IA-2', 'pci-dss-v4', '8.2.1', 'equivalent', 0.85),
('nist-800-53-r5', 'IA-5', 'pci-dss-v4', '8.3.6', 'partial', 0.8),
('nist-800-53-r5', 'IR-1', 'pci-dss-v4', '12.10.1', 'equivalent', 0.85),
('nist-800-53-r5', 'PE-3', 'pci-dss-v4', '9.2.1', 'equivalent', 0.85),
('nist-800-53-r5', 'RA-5', 'pci-dss-v4', '11.3.1', 'equivalent', 0.85),
('nist-800-53-r5', 'SA-8', 'pci-dss-v4', '6.2.1', 'partial', 0.8),
('nist-800-53-r5', 'SC-7', 'pci-dss-v4', '1.3.1', 'equivalent', 0.85),
('nist-800-53-r5', 'SC-8', 'pci-dss-v4', '4.2.1', 'equivalent', 0.9),
('nist-800-53-r5', 'SC-13', 'pci-dss-v4', '3.5.1', 'partial', 0.8),
('nist-800-53-r5', 'SI-2', 'pci-dss-v4', '6.3.3', 'equivalent', 0.85),
('nist-800-53-r5', 'SI-3', 'pci-dss-v4', '5.2.1', 'equivalent', 0.9),
('nist-800-53-r5', 'SI-4', 'pci-dss-v4', '10.7.1', 'partial', 0.8),
('nist-800-53-r5', 'SA-11', 'pci-dss-v4', '6.4.1', 'partial', 0.75);
