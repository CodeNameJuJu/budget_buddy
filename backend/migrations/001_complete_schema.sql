-- Budget Buddy Complete Database Schema
-- This file consolidates all migrations into a single comprehensive schema
-- Created: 2026-04-19
-- Version: 1.0

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table - Main financial accounts
CREATE TABLE IF NOT EXISTS accounts (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    currency      VARCHAR(10)  NOT NULL DEFAULT 'ZAR',
    timezone      VARCHAR(50),
    savings_balance NUMERIC(12, 2) DEFAULT 0,
    created_date  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP,
    deleted_date  TIMESTAMP
);

-- Categories table - Transaction categories
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

-- Budgets table - Budget planning
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

-- Transactions table - Financial transactions
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
    tags          TEXT,
    created_date  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP,
    deleted_date  TIMESTAMP
);

-- ============================================================================
-- SAVINGS SYSTEM
-- ============================================================================

-- Savings pots table - Savings goals/pots
CREATE TABLE IF NOT EXISTS savings_pots (
    id            BIGSERIAL PRIMARY KEY,
    account_id    BIGINT         NOT NULL REFERENCES accounts(id),
    name          VARCHAR(255)   NOT NULL,
    icon          VARCHAR(50),
    colour        VARCHAR(20),
    target        NUMERIC(12, 2),
    contribution  NUMERIC(12, 2),
    contribution_period VARCHAR(20),
    created_date  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP,
    deleted_date  TIMESTAMP
);

-- Savings allocations table - Money allocated to savings pots
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

-- ============================================================================
-- AUTHENTICATION SYSTEM
-- ============================================================================

-- Refresh tokens for JWT session management
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- COUPLES/PARTNERS SYSTEM
-- ============================================================================

-- Partnerships table for linking users as couples/partners
CREATE TABLE IF NOT EXISTS partnerships (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partnership members table to track which users belong to which partnerships
CREATE TABLE IF NOT EXISTS partnership_members (
    id SERIAL PRIMARY KEY,
    partnership_id INTEGER NOT NULL REFERENCES partnerships(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
    permissions JSONB DEFAULT '{}', -- Store granular permissions
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    invited_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(partnership_id, user_id) -- Each user can only be in a partnership once
);

-- Partner invitations table for pending invitations
CREATE TABLE IF NOT EXISTS partner_invitations (
    id SERIAL PRIMARY KEY,
    partnership_id INTEGER NOT NULL REFERENCES partnerships(id) ON DELETE CASCADE,
    invited_email VARCHAR(255) NOT NULL,
    invited_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    invited_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
    message TEXT,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    declined_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shared accounts table - accounts that are shared between partners
CREATE TABLE IF NOT EXISTS shared_accounts (
    id SERIAL PRIMARY KEY,
    partnership_id INTEGER NOT NULL REFERENCES partnerships(id) ON DELETE CASCADE,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    shared_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '{}', -- What permissions partners have
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ALERTS SYSTEM
-- ============================================================================

-- Alerts table - User notifications and alerts
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP,
    reference_id INTEGER,
    metadata TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alert preferences table - User alert settings
CREATE TABLE IF NOT EXISTS alert_preferences (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    threshold INTEGER,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, type)
);

-- Alert rules table - Custom alert rules
CREATE TABLE IF NOT EXISTS alert_rules (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    conditions TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_triggered TIMESTAMP,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- DASHBOARD SYSTEM
-- ============================================================================

-- Dashboard layouts table - Custom dashboard configurations
CREATE TABLE IF NOT EXISTS dashboard_layouts (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    layout TEXT NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Core tables indexes
CREATE INDEX IF NOT EXISTS idx_categories_account_id ON categories(account_id) WHERE deleted_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id) WHERE deleted_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id) WHERE deleted_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_budget_id ON transactions(budget_id) WHERE deleted_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date) WHERE deleted_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_tags ON transactions(tags);
CREATE INDEX IF NOT EXISTS idx_budgets_account_id ON budgets(account_id) WHERE deleted_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id) WHERE deleted_date IS NULL;

-- Savings indexes
CREATE INDEX IF NOT EXISTS idx_savings_pots_account_id ON savings_pots(account_id) WHERE deleted_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_savings_allocations_account_id ON savings_allocations(account_id) WHERE deleted_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_savings_allocations_pot_id ON savings_allocations(savings_pot_id) WHERE deleted_date IS NULL;

-- Authentication indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at);

