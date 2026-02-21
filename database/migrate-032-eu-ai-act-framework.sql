-- ============================================================================
-- MIGRATION 032: EU Artificial Intelligence Act (Regulation (EU) 2024/1689)
-- ============================================================================
-- Adds the EU AI Act framework with risk-based requirements for AI systems.
-- 55 controls across 9 families, crosswalk mappings to NIST 800-53 R5.
-- Fully idempotent — safe to re-run on every deploy (INSERT OR REPLACE).
-- ============================================================================

-- Framework definition
INSERT OR REPLACE INTO compliance_frameworks (id, name, version, category, description, control_count, governing_body, assessment_methodology)
VALUES ('eu-ai-act', 'EU AI Act', '2024', 'privacy',
  'Regulation (EU) 2024/1689 — the European Union''s comprehensive legal framework for artificial intelligence. Establishes a risk-based approach to AI regulation with prohibitions on unacceptable-risk AI, strict requirements for high-risk AI systems, transparency obligations for certain AI, and governance rules for general-purpose AI models. Effective August 2024 with phased compliance deadlines through August 2027.',
  55, 'European Parliament / Council', 'Conformity Assessment');

-- ============================================================================
-- AI RISK CLASSIFICATION (AIRC) — 6 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('eu-ai-act', 'AIRC-01', 'AI Risk Classification', 'AI System Inventory',
 'Maintain a comprehensive inventory of all AI systems developed, deployed, or procured by the organization. For each AI system, document: purpose and intended use, risk classification (prohibited, high-risk, limited-risk, minimal-risk), affected persons, data inputs, decision outputs, deployment context, and responsible persons. Update the inventory when AI systems are added, modified, or retired. Reference: EU AI Act Article 6, Annex III.',
 'P1', 1, 1, 1, 1),
('eu-ai-act', 'AIRC-02', 'AI Risk Classification', 'Prohibited AI Practices Screening',
 'Screen all AI systems against the prohibited AI practices list in Article 5. Prohibited practices include: social scoring by public authorities, real-time remote biometric identification in public spaces (with limited exceptions), subliminal manipulation causing harm, exploitation of vulnerabilities of specific groups, emotion recognition in workplaces and education (with exceptions), untargeted facial image scraping, and biometric categorization by sensitive attributes. Document screening outcomes. Reference: EU AI Act Article 5.',
 'P1', 1, 1, 1, 2),
('eu-ai-act', 'AIRC-03', 'AI Risk Classification', 'High-Risk AI System Classification',
 'Classify AI systems as high-risk when they are: (a) safety components of products covered by Union harmonization legislation listed in Annex I (machinery, medical devices, vehicles, etc.), or (b) AI systems in the areas listed in Annex III including biometrics, critical infrastructure, education, employment, essential services, law enforcement, migration, and justice. Document the classification rationale and maintain evidence. Reference: EU AI Act Articles 6-7, Annexes I and III.',
 'P1', 1, 1, 1, 3),
('eu-ai-act', 'AIRC-04', 'AI Risk Classification', 'Risk Classification Methodology',
 'Establish a documented methodology for classifying AI system risk levels that considers: potential impact on fundamental rights, health, and safety; severity and likelihood of harm; number of affected persons; reversibility of outcomes; and degree of human oversight. Apply the methodology consistently across all AI systems. Review classifications when systems are significantly modified. Reference: EU AI Act Articles 6-7, Article 9.',
 'P1', 1, 1, 1, 4),
('eu-ai-act', 'AIRC-05', 'AI Risk Classification', 'Limited-Risk AI Identification',
 'Identify AI systems subject to transparency obligations under Article 50, including: AI systems that interact directly with natural persons (chatbots, virtual assistants), emotion recognition systems, biometric categorization systems, and AI systems that generate or manipulate synthetic content (deepfakes). Implement appropriate transparency measures for each identified system. Reference: EU AI Act Article 50.',
 'P1', 1, 1, 1, 5),
('eu-ai-act', 'AIRC-06', 'AI Risk Classification', 'Classification Review and Update',
 'Periodically review AI system risk classifications, especially after significant modifications, changes in deployment context, or amendments to the EU AI Act annexes. Document re-classification decisions with justification. Trigger appropriate compliance activities when a system''s risk classification changes (e.g., from limited to high-risk). Maintain a change log of all classification decisions. Reference: EU AI Act Article 6(3).',
 'P2', 1, 1, 1, 6);

