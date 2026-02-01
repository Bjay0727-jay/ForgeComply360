-- ============================================================================
-- FORGECOMPLY 360 - ADDITIONAL SECURITY CONTROLS
-- HIPAA Implementation Specifications, SOC 2 Full TSC, CMMC L2 All Domains
-- ============================================================================

-- ============================================================================
-- HIPAA SECURITY RULE - IMPLEMENTATION SPECIFICATIONS
-- (Expanding beyond the existing 17 standard-level controls)
-- Sort order continues from 18
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('hipaa', '164.308(a)(1)(ii)(A)', 'Administrative Safeguards', 'Risk Analysis', 'Conduct an accurate and thorough assessment of the potential risks and vulnerabilities to the confidentiality, integrity, and availability of ePHI held by the covered entity or business associate.', 'P1', 1, 1, 1, 18),
('hipaa', '164.308(a)(1)(ii)(B)', 'Administrative Safeguards', 'Risk Management', 'Implement security measures sufficient to reduce risks and vulnerabilities to a reasonable and appropriate level to comply with the general security requirements.', 'P1', 1, 1, 1, 19),
('hipaa', '164.308(a)(1)(ii)(C)', 'Administrative Safeguards', 'Sanction Policy', 'Apply appropriate sanctions against workforce members who fail to comply with the security policies and procedures of the covered entity or business associate.', 'P1', 1, 1, 1, 20),
('hipaa', '164.308(a)(1)(ii)(D)', 'Administrative Safeguards', 'Information System Activity Review', 'Implement procedures to regularly review records of information system activity, such as audit logs, access reports, and security incident tracking reports.', 'P1', 1, 1, 1, 21),
('hipaa', '164.308(a)(3)(ii)(A)', 'Administrative Safeguards', 'Authorization and/or Supervision', 'Implement procedures for the authorization and/or supervision of workforce members who work with ePHI or in locations where it might be accessed.', 'P1', 1, 1, 1, 22),
('hipaa', '164.308(a)(3)(ii)(B)', 'Administrative Safeguards', 'Workforce Clearance Procedure', 'Implement procedures to determine that the access of a workforce member to ePHI is appropriate.', 'P1', 1, 1, 1, 23),
('hipaa', '164.308(a)(3)(ii)(C)', 'Administrative Safeguards', 'Termination Procedures', 'Implement procedures for terminating access to ePHI when the employment of, or other arrangement with, a workforce member ends.', 'P1', 1, 1, 1, 24),
('hipaa', '164.308(a)(4)(ii)(A)', 'Administrative Safeguards', 'Isolating Healthcare Clearinghouse Functions', 'If a healthcare clearinghouse is part of a larger organization, the clearinghouse must implement policies and procedures that protect ePHI from unauthorized access by the larger organization.', 'P1', 1, 1, 1, 25),
('hipaa', '164.308(a)(4)(ii)(B)', 'Administrative Safeguards', 'Access Authorization', 'Implement policies and procedures for granting access to ePHI, for example, through access to a workstation, transaction, program, process, or other mechanism.', 'P1', 1, 1, 1, 26),
('hipaa', '164.308(a)(4)(ii)(C)', 'Administrative Safeguards', 'Access Establishment and Modification', 'Implement policies and procedures that, based upon the covered entity or business associate access authorization policies, establish, document, review, and modify a user right of access to a workstation, transaction, program, or process.', 'P1', 1, 1, 1, 27),
('hipaa', '164.308(a)(5)(ii)(A)', 'Administrative Safeguards', 'Security Reminders', 'Provide periodic security updates and reminders to workforce members regarding their responsibilities for protecting ePHI.', 'P1', 1, 1, 1, 28),
('hipaa', '164.308(a)(5)(ii)(B)', 'Administrative Safeguards', 'Protection from Malicious Software', 'Implement procedures for guarding against, detecting, and reporting malicious software.', 'P1', 1, 1, 1, 29),
('hipaa', '164.308(a)(5)(ii)(C)', 'Administrative Safeguards', 'Log-in Monitoring', 'Implement procedures for monitoring log-in attempts and reporting discrepancies.', 'P1', 1, 1, 1, 30),
('hipaa', '164.308(a)(5)(ii)(D)', 'Administrative Safeguards', 'Password Management', 'Implement procedures for creating, changing, and safeguarding passwords.', 'P1', 1, 1, 1, 31),
('hipaa', '164.308(a)(6)(ii)', 'Administrative Safeguards', 'Response and Reporting', 'Identify and respond to suspected or known security incidents; mitigate, to the extent practicable, harmful effects of security incidents that are known to the covered entity or business associate; and document security incidents and their outcomes.', 'P1', 1, 1, 1, 32),
('hipaa', '164.308(a)(7)(ii)(A)', 'Administrative Safeguards', 'Data Backup Plan', 'Establish and implement procedures to create and maintain retrievable exact copies of ePHI.', 'P1', 1, 1, 1, 33),
('hipaa', '164.308(a)(7)(ii)(B)', 'Administrative Safeguards', 'Disaster Recovery Plan', 'Establish and implement as needed procedures to restore any loss of data.', 'P1', 1, 1, 1, 34),
('hipaa', '164.308(a)(7)(ii)(C)', 'Administrative Safeguards', 'Emergency Mode Operation Plan', 'Establish and implement as needed procedures to enable continuation of critical business processes for protection of the security of ePHI while operating in emergency mode.', 'P1', 1, 1, 1, 35),
('hipaa', '164.308(a)(7)(ii)(D)', 'Administrative Safeguards', 'Testing and Revision Procedures', 'Implement procedures for periodic testing and revision of contingency plans.', 'P1', 1, 1, 1, 36),
('hipaa', '164.308(a)(7)(ii)(E)', 'Administrative Safeguards', 'Applications and Data Criticality Analysis', 'Assess the relative criticality of specific applications and data in support of other contingency plan components.', 'P1', 1, 1, 1, 37),
('hipaa', '164.308(b)(1)', 'Administrative Safeguards', 'Business Associate Contracts', 'A covered entity may permit a business associate to create, receive, maintain, or transmit ePHI on its behalf only if the covered entity obtains satisfactory assurances that the business associate will appropriately safeguard the information through a written contract or other arrangement.', 'P1', 1, 1, 1, 38),
('hipaa', '164.310(a)(2)(i)', 'Physical Safeguards', 'Contingency Operations', 'Establish and implement as needed procedures that allow facility access in support of restoration of lost data under the disaster recovery plan and emergency mode operations plan.', 'P1', 1, 1, 1, 39),
('hipaa', '164.310(a)(2)(ii)', 'Physical Safeguards', 'Facility Security Plan', 'Implement policies and procedures to safeguard the facility and the equipment therein from unauthorized physical access, tampering, and theft.', 'P1', 1, 1, 1, 40),
('hipaa', '164.310(a)(2)(iii)', 'Physical Safeguards', 'Access Control and Validation', 'Implement procedures to control and validate a person access to facilities based on their role or function, including visitor control, and control of access to software programs for testing and revision.', 'P1', 1, 1, 1, 41),
('hipaa', '164.310(a)(2)(iv)', 'Physical Safeguards', 'Maintenance Records', 'Implement policies and procedures to document repairs and modifications to the physical components of a facility which are related to security.', 'P1', 1, 1, 1, 42),
('hipaa', '164.312(a)(2)(i)', 'Technical Safeguards', 'Unique User Identification', 'Assign a unique name and/or number for identifying and tracking user identity.', 'P1', 1, 1, 1, 43),
('hipaa', '164.312(a)(2)(ii)', 'Technical Safeguards', 'Emergency Access Procedure', 'Establish and implement as needed procedures for obtaining necessary ePHI during an emergency.', 'P1', 1, 1, 1, 44),
('hipaa', '164.312(a)(2)(iii)', 'Technical Safeguards', 'Automatic Logoff', 'Implement electronic procedures that terminate an electronic session after a predetermined time of inactivity.', 'P1', 1, 1, 1, 45),
('hipaa', '164.312(a)(2)(iv)', 'Technical Safeguards', 'Encryption and Decryption', 'Implement a mechanism to encrypt and decrypt ePHI.', 'P1', 1, 1, 1, 46),
('hipaa', '164.312(c)(2)', 'Technical Safeguards', 'Mechanism to Authenticate ePHI', 'Implement electronic mechanisms to corroborate that ePHI has not been altered or destroyed in an unauthorized manner.', 'P1', 1, 1, 1, 47),
('hipaa', '164.312(e)(2)(i)', 'Technical Safeguards', 'Integrity Controls', 'Implement security measures to ensure that electronically transmitted ePHI is not improperly modified without detection until disposed of.', 'P1', 1, 1, 1, 48),
('hipaa', '164.312(e)(2)(ii)', 'Technical Safeguards', 'Encryption', 'Implement a mechanism to encrypt ePHI whenever deemed appropriate during transmission over electronic communications networks.', 'P1', 1, 1, 1, 49),
('hipaa', '164.314(a)(1)', 'Organizational Requirements', 'Business Associate Contracts or Other Arrangements', 'The contract or other arrangement between the covered entity and its business associate must meet the requirements of the HIPAA Security Rule regarding safeguarding ePHI.', 'P1', 1, 1, 1, 50),
('hipaa', '164.314(a)(2)', 'Organizational Requirements', 'Other Arrangements', 'When a covered entity and its business associate are both governmental entities, the covered entity may comply through alternative means such as a memorandum of understanding.', 'P1', 1, 1, 1, 51),
('hipaa', '164.316(a)', 'Policies and Procedures and Documentation', 'Policies and Procedures', 'Implement reasonable and appropriate policies and procedures to comply with the standards, implementation specifications, or other requirements of the Security Rule.', 'P1', 1, 1, 1, 52),
('hipaa', '164.316(b)(1)', 'Policies and Procedures and Documentation', 'Documentation', 'Maintain the policies and procedures implemented to comply with the Security Rule in written form, which may be electronic.', 'P1', 1, 1, 1, 53),
('hipaa', '164.316(b)(2)(i)', 'Policies and Procedures and Documentation', 'Time Limit', 'Retain the documentation required for six years from the date of its creation or the date when it last was in effect, whichever is later.', 'P1', 1, 1, 1, 54),
('hipaa', '164.316(b)(2)(ii)', 'Policies and Procedures and Documentation', 'Availability', 'Make documentation available to those persons responsible for implementing the procedures to which the documentation pertains.', 'P1', 1, 1, 1, 55),
('hipaa', '164.316(b)(2)(iii)', 'Policies and Procedures and Documentation', 'Updates', 'Review documentation periodically, and update as needed, in response to environmental or organizational changes affecting the security of ePHI.', 'P1', 1, 1, 1, 56);

