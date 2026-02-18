-- ============================================================================
-- MIGRATION 022: Repair OSCAL/Vendor Columns (fixes migrate-012)
--
-- migrate-012-oscal-vendor-linkage ALWAYS failed because SQLite does not
-- allow UNIQUE constraints in ALTER TABLE ADD COLUMN. Since D1 executes
-- files atomically, the entire batch was rolled back and NONE of the 012
-- columns (oscal_uuid, vendor_id, etc.) were ever added.
--
-- migrate-013 then seeded migrate-012 as "already applied" in
-- schema_migrations, so the smart runner skips it on every deploy.
--
-- This repair migration adds all 6 missing columns and creates the
-- UNIQUE constraint as a separate index instead.
-- ============================================================================

-- ============================================================================
-- 1. ADD MISSING COLUMNS FROM MIGRATE-012
-- ============================================================================

-- OSCAL UUID - unique identifier for OSCAL document references
-- NOTE: UNIQUE is NOT allowed in ALTER TABLE ADD COLUMN in SQLite.
-- We create a UNIQUE INDEX separately below.
ALTER TABLE poams ADD COLUMN oscal_uuid TEXT;

-- OSCAL POA&M Item ID - user-defined identifier for cross-referencing
ALTER TABLE poams ADD COLUMN oscal_poam_item_id TEXT;

-- Related observations - JSON array of observation UUIDs from assessments
ALTER TABLE poams ADD COLUMN related_observations TEXT DEFAULT '[]';

-- Related risks - JSON array of risk UUIDs from risk assessments
ALTER TABLE poams ADD COLUMN related_risks TEXT DEFAULT '[]';

-- FK to vendors table for supply chain risk tracking
ALTER TABLE poams ADD COLUMN vendor_id TEXT;

-- Vendor dependency notes
ALTER TABLE poams ADD COLUMN vendor_dependency_notes TEXT;

-- ============================================================================
-- 2. CREATE INDEXES (including UNIQUE for oscal_uuid)
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_poams_oscal_uuid ON poams(oscal_uuid);
CREATE INDEX IF NOT EXISTS idx_poams_vendor ON poams(vendor_id);

-- ============================================================================
-- 3. BACKFILL: Generate OSCAL UUIDs for existing POA&Ms
-- ============================================================================

UPDATE poams SET oscal_uuid = lower(hex(randomblob(16))) WHERE oscal_uuid IS NULL;

-- ============================================================================
-- 4. BACKFILL: Migrate legacy vendor dependencies
-- ============================================================================

UPDATE poams
SET vendor_dependency_notes = 'Legacy vendor dependency - link to specific vendor required'
WHERE vendor_dependency = 1
  AND vendor_id IS NULL
  AND vendor_dependency_notes IS NULL;

-- ============================================================================
-- 5. TRACK MIGRATION
-- ============================================================================

INSERT OR IGNORE INTO schema_migrations (version, name, description) VALUES
  ('migrate-022-repair-oscal-vendor-columns', 'repair-oscal-vendor-columns', 'Repair migrate-012: add OSCAL/vendor columns that failed due to UNIQUE in ALTER TABLE');
