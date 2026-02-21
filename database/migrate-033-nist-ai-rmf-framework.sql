-- ============================================================================
-- MIGRATION 033: NIST AI Risk Management Framework (AI 100-1)
-- ============================================================================
-- Adds the NIST AI RMF with GOVERN, MAP, MEASURE, and MANAGE functions.
-- 54 controls across 4 core functions, crosswalk mappings to NIST 800-53 R5.
-- Fully idempotent — safe to re-run on every deploy (INSERT OR REPLACE).
-- ============================================================================

-- Framework definition
INSERT OR REPLACE INTO compliance_frameworks (id, name, version, category, description, control_count, governing_body, assessment_methodology)
VALUES ('nist-ai-rmf', 'NIST AI RMF', '1.0', 'commercial',
  'NIST Artificial Intelligence Risk Management Framework (AI 100-1) — a voluntary framework for managing risks associated with AI systems throughout their lifecycle. Organized around four core functions: Govern, Map, Measure, and Manage. Promotes trustworthy AI through characteristics of validity, reliability, safety, security, accountability, transparency, explainability, privacy, and fairness.',
  54, 'NIST', 'AI RMF Self-Assessment');

-- ============================================================================
-- GOVERN FUNCTION (GV) — 16 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-ai-rmf', 'GV-1.1', 'Govern', 'Legal and Regulatory Compliance',
 'Identify and document legal and regulatory requirements applicable to AI systems, including sector-specific regulations, data protection laws, anti-discrimination laws, and emerging AI-specific legislation. Map requirements to organizational AI activities. Monitor regulatory developments and update compliance obligations accordingly. Communicate applicable requirements to AI development and deployment teams. Reference: NIST AI RMF GV-1.1.',
 'P1', 1, 1, 1, 1),
('nist-ai-rmf', 'GV-1.2', 'Govern', 'AI Risk Management Policy',
 'Establish organizational policies and procedures for AI risk management that address the full AI lifecycle from design through decommission. Policies must define risk tolerance levels, approval processes for AI system deployment, roles and responsibilities, and escalation procedures. Integrate AI risk management with existing enterprise risk management frameworks. Review and update policies at planned intervals. Reference: NIST AI RMF GV-1.2.',
 'P1', 1, 1, 1, 2),
('nist-ai-rmf', 'GV-1.3', 'Govern', 'AI Risk Management Processes',
 'Implement processes, procedures, and practices for AI risk management that are applied consistently across the organization. Processes must address risk identification, assessment, prioritization, treatment, monitoring, and communication. Ensure processes are documented, repeatable, and auditable. Align AI risk management processes with organizational objectives and values. Reference: NIST AI RMF GV-1.3.',
 'P1', 1, 1, 1, 3),
('nist-ai-rmf', 'GV-2.1', 'Govern', 'AI Roles and Responsibilities',
 'Define and assign roles, responsibilities, and lines of authority for AI risk management across the organization. Identify responsible individuals for AI system design, development, testing, deployment, monitoring, and decommission. Establish accountability mechanisms including clear ownership of AI risk decisions. Ensure AI risk management responsibilities are integrated into job descriptions and performance evaluations. Reference: NIST AI RMF GV-2.1.',
 'P1', 1, 1, 1, 4),
('nist-ai-rmf', 'GV-2.2', 'Govern', 'AI Risk Management Accountability',
 'Establish mechanisms for accountability in AI risk management including reporting structures, escalation paths, and consequence management. Ensure senior leadership has visibility into AI risks and risk management activities. Implement whistleblowing and reporting channels for AI-related concerns. Track and report on AI risk management performance metrics to governance bodies. Reference: NIST AI RMF GV-2.2.',
 'P1', 1, 1, 1, 5),
('nist-ai-rmf', 'GV-3.1', 'Govern', 'Workforce Diversity for AI',
 'Foster workforce diversity, equity, inclusion, and accessibility in AI development and deployment teams. Diverse teams help identify potential biases, broaden perspectives on potential impacts, and improve AI system design. Assess team composition and implement strategies to address gaps in diversity of background, discipline, experience, and demographics relevant to AI risk identification. Reference: NIST AI RMF GV-3.1.',
 'P2', 1, 1, 1, 6),
