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
			} else {
				sqlDB := pgdriver.NewConnector(pgdriver.WithDSN(databaseURL))
				db = bun.NewDB(sqlDB, pgdialect.New())
			}
		} else {
			// Use individual DB settings
			sslmode := os.Getenv("DB_SSLMODE")
			if sslmode == "" {
				sslmode = "disable"

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

func GetUserID(c context.Context) int {
	if userID, ok := c.Value("userID").(int); ok {
		return userID
	}
	return 0
}

func GetEnv(key string) string {
	return os.Getenv(key)
}
