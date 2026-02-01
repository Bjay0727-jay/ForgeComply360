-- ============================================================================
-- FORGECOMPLY 360 - FRAMEWORK CONTROLS SEED DATA
-- ISO 27001:2022, NIST CSF 2.0, PCI DSS v4.0
-- ============================================================================

-- ============================================================================
-- ISO 27001:2022 ANNEX A CONTROLS (framework_id = 'iso-27001')
-- ============================================================================

-- --------------------------------------------------------------------------
-- Organizational Controls (A.5.x)
-- --------------------------------------------------------------------------
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.1', 'Organizational Controls', 'Policies for information security', 'Define, approve, publish, communicate, and review information security policies and topic-specific policies at planned intervals or when significant changes occur.', 'P1', 1, 1, 1, 1);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.2', 'Organizational Controls', 'Information security roles and responsibilities', 'Define and allocate information security roles and responsibilities according to organizational needs.', 'P1', 1, 1, 1, 2);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.3', 'Organizational Controls', 'Segregation of duties', 'Segregate conflicting duties and areas of responsibility to reduce opportunities for unauthorized or unintentional modification or misuse of organizational assets.', 'P1', 1, 1, 1, 3);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.4', 'Organizational Controls', 'Management responsibilities', 'Require management to ensure all personnel apply information security in accordance with the established policies and procedures of the organization.', 'P1', 1, 1, 1, 4);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.5', 'Organizational Controls', 'Contact with authorities', 'Establish and maintain contact with relevant authorities such as law enforcement, regulatory bodies, and supervisory authorities.', 'P1', 1, 1, 1, 5);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.6', 'Organizational Controls', 'Contact with special interest groups', 'Establish and maintain contact with special interest groups, security forums, and professional associations to stay informed about security threats and best practices.', 'P1', 1, 1, 1, 6);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.7', 'Organizational Controls', 'Threat intelligence', 'Collect and analyze information relating to information security threats to produce actionable threat intelligence for the organization.', 'P1', 1, 1, 1, 7);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.8', 'Organizational Controls', 'Information security in project management', 'Integrate information security into project management processes regardless of the type of project to ensure risks are identified and addressed.', 'P1', 1, 1, 1, 8);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.9', 'Organizational Controls', 'Inventory of information and other associated assets', 'Develop and maintain an inventory of information and other associated assets, including their owners, and keep it current.', 'P1', 1, 1, 1, 9);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.10', 'Organizational Controls', 'Acceptable use of information and other associated assets', 'Identify, document, and implement rules for the acceptable use of and procedures for handling information and other associated assets.', 'P1', 1, 1, 1, 10);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.11', 'Organizational Controls', 'Return of assets', 'Require personnel and other interested parties to return all organizational assets in their possession upon change or termination of their employment, contract, or agreement.', 'P1', 1, 1, 1, 11);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.12', 'Organizational Controls', 'Classification of information', 'Classify information according to the information security needs of the organization based on confidentiality, integrity, availability, and relevant interested party requirements.', 'P1', 1, 1, 1, 12);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.13', 'Organizational Controls', 'Labelling of information', 'Develop and implement an appropriate set of procedures for information labelling in accordance with the information classification scheme adopted by the organization.', 'P1', 1, 1, 1, 13);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.14', 'Organizational Controls', 'Information transfer', 'Establish information transfer rules, procedures, and agreements for all types of transfer facilities within the organization and between the organization and other parties.', 'P1', 1, 1, 1, 14);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.15', 'Organizational Controls', 'Access control', 'Establish and implement rules to control physical and logical access to information and other associated assets based on business and information security requirements.', 'P1', 1, 1, 1, 15);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.16', 'Organizational Controls', 'Identity management', 'Manage the full lifecycle of identities, including registration, verification, provisioning, and deprovisioning of user and system identities.', 'P1', 1, 1, 1, 16);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.17', 'Organizational Controls', 'Authentication information', 'Control the allocation and management of authentication information through a defined management process including advising personnel on appropriate handling.', 'P1', 1, 1, 1, 17);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.18', 'Organizational Controls', 'Access rights', 'Provision, review, modify, and remove access rights to information and other associated assets in accordance with the organization topic-specific policy on and rules for access control.', 'P1', 1, 1, 1, 18);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.19', 'Organizational Controls', 'Information security in supplier relationships', 'Define and implement processes and procedures to manage the information security risks associated with the use of supplier products or services.', 'P1', 1, 1, 1, 19);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.20', 'Organizational Controls', 'Addressing information security within supplier agreements', 'Establish and agree relevant information security requirements with each supplier based on the type of supplier relationship.', 'P1', 1, 1, 1, 20);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.21', 'Organizational Controls', 'Managing information security in the ICT supply chain', 'Define and implement processes and procedures for managing information security risks in the ICT products and services supply chain.', 'P1', 1, 1, 1, 21);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.22', 'Organizational Controls', 'Monitoring, review and change management of supplier services', 'Regularly monitor, review, evaluate, and manage change in supplier information security practices and service delivery.', 'P1', 1, 1, 1, 22);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.23', 'Organizational Controls', 'Information security for use of cloud services', 'Establish processes for acquisition, use, management, and exit from cloud services in accordance with the organization information security requirements.', 'P1', 1, 1, 1, 23);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.24', 'Organizational Controls', 'Information security incident management planning and preparation', 'Plan and prepare for managing information security incidents by defining, establishing, and communicating incident management processes, roles, and responsibilities.', 'P1', 1, 1, 1, 24);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.25', 'Organizational Controls', 'Assessment and decision on information security events', 'Assess information security events and decide if they are to be categorized as information security incidents requiring further action.', 'P1', 1, 1, 1, 25);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.26', 'Organizational Controls', 'Response to information security incidents', 'Respond to information security incidents in accordance with the documented procedures and established incident response plans.', 'P1', 1, 1, 1, 26);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.27', 'Organizational Controls', 'Learning from information security incidents', 'Use knowledge gained from information security incidents to strengthen and improve the information security controls and incident management processes.', 'P1', 1, 1, 1, 27);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.28', 'Organizational Controls', 'Collection of evidence', 'Establish and implement procedures for the identification, collection, acquisition, and preservation of evidence related to information security events.', 'P1', 1, 1, 1, 28);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.29', 'Organizational Controls', 'Information security during disruption', 'Plan how to maintain information security at an appropriate level during disruption to ensure continuity of information security protections.', 'P1', 1, 1, 1, 29);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.30', 'Organizational Controls', 'ICT readiness for business continuity', 'Plan, implement, maintain, and test ICT readiness based on business continuity objectives and ICT continuity requirements to ensure organizational resilience.', 'P1', 1, 1, 1, 30);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.31', 'Organizational Controls', 'Legal, statutory, regulatory and contractual requirements', 'Identify, document, and keep up to date the relevant legal, statutory, regulatory, and contractual requirements and the organization approach to meeting these requirements.', 'P1', 1, 1, 1, 31);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.32', 'Organizational Controls', 'Intellectual property rights', 'Implement appropriate procedures to protect intellectual property rights including for software, design documents, and other materials subject to such rights.', 'P1', 1, 1, 1, 32);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.33', 'Organizational Controls', 'Protection of records', 'Protect records from loss, destruction, falsification, unauthorized access, and unauthorized release in accordance with legal, regulatory, contractual, and business requirements.', 'P1', 1, 1, 1, 33);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.34', 'Organizational Controls', 'Privacy and protection of PII', 'Identify and meet the requirements regarding the preservation of privacy and protection of personally identifiable information as required by applicable laws, regulations, and contractual obligations.', 'P1', 1, 1, 1, 34);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.35', 'Organizational Controls', 'Independent review of information security', 'Review the organization approach to managing information security and its implementation including people, processes, and technologies at planned intervals or when significant changes occur.', 'P1', 1, 1, 1, 35);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.36', 'Organizational Controls', 'Compliance with policies, rules and standards for information security', 'Regularly review compliance with the organization information security policy, topic-specific policies, rules, and standards.', 'P1', 1, 1, 1, 36);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.5.37', 'Organizational Controls', 'Documented operating procedures', 'Document operating procedures for information processing facilities and make them available to personnel who need them.', 'P1', 1, 1, 1, 37);

