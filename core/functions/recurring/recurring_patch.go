package recurring

import (
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/go-chi/chi/v5"
	"github.com/shopspring/decimal"
)

type PATCHRecurringTransactionRequest struct {
	BudgetID    *int64  `json:"budget_id,omitempty"`
	CategoryID  *int64  `json:"category_id,omitempty"`
	Amount      *string `json:"amount,omitempty"`
	Type        *string `json:"type,omitempty"`
	Description *string `json:"description,omitempty"`
	Notes       *string `json:"notes,omitempty"`
	DueDay      *int    `json:"due_day,omitempty"`
	IsActive    *bool   `json:"is_active,omitempty"`
}

func PATCHRecurringTransaction(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid recurring transaction ID")
		return
	}

	var req PATCHRecurringTransactionRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	items, _, err := db.QueryRecurringTransactions(db.RecurringTransactionFilters{AccountID: accountID, RecurringID: &id})
	if err != nil || len(items) == 0 {
		helpers.RespondError(w, http.StatusNotFound, "Recurring transaction not found")
		return
	}
	item := &items[0]

	if req.BudgetID != nil {
		budgets, _, err := db.QueryBudgets(accountID, req.BudgetID)
		if err != nil || len(budgets) == 0 {
			helpers.RespondError(w, http.StatusNotFound, "Budget not found")
			return
		}
		item.BudgetID = *req.BudgetID
	}
	if req.CategoryID != nil {
		item.CategoryID = req.CategoryID
	}
	if req.Amount != nil {
		amount, err := decimal.NewFromString(*req.Amount)
		if err != nil || amount.Sign() <= 0 {
			helpers.RespondError(w, http.StatusBadRequest, "amount must be a number greater than zero")
			return
		}
		item.Amount = amount
	}
	if req.Type != nil {
		if *req.Type != "income" && *req.Type != "expense" {
			helpers.RespondError(w, http.StatusBadRequest, "type must be 'income' or 'expense'")
			return
		}
		item.Type = *req.Type
	}
	if req.Description != nil {
		if *req.Description == "" {
			helpers.RespondError(w, http.StatusBadRequest, "description cannot be empty")
			return
		}
		item.Description = *req.Description
	}
	if req.Notes != nil {
		item.Notes = req.Notes
	}
	if req.DueDay != nil {
		if *req.DueDay == 0 {
			item.DueDay = nil
		} else if *req.DueDay < 1 || *req.DueDay > 31 {
			helpers.RespondError(w, http.StatusBadRequest, "due_day must be between 1 and 31")
			return
		} else {
			item.DueDay = req.DueDay
		}
	}
	if req.IsActive != nil {
		item.IsActive = *req.IsActive
	}

	if err := db.UpdateRecurringTransaction(item); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not update recurring transaction")
		return
	}

	helpers.RespondData(w, item, 1)
}
