# Data Migration Guide: Local to Railway

## Overview
This guide helps you migrate your local Budget Buddy data to the Railway PostgreSQL database.

## Step 1: Export Local Data

1. **Run the export script** from your local machine:
   ```bash
   cd /Users/julian/Projects/Julian/budgetBuddy
   go run export_local_data.go
   ```

2. **This will create CSV files**:
   - `accounts_export.csv`
   - `categories_export.csv`
   - `budgets_export.csv`
   - `transactions_export.csv`
   - `savings_pots_export.csv`

## Step 2: Prepare Railway Database

1. **Ensure Railway backend is running** with full API
2. **Run database migrations** on Railway:
   - Go to Railway backend console
   - Run: `go run run_migrations.go`

## Step 3: Import Data to Railway

### Option A: Railway Console (Recommended)

1. **Go to your Railway backend service**
2. **Click "Console" or "Shell"**
3. **Upload the CSV files** to Railway
4. **Run the import script**:
   ```bash
   go run import_to_railway.go
   ```

### Option B: Local Import

1. **Set Railway DATABASE_URL** locally:
   ```bash
   export DATABASE_URL="postgresql://user:pass@host.railway.app:port/db"
   ```

2. **Run the import script**:
   ```bash
   go run import_to_railway.go
   ```

## Step 4: Verify Migration

1. **Test the frontend**: Visit your Vercel app
2. **Check data**: Verify all your accounts, categories, transactions, etc. are present
3. **Test functionality**: Try creating a new transaction to ensure everything works

## What Gets Migrated

- **Accounts**: Bank accounts and their balances
- **Categories**: Income and expense categories
- **Budgets**: Budget limits and periods
- **Transactions**: All financial transactions
- **Savings Pots**: Savings goals and progress

## Important Notes

- **Backup First**: Always backup your local database before migration
- **Check IDs**: The migration preserves original IDs for relationships
- **Order Matters**: Data is imported in dependency order (accounts first, then transactions last)
- **Verify Data**: Double-check that all data migrated correctly

## Troubleshooting

### If Import Fails:
1. **Check Railway logs** for specific error messages
2. **Verify CSV files** are not corrupted
3. **Ensure database tables exist** (run migrations first)
4. **Check environment variables** in Railway

### If Data Missing:
1. **Check import logs** for any skipped records
2. **Verify CSV files** contain all expected data
3. **Run import again** if needed (it will skip duplicates)

## Alternative: Manual Entry

If migration fails, you can always:
1. **Create accounts manually** in the frontend
2. **Import transactions** using CSV import (if available)
3. **Start fresh** with new data

## Support

If you encounter issues:
1. **Check Railway logs** for specific errors
2. **Verify CSV file formats**
3. **Ensure database connectivity**
4. **Test with small data first**
