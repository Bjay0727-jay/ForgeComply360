-- ============================================================================
-- FORGECOMPLY 360 - D1 DATABASE SCHEMA v5.0
-- Forge Cyber Defense - SDVOSB
-- Single Engine, Multiple Experiences Architecture
-- ============================================================================

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
  mfa_enabled INTEGER DEFAULT 0,
  mfa_secret TEXT,
  mfa_backup_codes TEXT,
  onboarding_completed INTEGER DEFAULT 0,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TEXT,
  last_login_at TEXT,
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
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

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
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notif_recipient ON notifications(recipient_user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_org ON notifications(org_id);

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
  updated_at TEXT DEFAULT (datetime('now'))
);

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