-- ============================================================================
-- DATA GOVERNANCE (AIDG) — 6 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('eu-ai-act', 'AIDG-01', 'Data Governance', 'Training Data Quality Management',
 'Implement data governance and management practices for training, validation, and testing datasets used in high-risk AI systems. Ensure datasets are relevant, sufficiently representative, and as free from errors as possible. Apply data quality criteria including completeness, accuracy, consistency, timeliness, and fitness for the intended purpose. Document data quality assessments and remediation actions. Reference: EU AI Act Article 10(2).',
 'P1', 1, 1, 1, 7),
('eu-ai-act', 'AIDG-02', 'Data Governance', 'Bias Detection and Mitigation',
 'Examine training, validation, and testing datasets for potential biases that could lead to discriminatory outputs, particularly regarding protected characteristics (race, gender, age, disability, religion, sexual orientation). Implement bias detection techniques (statistical parity, equalized odds, calibration). Document identified biases and mitigation measures applied. Monitor for bias in deployed AI system outputs. Reference: EU AI Act Article 10(2)(f).',
 'P1', 1, 1, 1, 8),
('eu-ai-act', 'AIDG-03', 'Data Governance', 'Training Data Documentation',
 'Document all datasets used for training, validation, and testing of high-risk AI systems, including: data sources, collection methodology, data categories, labeling procedures, data preprocessing steps, gaps or known limitations, and any assumptions made. Maintain dataset versioning and lineage tracking. Retain documentation for the lifetime of the AI system plus regulatory retention periods. Reference: EU AI Act Article 10(5), Article 11.',
 'P1', 1, 1, 1, 9),
('eu-ai-act', 'AIDG-04', 'Data Governance', 'Personal Data Processing for Bias Detection',
 'Where processing of special categories of personal data is necessary for bias detection and correction in high-risk AI systems, implement appropriate safeguards as required by Article 10(5). Apply data minimization, purpose limitation, pseudonymization or anonymization. Document the necessity and proportionality of processing sensitive data for bias detection. Ensure compliance with GDPR Article 9. Reference: EU AI Act Article 10(5).',
 'P1', 1, 1, 1, 10),
('eu-ai-act', 'AIDG-05', 'Data Governance', 'Data Retention and Lifecycle',
 'Define retention periods for training, validation, and testing datasets in accordance with the AI system lifecycle and regulatory requirements. Implement secure storage with access controls for all AI-related datasets. Ensure datasets can be reproduced or made available to regulatory authorities upon request. Define data disposal procedures for end-of-life AI systems. Reference: EU AI Act Article 10(5), Article 17.',
 'P2', 1, 1, 1, 11),
('eu-ai-act', 'AIDG-06', 'Data Governance', 'Synthetic and Augmented Data Controls',
 'When using synthetic, augmented, or artificially generated data for AI training, document the generation methodology, parameters, and known limitations. Assess whether synthetic data introduces systematic biases or distributional shifts. Validate that synthetic data produces models with equivalent performance to real-world data. Label synthetic data to distinguish it from real-world data in datasets. Reference: EU AI Act Article 10(2).',
 'P2', 0, 1, 1, 12);

-- ============================================================================
-- TECHNICAL DOCUMENTATION (AITD) — 5 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('eu-ai-act', 'AITD-01', 'Technical Documentation', 'System Design Documentation',
 'Produce and maintain technical documentation for high-risk AI systems before market placement or deployment. Documentation must include: general description of the AI system, detailed description of elements and development process, information about monitoring and functioning, description of the risk management system, changes during lifecycle, and list of applied harmonized standards. Reference: EU AI Act Article 11, Annex IV.',
 'P1', 1, 1, 1, 13),
('eu-ai-act', 'AITD-02', 'Technical Documentation', 'Algorithm and Model Documentation',
 'Document the design specifications and algorithms used in high-risk AI systems, including: model architecture and type, training methodology, key design choices and rationale, computational resources used, performance metrics and benchmarks, known limitations, and foreseeable misuse scenarios. For machine learning systems, document hyperparameters, training duration, and convergence criteria. Reference: EU AI Act Annex IV, Section 2.',
 'P1', 1, 1, 1, 14),
