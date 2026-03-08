#!/usr/bin/env node
// generate-framework-migrations.js — Generate NIST 800-171, CMMC, HIPAA, SOC 2, StateRAMP migrations

const fs = require('fs');
const path = require('path');

function sqlEscape(s) { return (s || '').replace(/'/g, "''").replace(/[\r\n]+/g, ' '); }

const DB_DIR = path.join(__dirname, '..', 'database');

// ============================================================================
// NIST 800-171 Rev 3 — 110 CUI Security Requirements
// Mapped from NIST 800-53 controls
// ============================================================================

const nist171Controls = [
  // 3.1 Access Control (22 requirements)
  { id: '3.1.1', family: 'Access Control', title: 'Account Management', desc: 'Limit system access to authorized users, processes acting on behalf of authorized users, and devices (including other systems).', map: 'AC-2' },
  { id: '3.1.2', family: 'Access Control', title: 'Access Enforcement', desc: 'Limit system access to the types of transactions and functions that authorized users are permitted to execute.', map: 'AC-3' },
  { id: '3.1.3', family: 'Access Control', title: 'Information Flow Enforcement', desc: 'Control the flow of CUI in accordance with approved authorizations.', map: 'AC-4' },
  { id: '3.1.4', family: 'Access Control', title: 'Separation of Duties', desc: 'Separate the duties of individuals to reduce the risk of malevolent activity without collusion.', map: 'AC-5' },
  { id: '3.1.5', family: 'Access Control', title: 'Least Privilege', desc: 'Employ the principle of least privilege, including for specific security functions and privileged accounts.', map: 'AC-6' },
  { id: '3.1.6', family: 'Access Control', title: 'Non-Privileged Account Use', desc: 'Use non-privileged accounts or roles when accessing nonsecurity functions.', map: 'AC-6(2)' },
  { id: '3.1.7', family: 'Access Control', title: 'Privileged Functions', desc: 'Prevent non-privileged users from executing privileged functions and capture the execution of such functions in audit logs.', map: 'AC-6(9)' },
  { id: '3.1.8', family: 'Access Control', title: 'Unsuccessful Logon Attempts', desc: 'Limit unsuccessful logon attempts.', map: 'AC-7' },
  { id: '3.1.9', family: 'Access Control', title: 'Privacy and Security Notices', desc: 'Provide privacy and security notices consistent with applicable CUI rules.', map: 'AC-8' },
  { id: '3.1.10', family: 'Access Control', title: 'Session Lock', desc: 'Use session lock with pattern-hiding displays to prevent access and viewing of data after a period of inactivity.', map: 'AC-11' },
  { id: '3.1.11', family: 'Access Control', title: 'Session Termination', desc: 'Terminate (automatically) a user session after a defined condition.', map: 'AC-12' },
  { id: '3.1.12', family: 'Access Control', title: 'Remote Access', desc: 'Monitor and control remote access sessions.', map: 'AC-17' },
  { id: '3.1.13', family: 'Access Control', title: 'Remote Access Confidentiality', desc: 'Employ cryptographic mechanisms to protect the confidentiality of remote access sessions.', map: 'AC-17(2)' },
  { id: '3.1.14', family: 'Access Control', title: 'Remote Access Routing', desc: 'Route remote access via managed access control points.', map: 'AC-17(3)' },
  { id: '3.1.15', family: 'Access Control', title: 'Privileged Remote Access', desc: 'Authorize remote execution of privileged commands and remote access to security-relevant information.', map: 'AC-17(4)' },
  { id: '3.1.16', family: 'Access Control', title: 'Wireless Access Authorization', desc: 'Authorize wireless access prior to allowing such connections.', map: 'AC-18' },
  { id: '3.1.17', family: 'Access Control', title: 'Wireless Access Protection', desc: 'Protect wireless access using authentication and encryption.', map: 'AC-18(1)' },
  { id: '3.1.18', family: 'Access Control', title: 'Mobile Device Connection', desc: 'Control connection of mobile devices.', map: 'AC-19' },
  { id: '3.1.19', family: 'Access Control', title: 'Encrypt CUI on Mobile Devices', desc: 'Encrypt CUI on mobile devices and mobile computing platforms.', map: 'AC-19(5)' },
  { id: '3.1.20', family: 'Access Control', title: 'External System Connections', desc: 'Verify and control/limit connections to and use of external systems.', map: 'AC-20' },
  { id: '3.1.21', family: 'Access Control', title: 'Portable Storage Use', desc: 'Limit use of portable storage devices on external systems.', map: 'AC-20(2)' },
  { id: '3.1.22', family: 'Access Control', title: 'Publicly Accessible Content', desc: 'Control information posted or processed on publicly accessible systems.', map: 'AC-22' },

  // 3.2 Awareness and Training (3 requirements)
  { id: '3.2.1', family: 'Awareness and Training', title: 'Role-Based Risk Awareness', desc: 'Ensure that managers, systems administrators, and users of organizational systems are made aware of the security risks associated with their activities and of the applicable policies, standards, and procedures related to the security of those systems.', map: 'AT-2' },
  { id: '3.2.2', family: 'Awareness and Training', title: 'Role-Based Training', desc: 'Ensure that personnel are trained to carry out their assigned information security-related duties and responsibilities.', map: 'AT-3' },
  { id: '3.2.3', family: 'Awareness and Training', title: 'Insider Threat Awareness', desc: 'Provide security awareness training on recognizing and reporting potential indicators of insider threat.', map: 'AT-2(2)' },

  // 3.3 Audit and Accountability (9 requirements)
  { id: '3.3.1', family: 'Audit and Accountability', title: 'System Auditing', desc: 'Create and retain system audit logs and records to the extent needed to enable the monitoring, analysis, investigation, and reporting of unlawful or unauthorized system activity.', map: 'AU-2' },
  { id: '3.3.2', family: 'Audit and Accountability', title: 'User Accountability', desc: 'Ensure that the actions of individual system users can be uniquely traced to those users so they can be held accountable for their actions.', map: 'AU-6' },
  { id: '3.3.3', family: 'Audit and Accountability', title: 'Event Review', desc: 'Review and update logged events.', map: 'AU-2' },
  { id: '3.3.4', family: 'Audit and Accountability', title: 'Audit Failure Alerting', desc: 'Alert in the event of an audit logging process failure.', map: 'AU-5' },
  { id: '3.3.5', family: 'Audit and Accountability', title: 'Audit Correlation', desc: 'Correlate audit record review, analysis, and reporting processes for investigation and response to indications of unlawful, unauthorized, suspicious, or unusual activity.', map: 'AU-6(3)' },
  { id: '3.3.6', family: 'Audit and Accountability', title: 'Audit Reduction and Reporting', desc: 'Provide audit record reduction and report generation to support on-demand analysis and reporting.', map: 'AU-7' },
  { id: '3.3.7', family: 'Audit and Accountability', title: 'Time Stamps', desc: 'Provide a system capability that compares and synchronizes internal system clocks with an authoritative source to generate time stamps for audit records.', map: 'AU-8' },
  { id: '3.3.8', family: 'Audit and Accountability', title: 'Audit Protection', desc: 'Protect audit information and audit logging tools from unauthorized access, modification, and deletion.', map: 'AU-9' },
  { id: '3.3.9', family: 'Audit and Accountability', title: 'Audit Management', desc: 'Limit management of audit logging functionality to a subset of privileged users.', map: 'AU-9(4)' },

  // 3.4 Configuration Management (9 requirements)
  { id: '3.4.1', family: 'Configuration Management', title: 'Baseline Configurations', desc: 'Establish and maintain baseline configurations and inventories of organizational systems (including hardware, software, firmware, and documentation) throughout the respective system development life cycles.', map: 'CM-2' },
  { id: '3.4.2', family: 'Configuration Management', title: 'Security Configuration Enforcement', desc: 'Establish and enforce security configuration settings for information technology products employed in organizational systems.', map: 'CM-6' },
  { id: '3.4.3', family: 'Configuration Management', title: 'System Change Management', desc: 'Track, review, approve or disapprove, and log changes to organizational systems.', map: 'CM-3' },
  { id: '3.4.4', family: 'Configuration Management', title: 'Security Impact Analysis', desc: 'Analyze the security impact of changes prior to implementation.', map: 'CM-4' },
  { id: '3.4.5', family: 'Configuration Management', title: 'Access Restrictions for Change', desc: 'Define, document, approve, and enforce physical and logical access restrictions associated with changes to organizational systems.', map: 'CM-5' },
  { id: '3.4.6', family: 'Configuration Management', title: 'Least Functionality', desc: 'Employ the principle of least functionality by configuring organizational systems to provide only essential capabilities.', map: 'CM-7' },
  { id: '3.4.7', family: 'Configuration Management', title: 'Nonessential Functionality', desc: 'Restrict, disable, or prevent the use of nonessential programs, functions, ports, protocols, and services.', map: 'CM-7(1)' },
  { id: '3.4.8', family: 'Configuration Management', title: 'Application Whitelisting', desc: 'Apply deny-by-exception (blacklisting) policy to prevent the use of unauthorized software or deny-all, permit-by-exception (whitelisting) policy to allow the execution of authorized software.', map: 'CM-7(5)' },
  { id: '3.4.9', family: 'Configuration Management', title: 'User-Installed Software', desc: 'Control and monitor user-installed software.', map: 'CM-11' },

  // 3.5 Identification and Authentication (11 requirements)
  { id: '3.5.1', family: 'Identification and Authentication', title: 'User Identification', desc: 'Identify system users, processes acting on behalf of users, and devices.', map: 'IA-2' },
  { id: '3.5.2', family: 'Identification and Authentication', title: 'Entity Authentication', desc: 'Authenticate (or verify) the identities of users, processes, or devices, as a prerequisite to allowing access to organizational systems.', map: 'IA-2' },
  { id: '3.5.3', family: 'Identification and Authentication', title: 'Multifactor Authentication', desc: 'Use multifactor authentication for local and network access to privileged accounts and for network access to non-privileged accounts.', map: 'IA-2(1)' },
  { id: '3.5.4', family: 'Identification and Authentication', title: 'Replay-Resistant Authentication', desc: 'Employ replay-resistant authentication mechanisms for network access to privileged and non-privileged accounts.', map: 'IA-2(8)' },
  { id: '3.5.5', family: 'Identification and Authentication', title: 'Identifier Management', desc: 'Prevent reuse of identifiers for a defined period.', map: 'IA-4' },
  { id: '3.5.6', family: 'Identification and Authentication', title: 'Identifier Inactivity', desc: 'Disable identifiers after a defined period of inactivity.', map: 'IA-4(4)' },
  { id: '3.5.7', family: 'Identification and Authentication', title: 'Password Complexity', desc: 'Enforce a minimum password complexity and change of characters when new passwords are created.', map: 'IA-5(1)' },
  { id: '3.5.8', family: 'Identification and Authentication', title: 'Password Reuse', desc: 'Prohibit password reuse for a specified number of generations.', map: 'IA-5(1)' },
  { id: '3.5.9', family: 'Identification and Authentication', title: 'Temporary Passwords', desc: 'Allow temporary password use for system logons with an immediate change to a permanent password.', map: 'IA-5(1)' },
  { id: '3.5.10', family: 'Identification and Authentication', title: 'Cryptographic Password Storage', desc: 'Store and transmit only cryptographically-protected passwords.', map: 'IA-5(2)' },
  { id: '3.5.11', family: 'Identification and Authentication', title: 'Obscure Feedback', desc: 'Obscure feedback of authentication information.', map: 'IA-6' },

  // 3.6 Incident Response (3 requirements)
  { id: '3.6.1', family: 'Incident Response', title: 'Incident Handling', desc: 'Establish an operational incident-handling capability for organizational systems that includes preparation, detection, analysis, containment, recovery, and user response activities.', map: 'IR-4' },
  { id: '3.6.2', family: 'Incident Response', title: 'Incident Reporting', desc: 'Track, document, and report incidents to designated officials and/or authorities both internal and external to the organization.', map: 'IR-6' },
  { id: '3.6.3', family: 'Incident Response', title: 'Incident Response Testing', desc: 'Test the organizational incident response capability.', map: 'IR-3' },

  // 3.7 Maintenance (6 requirements)
  { id: '3.7.1', family: 'Maintenance', title: 'System Maintenance', desc: 'Perform maintenance on organizational systems.', map: 'MA-2' },
  { id: '3.7.2', family: 'Maintenance', title: 'Maintenance Tools', desc: 'Provide controls on the tools, techniques, mechanisms, and personnel used to conduct system maintenance.', map: 'MA-3' },
  { id: '3.7.3', family: 'Maintenance', title: 'Equipment Sanitization', desc: 'Ensure equipment removed for off-site maintenance is sanitized of any CUI.', map: 'MA-3(2)' },
  { id: '3.7.4', family: 'Maintenance', title: 'Media Inspection', desc: 'Check media containing diagnostic and test programs for malicious code before the media are used in the system.', map: 'MA-3(2)' },
  { id: '3.7.5', family: 'Maintenance', title: 'Nonlocal Maintenance', desc: 'Require multifactor authentication to establish nonlocal maintenance sessions via external network connections and terminate such connections when nonlocal maintenance is complete.', map: 'MA-4' },
  { id: '3.7.6', family: 'Maintenance', title: 'Maintenance Personnel', desc: 'Supervise the maintenance activities of maintenance personnel without required access authorization.', map: 'MA-5' },

  // 3.8 Media Protection (9 requirements)
  { id: '3.8.1', family: 'Media Protection', title: 'Media Protection', desc: 'Protect (i.e., physically control and securely store) system media containing CUI, both paper and digital.', map: 'MP-4' },
  { id: '3.8.2', family: 'Media Protection', title: 'Media Access', desc: 'Limit access to CUI on system media to authorized users.', map: 'MP-2' },
  { id: '3.8.3', family: 'Media Protection', title: 'Media Sanitization', desc: 'Sanitize or destroy system media containing CUI before disposal or release for reuse.', map: 'MP-6' },
  { id: '3.8.4', family: 'Media Protection', title: 'Media Marking', desc: 'Mark media with necessary CUI markings and distribution limitations.', map: 'MP-3' },
  { id: '3.8.5', family: 'Media Protection', title: 'Media Accountability', desc: 'Control access to media containing CUI and maintain accountability for media during transport outside of controlled areas.', map: 'MP-5' },
  { id: '3.8.6', family: 'Media Protection', title: 'Portable Storage Encryption', desc: 'Implement cryptographic mechanisms to protect the confidentiality of CUI stored on digital media during transport unless otherwise protected by alternative physical safeguards.', map: 'MP-5' },
  { id: '3.8.7', family: 'Media Protection', title: 'Removable Media Use', desc: 'Control the use of removable media on system components.', map: 'MP-7' },
  { id: '3.8.8', family: 'Media Protection', title: 'Shared Media', desc: 'Prohibit the use of portable storage devices when such devices have no identifiable owner.', map: 'MP-7(1)' },
  { id: '3.8.9', family: 'Media Protection', title: 'CUI Backup Protection', desc: 'Protect the confidentiality of backup CUI at storage locations.', map: 'CP-9' },

  // 3.9 Personnel Security (2 requirements)
  { id: '3.9.1', family: 'Personnel Security', title: 'Personnel Screening', desc: 'Screen individuals prior to authorizing access to organizational systems containing CUI.', map: 'PS-3' },
  { id: '3.9.2', family: 'Personnel Security', title: 'Personnel Actions', desc: 'Ensure that organizational systems containing CUI are protected during and after personnel actions such as terminations and transfers.', map: 'PS-4' },

  // 3.10 Physical Protection (6 requirements)
  { id: '3.10.1', family: 'Physical Protection', title: 'Physical Access Authorization', desc: 'Limit physical access to organizational systems, equipment, and the respective operating environments to authorized individuals.', map: 'PE-2' },
  { id: '3.10.2', family: 'Physical Protection', title: 'Physical Access Control', desc: 'Protect and monitor the physical facility and support infrastructure for organizational systems.', map: 'PE-3' },
  { id: '3.10.3', family: 'Physical Protection', title: 'Escort Visitors', desc: 'Escort visitors and monitor visitor activity.', map: 'PE-3' },
  { id: '3.10.4', family: 'Physical Protection', title: 'Physical Access Logs', desc: 'Maintain audit logs of physical access.', map: 'PE-8' },
  { id: '3.10.5', family: 'Physical Protection', title: 'Physical Access Devices', desc: 'Control and manage physical access devices.', map: 'PE-3' },
  { id: '3.10.6', family: 'Physical Protection', title: 'Alternative Work Sites', desc: 'Enforce safeguarding measures for CUI at alternate work sites.', map: 'PE-17' },

  // 3.11 Risk Assessment (3 requirements)
  { id: '3.11.1', family: 'Risk Assessment', title: 'Risk Assessment', desc: 'Periodically assess the risk to organizational operations, organizational assets, and individuals, resulting from the operation of organizational systems and the associated processing, storage, or transmission of CUI.', map: 'RA-3' },
  { id: '3.11.2', family: 'Risk Assessment', title: 'Vulnerability Scanning', desc: 'Scan for vulnerabilities in organizational systems and applications periodically and when new vulnerabilities affecting those systems and applications are identified.', map: 'RA-5' },
  { id: '3.11.3', family: 'Risk Assessment', title: 'Vulnerability Remediation', desc: 'Remediate vulnerabilities in accordance with risk assessments.', map: 'RA-5(5)' },

  // 3.12 Security Assessment (4 requirements)
  { id: '3.12.1', family: 'Security Assessment', title: 'Security Control Assessment', desc: 'Periodically assess the security controls in organizational systems to determine if the controls are effective in their application.', map: 'CA-2' },
  { id: '3.12.2', family: 'Security Assessment', title: 'Plan of Action', desc: 'Develop and implement plans of action designed to correct deficiencies and reduce or eliminate vulnerabilities in organizational systems.', map: 'CA-5' },
  { id: '3.12.3', family: 'Security Assessment', title: 'Continuous Monitoring', desc: 'Monitor security controls on an ongoing basis to ensure the continued effectiveness of the controls.', map: 'CA-7' },
  { id: '3.12.4', family: 'Security Assessment', title: 'System Security Plan', desc: 'Develop, document, and periodically update system security plans that describe system boundaries, system environments of operation, how security requirements are implemented, and the relationships with or connections to other systems.', map: 'PL-2' },

  // 3.13 System and Communications Protection (16 requirements)
  { id: '3.13.1', family: 'System and Communications Protection', title: 'Boundary Protection', desc: 'Monitor, control, and protect communications (i.e., information transmitted or received by organizational systems) at the external boundaries and key internal boundaries of organizational systems.', map: 'SC-7' },
  { id: '3.13.2', family: 'System and Communications Protection', title: 'Security Architecture', desc: 'Employ architectural designs, software development techniques, and systems engineering principles that promote effective information security within organizational systems.', map: 'SA-8' },
  { id: '3.13.3', family: 'System and Communications Protection', title: 'Role Separation', desc: 'Separate user functionality from system management functionality.', map: 'SC-2' },
  { id: '3.13.4', family: 'System and Communications Protection', title: 'Shared Resources', desc: 'Prevent unauthorized and unintended information transfer via shared system resources.', map: 'SC-4' },
  { id: '3.13.5', family: 'System and Communications Protection', title: 'Public Access Protections', desc: 'Implement subnetworks for publicly accessible system components that are physically or logically separated from internal networks.', map: 'SC-7' },
  { id: '3.13.6', family: 'System and Communications Protection', title: 'Network Communication by Exception', desc: 'Deny network communications traffic by default and allow network communications traffic by exception (i.e., deny all, permit by exception).', map: 'SC-7(5)' },
  { id: '3.13.7', family: 'System and Communications Protection', title: 'Split Tunneling', desc: 'Prevent remote devices from simultaneously establishing non-remote connections with organizational systems and communicating via some other connection to resources in external networks (i.e., split tunneling).', map: 'SC-7(7)' },
  { id: '3.13.8', family: 'System and Communications Protection', title: 'CUI Encryption in Transit', desc: 'Implement cryptographic mechanisms to prevent unauthorized disclosure of CUI during transmission unless otherwise protected by alternative physical safeguards.', map: 'SC-8' },
  { id: '3.13.9', family: 'System and Communications Protection', title: 'Network Disconnect', desc: 'Terminate network connections associated with communications sessions at the end of the sessions or after a defined period of inactivity.', map: 'SC-10' },
  { id: '3.13.10', family: 'System and Communications Protection', title: 'Cryptographic Key Management', desc: 'Establish and manage cryptographic keys for cryptography employed in organizational systems.', map: 'SC-12' },
  { id: '3.13.11', family: 'System and Communications Protection', title: 'FIPS-Validated Cryptography', desc: 'Employ FIPS-validated cryptography when used to protect the confidentiality of CUI.', map: 'SC-13' },
  { id: '3.13.12', family: 'System and Communications Protection', title: 'Collaborative Computing', desc: 'Prohibit remote activation of collaborative computing devices and provide indication of devices in use to users present at the device.', map: 'SC-15' },
  { id: '3.13.13', family: 'System and Communications Protection', title: 'Mobile Code', desc: 'Control and monitor the use of mobile code.', map: 'SC-18' },
  { id: '3.13.14', family: 'System and Communications Protection', title: 'Voice over IP', desc: 'Control and monitor the use of Voice over Internet Protocol (VoIP) technologies.', map: 'SC-19' },
  { id: '3.13.15', family: 'System and Communications Protection', title: 'Session Authenticity', desc: 'Protect the authenticity of communications sessions.', map: 'SC-23' },
  { id: '3.13.16', family: 'System and Communications Protection', title: 'CUI at Rest', desc: 'Protect the confidentiality of CUI at rest.', map: 'SC-28' },

  // 3.14 System and Information Integrity (7 requirements)
  { id: '3.14.1', family: 'System and Information Integrity', title: 'Flaw Remediation', desc: 'Identify, report, and correct system flaws in a timely manner.', map: 'SI-2' },
  { id: '3.14.2', family: 'System and Information Integrity', title: 'Malicious Code Protection', desc: 'Provide protection from malicious code at designated locations within organizational systems.', map: 'SI-3' },
  { id: '3.14.3', family: 'System and Information Integrity', title: 'Security Alerts', desc: 'Monitor system security alerts and advisories and take action in response.', map: 'SI-5' },
  { id: '3.14.4', family: 'System and Information Integrity', title: 'Update Malicious Code Protection', desc: 'Update malicious code protection mechanisms when new releases are available.', map: 'SI-3' },
  { id: '3.14.5', family: 'System and Information Integrity', title: 'System and Network Monitoring', desc: 'Monitor organizational systems, including inbound and outbound communications traffic, to detect attacks and indicators of potential attacks.', map: 'SI-4' },
  { id: '3.14.6', family: 'System and Information Integrity', title: 'Monitor Communications for Attacks', desc: 'Identify unauthorized use of organizational systems.', map: 'SI-4' },
  { id: '3.14.7', family: 'System and Information Integrity', title: 'Unauthorized Changes', desc: 'Identify unauthorized changes to organizational systems.', map: 'SI-7' },
];

// ============================================================================
// HIPAA Security Rule — Implementation Specifications
// ============================================================================

const hipaaControls = [
  // Administrative Safeguards (§164.308)
  { id: '164.308(a)(1)(i)', family: 'Administrative Safeguards', title: 'Security Management Process', desc: 'Implement policies and procedures to prevent, detect, contain, and correct security violations.', map: 'PL-1,PM-1' },
  { id: '164.308(a)(1)(ii)(A)', family: 'Administrative Safeguards', title: 'Risk Analysis', desc: 'Conduct an accurate and thorough assessment of the potential risks and vulnerabilities to the confidentiality, integrity, and availability of electronic protected health information.', map: 'RA-3' },
  { id: '164.308(a)(1)(ii)(B)', family: 'Administrative Safeguards', title: 'Risk Management', desc: 'Implement security measures sufficient to reduce risks and vulnerabilities to a reasonable and appropriate level.', map: 'PM-9' },
  { id: '164.308(a)(1)(ii)(C)', family: 'Administrative Safeguards', title: 'Sanction Policy', desc: 'Apply appropriate sanctions against workforce members who fail to comply with the security policies and procedures.', map: 'PS-8' },
  { id: '164.308(a)(1)(ii)(D)', family: 'Administrative Safeguards', title: 'Information System Activity Review', desc: 'Implement procedures to regularly review records of information system activity, such as audit logs, access reports, and security incident tracking reports.', map: 'AU-6' },
  { id: '164.308(a)(2)', family: 'Administrative Safeguards', title: 'Assigned Security Responsibility', desc: 'Identify the security official who is responsible for the development and implementation of policies and procedures.', map: 'PM-2' },
  { id: '164.308(a)(3)(i)', family: 'Administrative Safeguards', title: 'Workforce Security', desc: 'Implement policies and procedures to ensure that all members of its workforce have appropriate access to ePHI.', map: 'AC-2' },
  { id: '164.308(a)(3)(ii)(A)', family: 'Administrative Safeguards', title: 'Authorization and/or Supervision', desc: 'Implement procedures for the authorization and/or supervision of workforce members who work with ePHI.', map: 'AC-2' },
  { id: '164.308(a)(3)(ii)(B)', family: 'Administrative Safeguards', title: 'Workforce Clearance Procedure', desc: 'Implement procedures to determine that the access of a workforce member to ePHI is appropriate.', map: 'PS-3' },
  { id: '164.308(a)(3)(ii)(C)', family: 'Administrative Safeguards', title: 'Termination Procedures', desc: 'Implement procedures for terminating access to ePHI when employment or other arrangement ends.', map: 'PS-4' },
  { id: '164.308(a)(4)(i)', family: 'Administrative Safeguards', title: 'Information Access Management', desc: 'Implement policies and procedures for authorizing access to ePHI consistent with the Privacy Rule.', map: 'AC-1' },
  { id: '164.308(a)(4)(ii)(A)', family: 'Administrative Safeguards', title: 'Isolating Health Care Clearinghouse Functions', desc: 'If a health care clearinghouse is part of a larger organization, the clearinghouse must implement policies and procedures that protect ePHI from unauthorized access.', map: 'SC-7' },
  { id: '164.308(a)(4)(ii)(B)', family: 'Administrative Safeguards', title: 'Access Authorization', desc: 'Implement policies and procedures for granting access to ePHI, for example, through access to a workstation, transaction, program, process, or other mechanism.', map: 'AC-3' },
  { id: '164.308(a)(4)(ii)(C)', family: 'Administrative Safeguards', title: 'Access Establishment and Modification', desc: 'Implement policies and procedures that establish, document, review, and modify a user right of access to a workstation, transaction, program, or process.', map: 'AC-2' },
  { id: '164.308(a)(5)(i)', family: 'Administrative Safeguards', title: 'Security Awareness and Training', desc: 'Implement a security awareness and training program for all members of its workforce.', map: 'AT-2' },
  { id: '164.308(a)(5)(ii)(A)', family: 'Administrative Safeguards', title: 'Security Reminders', desc: 'Periodic security updates.', map: 'AT-2' },
  { id: '164.308(a)(5)(ii)(B)', family: 'Administrative Safeguards', title: 'Protection from Malicious Software', desc: 'Procedures for guarding against, detecting, and reporting malicious software.', map: 'SI-3' },
  { id: '164.308(a)(5)(ii)(C)', family: 'Administrative Safeguards', title: 'Log-in Monitoring', desc: 'Procedures for monitoring log-in attempts and reporting discrepancies.', map: 'AC-7' },
  { id: '164.308(a)(5)(ii)(D)', family: 'Administrative Safeguards', title: 'Password Management', desc: 'Procedures for creating, changing, and safeguarding passwords.', map: 'IA-5' },
  { id: '164.308(a)(6)(i)', family: 'Administrative Safeguards', title: 'Security Incident Procedures', desc: 'Implement policies and procedures to address security incidents.', map: 'IR-1' },
  { id: '164.308(a)(6)(ii)', family: 'Administrative Safeguards', title: 'Response and Reporting', desc: 'Identify and respond to suspected or known security incidents; mitigate harmful effects; document incidents and outcomes.', map: 'IR-4,IR-6' },
  { id: '164.308(a)(7)(i)', family: 'Administrative Safeguards', title: 'Contingency Plan', desc: 'Establish policies and procedures for responding to an emergency or other occurrence that damages systems containing ePHI.', map: 'CP-1' },
  { id: '164.308(a)(7)(ii)(A)', family: 'Administrative Safeguards', title: 'Data Backup Plan', desc: 'Establish and implement procedures to create and maintain retrievable exact copies of ePHI.', map: 'CP-9' },
  { id: '164.308(a)(7)(ii)(B)', family: 'Administrative Safeguards', title: 'Disaster Recovery Plan', desc: 'Establish and implement procedures to restore any loss of data.', map: 'CP-10' },
  { id: '164.308(a)(7)(ii)(C)', family: 'Administrative Safeguards', title: 'Emergency Mode Operation Plan', desc: 'Establish and implement procedures to enable continuation of critical business processes.', map: 'CP-2' },
  { id: '164.308(a)(7)(ii)(D)', family: 'Administrative Safeguards', title: 'Testing and Revision Procedures', desc: 'Implement procedures for periodic testing and revision of contingency plans.', map: 'CP-4' },
  { id: '164.308(a)(7)(ii)(E)', family: 'Administrative Safeguards', title: 'Applications and Data Criticality Analysis', desc: 'Assess the relative criticality of specific applications and data in support of other contingency plan components.', map: 'CP-2' },
  { id: '164.308(a)(8)', family: 'Administrative Safeguards', title: 'Evaluation', desc: 'Perform a periodic technical and nontechnical evaluation based on standards implemented under this rule.', map: 'CA-2' },
  { id: '164.308(b)(1)', family: 'Administrative Safeguards', title: 'Business Associate Contracts', desc: 'Contracts or other arrangements with business associates must provide satisfactory assurances of appropriate safeguards.', map: 'SA-9' },

  // Physical Safeguards (§164.310)
  { id: '164.310(a)(1)', family: 'Physical Safeguards', title: 'Facility Access Controls', desc: 'Implement policies and procedures to limit physical access to its electronic information systems and the facility in which they are housed.', map: 'PE-2,PE-3' },
  { id: '164.310(a)(2)(i)', family: 'Physical Safeguards', title: 'Contingency Operations', desc: 'Establish procedures that allow facility access in support of restoration of lost data under the disaster recovery plan and emergency mode operations plan.', map: 'PE-3,CP-10' },
  { id: '164.310(a)(2)(ii)', family: 'Physical Safeguards', title: 'Facility Security Plan', desc: 'Implement policies and procedures to safeguard the facility and equipment from unauthorized physical access, tampering, and theft.', map: 'PE-3' },
  { id: '164.310(a)(2)(iii)', family: 'Physical Safeguards', title: 'Access Control and Validation', desc: 'Implement procedures to control and validate a person access to facilities based on their role or function.', map: 'PE-2' },
  { id: '164.310(a)(2)(iv)', family: 'Physical Safeguards', title: 'Maintenance Records', desc: 'Implement policies and procedures to document repairs and modifications to the physical components of a facility related to security.', map: 'MA-2' },
  { id: '164.310(b)', family: 'Physical Safeguards', title: 'Workstation Use', desc: 'Implement policies and procedures that specify the proper functions to be performed, the manner in which those functions are to be performed, and the physical attributes of the surroundings of a specific workstation.', map: 'AC-17' },
  { id: '164.310(c)', family: 'Physical Safeguards', title: 'Workstation Security', desc: 'Implement physical safeguards for all workstations that access ePHI, to restrict access to authorized users.', map: 'PE-5' },
  { id: '164.310(d)(1)', family: 'Physical Safeguards', title: 'Device and Media Controls', desc: 'Implement policies and procedures that govern the receipt and removal of hardware and electronic media containing ePHI.', map: 'MP-6' },
  { id: '164.310(d)(2)(i)', family: 'Physical Safeguards', title: 'Disposal', desc: 'Implement policies and procedures to address the final disposition of ePHI and/or hardware or electronic media on which it is stored.', map: 'MP-6' },
  { id: '164.310(d)(2)(ii)', family: 'Physical Safeguards', title: 'Media Re-use', desc: 'Implement procedures for removal of ePHI from electronic media before the media are made available for re-use.', map: 'MP-6' },
  { id: '164.310(d)(2)(iii)', family: 'Physical Safeguards', title: 'Accountability', desc: 'Maintain a record of the movements of hardware and electronic media and any person responsible.', map: 'MP-5' },
  { id: '164.310(d)(2)(iv)', family: 'Physical Safeguards', title: 'Data Backup and Storage', desc: 'Create a retrievable, exact copy of ePHI, when needed, before movement of equipment.', map: 'CP-9' },

  // Technical Safeguards (§164.312)
  { id: '164.312(a)(1)', family: 'Technical Safeguards', title: 'Access Control', desc: 'Implement technical policies and procedures for electronic information systems that maintain ePHI to allow access only to authorized persons or software programs.', map: 'AC-3' },
  { id: '164.312(a)(2)(i)', family: 'Technical Safeguards', title: 'Unique User Identification', desc: 'Assign a unique name and/or number for identifying and tracking user identity.', map: 'IA-2' },
  { id: '164.312(a)(2)(ii)', family: 'Technical Safeguards', title: 'Emergency Access Procedure', desc: 'Establish procedures for obtaining necessary ePHI during an emergency.', map: 'CP-2' },
  { id: '164.312(a)(2)(iii)', family: 'Technical Safeguards', title: 'Automatic Logoff', desc: 'Implement electronic procedures that terminate an electronic session after a predetermined time of inactivity.', map: 'AC-11' },
  { id: '164.312(a)(2)(iv)', family: 'Technical Safeguards', title: 'Encryption and Decryption', desc: 'Implement a mechanism to encrypt and decrypt ePHI.', map: 'SC-28' },
  { id: '164.312(b)', family: 'Technical Safeguards', title: 'Audit Controls', desc: 'Implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems containing or using ePHI.', map: 'AU-2,AU-12' },
  { id: '164.312(c)(1)', family: 'Technical Safeguards', title: 'Integrity', desc: 'Implement policies and procedures to protect ePHI from improper alteration or destruction.', map: 'SI-7' },
  { id: '164.312(c)(2)', family: 'Technical Safeguards', title: 'Mechanism to Authenticate ePHI', desc: 'Implement electronic mechanisms to corroborate that ePHI has not been altered or destroyed in an unauthorized manner.', map: 'SI-7' },
  { id: '164.312(d)', family: 'Technical Safeguards', title: 'Person or Entity Authentication', desc: 'Implement procedures to verify that a person or entity seeking access to ePHI is the one claimed.', map: 'IA-2' },
  { id: '164.312(e)(1)', family: 'Technical Safeguards', title: 'Transmission Security', desc: 'Implement technical security measures to guard against unauthorized access to ePHI transmitted over an electronic communications network.', map: 'SC-8' },
  { id: '164.312(e)(2)(i)', family: 'Technical Safeguards', title: 'Integrity Controls', desc: 'Implement security measures to ensure that electronically transmitted ePHI is not improperly modified without detection.', map: 'SC-8(1)' },
  { id: '164.312(e)(2)(ii)', family: 'Technical Safeguards', title: 'Encryption', desc: 'Implement a mechanism to encrypt ePHI whenever deemed appropriate.', map: 'SC-13' },
];

// ============================================================================
// SOC 2 Trust Services Criteria
// ============================================================================

const soc2Controls = [
  // Common Criteria (CC) - Security
  { id: 'CC1.1', family: 'Control Environment', title: 'COSO Principle 1', desc: 'The entity demonstrates a commitment to integrity and ethical values.', map: 'PL-4' },
  { id: 'CC1.2', family: 'Control Environment', title: 'COSO Principle 2', desc: 'The board of directors demonstrates independence from management and exercises oversight of the development and performance of internal control.', map: 'PM-1' },
  { id: 'CC1.3', family: 'Control Environment', title: 'COSO Principle 3', desc: 'Management establishes, with board oversight, structures, reporting lines, and appropriate authorities and responsibilities.', map: 'PM-1' },
  { id: 'CC1.4', family: 'Control Environment', title: 'COSO Principle 4', desc: 'The entity demonstrates a commitment to attract, develop, and retain competent individuals in alignment with objectives.', map: 'PS-2' },
  { id: 'CC1.5', family: 'Control Environment', title: 'COSO Principle 5', desc: 'The entity holds individuals accountable for their internal control responsibilities in the pursuit of objectives.', map: 'PS-6' },
  { id: 'CC2.1', family: 'Communication and Information', title: 'COSO Principle 13', desc: 'The entity obtains or generates and uses relevant, quality information to support the functioning of internal control.', map: 'PM-3' },
  { id: 'CC2.2', family: 'Communication and Information', title: 'COSO Principle 14', desc: 'The entity internally communicates information, including objectives and responsibilities for internal control.', map: 'PM-1' },
  { id: 'CC2.3', family: 'Communication and Information', title: 'COSO Principle 15', desc: 'The entity communicates with external parties regarding matters affecting the functioning of internal control.', map: 'PM-1' },
  { id: 'CC3.1', family: 'Risk Assessment', title: 'COSO Principle 6', desc: 'The entity specifies objectives with sufficient clarity to enable the identification and assessment of risks relating to objectives.', map: 'RA-1' },
  { id: 'CC3.2', family: 'Risk Assessment', title: 'COSO Principle 7', desc: 'The entity identifies risks to the achievement of its objectives across the entity and analyzes risks as a basis for determining how the risks should be managed.', map: 'RA-3' },
  { id: 'CC3.3', family: 'Risk Assessment', title: 'COSO Principle 8', desc: 'The entity considers the potential for fraud in assessing risks to the achievement of objectives.', map: 'RA-3' },
  { id: 'CC3.4', family: 'Risk Assessment', title: 'COSO Principle 9', desc: 'The entity identifies and assesses changes that could significantly impact the system of internal control.', map: 'RA-3' },
  { id: 'CC4.1', family: 'Monitoring Activities', title: 'COSO Principle 16', desc: 'The entity selects, develops, and performs ongoing and/or separate evaluations to ascertain whether the components of internal control are present and functioning.', map: 'CA-7' },
  { id: 'CC4.2', family: 'Monitoring Activities', title: 'COSO Principle 17', desc: 'The entity evaluates and communicates internal control deficiencies in a timely manner to those parties responsible.', map: 'CA-5' },
  { id: 'CC5.1', family: 'Control Activities', title: 'COSO Principle 10', desc: 'The entity selects and develops control activities that contribute to the mitigation of risks to the achievement of objectives.', map: 'PM-9' },
  { id: 'CC5.2', family: 'Control Activities', title: 'COSO Principle 11', desc: 'The entity also selects and develops general control activities over technology to support the achievement of objectives.', map: 'CM-1' },
  { id: 'CC5.3', family: 'Control Activities', title: 'COSO Principle 12', desc: 'The entity deploys control activities through policies that establish what is expected and in procedures that put policies into action.', map: 'PL-1' },
  { id: 'CC6.1', family: 'Logical and Physical Access Controls', title: 'Logical Access Security', desc: 'The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events.', map: 'AC-3,IA-2' },
  { id: 'CC6.2', family: 'Logical and Physical Access Controls', title: 'User Registration and Authorization', desc: 'Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users.', map: 'AC-2,IA-4' },
  { id: 'CC6.3', family: 'Logical and Physical Access Controls', title: 'Role-Based Access and Least Privilege', desc: 'The entity authorizes, modifies, or removes access to data, software, functions, and other protected information assets based on roles.', map: 'AC-6' },
  { id: 'CC6.4', family: 'Logical and Physical Access Controls', title: 'Physical Access Restrictions', desc: 'The entity restricts physical access to facilities and protected information assets to authorized personnel.', map: 'PE-2,PE-3' },
  { id: 'CC6.5', family: 'Logical and Physical Access Controls', title: 'Logical Access Disposal', desc: 'The entity discontinues logical and physical protections over physical assets only after the ability to read or recover data has been diminished.', map: 'MP-6' },
  { id: 'CC6.6', family: 'Logical and Physical Access Controls', title: 'Security Measures Against External Threats', desc: 'The entity implements logical access security measures to protect against threats from sources outside its system boundaries.', map: 'SC-7' },
  { id: 'CC6.7', family: 'Logical and Physical Access Controls', title: 'Data Transmission and Movement', desc: 'The entity restricts the transmission, movement, and removal of information to authorized internal and external users and processes.', map: 'AC-4,SC-8' },
  { id: 'CC6.8', family: 'Logical and Physical Access Controls', title: 'Malicious Software Prevention', desc: 'The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software.', map: 'SI-3' },
  { id: 'CC7.1', family: 'System Operations', title: 'Infrastructure and Software Monitoring', desc: 'To meet its objectives, the entity uses detection and monitoring procedures to identify changes to configurations that result in the introduction of new vulnerabilities.', map: 'CM-3,SI-4' },
  { id: 'CC7.2', family: 'System Operations', title: 'Anomaly Monitoring', desc: 'The entity monitors system components and the operation of those components for anomalies that are indicative of malicious acts.', map: 'SI-4' },
  { id: 'CC7.3', family: 'System Operations', title: 'Security Event Evaluation', desc: 'The entity evaluates security events to determine whether they could or have resulted in a failure to meet objectives.', map: 'IR-4' },
  { id: 'CC7.4', family: 'System Operations', title: 'Security Incident Response', desc: 'The entity responds to identified security incidents by executing a defined incident response program.', map: 'IR-4,IR-8' },
  { id: 'CC7.5', family: 'System Operations', title: 'Incident Recovery', desc: 'The entity identifies, develops, and implements activities to recover from identified security incidents.', map: 'IR-4,CP-10' },
  { id: 'CC8.1', family: 'Change Management', title: 'Change Management Process', desc: 'The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures.', map: 'CM-3,SA-10' },
  { id: 'CC9.1', family: 'Risk Mitigation', title: 'Risk Mitigation', desc: 'The entity identifies, selects, and develops risk mitigation activities for risks arising from potential business disruptions.', map: 'CP-2' },
  { id: 'CC9.2', family: 'Risk Mitigation', title: 'Vendor and Business Partner Risk Management', desc: 'The entity assesses and manages risks associated with vendors and business partners.', map: 'SA-9' },

  // Availability (A)
  { id: 'A1.1', family: 'Availability', title: 'Capacity Management', desc: 'The entity maintains, monitors, and evaluates current processing capacity and use of system components to manage capacity demand.', map: 'AU-4,CP-2' },
  { id: 'A1.2', family: 'Availability', title: 'Environmental Protections', desc: 'The entity authorizes, designs, develops or acquires, implements, operates, approves, maintains, and monitors environmental protections.', map: 'PE-13,PE-14' },
  { id: 'A1.3', family: 'Availability', title: 'Recovery Procedures', desc: 'The entity tests recovery plan procedures supporting system recovery to meet its objectives.', map: 'CP-4' },

  // Processing Integrity (PI)
  { id: 'PI1.1', family: 'Processing Integrity', title: 'Processing Completeness and Accuracy', desc: 'The entity implements policies and procedures over system processing to result in products, services, and reporting to meet the entity objectives.', map: 'SI-10' },
  { id: 'PI1.2', family: 'Processing Integrity', title: 'System Inputs', desc: 'The entity implements policies and procedures over system inputs, including controls over completeness and accuracy.', map: 'SI-10' },
  { id: 'PI1.3', family: 'Processing Integrity', title: 'System Processing', desc: 'The entity implements policies and procedures over system processing to result in products, services, and reporting meeting the entity objectives.', map: 'SI-10' },
  { id: 'PI1.4', family: 'Processing Integrity', title: 'System Outputs', desc: 'The entity implements policies and procedures to make available or deliver output completely, accurately, and timely.', map: 'SI-11' },
  { id: 'PI1.5', family: 'Processing Integrity', title: 'Inputs Storage and Processing', desc: 'The entity stores inputs, items in processing, and outputs completely, accurately, and timely.', map: 'SI-10' },

  // Confidentiality (C)
  { id: 'C1.1', family: 'Confidentiality', title: 'Confidential Information Identification', desc: 'The entity identifies and maintains confidential information to meet the entity objectives regarding confidentiality.', map: 'SC-28,MP-4' },
  { id: 'C1.2', family: 'Confidentiality', title: 'Confidential Information Disposal', desc: 'The entity disposes of confidential information to meet the entity objectives regarding confidentiality.', map: 'MP-6' },

  // Privacy (P)
  { id: 'P1.1', family: 'Privacy', title: 'Privacy Notice', desc: 'The entity provides notice to data subjects about its privacy practices.', map: 'PT-5' },
  { id: 'P2.1', family: 'Privacy', title: 'Choice and Consent', desc: 'The entity communicates choices available regarding the collection, use, retention, disclosure, and disposal of personal information.', map: 'PT-4' },
  { id: 'P3.1', family: 'Privacy', title: 'Personal Information Collection', desc: 'Personal information is collected consistent with the entity privacy objectives.', map: 'PT-2' },
  { id: 'P3.2', family: 'Privacy', title: 'Explicit Consent for Sensitive Information', desc: 'For information requiring explicit consent, the entity communicates the need for such consent.', map: 'PT-4' },
  { id: 'P4.1', family: 'Privacy', title: 'Use of Personal Information', desc: 'The entity limits the use of personal information to the purposes identified in the entity privacy notice.', map: 'PT-3' },
  { id: 'P4.2', family: 'Privacy', title: 'Retention of Personal Information', desc: 'The entity retains personal information consistent with the entity objectives related to privacy.', map: 'SI-12' },
  { id: 'P4.3', family: 'Privacy', title: 'Disposal of Personal Information', desc: 'The entity securely disposes of personal information to meet the entity objectives related to privacy.', map: 'MP-6' },
  { id: 'P5.1', family: 'Privacy', title: 'Access to Personal Information', desc: 'The entity grants identified and authenticated data subjects the ability to access their stored personal information for review.', map: 'AC-3' },
  { id: 'P5.2', family: 'Privacy', title: 'Correction of Personal Information', desc: 'The entity corrects, amends, or appends personal information based on information provided by data subjects.', map: 'PT-6' },
  { id: 'P6.1', family: 'Privacy', title: 'Disclosure of Personal Information', desc: 'The entity discloses personal information to third parties with the explicit consent of data subjects.', map: 'PT-3' },
  { id: 'P6.2', family: 'Privacy', title: 'Authorized Disclosures', desc: 'The entity creates and retains a complete, accurate, and timely record of authorized disclosures of personal information.', map: 'AU-2' },
  { id: 'P6.3', family: 'Privacy', title: 'Unauthorized Disclosures', desc: 'The entity creates and retains a complete, accurate, and timely record of detected or reported unauthorized disclosures of personal information.', map: 'IR-6' },
  { id: 'P6.4', family: 'Privacy', title: 'Third-Party Privacy', desc: 'The entity obtains privacy commitments from vendors and other third parties.', map: 'SA-9' },
  { id: 'P6.5', family: 'Privacy', title: 'Third-Party Compliance', desc: 'The entity obtains commitments that vendors and other third parties comply with the entity privacy policies.', map: 'SA-9' },
  { id: 'P6.6', family: 'Privacy', title: 'Notification of Privacy Breaches', desc: 'The entity provides notification of breaches and incidents to affected data subjects, regulators, and others.', map: 'IR-6' },
  { id: 'P6.7', family: 'Privacy', title: 'Privacy Awareness Training', desc: 'The entity provides awareness training on privacy, including the entity privacy notice.', map: 'AT-2' },
  { id: 'P7.1', family: 'Privacy', title: 'Data Quality', desc: 'The entity collects and maintains accurate, up-to-date, complete, and relevant personal information.', map: 'SI-12' },
  { id: 'P8.1', family: 'Privacy', title: 'Dispute Resolution', desc: 'The entity implements a process for receiving, addressing, resolving, and communicating the resolution of inquiries, complaints, and disputes.', map: 'PM-22' },
];

// ============================================================================
// StateRAMP — Based on FedRAMP with state/local modifications
// ============================================================================

// StateRAMP uses FedRAMP baselines — we'll reference the FedRAMP Moderate baseline
// but under the StateRAMP framework_id for state/local government use
function generateStateRAMPControls() {
  // StateRAMP Moderate = FedRAMP Moderate subset (~287 controls)
  // We reuse the moderate baseline IDs from the OSCAL profile
  const CACHE_DIR2 = path.join(__dirname, '..', '.oscal-cache');
  const modProfile = JSON.parse(fs.readFileSync(path.join(CACHE_DIR2, 'baseline-moderate.json'), 'utf8'));
  const ids = new Set();
  for (const imp of (modProfile.profile || modProfile).imports || []) {
    for (const inc of imp['include-controls'] || []) {
      for (const id of inc['with-ids'] || []) {
        ids.add(id.toUpperCase().replace(/\.(\d+)$/, '($1)'));
      }
    }
  }
  return [...ids].sort();
}

// ============================================================================
// SQL Generation Helpers
// ============================================================================

function generateControlInserts(frameworkId, controls, sortStart) {
  const lines = [];
  let sort = sortStart || 1;
  for (const ctrl of controls) {
    lines.push(
      `INSERT OR REPLACE INTO security_controls (id, framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, is_enhancement, parent_control_id, sort_order) ` +
      `VALUES (lower(hex(randomblob(16))), '${frameworkId}', '${sqlEscape(ctrl.id)}', '${sqlEscape(ctrl.family)}', '${sqlEscape(ctrl.title)}', '${sqlEscape(ctrl.desc)}', 'P1', 1, 1, 1, 0, '', ${sort++});`
    );
  }
  return { lines, nextSort: sort };
}

function generateCrosswalks(sourceFramework, controls, targetFramework) {
  const lines = [];
  for (const ctrl of controls) {
    const maps = (ctrl.map || '').split(',');
    for (const m of maps) {
      const targetId = m.trim();
      if (!targetId) continue;
      lines.push(
        `INSERT OR IGNORE INTO control_crosswalks (id, source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence) ` +
        `VALUES (lower(hex(randomblob(16))), '${sourceFramework}', '${sqlEscape(ctrl.id)}', '${targetFramework}', '${sqlEscape(targetId)}', 'equivalent', 1.0);`
      );
    }
  }
  return lines;
}

// ============================================================================
// Main — Generate all framework migrations
// ============================================================================

function main() {
  // --- NIST 800-171 (migrate-037) ---
  {
    const lines = [];
    lines.push('-- ============================================================================');
    lines.push('-- Migration: migrate-037-nist-800-171-controls.sql');
    lines.push(`-- NIST SP 800-171 Rev 3 — ${nist171Controls.length} CUI Security Requirements`);
    lines.push(`-- Generated: ${new Date().toISOString()}`);
    lines.push('-- ============================================================================');
    lines.push('');
    const { lines: inserts } = generateControlInserts('fw_nist_800_171', nist171Controls, 1);
    lines.push(...inserts);
    lines.push('');
    lines.push('-- Crosswalks: NIST 800-171 -> NIST 800-53');
    lines.push(...generateCrosswalks('fw_nist_800_171', nist171Controls, 'fw_nist_800_53_r5'));
    const outPath = path.join(DB_DIR, 'migrate-037-nist-800-171-controls.sql');
    fs.writeFileSync(outPath, lines.join('\n'));
    console.log(`NIST 800-171: ${nist171Controls.length} controls -> ${outPath}`);
  }

  // --- CMMC L2/L3 (migrate-038) ---
  {
    // CMMC L2 maps 1:1 to NIST 800-171
    const cmmcL2 = nist171Controls.map(c => ({
      id: `${c.family.replace(/ /g, '').replace(/andCommunications/, 'C').replace(/andInformation/, 'I').replace(/and/g, '').substring(0, 2).toUpperCase()}.L2-${c.id}`,
      family: c.family,
      title: c.title,
      desc: c.desc,
      map: c.id, // Maps to 800-171
    }));

    // CMMC L3 = L2 + 24 additional from 800-172
    const cmmcL3Extra = [
      { id: 'AC.L3-3.1.2e', family: 'Access Control', title: 'Access Control Enhancement', desc: 'Employ dual authorization for critical or sensitive operations.', map: '3.1.2' },
      { id: 'AT.L3-3.2.1e', family: 'Awareness and Training', title: 'Advanced Training', desc: 'Provide awareness training focused on recognizing and responding to threats from social engineering, advanced persistent threat actors, breaches, and suspicious behaviors.', map: '3.2.1' },
      { id: 'AT.L3-3.2.2e', family: 'Awareness and Training', title: 'Practical Exercises', desc: 'Include practical exercises in awareness training that are aligned with current threat scenarios.', map: '3.2.2' },
      { id: 'AU.L3-3.3.1e', family: 'Audit and Accountability', title: 'Advanced Audit', desc: 'Establish and maintain a system-level mechanism to plan, implement, and review audit and accountability activities.', map: '3.3.1' },
      { id: 'AU.L3-3.3.2e', family: 'Audit and Accountability', title: 'Audit Review, Analysis, and Reporting', desc: 'Review, analyze, and report audit information for indications of inappropriate or unusual activity.', map: '3.3.2' },
      { id: 'CA.L3-3.12.1e', family: 'Security Assessment', title: 'Independent Assessment', desc: 'Employ independent assessors or assessment teams to conduct security assessments.', map: '3.12.1' },
      { id: 'CM.L3-3.4.1e', family: 'Configuration Management', title: 'Authoritative Source and Repository', desc: 'Establish and maintain an authoritative source and repository to provide a trusted source and accountability for approved and implemented system components.', map: '3.4.1' },
      { id: 'CM.L3-3.4.2e', family: 'Configuration Management', title: 'Automated Tracking', desc: 'Employ automated mechanisms to detect misconfigured or unauthorized system components.', map: '3.4.2' },
      { id: 'CM.L3-3.4.3e', family: 'Configuration Management', title: 'Change Validation', desc: 'Employ automated discovery and management tools to maintain an up-to-date, complete, accurate, and readily available inventory of system components.', map: '3.4.3' },
      { id: 'IA.L3-3.5.1e', family: 'Identification and Authentication', title: 'Bidirectional Authentication', desc: 'Employ automated or manual/procedural mechanisms to prohibit system components from connecting to organizational systems unless the components are known, authenticated, in a properly configured state.', map: '3.5.1' },
      { id: 'IA.L3-3.5.3e', family: 'Identification and Authentication', title: 'Phishing-Resistant MFA', desc: 'Implement phishing-resistant multifactor authentication.', map: '3.5.3' },
      { id: 'IR.L3-3.6.1e', family: 'Incident Response', title: 'Automated Incident Response', desc: 'Establish and maintain a security operations center capability that facilitates a 24/7 response capability.', map: '3.6.1' },
      { id: 'IR.L3-3.6.2e', family: 'Incident Response', title: 'Incident Root Cause Analysis', desc: 'Establish and maintain a security operations center to facilitate incident response.', map: '3.6.2' },
      { id: 'PE.L3-3.10.1e', family: 'Physical Protection', title: 'Penetration Testing', desc: 'Conduct periodic red team exercises to test organizational readiness to identify and stop adversarial activity.', map: '3.10.1' },
      { id: 'RA.L3-3.11.1e', family: 'Risk Assessment', title: 'Threat-Informed Risk Assessment', desc: 'Employ threat intelligence and information from threat-hunting activities to inform the risk assessment process.', map: '3.11.1' },
      { id: 'RA.L3-3.11.2e', family: 'Risk Assessment', title: 'Threat Hunting', desc: 'Conduct cyber threat hunting activities on an ongoing and planned basis.', map: '3.11.2' },
      { id: 'RA.L3-3.11.3e', family: 'Risk Assessment', title: 'Predictive Analytics', desc: 'Employ advanced automation and analytics capabilities to predict and identify risks to organizations, systems, and system components.', map: '3.11.3' },
      { id: 'SA.L3-3.13.2e', family: 'System and Communications Protection', title: 'System Security Engineering', desc: 'Apply systems security engineering principles to the development of organizational systems.', map: '3.13.2' },
      { id: 'SC.L3-3.13.1e', family: 'System and Communications Protection', title: 'Network Segmentation', desc: 'Employ isolation and segmentation techniques in the design of the network architecture for the system.', map: '3.13.1' },
      { id: 'SC.L3-3.13.4e', family: 'System and Communications Protection', title: 'Isolation Techniques', desc: 'Employ physical and logical isolation techniques in the system and security architecture and/or where determined to be appropriate.', map: '3.13.4' },
      { id: 'SC.L3-3.13.11e', family: 'System and Communications Protection', title: 'Refresh Sessions', desc: 'Refresh authenticators and cryptographic keys.', map: '3.13.11' },
      { id: 'SI.L3-3.14.1e', family: 'System and Information Integrity', title: 'Automated Patching', desc: 'Automate the process of identifying and managing flaws.', map: '3.14.1' },
      { id: 'SI.L3-3.14.3e', family: 'System and Information Integrity', title: 'Threat Intelligence Integration', desc: 'Use threat indicator information and effective mitigations obtained from external organizations to guide and inform intrusion detection and threat hunting.', map: '3.14.3' },
      { id: 'SI.L3-3.14.6e', family: 'System and Information Integrity', title: 'Automated Threat Detection', desc: 'Employ automated tools and mechanisms to monitor the system and identify unauthorized changes.', map: '3.14.6' },
    ];

    const lines = [];
    lines.push('-- ============================================================================');
    lines.push('-- Migration: migrate-038-cmmc-controls.sql');
    lines.push(`-- CMMC Level 2 (${cmmcL2.length} practices) and Level 3 (${cmmcL2.length + cmmcL3Extra.length} practices)`);
    lines.push(`-- Generated: ${new Date().toISOString()}`);
    lines.push('-- ============================================================================');
    lines.push('');
    lines.push('-- CMMC Level 2 (mapped 1:1 to NIST 800-171)');
    const { lines: l2Inserts } = generateControlInserts('fw_cmmc_l2', cmmcL2, 1);
    lines.push(...l2Inserts);
    lines.push('');
    lines.push('-- Crosswalks: CMMC L2 -> NIST 800-171');
    lines.push(...generateCrosswalks('fw_cmmc_l2', cmmcL2, 'fw_nist_800_171'));
    lines.push('');
    lines.push('-- CMMC Level 3 (L2 + enhanced practices)');
    const allL3 = [...cmmcL2.map(c => ({ ...c, id: c.id.replace('.L2-', '.L3-') })), ...cmmcL3Extra];
    const { lines: l3Inserts } = generateControlInserts('fw_cmmc_l3', allL3, 1);
    lines.push(...l3Inserts);
    lines.push('');
    lines.push('-- Crosswalks: CMMC L3 -> NIST 800-171');
    lines.push(...generateCrosswalks('fw_cmmc_l3', allL3, 'fw_nist_800_171'));
    const outPath = path.join(DB_DIR, 'migrate-038-cmmc-controls.sql');
    fs.writeFileSync(outPath, lines.join('\n'));
    console.log(`CMMC L2: ${cmmcL2.length}, L3: ${allL3.length} -> ${outPath}`);
  }

  // --- HIPAA, SOC 2, StateRAMP (migrate-039) ---
  {
    const staterampIds = generateStateRAMPControls();

    const lines = [];
    lines.push('-- ============================================================================');
    lines.push('-- Migration: migrate-039-hipaa-soc2-stateramp-controls.sql');
    lines.push(`-- HIPAA (${hipaaControls.length}), SOC 2 (${soc2Controls.length}), StateRAMP (${staterampIds.length})`);
    lines.push(`-- Generated: ${new Date().toISOString()}`);
    lines.push('-- ============================================================================');

    // HIPAA
    lines.push('');
    lines.push('-- ============================================================================');
    lines.push(`-- HIPAA Security Rule (${hipaaControls.length} implementation specifications)`);
    lines.push('-- ============================================================================');
    const { lines: hipaaInserts } = generateControlInserts('fw_hipaa', hipaaControls, 1);
    lines.push(...hipaaInserts);
    lines.push('');
    lines.push('-- Crosswalks: HIPAA -> NIST 800-53');
    lines.push(...generateCrosswalks('fw_hipaa', hipaaControls, 'fw_nist_800_53_r5'));

    // SOC 2
    lines.push('');
    lines.push('-- ============================================================================');
    lines.push(`-- SOC 2 Trust Services Criteria (${soc2Controls.length} criteria)`);
    lines.push('-- ============================================================================');
    const { lines: soc2Inserts } = generateControlInserts('fw_soc2', soc2Controls, 1);
    lines.push(...soc2Inserts);
    lines.push('');
    lines.push('-- Crosswalks: SOC 2 -> NIST 800-53');
    lines.push(...generateCrosswalks('fw_soc2', soc2Controls, 'fw_nist_800_53_r5'));

    // StateRAMP (clone from FedRAMP Moderate baseline)
    lines.push('');
    lines.push('-- ============================================================================');
    lines.push(`-- StateRAMP (${staterampIds.length} controls - based on FedRAMP Moderate baseline)`);
    lines.push('-- ============================================================================');
    lines.push('-- StateRAMP controls are cloned from NIST 800-53 using the FedRAMP Moderate baseline.');
    lines.push('-- Each control is inserted under the StateRAMP framework_id.');
    let sort = 1;
    for (const ctrlId of staterampIds) {
      lines.push(
        `INSERT OR REPLACE INTO security_controls (id, framework_id, control_id, family, title, description, priority, sort_order) ` +
        `SELECT lower(hex(randomblob(16))), 'fw_stateramp', control_id, family, title, description, priority, ${sort++} ` +
        `FROM security_controls WHERE framework_id = 'fw_nist_800_53_r5' AND control_id = '${sqlEscape(ctrlId)}';`
      );
    }
    lines.push('');
    lines.push('-- Crosswalks: StateRAMP -> NIST 800-53');
    for (const ctrlId of staterampIds) {
      lines.push(
        `INSERT OR IGNORE INTO control_crosswalks (id, source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence) ` +
        `VALUES (lower(hex(randomblob(16))), 'fw_stateramp', '${sqlEscape(ctrlId)}', 'fw_nist_800_53_r5', '${sqlEscape(ctrlId)}', 'equivalent', 1.0);`
      );
    }

    const outPath = path.join(DB_DIR, 'migrate-039-hipaa-soc2-stateramp-controls.sql');
    fs.writeFileSync(outPath, lines.join('\n'));
    console.log(`HIPAA: ${hipaaControls.length}, SOC 2: ${soc2Controls.length}, StateRAMP: ${staterampIds.length} -> ${outPath}`);
  }

  console.log('\nAll framework migrations generated!');
}

main();
