-- ============================================================================
-- MIGRATION 023b: Add status column to users table
--
-- The application code references users.status for account activation/
-- deactivation (workers/index.js lines 706, 1499, 5376, 5407) but the
-- column was never defined in schema.sql or any prior migration.
-- This must run BEFORE migrate-024 which inserts users with status='active'.
-- ============================================================================

ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deactivated'));

-- Track migration
INSERT OR IGNORE INTO schema_migrations (version, name, description) VALUES
  ('migrate-023b-add-user-status-column', 'add-user-status-column', 'Add missing status column to users table for account activation/deactivation');