('eu-ai-act', 'AITD-03', 'Technical Documentation', 'Instructions for Use',
 'Provide clear, comprehensive instructions for use to deployers of high-risk AI systems. Instructions must include: provider identity and contact, system capabilities and limitations, intended purpose, hardware/software requirements, performance metrics with foreseeable misuse scenarios, human oversight measures, expected lifetime and maintenance needs, and interpretation guidance for outputs. Instructions must be in accessible language. Reference: EU AI Act Article 13.',
 'P1', 1, 1, 1, 15),
('eu-ai-act', 'AITD-04', 'Technical Documentation', 'EU Declaration of Conformity',
 'Draw up a written EU declaration of conformity for each high-risk AI system, confirming compliance with the requirements of the AI Act. The declaration must contain: provider information, AI system identification, reference to harmonized standards or specifications applied, name and identification number of the notified body (if applicable), and a statement of sole responsibility. Keep the declaration for 10 years after the system is placed on the market. Reference: EU AI Act Article 47, Annex V.',
 'P1', 0, 1, 1, 16),
('eu-ai-act', 'AITD-05', 'Technical Documentation', 'Documentation Retention and Access',
 'Retain all technical documentation for a period of 10 years after the high-risk AI system is placed on the market or put into service. Make documentation available to national competent authorities and market surveillance authorities upon request. Ensure documentation is kept up to date throughout the AI system lifecycle. Implement version control and change tracking for all technical documentation. Reference: EU AI Act Article 18.',
 'P1', 1, 1, 1, 17);

-- ============================================================================
-- TRANSPARENCY AND EXPLAINABILITY (AITR) — 7 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('eu-ai-act', 'AITR-01', 'Transparency and Explainability', 'AI Interaction Disclosure',
 'Ensure natural persons are informed when they are interacting with an AI system, unless it is obvious from the context. Disclosures must be provided in a clear, timely, and accessible manner before or at the point of interaction. This applies to chatbots, virtual assistants, automated customer service, and any AI system that communicates directly with individuals. Reference: EU AI Act Article 50(1).',
 'P1', 1, 1, 1, 18),
('eu-ai-act', 'AITR-02', 'Transparency and Explainability', 'Synthetic Content Labeling',
 'Mark AI-generated or manipulated content (deepfakes, synthetic audio, AI-generated text, AI-generated images) in a machine-readable format that discloses its artificial origin. Apply digital watermarking, metadata tagging, or other technical solutions to enable detection. Exceptions apply for content that is part of an obviously creative or fictional work. Reference: EU AI Act Article 50(2), (4).',
 'P1', 1, 1, 1, 19),
('eu-ai-act', 'AITR-03', 'Transparency and Explainability', 'Emotion Recognition Disclosure',
 'When deploying emotion recognition systems, inform exposed persons that such a system is being used and the categories of emotions or intentions being inferred. Ensure the system complies with applicable data protection legislation. This obligation does not apply to AI systems used for medical or safety purposes with appropriate authorization. Reference: EU AI Act Article 50(3).',
 'P1', 1, 1, 1, 20),
('eu-ai-act', 'AITR-04', 'Transparency and Explainability', 'High-Risk AI Transparency',
 'Design high-risk AI systems to be sufficiently transparent that deployers can interpret system output and use it appropriately. Provide information on the system''s level of accuracy, robustness, and cybersecurity, as well as any circumstance that may affect performance. Enable deployers to understand and oversee the system''s functioning. Reference: EU AI Act Article 13.',
 'P1', 1, 1, 1, 21),
('eu-ai-act', 'AITR-05', 'Transparency and Explainability', 'Deployer Transparency to Affected Persons',
 'When deploying high-risk AI systems that make decisions affecting natural persons, inform those persons that they are subject to AI system decisions. Provide meaningful information about the logic involved and the main parameters affecting the decision, particularly for AI in employment, education, essential services, creditworthiness, and law enforcement. Reference: EU AI Act Article 26(5), (6), (7).',
 'P1', 1, 1, 1, 22),
