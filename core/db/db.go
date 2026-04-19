package db

import (
	"database/sql"
	"fmt"
	"os"
	"time"

	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/driver/pgdriver"
	"github.com/uptrace/bun/extra/bundebug"
)

var database *bun.DB

const DatabaseName = "budget_buddy"

func ConnectToDatabase() {
	var dsn string

	// Check if DATABASE_URL is provided (preferred for Supabase)
	if databaseURL := os.Getenv("DATABASE_URL"); databaseURL != "" {
		dsn = databaseURL
		fmt.Printf("Using DATABASE_URL: %s\n", maskPassword(databaseURL))
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

	sqlDB := sql.OpenDB(pgdriver.NewConnector(
		pgdriver.WithDSN(dsn),
		pgdriver.WithReadTimeout(30*time.Second),
		pgdriver.WithWriteTimeout(30*time.Second),
	))

	database = bun.NewDB(sqlDB, pgdialect.New(), bun.WithDiscardUnknownColumns())

	debug := os.Getenv("DB_DEBUG")
	if debug == "true" {
		database.AddQueryHook(bundebug.NewQueryHook(bundebug.WithVerbose(true)))
	}

	// Retry database connection with exponential backoff
	maxRetries := 5
	var lastErr error

	for i := 0; i < maxRetries; i++ {
		if err := database.Ping(); err != nil {
			lastErr = err
			if i < maxRetries-1 {
				waitTime := time.Duration(i+1) * time.Second
				fmt.Printf("Database connection attempt %d failed, retrying in %v: %s\n", i+1, waitTime, err)
				time.Sleep(waitTime)
				continue
			}
		} else {
			fmt.Println("Connected to database")
			return
		}
	}

	panic(fmt.Sprintf("Failed to connect to database after %d attempts: %s", maxRetries, lastErr))
}

func GetDb() *bun.DB {
	return database
}

func CloseDB() {
	if database != nil {
		_ = database.Close()
	}
}

func maskPassword(dsn string) string {
	// Simple password masking for logging
	if len(dsn) > 20 {
		return dsn[:20] + "***" + dsn[len(dsn)-10:]
	}
	return "***"
}
