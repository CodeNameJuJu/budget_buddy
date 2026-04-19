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
	fmt.Println("Budget Buddy - Railway Database Setup")
	fmt.Println("=====================================")

	// Get Railway database connection from environment variables or prompt user
	dbHost := getEnvVar("DB_HOST", "Enter your Railway database host (e.g., containers-us-west-1.railway.app): ")
	dbPort := getEnvVar("DB_PORT", "Enter your Railway database port (default 5432): ")
	if dbPort == "" {
		dbPort = "5432"
	}
	dbUsername := getEnvVar("DB_USERNAME", "Enter your Railway database username (default postgres): ")
	if dbUsername == "" {
		dbUsername = "postgres"
	}
	dbPassword := getEnvVar("DB_PASSWORD", "Enter your Railway database password: ")
	dbName := getEnvVar("DB_NAME", "Enter your Railway database name (default railway): ")
	if dbName == "" {
		dbName = "railway"
	}

	// Build connection string
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=require",
		dbUsername, dbPassword, dbHost, dbPort, dbName)

	fmt.Printf("\nConnecting to Railway PostgreSQL...\n")
	fmt.Printf("Host: %s\n", dbHost)
	fmt.Printf("Port: %s\n", dbPort)
	fmt.Printf("Database: %s\n", dbName)
	fmt.Printf("Username: %s\n", dbUsername)

	// Connect to database
	sqlDB := sql.OpenDB(pgdriver.NewConnector(
		pgdriver.WithDSN(dsn),
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

	fmt.Println("Successfully connected to Railway PostgreSQL!")

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
	fmt.Println("Database setup completed successfully!")
	fmt.Println("Your Budget Buddy database is now ready!")
	fmt.Println("=====================================")
}

func getEnvVar(key, prompt string) string {
	value := os.Getenv(key)
	if value != "" {
		return value
	}

	fmt.Print(prompt)
	fmt.Scanln(&value)
	return value
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
			return fmt.Errorf("failed to execute statement in %s: %s\nStatement: %s", filename, err, statement)
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
			return fmt.Errorf("table '%s' was not created", table)
		}
	}

	return nil
}