-- ============================================================================
-- SOC 2 TYPE II - REMAINING TRUST SERVICE CRITERIA
-- Sort order continues from 20
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('soc2-type2', 'CC1.4', 'Control Environment', 'COSO Principle 4', 'The entity demonstrates a commitment to attract, develop, and retain competent individuals in alignment with objectives.', 'P1', 1, 1, 1, 20),
('soc2-type2', 'CC1.5', 'Control Environment', 'COSO Principle 5', 'The entity holds individuals accountable for their internal control responsibilities in the pursuit of objectives.', 'P1', 1, 1, 1, 21),
('soc2-type2', 'CC2.2', 'Communication and Information', 'COSO Principle 14', 'The entity internally communicates information, including objectives and responsibilities for internal control, necessary to support the functioning of internal control.', 'P1', 1, 1, 1, 22),
('soc2-type2', 'CC2.3', 'Communication and Information', 'COSO Principle 15', 'The entity communicates with external parties regarding matters affecting the functioning of internal control.', 'P1', 1, 1, 1, 23),
('soc2-type2', 'CC3.3', 'Risk Assessment', 'COSO Principle 8', 'The entity considers the potential for fraud in assessing risks to the achievement of objectives.', 'P1', 1, 1, 1, 24),
('soc2-type2', 'CC3.4', 'Risk Assessment', 'COSO Principle 9', 'The entity identifies and assesses changes that could significantly impact the system of internal control.', 'P1', 1, 1, 1, 25),
('soc2-type2', 'CC4.2', 'Monitoring Activities', 'COSO Principle 17', 'The entity evaluates and communicates internal control deficiencies in a timely manner to those parties responsible for taking corrective action, including senior management and the board of directors.', 'P1', 1, 1, 1, 26),
('soc2-type2', 'CC5.3', 'Control Activities', 'COSO Principle 12', 'The entity deploys control activities through policies that establish what is expected and in procedures that put policies into action.', 'P1', 1, 1, 1, 27),
('soc2-type2', 'CC6.4', 'Logical and Physical Access Controls', 'Physical Access Restrictions', 'The entity restricts physical access to facilities and protected information assets to authorized personnel to meet the entity objectives.', 'P1', 1, 1, 1, 28),
('soc2-type2', 'CC6.5', 'Logical and Physical Access Controls', 'Logical Access Disposal', 'The entity discontinues logical and physical protections over physical assets only after the ability to read or recover data and software from those assets has been diminished and is no longer required to meet the entity objectives.', 'P1', 1, 1, 1, 29),
('soc2-type2', 'CC6.7', 'Logical and Physical Access Controls', 'Data Transmission Security', 'The entity restricts the transmission, movement, and removal of information to authorized internal and external users and processes, and protects it during transmission, movement, or removal to meet the entity objectives.', 'P1', 1, 1, 1, 30),
('soc2-type2', 'CC6.8', 'Logical and Physical Access Controls', 'Malicious Software Prevention', 'The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software to meet the entity objectives.', 'P1', 1, 1, 1, 31),
('soc2-type2', 'CC7.5', 'System Operations', 'Incident Recovery', 'The entity identifies, develops, and implements activities to recover from identified security incidents.', 'P1', 1, 1, 1, 32),
('soc2-type2', 'CC9.2', 'Risk Mitigation', 'Vendor and Business Partner Risk', 'The entity assesses and manages risks associated with vendors and business partners.', 'P1', 1, 1, 1, 33),
('soc2-type2', 'A1.1', 'Availability', 'Processing Capacity', 'The entity maintains, monitors, and evaluates current processing capacity and use of system components to manage capacity demand and to enable the implementation of additional capacity to help meet its objectives.', 'P1', 1, 1, 1, 34),
('soc2-type2', 'A1.2', 'Availability', 'Recovery Operations', 'The entity authorizes, designs, develops or acquires, implements, operates, approves, maintains, and monitors environmental protections, software, data backup processes, and recovery infrastructure to meet its objectives.', 'P1', 1, 1, 1, 35),
('soc2-type2', 'A1.3', 'Availability', 'Recovery Testing', 'The entity tests recovery plan procedures supporting system recovery to meet its objectives.', 'P1', 1, 1, 1, 36),
('soc2-type2', 'C1.1', 'Confidentiality', 'Confidential Information Identification', 'The entity identifies and maintains confidential information to meet the entity objectives related to confidentiality.', 'P1', 1, 1, 1, 37),
('soc2-type2', 'C1.2', 'Confidentiality', 'Confidential Information Disposal', 'The entity disposes of confidential information to meet the entity objectives related to confidentiality.', 'P1', 1, 1, 1, 38),
('soc2-type2', 'PI1.1', 'Processing Integrity', 'Processing Accuracy and Completeness', 'The entity implements policies and procedures over system processing to result in products, services, and reporting to meet the entity objectives.', 'P1', 1, 1, 1, 39),
('soc2-type2', 'PI1.2', 'Processing Integrity', 'Processing Input Validation', 'The entity implements policies and procedures over system inputs, including controls over completeness and accuracy, to result in products, services, and reporting to meet the entity objectives.', 'P1', 1, 1, 1, 40),
('soc2-type2', 'PI1.3', 'Processing Integrity', 'Processing Error Handling', 'The entity implements policies and procedures over system processing, including error handling, to result in products, services, and reporting to meet the entity objectives.', 'P1', 1, 1, 1, 41),
('soc2-type2', 'P1.1', 'Privacy', 'Privacy Notice', 'The entity provides notice to data subjects about its privacy practices to meet the entity objectives related to privacy.', 'P1', 1, 1, 1, 42),
('soc2-type2', 'P1.2', 'Privacy', 'Choice and Consent', 'The entity communicates choices available regarding the collection, use, retention, disclosure, and disposal of personal information to data subjects and obtains consent.', 'P1', 1, 1, 1, 43),
('soc2-type2', 'P1.3', 'Privacy', 'Personal Information Collection', 'The entity collects personal information only for the purposes identified in the notice to meet the entity objectives related to privacy.', 'P1', 1, 1, 1, 44),
('soc2-type2', 'P1.4', 'Privacy', 'Personal Information Use and Retention', 'The entity limits the use, retention, and disposal of personal information to the purposes identified in the notice and for which the data subject has provided implicit or explicit consent.', 'P1', 1, 1, 1, 45),
('soc2-type2', 'P1.5', 'Privacy', 'Personal Information Access', 'The entity grants identified and authenticated data subjects the ability to access their stored personal information for review and, upon request, provides physical or electronic copies.', 'P1', 1, 1, 1, 46),
('soc2-type2', 'P1.6', 'Privacy', 'Personal Information Disclosure', 'The entity discloses personal information to third parties with the consent of the data subject only for the purposes identified and described in the notice.', 'P1', 1, 1, 1, 47),
('soc2-type2', 'P1.7', 'Privacy', 'Personal Information Quality', 'The entity collects and maintains accurate, up-to-date, complete, and relevant personal information to meet the entity objectives related to privacy.', 'P1', 1, 1, 1, 48),
('soc2-type2', 'P1.8', 'Privacy', 'Privacy Complaint Management', 'The entity implements a process for receiving, addressing, resolving, and communicating the resolution of inquiries, complaints, and disputes from data subjects.', 'P1', 1, 1, 1, 49);