-- --------------------------------------------------------------------------
-- People Controls (A.6.x)
-- --------------------------------------------------------------------------
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.6.1', 'People Controls', 'Screening', 'Conduct background verification checks on all candidates for employment in accordance with relevant laws, regulations, and ethics, proportional to business requirements, classification of information, and perceived risks.', 'P1', 1, 1, 1, 38);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.6.2', 'People Controls', 'Terms and conditions of employment', 'State the employees and contractors contractual obligations regarding information security responsibilities that remain valid after termination or change of employment.', 'P1', 1, 1, 1, 39);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.6.3', 'People Controls', 'Information security awareness, education and training', 'Ensure personnel and relevant interested parties receive appropriate information security awareness, education, and training and regular updates in organizational policies and procedures relevant to their job function.', 'P1', 1, 1, 1, 40);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.6.4', 'People Controls', 'Disciplinary process', 'Formalize and communicate a disciplinary process to take actions against personnel and other relevant interested parties who have committed an information security policy violation.', 'P1', 1, 1, 1, 41);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.6.5', 'People Controls', 'Responsibilities after termination or change of employment', 'Define, communicate, and enforce information security responsibilities and duties that remain valid after termination or change of employment.', 'P1', 1, 1, 1, 42);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.6.6', 'People Controls', 'Confidentiality or non-disclosure agreements', 'Identify, regularly review, and document requirements for confidentiality or non-disclosure agreements reflecting the organization needs for the protection of information.', 'P1', 1, 1, 1, 43);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.6.7', 'People Controls', 'Remote working', 'Implement security measures when personnel are working remotely to protect information accessed, processed, or stored outside the organization premises.', 'P1', 1, 1, 1, 44);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.6.8', 'People Controls', 'Information security event reporting', 'Provide a mechanism for personnel to report observed or suspected information security events through appropriate channels in a timely manner.', 'P1', 1, 1, 1, 45);

-- --------------------------------------------------------------------------
-- Physical Controls (A.7.x)
-- --------------------------------------------------------------------------
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.7.1', 'Physical Controls', 'Physical security perimeters', 'Define security perimeters and use them to protect areas that contain information and other associated assets including information processing facilities.', 'P1', 1, 1, 1, 46);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.7.2', 'Physical Controls', 'Physical entry', 'Secure areas shall be protected by appropriate entry controls and access points to ensure only authorized personnel are allowed access.', 'P1', 1, 1, 1, 47);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.7.3', 'Physical Controls', 'Securing offices, rooms and facilities', 'Design and apply physical security for offices, rooms, and facilities that is appropriate for the assets contained within and the threats identified.', 'P1', 1, 1, 1, 48);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.7.4', 'Physical Controls', 'Physical security monitoring', 'Continuously monitor premises for unauthorized physical access using surveillance and detection systems appropriate to the environment.', 'P1', 1, 1, 1, 49);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.7.5', 'Physical Controls', 'Protecting against physical and environmental threats', 'Design and implement protection against physical and environmental threats such as natural disasters, malicious attacks, and accidents.', 'P1', 1, 1, 1, 50);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.7.6', 'Physical Controls', 'Working in secure areas', 'Design and implement security measures and guidelines for working in secure areas to prevent unauthorized access, damage, or interference.', 'P1', 1, 1, 1, 51);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.7.7', 'Physical Controls', 'Clear desk and clear screen', 'Define and enforce clear desk rules for papers and removable storage media, and clear screen rules for information processing facilities.', 'P1', 1, 1, 1, 52);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.7.8', 'Physical Controls', 'Equipment siting and protection', 'Site and protect equipment to reduce the risks from physical and environmental threats and hazards, and from unauthorized access.', 'P1', 1, 1, 1, 53);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.7.9', 'Physical Controls', 'Security of assets off-premises', 'Apply security measures to off-site assets taking into account the different risks of working outside the organization premises.', 'P1', 1, 1, 1, 54);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.7.10', 'Physical Controls', 'Storage media', 'Manage storage media through their lifecycle of acquisition, use, transportation, and disposal in accordance with the classification scheme and handling requirements.', 'P1', 1, 1, 1, 55);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.7.11', 'Physical Controls', 'Supporting utilities', 'Protect information processing facilities from power failures and other disruptions caused by failures in supporting utilities such as electricity, telecommunications, and water supply.', 'P1', 1, 1, 1, 56);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.7.12', 'Physical Controls', 'Cabling security', 'Protect power and telecommunications cabling carrying data or supporting information services from interception, interference, or damage.', 'P1', 1, 1, 1, 57);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.7.13', 'Physical Controls', 'Equipment maintenance', 'Maintain equipment correctly to ensure availability, integrity, and continued confidentiality of information stored or processed by that equipment.', 'P1', 1, 1, 1, 58);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.7.14', 'Physical Controls', 'Secure disposal or re-use of equipment', 'Verify that all items of equipment containing storage media are checked to ensure sensitive data and licensed software have been removed or securely overwritten prior to disposal or re-use.', 'P1', 1, 1, 1, 59);

-- --------------------------------------------------------------------------
-- Technological Controls (A.8.x)
-- --------------------------------------------------------------------------
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.1', 'Technological Controls', 'User endpoint devices', 'Protect information stored on, processed by, or accessible via user endpoint devices by defining and implementing configuration policies and security measures.', 'P1', 1, 1, 1, 60);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.2', 'Technological Controls', 'Privileged access rights', 'Restrict and manage the allocation and use of privileged access rights through a formal authorization process.', 'P1', 1, 1, 1, 61);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.3', 'Technological Controls', 'Information access restriction', 'Restrict access to information and other associated assets in accordance with the established topic-specific policy on access control.', 'P1', 1, 1, 1, 62);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.4', 'Technological Controls', 'Access to source code', 'Manage access to source code, development tools, and software libraries appropriately to prevent the introduction of unauthorized functionality and avoid unintentional changes.', 'P1', 1, 1, 1, 63);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.5', 'Technological Controls', 'Secure authentication', 'Implement secure authentication technologies and procedures based on information access restrictions and the topic-specific policy on access control.', 'P1', 1, 1, 1, 64);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.6', 'Technological Controls', 'Capacity management', 'Monitor and adjust the use of resources in line with current and expected capacity requirements to ensure required system performance.', 'P1', 1, 1, 1, 65);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.7', 'Technological Controls', 'Protection against malware', 'Implement and maintain protection against malware combined with appropriate user awareness education and training.', 'P1', 1, 1, 1, 66);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.8', 'Technological Controls', 'Management of technical vulnerabilities', 'Obtain information about technical vulnerabilities of information systems in use, evaluate exposure to such vulnerabilities, and take appropriate measures in a timely manner.', 'P1', 1, 1, 1, 67);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.9', 'Technological Controls', 'Configuration management', 'Establish, document, implement, monitor, and review configurations including security configurations of hardware, software, services, and networks.', 'P1', 1, 1, 1, 68);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.10', 'Technological Controls', 'Information deletion', 'Delete information stored in information systems, devices, or any other storage media when no longer required in accordance with retention policies.', 'P1', 1, 1, 1, 69);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.11', 'Technological Controls', 'Data masking', 'Apply data masking techniques in accordance with the organization topic-specific policy on access control and business requirements, taking applicable legislation into consideration.', 'P1', 1, 1, 1, 70);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.12', 'Technological Controls', 'Data leakage prevention', 'Apply data leakage prevention measures to systems, networks, and any other devices that process, store, or transmit sensitive information.', 'P1', 1, 1, 1, 71);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.13', 'Technological Controls', 'Information backup', 'Maintain backup copies of information, software, and systems and test them regularly in accordance with the agreed topic-specific backup policy.', 'P1', 1, 1, 1, 72);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.14', 'Technological Controls', 'Redundancy of information processing facilities', 'Implement information processing facilities with sufficient redundancy to meet availability requirements and ensure business continuity.', 'P1', 1, 1, 1, 73);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.15', 'Technological Controls', 'Logging', 'Produce, store, protect, and analyze logs that record activities, exceptions, faults, and other relevant events across the organization information systems.', 'P1', 1, 1, 1, 74);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.16', 'Technological Controls', 'Monitoring activities', 'Monitor networks, systems, and applications for anomalous behavior and take appropriate actions to evaluate potential information security incidents.', 'P1', 1, 1, 1, 75);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.17', 'Technological Controls', 'Clock synchronization', 'Synchronize the clocks of information processing systems within the organization to a single approved time source to support accurate logging and event correlation.', 'P1', 1, 1, 1, 76);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.18', 'Technological Controls', 'Use of privileged utility programs', 'Restrict and tightly control the use of utility programs that might be capable of overriding system and application controls.', 'P1', 1, 1, 1, 77);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.19', 'Technological Controls', 'Installation of software on operational systems', 'Implement procedures and measures to securely manage software installation on operational systems to maintain system integrity.', 'P1', 1, 1, 1, 78);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.20', 'Technological Controls', 'Networks security', 'Secure, manage, and control networks to protect information in systems and applications from unauthorized access or compromise.', 'P1', 1, 1, 1, 79);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.21', 'Technological Controls', 'Security of network services', 'Identify, implement, and monitor security mechanisms, service levels, and management requirements of network services whether provided in-house or outsourced.', 'P1', 1, 1, 1, 80);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.22', 'Technological Controls', 'Segregation of networks', 'Segregate groups of information services, users, and information systems on the organization networks to limit the blast radius of security incidents.', 'P1', 1, 1, 1, 81);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.23', 'Technological Controls', 'Web filtering', 'Manage access to external websites to reduce exposure to malicious content by implementing web filtering controls.', 'P1', 1, 1, 1, 82);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.24', 'Technological Controls', 'Use of cryptography', 'Define and implement rules for the effective use of cryptography, including cryptographic key management, to protect the confidentiality, authenticity, and integrity of information.', 'P1', 1, 1, 1, 83);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.25', 'Technological Controls', 'Secure development life cycle', 'Establish and apply rules for the secure development of software and systems throughout the development life cycle.', 'P1', 1, 1, 1, 84);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.26', 'Technological Controls', 'Application security requirements', 'Identify, specify, and approve information security requirements when developing or acquiring applications to ensure they meet the organization security standards.', 'P1', 1, 1, 1, 85);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.27', 'Technological Controls', 'Secure system architecture and engineering principles', 'Establish, document, maintain, and apply secure system engineering principles to any information system development activity.', 'P1', 1, 1, 1, 86);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.28', 'Technological Controls', 'Secure coding', 'Apply secure coding principles to software development to reduce the number of potential security vulnerabilities in the software.', 'P1', 1, 1, 1, 87);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.29', 'Technological Controls', 'Security testing in development and acceptance', 'Define and implement security testing processes in the development life cycle to validate that applications and systems meet security requirements.', 'P1', 1, 1, 1, 88);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.30', 'Technological Controls', 'Outsourced development', 'Direct, monitor, and review the activities related to outsourced system development to ensure security requirements are met by the external party.', 'P1', 1, 1, 1, 89);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.31', 'Technological Controls', 'Separation of development, test and production environments', 'Separate and secure development, testing, and production environments to reduce the risks of unauthorized access or changes to the production environment.', 'P1', 1, 1, 1, 90);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.32', 'Technological Controls', 'Change management', 'Manage changes to information processing facilities and information systems through a formal change management process that includes authorization, testing, and review.', 'P1', 1, 1, 1, 91);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.33', 'Technological Controls', 'Test information', 'Select, protect, and manage test information appropriately to ensure the validity of testing and the protection of sensitive operational data.', 'P1', 1, 1, 1, 92);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27001', 'A.8.34', 'Technological Controls', 'Protection of information systems during audit testing', 'Plan and agree audit tests and other assurance activities involving assessment of operational systems to minimize the impact on business operations.', 'P1', 1, 1, 1, 93);

