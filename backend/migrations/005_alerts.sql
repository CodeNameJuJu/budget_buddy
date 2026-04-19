-- Create alerts table
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

-- Create alert_preferences table
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

-- Create alert_rules table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_alerts_account_id ON alerts(account_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_expires_at ON alerts(expires_at);

CREATE INDEX IF NOT EXISTS idx_alert_preferences_account_id ON alert_preferences(account_id);
CREATE INDEX IF NOT EXISTS idx_alert_preferences_type ON alert_preferences(type);

CREATE INDEX IF NOT EXISTS idx_alert_rules_account_id ON alert_rules(account_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_type ON alert_rules(type);
CREATE INDEX IF NOT EXISTS idx_alert_rules_is_active ON alert_rules(is_active);

-- Insert default alert preferences for account 1
INSERT INTO alert_preferences (account_id, type, enabled, threshold) VALUES
(1, 'budget_threshold', TRUE, 70),
(1, 'budget_exceeded', TRUE, NULL),
(1, 'goal_achieved', TRUE, NULL),
(1, 'goal_milestone', TRUE, NULL),
(1, 'weekly_summary', FALSE, NULL),
(1, 'monthly_summary', FALSE, NULL)
ON CONFLICT (account_id, type) DO NOTHING;
