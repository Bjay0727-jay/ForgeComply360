-- Migration: 0006_report_schedules.sql
-- Scheduled Report Generation & Email Delivery
-- Generated: 2026-03-15

CREATE TABLE IF NOT EXISTS report_schedules (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by TEXT NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('executive-summary', 'compliance-posture', 'risk-summary', 'audit-ready')),
    format TEXT NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf', 'docx')),
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 28),
    time_utc TEXT NOT NULL DEFAULT '08:00',
    recipients TEXT NOT NULL DEFAULT '[]',
    include_charts INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    last_run_at TEXT,
    last_status TEXT CHECK (last_status IN ('success', 'failed', 'skipped')),
    last_error TEXT,
    run_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_report_schedules_org ON report_schedules(org_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_active ON report_schedules(is_active, frequency);

CREATE TABLE IF NOT EXISTS report_history (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    schedule_id TEXT REFERENCES report_schedules(id) ON DELETE SET NULL,
    report_type TEXT NOT NULL,
    format TEXT NOT NULL,
    triggered_by TEXT NOT NULL CHECK (triggered_by IN ('schedule', 'manual', 'api')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'sending', 'completed', 'failed')),
    recipients TEXT DEFAULT '[]',
    email_sent INTEGER DEFAULT 0,
    file_key TEXT,
    file_size INTEGER,
    error_message TEXT,
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_report_history_org ON report_history(org_id);
CREATE INDEX IF NOT EXISTS idx_report_history_schedule ON report_history(schedule_id);
