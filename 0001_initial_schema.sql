-- Migration: 0001_initial_schema.sql
-- ForgeComply 360 Production Schema
-- Database: forge-production (fe250bed-40a9-443a-a6c7-4b59bf8a0dac)
-- Generated: 2026-03-06
-- Description: Complete base schema for all platform tables

-- ============================================================
-- CORE ENTITIES
-- ============================================================

CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    domain TEXT,
    subscription_tier TEXT DEFAULT 'professional' CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
    settings TEXT DEFAULT '{}',
    feature_flags TEXT DEFAULT '{}',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'analyst', 'manager', 'admin', 'owner')),
    auth_provider TEXT DEFAULT 'local' CHECK (auth_provider IN ('local', 'saml', 'oidc', 'azure_ad', 'okta')),
    external_id TEXT,
    mfa_enabled INTEGER DEFAULT 0,
    mfa_secret TEXT,
    mfa_backup_codes TEXT,
    workspace_access TEXT DEFAULT '["comply"]',
    last_login_at TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS systems (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    acronym TEXT,
    description TEXT,
    system_type TEXT DEFAULT 'major_application' CHECK (system_type IN ('major_application', 'general_support_system', 'minor_application')),
    impact_level TEXT DEFAULT 'moderate' CHECK (impact_level IN ('low', 'moderate', 'high')),
    confidentiality_impact TEXT DEFAULT 'moderate',
    integrity_impact TEXT DEFAULT 'moderate',
    availability_impact TEXT DEFAULT 'moderate',
    authorization_status TEXT DEFAULT 'not_started' CHECK (authorization_status IN ('not_started', 'in_progress', 'authorized', 'denied', 'revoked')),
    authorization_date TEXT,
    authorization_expiry TEXT,
    system_owner_id TEXT REFERENCES users(id),
    isso_id TEXT REFERENCES users(id),
    boundary_description TEXT,
    data_types TEXT DEFAULT '[]',
    hosting_environment TEXT DEFAULT 'cloud' CHECK (hosting_environment IN ('cloud', 'on_premise', 'hybrid')),
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- COMPLIANCE & CONTROLS
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_frameworks (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    version TEXT NOT NULL,
    description TEXT,
    authority TEXT,
    effective_date TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(short_name, version)
);

CREATE TABLE IF NOT EXISTS control_definitions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    framework_id TEXT NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
    control_id TEXT NOT NULL,
    family TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    guidance TEXT,
    assessment_objectives TEXT,
    related_controls TEXT DEFAULT '[]',
    baseline_low INTEGER DEFAULT 0,
    baseline_moderate INTEGER DEFAULT 0,
    baseline_high INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(framework_id, control_id)
);

CREATE TABLE IF NOT EXISTS control_implementations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
    control_definition_id TEXT NOT NULL REFERENCES control_definitions(id) ON DELETE CASCADE,
    implementation_status TEXT DEFAULT 'not_implemented' CHECK (implementation_status IN ('implemented', 'partially_implemented', 'planned', 'alternative', 'not_applicable', 'not_implemented')),
    responsibility TEXT DEFAULT 'customer' CHECK (responsibility IN ('provider', 'customer', 'shared', 'inherited')),
    implementation_narrative TEXT,
    evidence_description TEXT,
    assessment_status TEXT DEFAULT 'not_assessed' CHECK (assessment_status IN ('not_assessed', 'in_progress', 'satisfied', 'other_than_satisfied')),
    last_assessed_at TEXT,
    assessed_by TEXT REFERENCES users(id),
    next_assessment_date TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(system_id, control_definition_id)
);

-- Legacy controls table (kept for backward compatibility)
CREATE TABLE IF NOT EXISTS security_controls (
    id TEXT PRIMARY KEY,
    framework_id TEXT,
    control_id TEXT NOT NULL,
    family TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    guidance TEXT,
    assessment_objectives TEXT,
    related_controls TEXT DEFAULT '[]',
    baseline_low INTEGER DEFAULT 0,
    baseline_moderate INTEGER DEFAULT 0,
    baseline_high INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- POA&M & RISK
-- ============================================================

CREATE TABLE IF NOT EXISTS poams (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
    control_implementation_id TEXT REFERENCES control_implementations(id) ON DELETE SET NULL,
    poam_id TEXT NOT NULL,
    weakness_name TEXT NOT NULL,
    weakness_description TEXT NOT NULL,
    source TEXT DEFAULT 'assessment' CHECK (source IN ('assessment', 'audit', 'scan', 'pentest', 'incident', 'self_identified')),
    source_reference TEXT,
    risk_level TEXT DEFAULT 'moderate' CHECK (risk_level IN ('critical', 'high', 'moderate', 'low')),
    likelihood TEXT DEFAULT 'moderate',
    impact TEXT DEFAULT 'moderate',
    original_risk_rating TEXT,
    residual_risk_rating TEXT,
    point_of_contact_id TEXT REFERENCES users(id),
    remediation_plan TEXT,
    milestones TEXT DEFAULT '[]',
    scheduled_completion_date TEXT,
    actual_completion_date TEXT,
    cost_estimate REAL,
    resources_required TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'delayed', 'cancelled', 'risk_accepted')),
    delay_reason TEXT,
    vendor_dependency TEXT,
    verification_method TEXT,
    verification_date TEXT,
    verified_by TEXT REFERENCES users(id),
    comments TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(organization_id, poam_id)
);

