-- Create dashboard_layouts table
CREATE TABLE IF NOT EXISTS dashboard_layouts (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    layout TEXT NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_account_id ON dashboard_layouts(account_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_is_active ON dashboard_layouts(is_active);

-- Create unique constraint to prevent duplicate active layouts per account
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_layouts_account_active ON dashboard_layouts(account_id, is_active) WHERE is_active = TRUE;

-- Insert default dashboard layout for account 1
INSERT INTO dashboard_layouts (account_id, name, is_active, layout) VALUES
(1, 'Main Dashboard', TRUE, '[{"id":"balance-1","type":"balance","title":"Account Balance","size":"small","position":{"x":0,"y":0,"w":3,"h":2},"is_visible":true},{"id":"recent-transactions-1","type":"recent_transactions","title":"Recent Transactions","size":"medium","position":{"x":3,"y":0,"w":6,"h":4},"is_visible":true},{"id":"budget-progress-1","type":"budget_progress","title":"Budget Progress","size":"medium","position":{"x":9,"y":0,"w":3,"h":4},"is_visible":true},{"id":"spending-trends-1","type":"spending_trends","title":"Spending Trends","size":"large","position":{"x":0,"y":4,"w":6,"h":4},"is_visible":true},{"id":"goals-overview-1","type":"goals_overview","title":"Savings Goals","size":"medium","position":{"x":6,"y":4,"w":6,"h":4},"is_visible":true}]')
ON CONFLICT (account_id, is_active) WHERE is_active = TRUE DO NOTHING;
