-- ============================================================================
-- MIGRATION 011: Asset Responsibility Model & Environment Classification
-- Addresses RMF, FedRAMP, CMMC, and ISO 27001 asset/boundary requirements
-- ============================================================================

-- ============================================================================
-- 1. POA&M ASSET OWNER (Distinct from Remediation Owner)
-- ============================================================================
-- ISO 27001 requires asset owner ≠ remediation contact
-- RMF CA-5 requires identifying system owner for each weakness

ALTER TABLE poams ADD COLUMN asset_owner_id TEXT REFERENCES users(id);
ALTER TABLE poams ADD COLUMN asset_owner_name TEXT; -- For external owners not in system

-- ============================================================================
-- 2. ASSETS: ENVIRONMENT CLASSIFICATION (FedRAMP/CMMC)
-- ============================================================================
-- FedRAMP requires environment identification for shared responsibility
-- CMMC requires CUI enclave/environment identification

ALTER TABLE assets ADD COLUMN environment TEXT
  DEFAULT 'production' CHECK (environment IN
    ('production', 'staging', 'development', 'govcloud', 'commercial', 'shared', 'enclave'));

ALTER TABLE assets ADD COLUMN boundary_id TEXT; -- ATO boundary identifier

ALTER TABLE assets ADD COLUMN data_zone TEXT
  CHECK (data_zone IN ('cui', 'pii', 'phi', 'pci', 'public', 'internal', 'classified'));

-- ============================================================================
-- 3. POAM_AFFECTED_ASSETS: RESPONSIBILITY MODEL (FedRAMP)
-- ============================================================================
-- FedRAMP shared responsibility: CSP vs Customer vs Shared

ALTER TABLE poam_affected_assets ADD COLUMN responsibility_model TEXT
  DEFAULT 'csp' CHECK (responsibility_model IN ('csp', 'customer', 'shared', 'inherited'));

ALTER TABLE poam_affected_assets ADD COLUMN impact_description TEXT;

-- ============================================================================
-- 4. SYSTEMS: STRUCTURED BOUNDARY FIELDS (RMF)
-- ============================================================================
-- RMF requires clear authorization boundary definition

ALTER TABLE systems ADD COLUMN boundary_type TEXT
  CHECK (boundary_type IN ('major_application', 'general_support', 'enclave', 'cloud_service', 'hybrid'));

ALTER TABLE systems ADD COLUMN authorization_type TEXT
  CHECK (authorization_type IN ('ato', 'iatt', 'dato', 'pato', 'fedramp', 'fedramp_moderate', 'fedramp_high', 'stateramp'));

ALTER TABLE systems ADD COLUMN authorization_date TEXT;
ALTER TABLE systems ADD COLUMN authorization_expiry TEXT;
ALTER TABLE systems ADD COLUMN authorizing_official TEXT;
ALTER TABLE systems ADD COLUMN ao_organization TEXT;

ALTER TABLE systems ADD COLUMN security_categorization TEXT
  CHECK (security_categorization IN ('low', 'moderate', 'high'));

ALTER TABLE systems ADD COLUMN impact_level_confidentiality TEXT
  CHECK (impact_level_confidentiality IN ('low', 'moderate', 'high'));
ALTER TABLE systems ADD COLUMN impact_level_integrity TEXT
  CHECK (impact_level_integrity IN ('low', 'moderate', 'high'));
ALTER TABLE systems ADD COLUMN impact_level_availability TEXT
  CHECK (impact_level_availability IN ('low', 'moderate', 'high'));

-- ============================================================================
-- 5. CREATE INDEXES FOR NEW FIELDS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_assets_environment ON assets(environment);
CREATE INDEX IF NOT EXISTS idx_assets_boundary ON assets(boundary_id);
CREATE INDEX IF NOT EXISTS idx_assets_data_zone ON assets(data_zone);
CREATE INDEX IF NOT EXISTS idx_poams_asset_owner ON poams(asset_owner_id);
CREATE INDEX IF NOT EXISTS idx_systems_auth_type ON systems(authorization_type);
CREATE INDEX IF NOT EXISTS idx_systems_security_cat ON systems(security_categorization);

-- ============================================================================
-- 6. ASSET BOUNDARIES TABLE (RMF Authorization Boundaries)
-- ============================================================================
-- Explicit boundary definitions for complex multi-system environments

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
