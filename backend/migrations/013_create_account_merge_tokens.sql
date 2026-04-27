-- Create account_merge_tokens table for simple account merging
-- Migration: 013_create_account_merge_tokens.sql
-- Created: 2026-04-27
-- Purpose: Enable simple account merging by email verification instead of complex partnership system

CREATE TABLE IF NOT EXISTS account_merge_tokens (
    id SERIAL PRIMARY KEY,
    from_user_id INT NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    to_user_id INT NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_account_merge_tokens_token ON account_merge_tokens(token);
CREATE INDEX IF NOT EXISTS idx_account_merge_tokens_from_user ON account_merge_tokens(from_user_id);
CREATE INDEX IF NOT EXISTS idx_account_merge_tokens_to_user ON account_merge_tokens(to_user_id);
CREATE INDEX IF NOT EXISTS idx_account_merge_tokens_to_email ON account_merge_tokens(to_email);

-- Function to generate merge tokens
CREATE OR REPLACE FUNCTION generate_merge_token() RETURNS TEXT AS $$
BEGIN
    RETURN encode(sha256(random()::text || clock_timestamp()::text), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set merge token
CREATE OR REPLACE FUNCTION set_merge_token() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.token IS NULL THEN
        NEW.token := generate_merge_token();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger only if it doesn't exist
DROP TRIGGER IF EXISTS account_merge_tokens_set_token ON account_merge_tokens;
CREATE TRIGGER account_merge_tokens_set_token
    BEFORE INSERT ON account_merge_tokens
    FOR EACH ROW
    EXECUTE FUNCTION set_merge_token();
