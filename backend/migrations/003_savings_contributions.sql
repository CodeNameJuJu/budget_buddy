-- Savings forecast: add recurring contribution amount and period to savings pots

ALTER TABLE savings_pots ADD COLUMN contribution NUMERIC(12, 2);
ALTER TABLE savings_pots ADD COLUMN contribution_period VARCHAR(20);