-- ============================================================================
-- NIST CSF 2.0 CONTROLS (framework_id = 'nist-csf-2')
-- ============================================================================

-- --------------------------------------------------------------------------
-- GOVERN (GV) Function
-- --------------------------------------------------------------------------

-- Organizational Context (GV.OC)
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.OC-01', 'Govern', 'Organizational mission understood', 'The organizational mission is understood and informs cybersecurity risk management to align security priorities with business objectives.', 'P1', 1, 1, 1, 1);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.OC-02', 'Govern', 'Internal and external stakeholders understood', 'Internal and external stakeholders are understood, and their needs and expectations regarding cybersecurity risk management are determined and addressed.', 'P1', 1, 1, 1, 2);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.OC-03', 'Govern', 'Legal and regulatory requirements understood', 'Legal, regulatory, and contractual requirements regarding cybersecurity including privacy and civil liberties obligations are understood and managed.', 'P1', 1, 1, 1, 3);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.OC-04', 'Govern', 'Critical objectives and dependencies understood', 'Critical objectives, capabilities, and services that stakeholders depend on are understood and communicated across the organization.', 'P1', 1, 1, 1, 4);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.OC-05', 'Govern', 'Outcomes and priorities established', 'Outcomes, capabilities, and services that the organization depends on are understood and actions taken to manage risk to them are prioritized.', 'P1', 1, 1, 1, 5);

-- Risk Management Strategy (GV.RM)
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.RM-01', 'Govern', 'Risk management objectives established', 'Risk management objectives are established and agreed upon by organizational stakeholders to guide cybersecurity risk decisions.', 'P1', 1, 1, 1, 6);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.RM-02', 'Govern', 'Risk appetite and tolerance established', 'Risk appetite and risk tolerance statements are established, communicated, and maintained to guide risk-based decision making.', 'P1', 1, 1, 1, 7);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.RM-03', 'Govern', 'Risk management activities coordinated', 'Cybersecurity risk management activities and outcomes are included in enterprise risk management processes and coordinated across the organization.', 'P1', 1, 1, 1, 8);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.RM-04', 'Govern', 'Strategic direction for risk response', 'Strategic direction that describes appropriate risk response options is established and communicated to guide operational risk decisions.', 'P1', 1, 1, 1, 9);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.RM-05', 'Govern', 'Risk communication lines established', 'Lines of communication across the organization are established for cybersecurity risks including risks from suppliers and other third parties.', 'P1', 1, 1, 1, 10);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.RM-06', 'Govern', 'Standardized risk management method', 'A standardized method for calculating, documenting, categorizing, and prioritizing cybersecurity risks is established and communicated.', 'P1', 1, 1, 1, 11);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.RM-07', 'Govern', 'Strategic opportunities from risk management', 'Strategic opportunities such as positive risks arising from cybersecurity risk management are characterized and communicated to leadership.', 'P1', 1, 1, 1, 12);

-- Roles, Responsibilities, and Authorities (GV.RR)
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.RR-01', 'Govern', 'Organizational leadership accountability', 'Organizational leadership is responsible and accountable for cybersecurity risk and fosters a culture that is risk-aware, ethical, and continuously improving.', 'P1', 1, 1, 1, 13);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.RR-02', 'Govern', 'Cybersecurity roles and responsibilities established', 'Roles, responsibilities, and authorities related to cybersecurity risk management are established, communicated, understood, and enforced.', 'P1', 1, 1, 1, 14);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.RR-03', 'Govern', 'Adequate resources allocated', 'Adequate resources are allocated commensurate with the cybersecurity risk strategy, roles, responsibilities, and policies.', 'P1', 1, 1, 1, 15);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.RR-04', 'Govern', 'Cybersecurity in human resources practices', 'Cybersecurity is included in human resources practices to establish, maintain, and improve workforce cybersecurity capabilities.', 'P1', 1, 1, 1, 16);

-- Policy (GV.PO)
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.PO-01', 'Govern', 'Cybersecurity policy established', 'A policy for managing cybersecurity risks is established based on organizational context, cybersecurity strategy, and priorities and is communicated and enforced.', 'P1', 1, 1, 1, 17);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.PO-02', 'Govern', 'Policy review process established', 'The cybersecurity policy is reviewed, updated, communicated, and enforced to reflect changes in requirements, threats, technology, and organizational mission.', 'P1', 1, 1, 1, 18);

-- Oversight (GV.OV)
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.OV-01', 'Govern', 'Risk management strategy outcomes assessed', 'Cybersecurity risk management strategy outcomes are reviewed to inform and adjust strategy and direction.', 'P1', 1, 1, 1, 19);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.OV-02', 'Govern', 'Risk management performance evaluated', 'The cybersecurity risk management strategy is reviewed and adjusted to ensure coverage of organizational requirements and risks.', 'P1', 1, 1, 1, 20);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.OV-03', 'Govern', 'Risk management improvements identified', 'Organizational cybersecurity risk management performance is evaluated and reviewed for adjustments needed to meet organizational requirements.', 'P1', 1, 1, 1, 21);

