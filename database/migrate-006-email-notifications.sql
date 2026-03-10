-- ============================================================================
-- MIGRATION 006: Email Notification Digest Support
-- ============================================================================
-- These columns are now part of the base schema.sql definitions.
-- This migration verifies the columns exist (SELECT will fail if not)
-- and creates the supporting index idempotently.
-- ============================================================================

-- Verify expected columns exist (fails fast if schema is out of date)
SELECT email_sent FROM notifications LIMIT 0;
SELECT email_digest FROM notification_preferences LIMIT 0;
SELECT last_digest_sent_at FROM notification_preferences LIMIT 0;

-- Index for email digest queries
CREATE INDEX IF NOT EXISTS idx_notif_email_digest ON notifications(recipient_user_id, email_sent, created_at DESC);
