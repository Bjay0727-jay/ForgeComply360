-- ============================================================================
-- FORGECOMPLY 360 - D1 DATABASE SCHEMA v5.1
-- Forge Cyber Defense - SDVOSB
-- Single Engine, Multiple Experiences Architecture
-- ============================================================================

-- ============================================================================
-- SCHEMA MIGRATIONS TRACKING
-- Must be first table - tracks which migrations have been applied
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  version TEXT NOT NULL UNIQUE,           -- e.g., '001', '012', 'v1.0.0'
  name TEXT NOT NULL,                       -- Human-readable migration name
  description TEXT,                         -- Brief description of changes
  applied_at TEXT DEFAULT (datetime('now')),
  applied_by TEXT,                          -- User/system that applied migration
  checksum TEXT,                            -- Optional SHA256 of migration file
  execution_time_ms INTEGER,                -- How long the migration took
  success INTEGER DEFAULT 1                 -- 0 = failed/rolled back
);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations(version);
CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied ON schema_migrations(applied_at);

-- ============================================================================
-- ORGANIZATIONS & TENANCY
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  industry TEXT,
  size TEXT,
  experience_type TEXT DEFAULT 'enterprise' CHECK (experience_type IN ('federal', 'enterprise', 'healthcare', 'custom')),
  settings TEXT DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'professional', 'enterprise', 'federal')),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled')),
  trial_ends_at TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  max_frameworks INTEGER DEFAULT 1,
  max_systems INTEGER DEFAULT 3,
  max_users INTEGER DEFAULT 5,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'analyst' CHECK (role IN ('viewer', 'analyst', 'manager', 'admin', 'owner')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deactivated')),
  mfa_enabled INTEGER DEFAULT 0,
  mfa_secret TEXT,
  mfa_backup_codes TEXT,
  onboarding_completed INTEGER DEFAULT 0,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TEXT,
  last_login_at TEXT,
  -- migrate-015: notification polling support
  notification_version INTEGER DEFAULT 0,
  notification_last_check TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  revoked INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- ============================================================================
-- EXPERIENCE LAYER CONFIGURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS experience_configs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  experience_type TEXT NOT NULL UNIQUE CHECK (experience_type IN ('federal', 'enterprise', 'healthcare', 'custom')),
  display_name TEXT NOT NULL,
  terminology TEXT NOT NULL DEFAULT '{}',
  default_workflow TEXT NOT NULL DEFAULT '{}',
  dashboard_widgets TEXT NOT NULL DEFAULT '[]',
  nav_labels TEXT NOT NULL DEFAULT '{}',
  doc_templates TEXT NOT NULL DEFAULT '[]',
  theme_overrides TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================================
-- COMPLIANCE FRAMEWORKS (Data-Driven Registry)
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_frameworks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('federal', 'defense', 'healthcare', 'commercial', 'privacy', 'critical_infrastructure')),
  description TEXT,
  control_count INTEGER DEFAULT 0,
  control_families TEXT DEFAULT '[]',
  assessment_methodology TEXT,
  governing_body TEXT,
  effective_date TEXT,
  sunset_date TEXT,
  parent_framework_id TEXT REFERENCES compliance_frameworks(id),
  metadata TEXT DEFAULT '{}',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_frameworks_category ON compliance_frameworks(category);

-- Skeleton framework rows — migrations reference these as FK targets in crosswalks.
-- Seed data (INSERT OR REPLACE) will overwrite these with full definitions.
INSERT OR IGNORE INTO compliance_frameworks (id, name, version, category, description, control_count, governing_body, assessment_methodology) VALUES
('nist-800-53-r5', 'NIST SP 800-53 Rev 5', '5.1.1', 'federal', 'Placeholder — full definition in seed data', 0, 'NIST', 'NIST RMF'),
('fedramp-low', 'FedRAMP Low', '5.0', 'federal', 'Placeholder', 0, 'FedRAMP PMO', 'FedRAMP Assessment'),
('fedramp-moderate', 'FedRAMP Moderate', '5.0', 'federal', 'Placeholder', 0, 'FedRAMP PMO', 'FedRAMP Assessment'),
('fedramp-high', 'FedRAMP High', '5.0', 'federal', 'Placeholder', 0, 'FedRAMP PMO', 'FedRAMP Assessment'),
('stateramp', 'StateRAMP', '2.0', 'federal', 'Placeholder', 0, 'StateRAMP PMO', 'StateRAMP Assessment'),
('cmmc-l2', 'CMMC Level 2', '2.0', 'defense', 'Placeholder', 0, 'DoD CIO', 'C3PAO Assessment'),
('cmmc-l3', 'CMMC Level 3', '2.0', 'defense', 'Placeholder', 0, 'DoD CIO', 'DIBCAC Assessment'),
('nist-800-171-r3', 'NIST SP 800-171 Rev 3', '3.0', 'defense', 'Placeholder', 0, 'NIST', 'NIST Assessment'),
('hipaa', 'HIPAA Security Rule', '2013', 'healthcare', 'Placeholder', 0, 'HHS OCR', 'HIPAA Audit'),
('soc2-type2', 'SOC 2 Type II', '2017', 'commercial', 'Placeholder', 0, 'AICPA', 'SOC 2 Examination'),
('iso-27001', 'ISO/IEC 27001:2022', '2022', 'commercial', 'Placeholder', 0, 'ISO/IEC', 'ISO Audit');

