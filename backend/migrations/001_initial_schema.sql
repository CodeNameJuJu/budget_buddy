-- Budget Buddy initial schema

CREATE TABLE IF NOT EXISTS accounts (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    currency      VARCHAR(10)  NOT NULL DEFAULT 'ZAR',
    timezone      VARCHAR(50),
    created_date  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP,
    deleted_date  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id            BIGSERIAL PRIMARY KEY,
    account_id    BIGINT       NOT NULL REFERENCES accounts(id),
    name          VARCHAR(255) NOT NULL,
    icon          VARCHAR(50),
    colour        VARCHAR(20),
    type          VARCHAR(10)  NOT NULL CHECK (type IN ('income', 'expense')),
    created_date  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP,
    deleted_date  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budgets (
    id            BIGSERIAL PRIMARY KEY,
    account_id    BIGINT         NOT NULL REFERENCES accounts(id),
    category_id   BIGINT         NOT NULL REFERENCES categories(id),
    name          VARCHAR(255)   NOT NULL,
    amount        NUMERIC(12, 2) NOT NULL,
    period        VARCHAR(10)    NOT NULL CHECK (period IN ('monthly', 'weekly', 'yearly')),
    start_date    DATE           NOT NULL,
    end_date      DATE,
    created_date  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP,
    deleted_date  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id            BIGSERIAL PRIMARY KEY,
    account_id    BIGINT         NOT NULL REFERENCES accounts(id),
    category_id   BIGINT         REFERENCES categories(id),
    budget_id     BIGINT         REFERENCES budgets(id),
    amount        NUMERIC(12, 2) NOT NULL,
    type          VARCHAR(10)    NOT NULL CHECK (type IN ('income', 'expense')),
    description   VARCHAR(500),
    date          DATE           NOT NULL,
    notes         TEXT,
    created_date  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP,
    deleted_date  TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX idx_categories_account_id ON categories(account_id) WHERE deleted_date IS NULL;
CREATE INDEX idx_transactions_account_id ON transactions(account_id) WHERE deleted_date IS NULL;
CREATE INDEX idx_transactions_category_id ON transactions(category_id) WHERE deleted_date IS NULL;
CREATE INDEX idx_transactions_budget_id ON transactions(budget_id) WHERE deleted_date IS NULL;
CREATE INDEX idx_transactions_date ON transactions(date) WHERE deleted_date IS NULL;
CREATE INDEX idx_budgets_account_id ON budgets(account_id) WHERE deleted_date IS NULL;
CREATE INDEX idx_budgets_category_id ON budgets(category_id) WHERE deleted_date IS NULL;