-- ============================================================================
-- CMMC LEVEL 2 - REMAINING ACCESS CONTROL (AC) PRACTICES
-- Sort order continues within Access Control family
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('cmmc-l2', 'AC.L2-3.1.6', 'Access Control', 'Non-Privileged Account Use', 'Use non-privileged accounts or roles when accessing nonsecurity functions.', 'P1', 1, 1, 1, 6),
('cmmc-l2', 'AC.L2-3.1.9', 'Access Control', 'Privacy and Security Notices', 'Provide privacy and security notices consistent with applicable CUI rules.', 'P1', 1, 1, 1, 9),
('cmmc-l2', 'AC.L2-3.1.10', 'Access Control', 'Session Lock', 'Use session lock with pattern-hiding displays to prevent access and viewing of data after a period of inactivity.', 'P1', 1, 1, 1, 10),
('cmmc-l2', 'AC.L2-3.1.11', 'Access Control', 'Session Termination', 'Terminate (automatically) a user session after a defined condition.', 'P1', 1, 1, 1, 11),
('cmmc-l2', 'AC.L2-3.1.13', 'Access Control', 'Remote Access Confidentiality', 'Employ cryptographic mechanisms to protect the confidentiality of remote access sessions.', 'P1', 1, 1, 1, 13),
('cmmc-l2', 'AC.L2-3.1.14', 'Access Control', 'Remote Access Routing', 'Route remote access via managed access control points.', 'P1', 1, 1, 1, 14),
('cmmc-l2', 'AC.L2-3.1.15', 'Access Control', 'Privileged Remote Access', 'Authorize remote execution of privileged commands and remote access to security-relevant information.', 'P1', 1, 1, 1, 15),
('cmmc-l2', 'AC.L2-3.1.16', 'Access Control', 'Wireless Access Authorization', 'Authorize wireless access prior to allowing such connections.', 'P1', 1, 1, 1, 16),
('cmmc-l2', 'AC.L2-3.1.17', 'Access Control', 'Wireless Access Protection', 'Protect wireless access using authentication and encryption.', 'P1', 1, 1, 1, 17),
('cmmc-l2', 'AC.L2-3.1.18', 'Access Control', 'Mobile Device Connection', 'Control connection of mobile devices.', 'P1', 1, 1, 1, 18),
('cmmc-l2', 'AC.L2-3.1.19', 'Access Control', 'Encrypt CUI on Mobile Devices', 'Encrypt CUI on mobile devices and mobile computing platforms.', 'P1', 1, 1, 1, 19),
('cmmc-l2', 'AC.L2-3.1.21', 'Access Control', 'Portable Storage Use', 'Limit use of portable storage devices on external systems.', 'P1', 1, 1, 1, 21),
('cmmc-l2', 'AC.L2-3.1.22', 'Access Control', 'Publicly Accessible Content Control', 'Control information posted or processed on publicly accessible systems.', 'P1', 1, 1, 1, 22);

