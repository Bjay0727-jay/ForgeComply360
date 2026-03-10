-- ============================================================================
-- MIGRATION 012: OSCAL POA&M Export Metadata & VendorGuard Vendor Linkage
-- Supports NIST OSCAL 1.1.2 POA&M model and FedRAMP supply chain tracking
-- ============================================================================
-- Columns are now defined in schema.sql. This migration verifies they exist,
-- creates supporting indexes, and seeds OSCAL UUIDs idempotently.
-- ============================================================================

-- Verify poams columns exist
SELECT oscal_uuid, oscal_poam_item_id FROM poams LIMIT 0;
SELECT related_observations, related_risks FROM poams LIMIT 0;
SELECT vendor_id, vendor_dependency_notes FROM poams LIMIT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_poams_vendor ON poams(vendor_id);
CREATE INDEX IF NOT EXISTS idx_poams_oscal_uuid ON poams(oscal_uuid);

-- Generate unique OSCAL UUIDs for all existing POA&Ms that lack one
UPDATE poams SET oscal_uuid = lower(hex(randomblob(16))) WHERE oscal_uuid IS NULL;

-- If vendor_dependency = 1 but no vendor_id, add note indicating legacy data
UPDATE poams
SET vendor_dependency_notes = 'Legacy vendor dependency - link to specific vendor required'
WHERE vendor_dependency = 1
  AND vendor_id IS NULL
  AND vendor_dependency_notes IS NULL;
