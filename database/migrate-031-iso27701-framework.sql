-- ============================================================================
-- MIGRATION 031: ISO/IEC 27701:2019 Privacy Information Management System
-- ============================================================================
-- Adds the ISO 27701 PIMS framework extending ISO 27001/27002 for privacy.
-- 49 controls across 7 families, crosswalk mappings to NIST 800-53 R5.
-- Fully idempotent — safe to re-run on every deploy (INSERT OR REPLACE).
-- ============================================================================

-- Framework definition
INSERT OR REPLACE INTO compliance_frameworks (id, name, version, category, description, control_count, governing_body, assessment_methodology)
VALUES ('iso-27701', 'ISO/IEC 27701:2019', '2019', 'privacy',
  'Privacy Information Management System (PIMS) — extension of ISO 27001 and ISO 27002 for privacy management. Provides a framework for PII controllers and PII processors to manage privacy risks and demonstrate compliance with privacy regulations including GDPR, CCPA, and other data protection laws.',
  49, 'ISO/IEC', 'PIMS Certification Audit');

-- ============================================================================
-- PRIVACY GOVERNANCE (PIMS-GOV) — 8 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27701', 'PIMS-GOV-01', 'Privacy Governance', 'PII Processing Context',
 'Determine the organization''s role as a PII controller, PII processor, or joint controller for each processing activity. Document the context in which the organization operates, including applicable privacy legislation, regulatory requirements, contractual obligations, and the nature and sensitivity of PII processed. Maintain a register of processing activities aligned with GDPR Article 30 or equivalent requirements. Reference: ISO 27701 Clause 5.2.1.',
 'P1', 1, 1, 1, 1),
('iso-27701', 'PIMS-GOV-02', 'Privacy Governance', 'Privacy Policy and Objectives',
 'Establish, document, and communicate a privacy policy that integrates with the organization''s information security policy. The privacy policy must address lawfulness of processing, data minimization, purpose limitation, accuracy, storage limitation, and accountability. Define measurable privacy objectives and plans to achieve them. Review and update the policy at planned intervals. Reference: ISO 27701 Clause 5.2.2, 5.2.3.',
 'P1', 1, 1, 1, 2),
('iso-27701', 'PIMS-GOV-03', 'Privacy Governance', 'Privacy Roles and Responsibilities',
 'Define and assign roles, responsibilities, and authorities for privacy management, including designation of a Data Protection Officer (DPO) or equivalent where required by applicable law. Ensure the DPO has direct reporting access to top management, operates independently, and is provided with adequate resources. Document the privacy organizational structure. Reference: ISO 27701 Clause 5.3.1, 6.3.',
 'P1', 1, 1, 1, 3),
('iso-27701', 'PIMS-GOV-04', 'Privacy Governance', 'Privacy Risk Assessment',
 'Conduct privacy-specific risk assessments that identify risks to PII principals arising from the processing of personal data. Assess likelihood and severity of harm to individuals, including physical, material, and non-material damage. Incorporate Data Protection Impact Assessments (DPIAs) for high-risk processing. Maintain a privacy risk register integrated with the information security risk register. Reference: ISO 27701 Clause 5.4.1.2.',
 'P1', 1, 1, 1, 4),
('iso-27701', 'PIMS-GOV-05', 'Privacy Governance', 'Privacy Awareness and Training',
 'Ensure all personnel who process PII are aware of their privacy obligations and receive appropriate training. Training must cover applicable privacy laws, organizational privacy policies, data subject rights, breach notification procedures, and consequences of non-compliance. Maintain training records and conduct periodic refresher training. Reference: ISO 27701 Clause 5.5.2, 6.4.',
 'P1', 1, 1, 1, 5),
('iso-27701', 'PIMS-GOV-06', 'Privacy Governance', 'Privacy Performance Evaluation',
 'Monitor, measure, analyze, and evaluate the privacy management system''s performance and effectiveness. Define privacy metrics and key performance indicators (KPIs) including data subject request response times, breach statistics, DPIA completion rates, and training coverage. Conduct internal audits of the PIMS at planned intervals. Reference: ISO 27701 Clause 5.6.1, 5.6.2.',
 'P2', 1, 1, 1, 6),
