-- ============================================================================
-- MIGRATION 004: Evidence Scheduling & Reminders
-- ============================================================================

-- Evidence schedules table
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

-- Notification preference columns (evidence_reminder, evidence_expiry)
-- Added via schema.sql on fresh installs. For existing DBs, these were applied
-- on first migration run. Using INSERT OR IGNORE pattern for idempotency.
-- No ALTER TABLE needed — columns already exist in production.
