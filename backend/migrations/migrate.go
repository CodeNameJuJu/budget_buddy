package migrations

import (
	"context"
	"fmt"
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"time"

	appcontext "github.com/julian/budget-buddy/core/context"
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
	// Get database connection with error handling
	db := appcontext.GetDb()
	if db == nil {
		return fmt.Errorf("failed to get database connection")
	}

	// Create migrations table if it doesn't exist
	if err := createMigrationsTable(db); err != nil {
		log.Printf("Warning: Failed to create migrations table: %v", err)
		// Continue anyway - table might already exist
	}

	// Get list of migration files
	migrationFiles, err := getMigrationFiles()
	if err != nil {
		log.Printf("Warning: Failed to get migration files: %v", err)
		log.Printf("This is expected in production - migrations might be in a different location")
		return nil // Don't fail the whole startup
	}

	if len(migrationFiles) == 0 {
		log.Println("No migration files found - continuing without migrations")
		return nil
	}

	// Run each migration that hasn't been run yet
	for _, file := range migrationFiles {
		if err := runMigration(db, file); err != nil {
			log.Printf("Warning: Failed to run migration %s: %v", file, err)
			// Continue with other migrations instead of failing completely
		}
	}

	log.Println("Migration process completed")
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
		return nil, fmt.Errorf("failed to get working directory: %w", err)
	}

	// Look for migration files in the migrations directory
	migrationsDir := filepath.Join(wd, "migrations")

	// Check if migrations directory exists
	if _, err := os.Stat(migrationsDir); os.IsNotExist(err) {
		log.Printf("Migrations directory does not exist: %s", migrationsDir)
		return files, nil // Return empty list, not an error
	}

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
		return nil, fmt.Errorf("failed to walk migration directory: %w", err)
	}

	return files, nil
}

func runMigration(db *bun.DB, filename string) error {
	ctx := context.Background()

	// Check if migration has already been run
	count, err := db.NewSelect().
		Model((*Migration)(nil)).
		Where("filename = ?", filename).
		Count(ctx)
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