-- Cybersecurity Supply Chain Risk Management (GV.SC)
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.SC-01', 'Govern', 'Supply chain risk management program established', 'A cybersecurity supply chain risk management program, strategy, objectives, policies, and processes are established and agreed to by organizational stakeholders.', 'P1', 1, 1, 1, 22);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.SC-02', 'Govern', 'Supply chain roles and responsibilities defined', 'Cybersecurity roles and responsibilities for suppliers, customers, and partners are established, communicated, and coordinated internally and externally.', 'P1', 1, 1, 1, 23);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.SC-03', 'Govern', 'Supply chain risk management integrated', 'Cybersecurity supply chain risk management is integrated into cybersecurity and enterprise risk management, risk assessment, and improvement processes.', 'P1', 1, 1, 1, 24);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.SC-04', 'Govern', 'Supplier prioritization by criticality', 'Suppliers are known and prioritized by criticality to support risk assessment, response, and recovery activities.', 'P1', 1, 1, 1, 25);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.SC-05', 'Govern', 'Supply chain security requirements in agreements', 'Requirements to address cybersecurity risks in supply chains are established, prioritized, and integrated into contracts and other agreements with suppliers and third parties.', 'P1', 1, 1, 1, 26);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.SC-06', 'Govern', 'Supply chain due diligence and monitoring', 'Planning and due diligence are performed to reduce risks before entering into formal supplier or other third-party relationships.', 'P1', 1, 1, 1, 27);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.SC-07', 'Govern', 'Supply chain risk management understanding', 'The risks posed by a supplier, their products and services, and other third parties are understood, recorded, prioritized, assessed, responded to, and monitored over the relationship lifecycle.', 'P1', 1, 1, 1, 28);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.SC-08', 'Govern', 'Supplier inclusion in incident response', 'Relevant suppliers and third-party partners are included in incident planning, response, and recovery activities.', 'P1', 1, 1, 1, 29);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.SC-09', 'Govern', 'Supply chain security practices integration', 'Supply chain security practices are integrated into cybersecurity and enterprise risk management programs, and their performance is monitored throughout the technology lifecycle.', 'P1', 1, 1, 1, 30);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'GV.SC-10', 'Govern', 'Supply chain risk management plan review', 'Cybersecurity supply chain risk management plans include provisions for activities that occur after the conclusion of a partnership or service agreement.', 'P1', 1, 1, 1, 31);

-- --------------------------------------------------------------------------
-- IDENTIFY (ID) Function
-- --------------------------------------------------------------------------

-- Asset Management (ID.AM)
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'ID.AM-01', 'Identify', 'Hardware asset inventory maintained', 'Inventories of hardware managed by the organization are maintained and kept current.', 'P1', 1, 1, 1, 32);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'ID.AM-02', 'Identify', 'Software asset inventory maintained', 'Inventories of software, services, and systems managed by the organization are maintained and kept current.', 'P1', 1, 1, 1, 33);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'ID.AM-03', 'Identify', 'Network communication and data flows mapped', 'Representations of the organization authorized network communication and internal and external network data flows are maintained.', 'P1', 1, 1, 1, 34);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'ID.AM-04', 'Identify', 'External service provider inventories', 'Inventories of services provided by suppliers are maintained and kept current.', 'P1', 1, 1, 1, 35);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'ID.AM-05', 'Identify', 'Assets prioritized by classification and criticality', 'Assets are prioritized based on classification, criticality, resources, and impact on the mission to inform protection and risk management.', 'P1', 1, 1, 1, 36);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'ID.AM-07', 'Identify', 'Data asset inventory and mapping', 'Inventories of data and corresponding metadata for designated data types are maintained and kept current.', 'P1', 1, 1, 1, 37);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'ID.AM-08', 'Identify', 'Systems and assets managed throughout lifecycle', 'Systems, hardware, software, services, and data are managed throughout their life cycles consistent with organizational risk strategy.', 'P1', 1, 1, 1, 38);

-- Risk Assessment (ID.RA)
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'ID.RA-01', 'Identify', 'Asset vulnerabilities identified and documented', 'Vulnerabilities in assets are identified, validated, and recorded to support risk assessment.', 'P1', 1, 1, 1, 39);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'ID.RA-02', 'Identify', 'Threat intelligence received and analyzed', 'Cyber threat intelligence is received from information sharing forums and sources and analyzed for relevance to the organization.', 'P1', 1, 1, 1, 40);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'ID.RA-03', 'Identify', 'Internal and external threats identified', 'Internal and external threats to the organization are identified and recorded to support risk assessment and response planning.', 'P1', 1, 1, 1, 41);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'ID.RA-04', 'Identify', 'Potential impacts and likelihoods determined', 'Potential impacts and likelihoods of threats exploiting vulnerabilities are identified and recorded as part of organizational risk assessment.', 'P1', 1, 1, 1, 42);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'ID.RA-05', 'Identify', 'Risk assessment results used to prioritize', 'Threats, vulnerabilities, likelihoods, and impacts are used to understand inherent risk and inform risk response prioritization.', 'P1', 1, 1, 1, 43);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'ID.RA-06', 'Identify', 'Risk responses selected and prioritized', 'Risk responses are chosen, prioritized, planned, tracked, and communicated to manage cybersecurity risk.', 'P1', 1, 1, 1, 44);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'ID.RA-07', 'Identify', 'Risk management changes tracked', 'Changes and exceptions are managed, assessed for risk impact, recorded, and tracked to maintain organizational risk posture.', 'P1', 1, 1, 1, 45);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'ID.RA-08', 'Identify', 'Risk exposure from supplier dependencies', 'Processes for receiving, analyzing, and responding to vulnerability disclosures are established and applied.', 'P1', 1, 1, 1, 46);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'ID.RA-09', 'Identify', 'Risk integrity assessment', 'The authenticity and integrity of hardware and software are assessed prior to acquisition and use to reduce supply chain risk.', 'P1', 1, 1, 1, 47);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'ID.RA-10', 'Identify', 'Critical supplier risk assessment', 'Critical suppliers are assessed prior to acquisition to evaluate the cybersecurity risk they pose to the organization.', 'P1', 1, 1, 1, 48);

-- Improvement (ID.IM)
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'ID.IM-01', 'Identify', 'Improvements identified from evaluations', 'Improvements are identified from evaluations of cybersecurity processes, procedures, technologies, and outcomes to enhance the security posture.', 'P1', 1, 1, 1, 49);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'ID.IM-02', 'Identify', 'Improvements identified from testing and exercises', 'Improvements are identified from security tests and exercises including those done in coordination with suppliers and relevant third parties.', 'P1', 1, 1, 1, 50);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'ID.IM-03', 'Identify', 'Improvements identified from incident response', 'Improvements are identified from execution of operational processes, procedures, and activities including incident response and recovery activities.', 'P1', 1, 1, 1, 51);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'ID.IM-04', 'Identify', 'Incident response plans updated', 'Incident response plans and other cybersecurity plans that affect operations are established, communicated, maintained, and improved.', 'P1', 1, 1, 1, 52);

-- --------------------------------------------------------------------------
-- PROTECT (PR) Function
-- --------------------------------------------------------------------------

-- Identity Management, Authentication, and Access Control (PR.AA)
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'PR.AA-01', 'Protect', 'Identities and credentials managed', 'Identities and credentials for authorized users, services, and hardware are managed by the organization.', 'P1', 1, 1, 1, 53);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'PR.AA-02', 'Protect', 'Identity proofing performed', 'Identities are proofed and bound to credentials based on the context of interactions to ensure accurate authentication.', 'P1', 1, 1, 1, 54);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'PR.AA-03', 'Protect', 'Users and services authenticated', 'Users, services, and hardware are authenticated to ensure the identity of entities accessing organizational resources.', 'P1', 1, 1, 1, 55);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'PR.AA-04', 'Protect', 'Identity assertions managed and protected', 'Identity assertions are protected in transit and at rest to prevent unauthorized interception and misuse.', 'P1', 1, 1, 1, 56);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'PR.AA-05', 'Protect', 'Access permissions and authorizations defined', 'Access permissions, entitlements, and authorizations are defined in a policy, managed, enforced, and reviewed incorporating principles of least privilege and separation of duties.', 'P1', 1, 1, 1, 57);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'PR.AA-06', 'Protect', 'Physical access managed', 'Physical access to assets is managed, monitored, and enforced commensurate with risk to protect organizational resources.', 'P1', 1, 1, 1, 58);

-- Awareness and Training (PR.AT)
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'PR.AT-01', 'Protect', 'Security awareness and training provided', 'Personnel are provided cybersecurity awareness and training so they can perform their cybersecurity-related tasks.', 'P1', 1, 1, 1, 59);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'PR.AT-02', 'Protect', 'Privileged users trained', 'Individuals in specialized roles are provided with cybersecurity awareness and training relevant to their elevated responsibilities.', 'P1', 1, 1, 1, 60);

-- Data Security (PR.DS)
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'PR.DS-01', 'Protect', 'Data-at-rest protected', 'The confidentiality, integrity, and availability of data-at-rest are protected using cryptographic mechanisms and access controls.', 'P1', 1, 1, 1, 61);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'PR.DS-02', 'Protect', 'Data-in-transit protected', 'The confidentiality, integrity, and availability of data-in-transit are protected using cryptographic mechanisms and secure transport protocols.', 'P1', 1, 1, 1, 62);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'PR.DS-10', 'Protect', 'Data-in-use protected', 'The confidentiality, integrity, and availability of data-in-use are protected through appropriate technical and process controls.', 'P1', 1, 1, 1, 63);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'PR.DS-11', 'Protect', 'Data backups maintained and tested', 'Backups of data are created, protected, maintained, and tested subject to the organization data security policy.', 'P1', 1, 1, 1, 64);

