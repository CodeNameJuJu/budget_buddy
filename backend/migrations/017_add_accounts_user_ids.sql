-- Add user_ids array to accounts to support direct multi-user membership
-- Migration: 017_add_accounts_user_ids.sql
-- Created: 2026-05-01
-- Purpose: Link invited/merged users directly to shared accounts

ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS user_ids BIGINT[];

UPDATE accounts
SET user_ids = ARRAY[user_id]::BIGINT[]
WHERE user_id IS NOT NULL
  AND (user_ids IS NULL OR cardinality(user_ids) = 0);

UPDATE accounts a
SET user_ids = ARRAY(
    SELECT DISTINCT member_id
    FROM unnest(
        COALESCE(a.user_ids, ARRAY[]::BIGINT[])
        || COALESCE(
            (
                SELECT ARRAY_AGG(t.to_user_id)::BIGINT[]
                FROM account_merge_tokens t
                WHERE t.status = 'accepted'
                  AND t.from_user_id = a.user_id
            ),
            ARRAY[]::BIGINT[]
        )
    ) AS member_id
)
WHERE a.deleted_date IS NULL;

UPDATE accounts
SET user_ids = ARRAY[]::BIGINT[]
WHERE user_ids IS NULL;

ALTER TABLE accounts
ALTER COLUMN user_ids SET DEFAULT ARRAY[]::BIGINT[];

CREATE INDEX IF NOT EXISTS idx_accounts_user_ids ON accounts USING GIN (user_ids);
