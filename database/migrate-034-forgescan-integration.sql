-- Migration 034: ForgeComply 360 ↔ Forge-Scan Integration
-- Adds event bus tables, event subscriptions, and compliance evidence links

-- 1. forge_events — event log for integration events
CREATE TABLE IF NOT EXISTS forge_events (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  event_type TEXT NOT NULL,
  payload TEXT DEFAULT '{}',
  source TEXT,
  processed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_forge_events_org ON forge_events(org_id);
CREATE INDEX IF NOT EXISTS idx_forge_events_type ON forge_events(event_type);
CREATE INDEX IF NOT EXISTS idx_forge_events_created ON forge_events(created_at);

-- 2. event_subscriptions — who listens to what
CREATE TABLE IF NOT EXISTS event_subscriptions (
  id TEXT PRIMARY KEY,
  org_id TEXT,
  name TEXT NOT NULL,
  event_pattern TEXT NOT NULL,
  handler_type TEXT NOT NULL CHECK (handler_type IN ('internal', 'webhook')),
  handler_config TEXT DEFAULT '{}',
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_event_subs_pattern ON event_subscriptions(event_pattern);
CREATE INDEX IF NOT EXISTS idx_event_subs_org ON event_subscriptions(org_id);

-- 3. compliance_evidence_links — auto-generated evidence from scans and events
CREATE TABLE IF NOT EXISTS compliance_evidence_links (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  control_id TEXT NOT NULL,
  framework_id TEXT,
  evidence_type TEXT NOT NULL,
  source_type TEXT,
  source_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  metadata TEXT DEFAULT '{}',
  auto_generated INTEGER DEFAULT 1,
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cev_org ON compliance_evidence_links(org_id);
CREATE INDEX IF NOT EXISTS idx_cev_control ON compliance_evidence_links(control_id);
CREATE INDEX IF NOT EXISTS idx_cev_source ON compliance_evidence_links(source_type, source_id);

-- 4. Seed default event subscriptions
INSERT OR IGNORE INTO event_subscriptions (id, org_id, name, event_pattern, handler_type, handler_config)
VALUES
  ('evt_sub_scan_compliance', NULL, 'Scan completion → compliance evidence', 'forge.scan.completed', 'internal', '{"handler_id":"compliance_check"}'),
  ('evt_sub_vuln_map', NULL, 'Vulnerability detected → control mapping', 'forge.vulnerability.detected', 'internal', '{"handler_id":"vulnerability_map"}');
