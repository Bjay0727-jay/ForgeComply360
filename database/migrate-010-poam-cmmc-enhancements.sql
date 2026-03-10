-- ============================================================================
-- MIGRATION 010: POA&M CMMC/FedRAMP Enhancements
-- Adds data sensitivity, milestone improvements, and deviation tracking
-- Required for CMMC assessments and FedRAMP AO deviation approvals
-- ============================================================================
-- Columns are now defined in schema.sql. This migration verifies they exist
-- and creates supporting indexes and tables idempotently.
-- ============================================================================

-- Verify poams columns exist
SELECT data_classification, cui_category, risk_register_id FROM poams LIMIT 0;
SELECT impact_confidentiality, impact_integrity, impact_availability FROM poams LIMIT 0;
SELECT deviation_type, deviation_rationale, deviation_approved_by FROM poams LIMIT 0;
SELECT deviation_approved_at, deviation_expires_at, deviation_review_frequency FROM poams LIMIT 0;
SELECT deviation_next_review, compensating_control_description FROM poams LIMIT 0;

-- Verify poam_milestones columns exist
SELECT description, sequence_number, progress_percentage FROM poam_milestones LIMIT 0;
SELECT responsible_party, evidence_id, blocked_reason FROM poam_milestones LIMIT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_poams_data_classification ON poams(data_classification);
CREATE INDEX IF NOT EXISTS idx_poams_cui_category ON poams(cui_category);
CREATE INDEX IF NOT EXISTS idx_poam_milestones_status ON poam_milestones(status);
CREATE INDEX IF NOT EXISTS idx_poams_deviation_type ON poams(deviation_type);
CREATE INDEX IF NOT EXISTS idx_poams_deviation_expires ON poams(deviation_expires_at);
CREATE INDEX IF NOT EXISTS idx_poams_deviation_review ON poams(deviation_next_review);

-- Deviation history table
CREATE TABLE IF NOT EXISTS poam_deviation_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  poam_id TEXT NOT NULL REFERENCES poams(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('requested', 'approved', 'rejected', 'extended', 'revoked', 'reviewed')),
  deviation_type TEXT,
  rationale TEXT,
  performed_by TEXT NOT NULL REFERENCES users(id),
  performed_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_poam_deviation_history_poam ON poam_deviation_history(poam_id);
CREATE INDEX IF NOT EXISTS idx_poam_deviation_history_action ON poam_deviation_history(action);

-- Migrate existing deferred/accepted POA&Ms to deviation structure
UPDATE poams
SET deviation_type = 'risk_accepted',
    deviation_review_frequency = 'quarterly'
WHERE status = 'deferred'
  AND deviation_type IS NULL;

UPDATE poams
SET deviation_type = 'risk_accepted',
    deviation_review_frequency = 'quarterly'
WHERE status = 'accepted'
  AND deviation_type IS NULL;
