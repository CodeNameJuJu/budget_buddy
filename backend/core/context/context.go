package context

import (
	"database/sql"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/driver/pgdriver"
	"github.com/uptrace/bun/extra/bundebug"
)

var db *bun.DB
var dbConnected bool = false

const DatabaseName = "budget_buddy"

func ConnectToDatabase() {
	var dsn string

	// Check if DATABASE_URL is provided (preferred for Railway/Supabase)
	if databaseURL := os.Getenv("DATABASE_URL"); databaseURL != "" {
		// For Railway, ensure SSL mode is properly set
		if os.Getenv("RAILWAY_ENVIRONMENT") != "" {
			// Railway environment - use require SSL for Railway PostgreSQL
			if !strings.Contains(databaseURL, "sslmode=") {
				dsn = databaseURL + "?sslmode=require"
			} else {
				// Replace existing sslmode with require
				dsn = strings.Replace(databaseURL, "sslmode=disable", "sslmode=require", 1)
				dsn = strings.Replace(dsn, "sslmode=allow", "sslmode=require", 1)
			}
		} else {
			dsn = databaseURL
		}
		fmt.Printf("Using DATABASE_URL: %s\n", maskPassword(databaseURL))
		fmt.Printf("Final DSN: %s\n", maskPassword(dsn))
	} else {
		// Build connection string from individual components
		sslmode := os.Getenv("DB_SSLMODE")
		if sslmode == "" {
			sslmode = "disable" // Default for local development
		}

		dsn = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
			os.Getenv("DB_USERNAME"),
			os.Getenv("DB_PASSWORD"),
			os.Getenv("DB_HOST"),
			os.Getenv("DB_PORT"),
			os.Getenv("DB_NAME"),
			sslmode,
		)
		fmt.Printf("Using individual DB settings, host: %s\n", os.Getenv("DB_HOST"))
	}

	// Create SQL connection with Railway-compatible settings
	sqlDB := sql.OpenDB(pgdriver.NewConnector(
		pgdriver.WithDSN(dsn),
		pgdriver.WithReadTimeout(30*time.Second),
		pgdriver.WithWriteTimeout(30*time.Second),
	))

	// Configure connection pool for Railway
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(25)
	sqlDB.SetConnMaxLifetime(5 * time.Minute)

	db = bun.NewDB(sqlDB, pgdialect.New(), bun.WithDiscardUnknownColumns())

	debug := os.Getenv("DB_DEBUG")
	if debug == "true" {
		db.AddQueryHook(bundebug.NewQueryHook(bundebug.WithVerbose(true)))
	}

	// Test connection with retry logic
	maxRetries := 5
	var lastErr error
	for i := 0; i < maxRetries; i++ {
		if err := db.Ping(); err != nil {
			lastErr = err
			fmt.Printf("Database connection attempt %d/%d failed: %s\n", i+1, maxRetries, err)
			if i < maxRetries-1 {
				time.Sleep(time.Duration(i+1) * time.Second)
				continue
			}
		} else {
			fmt.Println("Connected to database")
			dbConnected = true
			return
		}
	}

	// Don't panic - just log the error and continue
	fmt.Printf("Warning: Failed to connect to database after %d attempts: %s\n", maxRetries, lastErr)
	fmt.Println("Application will continue but database operations will fail until connection is restored")
	dbConnected = false
}

func GetDb() *bun.DB {
	return db
}

func IsDbConnected() bool {
	return dbConnected
}

func CloseDB() {
	if db != nil {
		_ = db.Close()
	}
}

func maskPassword(dsn string) string {
	// Simple password masking for logging
	if len(dsn) > 20 {
		return dsn[:20] + "***" + dsn[len(dsn)-10:]
	}
	return "***"
}
