-- ============================================================================
-- MIGRATION 014: Asset-Finding Relationship Enhancements
-- Adds scan history tracking for FedRAMP CM-8, RA-5 compliance
-- IDEMPOTENT: All statements safe to re-run (no bare ALTER TABLE)
--
-- NOTE: risk_score, risk_score_updated_at, and first_seen_at columns on the
-- assets table are defined in schema.sql and created on fresh databases.
-- This migration only adds supplemental tables/indexes and records itself.
-- ============================================================================

-- ============================================================================
-- 1. ASSET SCAN HISTORY JUNCTION TABLE
-- Tracks which scans discovered/found each asset over time
-- ============================================================================

CREATE TABLE IF NOT EXISTS asset_scan_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  scan_import_id TEXT NOT NULL REFERENCES scan_imports(id) ON DELETE CASCADE,
  findings_count INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  high_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0,
  credentialed INTEGER DEFAULT 0,
  seen_at TEXT DEFAULT (datetime('now')),
  UNIQUE(asset_id, scan_import_id)
);

CREATE INDEX IF NOT EXISTS idx_asset_scan_history_asset ON asset_scan_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_scan_history_scan ON asset_scan_history(scan_import_id);
CREATE INDEX IF NOT EXISTS idx_asset_scan_history_seen ON asset_scan_history(seen_at DESC);

-- ============================================================================
-- 2. ENSURE INDEXES EXIST (idempotent)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_assets_first_seen ON assets(first_seen_at);
CREATE INDEX IF NOT EXISTS idx_assets_risk_score ON assets(risk_score DESC);

-- ============================================================================
-- 3. BACKFILL EXISTING DATA
-- ============================================================================

UPDATE assets SET first_seen_at = created_at WHERE first_seen_at IS NULL;

-- ============================================================================
-- 4. UPDATE SCHEMA MIGRATIONS TRACKING
-- ============================================================================

INSERT OR IGNORE INTO schema_migrations (version, name, description) VALUES
  ('014', 'asset-enhancements', 'Asset first_seen tracking, risk scores, scan history');
