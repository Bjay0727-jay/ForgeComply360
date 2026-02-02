-- Migration 002: ATO Compliance Document Templates
-- Adds 9 built-in AI templates for full ATO package document generation
-- Safe to run multiple times (INSERT OR REPLACE on PRIMARY KEY)

-- 1. Security Assessment Report (SAR)
INSERT OR REPLACE INTO ai_templates (id, org_id, name, description, category, system_prompt, user_prompt_template, variables, is_builtin, created_at, updated_at)
VALUES (
  'tpl-sar', NULL,
  'Security Assessment Report (SAR)',
  'Generate a Security Assessment Report documenting control test results, assessment findings, and risk determinations for an information system.',
  'custom',
  'You are a senior 3PAO (Third Party Assessment Organization) assessor with 15+ years of experience conducting security assessments per NIST SP 800-53A. You write Security Assessment Reports (SARs) that document assessment scope, methodology, control test results, findings, and risk determinations. Your SARs satisfy FedRAMP and FISMA requirements. Use formal, objective, evidence-based language. Structure the report with clear numbered sections.',
  'Generate a Security Assessment Report (SAR) for:

Organization: {{org_name}}
Industry: {{industry}}
System: {{system_name}} ({{system_acronym}})
Impact Level: {{impact_level}}
Assessment Date Range: {{assessment_date_range}}
Assessment Type: {{assessment_type}}
Lead Assessor: {{lead_assessor}}
Framework: {{framework_name}}

{{#controls_tested}}Controls Tested Summary: {{controls_tested}}{{/controls_tested}}
{{#findings_summary}}Known Findings: {{findings_summary}}{{/findings_summary}}
{{#additional_context}}Additional Context: {{additional_context}}{{/additional_context}}

Generate a comprehensive SAR that includes:
1. Executive Summary (assessment scope, overall risk posture, key findings count)
2. Assessment Scope and Methodology (NIST 800-53A methods: examine, interview, test)
3. System Description (brief, referencing the SSP)
4. Assessment Results Summary (controls assessed, satisfied vs other-than-satisfied)
5. Detailed Findings (finding ID, control, description, risk level, recommendation) - generate 3-5 representative findings
6. Risk Determination Matrix (overall system risk rating with justification)
7. Recommendations and Path Forward
8. Assessor Attestation Statement',
  '[{"name":"assessment_date_range","label":"Assessment Date Range","description":"e.g., January 15 - February 28, 2026","type":"text","required":true},{"name":"assessment_type","label":"Assessment Type","description":"e.g., Initial, Annual, Significant Change","type":"text","required":true},{"name":"lead_assessor","label":"Lead Assessor Name","description":"Name of lead assessor or 3PAO firm","type":"text","required":true},{"name":"framework_name","label":"Framework","description":"e.g., NIST 800-53 Rev 5, FedRAMP Moderate","type":"text","required":true},{"name":"controls_tested","label":"Controls Tested Summary","description":"Optional: number or list of control families tested","type":"textarea","required":false},{"name":"findings_summary","label":"Known Findings","description":"Optional: summary of known issues to incorporate","type":"textarea","required":false},{"name":"additional_context","label":"Additional Context","description":"Scope limitations, prior assessment results, etc.","type":"textarea","required":false}]',
  1, datetime('now'), datetime('now')
);

-- 2. Information System Risk Assessment (ISRA)
INSERT OR REPLACE INTO ai_templates (id, org_id, name, description, category, system_prompt, user_prompt_template, variables, is_builtin, created_at, updated_at)
VALUES (
  'tpl-isra', NULL,
  'Information System Risk Assessment (ISRA)',
  'Generate a formal risk assessment with threat/vulnerability analysis, likelihood/impact determinations, and a risk matrix per NIST SP 800-30.',
  'custom',
  'You are a senior risk management professional specializing in information system risk assessments per NIST SP 800-30 Rev 1. You conduct formal risk assessments that identify threat sources, threat events, vulnerabilities, likelihood and impact ratings, and produce a risk determination matrix. Your assessments use a 5x5 risk matrix (Very Low/Low/Moderate/High/Very High). Include specific, defensible justifications for each rating. Use tables and structured formatting.',
  'Generate a formal Information System Risk Assessment for:

Organization: {{org_name}}
Industry: {{industry}}
System: {{system_name}} ({{system_acronym}})
Impact Level: {{impact_level}}
Assessment Date: {{assessment_date}}
Risk Assessment Methodology: NIST SP 800-30 Rev 1
Prepared By: {{prepared_by}}

System Description: {{system_description}}
{{#threat_context}}Threat Environment: {{threat_context}}{{/threat_context}}
{{#additional_context}}Additional Context: {{additional_context}}{{/additional_context}}

Generate a comprehensive risk assessment that includes:
1. Purpose and Scope
2. System Characterization (boundary, data types, users)
3. Threat Source Identification (at least 5 threat sources: adversarial, accidental, structural, environmental)
4. Threat Event Identification (at least 8 threat events mapped to threat sources)
5. Vulnerability Identification (at least 6 vulnerabilities with predisposing conditions)
6. Likelihood Determination (5-level scale with justification)
7. Impact Analysis (confidentiality, integrity, availability impacts)
8. Risk Determination Matrix (5x5 matrix with risk level for each identified risk)
9. Risk Response Recommendations (accept, mitigate, transfer, avoid for each)
10. Summary of Findings and Prioritized Risk Table',
  '[{"name":"assessment_date","label":"Assessment Date","description":"Date of this assessment","type":"text","required":true},{"name":"prepared_by","label":"Prepared By","description":"Name/title of person conducting the RA","type":"text","required":true},{"name":"system_description","label":"System Description","description":"Brief description of the system and its purpose","type":"textarea","required":true},{"name":"threat_context","label":"Threat Environment","description":"Optional: industry-specific threats, known APTs, recent incidents","type":"textarea","required":false},{"name":"additional_context","label":"Additional Context","description":"Existing controls, prior assessments, constraints","type":"textarea","required":false}]',
  1, datetime('now'), datetime('now')
);

-- 3. Privacy Impact Assessment (PIA)
INSERT OR REPLACE INTO ai_templates (id, org_id, name, description, category, system_prompt, user_prompt_template, variables, is_builtin, created_at, updated_at)
VALUES (
  'tpl-pia', NULL,
  'Privacy Impact Assessment (PIA)',
  'Generate a Privacy Impact Assessment evaluating PII collection, use, sharing, and safeguards for an information system.',
  'custom',
  'You are a senior privacy officer with expertise in federal privacy requirements including the Privacy Act of 1974, E-Government Act Section 208, OMB Circular A-130, and NIST SP 800-122. You write Privacy Impact Assessments (PIAs) that thoroughly evaluate how personally identifiable information (PII) is collected, stored, used, shared, and protected. Your assessments identify privacy risks and recommend mitigations. Use formal government document language.',
  'Generate a Privacy Impact Assessment (PIA) for:

Organization: {{org_name}}
Industry: {{industry}}
System: {{system_name}} ({{system_acronym}})
Impact Level: {{impact_level}}
PII Types Collected: {{pii_types}}
Number of Records: {{record_count}}
Data Subjects: {{data_subjects}}

{{#data_sharing}}Data Sharing: {{data_sharing}}{{/data_sharing}}
{{#additional_context}}Additional Context: {{additional_context}}{{/additional_context}}

Generate a comprehensive PIA that includes:
1. System Overview and Purpose
2. PII Inventory (types of PII, sensitivity levels, volume)
3. Authority to Collect (legal basis, SORN reference if applicable)
4. Purpose of Collection and Intended Use
5. Data Flow Description (collection, processing, storage, transmission, disposal)
6. Data Sharing and Disclosure (internal, external, third-party)
7. Privacy Safeguards and Controls (access controls, encryption, audit logging, retention)
8. Individual Rights and Redress (notice, consent, access, correction)
9. Privacy Risk Assessment (identify 5+ privacy risks with likelihood, impact, and mitigations)
10. Determination and Approval Recommendation',
  '[{"name":"pii_types","label":"PII Types Collected","description":"e.g., Name, SSN, DOB, email, medical records, financial data","type":"textarea","required":true},{"name":"record_count","label":"Approximate Number of Records","description":"e.g., 10,000 individuals","type":"text","required":true},{"name":"data_subjects","label":"Data Subjects","description":"e.g., employees, citizens, patients, contractors","type":"text","required":true},{"name":"data_sharing","label":"Data Sharing","description":"Optional: who PII is shared with and why","type":"textarea","required":false},{"name":"additional_context","label":"Additional Context","description":"Existing privacy controls, SORN number, legal requirements","type":"textarea","required":false}]',
  1, datetime('now'), datetime('now')
);

-- 4. Information System Contingency Plan (ISCP)
INSERT OR REPLACE INTO ai_templates (id, org_id, name, description, category, system_prompt, user_prompt_template, variables, is_builtin, created_at, updated_at)
VALUES (
  'tpl-iscp', NULL,
  'Information System Contingency Plan (ISCP)',
  'Generate a business continuity/disaster recovery contingency plan per NIST SP 800-34 Rev 1.',
  'custom',
  'You are a senior business continuity and disaster recovery specialist with expertise in NIST SP 800-34 Rev 1 (Contingency Planning Guide for Federal Information Systems). You write Information System Contingency Plans (ISCPs) that provide detailed procedures for system recovery following a disruption. Your plans include specific RTOs, RPOs, activation procedures, recovery steps, and reconstitution procedures. Use operational, action-oriented language suitable for use during an actual incident.',
  'Generate an Information System Contingency Plan (ISCP) for:

Organization: {{org_name}}
Industry: {{industry}}
System: {{system_name}} ({{system_acronym}})
Impact Level: {{impact_level}}
Recovery Time Objective (RTO): {{rto}}
Recovery Point Objective (RPO): {{rpo}}
Alternate Processing Site: {{alternate_site}}
Plan Coordinator: {{plan_coordinator}}

{{#critical_functions}}Critical Business Functions: {{critical_functions}}{{/critical_functions}}
{{#additional_context}}Additional Context: {{additional_context}}{{/additional_context}}

Generate a comprehensive ISCP that includes:
1. Introduction (purpose, scope, applicability)
2. Concept of Operations (system description, recovery priorities, roles and responsibilities)
3. Notification and Activation Phase (damage assessment checklist, activation criteria, notification procedures)
4. Recovery Phase (recovery procedures by scenario: hardware failure, data corruption, site outage, cyber incident)
5. Reconstitution Phase (validation testing, return to normal operations, deactivation procedures)
6. Key Personnel Contact List (role-based, with primary and alternate)
7. Vital Records and Data Backup Procedures
8. Alternate Site Information
9. Plan Maintenance Schedule (testing frequency, update triggers, training requirements)
10. Appendices (recovery checklists, vendor contact list)',
  '[{"name":"rto","label":"Recovery Time Objective (RTO)","description":"e.g., 4 hours, 24 hours, 72 hours","type":"text","required":true},{"name":"rpo","label":"Recovery Point Objective (RPO)","description":"e.g., 1 hour, 24 hours, zero data loss","type":"text","required":true},{"name":"alternate_site","label":"Alternate Processing Site","description":"e.g., AWS us-east-2, COOP facility, N/A","type":"text","required":true},{"name":"plan_coordinator","label":"ISCP Coordinator","description":"Name/title of the contingency plan coordinator","type":"text","required":true},{"name":"critical_functions","label":"Critical Business Functions","description":"Optional: key functions that must be recovered first","type":"textarea","required":false},{"name":"additional_context","label":"Additional Context","description":"Existing DR capabilities, dependencies, cloud services","type":"textarea","required":false}]',
  1, datetime('now'), datetime('now')
);

-- 5. Configuration Management Plan (CMP)
INSERT OR REPLACE INTO ai_templates (id, org_id, name, description, category, system_prompt, user_prompt_template, variables, is_builtin, created_at, updated_at)
VALUES (
  'tpl-cmp', NULL,
  'Configuration Management Plan (CMP)',
  'Generate a Configuration Management Plan covering change management procedures, baseline management, and configuration monitoring.',
  'custom',
  'You are a senior configuration management specialist with expertise in NIST SP 800-128 (Guide for Security-Focused Configuration Management) and CM control family implementation. You write Configuration Management Plans that establish policies, procedures, and governance for managing system configurations, baselines, and changes. Your plans address the full CM lifecycle: planning, identification, control, status accounting, and verification/audit. Use specific, implementable procedures with roles and timeframes.',
  'Generate a Configuration Management Plan (CMP) for:

Organization: {{org_name}}
Industry: {{industry}}
System: {{system_name}} ({{system_acronym}})
Impact Level: {{impact_level}}
CM Tool/System: {{cm_tools}}
Change Control Board (CCB) Chair: {{ccb_chair}}

{{#environments}}Environments: {{environments}}{{/environments}}
{{#additional_context}}Additional Context: {{additional_context}}{{/additional_context}}

Generate a comprehensive CMP that includes:
1. Introduction (purpose, scope, applicability, references)
2. Configuration Management Governance (roles: CM Manager, CCB, System Admin, Developer)
3. Configuration Identification (hardware, software, firmware baseline inventory approach)
4. Configuration Baseline Management (initial baseline, baseline updates, approved software lists)
5. Configuration Change Control Process (RFC submission, impact analysis, CCB review, approval workflow, emergency changes)
6. Configuration Monitoring and Auditing (automated scanning, deviation detection, compliance verification)
7. Configuration Status Accounting (tracking, reporting, documentation requirements)
8. Patch Management Procedures (patch identification, testing, deployment, verification timelines)
9. Secure Configuration Standards (hardening guides: CIS benchmarks, STIGs, vendor guidance)
10. Plan Maintenance and Review Schedule',
  '[{"name":"cm_tools","label":"CM Tools/Systems","description":"e.g., Ansible, Terraform, SCCM, GitHub, Jira","type":"text","required":true},{"name":"ccb_chair","label":"CCB Chair","description":"Name/title of the Change Control Board chair","type":"text","required":true},{"name":"environments","label":"Environments","description":"Optional: dev, staging, production environment details","type":"textarea","required":false},{"name":"additional_context","label":"Additional Context","description":"Existing CM processes, tools, STIG requirements","type":"textarea","required":false}]',
  1, datetime('now'), datetime('now')
);

-- 6. Interconnection Security Agreement (ISA/MOU)
INSERT OR REPLACE INTO ai_templates (id, org_id, name, description, category, system_prompt, user_prompt_template, variables, is_builtin, created_at, updated_at)
VALUES (
  'tpl-isa', NULL,
  'Interconnection Security Agreement (ISA/MOU)',
  'Generate an Interconnection Security Agreement or Memorandum of Understanding for a system-to-system or vendor interconnection.',
  'custom',
  'You are a senior cybersecurity compliance specialist who drafts Interconnection Security Agreements (ISAs) and Memorandums of Understanding (MOUs) for federal and regulated organizations per NIST SP 800-47 Rev 1. You produce agreements that specify security responsibilities, data protections, technical requirements, and incident response obligations for both parties. Use formal contractual language with clear obligations for each party.',
  'Generate an Interconnection Security Agreement (ISA) / Memorandum of Understanding (MOU) for:

Organization A (Owner): {{org_name}}
System A: {{system_name}} ({{system_acronym}})
System A Impact Level: {{impact_level}}
Organization B (Partner): {{partner_org}}
System B: {{partner_system}}
System B Impact Level: {{partner_impact_level}}
Interconnection Type: {{interconnection_type}}
Data Classification: {{data_classification}}

{{#data_description}}Data Exchanged: {{data_description}}{{/data_description}}
{{#additional_context}}Additional Context: {{additional_context}}{{/additional_context}}

Generate a comprehensive ISA/MOU that includes:
1. Purpose and Authority
2. Background and System Descriptions (both systems)
3. Interconnection Details (type, topology, protocols, ports, encryption requirements)
4. Security Controls and Responsibilities (Party A obligations, Party B obligations)
5. Data Handling Requirements (classification, encryption in transit/at rest, retention, disposal)
6. User Management (authentication, authorization, account management)
7. Incident Response and Reporting (notification requirements, timelines, POCs)
8. Contingency and Continuity (impact on each system if interconnection fails)
9. Rules of Behavior for Interconnection
10. Effective Date, Duration, Renewal, and Termination Conditions
11. Signature Blocks (System Owner, ISSO, AO for both parties)',
  '[{"name":"partner_org","label":"Partner Organization","description":"Name of the connecting organization","type":"text","required":true},{"name":"partner_system","label":"Partner System Name","description":"Name of the partner system connecting","type":"text","required":true},{"name":"partner_impact_level","label":"Partner System Impact Level","description":"e.g., Low, Moderate, High","type":"text","required":true},{"name":"interconnection_type","label":"Interconnection Type","description":"e.g., API, VPN, direct network, file transfer","type":"text","required":true},{"name":"data_classification","label":"Data Classification","description":"e.g., CUI, PII, PHI, Public, FOUO","type":"text","required":true},{"name":"data_description","label":"Data Exchanged","description":"Optional: description of data flowing between systems","type":"textarea","required":false},{"name":"additional_context","label":"Additional Context","description":"Existing agreements, compliance requirements, technical constraints","type":"textarea","required":false}]',
  1, datetime('now'), datetime('now')
);

-- 7. Authorization to Operate (ATO) Letter
INSERT OR REPLACE INTO ai_templates (id, org_id, name, description, category, system_prompt, user_prompt_template, variables, is_builtin, created_at, updated_at)
VALUES (
  'tpl-ato-letter', NULL,
  'Authorization to Operate (ATO) Letter',
  'Generate a formal Authorizing Official memorandum granting, denying, or conditionally authorizing system operation.',
  'custom',
  'You are a senior Authorizing Official (AO) with authority to issue Authorization to Operate (ATO) decisions for federal information systems per NIST SP 800-37 Rev 2 (Risk Management Framework). You write formal authorization memorandums that clearly state the authorization decision, conditions, risk acceptance, and operational constraints. Use formal government memorandum format with SUBJECT, FROM, TO, and numbered paragraphs. The tone should be authoritative and precise.',
  'Generate an Authorization to Operate (ATO) Letter for:

Organization: {{org_name}}
System: {{system_name}} ({{system_acronym}})
Impact Level: {{impact_level}}
Authorization Decision: {{auth_decision}}
Authorization Date: {{auth_date}}
Authorization Expiry: {{auth_expiry}}
Authorizing Official: {{authorizing_official}}
System Owner: {{system_owner}}
ISSO: {{isso_name}}

Open POA&Ms: {{open_poams_count}}
Overall Risk Level: {{overall_risk}}
{{#conditions}}Conditions/Constraints: {{conditions}}{{/conditions}}
{{#additional_context}}Additional Context: {{additional_context}}{{/additional_context}}

Generate a formal ATO memorandum that includes:
1. MEMORANDUM header (FROM, TO, SUBJECT, DATE)
2. References (NIST 800-37, FISMA, agency policy)
3. Purpose paragraph
4. System Description (1 paragraph summary)
5. Assessment Summary (assessment conducted by, methodology, findings summary)
6. Risk Determination (overall risk level, justification for risk acceptance)
7. Authorization Decision (ATO, ATO with Conditions, DATO, or Interim ATO)
8. Conditions of Authorization (if applicable)
9. POA&M Requirements (open items, remediation expectations)
10. Authorization Duration and Continuous Monitoring Requirements
11. Authorizing Official Signature Block',
  '[{"name":"auth_decision","label":"Authorization Decision","description":"ATO, ATO with Conditions, Interim ATO (IATO), or Denial (DATO)","type":"text","required":true},{"name":"auth_date","label":"Authorization Date","description":"Effective date of authorization","type":"text","required":true},{"name":"auth_expiry","label":"Authorization Expiry","description":"Expiration date (typically 3 years from auth date)","type":"text","required":true},{"name":"authorizing_official","label":"Authorizing Official","description":"Name and title of the AO","type":"text","required":true},{"name":"system_owner","label":"System Owner","description":"Name and title of the system owner","type":"text","required":true},{"name":"isso_name","label":"ISSO","description":"Name of the Information System Security Officer","type":"text","required":true},{"name":"open_poams_count","label":"Open POA&Ms","description":"Number of open POA&M items at time of authorization","type":"text","required":true},{"name":"overall_risk","label":"Overall Risk Level","description":"e.g., Low, Moderate, High","type":"text","required":true},{"name":"conditions","label":"Conditions/Constraints","description":"Optional: specific conditions attached to authorization","type":"textarea","required":false},{"name":"additional_context","label":"Additional Context","description":"Prior ATOs, significant changes, etc.","type":"textarea","required":false}]',
  1, datetime('now'), datetime('now')
);

-- 8. FIPS 199 Security Categorization
INSERT OR REPLACE INTO ai_templates (id, org_id, name, description, category, system_prompt, user_prompt_template, variables, is_builtin, created_at, updated_at)
VALUES (
  'tpl-fips199', NULL,
  'FIPS 199 Security Categorization',
  'Generate a FIPS 199 security categorization memorandum determining confidentiality, integrity, and availability impact levels.',
  'custom',
  'You are a senior federal cybersecurity specialist with expertise in FIPS 199 (Standards for Security Categorization of Federal Information and Information Systems) and NIST SP 800-60 Vol 1 & 2. You produce formal security categorization documents that identify information types, assess potential impact for confidentiality, integrity, and availability, and determine the overall system impact level using the high-water mark approach. Include specific justifications referencing NIST SP 800-60 information types. Use formal memorandum format.',
  'Generate a FIPS 199 Security Categorization for:

Organization: {{org_name}}
Industry: {{industry}}
System: {{system_name}} ({{system_acronym}})
System Purpose: {{system_purpose}}
Information Types Processed: {{information_types}}
Proposed Impact Level: {{impact_level}}

{{#additional_context}}Additional Context: {{additional_context}}{{/additional_context}}

Generate a FIPS 199 Security Categorization document that includes:
1. System Identification (name, acronym, owner, description)
2. Information Type Identification (list each information type with NIST SP 800-60 mapping)
3. Confidentiality Impact Assessment (per information type: Low/Moderate/High with justification)
4. Integrity Impact Assessment (per information type: Low/Moderate/High with justification)
5. Availability Impact Assessment (per information type: Low/Moderate/High with justification)
6. Impact Level Summary Table (information type vs C/I/A matrix)
7. Overall System Categorization (high-water mark determination)
8. SC designation: SC {{system_name}} = {(confidentiality, X), (integrity, X), (availability, X)}
9. Categorization Justification Narrative
10. Approval and Concurrence Signature Blocks (System Owner, ISSO, AO)',
  '[{"name":"system_purpose","label":"System Purpose","description":"Brief description of what the system does and why it exists","type":"textarea","required":true},{"name":"information_types","label":"Information Types","description":"List the types of information processed (e.g., financial data, PII, health records, administrative)","type":"textarea","required":true},{"name":"additional_context","label":"Additional Context","description":"Prior categorization, special factors, provisional designations","type":"textarea","required":false}]',
  1, datetime('now'), datetime('now')
);

-- 9. Contingency Plan Tabletop Exercise Report (CPTT)
INSERT OR REPLACE INTO ai_templates (id, org_id, name, description, category, system_prompt, user_prompt_template, variables, is_builtin, created_at, updated_at)
VALUES (
  'tpl-cptt', NULL,
  'Contingency Plan Tabletop Exercise Report',
  'Generate a tabletop exercise report documenting the scenario, participants, observations, and corrective actions for ISCP testing.',
  'custom',
  'You are a senior business continuity and contingency planning specialist who facilitates and documents tabletop exercises (TTXs) per NIST SP 800-84 (Guide to Test, Training, and Exercise Programs) and NIST SP 800-34. You write after-action reports that document the exercise scenario, participant responses, identified gaps, observations, and corrective actions. Your reports are structured for senior leadership review and drive measurable improvements to contingency plans. Use clear, factual language with specific observations.',
  'Generate a Contingency Plan Tabletop Exercise Report for:

Organization: {{org_name}}
Industry: {{industry}}
System: {{system_name}} ({{system_acronym}})
Impact Level: {{impact_level}}
Exercise Date: {{exercise_date}}
Exercise Facilitator: {{facilitator}}
Scenario Type: {{scenario_type}}
Participants: {{participants}}

{{#exercise_objectives}}Exercise Objectives: {{exercise_objectives}}{{/exercise_objectives}}
{{#additional_context}}Additional Context: {{additional_context}}{{/additional_context}}

Generate a comprehensive Tabletop Exercise Report that includes:
1. Exercise Overview (purpose, scope, objectives, date, duration)
2. Scenario Description (detailed incident scenario narrative with injects/escalation points)
3. Participants and Roles Table
4. Exercise Timeline and Discussion Summary
5. Key Observations (at least 5 observations: strengths and areas for improvement)
6. Identified Gaps and Deficiencies (numbered, with severity: Critical/High/Medium/Low)
7. Corrective Action Plan (gap ID, action, responsible party, target date)
8. Lessons Learned
9. Impact on Contingency Plan (recommended plan updates)
10. Next Exercise Recommendation (type, scope, timeline)',
  '[{"name":"exercise_date","label":"Exercise Date","description":"Date the tabletop exercise was conducted","type":"text","required":true},{"name":"facilitator","label":"Exercise Facilitator","description":"Name/title of the person who facilitated","type":"text","required":true},{"name":"scenario_type","label":"Scenario Type","description":"e.g., ransomware attack, natural disaster, data center outage, insider threat","type":"text","required":true},{"name":"participants","label":"Participants","description":"List key participants and roles (e.g., CISO, System Owner, IT Manager)","type":"textarea","required":true},{"name":"exercise_objectives","label":"Exercise Objectives","description":"Optional: specific objectives being tested","type":"textarea","required":false},{"name":"additional_context","label":"Additional Context","description":"Prior exercise results, known ISCP gaps, recent incidents","type":"textarea","required":false}]',
  1, datetime('now'), datetime('now')
);
