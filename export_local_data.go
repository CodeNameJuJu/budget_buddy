package main

import (
	"context"
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"time"

	appcontext "github.com/CodeNameJuJu/budget_buddy/core/context"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/joho/godotenv"
	"github.com/uptrace/bun"
)

func main() {
	// Load environment variables
	if err := godotenv.Load("export.env"); err != nil {
		log.Println("No export.env found, using system environment variables")
	}

	// Check if we have database credentials
	dbHost := os.Getenv("DB_HOST")
	dbUsername := os.Getenv("DB_USERNAME")
	dbPassword := os.Getenv("DB_PASSWORD")

	if dbHost == "" || dbUsername == "" || dbPassword == "" {
		log.Println("Database connection not configured.")
		log.Println("Please update export.env with your database credentials:")
		log.Println("DB_HOST=localhost")
		log.Println("DB_PORT=5400")
		log.Println("DB_NAME=budget_buddy")
		log.Println("DB_USERNAME=postgres")
		log.Println("DB_PASSWORD=your_password")
		log.Println("DB_SSLMODE=disable")
		log.Println("DB_DEBUG=false")
		os.Exit(1)
	}

	// Initialize local database connection
	appcontext.ConnectToDatabase()
	defer appcontext.CloseDB()

	db := appcontext.GetDb()

	log.Println("Exporting local data...")

	// Export accounts
	if err := exportAccounts(db); err != nil {
		log.Printf("Error exporting accounts: %v", err)
	}

	// Export categories
	if err := exportCategories(db); err != nil {
		log.Printf("Error exporting categories: %v", err)
	}

	// Export budgets
	if err := exportBudgets(db); err != nil {
		log.Printf("Error exporting budgets: %v", err)
	}

	// Export transactions
	if err := exportTransactions(db); err != nil {
		log.Printf("Error exporting transactions: %v", err)
	}

	// Export savings pots
	if err := exportSavingsPots(db); err != nil {
		log.Printf("Error exporting savings pots: %v", err)
	}

	log.Println("Data export completed!")
}

