-- ============================================================================
-- MIGRATION 005: Audit Preparation Checklist
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