('iso-27701', 'PIMS-GOV-07', 'Privacy Governance', 'Management Review of PIMS',
 'Top management must review the privacy information management system at planned intervals to ensure its continuing suitability, adequacy, and effectiveness. Reviews must consider privacy risk assessment results, audit findings, data subject complaints, regulatory changes, and opportunities for improvement. Document review outcomes and required actions. Reference: ISO 27701 Clause 5.6.3.',
 'P2', 1, 1, 1, 7),
('iso-27701', 'PIMS-GOV-08', 'Privacy Governance', 'Privacy Improvement and Corrective Action',
 'Identify nonconformities in the PIMS and take corrective actions to address root causes. Continually improve the suitability, adequacy, and effectiveness of the privacy management system. Implement lessons learned from privacy incidents, audit findings, and regulatory feedback. Reference: ISO 27701 Clause 5.7.',
 'P2', 1, 1, 1, 8);

-- ============================================================================
-- LAWFUL PROCESSING (PIMS-PROC) — 7 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27701', 'PIMS-PROC-01', 'Lawful Processing', 'Legal Basis Identification',
 'Identify, document, and maintain the legal basis for each PII processing activity. Lawful bases may include consent, contractual necessity, legal obligation, vital interests, public interest, or legitimate interests. Ensure the legal basis is determined before processing commences and is communicated to PII principals. Reference: ISO 27701 Annex A.7.2.1, GDPR Article 6.',
 'P1', 1, 1, 1, 9),
('iso-27701', 'PIMS-PROC-02', 'Lawful Processing', 'Consent Management',
 'Implement mechanisms to obtain, record, and manage consent from PII principals where consent is the legal basis for processing. Consent must be freely given, specific, informed, and unambiguous. Provide mechanisms for PII principals to withdraw consent at any time with the same ease as giving consent. Maintain auditable consent records. Reference: ISO 27701 Annex A.7.2.3, A.7.2.4.',
 'P1', 1, 1, 1, 10),
('iso-27701', 'PIMS-PROC-03', 'Lawful Processing', 'Purpose Limitation',
 'Define and document specific, explicit, and legitimate purposes for each PII processing activity. Ensure PII is not further processed in a manner incompatible with the original purposes without additional legal basis or consent. Implement technical and organizational measures to enforce purpose limitation. Reference: ISO 27701 Annex A.7.2.1.',
 'P1', 1, 1, 1, 11),
('iso-27701', 'PIMS-PROC-04', 'Lawful Processing', 'Data Minimization',
 'Limit the collection and processing of PII to what is adequate, relevant, and necessary for the specified purposes. Conduct periodic reviews to identify and eliminate unnecessary data collection. Implement technical controls such as data masking, pseudonymization, and aggregation to minimize PII exposure. Reference: ISO 27701 Annex A.7.4.1.',
 'P1', 1, 1, 1, 12),
('iso-27701', 'PIMS-PROC-05', 'Lawful Processing', 'Processing Records',
 'Maintain a record of all PII processing activities under the organization''s responsibility. Records must include: categories of PII processed, purposes, categories of PII principals and recipients, data transfers, retention periods, and description of security measures. Make records available to supervisory authorities upon request. Reference: ISO 27701 Annex A.7.2.8, GDPR Article 30.',
 'P1', 1, 1, 1, 13),
('iso-27701', 'PIMS-PROC-06', 'Lawful Processing', 'Special Categories of PII',
 'Identify processing of special categories of PII (biometric, health, racial/ethnic origin, political opinions, religious beliefs, trade union membership, genetic data, sex life/orientation). Apply enhanced protections including explicit consent, additional access restrictions, encryption, and DPIAs. Document the necessity and proportionality of processing special category data. Reference: ISO 27701 Annex A.7.2.1, GDPR Article 9.',
 'P1', 1, 1, 1, 14),
('iso-27701', 'PIMS-PROC-07', 'Lawful Processing', 'Automated Decision-Making',
 'Identify processing activities involving automated individual decision-making, including profiling, that produces legal or similarly significant effects. Implement safeguards including the right to obtain human intervention, express views, and contest decisions. Conduct DPIAs for automated decision-making systems. Document the logic involved, significance, and envisaged consequences. Reference: ISO 27701 Annex A.7.2.1, GDPR Article 22.',
 'P1', 1, 1, 1, 15);

