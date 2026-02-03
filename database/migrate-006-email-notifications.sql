-- ============================================================================
-- MIGRATION 006: Email Notification Digest Support
-- ============================================================================

-- New columns added to notifications and notification_preferences tables
-- via schema.sql for fresh installs:
--   notifications.email_sent INTEGER DEFAULT 0
--   notification_preferences.email_digest INTEGER DEFAULT 1
--   notification_preferences.last_digest_sent_at TEXT
--
-- For existing databases, these columns were applied manually once.
-- SQLite does not support ALTER TABLE ADD COLUMN IF NOT EXISTS,
-- so we cannot safely re-run ALTER TABLE statements in migrations.

-- Index for email digest query (idempotent)
CREATE INDEX IF NOT EXISTS idx_notif_email_digest
  ON notifications(recipient_user_id, email_sent, created_at DESC);
