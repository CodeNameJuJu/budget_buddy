-- Remove partnership-related tables in favor of simple account merging
-- Migration: 014_remove_partnership_tables.sql
-- Created: 2026-04-27
-- Purpose: Remove complex partnership system now that we use simple account merging

-- Drop partnership tables (cascade will handle foreign key dependencies)
DROP TABLE IF EXISTS shared_accounts CASCADE;
DROP TABLE IF EXISTS partnership_members CASCADE;
DROP TABLE IF EXISTS partner_invitations CASCADE;
DROP TABLE IF EXISTS partnerships CASCADE;

-- Drop functions and triggers related to partnerships
DROP FUNCTION IF EXISTS generate_invitation_token() CASCADE;
DROP FUNCTION IF EXISTS set_invitation_token() CASCADE;