-- ============================================================================
-- CMMC LEVEL 2 - AWARENESS AND TRAINING (AT)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('cmmc-l2', 'AT.L2-3.2.1', 'Awareness and Training', 'Role-Based Risk Awareness', 'Ensure that managers, systems administrators, and users of organizational systems are made aware of the security risks associated with their activities and of the applicable policies, standards, and procedures related to the security of those systems.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'AT.L2-3.2.2', 'Awareness and Training', 'Role-Based Training', 'Ensure that personnel are trained to carry out their assigned information security-related duties and responsibilities.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'AT.L2-3.2.3', 'Awareness and Training', 'Insider Threat Awareness', 'Provide security awareness training on recognizing and reporting potential indicators of insider threat.', 'P1', 1, 1, 1, 3);

-- ============================================================================
-- CMMC LEVEL 2 - AUDIT AND ACCOUNTABILITY (AU)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('cmmc-l2', 'AU.L2-3.3.1', 'Audit and Accountability', 'System Auditing', 'Create and retain system audit logs and records to the extent needed to enable the monitoring, analysis, investigation, and reporting of unlawful or unauthorized system activity.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'AU.L2-3.3.2', 'Audit and Accountability', 'User Accountability', 'Ensure that the actions of individual system users can be uniquely traced to those users so they can be held accountable for their actions.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'AU.L2-3.3.3', 'Audit and Accountability', 'Event Review', 'Review and update logged events.', 'P1', 1, 1, 1, 3),
('cmmc-l2', 'AU.L2-3.3.4', 'Audit and Accountability', 'Audit Failure Alerting', 'Alert in the event of an audit logging process failure.', 'P1', 1, 1, 1, 4),
('cmmc-l2', 'AU.L2-3.3.5', 'Audit and Accountability', 'Audit Correlation', 'Correlate audit record review, analysis, and reporting processes for investigation and response to indications of unlawful, unauthorized, suspicious, or unusual activity.', 'P1', 1, 1, 1, 5),
('cmmc-l2', 'AU.L2-3.3.6', 'Audit and Accountability', 'Audit Reduction and Reporting', 'Provide audit record reduction and report generation to support on-demand analysis and reporting.', 'P1', 1, 1, 1, 6),
('cmmc-l2', 'AU.L2-3.3.7', 'Audit and Accountability', 'Authoritative Time Source', 'Provide a system capability that compares and synchronizes internal system clocks with an authoritative source to generate time stamps for audit records.', 'P1', 1, 1, 1, 7),
('cmmc-l2', 'AU.L2-3.3.8', 'Audit and Accountability', 'Audit Protection', 'Protect audit information and audit logging tools from unauthorized access, modification, and deletion.', 'P1', 1, 1, 1, 8),
('cmmc-l2', 'AU.L2-3.3.9', 'Audit and Accountability', 'Audit Management', 'Limit management of audit logging functionality to a subset of privileged users.', 'P1', 1, 1, 1, 9);