('eu-ai-act', 'AITR-06', 'Transparency and Explainability', 'Output Interpretability',
 'For high-risk AI systems, implement mechanisms that enable interpretation and explanation of AI outputs appropriate to the deployment context. Provide explanations at a level of detail suitable for the deployer''s expertise and the affected person''s rights. Where decisions are contested, provide sufficient explanation to support meaningful human review. Reference: EU AI Act Article 13, Article 14.',
 'P1', 1, 1, 1, 23),
('eu-ai-act', 'AITR-07', 'Transparency and Explainability', 'EU Database Registration',
 'Register high-risk AI systems in the EU database established under Article 71 before placing them on the market or putting them into service. Provide required information including: provider identity, system name and description, intended purpose, status, member states of deployment, and conformity assessment information. Keep registration data up to date. Reference: EU AI Act Article 49, Article 71.',
 'P1', 0, 1, 1, 24);

-- ============================================================================
-- HUMAN OVERSIGHT (AIHO) — 6 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('eu-ai-act', 'AIHO-01', 'Human Oversight', 'Human Oversight Design',
 'Design high-risk AI systems with appropriate human oversight measures that can be implemented by the deployer. Oversight measures may include human-in-the-loop (human approves each decision), human-on-the-loop (human monitors and can intervene), or human-in-command (human can override or shut down). The level of oversight must be commensurate with the risk and degree of autonomy. Reference: EU AI Act Article 14(1), (2).',
 'P1', 1, 1, 1, 25),
('eu-ai-act', 'AIHO-02', 'Human Oversight', 'Oversight Personnel Competency',
 'Assign human oversight of high-risk AI systems to persons who have the necessary competence, training, and authority to exercise oversight effectively. Ensure oversight personnel understand the system''s capabilities and limitations, can correctly interpret outputs, and know when and how to intervene or override. Document competency requirements and training provided. Reference: EU AI Act Article 14(4), Article 26(1).',
 'P1', 1, 1, 1, 26),
('eu-ai-act', 'AIHO-03', 'Human Oversight', 'Override and Intervention Capability',
 'Implement technical mechanisms that enable human oversight personnel to override, interrupt, or shut down high-risk AI systems when necessary. Ensure override mechanisms are accessible, reliable, and cannot be circumvented by the AI system. Design systems so that they can be safely interrupted without causing harm. Test override mechanisms regularly. Reference: EU AI Act Article 14(3)(e), (4)(d).',
 'P1', 1, 1, 1, 27),
('eu-ai-act', 'AIHO-04', 'Human Oversight', 'Automation Bias Mitigation',
 'Implement measures to mitigate automation bias — the tendency for human oversight personnel to over-rely on or uncritically accept AI system outputs. Measures include: presenting confidence levels with outputs, requiring independent verification for high-stakes decisions, rotating oversight personnel, providing counter-evidence or alternative outputs, and conducting regular calibration exercises. Reference: EU AI Act Article 14(4)(b).',
 'P1', 1, 1, 1, 28),
('eu-ai-act', 'AIHO-05', 'Human Oversight', 'Deployer Oversight Implementation',
 'As a deployer of high-risk AI systems, assign human oversight to natural persons who have the necessary competence, training, and authority as prescribed by the provider''s instructions for use. Ensure oversight personnel can decide not to use the system, disregard or override outputs, and intervene or halt the system when needed. Document oversight arrangements. Reference: EU AI Act Article 26(2).',
 'P1', 1, 1, 1, 29),
('eu-ai-act', 'AIHO-06', 'Human Oversight', 'Fundamental Rights Impact Assessment',
 'Before deploying a high-risk AI system, deployers that are bodies governed by public law or private entities providing public services must perform a fundamental rights impact assessment. The assessment must consider: description of processes, period and frequency of use, categories of affected persons, specific risks of harm, human oversight measures, and risk mitigation measures. Notify the market surveillance authority of assessment results. Reference: EU AI Act Article 27.',
 'P1', 0, 1, 1, 30);

-- ============================================================================
-- ACCURACY, ROBUSTNESS & CYBERSECURITY (AIARC) — 7 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('eu-ai-act', 'AIARC-01', 'Accuracy Robustness and Cybersecurity', 'AI System Accuracy',
 'Design and develop high-risk AI systems to achieve appropriate levels of accuracy for their intended purpose. Define accuracy metrics relevant to the AI system type (precision, recall, F1-score, AUC-ROC, mean absolute error, etc.). Declare accuracy levels in the instructions for use. Validate accuracy using representative test datasets. Monitor accuracy in production and take corrective action when accuracy degrades below acceptable thresholds. Reference: EU AI Act Article 15(1).',
 'P1', 1, 1, 1, 31),
