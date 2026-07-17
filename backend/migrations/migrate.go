// Package migrations runs the SQL migration files in this directory against
// the connected database. It is the single migration entry point, triggered
// on startup via the MIGRATE_ON_STARTUP environment variable.
package migrations

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	coredb "github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/uptrace/bun"
)

// DefaultDir is the migrations directory relative to the working directory
const DefaultDir = "backend/migrations"

// RunMigrations executes all pending SQL migration files in order. Any
// failure aborts the process so a broken migration is never recorded as
// applied.
func RunMigrations() error {
	database := coredb.GetDb()
	if database == nil {
		return fmt.Errorf("database not connected")
	}

	ctx := context.Background()

	// Create the migrations bookkeeping table if it doesn't exist
	_, err := database.NewRaw(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	migrationFiles, err := listMigrationFiles(DefaultDir)
	if err != nil {
		return err
	}

	log.Printf("Found %d migration files", len(migrationFiles))

	for _, filename := range migrationFiles {
		if err := runMigration(ctx, database, DefaultDir, filename); err != nil {
			return fmt.Errorf("failed to run migration %s: %w", filename, err)
		}
	}

	return nil
}

func listMigrationFiles(dir string) ([]string, error) {
	files, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("failed to read migrations directory: %w", err)
	}

	var migrationFiles []string
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".sql") {
			migrationFiles = append(migrationFiles, file.Name())
		}
	}
	sort.Strings(migrationFiles)

	return migrationFiles, nil
}

func runMigration(ctx context.Context, database *bun.DB, dir, filename string) error {
	// Skip migrations that have already been applied
	var count int
	err := database.NewRaw(`
		SELECT COUNT(*) FROM schema_migrations WHERE version = ?
	`, filename).Scan(ctx, &count)
	if err != nil {
		return fmt.Errorf("failed to check migration status: %w", err)
	}

	if count > 0 {
		return nil
	}

	log.Printf("Running migration: %s", filename)

	content, err := os.ReadFile(filepath.Join(dir, filename))
	if err != nil {
		return fmt.Errorf("failed to read migration file: %w", err)
	}

	// Run the whole file and the bookkeeping insert in one transaction so a
	// partially applied migration is rolled back and never marked as applied
	return database.RunInTx(ctx, nil, func(ctx context.Context, tx bun.Tx) error {
		if _, err := tx.ExecContext(ctx, string(content)); err != nil {
			return fmt.Errorf("failed to execute migration: %w", err)
		}

		if _, err := tx.NewRaw(`
			INSERT INTO schema_migrations (version) VALUES (?)
		`, filename).Exec(ctx); err != nil {
			return fmt.Errorf("failed to record migration: %w", err)
		}

		log.Printf("Migration %s applied successfully", filename)
		return nil
	})
}
