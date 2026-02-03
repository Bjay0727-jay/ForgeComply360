-- ============================================================================
-- MIGRATION 006: Email Notification Digest Support — Column Additions
-- ============================================================================
-- Adds new columns for email notification support.
-- On first run: succeeds and adds columns.
-- On subsequent runs: fails with "duplicate column" — this is expected.
-- The deploy loop continues to the next migration file regardless.
-- ============================================================================

ALTER TABLE notifications ADD COLUMN email_sent INTEGER DEFAULT 0;
ALTER TABLE notification_preferences ADD COLUMN email_digest INTEGER DEFAULT 1;
ALTER TABLE notification_preferences ADD COLUMN last_digest_sent_at TEXT;
