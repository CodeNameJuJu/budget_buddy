package analytics

import (
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
)

func GETAnalyticsTrends(w http.ResponseWriter, r *http.Request) {
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

	// Get months parameter (default to 6 months)
	months := 6
	if monthsStr := r.URL.Query().Get("months"); monthsStr != "" {
		if m, err := strconv.Atoi(monthsStr); err == nil && m > 0 && m <= 24 {
			months = m
		}
	}

	trends, err := db.GetSpendingTrends(accountID, months)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not get spending trends")
		return
	}

	helpers.RespondData(w, trends, len(trends))
}

func GETAnalyticsCategoryBreakdown(w http.ResponseWriter, r *http.Request) {
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

	// Get period (default to current month)
	period := "current_month"
	if p := r.URL.Query().Get("period"); p != "" {
		period = p
	}

	breakdown, err := db.GetCategoryBreakdown(accountID, period)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not get category breakdown")
		return
	}

	helpers.RespondData(w, breakdown, len(breakdown))
}

func GETAnalyticsFinancialHealth(w http.ResponseWriter, r *http.Request) {
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

	healthScore, err := db.CalculateFinancialHealth(accountID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not calculate financial health")
		return
	}

	helpers.RespondData(w, healthScore, 1)
}
