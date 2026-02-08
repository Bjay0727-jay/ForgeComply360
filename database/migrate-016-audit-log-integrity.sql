-- ============================================================================
-- Migration 016: Audit Log Integrity & Retention (TAC-002 / NIST AU-9, AU-11)
-- Adds hash chaining for tamper detection and password history tracking.
-- ============================================================================

-- Add integrity hash chain column to audit logs
ALTER TABLE audit_logs ADD COLUMN integrity_hash TEXT;

-- Add previous hash reference for chain verification
ALTER TABLE audit_logs ADD COLUMN prev_hash TEXT;

-- Index for efficient chain verification queries
CREATE INDEX IF NOT EXISTS idx_audit_integrity ON audit_logs(org_id, created_at, integrity_hash);

-- Password history table for TAC-003 / NIST IA-5
CREATE TABLE IF NOT EXISTS password_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id, created_at DESC);

-- Security incidents table for TAC-006 / NIST IR
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

-- Track migration
INSERT OR IGNORE INTO schema_migrations (version, name, description)
VALUES ('016', 'audit-log-integrity', 'Audit log hash chaining, password history, security incidents table');