-- ============================================================
-- ASSETS & VULNERABILITY MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    system_id TEXT REFERENCES systems(id) ON DELETE SET NULL,
    hostname TEXT,
    ip_address TEXT,
    mac_address TEXT,
    asset_type TEXT DEFAULT 'server' CHECK (asset_type IN ('server', 'workstation', 'network_device', 'cloud_resource', 'container', 'application', 'database', 'other')),
    os_type TEXT,
    os_version TEXT,
    classification TEXT DEFAULT 'internal' CHECK (classification IN ('public', 'internal', 'confidential', 'restricted')),
    criticality TEXT DEFAULT 'medium' CHECK (criticality IN ('critical', 'high', 'medium', 'low')),
    owner_id TEXT REFERENCES users(id),
    location TEXT,
    tags TEXT DEFAULT '[]',
    discovery_source TEXT,
    last_seen_at TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    fqdn TEXT,
    netbios_name TEXT,
    scan_credentialed INTEGER DEFAULT 0,
    open_ports TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS vulnerability_definitions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cve_id TEXT UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    cvss_score REAL,
    cvss_vector TEXT,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    affected_products TEXT DEFAULT '[]',
    references_list TEXT DEFAULT '[]',
    published_at TEXT,
    modified_at TEXT,
    exploit_available INTEGER DEFAULT 0,
    patch_available INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vulnerability_findings (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    vulnerability_id TEXT REFERENCES vulnerability_definitions(id) ON DELETE SET NULL,
    scan_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    cvss_score REAL,
    affected_component TEXT,
    proof_of_concept TEXT,
    remediation_guidance TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'remediated', 'accepted', 'false_positive')),
    assigned_to TEXT REFERENCES users(id),
    remediated_at TEXT,
    verified_at TEXT,
    related_poam_id TEXT REFERENCES poams(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    -- Nessus integration columns
    scan_import_id TEXT REFERENCES scan_imports(id) ON DELETE SET NULL,
    plugin_id TEXT,
    plugin_name TEXT,
    plugin_family TEXT,
    port INTEGER,
    protocol TEXT,
    cvss3_score REAL,
    cvss3_vector TEXT,
    exploit_available INTEGER DEFAULT 0,
    patch_published TEXT,
    first_seen_at TEXT,
    last_seen_at TEXT,
    plugin_output TEXT,
    see_also TEXT DEFAULT '[]',
    control_mappings TEXT DEFAULT '[]'
);

-- ============================================================
-- SCANNER INTEGRATION
-- ============================================================

CREATE TABLE IF NOT EXISTS scan_imports (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
    scanner_type TEXT NOT NULL DEFAULT 'nessus' CHECK (scanner_type IN ('nessus', 'qualys', 'rapid7', 'forgescan')),
    scanner_version TEXT,
    scan_name TEXT,
    scan_started_at TEXT,
    scan_completed_at TEXT,
    file_name TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    file_path TEXT,
    hosts_scanned INTEGER DEFAULT 0,
    findings_total INTEGER DEFAULT 0,
    findings_critical INTEGER DEFAULT 0,
    findings_high INTEGER DEFAULT 0,
    findings_medium INTEGER DEFAULT 0,
    findings_low INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    imported_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(organization_id, file_hash)
);

