package accounts

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"time"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/shopspring/decimal"
)

type POSTAccountRequest struct {
	Name     string  `json:"name"`
	Email    string  `json:"email"`
	Currency string  `json:"currency"`
	Timezone *string `json:"timezone,omitempty"`
}

func (p *POSTAccountRequest) Validate() error {
	if p.Name == "" {
		return fmt.Errorf("name is required")
	}
	if p.Email == "" {
		return fmt.Errorf("email is required")
	}
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(p.Email) {
		return fmt.Errorf("email must be a valid email address")
	}
	if p.Currency == "" {
		p.Currency = "ZAR"
	}
	return nil
}

func POSTAccount(w http.ResponseWriter, r *http.Request) {
	var req POSTAccountRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := req.Validate(); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	account := types.Account{
		Name:     req.Name,
		Email:    req.Email,
		Currency: req.Currency,
		Timezone: req.Timezone,
	}

	if err := db.InsertAccount(&account); err != nil {
		log.Printf("InsertAccount error: %v", err)
		helpers.RespondError(w, http.StatusInternalServerError, "Could not create account")
		return
	}

	log.Printf("Account created successfully with ID: %d", account.ID)

	// Create default categories and budgets
	if err := createDefaultData(account.ID); err != nil {
		log.Printf("createDefaultData error: %v", err)
		helpers.RespondError(w, http.StatusInternalServerError, "Could not create default data")
		return
	}

	// Create default dashboard layout
	defaultLayout := `[
		{"id": "welcome", "x": 0, "y": 0, "w": 12, "h": 4},
		{"id": "balance", "x": 0, "y": 4, "w": 4, "h": 4},
		{"id": "account_summary", "x": 4, "y": 4, "w": 4, "h": 4},
		{"id": "spending_trends", "x": 8, "y": 4, "w": 4, "h": 4},
		{"id": "recent_transactions", "x": 0, "y": 8, "w": 6, "h": 4},
		{"id": "category_breakdown", "x": 6, "y": 8, "w": 6, "h": 4},
		{"id": "goals_overview", "x": 0, "y": 12, "w": 4, "h": 4},
		{"id": "budget_progress", "x": 4, "y": 12, "w": 4, "h": 4},
		{"id": "alerts", "x": 8, "y": 12, "w": 4, "h": 4}
	]`
	if err := db.SaveDashboardLayout(account.ID, defaultLayout); err != nil {
		log.Printf("SaveDashboardLayout error: %v", err)
		helpers.RespondError(w, http.StatusInternalServerError, "Could not create dashboard layout")
		return
	}

	helpers.RespondData(w, account, 1)
}

func createDefaultData(accountID int64) error {
	log.Printf("Starting createDefaultData for account ID: %d", accountID)

	dbConn := db.GetDb()
	if dbConn == nil {
		return fmt.Errorf("database connection is nil")
	}

	now := time.Now()

	// Create default categories using raw SQL
	categoryIDs := make(map[string]int64)
	categories := []struct {
		Name string
		Type string
	}{
		{"Salary", "income"},
		{"Freelance", "income"},
		{"Investments", "income"},
		{"Other Income", "income"},
		{"Groceries", "expense"},
		{"Rent", "expense"},
		{"Utilities", "expense"},
		{"Transport", "expense"},
		{"Entertainment", "expense"},
		{"Healthcare", "expense"},
		{"Dining Out", "expense"},
		{"Shopping", "expense"},
	}

	for _, cat := range categories {
		result, err := dbConn.NewInsert().
			Model(&types.Category{Name: cat.Name, Type: cat.Type, AccountID: accountID}).
			Returning("id").
			Exec(context.Background())
		if err != nil {
			log.Printf("Failed to insert category %s: %v", cat.Name, err)
			return err
		}
		id, _ := result.LastInsertId()
		categoryIDs[cat.Name] = id
	}
	log.Printf("Created %d categories", len(categoryIDs))

	// Create default budgets for main expense categories
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	budgets := []struct {
		Name     string
		Amount   int64
		Category string
	}{
		{"Groceries Budget", 3000, "Groceries"},
		{"Rent Budget", 8000, "Rent"},
		{"Utilities Budget", 1500, "Utilities"},
		{"Transport Budget", 2000, "Transport"},
		{"Entertainment Budget", 1000, "Entertainment"},
	}

	for _, budget := range budgets {
		catID, ok := categoryIDs[budget.Category]
		if !ok {
			log.Printf("Skipping budget %s due to missing category", budget.Name)
			continue
		}
		_, err := dbConn.NewInsert().
			Model(&types.Budget{
				AccountID:  accountID,
				CategoryID: catID,
				Name:       budget.Name,
				Amount:     decimal.NewFromInt(budget.Amount),
				Period:     "monthly",
				StartDate:  startOfMonth,
			}).
			Exec(context.Background())
		if err != nil {
			log.Printf("Failed to insert budget %s: %v", budget.Name, err)
			return err
		}
	}
	log.Printf("Created %d budgets", len(budgets))

	// Create sample transactions
	salaryID := categoryIDs["Salary"]
	freelanceID := categoryIDs["Freelance"]
	groceriesID := categoryIDs["Groceries"]
	rentID := categoryIDs["Rent"]
	utilitiesID := categoryIDs["Utilities"]
	transportID := categoryIDs["Transport"]
	entertainmentID := categoryIDs["Entertainment"]
	diningOutID := categoryIDs["Dining Out"]
	shoppingID := categoryIDs["Shopping"]
	healthcareID := categoryIDs["Healthcare"]

	transactions := []struct {
		Amount      int64
		Type        string
		Description string
		Date        time.Time
		CategoryID  int64
	}{
		{25000, "income", "Monthly salary", now, salaryID},
		{3500, "income", "Freelance project payment", now.AddDate(0, 0, -7), freelanceID},
		{850, "expense", "Weekly grocery shopping", now.AddDate(0, 0, -2), groceriesID},
		{8000, "expense", "Monthly rent", startOfMonth, rentID},
		{650, "expense", "Electricity and water bill", now.AddDate(0, 0, -10), utilitiesID},
		{450, "expense", "Petrol and public transport", now.AddDate(0, 0, -3), transportID},
		{300, "expense", "Movie tickets and snacks", now.AddDate(0, 0, -5), entertainmentID},
		{550, "expense", "Dinner at restaurant", now.AddDate(0, 0, -4), diningOutID},
		{1200, "expense", "New clothes and shoes", now.AddDate(0, 0, -8), shoppingID},
		{200, "expense", "Pharmacy and medication", now.AddDate(0, 0, -6), healthcareID},
	}

	for _, t := range transactions {
		desc := t.Description
		_, err := dbConn.NewInsert().
			Model(&types.Transaction{
				AccountID:   accountID,
				CategoryID:  &t.CategoryID,
				Amount:      decimal.NewFromInt(t.Amount),
				Type:        t.Type,
				Description: &desc,
				Date:        t.Date,
			}).
			Exec(context.Background())
		if err != nil {
			log.Printf("Failed to insert transaction: %v", err)
			return err
		}
	}
	log.Printf("Created %d transactions", len(transactions))
	log.Printf("createDefaultData completed for account ID: %d", accountID)

	return nil
}
