-- Drop and recreate partnership tables with correct schema
-- Migration: 008_recreate_partnership_tables.sql
-- Purpose: Drop existing partnership tables and recreate them with correct schema

-- Drop existing tables (cascade to handle dependencies)
DROP TABLE IF EXISTS shared_accounts CASCADE;
DROP TABLE IF EXISTS partner_invitations CASCADE;
DROP TABLE IF EXISTS partnership_members CASCADE;
DROP TABLE IF EXISTS partnerships CASCADE;

-- Partnerships table
CREATE TABLE partnerships (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by_user_id INT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP,
    deleted_date TIMESTAMP,
    
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Partnership members table
CREATE TABLE partnership_members (
    id SERIAL PRIMARY KEY,
    partnership_id INT NOT NULL,
    user_id INT NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    permissions TEXT, -- JSON string of permissions
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    invited_by_user_id INT,
    
    FOREIGN KEY (partnership_id) REFERENCES partnerships(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE(partnership_id, user_id)
);

-- Partner invitations table
CREATE TABLE partner_invitations (
    id SERIAL PRIMARY KEY,
    partnership_id INT NOT NULL,
    invited_email VARCHAR(255) NOT NULL,
    invited_user_id INT,
    invited_by_user_id INT NOT NULL,
    invitation_token VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    message TEXT,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    declined_at TIMESTAMP,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (partnership_id) REFERENCES partnerships(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (invited_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Shared accounts table
CREATE TABLE shared_accounts (
    id SERIAL PRIMARY KEY,
    partnership_id INT NOT NULL,
    account_id INT NOT NULL,
    shared_by_user_id INT NOT NULL,
    permissions TEXT, -- JSON string of permissions
    is_active BOOLEAN DEFAULT true,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (partnership_id) REFERENCES partnerships(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE(partnership_id, account_id)
);

-- Indexes for performance
CREATE INDEX idx_partnerships_created_by_user ON partnerships(created_by_user_id);
CREATE INDEX idx_partnership_members_partnership ON partnership_members(partnership_id);
CREATE INDEX idx_partnership_members_user ON partnership_members(user_id);
CREATE INDEX idx_partner_invitations_token ON partner_invitations(invitation_token);
CREATE INDEX idx_partner_invitations_email ON partner_invitations(invited_email);
CREATE INDEX idx_shared_accounts_partnership ON shared_accounts(partnership_id);
CREATE INDEX idx_shared_accounts_account ON shared_accounts(account_id);

-- Function to generate invitation tokens
CREATE OR REPLACE FUNCTION generate_invitation_token() RETURNS TEXT AS $$
BEGIN
    RETURN encode(sha256(random()::text || clock_timestamp()::text), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set invitation token
CREATE OR REPLACE FUNCTION set_invitation_token() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invitation_token IS NULL THEN
        NEW.invitation_token := generate_invitation_token();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for invitation token
DROP TRIGGER IF EXISTS partner_invitations_set_token ON partner_invitations;
CREATE TRIGGER partner_invitations_set_token
    BEFORE INSERT ON partner_invitations
    FOR EACH ROW
    EXECUTE FUNCTION set_invitation_token();