-- ============================================================================
-- DATA SUBJECT RIGHTS (PIMS-DSR) — 10 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27701', 'PIMS-DSR-01', 'Data Subject Rights', 'Privacy Notice and Transparency',
 'Provide clear, concise, and accessible privacy notices to PII principals at the time of data collection or before processing begins. Notices must include: identity of the controller, purposes, legal basis, data categories, recipients, retention periods, rights, automated decision-making, and cross-border transfers. Use plain language and layered notices where appropriate. Reference: ISO 27701 Annex A.7.3.2, GDPR Articles 13-14.',
 'P1', 1, 1, 1, 16),
('iso-27701', 'PIMS-DSR-02', 'Data Subject Rights', 'Right of Access',
 'Implement processes and technical mechanisms to enable PII principals to access their personal data upon request. Provide the data in a commonly used, machine-readable format. Confirm whether PII is being processed, the purposes, categories of data, recipients, retention periods, and source of data (if not collected directly). Respond within legally mandated timeframes (e.g., 30 days under GDPR). Reference: ISO 27701 Annex A.7.3.6, GDPR Article 15.',
 'P1', 1, 1, 1, 17),
('iso-27701', 'PIMS-DSR-03', 'Data Subject Rights', 'Right to Rectification',
 'Implement mechanisms to allow PII principals to request correction of inaccurate personal data and completion of incomplete data. Verify the accuracy of corrections before applying them. Notify third parties to whom the data was disclosed about rectifications. Respond to rectification requests within legally mandated timeframes. Reference: ISO 27701 Annex A.7.3.6, GDPR Article 16.',
 'P1', 1, 1, 1, 18),
('iso-27701', 'PIMS-DSR-04', 'Data Subject Rights', 'Right to Erasure',
 'Implement processes to erase PII when requested by PII principals, when the legal basis for processing no longer exists, or when retention periods expire. Ensure erasure covers all copies, backups, and downstream systems (with documented exceptions for legal retention requirements). Implement automated deletion capabilities where feasible. Reference: ISO 27701 Annex A.7.3.6, GDPR Article 17.',
 'P1', 1, 1, 1, 19),
('iso-27701', 'PIMS-DSR-05', 'Data Subject Rights', 'Right to Restriction of Processing',
 'Implement mechanisms to restrict processing of PII upon request (e.g., when accuracy is contested, processing is unlawful but erasure is opposed, or data is needed for legal claims). Mark restricted data to prevent further processing except for storage. Inform the PII principal before lifting any restriction. Reference: ISO 27701 Annex A.7.3.6, GDPR Article 18.',
 'P2', 1, 1, 1, 20),
('iso-27701', 'PIMS-DSR-06', 'Data Subject Rights', 'Right to Data Portability',
 'Enable PII principals to receive their personal data in a structured, commonly used, and machine-readable format (e.g., JSON, CSV, XML). Implement technical capabilities to transmit data directly to another controller where technically feasible and requested. Portability applies to data provided by the principal and processed by automated means. Reference: ISO 27701 Annex A.7.3.6, GDPR Article 20.',
 'P2', 1, 1, 1, 21),
('iso-27701', 'PIMS-DSR-07', 'Data Subject Rights', 'Right to Object',
 'Implement processes to handle objections to processing based on legitimate interests or public interest, including direct marketing. Cease processing upon receipt of objection unless compelling legitimate grounds are demonstrated. Inform PII principals of their right to object at the point of first communication. Reference: ISO 27701 Annex A.7.3.6, GDPR Article 21.',
 'P2', 1, 1, 1, 22),
('iso-27701', 'PIMS-DSR-08', 'Data Subject Rights', 'Data Subject Request Management',
 'Establish a centralized process for receiving, authenticating, tracking, and responding to all data subject rights requests. Implement identity verification procedures to prevent unauthorized disclosure. Track response times to ensure compliance with legal deadlines. Maintain a log of all requests, actions taken, and outcomes. Escalate complex requests to the DPO. Reference: ISO 27701 Annex A.7.3.5.',
 'P1', 1, 1, 1, 23),
