-- ============================================================================
-- MIGRATION 010: POA&M CMMC/FedRAMP Enhancements
-- Adds data sensitivity, milestone improvements, and deviation tracking
-- Required for CMMC assessments and FedRAMP AO deviation approvals
-- ============================================================================

-- ============================================================================
-- 1. DATA SENSITIVITY & CUI INDICATORS (CMMC Critical)
-- ============================================================================

-- Data classification - critical for CMMC assessors to see CUI impact
ALTER TABLE poams ADD COLUMN data_classification TEXT
  DEFAULT 'internal' CHECK (data_classification IN
    ('public', 'internal', 'confidential', 'cui', 'classified'));

-- CUI category for detailed CMMC tracking (e.g., CTI, ITAR, NOFORN)
ALTER TABLE poams ADD COLUMN cui_category TEXT;

-- Link to risk register for ISO 27001 integration
ALTER TABLE poams ADD COLUMN risk_register_id TEXT REFERENCES risks(id) ON DELETE SET NULL;

-- FIPS 199 impact levels for RMF compliance
ALTER TABLE poams ADD COLUMN impact_confidentiality TEXT
  CHECK (impact_confidentiality IN ('low', 'moderate', 'high'));
ALTER TABLE poams ADD COLUMN impact_integrity TEXT
  CHECK (impact_integrity IN ('low', 'moderate', 'high'));
ALTER TABLE poams ADD COLUMN impact_availability TEXT
  CHECK (impact_availability IN ('low', 'moderate', 'high'));

-- Create index for data classification queries
CREATE INDEX IF NOT EXISTS idx_poams_data_classification ON poams(data_classification);
CREATE INDEX IF NOT EXISTS idx_poams_cui_category ON poams(cui_category);

-- ============================================================================
-- 2. ENHANCED MILESTONE TRACKING (Unify Schema)
-- ============================================================================

-- Add missing fields to poam_milestones for proper FedRAMP monthly reporting
-- Using ALTER TABLE since poam_milestones already exists from migrate-001

ALTER TABLE poam_milestones ADD COLUMN description TEXT;

ALTER TABLE poam_milestones ADD COLUMN sequence_number INTEGER DEFAULT 1;

ALTER TABLE poam_milestones ADD COLUMN progress_percentage INTEGER DEFAULT 0
  CHECK (progress_percentage >= 0 AND progress_percentage <= 100);

ALTER TABLE poam_milestones ADD COLUMN responsible_party TEXT REFERENCES users(id);

ALTER TABLE poam_milestones ADD COLUMN evidence_id TEXT REFERENCES evidence(id) ON DELETE SET NULL;

ALTER TABLE poam_milestones ADD COLUMN blocked_reason TEXT;

-- Add status 'delayed' and 'blocked' (need to recreate check constraint)
-- SQLite doesn't support ALTER COLUMN, so we work around by allowing any value
-- and validating in application layer (existing constraint allows pending, in_progress, completed)

-- Create index for milestone status queries
CREATE INDEX IF NOT EXISTS idx_poam_milestones_status ON poam_milestones(status);

-- ============================================================================
-- 3. RISK ACCEPTANCE & DEVIATION TRACKING (FedRAMP AO Approval)
-- ============================================================================

-- Deviation type for categorizing risk acceptance
ALTER TABLE poams ADD COLUMN deviation_type TEXT
  CHECK (deviation_type IN ('operational_requirement', 'false_positive',
    'risk_accepted', 'vendor_dependency', 'compensating_control'));

-- Detailed rationale for deviation (required for AO approval)
ALTER TABLE poams ADD COLUMN deviation_rationale TEXT;

-- Approval workflow fields
ALTER TABLE poams ADD COLUMN deviation_approved_by TEXT REFERENCES users(id);
ALTER TABLE poams ADD COLUMN deviation_approved_at TEXT;

-- Expiration for time-limited risk acceptance
ALTER TABLE poams ADD COLUMN deviation_expires_at TEXT;

-- Review frequency for ongoing risk monitoring
ALTER TABLE poams ADD COLUMN deviation_review_frequency TEXT
  DEFAULT NULL CHECK (deviation_review_frequency IN
    ('monthly', 'quarterly', 'semi_annual', 'annual'));

-- Next review date (calculated based on frequency)
ALTER TABLE poams ADD COLUMN deviation_next_review TEXT;

-- Compensating control description for CA-5 compliance
ALTER TABLE poams ADD COLUMN compensating_control_description TEXT;

-- Create indexes for deviation queries
CREATE INDEX IF NOT EXISTS idx_poams_deviation_type ON poams(deviation_type);
CREATE INDEX IF NOT EXISTS idx_poams_deviation_expires ON poams(deviation_expires_at);
CREATE INDEX IF NOT EXISTS idx_poams_deviation_review ON poams(deviation_next_review);

-- ============================================================================
-- 4. DEVIATION HISTORY TABLE (Audit Trail for AO Decisions)
-- ============================================================================

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

-- ============================================================================
-- 5. MIGRATE EXISTING DEFERRED POA&Ms TO NEW DEVIATION STRUCTURE
-- ============================================================================

-- Set deviation_type for existing deferred POA&Ms
UPDATE poams
SET deviation_type = 'risk_accepted',
    deviation_review_frequency = 'quarterly'
WHERE status = 'deferred'
  AND deviation_type IS NULL;

-- Set deviation_type for existing accepted POA&Ms
UPDATE poams
SET deviation_type = 'risk_accepted',
    deviation_review_frequency = 'quarterly'
WHERE status = 'accepted'
  AND deviation_type IS NULL;
