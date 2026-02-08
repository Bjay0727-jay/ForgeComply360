-- ============================================================================
-- MIGRATION 013: Schema Migrations Tracking
-- Enables reliable tracking of applied migrations across environments
-- ============================================================================

-- ============================================================================
-- 1. SCHEMA MIGRATIONS TABLE
-- Tracks which migrations have been applied to this database
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  version TEXT NOT NULL UNIQUE,           -- e.g., '001', '012', 'v1.0.0'
  name TEXT NOT NULL,                       -- Human-readable migration name
  description TEXT,                         -- Brief description of changes
  applied_at TEXT DEFAULT (datetime('now')),
  applied_by TEXT,                          -- User/system that applied migration
  checksum TEXT,                            -- Optional SHA256 of migration file
  execution_time_ms INTEGER,                -- How long the migration took
  success INTEGER DEFAULT 1                 -- 0 = failed/rolled back
);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations(version);
CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied ON schema_migrations(applied_at);

-- ============================================================================
-- 2. SEED HISTORICAL MIGRATIONS
-- Record all previously applied migrations for tracking
-- ============================================================================

INSERT OR IGNORE INTO schema_migrations (version, name, description) VALUES
  ('001', 'initial-schema', 'Core tables: orgs, users, frameworks, controls, poams, assets'),
  ('002', 'audit-logging', 'Audit log table for compliance tracking'),
  ('003', 'evidence-attachments', 'Evidence management with file attachments'),
  ('004', 'system-boundaries', 'System and boundary definitions for RMF'),
  ('005', 'vendor-risk', 'VendorGuard vendor risk management module'),
  ('006', 'workflow-engine', 'Workflow automation and task assignments'),
  ('007', 'notifications', 'User notifications and preferences'),
  ('008', 'sso-integration', 'SSO metadata and external auth support'),
  ('009', 'poam-junction-tables', 'FedRAMP POA&M asset/control/evidence linking'),
  ('010', 'poam-cmmc-enhancements', 'Data sensitivity, CUI, deviation tracking'),
  ('011', 'asset-responsibility-model', 'Asset environment, boundaries, responsibility'),
  ('012', 'oscal-vendor-linkage', 'OSCAL POA&M export metadata, vendor FK'),
  ('013', 'schema-migrations-tracking', 'This migration - schema version tracking');