-- ============================================================================
-- SECURITY CONTROLS
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_controls (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  framework_id TEXT NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
  control_id TEXT NOT NULL,
  family TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  guidance TEXT,
  priority TEXT CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
  baseline_low INTEGER DEFAULT 0,
  baseline_moderate INTEGER DEFAULT 0,
  baseline_high INTEGER DEFAULT 0,
  is_enhancement INTEGER DEFAULT 0,
  parent_control_id TEXT,
  sort_order INTEGER DEFAULT 0,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_controls_framework ON security_controls(framework_id);
CREATE INDEX IF NOT EXISTS idx_controls_family ON security_controls(family);
CREATE INDEX IF NOT EXISTS idx_controls_control_id ON security_controls(control_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_controls_unique ON security_controls(framework_id, control_id);

-- ============================================================================
-- CROSSWALK ENGINE (Control Mapping Across Frameworks)
-- ============================================================================

CREATE TABLE IF NOT EXISTS control_crosswalks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  source_framework_id TEXT NOT NULL REFERENCES compliance_frameworks(id),
  source_control_id TEXT NOT NULL,
  target_framework_id TEXT NOT NULL REFERENCES compliance_frameworks(id),
  target_control_id TEXT NOT NULL,
  mapping_type TEXT DEFAULT 'equivalent' CHECK (mapping_type IN ('equivalent', 'partial', 'superset', 'subset', 'related')),
  confidence REAL DEFAULT 1.0,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_crosswalk_source ON control_crosswalks(source_framework_id, source_control_id);
CREATE INDEX IF NOT EXISTS idx_crosswalk_target ON control_crosswalks(target_framework_id, target_control_id);

-- ============================================================================
-- ORGANIZATION FRAMEWORKS (License-Gated)
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_frameworks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework_id TEXT NOT NULL REFERENCES compliance_frameworks(id),
  enabled INTEGER DEFAULT 1,
  is_primary INTEGER DEFAULT 0,
  enabled_at TEXT DEFAULT (datetime('now')),
  UNIQUE(org_id, framework_id)
);

CREATE INDEX IF NOT EXISTS idx_org_frameworks ON organization_frameworks(org_id);

-- ============================================================================
-- INFORMATION SYSTEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS systems (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  acronym TEXT,
  description TEXT,
  impact_level TEXT DEFAULT 'moderate' CHECK (impact_level IN ('low', 'moderate', 'high')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'under_review', 'authorized', 'denied', 'decommissioned')),
  authorization_date TEXT,
  authorization_expiry TEXT,
  system_owner TEXT,
  authorizing_official TEXT,
  security_officer TEXT,
  boundary_description TEXT,
  deployment_model TEXT CHECK (deployment_model IN ('cloud', 'on_premises', 'hybrid', 'government_cloud')),
  service_model TEXT CHECK (service_model IN ('IaaS', 'PaaS', 'SaaS', 'other')),
  metadata TEXT DEFAULT '{}',
  -- migrate-011: RMF authorization boundary fields
  boundary_type TEXT CHECK (boundary_type IN ('major_application', 'general_support', 'enclave', 'cloud_service', 'hybrid')),
  authorization_type TEXT CHECK (authorization_type IN ('ato', 'iatt', 'dato', 'pato', 'fedramp', 'fedramp_moderate', 'fedramp_high', 'stateramp')),
  ao_organization TEXT,
  security_categorization TEXT CHECK (security_categorization IN ('low', 'moderate', 'high')),
  impact_level_confidentiality TEXT CHECK (impact_level_confidentiality IN ('low', 'moderate', 'high')),
  impact_level_integrity TEXT CHECK (impact_level_integrity IN ('low', 'moderate', 'high')),
  impact_level_availability TEXT CHECK (impact_level_availability IN ('low', 'moderate', 'high')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_systems_org ON systems(org_id);

-- ============================================================================
-- CONTROL IMPLEMENTATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS control_implementations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  framework_id TEXT NOT NULL REFERENCES compliance_frameworks(id),
  control_id TEXT NOT NULL,
  status TEXT DEFAULT 'not_implemented' CHECK (status IN ('implemented', 'partially_implemented', 'planned', 'alternative', 'not_applicable', 'not_implemented')),
  implementation_description TEXT,
  responsible_role TEXT,
  implementation_date TEXT,
  last_assessed_date TEXT,
  assessment_result TEXT CHECK (assessment_result IN ('satisfied', 'other_than_satisfied', 'not_assessed')),
  risk_level TEXT CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
  inherited INTEGER DEFAULT 0,
  inherited_from TEXT,
  ai_narrative TEXT,
  ai_narrative_generated_at TEXT,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_impl_org ON control_implementations(org_id);
CREATE INDEX IF NOT EXISTS idx_impl_system ON control_implementations(system_id);
CREATE INDEX IF NOT EXISTS idx_impl_framework ON control_implementations(framework_id);
CREATE INDEX IF NOT EXISTS idx_impl_status ON control_implementations(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_impl_unique ON control_implementations(system_id, framework_id, control_id);
CREATE INDEX IF NOT EXISTS idx_impl_inherited ON control_implementations(inherited, inherited_from);

-- ============================================================================
-- EVIDENCE VAULT
-- ============================================================================

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  sha256_hash TEXT NOT NULL,
  uploaded_by TEXT NOT NULL REFERENCES users(id),
  collection_date TEXT,
  expiry_date TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'expired', 'superseded')),
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_evidence_org ON evidence(org_id);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON evidence(status);

CREATE TABLE IF NOT EXISTS evidence_control_links (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  evidence_id TEXT NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  implementation_id TEXT NOT NULL REFERENCES control_implementations(id) ON DELETE CASCADE,
  linked_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(evidence_id, implementation_id)
);

-- ============================================================================
-- PLAN OF ACTION & MILESTONES (POA&M)
-- ============================================================================

CREATE TABLE IF NOT EXISTS poams (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  poam_id TEXT NOT NULL,
  weakness_name TEXT NOT NULL,
  weakness_description TEXT,
  control_id TEXT,
  framework_id TEXT,
  risk_level TEXT DEFAULT 'moderate' CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'in_progress', 'verification', 'completed', 'accepted', 'deferred')),
  scheduled_completion TEXT,
  actual_completion TEXT,
  milestones TEXT DEFAULT '[]',
  responsible_party TEXT,
  resources_required TEXT,
  vendor_dependency INTEGER DEFAULT 0,
  cost_estimate REAL,
  comments TEXT,
  assigned_to TEXT REFERENCES users(id),
  created_by TEXT REFERENCES users(id),
  -- migrate-010: CMMC/RMF data classification and deviation tracking
  data_classification TEXT,
  cui_category TEXT,
  risk_register_id TEXT REFERENCES risks(id) ON DELETE SET NULL,
  impact_confidentiality TEXT,
  impact_integrity TEXT,
  impact_availability TEXT,
  deviation_type TEXT,
  deviation_rationale TEXT,
  deviation_approved_by TEXT REFERENCES users(id),
  deviation_approved_at TEXT,
  deviation_expires_at TEXT,
  deviation_review_frequency TEXT,
  deviation_next_review TEXT,
  compensating_control_description TEXT,
  -- migrate-011: asset ownership
  asset_owner_id TEXT REFERENCES users(id),
  asset_owner_name TEXT,
  -- migrate-012: OSCAL and vendor linkage
  oscal_uuid TEXT,
  oscal_poam_item_id TEXT,
  related_observations TEXT DEFAULT '[]',
  related_risks TEXT DEFAULT '[]',
  vendor_id TEXT REFERENCES vendors(id) ON DELETE SET NULL,
  vendor_dependency_notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_poams_org ON poams(org_id);