-- ============================================================================
-- CMMC LEVEL 2 - CONFIGURATION MANAGEMENT (CM)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('cmmc-l2', 'CM.L2-3.4.1', 'Configuration Management', 'System Baselining', 'Establish and maintain baseline configurations and inventories of organizational systems including hardware, software, firmware, and documentation throughout the respective system development life cycles.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'CM.L2-3.4.2', 'Configuration Management', 'Security Configuration Enforcement', 'Establish and enforce security configuration settings for information technology products employed in organizational systems.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'CM.L2-3.4.3', 'Configuration Management', 'System Change Management', 'Track, review, approve or disapprove, and log changes to organizational systems.', 'P1', 1, 1, 1, 3),
('cmmc-l2', 'CM.L2-3.4.4', 'Configuration Management', 'Security Impact Analysis', 'Analyze the security impact of changes prior to implementation.', 'P1', 1, 1, 1, 4),
('cmmc-l2', 'CM.L2-3.4.5', 'Configuration Management', 'Access Restrictions for Change', 'Define, document, approve, and enforce physical and logical access restrictions associated with changes to organizational systems.', 'P1', 1, 1, 1, 5),
('cmmc-l2', 'CM.L2-3.4.6', 'Configuration Management', 'Least Functionality', 'Employ the principle of least functionality by configuring organizational systems to provide only essential capabilities.', 'P1', 1, 1, 1, 6),
('cmmc-l2', 'CM.L2-3.4.7', 'Configuration Management', 'Nonessential Functionality', 'Restrict, disable, or prevent the use of nonessential programs, functions, ports, protocols, and services.', 'P1', 1, 1, 1, 7),
('cmmc-l2', 'CM.L2-3.4.8', 'Configuration Management', 'Application Execution Policy', 'Apply deny-by-exception (blacklisting) policy to prevent the use of unauthorized software or deny-all, permit-by-exception (whitelisting) policy to allow the execution of authorized software.', 'P1', 1, 1, 1, 8),
('cmmc-l2', 'CM.L2-3.4.9', 'Configuration Management', 'User-Installed Software', 'Control and monitor user-installed software.', 'P1', 1, 1, 1, 9);

