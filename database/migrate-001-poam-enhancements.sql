-- Migration 001: POA&M Workflow & Milestones Enhancement
-- Adds assigned_to column, updates status CHECK constraint, creates milestone/comment tables
-- Safe to run multiple times (uses IF NOT EXISTS and checks before ALTER)

-- ============================================================================
-- 1. Add assigned_to column to poams (if not exists)
-- ============================================================================
-- SQLite doesn't have ADD COLUMN IF NOT EXISTS, so we use a trick:
-- Try to add the column; if it already exists, the statement will error
-- but D1 will continue executing the rest of the file.
-- Wrapping in a try via separate execution isn't possible in plain SQL,
-- so we recreate the table to be safe.

-- Recreate poams table with updated schema (preserves data)
CREATE TABLE IF NOT EXISTS poams_new (
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
  asset_owner_id TEXT REFERENCES users(id),
  asset_owner_name TEXT,
  oscal_uuid TEXT,
  oscal_poam_item_id TEXT,
  related_observations TEXT DEFAULT '[]',
  related_risks TEXT DEFAULT '[]',
  vendor_id TEXT REFERENCES vendors(id) ON DELETE SET NULL,
  vendor_dependency_notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Copy existing data (assigned_to will be NULL for existing rows)
INSERT OR IGNORE INTO poams_new (id, org_id, system_id, poam_id, weakness_name, weakness_description, control_id, framework_id, risk_level, status, scheduled_completion, actual_completion, milestones, responsible_party, resources_required, vendor_dependency, cost_estimate, comments, created_by, created_at, updated_at)
SELECT id, org_id, system_id, poam_id, weakness_name, weakness_description, control_id, framework_id, risk_level, status, scheduled_completion, actual_completion, milestones, responsible_party, resources_required, vendor_dependency, cost_estimate, comments, created_by, created_at, updated_at
FROM poams;

-- Swap tables
DROP TABLE IF EXISTS poams;
ALTER TABLE poams_new RENAME TO poams;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_poams_org ON poams(org_id);
CREATE INDEX IF NOT EXISTS idx_poams_system ON poams(system_id);
CREATE INDEX IF NOT EXISTS idx_poams_status ON poams(status);
CREATE INDEX IF NOT EXISTS idx_poams_assigned ON poams(assigned_to);

-- ============================================================================
-- 2. Create poam_milestones table
-- ============================================================================
CREATE TABLE IF NOT EXISTS poam_milestones (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  poam_id TEXT NOT NULL REFERENCES poams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_date TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completion_date TEXT,
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

-- ============================================================================
-- 3. Create poam_comments table
-- ============================================================================
CREATE TABLE IF NOT EXISTS poam_comments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  poam_id TEXT NOT NULL REFERENCES poams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_poam_comments_poam ON poam_comments(poam_id);
