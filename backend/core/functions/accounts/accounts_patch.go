package accounts

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/go-utils/logs"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/go-chi/chi/v5"
)

type PATCHAccountRequest struct {
	Name            *string `json:"name,omitempty"`
	Email           *string `json:"email,omitempty"`
	Currency        *string `json:"currency,omitempty"`
	Timezone        *string `json:"timezone,omitempty"`
	DashboardLayout *string `json:"dashboard_layout,omitempty"`
}

func PATCHAccount(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid account ID")
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
	if req.DashboardLayout != nil {
		account.DashboardLayout = req.DashboardLayout
	}

	// Log for debugging
	logs.Info(fmt.Sprintf("Updating account %d with dashboard_layout: %v", id, req.DashboardLayout))

	if err := db.UpdateAccount(&account); err != nil {
		logs.Error(fmt.Sprintf("Error updating account: %v", err))
		helpers.RespondError(w, http.StatusInternalServerError, "Could not update account")
		return
	}

	helpers.RespondData(w, account, 1)
}