CREATE INDEX IF NOT EXISTS idx_poams_system ON poams(system_id);
CREATE INDEX IF NOT EXISTS idx_poams_status ON poams(status);
CREATE INDEX IF NOT EXISTS idx_poams_assigned ON poams(assigned_to);

-- POA&M Milestones (proper tracking table replacing JSON milestones field)
CREATE TABLE IF NOT EXISTS poam_milestones (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  poam_id TEXT NOT NULL REFERENCES poams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_date TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completion_date TEXT,
  -- migrate-010: milestone detail tracking
  description TEXT,
  sequence_number INTEGER DEFAULT 1,
  progress_percentage INTEGER DEFAULT 0,
  responsible_party TEXT REFERENCES users(id),
  evidence_id TEXT REFERENCES evidence(id) ON DELETE SET NULL,
  blocked_reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_poam_milestones_poam ON poam_milestones(poam_id);

-- POA&M Comments (timestamped, user-attributed)
CREATE TABLE IF NOT EXISTS poam_comments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  poam_id TEXT NOT NULL REFERENCES poams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_poam_comments_poam ON poam_comments(poam_id);

-- ============================================================================
-- SSP DOCUMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ssp_documents (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  framework_id TEXT NOT NULL REFERENCES compliance_frameworks(id),
  title TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'published', 'archived')),
  oscal_json TEXT,
  generated_by TEXT REFERENCES users(id),
  approved_by TEXT,
  approved_at TEXT,
  published_at TEXT,
  metadata TEXT DEFAULT '{}',
  -- migrate-020: FISMA SSP support
  ssp_type TEXT DEFAULT 'standard' CHECK (ssp_type IN ('standard', 'fisma')),
  rmf_step TEXT,
  target_ato_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ssp_org ON ssp_documents(org_id);
