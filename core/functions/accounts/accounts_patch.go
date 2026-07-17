package accounts

import (
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/go-chi/chi/v5"
)

type PATCHAccountRequest struct {
	Name            *string `json:"name,omitempty"`
	Email           *string `json:"email,omitempty"`
	Currency        *string `json:"currency,omitempty"`
	Timezone        *string `json:"timezone,omitempty"`
	BillingCycleDay *int    `json:"billing_cycle_day,omitempty"`
}

func PATCHAccount(w http.ResponseWriter, r *http.Request) {
	userIDInt, ok := auth.GetUserIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}
	userID := int64(userIDInt)

	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid account ID")
		return
	}

	// Verify ownership
	existing, _, err := db.QueryAccounts(&id, &userID)
	if err != nil || len(existing) == 0 {
		helpers.RespondError(w, http.StatusNotFound, "Account not found")
		return
	}

	var req PATCHAccountRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	account := types.Account{ID: id}
	if req.Name != nil {
		account.Name = *req.Name
	}
	if req.Email != nil {
		account.Email = *req.Email
	}
	if req.Currency != nil {
		account.Currency = *req.Currency
	}
	if req.Timezone != nil {
		account.Timezone = req.Timezone
	}
	if req.BillingCycleDay != nil {
		account.BillingCycleDay = req.BillingCycleDay
	}

	if err := db.UpdateAccount(&account); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not update account")
		return
	}

	helpers.RespondData(w, account, 1)
}