('iso-27701', 'PIMS-DSR-09', 'Data Subject Rights', 'Children''s Data Protections',
 'Implement age verification mechanisms and obtain verifiable parental/guardian consent before processing PII of children (under 16 in EU, under 13 in US, or as defined by applicable law). Apply enhanced protections including stricter purpose limitation, minimal data collection, and prohibition of profiling for marketing. Provide child-friendly privacy notices. Reference: ISO 27701 Annex A.7.2.1, GDPR Article 8.',
 'P1', 1, 1, 1, 24),
('iso-27701', 'PIMS-DSR-10', 'Data Subject Rights', 'Complaint Handling',
 'Establish and publicize a process for PII principals to lodge complaints regarding the processing of their personal data. Investigate complaints promptly, document findings, and communicate outcomes. Track complaint trends for PIMS improvement. Inform complainants of their right to lodge complaints with a supervisory authority. Reference: ISO 27701 Annex A.7.3.7.',
 'P2', 1, 1, 1, 25);

-- ============================================================================
-- PRIVACY BY DESIGN (PIMS-PBD) — 6 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27701', 'PIMS-PBD-01', 'Privacy by Design', 'Privacy by Design Principles',
 'Integrate privacy considerations into the design and development of products, services, systems, and business processes from the earliest stages. Apply the seven foundational principles of Privacy by Design: proactive not reactive, privacy as default, privacy embedded into design, full functionality, end-to-end security, visibility and transparency, and respect for user privacy. Reference: ISO 27701 Annex A.7.4.1.',
 'P1', 1, 1, 1, 26),
('iso-27701', 'PIMS-PBD-02', 'Privacy by Design', 'Privacy by Default',
 'Configure systems and processing activities so that, by default, only PII necessary for the specific purpose is processed. Default settings must be the most privacy-protective option. Ensure PII is not made accessible to an indefinite number of persons by default. Limit collection, processing extent, storage period, and accessibility. Reference: ISO 27701 Annex A.7.4.1, GDPR Article 25(2).',
 'P1', 1, 1, 1, 27),
('iso-27701', 'PIMS-PBD-03', 'Privacy by Design', 'Data Protection Impact Assessment',
 'Conduct DPIAs for processing activities that are likely to result in high risk to PII principals, including: systematic monitoring of public areas, large-scale processing of special categories, automated decision-making with legal effects, and new technologies. Assess necessity, proportionality, risks, and mitigating measures. Consult the DPO and, where required, the supervisory authority. Reference: ISO 27701 Clause 5.4.1.2, GDPR Article 35.',
 'P1', 1, 1, 1, 28),
('iso-27701', 'PIMS-PBD-04', 'Privacy by Design', 'Pseudonymization and Anonymization',
 'Implement pseudonymization techniques (tokenization, encryption, hashing) to reduce PII linkability while maintaining data utility. Where feasible, apply anonymization to render data non-identifiable. Assess re-identification risks for anonymized datasets. Maintain separation between pseudonymous identifiers and the linking information. Reference: ISO 27701 Annex A.7.4.5, GDPR Recital 26.',
 'P1', 1, 1, 1, 29),
('iso-27701', 'PIMS-PBD-05', 'Privacy by Design', 'Retention and Disposal',
 'Define and document retention periods for each category of PII based on legal requirements, contractual obligations, and business necessity. Implement automated mechanisms to identify and dispose of PII that has exceeded its retention period. Ensure secure deletion or anonymization using approved methods. Maintain disposal records. Reference: ISO 27701 Annex A.7.4.2, A.7.4.7.',
 'P1', 1, 1, 1, 30),
('iso-27701', 'PIMS-PBD-06', 'Privacy by Design', 'Privacy Engineering Controls',
 'Implement technical privacy-enhancing technologies (PETs) including: differential privacy for analytics, homomorphic encryption for computation on encrypted data, secure multi-party computation, federated learning, and k-anonymity for published datasets. Select PETs based on processing context, risk level, and data utility requirements. Reference: ISO 27701 Annex A.7.4.1.',
 'P2', 0, 1, 1, 31);

