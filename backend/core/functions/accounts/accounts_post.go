package accounts

import (
	"fmt"
	"log"
	"net/http"
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

	// Create default categories and budgets
	if err := createDefaultData(account.ID); err != nil {
		log.Printf("createDefaultData error: %v", err)
		// Don't fail the account creation if default data fails
	}

	helpers.RespondData(w, account, 1)
}

func createDefaultData(accountID int64) error {
	// Create default categories
	categories := []types.Category{
		// Income categories
		{Name: "Salary", Type: "income", AccountID: accountID},
		{Name: "Freelance", Type: "income", AccountID: accountID},
		{Name: "Investments", Type: "income", AccountID: accountID},
		{Name: "Other Income", Type: "income", AccountID: accountID},
		// Expense categories
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

	// Create default budgets for main expense categories
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	budgets := []types.Budget{
		{
			AccountID:  accountID,
			CategoryID: categoryMap["Groceries"],
			Name:       "Groceries Budget",
			Amount:     decimal.NewFromInt(3000),
			Period:     "monthly",
			StartDate:  startOfMonth,
		},
		{
			AccountID:  accountID,
			CategoryID: categoryMap["Rent"],
			Name:       "Rent Budget",
			Amount:     decimal.NewFromInt(8000),
			Period:     "monthly",
			StartDate:  startOfMonth,
		},
		{
			AccountID:  accountID,
			CategoryID: categoryMap["Utilities"],
			Name:       "Utilities Budget",
			Amount:     decimal.NewFromInt(1500),
			Period:     "monthly",
			StartDate:  startOfMonth,
		},
		{
			AccountID:  accountID,
			CategoryID: categoryMap["Transport"],
			Name:       "Transport Budget",
			Amount:     decimal.NewFromInt(2000),
			Period:     "monthly",
			StartDate:  startOfMonth,
		},
		{
			AccountID:  accountID,
			CategoryID: categoryMap["Entertainment"],
			Name:       "Entertainment Budget",
			Amount:     decimal.NewFromInt(1000),
			Period:     "monthly",
			StartDate:  startOfMonth,
		},
	}

	for _, budget := range budgets {
		if budget.CategoryID == 0 {
			continue // Skip if category creation failed
		}
		if err := db.InsertBudget(&budget); err != nil {
			log.Printf("Failed to insert budget %s: %v", budget.Name, err)
		}
	}

	return nil
}
