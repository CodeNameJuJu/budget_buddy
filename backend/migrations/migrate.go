package migrations

import (
	"context"
	"fmt"
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/julian/budget-buddy/core/context"
	"github.com/uptrace/bun"
)

// Migration represents a database migration record
type Migration struct {
	ID         int64     `bun:"id,pk,autoincrement"`
	Filename   string    `bun:"filename,notnull,unique"`
	ExecutedAt time.Time `bun:"executed_at,notnull"`
}

// RunMigrations executes all SQL migration files in the migrations directory
func RunMigrations() error {
	db := context.GetDb()

	// Create migrations table if it doesn't exist
	if err := createMigrationsTable(db); err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Get list of migration files
	migrationFiles, err := getMigrationFiles()
	if err != nil {
		return fmt.Errorf("failed to get migration files: %w", err)
	}

	// Run each migration that hasn't been run yet
	for _, file := range migrationFiles {
		if err := runMigration(db, file); err != nil {
			return fmt.Errorf("failed to run migration %s: %w", file, err)
		}
	}

	log.Println("All migrations completed successfully")
	return nil
}

func createMigrationsTable(db *bun.DB) error {
	ctx := context.Background()
	_, err := db.NewCreateTable().
		Model((*Migration)(nil)).
		IfNotExists().
		Exec(ctx)
	return err
}

func getMigrationFiles() ([]string, error) {
	var files []string

	// Get the current working directory
	wd, err := os.Getwd()
	if err != nil {
		return nil, err
	}

	// Look for migration files in the migrations directory
	migrationsDir := filepath.Join(wd, "migrations")

	err = filepath.WalkDir(migrationsDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if !d.IsDir() && filepath.Ext(path) == ".sql" {
			files = append(files, filepath.Base(path))
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	return files, nil
}

func runMigration(db *bun.DB, filename string) error {
	ctx := context.Background()

	// Check if migration has already been run
	var count int
	err := db.NewSelect().
		Model((*Migration)(nil)).
		Where("filename = ?", filename).
		Count(ctx, &count)
	if err != nil {
		return err
	}

	if count > 0 {
		log.Printf("Migration %s already executed, skipping", filename)
		return nil
	}

	// Read migration file
	wd, err := os.Getwd()
	if err != nil {
		return err
	}

	migrationPath := filepath.Join(wd, "migrations", filename)
	content, err := os.ReadFile(migrationPath)
	if err != nil {
		return err
	}

	// Execute migration
	_, err = db.NewRaw(string(content)).Exec(ctx)
	if err != nil {
		return fmt.Errorf("error executing migration %s: %w", filename, err)
	}

	// Record migration as executed
	migration := &Migration{
		Filename:   filename,
		ExecutedAt: time.Now(),
	}
	_, err = db.NewInsert().Model(migration).Exec(ctx)
	if err != nil {
		return fmt.Errorf("error recording migration %s: %w", filename, err)
	}

	log.Printf("Migration %s executed successfully", filename)
	return nil
}
