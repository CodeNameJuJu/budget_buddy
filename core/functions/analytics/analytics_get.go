package analytics

import (
	"context"
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
)

func GETAnalyticsTrends(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "Account not found in context")
		return
	}

	// Get account to retrieve billing cycle day
	var account types.Account
	err := db.GetDb().NewSelect().
		Model(&account).
		Where("id = ?", accountID).
		Scan(context.Background())
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not get account")
		return
	}

	billingCycleDay := 25
	if account.BillingCycleDay != nil && *account.BillingCycleDay > 0 && *account.BillingCycleDay <= 31 {
		billingCycleDay = *account.BillingCycleDay
	}

	// Get months parameter (default to 6 months)
	months := 6
	if monthsStr := r.URL.Query().Get("months"); monthsStr != "" {
		if m, err := strconv.Atoi(monthsStr); err == nil && m > 0 && m <= 24 {
			months = m
		}
	}

	trends, err := db.GetSpendingTrendsByBillingCycle(accountID, billingCycleDay, months)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not get spending trends")
		return
	}

	helpers.RespondData(w, trends, len(trends))
}

func GETAnalyticsCategoryBreakdown(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "Account not found in context")
		return
	}

	// Get account to retrieve billing cycle day
	var account types.Account
	err := db.GetDb().NewSelect().
		Model(&account).
		Where("id = ?", accountID).
		Scan(context.Background())
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not get account")
		return
	}

	billingCycleDay := 25
	if account.BillingCycleDay != nil && *account.BillingCycleDay > 0 && *account.BillingCycleDay <= 31 {
		billingCycleDay = *account.BillingCycleDay
	}

	// Get period (default to current billing cycle)
	period := "current_cycle"
	if p := r.URL.Query().Get("period"); p != "" {
		period = p
	}

	breakdown, err := db.GetCategoryBreakdown(accountID, period, billingCycleDay)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not get category breakdown")
		return
	}

	helpers.RespondData(w, breakdown, len(breakdown))
}

func GETAnalyticsFinancialHealth(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "Account not found in context")
		return
	}

	// Get account to retrieve billing cycle day
	var account types.Account
	err := db.GetDb().NewSelect().
		Model(&account).
		Where("id = ?", accountID).
		Scan(context.Background())
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not get account")
		return
	}

	billingCycleDay := 25
	if account.BillingCycleDay != nil && *account.BillingCycleDay > 0 && *account.BillingCycleDay <= 31 {
		billingCycleDay = *account.BillingCycleDay
	}

	healthScore, err := db.CalculateFinancialHealth(accountID, billingCycleDay)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not calculate financial health")
		return
	}

	helpers.RespondData(w, healthScore, 1)
}