('nist-ai-rmf', 'GV-3.2', 'Govern', 'AI Domain Expertise',
 'Ensure AI teams include personnel with appropriate domain expertise relevant to the AI system''s application area (e.g., healthcare, finance, criminal justice). Domain experts help identify context-specific risks, validate system outputs, and assess potential impacts on affected communities. Establish relationships with external domain experts where internal expertise is insufficient. Reference: NIST AI RMF GV-3.2.',
 'P2', 1, 1, 1, 7),
('nist-ai-rmf', 'GV-4.1', 'Govern', 'Organizational AI Culture',
 'Foster an organizational culture that considers and communicates AI risk. Promote awareness of AI risks and responsible AI practices at all organizational levels. Encourage open discussion of AI system limitations, potential harms, and ethical considerations. Integrate AI risk awareness into organizational decision-making. Support a culture where raising concerns about AI risks is welcomed and addressed. Reference: NIST AI RMF GV-4.1.',
 'P2', 1, 1, 1, 8),
('nist-ai-rmf', 'GV-4.2', 'Govern', 'AI Risk Management Resources',
 'Allocate sufficient organizational resources for AI risk management including personnel, tools, budget, and time. Resources must be proportionate to the scale and risk level of AI activities. Ensure AI risk management is not deprioritized relative to development velocity. Invest in AI risk management tools, training, and infrastructure. Reference: NIST AI RMF GV-4.2.',
 'P2', 1, 1, 1, 9),
('nist-ai-rmf', 'GV-4.3', 'Govern', 'AI Risk Documentation Standards',
 'Establish documentation standards for AI risk management activities throughout the AI system lifecycle. Documentation must support reproducibility, accountability, and auditing. Define what information must be captured at each lifecycle stage including design decisions, risk assessments, test results, deployment approvals, monitoring data, and incident reports. Maintain documentation accessibility and version control. Reference: NIST AI RMF GV-4.3.',
 'P1', 1, 1, 1, 10),
('nist-ai-rmf', 'GV-5.1', 'Govern', 'AI Stakeholder Engagement',
 'Establish and maintain processes for engaging relevant AI stakeholders including affected communities, civil society organizations, domain experts, and interdisciplinary professionals. Identify stakeholders for each AI system based on its deployment context and potential impacts. Engage stakeholders at appropriate lifecycle stages (design, pre-deployment, post-deployment). Document stakeholder input and how it influenced AI risk decisions. Reference: NIST AI RMF GV-5.1.',
 'P2', 1, 1, 1, 11),
('nist-ai-rmf', 'GV-5.2', 'Govern', 'AI Feedback Mechanisms',
 'Implement mechanisms for stakeholders, users, and affected persons to provide feedback about AI system performance, impacts, and concerns. Feedback mechanisms should be accessible, easy to use, and responsive. Establish processes for reviewing, triaging, and acting on feedback. Report aggregated feedback insights to AI governance bodies. Reference: NIST AI RMF GV-5.2.',
 'P2', 1, 1, 1, 12),
('nist-ai-rmf', 'GV-6.1', 'Govern', 'Third-Party AI Risk Policies',
 'Establish policies and procedures to address AI risks arising from third-party AI systems, components, models, data, and services. Conduct due diligence on third-party AI providers including assessment of their risk management practices. Include AI risk requirements in procurement and contracting processes. Monitor third-party AI performance and compliance with organizational risk tolerances. Reference: NIST AI RMF GV-6.1.',
 'P1', 1, 1, 1, 13),
('nist-ai-rmf', 'GV-6.2', 'Govern', 'Third-Party AI Contingency Planning',
 'Develop contingency plans for third-party AI system failures, discontinuation, or non-compliance. Address scenarios including vendor lock-in, data portability, model availability, and supply chain disruptions. Maintain documented alternatives for critical third-party AI dependencies. Test contingency plans periodically. Reference: NIST AI RMF GV-6.2.',
 'P2', 1, 1, 1, 14),
