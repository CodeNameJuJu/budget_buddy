-- Create function to insert default categories for a new account
CREATE OR REPLACE FUNCTION insert_default_categories(account_id_param BIGINT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO categories (name, type, account_id, created_date, modified_date)
    VALUES
        ('Salary', 'income', account_id_param, NOW(), NOW()),
        ('Freelance', 'income', account_id_param, NOW(), NOW()),
        ('Investments', 'income', account_id_param, NOW(), NOW()),
        ('Other Income', 'income', account_id_param, NOW(), NOW()),
        ('Groceries', 'expense', account_id_param, NOW(), NOW()),
        ('Rent', 'expense', account_id_param, NOW(), NOW()),
        ('Utilities', 'expense', account_id_param, NOW(), NOW()),
        ('Transport', 'expense', account_id_param, NOW(), NOW()),
        ('Entertainment', 'expense', account_id_param, NOW(), NOW()),
        ('Healthcare', 'expense', account_id_param, NOW(), NOW()),
        ('Dining Out', 'expense', account_id_param, NOW(), NOW()),
        ('Shopping', 'expense', account_id_param, NOW(), NOW());
END;
$$ LANGUAGE plpgsql;

-- Create function to insert default budgets for a new account
CREATE OR REPLACE FUNCTION insert_default_budgets(account_id_param BIGINT)
RETURNS VOID AS $$
DECLARE
    start_date TIMESTAMP;
BEGIN
    start_date := DATE_TRUNC('month', NOW());
    
    INSERT INTO budgets (account_id, category_id, name, amount, period, start_date, created_date, modified_date)
    SELECT 
        account_id_param,
        c.id,
        c.name || ' Budget',
        CASE c.name
            WHEN 'Groceries' THEN 3000
            WHEN 'Rent' THEN 8000
            WHEN 'Utilities' THEN 1500
            WHEN 'Transport' THEN 2000
            WHEN 'Entertainment' THEN 1000
            ELSE 1000
        END,
        'monthly',
        start_date,
        NOW(),
        NOW()
    FROM categories c
    WHERE c.account_id = account_id_param
    AND c.type = 'expense'
    AND c.name IN ('Groceries', 'Rent', 'Utilities', 'Transport', 'Entertainment');
END;
$$ LANGUAGE plpgsql;

-- Create function to insert default transactions for a new account
CREATE OR REPLACE FUNCTION insert_default_transactions(account_id_param BIGINT)
RETURNS VOID AS $$
DECLARE
    salary_cat_id BIGINT;
    freelance_cat_id BIGINT;
    groceries_cat_id BIGINT;
    rent_cat_id BIGINT;
    utilities_cat_id BIGINT;
    transport_cat_id BIGINT;
    entertainment_cat_id BIGINT;
    dining_out_cat_id BIGINT;
    shopping_cat_id BIGINT;
    healthcare_cat_id BIGINT;
BEGIN
    -- Get category IDs
    SELECT id INTO salary_cat_id FROM categories WHERE account_id = account_id_param AND name = 'Salary';
    SELECT id INTO freelance_cat_id FROM categories WHERE account_id = account_id_param AND name = 'Freelance';
    SELECT id INTO groceries_cat_id FROM categories WHERE account_id = account_id_param AND name = 'Groceries';
    SELECT id INTO rent_cat_id FROM categories WHERE account_id = account_id_param AND name = 'Rent';
    SELECT id INTO utilities_cat_id FROM categories WHERE account_id = account_id_param AND name = 'Utilities';
    SELECT id INTO transport_cat_id FROM categories WHERE account_id = account_id_param AND name = 'Transport';
    SELECT id INTO entertainment_cat_id FROM categories WHERE account_id = account_id_param AND name = 'Entertainment';
    SELECT id INTO dining_out_cat_id FROM categories WHERE account_id = account_id_param AND name = 'Dining Out';
    SELECT id INTO shopping_cat_id FROM categories WHERE account_id = account_id_param AND name = 'Shopping';
    SELECT id INTO healthcare_cat_id FROM categories WHERE account_id = account_id_param AND name = 'Healthcare';
    
    -- Insert income transactions
    INSERT INTO transactions (account_id, category_id, amount, type, description, date, created_date, modified_date)
    VALUES
        (account_id_param, salary_cat_id, 25000, 'income', 'Monthly salary', NOW(), NOW(), NOW()),
        (account_id_param, freelance_cat_id, 3500, 'income', 'Freelance project payment', NOW() - INTERVAL '7 days', NOW(), NOW());
    
    -- Insert expense transactions
    INSERT INTO transactions (account_id, category_id, amount, type, description, date, created_date, modified_date)
    VALUES
        (account_id_param, groceries_cat_id, 850, 'expense', 'Weekly grocery shopping', NOW() - INTERVAL '2 days', NOW(), NOW()),
        (account_id_param, rent_cat_id, 8000, 'expense', 'Monthly rent', DATE_TRUNC('month', NOW()), NOW(), NOW()),
        (account_id_param, utilities_cat_id, 650, 'expense', 'Electricity and water bill', NOW() - INTERVAL '10 days', NOW(), NOW()),
        (account_id_param, transport_cat_id, 450, 'expense', 'Petrol and public transport', NOW() - INTERVAL '3 days', NOW(), NOW()),
        (account_id_param, entertainment_cat_id, 300, 'expense', 'Movie tickets and snacks', NOW() - INTERVAL '5 days', NOW(), NOW()),
        (account_id_param, dining_out_cat_id, 550, 'expense', 'Dinner at restaurant', NOW() - INTERVAL '4 days', NOW(), NOW()),
        (account_id_param, shopping_cat_id, 1200, 'expense', 'New clothes and shoes', NOW() - INTERVAL '8 days', NOW(), NOW()),
        (account_id_param, healthcare_cat_id, 200, 'expense', 'Pharmacy and medication', NOW() - INTERVAL '6 days', NOW(), NOW());
END;
$$ LANGUAGE plpgsql;

-- Create function to insert default dashboard layout for a new account
CREATE OR REPLACE FUNCTION insert_default_dashboard_layout(account_id_param BIGINT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO dashboard_layouts (account_id, name, layout, is_active, created_date, modified_date)
    VALUES (
        account_id_param,
        'Default Layout',
        '[{"id":"welcome","x":0,"y":0,"w":12,"h":4},{"id":"balance","x":0,"y":4,"w":4,"h":4},{"id":"account_summary","x":4,"y":4,"w":4,"h":4},{"id":"spending_trends","x":8,"y":4,"w":4,"h":4},{"id":"recent_transactions","x":0,"y":8,"w":6,"h":4},{"id":"category_breakdown","x":6,"y":8,"w":6,"h":4},{"id":"goals_overview","x":0,"y":12,"w":4,"h":4},{"id":"budget_progress","x":4,"y":12,"w":4,"h":4},{"id":"alerts","x":8,"y":12,"w":4,"h":4}]',
        true,
        NOW(),
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to call all default data functions
CREATE OR REPLACE FUNCTION create_default_data_for_new_account()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default categories
    PERFORM insert_default_categories(NEW.id);
    
    -- Insert default budgets
    PERFORM insert_default_budgets(NEW.id);
    
    -- Insert default transactions
    PERFORM insert_default_transactions(NEW.id);
    
    -- Insert default dashboard layout
    PERFORM insert_default_dashboard_layout(NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on accounts table
DROP TRIGGER IF EXISTS trigger_create_default_data ON accounts;
CREATE TRIGGER trigger_create_default_data
AFTER INSERT ON accounts
FOR EACH ROW
EXECUTE FUNCTION create_default_data_for_new_account();
