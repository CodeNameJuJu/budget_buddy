package context

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

var db *bun.DB

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

	db = bun.NewDB(sqlDB, pgdialect.New(), bun.WithDiscardUnknownColumns())

	debug := os.Getenv("DB_DEBUG")
	if debug == "true" {
		db.AddQueryHook(bundebug.NewQueryHook(bundebug.WithVerbose(true)))
	}

	if err := db.Ping(); err != nil {
		fmt.Printf("Warning: Failed to connect to database: %s\n", err)
		fmt.Println("Continuing without database connection for testing purposes")
		return
	}

	fmt.Println("Connected to database")
}

func GetDb() *bun.DB {
	return db
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
