-- Fix account-to-user mapping script
-- Migration: 003_fix_account_user_mapping.sql
-- Created: 2026-04-21
-- Purpose: Properly link accounts to existing users instead of user_id=1

-- First, let's see what users we have
DO $$
DECLARE
    user_count INT;
    account_count INT;
    accounts_without_user INT;
    system_user_id INT;
BEGIN
    -- Count existing users
    SELECT COUNT(*) INTO user_count FROM users;
    RAISE NOTICE 'Found % users in the database', user_count;
    
    -- Count existing accounts
    SELECT COUNT(*) INTO account_count FROM accounts;
    RAISE NOTICE 'Found % accounts in the database', account_count;
    
    -- Count accounts without valid user_id
    SELECT COUNT(*) INTO accounts_without_user 
    FROM accounts a 
    LEFT JOIN users u ON a.user_id = u.id 
    WHERE u.id IS NULL;
    
    RAISE NOTICE 'Found % accounts with invalid user_id', accounts_without_user;
    
    IF accounts_without_user > 0 THEN
        -- Get or create system user
        SELECT id INTO system_user_id 
        FROM users 
        WHERE email = 'system@budgetbuddy.local' 
        LIMIT 1;
        
        IF system_user_id IS NULL THEN
            -- Create system user if it doesn't exist
            INSERT INTO users (email, password_hash, first_name, last_name, is_active, email_verified)
            VALUES ('system@budgetbuddy.local', 'temp_hash_system_user', 'System', 'User', true, false)
            RETURNING id INTO system_user_id;
            RAISE NOTICE 'Created system user with ID: %', system_user_id;
        ELSE
            RAISE NOTICE 'Found existing system user with ID: %', system_user_id;
        END IF;
        
        -- Update accounts with invalid user_id to point to system user
        UPDATE accounts 
        SET user_id = system_user_id 
        WHERE user_id NOT IN (SELECT id FROM users);
        
        RAISE NOTICE 'Updated % accounts to point to system user', ROW_COUNT;
    END IF;
END $$;

-- Now let's try to distribute accounts more intelligently if we have multiple users
DO $$
DECLARE
    user_record RECORD;
    account_record RECORD;
    accounts_to_distribute INT;
    accounts_per_user INT;
    remainder INT;
    user_counter INT := 0;
BEGIN
    -- Count accounts that are currently assigned to system user
    SELECT COUNT(*) INTO accounts_to_distribute
    FROM accounts 
    WHERE user_id = (SELECT id FROM users WHERE email = 'system@budgetbuddy.local' LIMIT 1);
    
    -- Count real users (excluding system user)
    SELECT COUNT(*) INTO user_counter
    FROM users 
    WHERE email != 'system@budgetbuddy.local';
    
    RAISE NOTICE 'Accounts to distribute: %, Real users: %', accounts_to_distribute, user_counter;
    
    -- If we have real users and accounts to distribute, distribute them evenly
    IF accounts_to_distribute > 0 AND user_counter > 0 THEN
        accounts_per_user := accounts_to_distribute / user_counter;
        remainder := accounts_to_distribute % user_counter;
        
        RAISE NOTICE 'Distributing % accounts per user with % remainder', accounts_per_user, remainder;
        
        -- Distribute accounts to real users
        user_counter := 0;
        FOR user_record IN 
            SELECT id, email FROM users 
            WHERE email != 'system@budgetbuddy.local' 
            ORDER BY created_at
        LOOP
            user_counter := user_counter + 1;
            
            -- Update accounts for this user
            UPDATE accounts 
            SET user_id = user_record.id 
            WHERE user_id = (SELECT id FROM users WHERE email = 'system@budgetbuddy.local' LIMIT 1)
            LIMIT accounts_per_user;
            
            -- Handle remainder
            IF user_counter <= remainder THEN
                UPDATE accounts 
                SET user_id = user_record.id 
                WHERE user_id = (SELECT id FROM users WHERE email = 'system@budgetbuddy.local' LIMIT 1)
                LIMIT 1;
            END IF;
            
            RAISE NOTICE 'Assigned accounts to user: % (ID: %)', user_record.email, user_record.id;
        END LOOP;
    END IF;
END $$;

-- Final verification
DO $$
DECLARE
    unmapped_accounts INT;
    user_distribution RECORD;
BEGIN
    -- Check for any remaining unmapped accounts
    SELECT COUNT(*) INTO unmapped_accounts
    FROM accounts a 
    LEFT JOIN users u ON a.user_id = u.id 
    WHERE u.id IS NULL;
    
    IF unmapped_accounts > 0 THEN
        RAISE WARNING 'WARNING: % accounts still unmapped!', unmapped_accounts;
    ELSE
        RAISE NOTICE 'SUCCESS: All accounts are properly mapped to users!';
    END IF;
    
    -- Show distribution
    RAISE NOTICE 'Account distribution by user:';
    FOR user_distribution IN 
        SELECT 
            u.email, 
            u.id as user_id,
            COUNT(a.id) as account_count
        FROM users u
        LEFT JOIN accounts a ON u.id = a.user_id
        GROUP BY u.id, u.email
        ORDER BY account_count DESC
    LOOP
        RAISE NOTICE 'User % (ID: %): % accounts', 
            user_distribution.email, 
            user_distribution.user_id, 
            user_distribution.account_count;
    END LOOP;
END $$;