('eu-ai-act', 'AIARC-02', 'Accuracy Robustness and Cybersecurity', 'AI System Robustness',
 'Design high-risk AI systems to be resilient to errors, faults, and inconsistencies in inputs and operating environment. Test robustness through techniques including adversarial testing, stress testing, edge case analysis, and out-of-distribution detection. Implement graceful degradation so the system fails safely. Validate robustness across the expected range of operating conditions. Reference: EU AI Act Article 15(4).',
 'P1', 1, 1, 1, 32),
('eu-ai-act', 'AIARC-03', 'Accuracy Robustness and Cybersecurity', 'Adversarial Attack Resilience',
 'Implement technical measures to protect high-risk AI systems against adversarial attacks including data poisoning, model evasion, model inversion, and membership inference. Apply adversarial training, input validation, anomaly detection, and model hardening techniques. Conduct regular adversarial security assessments. Document known vulnerabilities and mitigations. Reference: EU AI Act Article 15(5).',
 'P1', 1, 1, 1, 33),
('eu-ai-act', 'AIARC-04', 'Accuracy Robustness and Cybersecurity', 'AI Cybersecurity',
 'Implement appropriate cybersecurity measures for high-risk AI systems proportionate to the risks. Protect against unauthorized access to training data, model parameters, and inference pipelines. Implement authentication, encryption, access controls, and logging for all AI system components. Address AI-specific threats including model extraction, training data exfiltration, and prompt injection. Reference: EU AI Act Article 15(5).',
 'P1', 1, 1, 1, 34),
('eu-ai-act', 'AIARC-05', 'Accuracy Robustness and Cybersecurity', 'Performance Monitoring',
 'Implement post-market monitoring systems for high-risk AI systems to continuously assess performance throughout their lifecycle. Monitor for accuracy drift, bias emergence, concept drift, and data distribution changes. Define performance thresholds and automated alerting. Maintain performance monitoring logs and make them available to regulatory authorities. Take corrective action when performance degrades. Reference: EU AI Act Article 72.',
 'P1', 1, 1, 1, 35),
('eu-ai-act', 'AIARC-06', 'Accuracy Robustness and Cybersecurity', 'Serious Incident Reporting',
 'Report serious incidents involving high-risk AI systems to the market surveillance authorities of the Member State where the incident occurred. A serious incident means an incident or malfunctioning that directly or indirectly led to death, serious damage to health or property, or serious disruption to critical infrastructure. Report immediately and no later than 15 days after becoming aware. Reference: EU AI Act Article 73.',
 'P1', 1, 1, 1, 36),
('eu-ai-act', 'AIARC-07', 'Accuracy Robustness and Cybersecurity', 'AI System Testing and Validation',
 'Conduct systematic testing, validation, and verification of high-risk AI systems before deployment and after significant modifications. Testing must include functional testing, performance benchmarking, bias testing, robustness testing, and security testing. Use testing procedures and metrics defined prior to development. Document test plans, results, and any identified deficiencies with remediation plans. Reference: EU AI Act Article 9(7), Article 10(4).',
 'P1', 1, 1, 1, 37);

-- ============================================================================
-- QUALITY MANAGEMENT (AIQM) — 5 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('eu-ai-act', 'AIQM-01', 'Quality Management', 'AI Quality Management System',
 'Establish and maintain a quality management system (QMS) for high-risk AI systems that ensures compliance with the AI Act. The QMS must address: compliance strategy, design and development procedures, testing and validation procedures, technical specifications, data management procedures, risk management, post-market monitoring, incident reporting, and communication with authorities. Document the QMS and keep it up to date. Reference: EU AI Act Article 17.',
 'P1', 1, 1, 1, 38),
