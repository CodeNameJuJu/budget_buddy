package alerts

import (
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
)

func GETAlerts(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "Account not found in context")
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
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "Account not found in context")
		return
	}

	preferences, err := db.GetAlertPreferences(accountID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not get alert preferences")
		return
	}

	helpers.RespondData(w, preferences, len(preferences))
}