CREATE INDEX IF NOT EXISTS idx_ssp_system ON ssp_documents(system_id);

-- ============================================================================
-- CONTINUOUS MONITORING (ControlPulse CCM)
-- ============================================================================

CREATE TABLE IF NOT EXISTS monitoring_checks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  control_id TEXT NOT NULL,
  framework_id TEXT NOT NULL,
  check_type TEXT NOT NULL CHECK (check_type IN ('automated', 'manual', 'hybrid')),
  check_name TEXT NOT NULL,
  check_description TEXT,
  frequency TEXT DEFAULT 'monthly' CHECK (frequency IN ('continuous', 'daily', 'weekly', 'monthly', 'quarterly', 'annually')),
  last_run_at TEXT,
  last_result TEXT CHECK (last_result IN ('pass', 'fail', 'warning', 'error', 'not_run')),
  last_result_details TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_monitoring_org ON monitoring_checks(org_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_system ON monitoring_checks(system_id);

-- ============================================================================
-- RISK REGISTER (RiskForge ERM)
-- ============================================================================

CREATE TABLE IF NOT EXISTS risks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  system_id TEXT REFERENCES systems(id),
  risk_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('technical', 'operational', 'compliance', 'financial', 'reputational', 'strategic')),
  likelihood INTEGER CHECK (likelihood BETWEEN 1 AND 5),
  impact INTEGER CHECK (impact BETWEEN 1 AND 5),
  risk_score INTEGER GENERATED ALWAYS AS (likelihood * impact) STORED,
  risk_level TEXT,
  treatment TEXT DEFAULT 'mitigate' CHECK (treatment IN ('accept', 'mitigate', 'transfer', 'avoid')),
  treatment_plan TEXT,
  treatment_due_date TEXT,
  owner TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_treatment', 'monitored', 'closed', 'accepted')),
  related_controls TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_risks_org ON risks(org_id);

-- ============================================================================
-- VENDOR MANAGEMENT (VendorGuard TPRM)
-- ============================================================================

CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  criticality TEXT DEFAULT 'medium' CHECK (criticality IN ('low', 'medium', 'high', 'critical')),
  risk_tier INTEGER DEFAULT 2 CHECK (risk_tier BETWEEN 1 AND 4),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'under_review', 'approved', 'suspended', 'terminated')),
  contact_name TEXT,
  contact_email TEXT,
  contract_start TEXT,
  contract_end TEXT,
  last_assessment_date TEXT,
  next_assessment_date TEXT,
  overall_risk_score INTEGER,
  data_classification TEXT,
  has_baa INTEGER DEFAULT 0,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_vendors_org ON vendors(org_id);

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL,
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details TEXT DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  integrity_hash TEXT,
  prev_hash TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_integrity ON audit_logs(org_id, created_at, integrity_hash);

