package main

import (
	"context"
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
	appcontext "github.com/CodeNameJuJu/budget_buddy/core/context"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
)

func main() {
	// Load environment variables (for Railway DATABASE_URL)
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: Could not load .env file, using environment variables")
	}

	// Initialize Railway database connection
	appcontext.ConnectToDatabase()
	defer appcontext.CloseDB()

	db := appcontext.GetDb()

	log.Println("Importing data to Railway database...")

	// Import data in order of dependencies
	if err := importAccounts(db); err != nil {
		log.Fatalf("Error importing accounts: %v", err)
	}

	if err := importCategories(db); err != nil {
		log.Fatalf("Error importing categories: %v", err)
	}

	if err := importBudgets(db); err != nil {
		log.Fatalf("Error importing budgets: %v", err)
	}

	if err := importSavingsPots(db); err != nil {
		log.Fatalf("Error importing savings pots: %v", err)
	}

	if err := importTransactions(db); err != nil {
		log.Fatalf("Error importing transactions: %v", err)
	}

	log.Println("Data import completed successfully!")
}

func importAccounts(db *bun.DB) error {
	file, err := os.Open("accounts_export.csv")
	if err != nil {
		log.Printf("No accounts file found, skipping...")
		return nil
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		return err
	}

	if len(records) <= 1 {
		log.Println("No accounts to import")
		return nil
	}

	// Skip header
	records = records[1:]

	for _, record := range records {
		if len(record) < 6 {
			continue
		}

		id, _ := strconv.ParseInt(record[0], 10, 64)
		createdDate, _ := time.Parse(time.RFC3339, record[4])
		modifiedDate, _ := time.Parse(time.RFC3339, record[5])

		account := types.Account{
			ID:           id,
			Name:         record[1],
			Type:         record[2],
			Balance:      types.MustParseDecimal(record[3]),
			CreatedDate:  createdDate,
			ModifiedDate: modifiedDate,
		}

		_, err := db.NewInsert().Model(&account).Exec(context.Background())
		if err != nil {
			log.Printf("Error inserting account %s: %v", record[1], err)
		}
	}

	log.Printf("Imported %d accounts", len(records))
	return nil
}

func importCategories(db *bun.DB) error {
	file, err := os.Open("categories_export.csv")
	if err != nil {
		log.Printf("No categories file found, skipping...")
		return nil
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		return err
	}

	if len(records) <= 1 {
		log.Println("No categories to import")
		return nil
	}

	records = records[1:]

	for _, record := range records {
		if len(record) < 6 {
			continue
		}

		id, _ := strconv.ParseInt(record[0], 10, 64)
		accountID, _ := strconv.ParseInt(record[1], 10, 64)
		createdDate, _ := time.Parse(time.RFC3339, record[4])
		modifiedDate, _ := time.Parse(time.RFC3339, record[5])

		category := types.Category{
			ID:           id,
			AccountID:    accountID,
			Name:         record[2],
			Type:         record[3],
			CreatedDate:  createdDate,
			ModifiedDate: modifiedDate,
		}

		_, err := db.NewInsert().Model(&category).Exec(context.Background())
		if err != nil {
			log.Printf("Error inserting category %s: %v", record[2], err)
		}
	}

	log.Printf("Imported %d categories", len(records))
	return nil
}

func importBudgets(db *bun.DB) error {
	file, err := os.Open("budgets_export.csv")
	if err != nil {
		log.Printf("No budgets file found, skipping...")
		return nil
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		return err
	}

	if len(records) <= 1 {
		log.Println("No budgets to import")
		return nil
	}

	records = records[1:]

	for _, record := range records {
		if len(record) < 8 {
			continue
		}

		id, _ := strconv.ParseInt(record[0], 10, 64)
		accountID, _ := strconv.ParseInt(record[1], 10, 64)
		var categoryID *int64
		if record[2] != "" {
			catID, _ := strconv.ParseInt(record[2], 10, 64)
			categoryID = &catID
		}
		createdDate, _ := time.Parse(time.RFC3339, record[6])
		modifiedDate, _ := time.Parse(time.RFC3339, record[7])

		budget := types.Budget{
			ID:           id,
			AccountID:    accountID,
			CategoryID:   categoryID,
			Name:         record[3],
			Amount:       types.MustParseDecimal(record[4]),
			Period:       record[5],
			CreatedDate:  createdDate,
			ModifiedDate: modifiedDate,
		}

		_, err := db.NewInsert().Model(&budget).Exec(context.Background())
		if err != nil {
			log.Printf("Error inserting budget %s: %v", record[3], err)
		}
	}

	log.Printf("Imported %d budgets", len(records))
	return nil
}

