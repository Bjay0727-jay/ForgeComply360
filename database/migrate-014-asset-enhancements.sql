-- ============================================================================
-- MIGRATION 014: Asset-Finding Relationship Enhancements
-- Adds scan history tracking for FedRAMP CM-8, RA-5 compliance
--
-- NOTE: D1 does not support expression defaults in ALTER TABLE, so new columns
-- use NULL defaults. The risk_score column already exists on the assets table
-- from the original schema; only first_seen_at and risk_score_updated_at need
-- to be added here.
--
-- D1 executes files atomically — if any statement fails the entire batch is
-- rolled back, so bare ALTER TABLE is safe (it either all applies or none).
-- ============================================================================

-- ============================================================================
-- 1. ADD MISSING COLUMNS TO ASSETS TABLE
-- risk_score already exists — do NOT re-add it (would cause duplicate column error)
-- ============================================================================

ALTER TABLE assets ADD COLUMN first_seen_at TEXT;
ALTER TABLE assets ADD COLUMN risk_score_updated_at TEXT;

-- ============================================================================
-- 2. ASSET SCAN HISTORY JUNCTION TABLE
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
-- 3. ENSURE INDEXES EXIST ON ASSETS TABLE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_assets_first_seen ON assets(first_seen_at);
CREATE INDEX IF NOT EXISTS idx_assets_risk_score ON assets(risk_score DESC);

-- ============================================================================
-- 4. BACKFILL EXISTING DATA
-- ============================================================================

UPDATE assets SET first_seen_at = created_at WHERE first_seen_at IS NULL;

-- ============================================================================
-- 5. UPDATE SCHEMA MIGRATIONS TRACKING
-- ============================================================================

INSERT OR IGNORE INTO schema_migrations (version, name, description) VALUES
  ('migrate-014-asset-enhancements', 'asset-enhancements', 'Asset first_seen tracking, risk scores, scan history');
