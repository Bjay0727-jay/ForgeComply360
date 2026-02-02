-- migrate-003-risk-enhancements.sql
-- Add treatment_due_date column to risks table for treatment tracking
ALTER TABLE risks ADD COLUMN treatment_due_date TEXT;
