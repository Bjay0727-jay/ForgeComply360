-- Migration 019: POA&M Extended Fields (NO-OP)
--
-- This migration was originally written to add CMMC/FedRAMP extended fields
-- to the poams table. However, ALL columns it adds are already present from
-- earlier migrations:
--   - data_classification, cui_category, risk_register_id, impact_*,
--     deviation_*, compensating_control_description  → migration 010
--   - asset_owner_id, asset_owner_name               → migration 011
--   - oscal_poam_item_id, related_observations,
--     related_risks                                   → migration 012
--
-- Keeping this file so the version numbering sequence remains intact and
-- the migration runner records it as applied.

-- Ensure indexes exist (idempotent)
CREATE INDEX IF NOT EXISTS idx_poams_deviation_type ON poams(deviation_type);
CREATE INDEX IF NOT EXISTS idx_poams_risk_register ON poams(risk_register_id);
