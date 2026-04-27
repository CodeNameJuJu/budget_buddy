package accounts

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
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
		fmt.Printf("Failed to decode body: %v\n", err)
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	fmt.Printf("PATCH request received. DashboardLayout in request: %v\n", req.DashboardLayout)

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
		fmt.Printf("Setting account.DashboardLayout to: %s\n", *req.DashboardLayout)
	} else {
		fmt.Printf("req.DashboardLayout is nil, not setting account.DashboardLayout\n")
	}

	fmt.Printf("Calling UpdateAccount. account.DashboardLayout: %v\n", account.DashboardLayout)

	if err := db.UpdateAccount(&account); err != nil {
		fmt.Printf("Error updating account: %v\n", err)
		helpers.RespondError(w, http.StatusInternalServerError, "Could not update account")
		return
	}

	fmt.Printf("Account updated successfully. Returned dashboard_layout: %v\n", account.DashboardLayout)
	helpers.RespondData(w, account, 1)
}