-- Platform Security (PR.PS)
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'PR.PS-01', 'Protect', 'Configuration management practices established', 'The configuration of current organizational assets is established, managed, and maintained through secure configuration management practices.', 'P1', 1, 1, 1, 65);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'PR.PS-02', 'Protect', 'Software maintained and replaced', 'Software is maintained, replaced, and removed according to risk to maintain the security of the platform.', 'P1', 1, 1, 1, 66);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'PR.PS-03', 'Protect', 'Hardware maintained and replaced', 'Hardware is maintained, replaced, and removed according to risk to ensure continued platform security.', 'P1', 1, 1, 1, 67);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'PR.PS-04', 'Protect', 'Log records generated and made available', 'Log records are generated and made available for continuous monitoring and incident detection purposes.', 'P1', 1, 1, 1, 68);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'PR.PS-05', 'Protect', 'Installation and execution of unauthorized software prevented', 'Installation and execution of unauthorized software is prevented through application control and allowlisting mechanisms.', 'P1', 1, 1, 1, 69);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'PR.PS-06', 'Protect', 'Secure software development practices integrated', 'Secure software development practices are integrated and their performance is monitored throughout the software development life cycle.', 'P1', 1, 1, 1, 70);

-- Technology Infrastructure Resilience (PR.IR)
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'PR.IR-01', 'Protect', 'Networks and environments protected', 'Networks and environments are protected from unauthorized logical access and usage through security architecture and segmentation.', 'P1', 1, 1, 1, 71);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'PR.IR-02', 'Protect', 'Technology assets protected from environmental threats', 'The organization technology assets are protected from environmental threats and hazards, and made resilient to ensure availability.', 'P1', 1, 1, 1, 72);

-- --------------------------------------------------------------------------
-- DETECT (DE) Function
-- --------------------------------------------------------------------------

-- Continuous Monitoring (DE.CM)
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'DE.CM-01', 'Detect', 'Networks monitored for threats', 'Networks and network services are monitored to find potentially adverse events and indicators of compromise.', 'P1', 1, 1, 1, 73);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'DE.CM-02', 'Detect', 'Physical environment monitored', 'The physical environment is monitored to find potentially adverse events and unauthorized physical access attempts.', 'P1', 1, 1, 1, 74);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'DE.CM-03', 'Detect', 'Personnel activity monitored', 'Personnel activity and technology usage are monitored to find potentially adverse events in accordance with privacy policies.', 'P1', 1, 1, 1, 75);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'DE.CM-04', 'Detect', 'Malicious code detected', 'Malicious code is detected using anti-malware tools, techniques, and procedures across endpoints, networks, and systems.', 'P1', 1, 1, 1, 76);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'DE.CM-05', 'Detect', 'Unauthorized mobile code detected', 'Unauthorized mobile code and changes to system configurations are detected through integrity monitoring and verification.', 'P1', 1, 1, 1, 77);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'DE.CM-06', 'Detect', 'External service provider activity monitored', 'External service provider activity and services are monitored to find potentially adverse events and ensure contractual compliance.', 'P1', 1, 1, 1, 78);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'DE.CM-07', 'Detect', 'Unauthorized personnel and connections monitored', 'Monitoring for unauthorized personnel, connections, devices, and software is performed to detect potential security threats.', 'P1', 1, 1, 1, 79);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'DE.CM-08', 'Detect', 'Vulnerability scans performed', 'Vulnerability scans are performed on organizational assets at defined frequencies to identify weaknesses before exploitation.', 'P1', 1, 1, 1, 80);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'DE.CM-09', 'Detect', 'Computing hardware and software monitored', 'Computing hardware and software, runtime environments, and their data are monitored to find potentially adverse events.', 'P1', 1, 1, 1, 81);

-- Adverse Event Analysis (DE.AE)
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'DE.AE-02', 'Detect', 'Potentially adverse events analyzed', 'Potentially adverse events are analyzed to better understand associated activities and determine if they constitute security incidents.', 'P1', 1, 1, 1, 82);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'DE.AE-03', 'Detect', 'Events correlated from multiple sources', 'Information is correlated from multiple sources to achieve a more comprehensive understanding of detected events and their impact.', 'P1', 1, 1, 1, 83);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'DE.AE-04', 'Detect', 'Estimated impact and scope of adverse events', 'The estimated impact and scope of adverse events are understood to inform proper response actions and resource allocation.', 'P1', 1, 1, 1, 84);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'DE.AE-05', 'Detect', 'Incident alert thresholds established', 'Incident alert thresholds are established to trigger timely notification and escalation of detected security events.', 'P1', 1, 1, 1, 85);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'DE.AE-06', 'Detect', 'Information on adverse events provided to teams', 'Information on adverse events is provided to authorized staff and tools to enable timely analysis and response.', 'P1', 1, 1, 1, 86);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'DE.AE-07', 'Detect', 'Threat and vulnerability information correlated', 'Cyber threat intelligence and other contextual information are integrated into the analysis of adverse events to improve detection accuracy.', 'P1', 1, 1, 1, 87);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'DE.AE-08', 'Detect', 'Incidents declared based on analysis', 'Incidents are declared when adverse events meet the defined incident criteria based on analysis and correlation of event data.', 'P1', 1, 1, 1, 88);

-- --------------------------------------------------------------------------
-- RESPOND (RS) Function
-- --------------------------------------------------------------------------

-- Incident Management (RS.MA)
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'RS.MA-01', 'Respond', 'Incident response plan executed', 'The incident response plan is executed in coordination with relevant third parties once an incident is declared.', 'P1', 1, 1, 1, 89);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'RS.MA-02', 'Respond', 'Incident reports triaged and validated', 'Incident reports are triaged and validated to confirm the incident and determine its scope and severity.', 'P1', 1, 1, 1, 90);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'RS.MA-03', 'Respond', 'Incidents categorized and prioritized', 'Incidents are categorized and prioritized based on severity, impact, and organizational risk to guide response actions.', 'P1', 1, 1, 1, 91);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'RS.MA-04', 'Respond', 'Incidents escalated and elevated', 'Incidents are escalated or elevated as needed based on severity and organizational escalation procedures.', 'P1', 1, 1, 1, 92);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'RS.MA-05', 'Respond', 'Incident criteria and criteria for escalation applied', 'The criteria for initiating incident recovery are applied to determine appropriate escalation and recovery actions.', 'P1', 1, 1, 1, 93);

-- Incident Analysis (RS.AN)
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'RS.AN-03', 'Respond', 'Incident analysis performed', 'Analysis is performed to determine what has taken place during an incident and understand the root cause and full scope.', 'P1', 1, 1, 1, 94);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'RS.AN-06', 'Respond', 'Actions taken during investigation recorded', 'Actions performed during the investigation are recorded and the integrity of the investigation and evidence is preserved.', 'P1', 1, 1, 1, 95);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'RS.AN-07', 'Respond', 'Incident data and metadata collected', 'Incident data and metadata are collected and the integrity and provenance of the data is preserved for forensic analysis.', 'P1', 1, 1, 1, 96);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'RS.AN-08', 'Respond', 'Incident root cause estimated', 'An incident estimated scope and root cause is identified to inform containment, eradication, and recovery activities.', 'P1', 1, 1, 1, 97);

-- Incident Response Reporting and Communication (RS.CO)
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'RS.CO-02', 'Respond', 'Internal stakeholders notified', 'Internal and external stakeholders are notified of incidents in accordance with organizational communication and escalation procedures.', 'P1', 1, 1, 1, 98);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'RS.CO-03', 'Respond', 'Incident information shared', 'Information is shared with designated internal and external stakeholders to support coordinated incident response and recovery.', 'P1', 1, 1, 1, 99);

-- Incident Mitigation (RS.MI)
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'RS.MI-01', 'Respond', 'Incidents contained', 'Incidents are contained to prevent further damage through isolation, segmentation, and other containment measures.', 'P1', 1, 1, 1, 100);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'RS.MI-02', 'Respond', 'Incidents eradicated', 'Incidents are eradicated by eliminating the root cause and removing threat actor presence from organizational systems.', 'P1', 1, 1, 1, 101);

-- --------------------------------------------------------------------------
-- RECOVER (RC) Function
-- --------------------------------------------------------------------------

