-- ============================================================================
-- RECURRING TRANSACTIONS
-- ============================================================================

-- Recurring transactions table - Templates for transactions that repeat every
-- budget period and are triggered manually instead of captured by hand
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id            BIGSERIAL PRIMARY KEY,
    account_id    BIGINT         NOT NULL REFERENCES accounts(id),
    budget_id     BIGINT         NOT NULL REFERENCES budgets(id),
    category_id   BIGINT         REFERENCES categories(id),
    amount        NUMERIC(12, 2) NOT NULL,
    type          VARCHAR(10)    NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
    description   VARCHAR(500)   NOT NULL,
    notes         TEXT,
    due_day       INT            CHECK (due_day IS NULL OR (due_day >= 1 AND due_day <= 31)),
    is_active     BOOLEAN        NOT NULL DEFAULT TRUE,
    created_date  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP,
    deleted_date  TIMESTAMP
);

-- Link triggered transactions back to their recurring template so we can tell
-- whether a template has already been captured in the current period
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recurring_transaction_id BIGINT REFERENCES recurring_transactions(id);

CREATE INDEX IF NOT EXISTS idx_recurring_transactions_budget_id ON recurring_transactions(budget_id) WHERE deleted_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_account_id ON recurring_transactions(account_id) WHERE deleted_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_recurring_transaction_id ON transactions(recurring_transaction_id) WHERE deleted_date IS NULL;
