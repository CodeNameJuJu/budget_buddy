package recurring

import (
	"fmt"
	"net/http"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/shopspring/decimal"
)

type POSTRecurringTransactionRequest struct {
	BudgetID    int64   `json:"budget_id"`
	CategoryID  *int64  `json:"category_id,omitempty"`
	Amount      string  `json:"amount"`
	Type        string  `json:"type"`
	Description string  `json:"description"`
	Notes       *string `json:"notes,omitempty"`
	DueDay      *int    `json:"due_day,omitempty"`
}

func (p *POSTRecurringTransactionRequest) Validate() error {
	if p.BudgetID == 0 {
		return fmt.Errorf("budget_id is required")
	}
	if p.Description == "" {
		return fmt.Errorf("description is required")
	}
	if p.Amount == "" {
		return fmt.Errorf("amount is required")
	}
	amount, err := decimal.NewFromString(p.Amount)
	if err != nil {
		return fmt.Errorf("amount must be a valid number")
	}
	if amount.Sign() <= 0 {
		return fmt.Errorf("amount must be greater than zero")
	}
	if p.Type == "" {
		p.Type = "expense"
	}
	if p.Type != "income" && p.Type != "expense" {
		return fmt.Errorf("type must be 'income' or 'expense'")
	}
	if p.DueDay != nil && (*p.DueDay < 1 || *p.DueDay > 31) {
		return fmt.Errorf("due_day must be between 1 and 31")
	}
	return nil
}

func POSTRecurringTransaction(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req POSTRecurringTransactionRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := req.Validate(); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	// The budget must belong to the caller's account
	budgets, _, err := db.QueryBudgets(accountID, &req.BudgetID)
	if err != nil || len(budgets) == 0 {
		helpers.RespondError(w, http.StatusNotFound, "Budget not found")
		return
	}

	// Default the category to the budget's category so the transaction still
	// counts towards the budget if the link is ever removed
	categoryID := req.CategoryID
	if categoryID == nil {
		categoryID = &budgets[0].CategoryID
	}

	amount, _ := decimal.NewFromString(req.Amount)
	item := types.RecurringTransaction{
		AccountID:   accountID,
		BudgetID:    req.BudgetID,
		CategoryID:  categoryID,
		Amount:      amount,
		Type:        req.Type,
		Description: req.Description,
		Notes:       req.Notes,
		DueDay:      req.DueDay,
		IsActive:    true,
	}

	if err := db.InsertRecurringTransaction(&item); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not create recurring transaction")
		return
	}

	helpers.RespondData(w, item, 1)
}