-- Couples system indexes
CREATE INDEX IF NOT EXISTS idx_partnerships_created_by ON partnerships(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_partnerships_active ON partnerships(is_active);
CREATE INDEX IF NOT EXISTS idx_partnership_members_partnership ON partnership_members(partnership_id);
CREATE INDEX IF NOT EXISTS idx_partnership_members_user ON partnership_members(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_invitations_token ON partner_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_partner_invitations_email ON partner_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_partner_invitations_status ON partner_invitations(status);
CREATE INDEX IF NOT EXISTS idx_shared_accounts_partnership ON shared_accounts(partnership_id);
CREATE INDEX IF NOT EXISTS idx_shared_accounts_account ON shared_accounts(account_id);

-- Alerts indexes
CREATE INDEX IF NOT EXISTS idx_alerts_account_id ON alerts(account_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_expires_at ON alerts(expires_at);
CREATE INDEX IF NOT EXISTS idx_alert_preferences_account_id ON alert_preferences(account_id);
CREATE INDEX IF NOT EXISTS idx_alert_preferences_type ON alert_preferences(type);
CREATE INDEX IF NOT EXISTS idx_alert_rules_account_id ON alert_rules(account_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_type ON alert_rules(type);
CREATE INDEX IF NOT EXISTS idx_alert_rules_is_active ON alert_rules(is_active);

-- Dashboard indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_account_id ON dashboard_layouts(account_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_is_active ON dashboard_layouts(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_layouts_account_active ON dashboard_layouts(account_id, is_active) WHERE is_active = TRUE;

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Update the updated_at trigger for users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update the updated_at trigger for partnerships
CREATE OR REPLACE FUNCTION update_partnerships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_partnerships_updated_at 
    BEFORE UPDATE ON partnerships 
    FOR EACH ROW 
    EXECUTE FUNCTION update_partnerships_updated_at();

-- Function to check if a user has access to a partnership
CREATE OR REPLACE FUNCTION user_has_partnership_access(user_id_param INTEGER, partnership_id_param INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM partnership_members 
        WHERE user_id = user_id_param 
        AND partnership_id = partnership_id_param
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get all partnerships for a user
CREATE OR REPLACE FUNCTION get_user_partnerships(user_id_param INTEGER)
RETURNS TABLE (
    partnership_id INTEGER,
    partnership_name VARCHAR(255),
    role VARCHAR(50),
    partner_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        pm.role,
        (SELECT COUNT(*) FROM partnership_members pm2 WHERE pm2.partnership_id = p.id)
    FROM partnerships p
    JOIN partnership_members pm ON p.id = pm.partnership_id
    WHERE pm.user_id = user_id_param
    AND p.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Insert default alert preferences for account 1
INSERT INTO alert_preferences (account_id, type, enabled, threshold) VALUES
(1, 'budget_threshold', TRUE, 70),
(1, 'budget_exceeded', TRUE, NULL),
(1, 'goal_achieved', TRUE, NULL),
(1, 'goal_milestone', TRUE, NULL),
(1, 'weekly_summary', FALSE, NULL),
(1, 'monthly_summary', FALSE, NULL)
ON CONFLICT (account_id, type) DO NOTHING;

-- Insert default dashboard layout for account 1
INSERT INTO dashboard_layouts (account_id, name, is_active, layout) VALUES
(1, 'Main Dashboard', TRUE, '[{"id":"balance-1","type":"balance","title":"Account Balance","size":"small","position":{"x":0,"y":0,"w":3,"h":2},"is_visible":true},{"id":"recent-transactions-1","type":"recent_transactions","title":"Recent Transactions","size":"medium","position":{"x":3,"y":0,"w":6,"h":4},"is_visible":true},{"id":"budget-progress-1","type":"budget_progress","title":"Budget Progress","size":"medium","position":{"x":9,"y":0,"w":3,"h":4},"is_visible":true},{"id":"spending-trends-1","type":"spending_trends","title":"Spending Trends","size":"large","position":{"x":0,"y":4,"w":6,"h":4},"is_visible":true},{"id":"goals-overview-1","type":"goals_overview","title":"Savings Goals","size":"medium","position":{"x":6,"y":4,"w":6,"h":4},"is_visible":true}]')
ON CONFLICT (account_id, is_active) WHERE is_active = TRUE DO NOTHING;

-- ============================================================================
-- SCHEMA MIGRATION TRACKING
-- ============================================================================

-- Create schema migrations table to track this consolidated migration
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert record for this consolidated migration
INSERT INTO schema_migrations (migration_name) VALUES 
('001_complete_schema')
ON CONFLICT (migration_name) DO NOTHING;
