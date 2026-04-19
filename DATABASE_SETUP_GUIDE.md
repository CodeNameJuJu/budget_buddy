# Budget Buddy - Railway Database Setup Guide

## Overview
This guide will help you set up the complete Budget Buddy database schema on Railway PostgreSQL.

## Prerequisites
- Railway account with a PostgreSQL service
- Go installed on your local machine
- Railway CLI (optional but recommended)

## Step 1: Get Your Railway Database Connection

### Option A: Using Railway CLI (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Get your database variables
railway variables list
```

Look for the `DATABASE_URL` variable in the output.

### Option B: Using Railway Dashboard
1. Go to your Railway project dashboard
2. Click on your PostgreSQL service
3. Go to the "Variables" tab
4. Copy the `DATABASE_URL` value

## Step 2: Run Database Migrations

### Method 1: Using Environment Variable
```bash
# Set the DATABASE_URL environment variable
export DATABASE_URL="postgresql://username:password@host:port/database"

# Run migrations
go run run_migrations_simple.go
```

### Method 2: Interactive Mode
```bash
# Run migrations and enter DATABASE_URL when prompted
go run run_migrations_simple.go
```

## Step 3: Verify Database Setup

The migration runner will automatically:
- Create a `schema_migrations` table to track migrations
- Run all 6 migration files in order:
  1. `001_initial_schema.sql` - Core tables (accounts, categories, budgets, transactions)
  2. `002_savings.sql` - Savings feature (savings_pots, savings_allocations)
  3. `003_savings_contributions.sql` - Add contribution fields to savings pots
  4. `004_add_tags.sql` - Add tags to transactions
  5. `005_alerts.sql` - Alert system (alerts, alert_preferences, alert_rules)
  6. `006_dashboard.sql` - Dashboard layouts
- Verify all tables were created successfully

## Expected Tables Created

| Table | Description |
|-------|-------------|
| `accounts` | User accounts with currency and timezone settings |
| `categories` | Income/expense categories with icons and colors |
| `budgets` | Budget limits and periods for categories |
| `transactions` | Financial transactions with tags and notes |
| `savings_pots` | Savings goals with targets and contributions |
| `savings_allocations` | Money allocated to savings pots |
| `alerts` | User notifications and alerts |
| `alert_preferences` | Alert settings per user |
| `alert_rules` | Custom alert rules |
| `dashboard_layouts` | Custom dashboard configurations |
| `schema_migrations` | Migration tracking |

## Troubleshooting

### Connection Issues
- Ensure your DATABASE_URL is correct
- Check that your Railway PostgreSQL service is running
- Verify the database name, username, and password

### Migration Errors
- Check the migration files in `backend/migrations/` directory
- Ensure you have proper permissions on the database
- Some statements may fail gracefully but migrations will continue

### Verification
After running migrations, you should see output like:
```
Table 'accounts' exists
Table 'categories' exists
Table 'budgets' exists
...
All migrations completed successfully!
```

## Next Steps

Once the database is set up:
1. Your Budget Buddy backend can connect to Railway
2. The frontend can start making API calls
3. You can create accounts, categories, budgets, and transactions
4. All features will be fully functional

## Environment Variables for Production

For your Railway backend deployment, ensure these variables are set:
- `DATABASE_URL` - Your PostgreSQL connection string
- `DB_DEBUG` - Set to "true" for debug logging (optional)

## Support

If you encounter issues:
1. Check your Railway service status
2. Verify database credentials
3. Review migration logs for specific errors
4. Ensure all migration files are present in `backend/migrations/`