('nist-ai-rmf', 'GV-1.4', 'Govern', 'AI Risk Management Integration',
 'Integrate AI risk management into the broader enterprise risk management (ERM) framework. Ensure AI risks are reported through established risk governance channels. Align AI risk assessment methodologies with organizational risk frameworks. Map AI-specific risks to existing risk categories where applicable (cybersecurity, operational, reputational, legal, financial). Reference: NIST AI RMF GV-1.',
 'P1', 1, 1, 1, 15),
('nist-ai-rmf', 'GV-1.5', 'Govern', 'AI Ethics and Values Alignment',
 'Define organizational values and principles for trustworthy AI that align with the NIST AI RMF trustworthiness characteristics: valid and reliable, safe, secure and resilient, accountable and transparent, explainable and interpretable, privacy-enhanced, and fair with harmful biases managed. Communicate these values across the organization and incorporate them into AI development and deployment practices. Reference: NIST AI RMF GV-1.',
 'P1', 1, 1, 1, 16);

-- ============================================================================
-- MAP FUNCTION (MP) — 12 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-ai-rmf', 'MP-1.1', 'Map', 'Intended Purpose and Context',
 'Document the intended purpose, deployment context, and anticipated conditions of use for each AI system. Include: business or operational objectives, target users and user environment, anticipated benefits, and the broader social and environmental context. Ensure the intended purpose is specific, bounded, and communicated to all stakeholders. Reference: NIST AI RMF MP-1.1.',
 'P1', 1, 1, 1, 17),
('nist-ai-rmf', 'MP-1.2', 'Map', 'Interdisciplinary AI Team',
 'Assemble interdisciplinary teams for AI system design, development, and deployment that include diverse backgrounds, disciplines, and experiences. Teams should include data scientists, domain experts, ethicists, legal advisors, user experience designers, and representatives of affected communities where feasible. Document team composition and how diverse perspectives informed design decisions. Reference: NIST AI RMF MP-1.2.',
 'P2', 1, 1, 1, 18),
('nist-ai-rmf', 'MP-1.3', 'Map', 'AI System Assumptions Documentation',
 'Identify and document the assumptions and limitations of AI systems including: statistical assumptions, data representativeness assumptions, deployment environment assumptions, and assumptions about user behavior and capabilities. Assess the validity of assumptions before and after deployment. Communicate known limitations to users and deployers. Reference: NIST AI RMF MP-1.3.',
 'P1', 1, 1, 1, 19),
('nist-ai-rmf', 'MP-1.4', 'Map', 'AI System Boundary Definition',
 'Define the boundaries of AI systems including what is within and outside the system scope. Document: system inputs (data types, sources, formats), system outputs (predictions, recommendations, actions), human-AI interaction points, integration with other systems, and environmental dependencies. Clarify where human judgment is expected vs. where the system operates autonomously. Reference: NIST AI RMF MP-1.4.',
 'P1', 1, 1, 1, 20),
('nist-ai-rmf', 'MP-1.5', 'Map', 'AI Technology Readiness Assessment',
 'Assess the technological readiness and maturity of AI systems before deployment. Evaluate whether the underlying science and engineering are sufficiently advanced for the intended purpose. Consider the track record of similar AI approaches in similar contexts. Identify gaps between current capabilities and deployment requirements. Reference: NIST AI RMF MP-1.5.',
 'P2', 1, 1, 1, 21),
('nist-ai-rmf', 'MP-1.6', 'Map', 'AI Use Case Requirements',
 'Define and document specific requirements for AI systems based on the use case and deployment context. Requirements should address performance (accuracy, latency, throughput), fairness, privacy, security, transparency, and reliability. Establish measurable acceptance criteria for each requirement. Trace requirements through design, development, testing, and deployment. Reference: NIST AI RMF MP-1.6.',
 'P1', 1, 1, 1, 22),
