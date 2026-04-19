package alerts

import (
	"net/http"
	"strconv"

	"github.com/julian/budget-buddy/core/db"
	"github.com/julian/budget-buddy/core/helpers"
)

func GETAlerts(w http.ResponseWriter, r *http.Request) {
	accountIDStr := r.URL.Query().Get("account_id")
	if accountIDStr == "" {
		helpers.RespondError(w, http.StatusBadRequest, "account_id is required")
		return
	}

	accountID, err := strconv.ParseInt(accountIDStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid account_id")
		return
	}

	unreadOnly := r.URL.Query().Get("unread_only") == "true"
	limit := 50 // Default limit
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	alerts, count, err := db.GetAlerts(accountID, unreadOnly, limit)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not get alerts")
		return
	}

	helpers.RespondData(w, alerts, count)
}

func GETAlertPreferences(w http.ResponseWriter, r *http.Request) {
	accountIDStr := r.URL.Query().Get("account_id")
	if accountIDStr == "" {
		helpers.RespondError(w, http.StatusBadRequest, "account_id is required")
		return
	}

	accountID, err := strconv.ParseInt(accountIDStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid account_id")
		return
	}

	preferences, err := db.GetAlertPreferences(accountID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not get alert preferences")
		return
	}

	helpers.RespondData(w, preferences, len(preferences))
}
