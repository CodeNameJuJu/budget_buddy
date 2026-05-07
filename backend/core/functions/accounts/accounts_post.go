package accounts

import (
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

	// Create default data in a goroutine to not block the response
	go func() {
		if err := createDefaultData(account.ID); err != nil {
			log.Printf("createDefaultData error: %v", err)
		}
	}()

	helpers.RespondData(w, account, 1)
}

func createDefaultData(accountID int64) error {
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	// Create default categories
	categories := []types.Category{
		{Name: "Salary", Type: "income", AccountID: accountID},
		{Name: "Freelance", Type: "income", AccountID: accountID},
		{Name: "Investments", Type: "income", AccountID: accountID},
		{Name: "Other Income", Type: "income", AccountID: accountID},
		{Name: "Groceries", Type: "expense", AccountID: accountID},
		{Name: "Rent", Type: "expense", AccountID: accountID},
		{Name: "Utilities", Type: "expense", AccountID: accountID},
		{Name: "Transport", Type: "expense", AccountID: accountID},
		{Name: "Entertainment", Type: "expense", AccountID: accountID},
		{Name: "Healthcare", Type: "expense", AccountID: accountID},
		{Name: "Dining Out", Type: "expense", AccountID: accountID},
		{Name: "Shopping", Type: "expense", AccountID: accountID},
	}

	categoryMap := make(map[string]int64)
	for _, cat := range categories {
		if err := db.InsertCategory(&cat); err != nil {
			log.Printf("Failed to insert category %s: %v", cat.Name, err)
			continue
		}
		categoryMap[cat.Name] = cat.ID
	}

	// Create default budgets
	budgets := []types.Budget{
		{AccountID: accountID, CategoryID: categoryMap["Groceries"], Name: "Groceries Budget", Amount: decimal.NewFromInt(3000), Period: "monthly", StartDate: startOfMonth},
		{AccountID: accountID, CategoryID: categoryMap["Rent"], Name: "Rent Budget", Amount: decimal.NewFromInt(8000), Period: "monthly", StartDate: startOfMonth},
		{AccountID: accountID, CategoryID: categoryMap["Utilities"], Name: "Utilities Budget", Amount: decimal.NewFromInt(1500), Period: "monthly", StartDate: startOfMonth},
		{AccountID: accountID, CategoryID: categoryMap["Transport"], Name: "Transport Budget", Amount: decimal.NewFromInt(2000), Period: "monthly", StartDate: startOfMonth},
		{AccountID: accountID, CategoryID: categoryMap["Entertainment"], Name: "Entertainment Budget", Amount: decimal.NewFromInt(1000), Period: "monthly", StartDate: startOfMonth},
	}

	for _, budget := range budgets {
		if budget.CategoryID == 0 {
			continue
		}
		if err := db.InsertBudget(&budget); err != nil {
			log.Printf("Failed to insert budget %s: %v", budget.Name, err)
		}
	}

	// Create sample transactions
	salaryID := categoryMap["Salary"]
	freelanceID := categoryMap["Freelance"]
	groceriesID := categoryMap["Groceries"]
	rentID := categoryMap["Rent"]
	utilitiesID := categoryMap["Utilities"]
	transportID := categoryMap["Transport"]
	entertainmentID := categoryMap["Entertainment"]
	diningOutID := categoryMap["Dining Out"]
	shoppingID := categoryMap["Shopping"]
	healthcareID := categoryMap["Healthcare"]

	transactions := []types.Transaction{
		{AccountID: accountID, CategoryID: &salaryID, Amount: decimal.NewFromInt(25000), Type: "income", Description: stringPtr("Monthly salary"), Date: now},
		{AccountID: accountID, CategoryID: &freelanceID, Amount: decimal.NewFromInt(3500), Type: "income", Description: stringPtr("Freelance project payment"), Date: now.AddDate(0, 0, -7)},
		{AccountID: accountID, CategoryID: &groceriesID, Amount: decimal.NewFromInt(850), Type: "expense", Description: stringPtr("Weekly grocery shopping"), Date: now.AddDate(0, 0, -2)},
		{AccountID: accountID, CategoryID: &rentID, Amount: decimal.NewFromInt(8000), Type: "expense", Description: stringPtr("Monthly rent"), Date: startOfMonth},
		{AccountID: accountID, CategoryID: &utilitiesID, Amount: decimal.NewFromInt(650), Type: "expense", Description: stringPtr("Electricity and water bill"), Date: now.AddDate(0, 0, -10)},
		{AccountID: accountID, CategoryID: &transportID, Amount: decimal.NewFromInt(450), Type: "expense", Description: stringPtr("Petrol and public transport"), Date: now.AddDate(0, 0, -3)},
		{AccountID: accountID, CategoryID: &entertainmentID, Amount: decimal.NewFromInt(300), Type: "expense", Description: stringPtr("Movie tickets and snacks"), Date: now.AddDate(0, 0, -5)},
		{AccountID: accountID, CategoryID: &diningOutID, Amount: decimal.NewFromInt(550), Type: "expense", Description: stringPtr("Dinner at restaurant"), Date: now.AddDate(0, 0, -4)},
		{AccountID: accountID, CategoryID: &shoppingID, Amount: decimal.NewFromInt(1200), Type: "expense", Description: stringPtr("New clothes and shoes"), Date: now.AddDate(0, 0, -8)},
		{AccountID: accountID, CategoryID: &healthcareID, Amount: decimal.NewFromInt(200), Type: "expense", Description: stringPtr("Pharmacy and medication"), Date: now.AddDate(0, 0, -6)},
	}

	for _, transaction := range transactions {
		if transaction.CategoryID != nil && *transaction.CategoryID == 0 {
			continue
		}
		if err := db.InsertTransaction(&transaction); err != nil {
			log.Printf("Failed to insert transaction: %v", err)
		}
	}

	// Create default dashboard layout
	defaultLayout := `[{"id":"welcome","x":0,"y":0,"w":12,"h":4},{"id":"balance","x":0,"y":4,"w":4,"h":4},{"id":"account_summary","x":4,"y":4,"w":4,"h":4},{"id":"spending_trends","x":8,"y":4,"w":4,"h":4},{"id":"recent_transactions","x":0,"y":8,"w":6,"h":4},{"id":"category_breakdown","x":6,"y":8,"w":6,"h":4},{"id":"goals_overview","x":0,"y":12,"w":4,"h":4},{"id":"budget_progress","x":4,"y":12,"w":4,"h":4},{"id":"alerts","x":8,"y":12,"w":4,"h":4}]`
	if err := db.SaveDashboardLayout(accountID, defaultLayout); err != nil {
		log.Printf("Failed to save dashboard layout: %v", err)
	}

	return nil
}

func stringPtr(s string) *string {
	return &s
}
