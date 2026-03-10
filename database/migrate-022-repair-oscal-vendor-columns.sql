-- ============================================================================
-- MIGRATION 022: Repair OSCAL/Vendor Columns (fixes migrate-012)
-- ============================================================================
-- Columns are now defined in schema.sql. This migration verifies they exist,
-- creates the UNIQUE index, and backfills data idempotently.
-- ============================================================================

-- Verify columns exist
SELECT oscal_uuid, oscal_poam_item_id FROM poams LIMIT 0;
SELECT related_observations, related_risks FROM poams LIMIT 0;
SELECT vendor_id, vendor_dependency_notes FROM poams LIMIT 0;

-- Create indexes (including UNIQUE for oscal_uuid)
CREATE UNIQUE INDEX IF NOT EXISTS idx_poams_oscal_uuid ON poams(oscal_uuid);
CREATE INDEX IF NOT EXISTS idx_poams_vendor ON poams(vendor_id);

-- Backfill: Generate OSCAL UUIDs for existing POA&Ms
UPDATE poams SET oscal_uuid = lower(hex(randomblob(16))) WHERE oscal_uuid IS NULL;

-- Backfill: Migrate legacy vendor dependencies
UPDATE poams
SET vendor_dependency_notes = 'Legacy vendor dependency - link to specific vendor required'
WHERE vendor_dependency = 1
  AND vendor_id IS NULL
  AND vendor_dependency_notes IS NULL;

-- Track migration
INSERT OR IGNORE INTO schema_migrations (version, name, description) VALUES
  ('migrate-022-repair-oscal-vendor-columns', 'repair-oscal-vendor-columns', 'Repair migrate-012: add OSCAL/vendor columns that failed due to UNIQUE in ALTER TABLE');
