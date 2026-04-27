package context

import (
	"context"
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
var dbConnected bool = false

const DatabaseName = "budget_buddy"

func ConnectToDatabase() {
	var dsn string
	var sqlDB *sql.DB

	// Check if DATABASE_URL is provided (preferred for Railway/Supabase)
	if databaseURL := os.Getenv("DATABASE_URL"); databaseURL != "" {
		// Use Railway's DATABASE_URL
		if os.Getenv("RAILWAY_ENVIRONMENT") != "" {
			// Railway provides SSL by default
			connector := pgdriver.NewConnector(
				pgdriver.WithDSN(databaseURL),
				pgdriver.WithTLSConfig(nil),
			)
			sqlDB = sql.OpenDB(connector)
		} else {
			connector := pgdriver.NewConnector(pgdriver.WithDSN(databaseURL))
			sqlDB = sql.OpenDB(connector)
		}
	} else {
		// Use individual DB settings
		sslmode := os.Getenv("DB_SSLMODE")
		if sslmode == "" {
			sslmode = "disable"
		}
		dsn = fmt.Sprintf(
			"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
			os.Getenv("DB_HOST"),
			os.Getenv("DB_PORT"),
			os.Getenv("DB_USERNAME"),
			os.Getenv("DB_PASSWORD"),
			os.Getenv("DB_NAME"),
			sslmode,
		)
		fmt.Printf("Using individual DB settings, host: %s\n", os.Getenv("DB_HOST"))
		connector := pgdriver.NewConnector(pgdriver.WithDSN(dsn))
		sqlDB = sql.OpenDB(connector)
	}

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
			if i < maxRetries-1 {
				time.Sleep(time.Duration(i+1) * time.Second)
				continue
			}
		} else {
			dbConnected = true
			return
		}
	}

	// Don't panic - just log the error and continue
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

func GetUserID(c context.Context) int {
	if userID, ok := c.Value("userID").(int); ok {
		return userID
	}
	return 0
}

func GetEnv(key string) string {
	return os.Getenv(key)
}
