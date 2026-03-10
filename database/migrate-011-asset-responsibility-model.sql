-- ============================================================================
-- MIGRATION 011: Asset Responsibility Model & Environment Classification
-- Addresses RMF, FedRAMP, CMMC, and ISO 27001 asset/boundary requirements
-- ============================================================================
-- Columns and tables are now defined in schema.sql. This migration verifies
-- they exist and creates supporting indexes idempotently.
-- ============================================================================

-- Verify poams columns exist
SELECT asset_owner_id, asset_owner_name FROM poams LIMIT 0;

-- Verify assets columns exist
SELECT environment, boundary_id, data_zone FROM assets LIMIT 0;

-- Verify poam_affected_assets columns exist
SELECT responsibility_model, impact_description FROM poam_affected_assets LIMIT 0;

-- Verify systems columns exist
SELECT boundary_type, authorization_type FROM systems LIMIT 0;
SELECT ao_organization, security_categorization FROM systems LIMIT 0;
SELECT impact_level_confidentiality, impact_level_integrity, impact_level_availability FROM systems LIMIT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assets_environment ON assets(environment);
CREATE INDEX IF NOT EXISTS idx_assets_boundary ON assets(boundary_id);
CREATE INDEX IF NOT EXISTS idx_assets_data_zone ON assets(data_zone);
CREATE INDEX IF NOT EXISTS idx_poams_asset_owner ON poams(asset_owner_id);
CREATE INDEX IF NOT EXISTS idx_systems_auth_type ON systems(authorization_type);
CREATE INDEX IF NOT EXISTS idx_systems_security_cat ON systems(security_categorization);

-- Authorization boundaries table (already in schema.sql, CREATE IF NOT EXISTS is safe)
CREATE TABLE IF NOT EXISTS authorization_boundaries (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  boundary_type TEXT CHECK (boundary_type IN ('major_application', 'general_support', 'enclave', 'cloud_service', 'hybrid')),
  parent_boundary_id TEXT REFERENCES authorization_boundaries(id),
  authorization_type TEXT CHECK (authorization_type IN ('ato', 'iatt', 'dato', 'pato', 'fedramp', 'fedramp_moderate', 'fedramp_high', 'stateramp')),
  authorization_date TEXT,
  authorization_expiry TEXT,
  authorizing_official TEXT,
  ao_organization TEXT,
  security_categorization TEXT CHECK (security_categorization IN ('low', 'moderate', 'high')),
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(org_id, name)
);

CREATE INDEX IF NOT EXISTS idx_auth_boundaries_org ON authorization_boundaries(org_id);
CREATE INDEX IF NOT EXISTS idx_auth_boundaries_type ON authorization_boundaries(authorization_type);
