-- Add dashboard_layout column to accounts table
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS dashboard_layout TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_accounts_dashboard_layout ON accounts(dashboard_layout);