-- ============================================================================
-- DATA TRANSFERS (PIMS-XFR) — 6 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27701', 'PIMS-XFR-01', 'Data Transfers', 'Cross-Border Transfer Safeguards',
 'Identify all cross-border transfers of PII and implement appropriate safeguards. Permitted transfer mechanisms include adequacy decisions, Standard Contractual Clauses (SCCs), Binding Corporate Rules (BCRs), codes of conduct, and certification mechanisms. Conduct Transfer Impact Assessments (TIAs) to evaluate the legal framework in the destination country. Document all transfer mechanisms and their justification. Reference: ISO 27701 Annex A.7.5.1, GDPR Chapter V.',
 'P1', 1, 1, 1, 32),
('iso-27701', 'PIMS-XFR-02', 'Data Transfers', 'Third-Party PII Disclosure',
 'Control the disclosure of PII to third parties. Ensure valid legal basis exists before disclosing PII. Record all disclosures including the recipient, purpose, data categories, and legal justification. Implement contractual controls requiring third-party recipients to maintain equivalent privacy protections. Notify PII principals of disclosures where required. Reference: ISO 27701 Annex A.7.5.3, A.7.5.4.',
 'P1', 1, 1, 1, 33),
('iso-27701', 'PIMS-XFR-03', 'Data Transfers', 'Processor Agreements',
 'Establish binding written agreements with all PII processors that define the subject matter, duration, nature and purpose of processing, types of PII, categories of PII principals, and obligations. Agreements must require processors to act only on documented instructions, ensure confidentiality, implement appropriate security measures, assist with data subject requests, and delete/return PII on termination. Reference: ISO 27701 Annex B.8.2.1, GDPR Article 28.',
 'P1', 1, 1, 1, 34),
('iso-27701', 'PIMS-XFR-04', 'Data Transfers', 'Sub-Processor Management',
 'Require PII processors to obtain written authorization before engaging sub-processors. Maintain an up-to-date list of sub-processors. Ensure sub-processors are bound by equivalent data protection obligations through back-to-back contracts. Provide PII controllers with the opportunity to object to new sub-processors. Monitor sub-processor compliance. Reference: ISO 27701 Annex B.8.5.1, GDPR Article 28(2).',
 'P1', 1, 1, 1, 35),
('iso-27701', 'PIMS-XFR-05', 'Data Transfers', 'Government Access Requests',
 'Establish procedures for handling government or law enforcement requests for access to PII. Assess the legal validity and proportionality of each request. Notify PII principals and/or PII controllers of government access requests where legally permitted. Maintain a transparency report documenting the number and nature of government access requests received and complied with. Reference: ISO 27701 Annex A.7.5.2.',
 'P2', 1, 1, 1, 36),
('iso-27701', 'PIMS-XFR-06', 'Data Transfers', 'Data Sharing Agreements',
 'Establish formal data sharing agreements for all routine exchanges of PII between organizations. Agreements must specify: categories of PII, purposes, data quality standards, security requirements, incident notification obligations, retention and disposal, and dispute resolution. Conduct privacy risk assessments before entering new data sharing arrangements. Reference: ISO 27701 Annex A.7.5.3.',
 'P2', 1, 1, 1, 37);

-- ============================================================================
-- PRIVACY SECURITY CONTROLS (PIMS-SEC) — 8 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27701', 'PIMS-SEC-01', 'Privacy Security Controls', 'PII Access Control',
 'Implement role-based access controls specific to PII processing. Apply the principle of least privilege, ensuring personnel access only the PII categories necessary for their assigned processing activities. Implement segregation of duties between PII processing functions. Maintain access logs for PII stores and review access rights at least quarterly. Reference: ISO 27701 Clause 6.6 (extending ISO 27002 A.9).',
 'P1', 1, 1, 1, 38),
