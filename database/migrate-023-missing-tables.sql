-- ============================================================================
-- MIGRATION 023: Create Missing Tables
--
-- Adds tables that the application code and seed data require but were never
-- defined in schema.sql: assets, vulnerability_findings, scan_imports,
-- security_alerts, alert_rules, pentest_engagements, integrations.
-- Also adds missing `status` column to users table.
-- ============================================================================

-- ============================================================================
-- 1. USERS - add missing status column
-- ============================================================================
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';

-- ============================================================================
-- 2. ASSETS
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
-- 3. SCAN IMPORTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS scan_imports (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_scan_imports_org ON scan_imports(organization_id);
CREATE INDEX IF NOT EXISTS idx_scan_imports_hash ON scan_imports(file_hash);

-- ============================================================================
-- 4. VULNERABILITY FINDINGS
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
-- 5. SECURITY ALERTS
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
-- 6. ALERT RULES
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
-- 7. PENTEST ENGAGEMENTS
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
-- 8. INTEGRATIONS
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
-- 9. TRACK MIGRATION
-- ============================================================================
INSERT OR IGNORE INTO schema_migrations (version, name, description) VALUES
  ('migrate-023-missing-tables', 'missing-tables', 'Create assets, vulnerability_findings, scan_imports, security_alerts, alert_rules, pentest_engagements, integrations tables; add users.status column');
