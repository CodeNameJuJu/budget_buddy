-- ============================================================================
-- CREDIT SYSTEM
-- ============================================================================

-- Credit pots table - Credit/debt sources
CREATE TABLE IF NOT EXISTS credit_pots (
    id            BIGSERIAL PRIMARY KEY,
    account_id    BIGINT         NOT NULL REFERENCES accounts(id),
    name          VARCHAR(255)   NOT NULL,
    icon          VARCHAR(50),
    colour        VARCHAR(20),
    total_payable NUMERIC(12, 2) NOT NULL,
    monthly_payment NUMERIC(12, 2),
    payment_period VARCHAR(20),
    interest_rate NUMERIC(5, 2),
    interest_period VARCHAR(20),
    created_date  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP,
    deleted_date  TIMESTAMP
);

-- Credit payments table - Payments made towards credit pots
CREATE TABLE IF NOT EXISTS credit_payments (
    id              BIGSERIAL PRIMARY KEY,
    account_id      BIGINT         NOT NULL REFERENCES accounts(id),
    credit_pot_id   BIGINT         NOT NULL REFERENCES credit_pots(id),
    amount          NUMERIC(12, 2) NOT NULL,
    notes           TEXT,
    created_date    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date   TIMESTAMP,
    deleted_date    TIMESTAMP
);

-- Add credit_payment_id to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS credit_payment_id BIGINT REFERENCES credit_payments(id) ON DELETE SET NULL;

-- Create indexes for credit tables
CREATE INDEX IF NOT EXISTS idx_credit_pots_account_id ON credit_pots(account_id) WHERE deleted_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_credit_payments_account_id ON credit_payments(account_id) WHERE deleted_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_credit_payments_pot_id ON credit_payments(credit_pot_id) WHERE deleted_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_credit_payment_id ON transactions(credit_payment_id) WHERE deleted_date IS NULL;
