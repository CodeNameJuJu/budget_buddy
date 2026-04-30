package dashboard

import (
	"net/http"
	"time"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
)

func GETSummary(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Default to current month
	now := time.Now()
	from := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	to := from.AddDate(0, 1, -1)

	if fromStr := r.URL.Query().Get("date_from"); fromStr != "" {
		parsed, err := time.Parse("2006-01-02", fromStr)
		if err != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid date_from format, use YYYY-MM-DD")
			return
		}
		from = parsed
	}

	if toStr := r.URL.Query().Get("date_to"); toStr != "" {
		parsed, err := time.Parse("2006-01-02", toStr)
		if err != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid date_to format, use YYYY-MM-DD")
			return
		}
		to = parsed
	}

	summary, err := db.GetDashboardSummary(accountID, from, to)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not get dashboard summary")
		return
	}

	helpers.RespondData(w, summary, 1)
}
