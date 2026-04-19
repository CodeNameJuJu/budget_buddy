package main

import (
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
	// Get Railway database connection from environment variables
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "containers-us-west-XXX.railway.app" // Replace with your Railway host
	}

	dbPort := os.Getenv("DB_PORT")
	if dbPort == "" {
		dbPort = "5432"
	}

	dbUsername := os.Getenv("DB_USERNAME")
	if dbUsername == "" {
		dbUsername = "postgres"
	}

	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		log.Fatal("DB_PASSWORD environment variable is required")
	}

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "railway"
	}

	// Build connection string
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=require",
		dbUsername, dbPassword, dbHost, dbPort, dbName)

	fmt.Printf("Connecting to Railway PostgreSQL...\n")
	fmt.Printf("Host: %s\n", dbHost)
	fmt.Printf("Port: %s\n", dbPort)
	fmt.Printf("Database: %s\n", dbName)

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

	fmt.Println("\nAll migrations completed successfully!")
	fmt.Println("Database schema is now ready for Budget Buddy!")
}

func createMigrationsTable(db *bun.DB) error {
	fmt.Println("\nCreating migrations table...")

	_, err := db.NewRaw(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`).Exec()

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
	fmt.Printf("\nRunning migration: %s\n", filename)

	// Check if migration has already been applied
	var count int
	err := db.NewRaw(`
		SELECT COUNT(*) FROM schema_migrations WHERE version = ?
	`, filename).Scan(&count)

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

		_, err := db.NewRaw(statement).Exec()
		if err != nil {
			return fmt.Errorf("failed to execute statement in %s: %s\nStatement: %s", filename, err, statement)
		}
	}

	// Mark migration as applied
	_, err = db.NewRaw(`
		INSERT INTO schema_migrations (version) VALUES (?)
	`, filename).Exec()

	if err != nil {
		return fmt.Errorf("failed to mark migration %s as applied: %s", filename, err)
	}

	fmt.Printf("Migration %s applied successfully\n", filename)
	return nil
}