('nist-ai-rmf', 'MP-2.1', 'Map', 'AI System Categorization',
 'Categorize AI systems based on their potential impact, risk level, and criticality. Consider: severity of potential harm, likelihood of harm, breadth of impact, reversibility of outcomes, and vulnerability of affected populations. Use categorization to inform the rigor of risk management activities applied. Document categorization methodology and decisions. Reference: NIST AI RMF MP-2.1.',
 'P1', 1, 1, 1, 23),
('nist-ai-rmf', 'MP-2.2', 'Map', 'AI System Lifecycle Mapping',
 'Map the AI system lifecycle stages and identify risks, actors, and controls relevant to each stage. Lifecycle stages include: problem formulation, data collection and preparation, model building and training, verification and validation, deployment, operation and monitoring, and retirement. Identify transition points and approval gates between stages. Reference: NIST AI RMF MP-2.2.',
 'P1', 1, 1, 1, 24),
('nist-ai-rmf', 'MP-2.3', 'Map', 'AI Data Provenance',
 'Document the provenance, characteristics, and suitability of data used to train, validate, and test AI systems. Include: data sources, collection methodology, sampling strategy, representativeness, known biases, preprocessing steps, labeling procedures, and consent or authorization for use. Assess whether data is suitable for the AI system''s intended purpose and deployment context. Reference: NIST AI RMF MP-2.3.',
 'P1', 1, 1, 1, 25),
('nist-ai-rmf', 'MP-3.1', 'Map', 'AI Benefits Assessment',
 'Assess and document the anticipated benefits of AI systems for users, affected communities, and the organization. Consider benefits across multiple dimensions including efficiency, accuracy, consistency, scalability, and novel capabilities. Compare benefits against alternative approaches (non-AI solutions, status quo). Assess whether benefits are equitably distributed across affected groups. Reference: NIST AI RMF MP-3.1.',
 'P2', 1, 1, 1, 26),
('nist-ai-rmf', 'MP-4.1', 'Map', 'AI Risk Identification',
 'Identify potential risks from AI systems to individuals, groups, communities, organizations, and society. Consider risks across multiple dimensions: physical safety, psychological well-being, economic impact, civil liberties, privacy, fairness, environmental impact, and societal effects. Use multiple risk identification techniques including scenario analysis, red-teaming, stakeholder consultation, and review of analogous systems. Reference: NIST AI RMF MP-4.1.',
 'P1', 1, 1, 1, 27),
('nist-ai-rmf', 'MP-5.1', 'Map', 'Individual and Societal Impact Assessment',
 'Assess the potential impacts of AI systems on individuals and society, considering both intended and unintended consequences. Evaluate impacts on vulnerable and marginalized populations. Consider long-term and systemic effects including labor market impacts, power dynamics, and societal norms. Document impact assessment methodology and findings. Engage affected communities in impact assessment where feasible. Reference: NIST AI RMF MP-5.1.',
 'P1', 1, 1, 1, 28);

-- ============================================================================
-- MEASURE FUNCTION (MS) — 14 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-ai-rmf', 'MS-1.1', 'Measure', 'AI Risk Measurement Approaches',
 'Select and implement appropriate quantitative and qualitative methods for measuring AI risks identified in the MAP function. Measurement methods may include metrics, benchmarks, simulations, red-team exercises, user studies, and expert review. Ensure measurement approaches are valid, reliable, and appropriate for the risk type and AI system context. Document measurement methodology, limitations, and uncertainty. Reference: NIST AI RMF MS-1.1.',
 'P1', 1, 1, 1, 29),
('nist-ai-rmf', 'MS-1.2', 'Measure', 'AI Risk Measurement Standards',
 'Apply appropriate standards, guidelines, and best practices for AI risk measurement. Adopt industry-standard metrics and benchmarks where available. Participate in development of AI risk measurement standards. Ensure measurement approaches are transparent and reproducible. Align measurement practices with organizational risk tolerance and regulatory requirements. Reference: NIST AI RMF MS-1.2.',
 'P2', 1, 1, 1, 30),