-- Incident Recovery Plan Execution (RC.RP)
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'RC.RP-01', 'Recover', 'Recovery plan executed', 'The recovery portion of the incident response plan is executed once initiated from the incident response process.', 'P1', 1, 1, 1, 102);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'RC.RP-02', 'Recover', 'Recovery actions selected and performed', 'Recovery actions are selected, scoped, prioritized, and performed to restore the confidentiality, integrity, and availability of assets.', 'P1', 1, 1, 1, 103);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'RC.RP-03', 'Recover', 'Backup integrity verified', 'The integrity of backups and other restoration assets is verified before using them for restoration to prevent re-compromise.', 'P1', 1, 1, 1, 104);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'RC.RP-04', 'Recover', 'Critical missions and functions considered', 'Critical mission functions and cybersecurity risk management are considered to establish post-incident operational norms and priorities.', 'P1', 1, 1, 1, 105);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'RC.RP-05', 'Recover', 'Integrity of restored assets verified', 'The integrity of restored assets is verified, systems and services are restored, and normal operations are confirmed.', 'P1', 1, 1, 1, 106);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'RC.RP-06', 'Recover', 'Recovery declared and documented', 'The end of incident recovery is declared based on criteria and any changes made to restore operations are documented.', 'P1', 1, 1, 1, 107);

-- Incident Recovery Communication (RC.CO)
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'RC.CO-03', 'Recover', 'Recovery activities communicated', 'Recovery activities and progress in restoring operational capabilities are communicated to designated internal and external stakeholders.', 'P1', 1, 1, 1, 108);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-csf-2', 'RC.CO-04', 'Recover', 'Public updates on recovery shared', 'Public updates on incident recovery are shared using approved methods and messaging to maintain stakeholder trust and transparency.', 'P1', 1, 1, 1, 109);

-- ============================================================================
-- PCI DSS v4.0 CONTROLS (framework_id = 'pci-dss-v4')
-- ============================================================================

-- --------------------------------------------------------------------------
-- Requirement 1: Install and Maintain Network Security Controls
-- --------------------------------------------------------------------------
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '1.1.1', 'Requirement 1 - Install and Maintain Network Security Controls', 'Network security control policies and procedures defined', 'All security policies and operational procedures identified in Requirement 1 are documented, kept up to date, in use, and known to all affected parties.', 'P1', 1, 1, 1, 1);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '1.1.2', 'Requirement 1 - Install and Maintain Network Security Controls', 'Roles and responsibilities for network security assigned', 'Roles and responsibilities for performing activities in Requirement 1 are documented, assigned, and understood by responsible personnel.', 'P1', 1, 1, 1, 2);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '1.2.1', 'Requirement 1 - Install and Maintain Network Security Controls', 'Network security controls configured and maintained', 'Configuration standards for network security controls are defined, implemented, and maintained to restrict traffic between trusted and untrusted networks.', 'P1', 1, 1, 1, 3);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '1.2.2', 'Requirement 1 - Install and Maintain Network Security Controls', 'Network changes approved and managed', 'All changes to network connections and to configurations of network security controls are approved and managed in accordance with the change control process.', 'P1', 1, 1, 1, 4);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '1.2.5', 'Requirement 1 - Install and Maintain Network Security Controls', 'Permitted services and ports justified', 'All services, protocols, and ports that are allowed are identified, approved, and have a defined business need with authorization for each.', 'P1', 1, 1, 1, 5);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '1.3.1', 'Requirement 1 - Install and Maintain Network Security Controls', 'Inbound traffic restricted to CDE', 'Inbound traffic to the cardholder data environment is restricted to only that which is necessary and all other traffic is specifically denied.', 'P1', 1, 1, 1, 6);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '1.3.2', 'Requirement 1 - Install and Maintain Network Security Controls', 'Outbound traffic restricted from CDE', 'Outbound traffic from the cardholder data environment is restricted to only that which is necessary and all other traffic is specifically denied.', 'P1', 1, 1, 1, 7);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '1.4.1', 'Requirement 1 - Install and Maintain Network Security Controls', 'Network security controls between trusted and untrusted networks', 'Network security controls are implemented between trusted and untrusted networks including a DMZ to limit inbound traffic to system components that provide authorized publicly accessible services.', 'P1', 1, 1, 1, 8);

-- --------------------------------------------------------------------------
-- Requirement 2: Apply Secure Configurations to All System Components
-- --------------------------------------------------------------------------
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '2.1.1', 'Requirement 2 - Apply Secure Configurations', 'Secure configuration policies and procedures defined', 'All security policies and operational procedures identified in Requirement 2 are documented, kept up to date, in use, and known to all affected parties.', 'P1', 1, 1, 1, 9);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '2.1.2', 'Requirement 2 - Apply Secure Configurations', 'Roles and responsibilities for secure configuration assigned', 'Roles and responsibilities for performing activities in Requirement 2 are documented, assigned, and understood by responsible personnel.', 'P1', 1, 1, 1, 10);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '2.2.1', 'Requirement 2 - Apply Secure Configurations', 'Configuration standards developed and maintained', 'Configuration standards are developed, implemented, and maintained to cover all system components addressing all known security vulnerabilities and consistent with industry-accepted hardening standards.', 'P1', 1, 1, 1, 11);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '2.2.2', 'Requirement 2 - Apply Secure Configurations', 'Vendor default accounts managed', 'Vendor default accounts are managed by changing default passwords, disabling or removing default accounts where possible before installing a system on the network.', 'P1', 1, 1, 1, 12);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '2.2.5', 'Requirement 2 - Apply Secure Configurations', 'Primary functions segregated on servers', 'If any insecure services, protocols, or daemons are present, business justification is documented and additional security features are documented and implemented to reduce the risk.', 'P1', 1, 1, 1, 13);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '2.2.7', 'Requirement 2 - Apply Secure Configurations', 'Non-console administrative access encrypted', 'All non-console administrative access is encrypted using strong cryptography appropriate for the technology in use.', 'P1', 1, 1, 1, 14);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '2.3.1', 'Requirement 2 - Apply Secure Configurations', 'Wireless environments secured', 'For wireless environments connected to the CDE or transmitting account data, all wireless vendor defaults are changed at installation including default wireless encryption keys, passwords, and SNMP community strings.', 'P1', 1, 1, 1, 15);

-- --------------------------------------------------------------------------
-- Requirement 3: Protect Stored Account Data
-- --------------------------------------------------------------------------
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '3.1.1', 'Requirement 3 - Protect Stored Account Data', 'Stored data protection policies defined', 'All security policies and operational procedures identified in Requirement 3 are documented, kept up to date, in use, and known to all affected parties.', 'P1', 1, 1, 1, 16);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '3.1.2', 'Requirement 3 - Protect Stored Account Data', 'Roles and responsibilities for stored data protection assigned', 'Roles and responsibilities for performing activities in Requirement 3 are documented, assigned, and understood by responsible personnel.', 'P1', 1, 1, 1, 17);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '3.2.1', 'Requirement 3 - Protect Stored Account Data', 'Data retention and disposal policies implemented', 'Account data storage amount and retention time are limited to what is required for business, legal, and regulatory purposes through data retention and disposal policies.', 'P1', 1, 1, 1, 18);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '3.3.1', 'Requirement 3 - Protect Stored Account Data', 'Sensitive authentication data not retained', 'Sensitive authentication data is not retained after authorization, even if encrypted, and all data received is rendered unrecoverable upon completion of the authorization process.', 'P1', 1, 1, 1, 19);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '3.4.1', 'Requirement 3 - Protect Stored Account Data', 'PAN masked when displayed', 'PAN is masked when displayed so that only personnel with a legitimate business need can see more than the first six and last four digits of the PAN.', 'P1', 1, 1, 1, 20);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '3.5.1', 'Requirement 3 - Protect Stored Account Data', 'PAN rendered unreadable in storage', 'PAN is rendered unreadable anywhere it is stored by using strong cryptography, truncation, index tokens, or securely stored one-way hash functions.', 'P1', 1, 1, 1, 21);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '3.6.1', 'Requirement 3 - Protect Stored Account Data', 'Cryptographic key management procedures defined', 'Procedures are defined and implemented to protect cryptographic keys used to protect stored account data against disclosure and misuse.', 'P1', 1, 1, 1, 22);

