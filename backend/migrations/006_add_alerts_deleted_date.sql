-- Add deleted_date column to alerts and alert_preferences tables.
-- The Bun ORM models embed the shared Timestamps struct which includes
-- created_date, modified_date and deleted_date. The original alerts schema
-- (001_complete_schema.sql) only created the first two, so any SELECT against
-- alerts/alert_preferences was failing with "column deleted_date does not
-- exist", surfacing as 500 "Could not get alerts".

ALTER TABLE alerts
    ADD COLUMN IF NOT EXISTS deleted_date TIMESTAMP;

ALTER TABLE alert_preferences
    ADD COLUMN IF NOT EXISTS deleted_date TIMESTAMP;

ALTER TABLE alert_rules
    ADD COLUMN IF NOT EXISTS deleted_date TIMESTAMP;