-- ============================================================
-- SSP DOCUMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS ssp_documents (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'superseded')),
    document_path TEXT,
    oscal_json TEXT,
    prepared_by TEXT REFERENCES users(id),
    reviewed_by TEXT REFERENCES users(id),
    approved_by TEXT REFERENCES users(id),
    approved_at TEXT,
    effective_date TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- SECURITY OPERATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS alert_rules (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT DEFAULT 'threshold' CHECK (rule_type IN ('threshold', 'correlation', 'anomaly', 'signature')),
    conditions TEXT NOT NULL,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    mitre_tactics TEXT DEFAULT '[]',
    mitre_techniques TEXT DEFAULT '[]',
    compliance_controls TEXT DEFAULT '[]',
    notification_channels TEXT DEFAULT '[]',
    is_enabled INTEGER DEFAULT 1,
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS security_alerts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    alert_rule_id TEXT REFERENCES alert_rules(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    source TEXT NOT NULL,
    source_event_id TEXT,
    affected_assets TEXT DEFAULT '[]',
    indicators TEXT DEFAULT '[]',
    raw_event TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'investigating', 'resolved', 'false_positive', 'escalated')),
    assigned_to TEXT REFERENCES users(id),
    resolution_notes TEXT,
    resolved_at TEXT,
    related_incident_id TEXT,
    related_poams TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS security_incidents (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    incident_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    incident_type TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'contained', 'eradicated', 'recovered', 'closed')),
    commander_id TEXT REFERENCES users(id),
    affected_systems TEXT DEFAULT '[]',
    affected_users TEXT DEFAULT '[]',
    timeline TEXT DEFAULT '[]',
    root_cause TEXT,
    impact_assessment TEXT,
    lessons_learned TEXT,
    related_alerts TEXT DEFAULT '[]',
    detected_at TEXT,
    contained_at TEXT,
    eradicated_at TEXT,
    recovered_at TEXT,
    closed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(organization_id, incident_number)
);

CREATE TABLE IF NOT EXISTS pentest_engagements (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    engagement_type TEXT DEFAULT 'external' CHECK (engagement_type IN ('external', 'internal', 'web_app', 'mobile', 'social_engineering', 'physical', 'red_team')),
    scope_description TEXT,
    rules_of_engagement TEXT,
    target_systems TEXT DEFAULT '[]',
    start_date TEXT,
    end_date TEXT,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    lead_tester_id TEXT REFERENCES users(id),
    team_members TEXT DEFAULT '[]',
    findings_summary TEXT,
    report_path TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- INTEGRATIONS & NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS integrations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    integration_type TEXT NOT NULL,
    config_encrypted TEXT,
    status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
    last_sync_at TEXT,
    error_message TEXT,
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(organization_id, integration_type)
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data TEXT DEFAULT '{}',
    channel TEXT DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'slack', 'teams', 'webhook')),
    is_read INTEGER DEFAULT 0,
    read_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    permissions TEXT DEFAULT '["read"]',
    scopes TEXT DEFAULT '["comply"]',
    rate_limit INTEGER DEFAULT 100,
    expires_at TEXT,
    last_used_at TEXT,
    request_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- AUTH & AUDIT
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    attempt_time TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mfa_secrets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    secret_encrypted TEXT NOT NULL,
    backup_codes TEXT,
    is_enabled INTEGER DEFAULT 0,
    verified_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS organization_settings (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    password_min_length INTEGER DEFAULT 12,
    mfa_required INTEGER DEFAULT 0,
    session_timeout_minutes INTEGER DEFAULT 15,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS password_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    device_info TEXT,
    ip_address TEXT,
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Core entity indexes
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_systems_org ON systems(organization_id);

-- Control indexes
CREATE INDEX IF NOT EXISTS idx_controls_framework ON control_definitions(framework_id);
CREATE INDEX IF NOT EXISTS idx_controls_control_id ON control_definitions(control_id);
CREATE INDEX IF NOT EXISTS idx_controls_family ON security_controls(family);
CREATE INDEX IF NOT EXISTS idx_impl_system ON control_implementations(system_id);

-- POA&M indexes
CREATE INDEX IF NOT EXISTS idx_poams_org ON poams(organization_id);
CREATE INDEX IF NOT EXISTS idx_poams_system ON poams(system_id);
CREATE INDEX IF NOT EXISTS idx_poams_status ON poams(status);

-- Vulnerability indexes
CREATE INDEX IF NOT EXISTS idx_vuln_org ON vulnerability_findings(organization_id);
CREATE INDEX IF NOT EXISTS idx_vuln_asset ON vulnerability_findings(asset_id);
CREATE INDEX IF NOT EXISTS idx_findings_scan_import ON vulnerability_findings(scan_import_id);
CREATE INDEX IF NOT EXISTS idx_findings_plugin ON vulnerability_findings(plugin_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON vulnerability_findings(severity);

-- Scanner indexes
CREATE INDEX IF NOT EXISTS idx_scan_imports_org ON scan_imports(organization_id);
CREATE INDEX IF NOT EXISTS idx_scan_imports_system ON scan_imports(system_id);
CREATE INDEX IF NOT EXISTS idx_scan_imports_status ON scan_imports(status);

-- Security operations indexes
CREATE INDEX IF NOT EXISTS idx_alerts_org ON security_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON security_alerts(status);

-- Audit indexes
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- Auth indexes
CREATE INDEX IF NOT EXISTS idx_failed_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_mfa_user ON mfa_secrets(user_id);
CREATE INDEX IF NOT EXISTS idx_pwdhist_user ON password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_reset_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_hash ON password_reset_tokens(token_hash);