-- ============================================================================
-- CMMC LEVEL 2 - IDENTIFICATION AND AUTHENTICATION (IA)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('cmmc-l2', 'IA.L2-3.5.1', 'Identification and Authentication', 'Identification', 'Identify system users, processes acting on behalf of users, and devices.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'IA.L2-3.5.2', 'Identification and Authentication', 'Authentication', 'Authenticate (or verify) the identities of users, processes, or devices, as a prerequisite to allowing access to organizational systems.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'IA.L2-3.5.3', 'Identification and Authentication', 'Multifactor Authentication', 'Use multifactor authentication for local and network access to privileged accounts and for network access to non-privileged accounts.', 'P1', 1, 1, 1, 3),
('cmmc-l2', 'IA.L2-3.5.4', 'Identification and Authentication', 'Replay-Resistant Authentication', 'Employ replay-resistant authentication mechanisms for network access to privileged and non-privileged accounts.', 'P1', 1, 1, 1, 4),
('cmmc-l2', 'IA.L2-3.5.5', 'Identification and Authentication', 'Identifier Reuse Prevention', 'Prevent reuse of identifiers for a defined period.', 'P1', 1, 1, 1, 5),
('cmmc-l2', 'IA.L2-3.5.6', 'Identification and Authentication', 'Identifier Inactivity', 'Disable identifiers after a defined period of inactivity.', 'P1', 1, 1, 1, 6),
('cmmc-l2', 'IA.L2-3.5.7', 'Identification and Authentication', 'Password Complexity', 'Enforce a minimum password complexity and change of characters when new passwords are created.', 'P1', 1, 1, 1, 7),
('cmmc-l2', 'IA.L2-3.5.8', 'Identification and Authentication', 'Password Reuse', 'Prohibit password reuse for a specified number of generations.', 'P1', 1, 1, 1, 8),
('cmmc-l2', 'IA.L2-3.5.9', 'Identification and Authentication', 'Temporary Passwords', 'Allow temporary password use for system logons with an immediate change to a permanent password.', 'P1', 1, 1, 1, 9),
('cmmc-l2', 'IA.L2-3.5.10', 'Identification and Authentication', 'Cryptographic Password Storage', 'Store and transmit only cryptographically-protected passwords.', 'P1', 1, 1, 1, 10),
('cmmc-l2', 'IA.L2-3.5.11', 'Identification and Authentication', 'Obscure Feedback', 'Obscure feedback of authentication information.', 'P1', 1, 1, 1, 11);

-- ============================================================================
-- CMMC LEVEL 2 - INCIDENT RESPONSE (IR)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('cmmc-l2', 'IR.L2-3.6.1', 'Incident Response', 'Incident Handling', 'Establish an operational incident-handling capability for organizational systems that includes preparation, detection, analysis, containment, recovery, and user response activities.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'IR.L2-3.6.2', 'Incident Response', 'Incident Reporting', 'Track, document, and report incidents to designated officials and/or authorities both internal and external to the organization.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'IR.L2-3.6.3', 'Incident Response', 'Incident Response Testing', 'Test the organizational incident response capability.', 'P1', 1, 1, 1, 3);

-- ============================================================================
-- CMMC LEVEL 2 - MAINTENANCE (MA)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('cmmc-l2', 'MA.L2-3.7.1', 'Maintenance', 'System Maintenance', 'Perform maintenance on organizational systems.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'MA.L2-3.7.2', 'Maintenance', 'Maintenance Tool Control', 'Provide controls on the tools, techniques, mechanisms, and personnel used to conduct system maintenance.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'MA.L2-3.7.3', 'Maintenance', 'Equipment Sanitization', 'Ensure equipment removed for off-site maintenance is sanitized of any CUI.', 'P1', 1, 1, 1, 3),
('cmmc-l2', 'MA.L2-3.7.4', 'Maintenance', 'Media Inspection', 'Check media containing diagnostic and test programs for malicious code before the media are used in organizational systems.', 'P1', 1, 1, 1, 4),
('cmmc-l2', 'MA.L2-3.7.5', 'Maintenance', 'Nonlocal Maintenance', 'Require multifactor authentication to establish nonlocal maintenance sessions via external network connections and terminate such connections when nonlocal maintenance is complete.', 'P1', 1, 1, 1, 5),
('cmmc-l2', 'MA.L2-3.7.6', 'Maintenance', 'Maintenance Personnel', 'Supervise the maintenance activities of maintenance personnel without required access authorization.', 'P1', 1, 1, 1, 6);

