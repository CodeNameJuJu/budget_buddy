-- Add deleted_date column to dashboard_layouts table
-- Migration: 019_add_deleted_date_to_dashboard_layouts.sql
-- Created: 2026-05-01

ALTER TABLE dashboard_layouts
ADD COLUMN IF NOT EXISTS deleted_date TIMESTAMP;
