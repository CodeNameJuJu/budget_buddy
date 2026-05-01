-- Add billing_cycle_day column to accounts table
-- Migration: 020_add_billing_cycle_day.sql
-- Created: 2026-05-01

ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS billing_cycle_day INTEGER DEFAULT 25;
