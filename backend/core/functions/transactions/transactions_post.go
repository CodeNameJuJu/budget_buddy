package transactions

import (
	"fmt"
	"net/http"
	"time"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/shopspring/decimal"
)

type POSTTransactionRequest struct {
	AccountID   int64   `json:"account_id"`
	CategoryID  *int64  `json:"category_id,omitempty"`
	BudgetID    *int64  `json:"budget_id,omitempty"`
	Amount      string  `json:"amount"`
	Type        string  `json:"type"`
	Description *string `json:"description,omitempty"`
	Date        string  `json:"date"`
	Notes       *string `json:"notes,omitempty"`
	Tags        *string `json:"tags,omitempty"` // JSON array of tags
}

func (p *POSTTransactionRequest) Validate() error {
	if p.AccountID == 0 {
		return fmt.Errorf("account_id is required")
	}
	if p.Amount == "" {
		return fmt.Errorf("amount is required")
	}
	if _, err := decimal.NewFromString(p.Amount); err != nil {
		return fmt.Errorf("amount must be a valid number")
	}
	if p.Type != "income" && p.Type != "expense" {
		return fmt.Errorf("type must be 'income' or 'expense'")
	}
	if p.Date == "" {
		return fmt.Errorf("date is required")
	}
	if _, err := time.Parse("2006-01-02", p.Date); err != nil {
		return fmt.Errorf("date must be in YYYY-MM-DD format")
	}
	return nil
}

func POSTTransaction(w http.ResponseWriter, r *http.Request) {
	var req POSTTransactionRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := req.Validate(); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	amount, _ := decimal.NewFromString(req.Amount)
	date, _ := time.Parse("2006-01-02", req.Date)

	transaction := types.Transaction{
		AccountID:   req.AccountID,
		CategoryID:  req.CategoryID,
		BudgetID:    req.BudgetID,
		Amount:      amount,
		Type:        req.Type,
		Description: req.Description,
		Date:        date,
		Notes:       req.Notes,
		Tags:        req.Tags,
	}

	if err := db.InsertTransaction(&transaction); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not create transaction")
		return
	}

	helpers.RespondData(w, transaction, 1)
}