('iso-27701', 'PIMS-SEC-02', 'Privacy Security Controls', 'PII Encryption',
 'Encrypt PII at rest and in transit using industry-standard cryptographic algorithms (AES-256 for symmetric, RSA-2048/ECDSA-P256 minimum for asymmetric, TLS 1.2+ for transit). Apply field-level encryption for sensitive PII categories (health, financial, biometric). Implement key management procedures with separation between encryption keys and encrypted data. Reference: ISO 27701 Clause 6.7 (extending ISO 27002 A.10).',
 'P1', 1, 1, 1, 39),
('iso-27701', 'PIMS-SEC-03', 'Privacy Security Controls', 'PII Processing Logging',
 'Log all significant PII processing activities including access, modification, disclosure, and deletion. Logs must capture: who accessed PII, when, what PII categories, and the purpose. Protect log integrity through tamper-evident storage. Retain processing logs for a period sufficient to support investigations and audits while complying with data minimization. Reference: ISO 27701 Clause 6.9 (extending ISO 27002 A.12).',
 'P1', 1, 1, 1, 40),
('iso-27701', 'PIMS-SEC-04', 'Privacy Security Controls', 'PII in Development and Testing',
 'Prohibit the use of production PII in development, testing, and staging environments. Where PII is needed for realistic testing, use anonymized, pseudonymized, or synthetic data. Implement controls to prevent accidental exposure of PII through code repositories, logs, error messages, and debug outputs. Reference: ISO 27701 Clause 6.11 (extending ISO 27002 A.14).',
 'P1', 1, 1, 1, 41),
('iso-27701', 'PIMS-SEC-05', 'Privacy Security Controls', 'PII Backup and Recovery',
 'Include PII in backup and recovery planning with appropriate protections. Encrypt PII backups. Apply the same retention and disposal policies to backup copies as to production data. Ensure PII erasure requests can be propagated to backups within a reasonable timeframe or document the exception with a defined schedule for backup rotation. Reference: ISO 27701 Clause 6.9.3.',
 'P2', 1, 1, 1, 42),
('iso-27701', 'PIMS-SEC-06', 'Privacy Security Controls', 'PII in Cloud Environments',
 'Assess cloud service providers'' privacy capabilities before deploying PII processing. Ensure cloud providers offer adequate data residency controls, encryption, access management, and contractual privacy commitments. Implement controls to maintain data sovereignty requirements. Monitor cloud provider compliance with privacy obligations. Reference: ISO 27701 Clause 6.13 (extending ISO 27002 A.15).',
 'P1', 1, 1, 1, 43),
('iso-27701', 'PIMS-SEC-07', 'Privacy Security Controls', 'Secure PII Disposal',
 'Implement procedures for secure disposal of PII on all media types (electronic, paper, removable). Use cryptographic erasure, degaussing, physical destruction, or overwriting methods appropriate to the media type and data sensitivity. Obtain certificates of destruction from third-party disposal services. Verify disposal effectiveness through sampling or audit. Reference: ISO 27701 Clause 6.8 (extending ISO 27002 A.11).',
 'P1', 1, 1, 1, 44),
('iso-27701', 'PIMS-SEC-08', 'Privacy Security Controls', 'Privacy Incident Detection',
 'Implement technical and organizational measures to detect privacy-specific incidents including unauthorized PII access, data leakage, excessive PII collection, and purpose limitation violations. Deploy Data Loss Prevention (DLP) tools to monitor PII flows. Configure alerts for anomalous PII access patterns. Integrate privacy incident detection with the broader security monitoring capability. Reference: ISO 27701 Clause 6.12 (extending ISO 27002 A.16).',
 'P1', 1, 1, 1, 45);

-- ============================================================================
-- BREACH MANAGEMENT (PIMS-BRM) — 4 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('iso-27701', 'PIMS-BRM-01', 'Breach Management', 'Privacy Breach Response Plan',
 'Develop and maintain a privacy breach response plan that supplements the information security incident response plan. Define privacy-specific procedures for breach containment, assessment of risk to PII principals, evidence preservation, and escalation to the DPO. Classify breaches by severity based on PII sensitivity, volume of affected individuals, and likelihood of harm. Test the plan through tabletop exercises at least annually. Reference: ISO 27701 Clause 6.12.1.',
 'P1', 1, 1, 1, 46),
