-- Savings feature: pots, allocations, and account savings balance

ALTER TABLE accounts ADD COLUMN savings_balance NUMERIC(12, 2);

CREATE TABLE IF NOT EXISTS savings_pots (
    id            BIGSERIAL PRIMARY KEY,
    account_id    BIGINT         NOT NULL REFERENCES accounts(id),
    name          VARCHAR(255)   NOT NULL,
    icon          VARCHAR(50),
    colour        VARCHAR(20),
    target        NUMERIC(12, 2),
    created_date  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP,
    deleted_date  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS savings_allocations (
    id              BIGSERIAL PRIMARY KEY,
    account_id      BIGINT         NOT NULL REFERENCES accounts(id),
    savings_pot_id  BIGINT         NOT NULL REFERENCES savings_pots(id),
    amount          NUMERIC(12, 2) NOT NULL,
    notes           TEXT,
    created_date    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date   TIMESTAMP,
    deleted_date    TIMESTAMP
);

CREATE INDEX idx_savings_pots_account_id ON savings_pots(account_id) WHERE deleted_date IS NULL;
CREATE INDEX idx_savings_allocations_account_id ON savings_allocations(account_id) WHERE deleted_date IS NULL;
CREATE INDEX idx_savings_allocations_pot_id ON savings_allocations(savings_pot_id) WHERE deleted_date IS NULL;