('nist-ai-rmf', 'MS-1.3', 'Measure', 'AI Risk Assessment Independence',
 'Ensure AI risk assessments are conducted with appropriate independence from AI development teams. Assessors should have sufficient authority, competence, and access to conduct thorough assessments. Consider internal audit, external review, or independent assessment teams for high-risk systems. Document assessor qualifications and any conflicts of interest. Reference: NIST AI RMF MS-1.3.',
 'P2', 0, 1, 1, 31),
('nist-ai-rmf', 'MS-2.1', 'Measure', 'AI Validity and Reliability Testing',
 'Evaluate AI system validity (correctness of outputs) and reliability (consistency of outputs) using appropriate testing methodologies. Assess generalizability of AI system performance across different populations, conditions, and time periods. Test with representative and challenging datasets. Document validity and reliability metrics, testing conditions, and known failure modes. Reference: NIST AI RMF MS-2.1.',
 'P1', 1, 1, 1, 32),
('nist-ai-rmf', 'MS-2.2', 'Measure', 'AI Safety Assessment',
 'Evaluate AI system safety including potential to cause physical, psychological, or financial harm. Identify hazardous conditions and failure modes. Assess the effectiveness of safety mechanisms, human oversight, and fail-safe behaviors. Test system behavior under adversarial conditions, edge cases, and out-of-distribution inputs. Document safety assessment results and residual risks. Reference: NIST AI RMF MS-2.2.',
 'P1', 1, 1, 1, 33),
('nist-ai-rmf', 'MS-2.3', 'Measure', 'AI Fairness Assessment',
 'Evaluate AI system fairness across relevant demographic groups and protected characteristics. Apply appropriate fairness metrics (demographic parity, equalized odds, predictive parity, individual fairness) based on the deployment context. Assess disparate impact and treatment. Document fairness assessment methodology, results, and any trade-offs between fairness criteria. Engage affected communities in defining fairness criteria. Reference: NIST AI RMF MS-2.3.',
 'P1', 1, 1, 1, 34),
('nist-ai-rmf', 'MS-2.4', 'Measure', 'AI Security and Resilience Testing',
 'Assess AI system security and resilience to adversarial attacks, data manipulation, and system compromise. Conduct adversarial testing including evasion attacks, data poisoning, model extraction, and membership inference. Evaluate system behavior under stress conditions and degraded modes. Implement red-team assessments for high-risk AI systems. Document security posture and resilience characteristics. Reference: NIST AI RMF MS-2.4.',
 'P1', 1, 1, 1, 35),
('nist-ai-rmf', 'MS-2.5', 'Measure', 'AI Explainability Assessment',
 'Evaluate the explainability and interpretability of AI system decisions appropriate to the deployment context and affected persons. Assess whether explanations are understandable, meaningful, and useful to intended audiences (developers, deployers, affected persons, regulators). Test explanation methods for accuracy and faithfulness to actual model behavior. Document the level of explainability achieved and any limitations. Reference: NIST AI RMF MS-2.5.',
 'P1', 1, 1, 1, 36),
('nist-ai-rmf', 'MS-2.6', 'Measure', 'AI Privacy Assessment',
 'Evaluate AI system privacy characteristics including data minimization, purpose limitation, consent management, and protection against privacy attacks (re-identification, inference, data leakage). Assess privacy risks from training data memorization, model outputs, and system logs. Evaluate the effectiveness of privacy-enhancing technologies applied. Document privacy assessment methodology and findings. Reference: NIST AI RMF MS-2.6.',
 'P1', 1, 1, 1, 37),
('nist-ai-rmf', 'MS-2.7', 'Measure', 'AI Transparency Assessment',
 'Evaluate the transparency of AI system development, deployment, and operation. Assess whether relevant information is available to stakeholders about how the system works, its capabilities and limitations, data practices, and impact. Evaluate the accessibility and understandability of transparency disclosures. Document transparency assessment findings and gaps. Reference: NIST AI RMF MS-2.7.',
 'P2', 1, 1, 1, 38),
('nist-ai-rmf', 'MS-2.8', 'Measure', 'AI Accountability Assessment',
 'Evaluate accountability mechanisms for AI systems including traceability of decisions, auditability of processes, and clarity of responsibility. Assess whether AI system actions and outcomes can be traced to specific inputs, processes, and responsible persons. Evaluate the completeness of audit trails and documentation. Document accountability assessment findings. Reference: NIST AI RMF MS-2.8.',
 'P2', 1, 1, 1, 39),
