-- Add columns to link transactions with savings allocations
-- Migration: 015_add_savings_transaction_columns.sql
-- Created: 2026-04-27
-- Purpose: Enable automatic transaction creation for savings operations

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS savings_allocation_id INT,
ADD COLUMN IF NOT EXISTS account_type VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_transactions_savings_allocation ON transactions(savings_allocation_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_type ON transactions(account_type);

-- Add foreign key constraint (PostgreSQL doesn't support IF NOT EXISTS with ADD CONSTRAINT)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_transactions_savings_allocation'
    ) THEN
        ALTER TABLE transactions 
        ADD CONSTRAINT fk_transactions_savings_allocation 
        FOREIGN KEY (savings_allocation_id) REFERENCES savings_allocations(id) ON DELETE SET NULL;
    END IF;
END $$;
