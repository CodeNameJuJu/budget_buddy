package main

import (
	"context"
	"log"

	appcontext "github.com/CodeNameJuJu/budget_buddy/core/context"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
)

func main() {
	// Initialize database
	appcontext.ConnectToDatabase()
	defer appcontext.CloseDB()

	log.Println("Database connected successfully!")

	// Create tables
	if err := createTables(); err != nil {
		log.Fatalf("Failed to create tables: %v", err)
	}

	log.Println("All database tables created successfully!")
	log.Println("Budget Buddy is ready to use!")
}

func createTables() error {
	db := appcontext.GetDb()

	// Create accounts table
	if _, err := db.NewCreateTable().Model((*types.Account)(nil)).Exec(context.Background()); err != nil {
		log.Printf("Warning: Could not create accounts table: %v", err)
	}

	// Create categories table
	if _, err := db.NewCreateTable().Model((*types.Category)(nil)).Exec(context.Background()); err != nil {
		log.Printf("Warning: Could not create categories table: %v", err)
	}

	// Create budgets table
	if _, err := db.NewCreateTable().Model((*types.Budget)(nil)).Exec(context.Background()); err != nil {
		log.Printf("Warning: Could not create budgets table: %v", err)
	}

	// Create transactions table
	if _, err := db.NewCreateTable().Model((*types.Transaction)(nil)).Exec(context.Background()); err != nil {
		log.Printf("Warning: Could not create transactions table: %v", err)
	}

	// Create savings pots table
	if _, err := db.NewCreateTable().Model((*types.SavingsPot)(nil)).Exec(context.Background()); err != nil {
		log.Printf("Warning: Could not create savings pots table: %v", err)
	}

	// Create alerts table
	if _, err := db.NewCreateTable().Model((*types.Alert)(nil)).Exec(context.Background()); err != nil {
		log.Printf("Warning: Could not create alerts table: %v", err)
	}

	// Create dashboard layouts table
	if _, err := db.NewCreateTable().Model((*types.DashboardLayout)(nil)).Exec(context.Background()); err != nil {
		log.Printf("Warning: Could not create dashboard layouts table: %v", err)
	}

	return nil
}
