-- Drop trigger
DROP TRIGGER IF EXISTS trigger_create_default_data ON accounts;

-- Drop functions
DROP FUNCTION IF EXISTS create_default_data_for_new_account();
DROP FUNCTION IF EXISTS insert_default_dashboard_layout(BIGINT);
DROP FUNCTION IF EXISTS insert_default_transactions(BIGINT);
DROP FUNCTION IF EXISTS insert_default_budgets(BIGINT);
DROP FUNCTION IF EXISTS insert_default_categories(BIGINT);
