-- Migration 019: Add CMMC/FedRAMP extended POA&M fields
-- This adds columns referenced by handleUpdatePoam that were missing from the table

-- Add CMMC/FedRAMP extended POA&M fields
ALTER TABLE poams ADD COLUMN data_classification TEXT CHECK (data_classification IN ('public', 'internal', 'confidential', 'cui', 'classified'));
ALTER TABLE poams ADD COLUMN cui_category TEXT;
ALTER TABLE poams ADD COLUMN risk_register_id TEXT REFERENCES risks(id) ON DELETE SET NULL;
ALTER TABLE poams ADD COLUMN impact_confidentiality TEXT CHECK (impact_confidentiality IN ('low', 'moderate', 'high'));
ALTER TABLE poams ADD COLUMN impact_integrity TEXT CHECK (impact_integrity IN ('low', 'moderate', 'high'));
ALTER TABLE poams ADD COLUMN impact_availability TEXT CHECK (impact_availability IN ('low', 'moderate', 'high'));

-- Deviation tracking fields (for operational requirements/risk acceptance)
ALTER TABLE poams ADD COLUMN deviation_type TEXT CHECK (deviation_type IN ('operational_requirement', 'risk_acceptance', 'false_positive', 'compensating_control'));
ALTER TABLE poams ADD COLUMN deviation_rationale TEXT;
ALTER TABLE poams ADD COLUMN deviation_expires_at TEXT;
ALTER TABLE poams ADD COLUMN deviation_review_frequency TEXT CHECK (deviation_review_frequency IN ('monthly', 'quarterly', 'semi-annual', 'annual'));
ALTER TABLE poams ADD COLUMN deviation_next_review TEXT;
ALTER TABLE poams ADD COLUMN deviation_approved_by TEXT REFERENCES users(id);
ALTER TABLE poams ADD COLUMN deviation_approved_at TEXT;
ALTER TABLE poams ADD COLUMN compensating_control_description TEXT;

-- Asset owner tracking
ALTER TABLE poams ADD COLUMN asset_owner_id TEXT REFERENCES users(id);
ALTER TABLE poams ADD COLUMN asset_owner_name TEXT;

-- OSCAL integration fields
ALTER TABLE poams ADD COLUMN oscal_poam_item_id TEXT;
ALTER TABLE poams ADD COLUMN related_observations TEXT DEFAULT '[]';
ALTER TABLE poams ADD COLUMN related_risks TEXT DEFAULT '[]';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_poams_deviation_type ON poams(deviation_type);
CREATE INDEX IF NOT EXISTS idx_poams_risk_register ON poams(risk_register_id);

-- Track migration
INSERT INTO schema_migrations (id, version, name, description, applied_at, success)
VALUES (lower(hex(randomblob(16))), '019', 'poam-extended-fields',
        'Add CMMC/FedRAMP extended fields to POA&Ms table', datetime('now'), 1);