-- ============================================================================
-- CMMC LEVEL 2 - MEDIA PROTECTION (MP)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('cmmc-l2', 'MP.L2-3.8.1', 'Media Protection', 'Media Protection', 'Protect (i.e., physically control and securely store) system media containing CUI, both paper and digital.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'MP.L2-3.8.2', 'Media Protection', 'Media Access', 'Limit access to CUI on system media to authorized users.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'MP.L2-3.8.3', 'Media Protection', 'Media Sanitization', 'Sanitize or destroy system media containing CUI before disposal or release for reuse.', 'P1', 1, 1, 1, 3),
('cmmc-l2', 'MP.L2-3.8.4', 'Media Protection', 'Media Marking', 'Mark media with necessary CUI markings and distribution limitations.', 'P1', 1, 1, 1, 4),
('cmmc-l2', 'MP.L2-3.8.5', 'Media Protection', 'Media Accountability', 'Control access to media containing CUI and maintain accountability for media during transport outside of controlled areas.', 'P1', 1, 1, 1, 5),
('cmmc-l2', 'MP.L2-3.8.6', 'Media Protection', 'Portable Storage Encryption', 'Implement cryptographic mechanisms to protect the confidentiality of CUI stored on digital media during transport unless otherwise protected by alternative physical safeguards.', 'P1', 1, 1, 1, 6),
('cmmc-l2', 'MP.L2-3.8.7', 'Media Protection', 'Removable Media Control', 'Control the use of removable media on system components.', 'P1', 1, 1, 1, 7),
('cmmc-l2', 'MP.L2-3.8.8', 'Media Protection', 'Shared Media', 'Prohibit the use of portable storage devices when such devices have no identifiable owner.', 'P1', 1, 1, 1, 8),
('cmmc-l2', 'MP.L2-3.8.9', 'Media Protection', 'Backup Storage Protection', 'Protect the confidentiality of backup CUI at storage locations.', 'P1', 1, 1, 1, 9);