('iso-27701', 'PIMS-BRM-02', 'Breach Management', 'Supervisory Authority Notification',
 'Notify the relevant supervisory authority of a personal data breach within the legally mandated timeframe (72 hours under GDPR). Notifications must include: nature of the breach, categories and approximate number of PII principals affected, DPO contact details, likely consequences, and measures taken to address the breach. Maintain notification templates and pre-approved communication channels. Reference: ISO 27701 Annex A.7.3.8, GDPR Article 33.',
 'P1', 1, 1, 1, 47),
('iso-27701', 'PIMS-BRM-03', 'Breach Management', 'PII Principal Notification',
 'Notify affected PII principals without undue delay when a breach is likely to result in a high risk to their rights and freedoms. Notifications must use clear and plain language and include: nature of the breach, DPO contact details, likely consequences, and recommended protective measures. Provide notifications through direct communication (email, letter) rather than generic public announcements. Reference: ISO 27701 Annex A.7.3.8, GDPR Article 34.',
 'P1', 1, 1, 1, 48),
('iso-27701', 'PIMS-BRM-04', 'Breach Management', 'Post-Breach Review and Improvement',
 'Conduct a thorough post-breach review to identify root causes, assess the effectiveness of the response, and implement corrective actions. Document lessons learned and update the privacy breach response plan, risk assessments, and security controls accordingly. Report breach statistics and trends to management review. Maintain a breach register with details of all breaches including those not requiring notification. Reference: ISO 27701 Clause 5.7, 6.12.2.',
 'P2', 1, 1, 1, 49);

-- ============================================================================
-- CROSSWALK MAPPINGS — ISO 27701 to NIST 800-53 R5
-- ============================================================================

