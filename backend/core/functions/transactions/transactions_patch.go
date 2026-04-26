package transactions

import (
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/shopspring/decimal"
)

type PATCHTransactionRequest struct {
	CategoryID  *int64  `json:"category_id,omitempty"`
	BudgetID    *int64  `json:"budget_id,omitempty"`
	Amount      *string `json:"amount,omitempty"`
	Type        *string `json:"type,omitempty"`
	Description *string `json:"description,omitempty"`
	Date        *string `json:"date,omitempty"`
	Notes       *string `json:"notes,omitempty"`
	Tags        *string `json:"tags,omitempty"` // JSON array of tags
}

func PATCHTransaction(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid transaction ID")
		return
	}

	var req PATCHTransactionRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	transaction := types.Transaction{ID: id}

	if req.CategoryID != nil {
		transaction.CategoryID = req.CategoryID
	}
	if req.BudgetID != nil {
		transaction.BudgetID = req.BudgetID
	}
	if req.Amount != nil {
		amount, parseErr := decimal.NewFromString(*req.Amount)
		if parseErr != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid amount")
			return
		}
		transaction.Amount = amount
	}
	if req.Type != nil {
		transaction.Type = *req.Type
	}
	if req.Description != nil {
		transaction.Description = req.Description
	}
	if req.Date != nil {
		date, parseErr := time.Parse("2006-01-02", *req.Date)
		if parseErr != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid date format")
			return
		}
		transaction.Date = date
	}
	if req.Notes != nil {
		transaction.Notes = req.Notes
	}
	if req.Tags != nil {
		transaction.Tags = req.Tags
	}

	if err := db.UpdateTransaction(&transaction); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not update transaction")
		return
	}

	helpers.RespondData(w, transaction, 1)
}
