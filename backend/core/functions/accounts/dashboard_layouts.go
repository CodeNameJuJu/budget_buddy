package accounts

import (
	"fmt"
	"net/http"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/go-chi/chi/v5"
)

type DashboardLayoutRequest struct {
	Layout string `json:"layout"`
}

func GETDashboardLayout(w http.ResponseWriter, r *http.Request) {
	accountIDStr := chi.URLParam(r, "accountId")
	accountID, err := parseAccountID(accountIDStr)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid account ID")
		return
	}

	layout, err := db.GetActiveDashboardLayout(accountID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not retrieve dashboard layout")
		return
	}

	helpers.RespondData(w, layout, 1)
}

func POSTDashboardLayout(w http.ResponseWriter, r *http.Request) {
	accountIDStr := chi.URLParam(r, "accountId")
	accountID, err := parseAccountID(accountIDStr)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid account ID")
		return
	}

	var req DashboardLayoutRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := db.SaveDashboardLayout(accountID, req.Layout); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not save dashboard layout")
		return
	}

	helpers.RespondSuccess(w, "Dashboard layout saved successfully")
}

func parseAccountID(accountIDStr string) (int64, error) {
	var accountID int64
	_, err := fmt.Sscanf(accountIDStr, "%d", &accountID)
	return accountID, err
}
