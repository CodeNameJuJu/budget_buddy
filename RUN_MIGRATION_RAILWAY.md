# Running Migrations on Railway

## Method 1: Automatic (Recommended)
The migration runs automatically when you deploy to Railway. Just push your code and Railway will handle the rest.

## Method 2: Railway Console (Manual)

1. **Go to Railway Dashboard**
   - Navigate to your Budget Buddy project
   - Click on "Console" tab

2. **Connect to Database**
   ```bash
   # Railway automatically provides connection string
   # Just click "Connect" in the Railway UI
   ```

3. **Run Migration Manually**
   ```sql
   -- Copy the contents of 001_complete_schema.sql
   -- and paste into the Railway console
   ```

## Method 3: Local Migration (Development)

If you want to test locally first:

1. **Set up local database**
   ```bash
   # Set DATABASE_URL or individual env vars
   export DATABASE_URL="postgres://user:password@localhost:5432/budget_buddy"
   ```

2. **Run the application**
   ```bash
   go run main.go
   # Migration will run automatically on startup
   ```

## Method 4: Direct SQL Execution

1. **Get Railway connection string**
   - Railway Dashboard > Your Project > Variables
   - Copy `DATABASE_URL`

2. **Connect with psql**
   ```bash
   psql $DATABASE_URL
   ```

3. **Run migration**
   ```bash
   # Copy contents of 001_complete_schema.sql
   # Or use \i command if file is accessible
   \i backend/migrations/001_complete_schema.sql
   ```

## Verification

After migration, verify tables exist:

```sql
-- Check if tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check migration tracking
SELECT * FROM schema_migrations;
```

## Troubleshooting

### Migration Already Run Error
If you see "migration already applied", this is normal. The system prevents re-running.

### Permission Errors
Ensure Railway database user has CREATE, ALTER, INSERT permissions.

### Connection Issues
Check Railway variables and ensure DATABASE_URL is correctly set.

---

**Note**: The automatic migration (Method 1) is the recommended approach for Railway deployments.