-- --------------------------------------------------------------------------
-- Requirement 4: Protect Cardholder Data with Strong Cryptography During Transmission
-- --------------------------------------------------------------------------
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '4.1.1', 'Requirement 4 - Protect Cardholder Data with Strong Cryptography', 'Transmission security policies defined', 'All security policies and operational procedures identified in Requirement 4 are documented, kept up to date, in use, and known to all affected parties.', 'P1', 1, 1, 1, 23);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '4.1.2', 'Requirement 4 - Protect Cardholder Data with Strong Cryptography', 'Roles and responsibilities for transmission security assigned', 'Roles and responsibilities for performing activities in Requirement 4 are documented, assigned, and understood by responsible personnel.', 'P1', 1, 1, 1, 24);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '4.2.1', 'Requirement 4 - Protect Cardholder Data with Strong Cryptography', 'Strong cryptography protects PAN during transmission', 'Strong cryptography and security protocols are implemented to safeguard PAN during transmission over open public networks.', 'P1', 1, 1, 1, 25);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '4.2.2', 'Requirement 4 - Protect Cardholder Data with Strong Cryptography', 'PAN secured in end-user messaging', 'PAN is secured with strong cryptography whenever it is sent via end-user messaging technologies such as email, instant messaging, SMS, and chat.', 'P1', 1, 1, 1, 26);

-- --------------------------------------------------------------------------
-- Requirement 5: Protect All Systems and Networks from Malicious Software
-- --------------------------------------------------------------------------
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '5.1.1', 'Requirement 5 - Protect All Systems from Malicious Software', 'Anti-malware policies and procedures defined', 'All security policies and operational procedures identified in Requirement 5 are documented, kept up to date, in use, and known to all affected parties.', 'P1', 1, 1, 1, 27);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '5.1.2', 'Requirement 5 - Protect All Systems from Malicious Software', 'Roles and responsibilities for anti-malware assigned', 'Roles and responsibilities for performing activities in Requirement 5 are documented, assigned, and understood by responsible personnel.', 'P1', 1, 1, 1, 28);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '5.2.1', 'Requirement 5 - Protect All Systems from Malicious Software', 'Anti-malware solution deployed', 'An anti-malware solution is deployed on all system components except for those system components determined to not be at risk from malware.', 'P1', 1, 1, 1, 29);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '5.2.2', 'Requirement 5 - Protect All Systems from Malicious Software', 'Anti-malware solution detects all known types', 'The deployed anti-malware solution detects all known types of malware and removes, blocks, or contains all known types of malware.', 'P1', 1, 1, 1, 30);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '5.3.1', 'Requirement 5 - Protect All Systems from Malicious Software', 'Anti-malware solution kept current', 'The anti-malware solution is kept current via automatic updates and is maintained to perform periodic and active real-time scans.', 'P1', 1, 1, 1, 31);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '5.3.3', 'Requirement 5 - Protect All Systems from Malicious Software', 'Anti-malware mechanisms actively running and cannot be disabled', 'The anti-malware solution is actively running and cannot be disabled or altered by users unless specifically authorized by management on a case-by-case basis for a limited time period.', 'P1', 1, 1, 1, 32);

-- --------------------------------------------------------------------------
-- Requirement 6: Develop and Maintain Secure Systems and Software
-- --------------------------------------------------------------------------
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '6.1.1', 'Requirement 6 - Develop and Maintain Secure Systems and Software', 'Secure development policies defined', 'All security policies and operational procedures identified in Requirement 6 are documented, kept up to date, in use, and known to all affected parties.', 'P1', 1, 1, 1, 33);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '6.1.2', 'Requirement 6 - Develop and Maintain Secure Systems and Software', 'Roles and responsibilities for secure development assigned', 'Roles and responsibilities for performing activities in Requirement 6 are documented, assigned, and understood by responsible personnel.', 'P1', 1, 1, 1, 34);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '6.2.1', 'Requirement 6 - Develop and Maintain Secure Systems and Software', 'Bespoke and custom software developed securely', 'Bespoke and custom software are developed securely using industry standards and best practices for secure coding throughout the software development life cycle.', 'P1', 1, 1, 1, 35);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '6.2.4', 'Requirement 6 - Develop and Maintain Secure Systems and Software', 'Software engineering techniques prevent attacks', 'Software engineering techniques or other methods are defined and in use to prevent or mitigate common software attacks and related vulnerabilities in bespoke and custom software.', 'P1', 1, 1, 1, 36);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '6.3.1', 'Requirement 6 - Develop and Maintain Secure Systems and Software', 'Security vulnerabilities identified and managed', 'Security vulnerabilities are identified and managed through a defined process that includes monitoring vulnerability sources and risk ranking discovered vulnerabilities.', 'P1', 1, 1, 1, 37);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '6.3.3', 'Requirement 6 - Develop and Maintain Secure Systems and Software', 'Security patches installed timely', 'All system components are protected from known vulnerabilities by installing applicable security patches and updates within defined timeframes.', 'P1', 1, 1, 1, 38);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '6.4.1', 'Requirement 6 - Develop and Maintain Secure Systems and Software', 'Public-facing web applications protected', 'For public-facing web applications, new threats and vulnerabilities are addressed on an ongoing basis and applications are protected against known attacks.', 'P1', 1, 1, 1, 39);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '6.5.1', 'Requirement 6 - Develop and Maintain Secure Systems and Software', 'Change control processes established', 'Changes to all system components in the production environment are made according to established change control procedures that include documentation, approval, and testing.', 'P1', 1, 1, 1, 40);

-- --------------------------------------------------------------------------
-- Requirement 7: Restrict Access to System Components and Cardholder Data by Business Need to Know
-- --------------------------------------------------------------------------
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '7.1.1', 'Requirement 7 - Restrict Access by Business Need to Know', 'Access control policies defined', 'All security policies and operational procedures identified in Requirement 7 are documented, kept up to date, in use, and known to all affected parties.', 'P1', 1, 1, 1, 41);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '7.1.2', 'Requirement 7 - Restrict Access by Business Need to Know', 'Roles and responsibilities for access control assigned', 'Roles and responsibilities for performing activities in Requirement 7 are documented, assigned, and understood by responsible personnel.', 'P1', 1, 1, 1, 42);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '7.2.1', 'Requirement 7 - Restrict Access by Business Need to Know', 'Access control model defined', 'An access control model is defined and includes granting access based on job classification and function, with least privileges necessary, and as needed for business responsibilities.', 'P1', 1, 1, 1, 43);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '7.2.2', 'Requirement 7 - Restrict Access by Business Need to Know', 'Access assigned based on need to know', 'Access to system components and data resources is assigned based on users job classification and functions using role-based access control.', 'P1', 1, 1, 1, 44);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '7.2.5', 'Requirement 7 - Restrict Access by Business Need to Know', 'Access reviewed periodically', 'All user access to system components and cardholder data is reviewed at defined intervals to verify access remains appropriate based on job function.', 'P1', 1, 1, 1, 45);

-- --------------------------------------------------------------------------
-- Requirement 8: Identify Users and Authenticate Access to System Components
-- --------------------------------------------------------------------------
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '8.1.1', 'Requirement 8 - Identify Users and Authenticate Access', 'Authentication policies defined', 'All security policies and operational procedures identified in Requirement 8 are documented, kept up to date, in use, and known to all affected parties.', 'P1', 1, 1, 1, 46);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '8.1.2', 'Requirement 8 - Identify Users and Authenticate Access', 'Roles and responsibilities for authentication assigned', 'Roles and responsibilities for performing activities in Requirement 8 are documented, assigned, and understood by responsible personnel.', 'P1', 1, 1, 1, 47);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '8.2.1', 'Requirement 8 - Identify Users and Authenticate Access', 'Unique IDs assigned to all users', 'All users are assigned a unique ID before being allowed to access system components or cardholder data to ensure traceability of actions.', 'P1', 1, 1, 1, 48);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '8.2.2', 'Requirement 8 - Identify Users and Authenticate Access', 'Group and shared accounts managed', 'Group, shared, or generic accounts and other shared authentication credentials are only used when necessary and managed with additional controls and accountability measures.', 'P1', 1, 1, 1, 49);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '8.3.1', 'Requirement 8 - Identify Users and Authenticate Access', 'Strong authentication factors used', 'All user access to system components for users and administrators is authenticated via at least one authentication factor such as something you know, something you have, or something you are.', 'P1', 1, 1, 1, 50);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '8.3.6', 'Requirement 8 - Identify Users and Authenticate Access', 'Password complexity requirements enforced', 'If passwords or passphrases are used as authentication factors, they are set with sufficient complexity and changed periodically in accordance with organizational policy.', 'P1', 1, 1, 1, 51);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '8.3.9', 'Requirement 8 - Identify Users and Authenticate Access', 'Password reuse restrictions enforced', 'If passwords or passphrases are used as the only authentication factor for user access, passwords or passphrases are changed at least once every 90 days or security posture of accounts is dynamically analyzed.', 'P1', 1, 1, 1, 52);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '8.4.2', 'Requirement 8 - Identify Users and Authenticate Access', 'MFA for access to CDE', 'Multi-factor authentication is implemented for all access into the cardholder data environment to provide an additional layer of security beyond single-factor authentication.', 'P1', 1, 1, 1, 53);