('nist-ai-rmf', 'MS-3.1', 'Measure', 'Continuous AI Risk Monitoring',
 'Implement mechanisms for continuously monitoring AI system performance, risks, and impacts after deployment. Monitor for model drift, concept drift, data distribution changes, fairness degradation, and emerging risks. Define monitoring metrics, thresholds, and alerting criteria. Ensure monitoring covers both technical performance and societal impact. Reference: NIST AI RMF MS-3.1.',
 'P1', 1, 1, 1, 40),
('nist-ai-rmf', 'MS-3.2', 'Measure', 'AI Metrics Tracking and Reporting',
 'Track and report AI risk metrics over time to identify trends, patterns, and emerging risks. Maintain dashboards and reports for different audiences (technical teams, management, governance bodies). Compare metrics against risk tolerances and trigger reviews when thresholds are approached or exceeded. Archive historical metrics for longitudinal analysis. Reference: NIST AI RMF MS-3.2.',
 'P1', 1, 1, 1, 41),
('nist-ai-rmf', 'MS-4.1', 'Measure', 'AI Measurement Effectiveness Review',
 'Regularly review the effectiveness and appropriateness of AI risk measurement approaches. Assess whether measurement methods are detecting risks as intended, whether metrics remain relevant, and whether new measurement techniques should be adopted. Incorporate feedback from stakeholders, incidents, and emerging best practices. Update measurement approaches based on review findings. Reference: NIST AI RMF MS-4.1.',
 'P2', 1, 1, 1, 42);

-- ============================================================================
-- MANAGE FUNCTION (MG) — 12 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('nist-ai-rmf', 'MG-1.1', 'Manage', 'AI Risk Prioritization',
 'Prioritize identified AI risks based on severity, likelihood, breadth of impact, and organizational risk tolerance. Apply a consistent risk prioritization methodology across all AI systems. Consider both immediate and long-term risks. Allocate risk management resources proportionate to risk priority. Document prioritization decisions and rationale. Reference: NIST AI RMF MG-1.1.',
 'P1', 1, 1, 1, 43),
('nist-ai-rmf', 'MG-1.2', 'Manage', 'AI Risk Response Strategy',
 'Define and implement risk response strategies for prioritized AI risks. Response options include: risk elimination (remove feature), risk mitigation (add controls), risk transfer (insurance, contractual), risk acceptance (with documentation), and risk avoidance (do not deploy). Select response strategies based on effectiveness, feasibility, cost, and impact on AI system utility. Reference: NIST AI RMF MG-1.2.',
 'P1', 1, 1, 1, 44),
('nist-ai-rmf', 'MG-1.3', 'Manage', 'AI Risk Response Implementation',
 'Implement selected AI risk response actions and verify their effectiveness. Ensure risk responses do not introduce new risks or disproportionately degrade AI system performance. Track implementation progress and timeline. Test risk responses through appropriate validation methods. Document implemented risk responses and evidence of effectiveness. Reference: NIST AI RMF MG-1.3.',
 'P1', 1, 1, 1, 45),
('nist-ai-rmf', 'MG-1.4', 'Manage', 'Residual AI Risk Acceptance',
 'Document and obtain appropriate approval for residual AI risks that remain after risk response implementation. Residual risk acceptance must be commensurate with organizational risk tolerance and the authority level of the approver. Communicate residual risks to relevant stakeholders including deployers and affected persons where appropriate. Review residual risk acceptances periodically. Reference: NIST AI RMF MG-1.4.',
 'P1', 1, 1, 1, 46),
('nist-ai-rmf', 'MG-2.1', 'Manage', 'AI Benefits and Risk Optimization',
 'Implement strategies to maximize AI system benefits while minimizing risks. Continuously assess the benefit-risk balance throughout the AI system lifecycle. If risks outweigh benefits for any affected group, consider system modification, additional safeguards, scope reduction, or discontinuation. Document benefit-risk analysis and optimization decisions. Reference: NIST AI RMF MG-2.1.',
 'P1', 1, 1, 1, 47),