-- ============================================================================
-- NOTIFICATIONS & ALERTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  recipient_user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details TEXT DEFAULT '{}',
  is_read INTEGER DEFAULT 0,
  read_at TEXT,
  email_sent INTEGER DEFAULT 0,
  -- migrate-015: notification enhancements
  priority TEXT DEFAULT 'normal',
  batch_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notif_recipient ON notifications(recipient_user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_org ON notifications(org_id);
CREATE INDEX IF NOT EXISTS idx_notif_email_digest ON notifications(recipient_user_id, email_sent, created_at DESC);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  poam_update INTEGER DEFAULT 1,
  risk_alert INTEGER DEFAULT 1,
  monitoring_fail INTEGER DEFAULT 1,
  control_change INTEGER DEFAULT 1,
  role_change INTEGER DEFAULT 1,
  compliance_alert INTEGER DEFAULT 1,
  evidence_upload INTEGER DEFAULT 1,
  approval_request INTEGER DEFAULT 1,
  approval_decision INTEGER DEFAULT 1,
  evidence_reminder INTEGER DEFAULT 1,
  evidence_expiry INTEGER DEFAULT 1,
  email_digest INTEGER DEFAULT 1,
  last_digest_sent_at TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================================
-- APPROVAL WORKFLOWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS approval_requests (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('poam_closure', 'risk_acceptance', 'ssp_publication')),
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  requested_by TEXT NOT NULL REFERENCES users(id),
  requested_at TEXT DEFAULT (datetime('now')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  justification TEXT,
  reviewer_id TEXT REFERENCES users(id),
  reviewed_at TEXT,
  reviewer_comment TEXT,
  target_status TEXT NOT NULL,
  snapshot TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_approvals_org ON approval_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approval_requests(org_id, status);
CREATE INDEX IF NOT EXISTS idx_approvals_resource ON approval_requests(resource_type, resource_id);

-- ============================================================================
-- ADD-ON MODULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS addon_modules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly REAL,
  features TEXT DEFAULT '[]',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS organization_addons (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  addon_id TEXT NOT NULL REFERENCES addon_modules(id),
  enabled INTEGER DEFAULT 1,
  enabled_at TEXT DEFAULT (datetime('now')),
  UNIQUE(org_id, addon_id)
);

-- ============================================================================
-- FORGEML AI WRITER
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_templates (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('control_narrative', 'poam', 'risk', 'executive', 'gap_analysis', 'audit_response', 'vendor', 'custom')),
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  variables TEXT DEFAULT '[]',
  is_builtin INTEGER DEFAULT 0,
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_templates_org ON ai_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_templates_category ON ai_templates(category);

CREATE TABLE IF NOT EXISTS ai_documents (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  system_id TEXT REFERENCES systems(id),
  template_id TEXT REFERENCES ai_templates(id),
  template_type TEXT NOT NULL,
  title TEXT NOT NULL,
  prompt_used TEXT,
  generated_content TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'archived')),
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_docs_org ON ai_documents(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_docs_system ON ai_documents(system_id);
CREATE INDEX IF NOT EXISTS idx_ai_docs_template ON ai_documents(template_type);

-- ============================================================================
-- MONITORING CHECK RESULTS (ControlPulse)
-- ============================================================================

CREATE TABLE IF NOT EXISTS monitoring_check_results (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  check_id TEXT NOT NULL REFERENCES monitoring_checks(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  result TEXT NOT NULL CHECK (result IN ('pass', 'fail', 'warning', 'error')),
  notes TEXT,
  run_by TEXT NOT NULL REFERENCES users(id),
  run_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_check_results_check ON monitoring_check_results(check_id);
CREATE INDEX IF NOT EXISTS idx_check_results_org ON monitoring_check_results(org_id);

-- ============================================================================
-- COMPLIANCE SNAPSHOTS (Dashboard Analytics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_snapshots (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  framework_id TEXT NOT NULL REFERENCES compliance_frameworks(id),
  snapshot_date TEXT NOT NULL,
  total_controls INTEGER DEFAULT 0,
  implemented INTEGER DEFAULT 0,
  partially_implemented INTEGER DEFAULT 0,
  planned INTEGER DEFAULT 0,
  not_applicable INTEGER DEFAULT 0,
  not_implemented INTEGER DEFAULT 0,
  compliance_percentage REAL DEFAULT 0,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(org_id, system_id, framework_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_org ON compliance_snapshots(org_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON compliance_snapshots(snapshot_date);

-- ============================================================================
-- EVIDENCE SCHEDULING & REMINDERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS evidence_schedules (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cadence TEXT NOT NULL CHECK (cadence IN ('weekly', 'monthly', 'quarterly', 'annually', 'custom')),
  custom_interval_days INTEGER,
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  control_ids TEXT DEFAULT '[]',
  next_due_date TEXT NOT NULL,
  last_completed_date TEXT,
  is_active INTEGER DEFAULT 1,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_evidence_schedules_org ON evidence_schedules(org_id);
CREATE INDEX IF NOT EXISTS idx_evidence_schedules_owner ON evidence_schedules(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_schedules_next_due ON evidence_schedules(next_due_date);
CREATE INDEX IF NOT EXISTS idx_evidence_schedules_active ON evidence_schedules(is_active);

-- ============================================================================
-- AUDIT PREPARATION CHECKLIST
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_checklist_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'custom',
  assigned_to TEXT REFERENCES users(id),
  due_date TEXT,
  completed INTEGER DEFAULT 0,
  completed_at TEXT,
  completed_by TEXT REFERENCES users(id),
  sort_order INTEGER DEFAULT 0,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_checklist_org ON audit_checklist_items(org_id);

-- ============================================================================
-- POLICY & PROCEDURE LIBRARY
-- ============================================================================

CREATE TABLE IF NOT EXISTS policies (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('security', 'privacy', 'acceptable_use', 'incident_response', 'access_control', 'business_continuity', 'data_management', 'custom')),
  description TEXT,
  content TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'published', 'archived', 'expired')),
  version TEXT DEFAULT '1.0',
  effective_date TEXT,
  review_date TEXT,
  owner_id TEXT REFERENCES users(id),
  metadata TEXT DEFAULT '{}',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_policies_org ON policies(org_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(org_id, status);
CREATE INDEX IF NOT EXISTS idx_policies_category ON policies(org_id, category);
CREATE INDEX IF NOT EXISTS idx_policies_review_date ON policies(review_date);

CREATE TABLE IF NOT EXISTS policy_attestations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  policy_id TEXT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  policy_version TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'attested', 'overdue')),
  attested_at TEXT,
  requested_at TEXT DEFAULT (datetime('now')),
  due_date TEXT,
  requested_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(policy_id, user_id, policy_version)
);

CREATE INDEX IF NOT EXISTS idx_attestations_policy ON policy_attestations(policy_id);
CREATE INDEX IF NOT EXISTS idx_attestations_user ON policy_attestations(user_id, status);

CREATE TABLE IF NOT EXISTS policy_control_links (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  policy_id TEXT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  implementation_id TEXT NOT NULL REFERENCES control_implementations(id) ON DELETE CASCADE,
  linked_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(policy_id, implementation_id)
);

CREATE INDEX IF NOT EXISTS idx_policy_control_links_policy ON policy_control_links(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_control_links_impl ON policy_control_links(implementation_id);

-- ============================================================================
-- PASSWORD HISTORY (TAC-003 / NIST IA-5)
-- ============================================================================

CREATE TABLE IF NOT EXISTS password_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id, created_at DESC);

-- ============================================================================
-- SECURITY INCIDENTS (TAC-006 / NIST IR)
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_incidents (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  source_ip TEXT,
  affected_user_id TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'contained', 'resolved', 'closed')),
  detected_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT,
  dir_notified INTEGER DEFAULT 0,
  dir_notification_deadline TEXT,
  details TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_security_incidents_org ON security_incidents(org_id, status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_type ON security_incidents(incident_type, detected_at);

-- ============================================================================
-- ASSETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  system_id TEXT REFERENCES systems(id),
  hostname TEXT,
  ip_address TEXT,
  mac_address TEXT,
  fqdn TEXT,
  netbios_name TEXT,
  os_type TEXT,
  asset_type TEXT,
  discovery_source TEXT,
  scan_credentialed INTEGER DEFAULT 0,
  open_ports TEXT,
  environment TEXT,
  boundary_id TEXT,
  data_zone TEXT,
  first_seen_at TEXT,
  last_seen_at TEXT,
  risk_score INTEGER DEFAULT 0,
  risk_score_updated_at TEXT,
  servicenow_sys_id TEXT,
  servicenow_class TEXT,
  servicenow_sync_connector_id TEXT,
  servicenow_last_synced_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_assets_org ON assets(org_id);
CREATE INDEX IF NOT EXISTS idx_assets_system ON assets(system_id);
CREATE INDEX IF NOT EXISTS idx_assets_hostname ON assets(hostname);
CREATE INDEX IF NOT EXISTS idx_assets_ip ON assets(ip_address);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_first_seen ON assets(first_seen_at);
CREATE INDEX IF NOT EXISTS idx_assets_risk_score ON assets(risk_score DESC);

-- ============================================================================
-- SCAN IMPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS scan_imports (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  system_id TEXT REFERENCES systems(id),
  scanner_type TEXT,
  file_name TEXT,
  file_hash TEXT,
  file_path TEXT,
  status TEXT DEFAULT 'pending',
  imported_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_scan_imports_org ON scan_imports(org_id);
CREATE INDEX IF NOT EXISTS idx_scan_imports_hash ON scan_imports(file_hash);

-- ============================================================================
-- VULNERABILITY FINDINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS vulnerability_findings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id TEXT REFERENCES assets(id),
  scan_import_id TEXT REFERENCES scan_imports(id),
  scan_id TEXT,
  plugin_id TEXT,
  plugin_name TEXT,
  plugin_family TEXT,
  port INTEGER,
  protocol TEXT,
  title TEXT,
  description TEXT,
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  cvss_score REAL,
  cvss3_score REAL,
  cvss3_vector TEXT,
  affected_component TEXT,
  remediation_guidance TEXT,
  plugin_output TEXT,
  exploit_available INTEGER DEFAULT 0,
  see_also TEXT,
  control_mappings TEXT DEFAULT '[]',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'remediated', 'accepted', 'false_positive')),
  first_seen_at TEXT DEFAULT (datetime('now')),
  last_seen_at TEXT DEFAULT (datetime('now')),
  related_poam_id TEXT REFERENCES poams(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_vuln_org ON vulnerability_findings(org_id);
CREATE INDEX IF NOT EXISTS idx_vuln_asset ON vulnerability_findings(asset_id);
CREATE INDEX IF NOT EXISTS idx_vuln_severity ON vulnerability_findings(severity);
CREATE INDEX IF NOT EXISTS idx_vuln_status ON vulnerability_findings(status);
CREATE INDEX IF NOT EXISTS idx_vuln_scan ON vulnerability_findings(scan_import_id);
CREATE INDEX IF NOT EXISTS idx_vuln_poam ON vulnerability_findings(related_poam_id);

-- ============================================================================
-- SECURITY ALERTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_alerts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  alert_rule_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  source TEXT,
  source_event_id TEXT,
  affected_assets TEXT DEFAULT '[]',
  indicators TEXT DEFAULT '[]',
  raw_event TEXT DEFAULT '{}',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'investigating', 'resolved', 'false_positive')),
  assigned_to TEXT REFERENCES users(id),
  resolution_notes TEXT,
  resolved_at TEXT,
  related_incident_id TEXT,
  related_poams TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_alerts_org ON security_alerts(org_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON security_alerts(severity);

-- ============================================================================
-- ALERT RULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS alert_rules (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT CHECK (rule_type IN ('threshold', 'anomaly', 'signature', 'correlation')),
  conditions TEXT DEFAULT '{}',
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  mitre_tactics TEXT DEFAULT '[]',
  mitre_techniques TEXT DEFAULT '[]',
  compliance_controls TEXT DEFAULT '[]',
  notification_channels TEXT DEFAULT '[]',
  is_enabled INTEGER DEFAULT 1,
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_org ON alert_rules(org_id);

-- ============================================================================
-- PENTEST ENGAGEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS pentest_engagements (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  engagement_type TEXT CHECK (engagement_type IN ('web_app', 'network', 'mobile', 'api', 'physical', 'social_engineering', 'red_team')),
  scope_description TEXT,
  rules_of_engagement TEXT,
  target_systems TEXT DEFAULT '[]',
  start_date TEXT,
  end_date TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  lead_tester_id TEXT REFERENCES users(id),
  team_members TEXT DEFAULT '[]',
  findings_summary TEXT,
  report_path TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pentest_org ON pentest_engagements(org_id);
CREATE INDEX IF NOT EXISTS idx_pentest_status ON pentest_engagements(status);

-- ============================================================================
-- INTEGRATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  integration_type TEXT,
  config_encrypted TEXT DEFAULT '{}',
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'configuring')),
  last_sync_at TEXT,
  error_message TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_integrations_org ON integrations(org_id);

-- ============================================================================
-- API CONNECTORS (ServiceNow, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_connectors (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  name TEXT NOT NULL,
  credentials TEXT DEFAULT '{}',
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'configuring')),
  last_test_at TEXT,
  last_test_status TEXT,
  last_sync_at TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_api_connectors_org ON api_connectors(org_id);

-- ============================================================================
-- CONNECTOR OAUTH TOKENS
-- ============================================================================

CREATE TABLE IF NOT EXISTS connector_oauth_tokens (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  connector_id TEXT NOT NULL UNIQUE REFERENCES api_connectors(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TEXT NOT NULL,
  scope TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_oauth_connector ON connector_oauth_tokens(connector_id);
CREATE INDEX IF NOT EXISTS idx_oauth_expires ON connector_oauth_tokens(expires_at);

-- ============================================================================
-- CMDB SYNC HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS cmdb_sync_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connector_id TEXT NOT NULL REFERENCES api_connectors(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('manual', 'scheduled')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'partial')),
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  assets_created INTEGER DEFAULT 0,
  assets_updated INTEGER DEFAULT 0,
  assets_skipped INTEGER DEFAULT 0,
  assets_failed INTEGER DEFAULT 0,
  total_cis_fetched INTEGER DEFAULT 0,
  error_message TEXT,
  sync_options TEXT DEFAULT '{}',
  triggered_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cmdb_sync_org ON cmdb_sync_history(org_id);
CREATE INDEX IF NOT EXISTS idx_cmdb_sync_connector ON cmdb_sync_history(connector_id);
CREATE INDEX IF NOT EXISTS idx_cmdb_sync_status ON cmdb_sync_history(status);
CREATE INDEX IF NOT EXISTS idx_cmdb_sync_started ON cmdb_sync_history(started_at DESC);

-- ============================================================================
-- CMDB SYNC SCHEDULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS cmdb_sync_schedules (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connector_id TEXT NOT NULL REFERENCES api_connectors(id) ON DELETE CASCADE,
  is_enabled INTEGER DEFAULT 1,
  frequency TEXT NOT NULL CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly')),
  day_of_week INTEGER,
  hour_utc INTEGER DEFAULT 2,
  last_sync_at TEXT,
  next_sync_at TEXT,
  sync_options TEXT DEFAULT '{}',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(org_id, connector_id)
);

CREATE INDEX IF NOT EXISTS idx_cmdb_schedule_next ON cmdb_sync_schedules(next_sync_at, is_enabled);
CREATE INDEX IF NOT EXISTS idx_cmdb_schedule_connector ON cmdb_sync_schedules(connector_id);

-- ============================================================================
-- POA&M AFFECTED ASSETS (FedRAMP)
-- ============================================================================

CREATE TABLE IF NOT EXISTS poam_affected_assets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  poam_id TEXT NOT NULL REFERENCES poams(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  link_reason TEXT DEFAULT 'affected' CHECK (link_reason IN ('vulnerable', 'impacted', 'affected', 'at_risk', 'remediated')),
  notes TEXT,
  linked_by TEXT NOT NULL REFERENCES users(id),
  linked_at TEXT DEFAULT (datetime('now')),
  -- migrate-011: responsibility model
  responsibility_model TEXT DEFAULT 'csp' CHECK (responsibility_model IN ('csp', 'customer', 'shared', 'inherited')),
  impact_description TEXT,
  UNIQUE(poam_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_poam_assets_poam ON poam_affected_assets(poam_id);
CREATE INDEX IF NOT EXISTS idx_poam_assets_asset ON poam_affected_assets(asset_id);

-- ============================================================================
-- POA&M CONTROL MAPPINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS poam_control_mappings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  poam_id TEXT NOT NULL REFERENCES poams(id) ON DELETE CASCADE,
  framework_id TEXT NOT NULL REFERENCES compliance_frameworks(id),
  control_id TEXT NOT NULL,
  mapping_type TEXT DEFAULT 'primary' CHECK (mapping_type IN ('primary', 'related', 'inherited')),
  confidence TEXT DEFAULT 'high' CHECK (confidence IN ('high', 'medium', 'low')),
  notes TEXT,
  mapped_by TEXT NOT NULL REFERENCES users(id),
  mapped_at TEXT DEFAULT (datetime('now')),
  UNIQUE(poam_id, framework_id, control_id)
);

CREATE INDEX IF NOT EXISTS idx_poam_controls_poam ON poam_control_mappings(poam_id);
CREATE INDEX IF NOT EXISTS idx_poam_controls_framework ON poam_control_mappings(framework_id);
CREATE INDEX IF NOT EXISTS idx_poam_controls_control ON poam_control_mappings(control_id);

-- ============================================================================
-- POA&M EVIDENCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS poam_evidence (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  poam_id TEXT NOT NULL REFERENCES poams(id) ON DELETE CASCADE,
  evidence_id TEXT NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('identification', 'remediation', 'closure', 'verification', 'deviation')),
  description TEXT,
  linked_by TEXT NOT NULL REFERENCES users(id),
  linked_at TEXT DEFAULT (datetime('now')),
  verified_by TEXT REFERENCES users(id),
  verified_at TEXT,
  UNIQUE(poam_id, evidence_id, purpose)
);

CREATE INDEX IF NOT EXISTS idx_poam_evidence_poam ON poam_evidence(poam_id);
CREATE INDEX IF NOT EXISTS idx_poam_evidence_evidence ON poam_evidence(evidence_id);
CREATE INDEX IF NOT EXISTS idx_poam_evidence_purpose ON poam_evidence(purpose);

-- ============================================================================
-- AUTHORIZATION BOUNDARIES (RMF)
-- ============================================================================

CREATE TABLE IF NOT EXISTS authorization_boundaries (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  boundary_type TEXT CHECK (boundary_type IN ('major_application', 'general_support', 'enclave', 'cloud_service', 'hybrid')),
  parent_boundary_id TEXT REFERENCES authorization_boundaries(id),
  authorization_type TEXT CHECK (authorization_type IN ('ato', 'iatt', 'dato', 'pato', 'fedramp', 'fedramp_moderate', 'fedramp_high', 'stateramp')),
  authorization_date TEXT,
  authorization_expiry TEXT,
  authorizing_official TEXT,
  ao_organization TEXT,
  security_categorization TEXT CHECK (security_categorization IN ('low', 'moderate', 'high')),
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(org_id, name)
);

CREATE INDEX IF NOT EXISTS idx_auth_boundaries_org ON authorization_boundaries(org_id);
CREATE INDEX IF NOT EXISTS idx_auth_boundaries_type ON authorization_boundaries(authorization_type);

-- ============================================================================
-- POA&M OSCAL & VENDOR INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_poams_vendor ON poams(vendor_id);
CREATE INDEX IF NOT EXISTS idx_poams_oscal_uuid ON poams(oscal_uuid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_poams_oscal_uuid_unique ON poams(oscal_uuid);