('eu-ai-act', 'AIQM-02', 'Quality Management', 'AI Risk Management System',
 'Establish and maintain a continuous iterative risk management system for high-risk AI systems throughout their lifecycle. The system must: identify and analyze known and foreseeable risks, estimate and evaluate risks, adopt risk management measures, ensure residual risk is acceptable, and communicate residual risks to deployers. Test risk management measures to ensure they are effective. Reference: EU AI Act Article 9.',
 'P1', 1, 1, 1, 39),
('eu-ai-act', 'AIQM-03', 'Quality Management', 'Conformity Assessment',
 'Undergo conformity assessment procedures appropriate to the high-risk AI system before market placement. For systems in Annex III (standalone high-risk), apply internal control (Annex VI) or, where required, third-party assessment by notified bodies (Annex VII). For systems that are safety components of products, integrate AI conformity assessment with existing product assessment. Maintain conformity records. Reference: EU AI Act Articles 43-46.',
 'P1', 0, 1, 1, 40),
('eu-ai-act', 'AIQM-04', 'Quality Management', 'Corrective Actions and Recall',
 'Implement procedures for taking corrective actions including modification, withdrawal, disabling, or recall of non-conforming AI systems. When a high-risk AI system presents a risk, immediately inform market surveillance authorities and take appropriate corrective action. Document all corrective actions taken and their effectiveness. Cooperate with authorities on recall procedures. Reference: EU AI Act Article 20.',
 'P1', 1, 1, 1, 41),
('eu-ai-act', 'AIQM-05', 'Quality Management', 'Post-Market Monitoring Plan',
 'Establish a post-market monitoring system proportionate to the nature and risks of the high-risk AI system. The monitoring plan must actively and systematically collect, document, and analyze data on performance throughout the system''s lifetime. Use monitoring data to evaluate ongoing compliance and trigger corrective actions when needed. Make monitoring data available to market surveillance authorities upon request. Reference: EU AI Act Article 72.',
 'P2', 1, 1, 1, 42);

-- ============================================================================
-- GENERAL-PURPOSE AI (AIGP) — 7 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('eu-ai-act', 'AIGP-01', 'General-Purpose AI', 'GPAI Model Documentation',
 'Providers of general-purpose AI (GPAI) models must draw up and maintain technical documentation of the model including: a general description, training information, evaluation results, and relevant information about the model''s capabilities and limitations. Make documentation available to downstream providers and national competent authorities upon request. Reference: EU AI Act Article 53(1)(a), Annex XI.',
 'P1', 1, 1, 1, 43),
('eu-ai-act', 'AIGP-02', 'General-Purpose AI', 'GPAI Copyright Compliance',
 'Implement a policy for compliance with EU copyright law (Directive (EU) 2019/790), particularly regarding the use of copyrighted works in training data. Identify and document copyrighted works used for training. Comply with rights holders'' reservation of rights (opt-outs) under Article 4 of the Copyright Directive. Provide a sufficiently detailed summary of training data content. Reference: EU AI Act Article 53(1)(c), (d).',
 'P1', 1, 1, 1, 44),
('eu-ai-act', 'AIGP-03', 'General-Purpose AI', 'Downstream Provider Information',
 'Provide downstream providers who integrate GPAI models into their AI systems with sufficient information and documentation to enable their compliance with the AI Act. Information must include: model capabilities and limitations, integration guidelines, risk information, and any obligations the downstream provider must fulfill. Maintain records of downstream providers. Reference: EU AI Act Article 53(1)(b).',
 'P1', 1, 1, 1, 45),
('eu-ai-act', 'AIGP-04', 'General-Purpose AI', 'Systemic Risk Assessment (GPAI)',
 'For GPAI models with systemic risk (models trained with >10^25 FLOPs of compute or designated by the Commission), perform model evaluation including adversarial testing to identify and mitigate systemic risks. Assess risks including: large-scale impact on public health, safety, public security, fundamental rights, or society. Track and report serious incidents to the AI Office. Reference: EU AI Act Article 55(1)(a), (b).',
 'P1', 0, 1, 1, 46),
('eu-ai-act', 'AIGP-05', 'General-Purpose AI', 'Systemic Risk Mitigation',
 'For GPAI models with systemic risk, assess and mitigate possible systemic risks at the Union level including their sources. Implement appropriate risk mitigation measures such as model modification, guardrails, content filtering, deployment restrictions, and usage policies. Document mitigation measures and their effectiveness. Keep measures up to date in light of new information. Reference: EU AI Act Article 55(1)(c).',
 'P1', 0, 1, 1, 47),
