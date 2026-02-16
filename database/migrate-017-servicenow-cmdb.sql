-- ============================================================================
-- ForgeComply 360 - ServiceNow CMDB Integration Migration
-- ============================================================================

-- OAuth token storage for connectors
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

-- CMDB sync history tracking
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

-- Scheduled sync configuration
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

-- Asset extensions for ServiceNow tracking
-- Note: Using ALTER TABLE with IF NOT EXISTS pattern for safety
ALTER TABLE assets ADD COLUMN servicenow_sys_id TEXT;
ALTER TABLE assets ADD COLUMN servicenow_class TEXT;
ALTER TABLE assets ADD COLUMN servicenow_sync_connector_id TEXT REFERENCES api_connectors(id);
ALTER TABLE assets ADD COLUMN servicenow_last_synced_at TEXT;

CREATE INDEX IF NOT EXISTS idx_assets_servicenow_sysid ON assets(org_id, servicenow_sys_id);
CREATE INDEX IF NOT EXISTS idx_assets_servicenow_connector ON assets(servicenow_sync_connector_id);

-- Track migration
INSERT OR IGNORE INTO schema_migrations (version, name, description) VALUES
  ('migrate-017-servicenow-cmdb', 'servicenow-cmdb', 'ServiceNow CMDB integration tables and asset extensions');
