-- ============================================================================
-- MIGRATION 007: Email Notification Digest Support — Index
-- ============================================================================
-- Idempotent index for email digest query performance.
-- Runs after migrate-006 adds the email_sent column.
-- Safe to re-run (IF NOT EXISTS).
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notif_email_digest
  ON notifications(recipient_user_id, email_sent, created_at DESC);