('eu-ai-act', 'AIGP-06', 'General-Purpose AI', 'GPAI Energy and Compute Reporting',
 'Document and report the computational resources used for training GPAI models, including estimated energy consumption. For models with systemic risk, report this information to the AI Office. Consider environmental sustainability in model development decisions. Track and optimize energy efficiency of training and inference processes. Reference: EU AI Act Annex XI(2)(e).',
 'P2', 0, 1, 1, 48),
('eu-ai-act', 'AIGP-07', 'General-Purpose AI', 'Code of Practice Compliance',
 'Adhere to approved codes of practice for GPAI models as established by the AI Office. Codes of practice provide detailed rules for compliance with GPAI obligations including documentation, transparency, copyright compliance, and systemic risk management. Where codes of practice do not exist, demonstrate compliance through alternative adequate means. Reference: EU AI Act Article 56.',
 'P2', 1, 1, 1, 49);

-- ============================================================================
-- GOVERNANCE AND ACCOUNTABILITY (AIGA) — 6 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('eu-ai-act', 'AIGA-01', 'Governance and Accountability', 'AI Governance Structure',
 'Establish an AI governance structure with clear roles, responsibilities, and accountability for AI Act compliance. Designate responsible persons for AI risk management, conformity assessment, post-market monitoring, and regulatory communication. Ensure governance personnel have sufficient authority, resources, and access to senior management. Document the governance structure and reporting lines. Reference: EU AI Act Article 17(1)(l).',
 'P1', 1, 1, 1, 50),
('eu-ai-act', 'AIGA-02', 'Governance and Accountability', 'AI Literacy Training',
 'Ensure staff and other persons dealing with the operation and use of AI systems have a sufficient level of AI literacy, taking into account their technical knowledge, experience, education, and the context and persons on which AI systems are to be used. Address AI literacy requirements for providers, deployers, and affected persons as appropriate. Reference: EU AI Act Article 4.',
 'P1', 1, 1, 1, 51),
('eu-ai-act', 'AIGA-03', 'Governance and Accountability', 'Regulatory Cooperation',
 'Cooperate with national competent authorities, market surveillance authorities, and the AI Office in the exercise of their functions. Provide information, documentation, and access to AI systems upon request. Participate in regulatory sandbox programs where beneficial. Maintain an authorized representative in the EU if the provider is established outside the Union. Reference: EU AI Act Article 21, Article 22.',
 'P2', 1, 1, 1, 52),
('eu-ai-act', 'AIGA-04', 'Governance and Accountability', 'Deployer Compliance Program',
 'As a deployer of high-risk AI systems, implement measures to ensure AI systems are used in accordance with the provider''s instructions. Monitor system operations, report malfunctions, and maintain logs generated by the AI system for a period appropriate to the intended purpose (minimum 6 months). Suspend use of AI systems that present risks and inform providers and authorities. Reference: EU AI Act Article 26.',
 'P1', 1, 1, 1, 53),
('eu-ai-act', 'AIGA-05', 'Governance and Accountability', 'AI System Logging and Audit Trail',
 'Implement automatic logging capabilities for high-risk AI systems to ensure traceability of functioning throughout the system''s lifecycle. Logs must enable monitoring of operation, identification of risks, facilitate post-market monitoring, and support incident investigation. Design logging capabilities at the provider level and implement log retention at the deployer level. Reference: EU AI Act Article 12, Article 26(5).',
 'P1', 1, 1, 1, 54),
('eu-ai-act', 'AIGA-06', 'Governance and Accountability', 'Penalty and Enforcement Preparedness',
 'Understand and prepare for the enforcement and penalty framework under the AI Act. Administrative fines can reach up to EUR 35 million or 7% of worldwide annual turnover for prohibited AI practices, EUR 15 million or 3% for other violations. Implement compliance monitoring, internal audit, and escalation procedures to proactively identify and remediate non-conformities before they result in enforcement actions. Reference: EU AI Act Article 99.',
 'P2', 1, 1, 1, 55);

-- ============================================================================
-- CROSSWALK MAPPINGS — EU AI Act to NIST 800-53 R5
-- ============================================================================

