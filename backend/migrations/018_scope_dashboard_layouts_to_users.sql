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

UPDATE dashboard_layouts
SET is_active = false
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY user_id
                   ORDER BY COALESCE(modified_date, created_date) DESC, id DESC
               ) AS row_number
        FROM dashboard_layouts
        WHERE is_active = true
          AND user_id IS NOT NULL
    ) ranked
    WHERE ranked.row_number > 1
);

ALTER TABLE dashboard_layouts
ALTER COLUMN user_id SET NOT NULL;

DROP INDEX IF EXISTS idx_dashboard_layouts_account_active;

CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user_id ON dashboard_layouts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_layouts_user_active ON dashboard_layouts(user_id, is_active) WHERE is_active = true;
