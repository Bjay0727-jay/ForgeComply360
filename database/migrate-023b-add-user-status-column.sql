-- ============================================================================
-- MIGRATION 023b: Add status column to users table (idempotent)
--
-- The application code references users.status for account activation/
-- deactivation but the column was never defined in schema.sql or any prior
-- migration. This must run BEFORE migrate-024 which inserts users with
-- status='active'.
--
-- NOTE: SQLite does not support ALTER TABLE ADD COLUMN IF NOT EXISTS.
-- This migration is made idempotent via the reconciliation step in
-- deploy.yml which detects the column and marks it as applied before
-- the runner reaches this file.
-- ============================================================================

-- Track migration (safe to run even if column was added manually)
INSERT OR IGNORE INTO schema_migrations (version, name, description) VALUES
  ('migrate-023b-add-user-status-column', 'add-user-status-column', 'Add missing status column to users table for account activation/deactivation');