INSERT OR REPLACE INTO control_crosswalks (source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence, notes) VALUES
('eu-ai-act', 'AIRC-01', 'nist-800-53-r5', 'CM-8', 'partial', 0.75, 'AI system inventory maps to NIST System Component Inventory'),
('eu-ai-act', 'AIRC-04', 'nist-800-53-r5', 'RA-3', 'partial', 0.80, 'Risk classification methodology maps to NIST Risk Assessment'),
('eu-ai-act', 'AIDG-01', 'nist-800-53-r5', 'SA-8', 'partial', 0.70, 'Data quality for AI maps to NIST Security and Privacy Engineering Principles'),
('eu-ai-act', 'AIDG-02', 'nist-800-53-r5', 'SI-19', 'partial', 0.70, 'Bias detection relates to NIST De-identification for fairness'),
('eu-ai-act', 'AITD-01', 'nist-800-53-r5', 'SA-5', 'partial', 0.75, 'Technical documentation maps to NIST System Documentation'),
('eu-ai-act', 'AITR-01', 'nist-800-53-r5', 'PT-5', 'partial', 0.75, 'AI interaction disclosure maps to NIST Privacy Notice'),
('eu-ai-act', 'AITR-04', 'nist-800-53-r5', 'PT-5', 'partial', 0.70, 'High-risk AI transparency maps to NIST Privacy Notice'),
('eu-ai-act', 'AIHO-01', 'nist-800-53-r5', 'PM-2', 'partial', 0.70, 'Human oversight design relates to NIST Information Security Program Leadership Role'),
('eu-ai-act', 'AIHO-02', 'nist-800-53-r5', 'AT-2', 'partial', 0.80, 'Oversight competency maps to NIST Literacy Training and Awareness'),
('eu-ai-act', 'AIARC-01', 'nist-800-53-r5', 'CA-2', 'partial', 0.75, 'AI accuracy maps to NIST Control Assessments'),
('eu-ai-act', 'AIARC-02', 'nist-800-53-r5', 'SI-10', 'partial', 0.70, 'AI robustness relates to NIST Information Input Validation'),
('eu-ai-act', 'AIARC-03', 'nist-800-53-r5', 'SI-3', 'partial', 0.70, 'Adversarial attack resilience relates to NIST Malicious Code Protection'),
('eu-ai-act', 'AIARC-04', 'nist-800-53-r5', 'SC-7', 'partial', 0.75, 'AI cybersecurity maps to NIST Boundary Protection'),
('eu-ai-act', 'AIARC-05', 'nist-800-53-r5', 'SI-4', 'partial', 0.75, 'Performance monitoring maps to NIST System Monitoring'),
('eu-ai-act', 'AIARC-06', 'nist-800-53-r5', 'IR-6', 'partial', 0.80, 'Serious incident reporting maps to NIST Incident Reporting'),
('eu-ai-act', 'AIARC-07', 'nist-800-53-r5', 'CA-2', 'partial', 0.80, 'AI testing and validation maps to NIST Control Assessments'),
('eu-ai-act', 'AIQM-01', 'nist-800-53-r5', 'PM-1', 'partial', 0.75, 'AI QMS maps to NIST Program Management Plan'),
('eu-ai-act', 'AIQM-02', 'nist-800-53-r5', 'RA-3', 'equivalent', 0.80, 'AI risk management system maps to NIST Risk Assessment'),
('eu-ai-act', 'AIGA-01', 'nist-800-53-r5', 'PM-2', 'partial', 0.80, 'AI governance structure maps to NIST Program Leadership Role'),
('eu-ai-act', 'AIGA-02', 'nist-800-53-r5', 'AT-2', 'equivalent', 0.85, 'AI literacy maps to NIST Literacy Training and Awareness'),
('eu-ai-act', 'AIGA-05', 'nist-800-53-r5', 'AU-2', 'partial', 0.80, 'AI logging maps to NIST Event Logging');

-- ============================================================================
-- TRACK MIGRATION
-- ============================================================================
INSERT OR IGNORE INTO schema_migrations (version, name, description) VALUES
  ('migrate-032-eu-ai-act-framework', 'eu-ai-act-framework', 'EU AI Act (Regulation 2024/1689) framework with 55 controls and crosswalks to NIST 800-53 R5');