('nist-ai-rmf', 'MG-2.2', 'Manage', 'AI Incident Response',
 'Establish and maintain AI-specific incident response procedures that address AI system failures, harmful outputs, adversarial attacks, and unintended consequences. Define incident severity levels, response procedures, escalation paths, and communication plans. Conduct post-incident reviews and implement corrective actions. Test incident response procedures through exercises. Reference: NIST AI RMF MG-2.2.',
 'P1', 1, 1, 1, 48),
('nist-ai-rmf', 'MG-2.3', 'Manage', 'AI System Rollback and Discontinuation',
 'Establish procedures for rolling back or discontinuing AI systems when risks exceed acceptable levels or when incidents require immediate action. Define criteria and thresholds that trigger rollback or discontinuation. Ensure affected users and stakeholders are notified. Implement technical capabilities for orderly system shutdown with minimal disruption. Document rollback and discontinuation events. Reference: NIST AI RMF MG-2.3.',
 'P1', 1, 1, 1, 49),
('nist-ai-rmf', 'MG-2.4', 'Manage', 'AI Human Oversight Implementation',
 'Implement human oversight mechanisms commensurate with AI system risk level and deployment context. Define when human review, approval, or intervention is required. Ensure humans can effectively monitor, understand, and override AI system behavior. Prevent automation bias through training, system design, and process controls. Evaluate the effectiveness of human oversight regularly. Reference: NIST AI RMF MG-2.4.',
 'P1', 1, 1, 1, 50),
('nist-ai-rmf', 'MG-2.5', 'Manage', 'AI Change Management',
 'Implement change management procedures for AI system modifications including model retraining, data updates, parameter changes, and deployment environment changes. Assess the impact of changes on AI system performance, fairness, safety, and compliance. Re-validate AI systems after significant changes. Maintain change logs and version control. Reference: NIST AI RMF MG-2.5.',
 'P1', 1, 1, 1, 51),
('nist-ai-rmf', 'MG-3.1', 'Manage', 'Third-Party AI Risk Management',
 'Manage risks from third-party AI systems, components, and services throughout their lifecycle. Monitor third-party AI performance against agreed requirements. Maintain audit rights and transparency requirements in contracts. Assess changes to third-party AI systems for impact on organizational risk. Implement fallback plans for third-party AI system failures or discontinuation. Reference: NIST AI RMF MG-3.1.',
 'P1', 1, 1, 1, 52),
('nist-ai-rmf', 'MG-4.1', 'Manage', 'AI Risk Treatment Documentation',
 'Document all AI risk treatments including rationale, implementation details, responsible parties, timelines, and evidence of effectiveness. Maintain a risk treatment register that maps identified risks to treatment actions and residual risk levels. Ensure documentation is accessible to relevant stakeholders and audit functions. Update documentation when risk treatments are modified. Reference: NIST AI RMF MG-4.1.',
 'P1', 1, 1, 1, 53),
('nist-ai-rmf', 'MG-4.2', 'Manage', 'AI Risk Communication',
 'Communicate AI risk information to relevant stakeholders in a timely, clear, and appropriate manner. Tailor risk communications to the audience (technical staff, management, users, affected persons, regulators). Include information about identified risks, risk management actions, residual risks, and ongoing monitoring. Establish feedback channels to ensure risk communications are understood and acted upon. Reference: NIST AI RMF MG-4.2.',
 'P2', 1, 1, 1, 54);

-- ============================================================================
-- CROSSWALK MAPPINGS — NIST AI RMF to NIST 800-53 R5
-- ============================================================================

