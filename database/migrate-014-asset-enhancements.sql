-- ============================================================================
-- MIGRATION 014: Asset-Finding Relationship Enhancements
-- Adds scan history tracking for FedRAMP CM-8, RA-5 compliance
-- ============================================================================
-- Columns are now defined in schema.sql. This migration verifies they exist.
-- ============================================================================

-- Verify assets columns exist
SELECT first_seen_at, risk_score_updated_at FROM assets LIMIT 0;