-- --------------------------------------------------------------------------
-- Requirement 9: Restrict Physical Access to Cardholder Data
-- --------------------------------------------------------------------------
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '9.1.1', 'Requirement 9 - Restrict Physical Access to Cardholder Data', 'Physical access policies defined', 'All security policies and operational procedures identified in Requirement 9 are documented, kept up to date, in use, and known to all affected parties.', 'P1', 1, 1, 1, 54);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '9.1.2', 'Requirement 9 - Restrict Physical Access to Cardholder Data', 'Roles and responsibilities for physical access assigned', 'Roles and responsibilities for performing activities in Requirement 9 are documented, assigned, and understood by responsible personnel.', 'P1', 1, 1, 1, 55);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '9.2.1', 'Requirement 9 - Restrict Physical Access to Cardholder Data', 'Physical access controls for sensitive areas', 'Appropriate facility entry controls are in place to limit and monitor physical access to systems in the cardholder data environment.', 'P1', 1, 1, 1, 56);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '9.3.1', 'Requirement 9 - Restrict Physical Access to Cardholder Data', 'Physical access to sensitive areas controlled', 'Physical access to sensitive areas within the CDE is controlled by verifying individual access is authorized before granting access to the facility.', 'P1', 1, 1, 1, 57);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '9.4.1', 'Requirement 9 - Restrict Physical Access to Cardholder Data', 'Media physically secured', 'All media with cardholder data is physically secured, and media classification, internal or external distribution, is subject to strict controls.', 'P1', 1, 1, 1, 58);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '9.5.1', 'Requirement 9 - Restrict Physical Access to Cardholder Data', 'POI devices protected from tampering', 'Point-of-interaction devices that capture payment card data via direct physical interaction with the payment card form factor are protected from tampering and unauthorized substitution.', 'P1', 1, 1, 1, 59);

-- --------------------------------------------------------------------------
-- Requirement 10: Log and Monitor All Access to System Components and Cardholder Data
-- --------------------------------------------------------------------------
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '10.1.1', 'Requirement 10 - Log and Monitor All Access', 'Logging and monitoring policies defined', 'All security policies and operational procedures identified in Requirement 10 are documented, kept up to date, in use, and known to all affected parties.', 'P1', 1, 1, 1, 60);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '10.1.2', 'Requirement 10 - Log and Monitor All Access', 'Roles and responsibilities for logging assigned', 'Roles and responsibilities for performing activities in Requirement 10 are documented, assigned, and understood by responsible personnel.', 'P1', 1, 1, 1, 61);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '10.2.1', 'Requirement 10 - Log and Monitor All Access', 'Audit logs capture all access', 'Audit logs are enabled and active for all system components and cardholder data to record all individual user access to cardholder data and actions taken by administrators.', 'P1', 1, 1, 1, 62);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '10.2.2', 'Requirement 10 - Log and Monitor All Access', 'Audit logs record required details', 'Audit logs record sufficient detail for each auditable event including user identification, type of event, date and time, success or failure, origination of event, and identity or name of affected data or resource.', 'P1', 1, 1, 1, 63);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '10.3.1', 'Requirement 10 - Log and Monitor All Access', 'Audit logs protected from modification', 'Read access to audit logs is limited to those with a job-related need and current audit logs are protected from unauthorized modifications through access control mechanisms.', 'P1', 1, 1, 1, 64);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '10.4.1', 'Requirement 10 - Log and Monitor All Access', 'Audit logs reviewed daily', 'Audit logs are reviewed at least once daily to identify anomalies or suspicious activity using automated mechanisms and manual review processes.', 'P1', 1, 1, 1, 65);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '10.5.1', 'Requirement 10 - Log and Monitor All Access', 'Audit log history retained', 'Audit log history is retained for at least 12 months with at least the most recent three months immediately available for analysis.', 'P1', 1, 1, 1, 66);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '10.6.1', 'Requirement 10 - Log and Monitor All Access', 'Time synchronization technology implemented', 'System clocks and time are synchronized using time-synchronization technology and the technology is kept current to ensure accurate timestamps for audit logs.', 'P1', 1, 1, 1, 67);

-- --------------------------------------------------------------------------
-- Requirement 11: Test Security of Systems and Networks Regularly
-- --------------------------------------------------------------------------
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '11.1.1', 'Requirement 11 - Test Security of Systems and Networks Regularly', 'Security testing policies defined', 'All security policies and operational procedures identified in Requirement 11 are documented, kept up to date, in use, and known to all affected parties.', 'P1', 1, 1, 1, 68);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '11.1.2', 'Requirement 11 - Test Security of Systems and Networks Regularly', 'Roles and responsibilities for security testing assigned', 'Roles and responsibilities for performing activities in Requirement 11 are documented, assigned, and understood by responsible personnel.', 'P1', 1, 1, 1, 69);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '11.2.1', 'Requirement 11 - Test Security of Systems and Networks Regularly', 'Wireless access points detected and identified', 'Authorized and unauthorized wireless access points are managed by testing for the presence of wireless access points and detecting and identifying all authorized and unauthorized wireless access points on a quarterly basis.', 'P1', 1, 1, 1, 70);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '11.3.1', 'Requirement 11 - Test Security of Systems and Networks Regularly', 'Internal vulnerability scans performed', 'Internal vulnerability scans are performed at least once every three months and after any significant change to identify and address vulnerabilities.', 'P1', 1, 1, 1, 71);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '11.3.2', 'Requirement 11 - Test Security of Systems and Networks Regularly', 'External vulnerability scans performed', 'External vulnerability scans are performed at least once every three months and after any significant change by a PCI SSC Approved Scanning Vendor.', 'P1', 1, 1, 1, 72);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '11.4.1', 'Requirement 11 - Test Security of Systems and Networks Regularly', 'Penetration testing performed', 'External and internal penetration testing is regularly performed and exploitable vulnerabilities and security weaknesses are corrected in accordance with defined timeframes.', 'P1', 1, 1, 1, 73);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '11.5.1', 'Requirement 11 - Test Security of Systems and Networks Regularly', 'Intrusion detection and prevention deployed', 'Intrusion-detection and intrusion-prevention techniques are used to detect and alert on or prevent intrusions into the network at critical points and the CDE perimeter.', 'P1', 1, 1, 1, 74);

-- --------------------------------------------------------------------------
-- Requirement 12: Support Information Security with Organizational Policies and Programs
-- --------------------------------------------------------------------------
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '12.1.1', 'Requirement 12 - Support Information Security with Organizational Policies', 'Information security policy established', 'An overall information security policy is established, published, maintained, and disseminated to all relevant personnel and relevant interested parties.', 'P1', 1, 1, 1, 75);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '12.1.2', 'Requirement 12 - Support Information Security with Organizational Policies', 'Information security policy reviewed annually', 'The information security policy is reviewed at least once every 12 months and updated as needed to reflect changes to business objectives or the risk environment.', 'P1', 1, 1, 1, 76);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '12.3.1', 'Requirement 12 - Support Information Security with Organizational Policies', 'Risk assessment performed annually', 'A formal risk assessment is performed at least once every 12 months and upon significant changes to the environment to identify threats, vulnerabilities, and resulting risk.', 'P1', 1, 1, 1, 77);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '12.6.1', 'Requirement 12 - Support Information Security with Organizational Policies', 'Security awareness program implemented', 'A formal security awareness program is implemented to make all personnel aware of the cardholder data security policy and procedures.', 'P1', 1, 1, 1, 78);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '12.8.1', 'Requirement 12 - Support Information Security with Organizational Policies', 'Service provider relationships managed', 'A list of all third-party service providers with which account data is shared or that could affect the security of cardholder data is maintained.', 'P1', 1, 1, 1, 79);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '12.9.1', 'Requirement 12 - Support Information Security with Organizational Policies', 'Service provider compliance acknowledged', 'Third-party service providers acknowledge in writing to customers that they are responsible for the security of cardholder data they possess or otherwise store, process, or transmit on behalf of the customer.', 'P1', 1, 1, 1, 80);
INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('pci-dss-v4', '12.10.1', 'Requirement 12 - Support Information Security with Organizational Policies', 'Incident response plan established', 'An incident response plan exists and is ready to be activated in the event of a suspected or confirmed security breach, covering all key elements of incident response.', 'P1', 1, 1, 1, 81);