INSERT OR REPLACE INTO control_crosswalks (source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence, notes) VALUES
('nist-ai-rmf', 'GV-1.1', 'nist-800-53-r5', 'PM-1', 'partial', 0.80, 'AI legal/regulatory compliance maps to NIST Program Management policy'),
('nist-ai-rmf', 'GV-1.2', 'nist-800-53-r5', 'PM-1', 'partial', 0.80, 'AI risk management policy maps to NIST Information Security and Privacy Program Plan'),
('nist-ai-rmf', 'GV-2.1', 'nist-800-53-r5', 'PM-2', 'partial', 0.80, 'AI roles and responsibilities map to NIST Program Leadership Role'),
('nist-ai-rmf', 'GV-3.1', 'nist-800-53-r5', 'AT-2', 'partial', 0.70, 'Workforce diversity for AI relates to NIST Literacy Training and Awareness'),
('nist-ai-rmf', 'GV-6.1', 'nist-800-53-r5', 'SA-9', 'partial', 0.80, 'Third-party AI risk maps to NIST External System Services'),
('nist-ai-rmf', 'MP-1.1', 'nist-800-53-r5', 'SA-5', 'partial', 0.75, 'AI purpose documentation maps to NIST System Documentation'),
('nist-ai-rmf', 'MP-2.1', 'nist-800-53-r5', 'RA-2', 'partial', 0.80, 'AI system categorization maps to NIST Security Categorization'),
('nist-ai-rmf', 'MP-2.3', 'nist-800-53-r5', 'SA-8', 'partial', 0.70, 'AI data provenance maps to NIST Security Engineering Principles'),
('nist-ai-rmf', 'MP-4.1', 'nist-800-53-r5', 'RA-3', 'equivalent', 0.85, 'AI risk identification maps to NIST Risk Assessment'),
('nist-ai-rmf', 'MP-5.1', 'nist-800-53-r5', 'RA-8', 'partial', 0.75, 'AI societal impact assessment maps to NIST Privacy Impact Assessment'),
('nist-ai-rmf', 'MS-2.1', 'nist-800-53-r5', 'CA-2', 'partial', 0.80, 'AI validity testing maps to NIST Control Assessments'),
('nist-ai-rmf', 'MS-2.4', 'nist-800-53-r5', 'CA-8', 'partial', 0.75, 'AI security testing maps to NIST Penetration Testing'),
('nist-ai-rmf', 'MS-2.6', 'nist-800-53-r5', 'PT-2', 'partial', 0.70, 'AI privacy assessment relates to NIST Authority to Process PII'),
('nist-ai-rmf', 'MS-3.1', 'nist-800-53-r5', 'SI-4', 'partial', 0.75, 'Continuous AI monitoring maps to NIST System Monitoring'),
('nist-ai-rmf', 'MG-1.1', 'nist-800-53-r5', 'RA-3', 'partial', 0.80, 'AI risk prioritization maps to NIST Risk Assessment'),
('nist-ai-rmf', 'MG-2.2', 'nist-800-53-r5', 'IR-8', 'partial', 0.80, 'AI incident response maps to NIST Incident Response Plan'),
('nist-ai-rmf', 'MG-2.2', 'nist-800-53-r5', 'IR-4', 'partial', 0.80, 'AI incident response maps to NIST Incident Handling'),
('nist-ai-rmf', 'MG-2.4', 'nist-800-53-r5', 'PM-2', 'partial', 0.70, 'AI human oversight maps to NIST Program Leadership Role'),
('nist-ai-rmf', 'MG-2.5', 'nist-800-53-r5', 'CM-3', 'partial', 0.80, 'AI change management maps to NIST Configuration Change Control'),
('nist-ai-rmf', 'MG-3.1', 'nist-800-53-r5', 'SA-9', 'equivalent', 0.80, 'Third-party AI risk management maps to NIST External System Services'),
('nist-ai-rmf', 'MG-4.1', 'nist-800-53-r5', 'PM-28', 'partial', 0.75, 'AI risk treatment documentation maps to NIST Risk Framing');

-- ============================================================================
-- TRACK MIGRATION
-- ============================================================================
INSERT OR IGNORE INTO schema_migrations (version, name, description) VALUES
  ('migrate-033-nist-ai-rmf-framework', 'nist-ai-rmf-framework', 'NIST AI Risk Management Framework (AI 100-1) with 54 controls and crosswalks to NIST 800-53 R5');
