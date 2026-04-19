-- Add tags column to transactions table
ALTER TABLE transactions 
ADD COLUMN tags TEXT;

-- Create index on tags for better performance
CREATE INDEX idx_transactions_tags ON transactions(tags);

-- Add some popular default tags for reference
-- These will be managed in the application, not stored in database
