-- Targeted fix for unmapped accounts
-- Migration: 004_targeted_account_fix.sql
-- Created: 2026-04-21
-- Purpose: Fix accounts that have invalid user_id values

-- First, let's see exactly what's happening
DO $$
DECLARE
    account_details RECORD;
    system_user_id INT;
    updated_rows INT;
BEGIN
    RAISE NOTICE '=== DIAGNOSTIC: Current Account Status ===';
    
    -- Show all accounts and their user_id
    FOR account_details IN 
        SELECT a.id, a.name, a.email, a.user_id, 
               CASE WHEN u.id IS NULL THEN 'INVALID' ELSE 'VALID' END as user_status
        FROM accounts a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.id
    LOOP
        RAISE NOTICE 'Account ID %: % (user_id: % - %)', 
            account_details.id, 
            account_details.name, 
            account_details.user_id, 
            account_details.user_status;
    END LOOP;
    
    -- Create system user if it doesn't exist
    INSERT INTO users (email, password_hash, first_name, last_name, is_active, email_verified)
    VALUES ('system@budgetbuddy.local', 'temp_hash_system_user_fixed', 'System', 'User', true, false)
    ON CONFLICT (email) DO NOTHING;
    
    -- Get system user ID
    SELECT id INTO system_user_id 
    FROM users 
    WHERE email = 'system@budgetbuddy.local' 
    LIMIT 1;
    
    RAISE NOTICE 'System user ID: %', system_user_id;
    
    -- Update ALL accounts that don't have valid user_id
    UPDATE accounts 
    SET user_id = system_user_id 
    WHERE user_id NOT IN (SELECT id FROM users);
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    RAISE NOTICE 'Updated % accounts to point to system user', updated_rows;
    
    -- Now distribute accounts to real users with specific assignments
    -- User 10 -> Account 2, User 11 -> Account 2, User 12 -> Account 3
    UPDATE accounts 
    SET user_id = 10 
    WHERE id = 1;
    
    UPDATE accounts 
    SET user_id = 11 
    WHERE id = 2;
    
    UPDATE accounts 
    SET user_id = 12 
    WHERE id = 3;
    
    RAISE NOTICE 'Distributed accounts to users 10, 11, 12';
    
    -- Final verification
    RAISE NOTICE '=== FINAL ACCOUNT DISTRIBUTION ===';
    FOR account_details IN 
        SELECT a.id, a.name, a.email, a.user_id,
               u.email as user_email
        FROM accounts a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.user_id, a.id
    LOOP
        RAISE NOTICE 'Account % (%s) -> User %s (ID: %)', 
            account_details.id, 
            account_details.name,
            COALESCE(account_details.user_email, 'UNKNOWN'), 
            account_details.user_id;
    END LOOP;
END $$;
