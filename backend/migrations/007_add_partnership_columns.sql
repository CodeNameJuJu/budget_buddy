-- Add missing columns to partnerships table if they don't exist
-- Migration: 007_add_partnership_columns.sql
-- Purpose: Fix partnerships table schema to match type definitions

-- Add created_date column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'partnerships' AND column_name = 'created_date'
    ) THEN
        ALTER TABLE partnerships ADD COLUMN created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add modified_date column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'partnerships' AND column_name = 'modified_date'
    ) THEN
        ALTER TABLE partnerships ADD COLUMN modified_date TIMESTAMP;
    END IF;
END $$;

-- Add deleted_date column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'partnerships' AND column_name = 'deleted_date'
    ) THEN
        ALTER TABLE partnerships ADD COLUMN deleted_date TIMESTAMP;
    END IF;
END $$;
