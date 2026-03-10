-- ============================================================================
-- MIGRATION 015: Notification Enhancements
-- Adds version tracking for efficient polling and priority levels
-- ============================================================================
-- Columns are now defined in schema.sql. This migration verifies they exist
-- and creates supporting indexes idempotently.
-- ============================================================================

-- Verify users columns exist
SELECT notification_version, notification_last_check FROM users LIMIT 0;

-- Verify notifications columns exist
SELECT priority, batch_id FROM notifications LIMIT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_notification_version ON users(notification_version);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_batch ON notifications(batch_id);

-- Track migration
INSERT OR IGNORE INTO schema_migrations (version, name, description) VALUES
  ('migrate-015-notifications-enhancements', 'notifications-enhancements', 'Notification version tracking and priority levels');