func importSavingsPots(db *bun.DB) error {
	file, err := os.Open("savings_pots_export.csv")
	if err != nil {
		log.Printf("No savings pots file found, skipping...")
		return nil
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		return err
	}

	if len(records) <= 1 {
		log.Println("No savings pots to import")
		return nil
	}

	records = records[1:]

	for _, record := range records {
		if len(record) < 8 {
			continue
		}

		id, _ := strconv.ParseInt(record[0], 10, 64)
		accountID, _ := strconv.ParseInt(record[1], 10, 64)
		createdDate, _ := time.Parse(time.RFC3339, record[6])
		modifiedDate, _ := time.Parse(time.RFC3339, record[7])
		targetDate, _ := time.Parse(time.RFC3339, record[5])

		pot := types.SavingsPot{
			ID:            id,
			AccountID:     accountID,
			Name:          record[2],
			TargetAmount:  types.MustParseDecimal(record[3]),
			CurrentAmount: types.MustParseDecimal(record[4]),
			TargetDate:    targetDate,
			CreatedDate:   createdDate,
			ModifiedDate:  modifiedDate,
		}

		_, err := db.NewInsert().Model(&pot).Exec(context.Background())
		if err != nil {
			log.Printf("Error inserting savings pot %s: %v", record[2], err)
		}
	}

	log.Printf("Imported %d savings pots", len(records))
	return nil
}

func importTransactions(db *bun.DB) error {
	file, err := os.Open("transactions_export.csv")
	if err != nil {
		log.Printf("No transactions file found, skipping...")
		return nil
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		return err
	}

	if len(records) <= 1 {
		log.Println("No transactions to import")
		return nil
	}

	records = records[1:]

	for _, record := range records {
		if len(record) < 12 {
			continue
		}

		id, _ := strconv.ParseInt(record[0], 10, 64)
		accountID, _ := strconv.ParseInt(record[1], 10, 64)
		var categoryID, budgetID *int64
		if record[2] != "" {
			catID, _ := strconv.ParseInt(record[2], 10, 64)
			categoryID = &catID
		}
		if record[3] != "" {
			budID, _ := strconv.ParseInt(record[3], 10, 64)
			budgetID = &budID
		}

		var description, notes, tags *string
		if record[5] != "" {
			description = &record[5]
		}
		if record[7] != "" {
			notes = &record[7]
		}
		if record[8] != "" {
			tags = &record[8]
		}

		createdDate, _ := time.Parse(time.RFC3339, record[10])
		modifiedDate, _ := time.Parse(time.RFC3339, record[11])
		date, _ := time.Parse(time.RFC3339, record[6])

		transaction := types.Transaction{
			ID:           id,
			AccountID:    accountID,
			CategoryID:   categoryID,
			BudgetID:     budgetID,
			Amount:       types.MustParseDecimal(record[4]),
			Type:         record[5],
			Description:  description,
			Date:         date,
			Notes:        notes,
			Tags:         tags,
			CreatedDate:  createdDate,
			ModifiedDate: modifiedDate,
		}

		_, err := db.NewInsert().Model(&transaction).Exec(context.Background())
		if err != nil {
			log.Printf("Error inserting transaction %s: %v", record[5], err)
		}
	}

	log.Printf("Imported %d transactions", len(records))
	return nil
}

// Helper function to parse decimal
func parseDecimal(s string) types.Decimal {
	if s == "" {
		return types.Zero
	}
	// This is a simplified parser - you might need to adjust based on your decimal package
	return types.MustParseDecimal(s)
}
