-- Scope dashboard layouts to users so each user has their own layout across devices
-- Migration: 018_scope_dashboard_layouts_to_users.sql
-- Created: 2026-05-01

ALTER TABLE dashboard_layouts
ADD COLUMN IF NOT EXISTS user_id BIGINT;

UPDATE dashboard_layouts dl
SET user_id = a.user_id
FROM accounts a
WHERE dl.account_id = a.id
  AND dl.user_id IS NULL;

-- Drop old account-scoped index if it exists
DROP INDEX IF EXISTS idx_dashboard_layouts_account_active;

-- Create user-scoped index
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user_id ON dashboard_layouts(user_id);
