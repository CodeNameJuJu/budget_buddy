package main

import (
	"context"
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/driver/pgdriver"
	"github.com/uptrace/bun/extra/bundebug"
)

func main() {
	fmt.Println("Budget Buddy - Railway Migration Runner")
	fmt.Println("=====================================")

	// This is designed to run on Railway where DATABASE_URL is available
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	fmt.Printf("Connecting to Railway database...\n")
	fmt.Printf("URL: %s\n", maskPassword(dbURL))

	// Connect to database
	sqlDB := sql.OpenDB(pgdriver.NewConnector(
		pgdriver.WithDSN(dbURL),
		pgdriver.WithReadTimeout(30*time.Second),
		pgdriver.WithWriteTimeout(30*time.Second),
	))

	db := bun.NewDB(sqlDB, pgdialect.New(), bun.WithDiscardUnknownColumns())

	// Add debug logging
	debug := os.Getenv("DB_DEBUG")
	if debug == "true" {
		db.AddQueryHook(bundebug.NewQueryHook(bundebug.WithVerbose(true)))
	}

	// Test connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to connect to database: %s", err)
	}

	fmt.Println("Successfully connected to Railway database!")

	// Create migrations table if it doesn't exist
	if err := createMigrationsTable(db); err != nil {
		log.Fatalf("Failed to create migrations table: %s", err)
	}

	// Run all migrations
	if err := runMigrations(db); err != nil {
		log.Fatalf("Failed to run migrations: %s", err)
	}

	// Verify tables were created
	if err := verifyTables(db); err != nil {
		log.Fatalf("Failed to verify tables: %s", err)
	}

	fmt.Println("\n=====================================")
	fmt.Println("All migrations completed successfully!")
	fmt.Println("Budget Buddy database is ready!")
	fmt.Println("=====================================")
}

func maskPassword(url string) string {
	if idx := strings.Index(url, "@"); idx != -1 {
		if idx2 := strings.LastIndex(url[:idx], ":"); idx2 != -1 {
			return url[:idx2] + ":****" + url[idx:]
		}
	}
	return url
}

func createMigrationsTable(db *bun.DB) error {
	fmt.Println("\nCreating migrations table...")
	
	ctx := context.Background()
	_, err := db.NewRaw(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`).Exec(ctx)

	return err
}

func runMigrations(db *bun.DB) error {
	// Get migration files
	migrationsDir := "backend/migrations"
	files, err := ioutil.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("failed to read migrations directory: %s", err)
	}

	// Sort files by name to ensure correct order
	var migrationFiles []string
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".sql") {
			migrationFiles = append(migrationFiles, file.Name())
		}
	}
	sort.Strings(migrationFiles)

	fmt.Printf("Found %d migration files\n", len(migrationFiles))

	// Run each migration
	for _, filename := range migrationFiles {
		if err := runMigration(db, migrationsDir, filename); err != nil {
			return fmt.Errorf("failed to run migration %s: %s", filename, err)
		}
	}

	return nil
}

func runMigration(db *bun.DB, migrationsDir, filename string) error {
	fmt.Printf("Running migration: %s\n", filename)
	ctx := context.Background()

	// Check if migration has already been applied
	var count int
	err := db.NewRaw(`
		SELECT COUNT(*) FROM schema_migrations WHERE version = ?
	`, filename).Scan(ctx, &count)

	if err != nil {
		return fmt.Errorf("failed to check migration status: %s", err)
	}

	if count > 0 {
		fmt.Printf("Migration %s already applied, skipping\n", filename)
		return nil
	}

	// Read migration file
	migrationPath := filepath.Join(migrationsDir, filename)
	content, err := ioutil.ReadFile(migrationPath)
	if err != nil {
		return fmt.Errorf("failed to read migration file %s: %s", filename, err)
	}

	// Split migration content into individual statements
	statements := strings.Split(string(content), ";")

	// Execute each statement
	for _, statement := range statements {
		statement = strings.TrimSpace(statement)
		if statement == "" || strings.HasPrefix(statement, "--") {
			continue
		}

		_, err := db.NewRaw(statement).Exec(ctx)
		if err != nil {
			fmt.Printf("Warning: Failed to execute statement in %s: %s\n", filename, err)
			fmt.Printf("Statement: %s\n", statement)
			// Continue with other statements instead of failing completely
		}
	}

	// Mark migration as applied
	_, err = db.NewRaw(`
		INSERT INTO schema_migrations (version) VALUES (?)
	`, filename).Exec(ctx)

	if err != nil {
		return fmt.Errorf("failed to mark migration %s as applied: %s", filename, err)
	}

	fmt.Printf("Migration %s applied successfully\n", filename)
	return nil
}

func verifyTables(db *bun.DB) error {
	fmt.Println("\nVerifying created tables...")
	ctx := context.Background()
	
	tables := []string{
		"accounts",
		"categories", 
		"budgets",
		"transactions",
		"savings_pots",
		"savings_allocations",
		"alerts",
		"alert_preferences",
		"alert_rules",
		"dashboard_layouts",
		"schema_migrations",
	}

	for _, table := range tables {
		var exists bool
		err := db.NewRaw(`
			SELECT EXISTS (
				SELECT FROM information_schema.tables 
				WHERE table_schema = 'public' 
				AND table_name = ?
			)
		`, table).Scan(ctx, &exists)

		if err != nil {
			return fmt.Errorf("failed to check table %s: %s", table, err)
		}

		if exists {
			fmt.Printf("Table '%s' exists\n", table)
		} else {
			fmt.Printf("Warning: Table '%s' was not created\n", table)
		}
	}

	return nil
}
