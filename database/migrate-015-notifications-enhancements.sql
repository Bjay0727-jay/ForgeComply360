-- ============================================================================
-- MIGRATION 015: Notification Enhancements
-- Adds version tracking for efficient polling and priority levels
-- ============================================================================

-- ============================================================================
-- 1. USER NOTIFICATION VERSION TRACKING
-- Enables efficient polling with ETag-style cache invalidation
-- ============================================================================

-- Add notification version counter to users
ALTER TABLE users ADD COLUMN notification_version INTEGER DEFAULT 0;

-- Add last check timestamp for analytics
ALTER TABLE users ADD COLUMN notification_last_check TEXT;

-- Index for efficient version lookups
CREATE INDEX IF NOT EXISTS idx_users_notification_version ON users(notification_version);

-- ============================================================================
-- 2. NOTIFICATION PRIORITY LEVELS
-- Supports urgent notifications for critical alerts
-- ============================================================================

ALTER TABLE notifications ADD COLUMN priority TEXT
  DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- Add batch_id for grouping related notifications
ALTER TABLE notifications ADD COLUMN batch_id TEXT;

-- Indexes for efficient priority queries
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_batch ON notifications(batch_id);

-- ============================================================================
-- 3. UPDATE SCHEMA MIGRATIONS TRACKING
-- ============================================================================

INSERT OR IGNORE INTO schema_migrations (version, name, description) VALUES
  ('migrate-015-notifications-enhancements', 'notifications-enhancements', 'Notification version tracking and priority levels');