func exportAccounts(db *bun.DB) error {
	var accounts []types.Account
	err := db.NewSelect().Model(&accounts).Where("deleted_date IS NULL").Scan(context.Background())
	if err != nil {
		return err
	}

	file, err := os.Create("accounts_export.csv")
	if err != nil {
		return err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// Write header
	writer.Write([]string{"id", "name", "email", "currency", "timezone", "savings_balance", "created_date", "modified_date", "deleted_date"})

	// Write data
	for _, account := range accounts {
		var timezone, savingsBalance string
		if account.Timezone != nil {
			timezone = *account.Timezone
		}
		if account.SavingsBalance != nil {
			savingsBalance = account.SavingsBalance.String()
		}
		writer.Write([]string{
			fmt.Sprintf("%d", account.ID),
			account.Name,
			account.Email,
			account.Currency,
			timezone,
			savingsBalance,
			account.CreatedDate.Format(time.RFC3339),
			account.ModifiedDate.Format(time.RFC3339),
			"", // deleted_date is NULL
		})
	}

	log.Printf("Exported %d accounts", len(accounts))
	return nil
}

func exportCategories(db *bun.DB) error {
	var categories []types.Category
	err := db.NewSelect().Model(&categories).Where("deleted_date IS NULL").Scan(context.Background())
	if err != nil {
		return err
	}

	file, err := os.Create("categories_export.csv")
	if err != nil {
		return err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	writer.Write([]string{"id", "account_id", "name", "type", "created_date", "modified_date", "deleted_date"})

	for _, category := range categories {
		writer.Write([]string{
			fmt.Sprintf("%d", category.ID),
			fmt.Sprintf("%d", category.AccountID),
			category.Name,
			category.Type,
			category.CreatedDate.Format(time.RFC3339),
			category.ModifiedDate.Format(time.RFC3339),
			"",
		})
	}

	log.Printf("Exported %d categories", len(categories))
	return nil
}

func exportBudgets(db *bun.DB) error {
	var budgets []types.Budget
	err := db.NewSelect().Model(&budgets).Where("deleted_date IS NULL").Scan(context.Background())
	if err != nil {
		return err
	}

	file, err := os.Create("budgets_export.csv")
	if err != nil {
		return err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	writer.Write([]string{"id", "account_id", "category_id", "name", "amount", "period", "created_date", "modified_date", "deleted_date"})

	for _, budget := range budgets {
		writer.Write([]string{
			fmt.Sprintf("%d", budget.ID),
			fmt.Sprintf("%d", budget.AccountID),
			fmt.Sprintf("%d", budget.CategoryID),
			budget.Name,
			budget.Amount.String(),
			budget.Period,
			budget.CreatedDate.Format(time.RFC3339),
			budget.ModifiedDate.Format(time.RFC3339),
			"",
		})
	}

	log.Printf("Exported %d budgets", len(budgets))
	return nil
}

func exportTransactions(db *bun.DB) error {
	var transactions []types.Transaction
	err := db.NewSelect().Model(&transactions).Where("deleted_date IS NULL").Scan(context.Background())
	if err != nil {
		return err
	}

	file, err := os.Create("transactions_export.csv")
	if err != nil {
		return err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	writer.Write([]string{"id", "account_id", "category_id", "budget_id", "amount", "type", "description", "date", "notes", "tags", "created_date", "modified_date", "deleted_date"})

	for _, transaction := range transactions {
		var categoryID, budgetID, notes, tags string
		if transaction.CategoryID != nil {
			categoryID = fmt.Sprintf("%d", *transaction.CategoryID)
		}
		if transaction.BudgetID != nil {
			budgetID = fmt.Sprintf("%d", *transaction.BudgetID)
		}
		if transaction.Notes != nil {
			notes = *transaction.Notes
		}
		if transaction.Tags != nil {
			tags = *transaction.Tags
		}

		writer.Write([]string{
			fmt.Sprintf("%d", transaction.ID),
			fmt.Sprintf("%d", transaction.AccountID),
			categoryID,
			budgetID,
			transaction.Amount.String(),
			transaction.Type,
			func() string {
				if transaction.Description != nil {
					return *transaction.Description
				}
				return ""
			}(),
			transaction.Date.Format(time.RFC3339),
			notes,
			tags,
			transaction.CreatedDate.Format(time.RFC3339),
			transaction.ModifiedDate.Format(time.RFC3339),
			"",
		})
	}

	log.Printf("Exported %d transactions", len(transactions))
	return nil
}

func exportSavingsPots(db *bun.DB) error {
	var savingsPots []types.SavingsPot
	err := db.NewSelect().Model(&savingsPots).Where("deleted_date IS NULL").Scan(context.Background())
	if err != nil {
		return err
	}

	file, err := os.Create("savings_pots_export.csv")
	if err != nil {
		return err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	writer.Write([]string{"id", "account_id", "name", "icon", "colour", "target", "contribution", "contribution_period", "created_date", "modified_date", "deleted_date"})

	for _, pot := range savingsPots {
		var icon, colour, target, contribution, contributionPeriod string
		if pot.Icon != nil {
			icon = *pot.Icon
		}
		if pot.Colour != nil {
			colour = *pot.Colour
		}
		if pot.Target != nil {
			target = pot.Target.String()
		}
		if pot.Contribution != nil {
			contribution = pot.Contribution.String()
		}
		if pot.ContributionPeriod != nil {
			contributionPeriod = *pot.ContributionPeriod
		}
		writer.Write([]string{
			fmt.Sprintf("%d", pot.ID),
			fmt.Sprintf("%d", pot.AccountID),
			pot.Name,
			icon,
			colour,
			target,
			contribution,
			contributionPeriod,
			pot.CreatedDate.Format(time.RFC3339),
			pot.ModifiedDate.Format(time.RFC3339),
			"",
		})
	}

	log.Printf("Exported %d savings pots", len(savingsPots))
	return nil
}