-- ============================================================================
-- CMMC LEVEL 2 - PERSONNEL SECURITY (PS)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('cmmc-l2', 'PS.L2-3.9.1', 'Personnel Security', 'Personnel Screening', 'Screen individuals prior to authorizing access to organizational systems containing CUI.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'PS.L2-3.9.2', 'Personnel Security', 'Personnel Actions', 'Ensure that organizational systems containing CUI are protected during and after personnel actions such as terminations and transfers.', 'P1', 1, 1, 1, 2);

-- ============================================================================
-- CMMC LEVEL 2 - PHYSICAL PROTECTION (PE)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('cmmc-l2', 'PE.L2-3.10.1', 'Physical Protection', 'Physical Access Limitation', 'Limit physical access to organizational systems, equipment, and the respective operating environments to authorized individuals.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'PE.L2-3.10.2', 'Physical Protection', 'Physical Access Monitoring', 'Protect and monitor the physical facility and support infrastructure for organizational systems.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'PE.L2-3.10.3', 'Physical Protection', 'Escort Visitors', 'Escort visitors and monitor visitor activity.', 'P1', 1, 1, 1, 3),
('cmmc-l2', 'PE.L2-3.10.4', 'Physical Protection', 'Physical Access Logs', 'Maintain audit logs of physical access.', 'P1', 1, 1, 1, 4),
('cmmc-l2', 'PE.L2-3.10.5', 'Physical Protection', 'Physical Access Devices', 'Control and manage physical access devices.', 'P1', 1, 1, 1, 5),
('cmmc-l2', 'PE.L2-3.10.6', 'Physical Protection', 'Alternative Work Sites', 'Enforce safeguarding measures for CUI at alternate work sites.', 'P1', 1, 1, 1, 6);

-- ============================================================================
-- CMMC LEVEL 2 - RISK ASSESSMENT (RA)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('cmmc-l2', 'RA.L2-3.11.1', 'Risk Assessment', 'Risk Assessments', 'Periodically assess the risk to organizational operations, organizational assets, and individuals, resulting from the operation of organizational systems and the associated processing, storage, or transmission of CUI.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'RA.L2-3.11.2', 'Risk Assessment', 'Vulnerability Scanning', 'Scan for vulnerabilities in organizational systems and applications periodically and when new vulnerabilities affecting those systems and applications are identified.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'RA.L2-3.11.3', 'Risk Assessment', 'Vulnerability Remediation', 'Remediate vulnerabilities in accordance with risk assessments.', 'P1', 1, 1, 1, 3);

-- ============================================================================
-- CMMC LEVEL 2 - SECURITY ASSESSMENT (CA)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('cmmc-l2', 'CA.L2-3.12.1', 'Security Assessment', 'Security Control Assessment', 'Periodically assess the security controls in organizational systems to determine if the controls are effective in their application.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'CA.L2-3.12.2', 'Security Assessment', 'Plan of Action', 'Develop and implement plans of action designed to correct deficiencies and reduce or eliminate vulnerabilities in organizational systems.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'CA.L2-3.12.3', 'Security Assessment', 'Security Control Monitoring', 'Monitor security controls on an ongoing basis to ensure the continued effectiveness of the controls.', 'P1', 1, 1, 1, 3),
('cmmc-l2', 'CA.L2-3.12.4', 'Security Assessment', 'System Security Plan', 'Develop, document, and periodically update system security plans that describe system boundaries, system environments of operation, how security requirements are implemented, and the relationships with or connections to other systems.', 'P1', 1, 1, 1, 4);

-- ============================================================================
-- CMMC LEVEL 2 - SYSTEM AND COMMUNICATIONS PROTECTION (SC)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('cmmc-l2', 'SC.L2-3.13.1', 'System and Communications Protection', 'Boundary Protection', 'Monitor, control, and protect communications at the external boundaries and key internal boundaries of organizational systems.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'SC.L2-3.13.2', 'System and Communications Protection', 'Security Architecture', 'Employ architectural designs, software development techniques, and systems engineering principles that promote effective information security within organizational systems.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'SC.L2-3.13.3', 'System and Communications Protection', 'User and System Separation', 'Separate user functionality from system management functionality.', 'P1', 1, 1, 1, 3),
('cmmc-l2', 'SC.L2-3.13.4', 'System and Communications Protection', 'Shared Resource Control', 'Prevent unauthorized and unintended information transfer via shared system resources.', 'P1', 1, 1, 1, 4),
('cmmc-l2', 'SC.L2-3.13.5', 'System and Communications Protection', 'Public Access System Separation', 'Implement subnetworks for publicly accessible system components that are physically or logically separated from internal networks.', 'P1', 1, 1, 1, 5),
('cmmc-l2', 'SC.L2-3.13.6', 'System and Communications Protection', 'Network Communication by Exception', 'Deny network communications traffic by default and allow network communications traffic by exception.', 'P1', 1, 1, 1, 6),
('cmmc-l2', 'SC.L2-3.13.7', 'System and Communications Protection', 'Split Tunneling Prevention', 'Prevent remote devices from simultaneously establishing non-remote connections with organizational systems and communicating via some other connection to resources in external networks.', 'P1', 1, 1, 1, 7),
('cmmc-l2', 'SC.L2-3.13.8', 'System and Communications Protection', 'Data in Transit Encryption', 'Implement cryptographic mechanisms to prevent unauthorized disclosure of CUI during transmission unless otherwise protected by alternative physical safeguards.', 'P1', 1, 1, 1, 8),
('cmmc-l2', 'SC.L2-3.13.9', 'System and Communications Protection', 'Network Connection Termination', 'Terminate network connections associated with communications sessions at the end of the sessions or after a defined period of inactivity.', 'P1', 1, 1, 1, 9),
('cmmc-l2', 'SC.L2-3.13.10', 'System and Communications Protection', 'Cryptographic Key Management', 'Establish and manage cryptographic keys for cryptography employed in organizational systems.', 'P1', 1, 1, 1, 10),
('cmmc-l2', 'SC.L2-3.13.11', 'System and Communications Protection', 'CUI Encryption', 'Employ FIPS-validated cryptography when used to protect the confidentiality of CUI.', 'P1', 1, 1, 1, 11),
('cmmc-l2', 'SC.L2-3.13.12', 'System and Communications Protection', 'Collaborative Device Control', 'Prohibit remote activation of collaborative computing devices and provide indication of devices in use to users present at the device.', 'P1', 1, 1, 1, 12),
('cmmc-l2', 'SC.L2-3.13.13', 'System and Communications Protection', 'Mobile Code Control', 'Control and monitor the use of mobile code.', 'P1', 1, 1, 1, 13),
('cmmc-l2', 'SC.L2-3.13.14', 'System and Communications Protection', 'Voice over IP Control', 'Control and monitor the use of Voice over Internet Protocol (VoIP) technologies.', 'P1', 1, 1, 1, 14),
('cmmc-l2', 'SC.L2-3.13.15', 'System and Communications Protection', 'Communications Authenticity', 'Protect the authenticity of communications sessions.', 'P1', 1, 1, 1, 15),
('cmmc-l2', 'SC.L2-3.13.16', 'System and Communications Protection', 'Data at Rest Encryption', 'Protect the confidentiality of CUI at rest.', 'P1', 1, 1, 1, 16);

-- ============================================================================
-- CMMC LEVEL 2 - SYSTEM AND INFORMATION INTEGRITY (SI)
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('cmmc-l2', 'SI.L2-3.14.1', 'System and Information Integrity', 'Flaw Remediation', 'Identify, report, and correct system flaws in a timely manner.', 'P1', 1, 1, 1, 1),
('cmmc-l2', 'SI.L2-3.14.2', 'System and Information Integrity', 'Malicious Code Protection', 'Provide protection from malicious code at designated locations within organizational systems.', 'P1', 1, 1, 1, 2),
('cmmc-l2', 'SI.L2-3.14.3', 'System and Information Integrity', 'Security Alerts and Advisories', 'Monitor system security alerts and advisories and take action in response.', 'P1', 1, 1, 1, 3),
('cmmc-l2', 'SI.L2-3.14.4', 'System and Information Integrity', 'Update Malicious Code Protection', 'Update malicious code protection mechanisms when new releases are available.', 'P1', 1, 1, 1, 4),
('cmmc-l2', 'SI.L2-3.14.5', 'System and Information Integrity', 'System and File Scanning', 'Perform periodic scans of organizational systems and real-time scans of files from external sources as files are downloaded, opened, or executed.', 'P1', 1, 1, 1, 5),
('cmmc-l2', 'SI.L2-3.14.6', 'System and Information Integrity', 'Inbound Traffic Monitoring', 'Monitor organizational systems, including inbound and outbound communications traffic, to detect attacks and indicators of potential attacks.', 'P1', 1, 1, 1, 6),
('cmmc-l2', 'SI.L2-3.14.7', 'System and Information Integrity', 'Unauthorized Use Detection', 'Identify unauthorized use of organizational systems.', 'P1', 1, 1, 1, 7);
