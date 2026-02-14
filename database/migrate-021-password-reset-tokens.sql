-- ============================================================================
-- MIGRATION 021: Self-Service Password Reset Tokens
-- Enables users to reset their own passwords via email verification
-- ============================================================================

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,  -- SHA-256 hash of the reset token
  expires_at TEXT NOT NULL,         -- Token expiry (15 minutes from creation)
  used_at TEXT,                     -- When the token was used (null if unused)
  created_at TEXT DEFAULT (datetime('now')),
  ip_address TEXT,                  -- IP that requested the reset
  user_agent TEXT                   -- Browser info for security audit
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- Track schema migration
INSERT OR IGNORE INTO schema_migrations (version, name, description, applied_by)
VALUES ('021', 'password_reset_tokens', 'Self-service password reset tokens table', 'claude');
