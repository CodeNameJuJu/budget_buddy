package main

import (
	"context"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/CodeNameJuJu/budget_buddy/core"
	appcontext "github.com/CodeNameJuJu/budget_buddy/core/context"
	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"github.com/uptrace/bun"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: Could not load .env file")
	}

	// Check if we should run migrations on startup
	if os.Getenv("MIGRATE_ON_STARTUP") == "true" {
		log.Println("Running database migrations on startup...")
		if err := runMigrations(); err != nil {
			log.Fatalf("Failed to run migrations: %s", err)
		}
		log.Println("Migrations completed successfully!")
	}

	// Initialize database. There are two parallel db package globals
	// (core/db and core/context); handlers query through core/context while
	// the auth middleware uses core/db, so we must connect both or any DB
	// query in a handler hits a nil *bun.DB and panics (502 to the client).
	db.ConnectToDatabase()
	appcontext.ConnectToDatabase()

	// Create router
	r := chi.NewRouter()

	// Configure CORS
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Register all API routes
	core.RegisterRoutes(r)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Budget Buddy server starting on port %s with full API", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}

func runMigrations() error {
	database := db.GetDb()
	ctx := context.Background()

	// Create migrations table if it doesn't exist
	_, err := database.NewRaw(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`).Exec(ctx)

	if err != nil {
		return fmt.Errorf("failed to create migrations table: %s", err)
	}

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

	log.Printf("Found %d migration files", len(migrationFiles))

	// Run each migration
	for _, filename := range migrationFiles {
		if err := runMigration(database, migrationsDir, filename); err != nil {
			return fmt.Errorf("failed to run migration %s: %s", filename, err)
		}
	}

	return nil
}

func runMigration(db *bun.DB, migrationsDir, filename string) error {
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
		log.Printf("Migration %s already applied, skipping", filename)
		return nil
	}

	log.Printf("Running migration: %s", filename)

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
			log.Printf("Warning: Failed to execute statement in %s: %s", filename, err)
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

	log.Printf("Migration %s applied successfully", filename)
	return nil
}
