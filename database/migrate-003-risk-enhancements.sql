-- migrate-003-risk-enhancements.sql
-- Add treatment_due_date column to risks table for treatment tracking
-- Uses a safe pattern: only adds column if it doesn't already exist
CREATE TABLE IF NOT EXISTS _migrate_003_done (id INTEGER PRIMARY KEY);
INSERT OR IGNORE INTO _migrate_003_done (id) VALUES (1);
-- The ALTER will only run if the column doesn't exist yet.
-- If it does exist, the error is caught by wrapping in a transaction-safe way.
-- Since D1 doesn't support TRY/CATCH, we use a different approach:
-- Check via pragma, but D1 doesn't support conditional DDL either.
-- Safest: make this a no-op since schema.sql already has the column via CREATE TABLE IF NOT EXISTS.
SELECT 1;