INSERT OR REPLACE INTO control_crosswalks (source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence, notes) VALUES
('iso-27701', 'PIMS-GOV-01', 'nist-800-53-r5', 'PM-1', 'partial', 0.80, 'PII processing context maps to NIST Program Management policy'),
('iso-27701', 'PIMS-GOV-02', 'nist-800-53-r5', 'PM-1', 'partial', 0.80, 'Privacy policy maps to NIST Information Security and Privacy Program Plan'),
('iso-27701', 'PIMS-GOV-03', 'nist-800-53-r5', 'PM-2', 'partial', 0.80, 'Privacy roles map to NIST Senior Privacy Official'),
('iso-27701', 'PIMS-GOV-04', 'nist-800-53-r5', 'RA-3', 'partial', 0.85, 'Privacy risk assessment maps to NIST Risk Assessment'),
('iso-27701', 'PIMS-GOV-05', 'nist-800-53-r5', 'AT-2', 'equivalent', 0.90, 'Privacy awareness maps to NIST Literacy Training and Awareness'),
('iso-27701', 'PIMS-PROC-01', 'nist-800-53-r5', 'PT-2', 'equivalent', 0.90, 'Legal basis maps to NIST Authority to Process PII'),
('iso-27701', 'PIMS-PROC-02', 'nist-800-53-r5', 'PT-4', 'equivalent', 0.90, 'Consent management maps to NIST Consent'),
('iso-27701', 'PIMS-PROC-03', 'nist-800-53-r5', 'PT-3', 'equivalent', 0.85, 'Purpose limitation maps to NIST PII Processing Purposes'),
('iso-27701', 'PIMS-PROC-04', 'nist-800-53-r5', 'SA-8', 'partial', 0.75, 'Data minimization maps to NIST Security and Privacy Engineering Principles'),
('iso-27701', 'PIMS-PROC-05', 'nist-800-53-r5', 'PT-5', 'equivalent', 0.85, 'Processing records maps to NIST Privacy Notice'),
('iso-27701', 'PIMS-DSR-01', 'nist-800-53-r5', 'PT-5', 'equivalent', 0.90, 'Transparency maps to NIST Privacy Notice'),
('iso-27701', 'PIMS-DSR-02', 'nist-800-53-r5', 'IP-2', 'equivalent', 0.90, 'Right of access maps to NIST Individual Access'),
('iso-27701', 'PIMS-DSR-03', 'nist-800-53-r5', 'IP-3', 'equivalent', 0.90, 'Right to rectification maps to NIST Redress'),
('iso-27701', 'PIMS-DSR-04', 'nist-800-53-r5', 'IP-3', 'partial', 0.80, 'Right to erasure maps to NIST Redress'),
('iso-27701', 'PIMS-DSR-08', 'nist-800-53-r5', 'IP-4', 'equivalent', 0.85, 'DSR management maps to NIST Complaint Management'),
('iso-27701', 'PIMS-PBD-01', 'nist-800-53-r5', 'SA-8', 'equivalent', 0.85, 'Privacy by design maps to NIST Security and Privacy Engineering Principles'),
('iso-27701', 'PIMS-PBD-03', 'nist-800-53-r5', 'RA-8', 'equivalent', 0.85, 'DPIA maps to NIST Privacy Impact Assessment'),
('iso-27701', 'PIMS-PBD-04', 'nist-800-53-r5', 'SI-19', 'equivalent', 0.85, 'Pseudonymization maps to NIST De-identification'),
('iso-27701', 'PIMS-PBD-05', 'nist-800-53-r5', 'MP-6', 'partial', 0.80, 'Retention and disposal maps to NIST Media Sanitization'),
('iso-27701', 'PIMS-XFR-01', 'nist-800-53-r5', 'PT-2', 'partial', 0.75, 'Cross-border transfers relate to NIST Authority to Process PII'),
('iso-27701', 'PIMS-XFR-03', 'nist-800-53-r5', 'SA-9', 'partial', 0.80, 'Processor agreements map to NIST External System Services'),
('iso-27701', 'PIMS-SEC-01', 'nist-800-53-r5', 'AC-6', 'equivalent', 0.90, 'PII access control maps to NIST Least Privilege'),
('iso-27701', 'PIMS-SEC-02', 'nist-800-53-r5', 'SC-28', 'equivalent', 0.85, 'PII encryption maps to NIST Protection of Information at Rest'),
('iso-27701', 'PIMS-SEC-03', 'nist-800-53-r5', 'AU-2', 'equivalent', 0.85, 'PII processing logging maps to NIST Event Logging'),
('iso-27701', 'PIMS-SEC-07', 'nist-800-53-r5', 'MP-6', 'equivalent', 0.90, 'Secure disposal maps to NIST Media Sanitization'),
('iso-27701', 'PIMS-BRM-01', 'nist-800-53-r5', 'IR-8', 'partial', 0.80, 'Breach response plan maps to NIST Incident Response Plan'),
('iso-27701', 'PIMS-BRM-02', 'nist-800-53-r5', 'IR-6', 'equivalent', 0.85, 'Authority notification maps to NIST Incident Reporting'),
('iso-27701', 'PIMS-BRM-03', 'nist-800-53-r5', 'IR-6', 'partial', 0.80, 'PII principal notification is specific to privacy breach reporting');

-- ============================================================================
-- CROSSWALK MAPPINGS — ISO 27701 to ISO 27001:2022
-- ============================================================================

INSERT OR REPLACE INTO control_crosswalks (source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence, notes) VALUES
('iso-27701', 'PIMS-GOV-02', 'iso-27001', 'A.5.1', 'superset', 0.90, 'ISO 27701 privacy policy extends ISO 27001 information security policies'),
('iso-27701', 'PIMS-GOV-04', 'iso-27001', 'A.5.8', 'superset', 0.85, 'Privacy risk assessment extends ISO 27001 project management information security'),
('iso-27701', 'PIMS-SEC-01', 'iso-27001', 'A.8.3', 'superset', 0.85, 'PII access control extends ISO 27001 access control with privacy-specific requirements'),
('iso-27701', 'PIMS-SEC-02', 'iso-27001', 'A.8.24', 'superset', 0.85, 'PII encryption extends ISO 27001 use of cryptography');

-- ============================================================================
-- TRACK MIGRATION
-- ============================================================================
INSERT OR IGNORE INTO schema_migrations (version, name, description) VALUES
  ('migrate-031-iso27701-framework', 'iso27701-framework', 'ISO/IEC 27701:2019 PIMS framework with 49 controls and crosswalks to NIST 800-53 R5 and ISO 27001');
