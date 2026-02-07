-- ============================================================================
-- MIGRATION 012: OSCAL POA&M Export Metadata & VendorGuard Vendor Linkage
-- Supports NIST OSCAL 1.1.2 POA&M model and FedRAMP supply chain tracking
-- ============================================================================

-- ============================================================================
-- 1. OSCAL POA&M EXPORT METADATA
-- Enables direct OSCAL POA&M generation without transformation layer
-- Supports eMASS and CSAM import requirements
-- ============================================================================

-- OSCAL UUID - unique identifier for OSCAL document references
-- Auto-generated for new POA&Ms, can be exported as poam-item uuid
ALTER TABLE poams ADD COLUMN oscal_uuid TEXT UNIQUE;

-- OSCAL POA&M Item ID - user-defined identifier for cross-referencing
-- Maps to OSCAL poam-item/finding-uuid
ALTER TABLE poams ADD COLUMN oscal_poam_item_id TEXT;

-- Related observations - JSON array of observation UUIDs from assessments
-- Maps to OSCAL poam-item/related-observations
ALTER TABLE poams ADD COLUMN related_observations TEXT DEFAULT '[]';

-- Related risks - JSON array of risk UUIDs from risk assessments
-- Maps to OSCAL poam-item/related-risks
ALTER TABLE poams ADD COLUMN related_risks TEXT DEFAULT '[]';

-- ============================================================================
-- 2. VENDORGUARD VENDOR LINKAGE
-- Replace free-text vendor_dependency with proper FK to vendors table
-- Enables vendor risk dashboards showing POA&Ms blocked by third-parties
-- ============================================================================

-- FK to vendors table for supply chain risk tracking
-- ON DELETE SET NULL preserves POA&M if vendor is removed
ALTER TABLE poams ADD COLUMN vendor_id TEXT REFERENCES vendors(id) ON DELETE SET NULL;

-- Vendor dependency notes (replaces binary vendor_dependency flag)
-- Describes specific vendor actions needed for remediation
ALTER TABLE poams ADD COLUMN vendor_dependency_notes TEXT;

-- ============================================================================
-- 3. CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_poams_vendor ON poams(vendor_id);
CREATE INDEX IF NOT EXISTS idx_poams_oscal_uuid ON poams(oscal_uuid);

-- ============================================================================
-- 4. GENERATE OSCAL UUIDs FOR EXISTING POA&Ms
-- ============================================================================

-- Generate unique OSCAL UUIDs for all existing POA&Ms
-- Uses same pattern as primary ID generation
UPDATE poams SET oscal_uuid = lower(hex(randomblob(16))) WHERE oscal_uuid IS NULL;

-- ============================================================================
-- 5. MIGRATE EXISTING VENDOR DEPENDENCIES
-- ============================================================================

-- If vendor_dependency = 1 but no vendor_id, add note indicating legacy data
UPDATE poams
SET vendor_dependency_notes = 'Legacy vendor dependency - link to specific vendor required'
WHERE vendor_dependency = 1
  AND vendor_id IS NULL
  AND vendor_dependency_notes IS NULL;
