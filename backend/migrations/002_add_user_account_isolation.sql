-- Add user_id foreign key to accounts table for proper data isolation
-- Migration: 002_add_user_account_isolation.sql
-- Created: 2026-04-21
-- Purpose: Fix security vulnerability by linking accounts to users
-- This migration is completely idempotent and safe to run multiple times

-- Step 1: Create system user for existing accounts (idempotent)
-- Only insert if the user doesn't already exist
INSERT INTO users (email, password_hash, first_name, last_name, is_active, email_verified)
VALUES ('system@budgetbuddy.local', 'temp_hash_system_user', 'System', 'User', true, false)
ON CONFLICT (email) DO NOTHING;

-- Step 2: Add user_id column as nullable (idempotent)
-- Only add if the column doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accounts' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE accounts ADD COLUMN user_id BIGINT;
    END IF;
END $$;

-- Step 3: Update existing accounts to belong to the system user (idempotent)
-- Only update accounts that don't have a user_id yet
UPDATE accounts 
SET user_id = (SELECT id FROM users WHERE email = 'system@budgetbuddy.local' LIMIT 1)
WHERE user_id IS NULL;

-- Step 4: Make the column NOT NULL (only if safe to do so)
-- Check that all accounts have user_id before making it NOT NULL
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM accounts WHERE user_id IS NULL LIMIT 1
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accounts' 
        AND column_name = 'user_id' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE accounts ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

-- Step 5: Add foreign key constraint (idempotent)
-- Only add if the constraint doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_accounts_user_id' 
        AND table_name = 'accounts'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE accounts ADD CONSTRAINT fk_accounts_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 6: Create index for performance (idempotent)
-- Only create if the index doesn't already exist
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- Step 7: Verification step - ensure migration completed successfully
DO $$
DECLARE
    accounts_without_user INT;
    system_user_exists INT;
    constraint_exists INT;
    column_exists INT;
BEGIN
    -- Check if system user exists
    SELECT COUNT(*) INTO system_user_exists 
    FROM users WHERE email = 'system@budgetbuddy.local';
    
    -- Check if column exists
    SELECT COUNT(*) INTO column_exists
    FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'user_id';
    
    -- Check if all accounts have user_id
    SELECT COUNT(*) INTO accounts_without_user
    FROM accounts WHERE user_id IS NULL;
    
    -- Check if constraint exists
    SELECT COUNT(*) INTO constraint_exists
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_accounts_user_id' AND table_name = 'accounts';
    
    -- Log migration status
    RAISE NOTICE 'Migration Status: System User Exists: %, Column Exists: %, Accounts Without User: %, Constraint Exists: %', 
        system_user_exists, column_exists, accounts_without_user, constraint_exists;
        
    IF accounts_without_user > 0 THEN
        RAISE WARNING 'WARNING: % accounts still without user_id', accounts_without_user;
    END IF;
END $$;
