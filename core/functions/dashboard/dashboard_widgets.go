package dashboard

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/shopspring/decimal"
)

func GETDashboardLayout(w http.ResponseWriter, r *http.Request) {
	userIDInt, ok := auth.GetUserIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}
	userID := int64(userIDInt)

	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	layout, err := db.GetDashboardLayout(userID)
	if err != nil {
		// If no layout exists, create default one
		defaultLayout := &types.DashboardLayout{
			UserID:    userID,
			AccountID: accountID,
			Name:      "Main Dashboard",
			IsActive:  true,
			Layout:    db.GetDefaultDashboardLayout(),
		}

		err = db.CreateOrUpdateDashboardLayout(defaultLayout)
		if err != nil {
			helpers.RespondError(w, http.StatusInternalServerError, "Could not create default layout: "+err.Error())
			return
		}
		layout = defaultLayout
	}

	helpers.RespondData(w, layout, 1)
}

func POSTDashboardLayout(w http.ResponseWriter, r *http.Request) {
	userIDInt, ok := auth.GetUserIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}
	userID := int64(userIDInt)

	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req struct {
		Name   string `json:"name"`
		Layout string `json:"layout"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Layout == "" {
		helpers.RespondError(w, http.StatusBadRequest, "layout is required")
		return
	}

	name := req.Name
	if name == "" {
		name = "Main Dashboard"
	}

	layout := &types.DashboardLayout{
		UserID:    userID,
		AccountID: accountID,
		Name:      name,
		Layout:    req.Layout,
		IsActive:  true,
	}

	err := db.CreateOrUpdateDashboardLayout(layout)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not save layout: "+err.Error())
		return
	}

	helpers.RespondData(w, layout, 1)
}

func GETAvailableWidgets(w http.ResponseWriter, r *http.Request) {
	widgets := db.GetAvailableWidgets()
	helpers.RespondData(w, widgets, len(widgets))
}

func GETWidgetData(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	widgetType := r.URL.Query().Get("widget_type")

	if widgetType == "" {
		helpers.RespondError(w, http.StatusBadRequest, "widget_type is required")
		return
	}

	// Get widget data based on type
	data, err := getWidgetDataByType(accountID, types.WidgetType(widgetType))
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not get widget data")
		return
	}

	helpers.RespondData(w, data, 1)
}

func getWidgetDataByType(accountID int64, widgetType types.WidgetType) (interface{}, error) {
	switch widgetType {
	case types.WidgetBalance:
		return getBalanceWidgetData(accountID)
	case types.WidgetRecentTransactions:
		return getRecentTransactionsWidgetData(accountID)
	case types.WidgetBudgetProgress:
		return getBudgetProgressWidgetData(accountID)
	case types.WidgetGoalsOverview:
		return getGoalsOverviewWidgetData(accountID)
	case types.WidgetSpendingTrends:
		return getSpendingTrendsWidgetData(accountID)
	case types.WidgetCategoryBreakdown:
		return getCategoryBreakdownWidgetData(accountID)
	case types.WidgetFinancialHealth:
		return getFinancialHealthWidgetData(accountID)
	case types.WidgetAlerts:
		return getAlertsWidgetData(accountID)
	case types.WidgetSavingsSummary:
		return getSavingsSummaryWidgetData(accountID)
	default:
		return nil, nil
	}
}

func getBalanceWidgetData(accountID int64) (interface{}, error) {
	// Get account to fetch billing cycle day
	var account types.Account
	err := db.GetDb().NewSelect().
		Model(&account).
		Where("id = ?", accountID).
		Scan(context.Background())
	if err != nil {
		// Return empty data if account not found
		return map[string]interface{}{
			"balance":  "0",
			"income":   "0",
			"expenses": "0",
			"period":   "all time",
		}, nil
	}

	// Use billing cycle day from account, default to 25th
	billingCycleDay := 25
	if account.BillingCycleDay != nil && *account.BillingCycleDay > 0 && *account.BillingCycleDay <= 31 {
		billingCycleDay = *account.BillingCycleDay
	}

	// Log the billing cycle day being used
	fmt.Printf("Using billing cycle day: %d for account %d\n", billingCycleDay, accountID)

	// Get data from billing cycle day of previous month to billing cycle day of current month
	now := time.Now()
	var from, to time.Time

	if now.Day() >= billingCycleDay {
		// We're after the billing cycle day, so range is billing cycle day of current month to billing cycle day of next month
		from = time.Date(now.Year(), now.Month(), billingCycleDay, 0, 0, 0, 0, now.Location())
		to = from.AddDate(0, 1, 0).Add(-time.Nanosecond)
	} else {
		// We're before the billing cycle day, so range is billing cycle day of previous month to billing cycle day of current month
		from = time.Date(now.Year(), now.Month(), billingCycleDay, 0, 0, 0, 0, now.Location()).AddDate(0, -1, 0)
		to = time.Date(now.Year(), now.Month(), billingCycleDay, 23, 59, 59, 999999999, now.Location()).Add(-time.Nanosecond)
	}

	fmt.Printf("Date range: %s to %s\n", from.Format("2006-01-02"), to.Format("2006-01-02"))

	summary, err := db.GetDashboardSummary(accountID, from, to)
	if err != nil {
		fmt.Printf("Error getting dashboard summary: %v\n", err)
		// Return empty data instead of error
		return map[string]interface{}{
			"balance":  "0",
			"income":   "0",
			"expenses": "0",
			"period":   from.Format("Jan 2") + " - " + to.Format("Jan 2"),
		}, nil
	}

	return map[string]interface{}{
		"balance":  summary.Balance.String(),
		"income":   summary.TotalIncome.String(),
		"expenses": summary.TotalExpenses.String(),
		"period":   from.Format("Jan 2") + " - " + to.Format("Jan 2"),
	}, nil
}

func getRecentTransactionsWidgetData(accountID int64) (interface{}, error) {
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Nanosecond)

	summary, err := db.GetDashboardSummary(accountID, startOfMonth, endOfMonth)
	if err != nil {
		// Return empty data instead of error
		return map[string]interface{}{
			"transactions": []interface{}{},
			"count":        0,
		}, nil
	}

	return map[string]interface{}{
		"transactions": summary.RecentTrans,
		"count":        len(summary.RecentTrans),
	}, nil
}

func getBudgetProgressWidgetData(accountID int64) (interface{}, error) {
	budgets, _, err := db.QueryBudgets(accountID, nil)
	if err != nil {
		// Return empty data instead of error
		return map[string]interface{}{
			"budgets": []interface{}{},
			"count":   0,
		}, nil
	}

	// Filter active budgets and calculate progress
	var activeBudgets []map[string]interface{}
	for _, budget := range budgets {
		if budget.StartDate.After(time.Now()) || (budget.EndDate != nil && budget.EndDate.Before(time.Now())) {
			continue
		}

		progress := 0.0
		spentStr := "0"
		if budget.Spent != nil {
			percentage := budget.Spent.Div(budget.Amount).Mul(decimal.NewFromFloat(100))
			progress = percentage.InexactFloat64()
			spentStr = budget.Spent.String()
		}

		activeBudgets = append(activeBudgets, map[string]interface{}{
			"id":       budget.ID,
			"name":     budget.Name,
			"spent":    spentStr,
			"amount":   budget.Amount.String(),
			"progress": progress,
			"category": budget.Category.Name,
		})
	}

	return map[string]interface{}{
		"budgets": activeBudgets,
		"count":   len(activeBudgets),
	}, nil
}

func getGoalsOverviewWidgetData(accountID int64) (interface{}, error) {
	goals, _, err := db.QuerySavingsGoals(accountID, nil)
	if err != nil {
		// Return empty data instead of error
		return map[string]interface{}{
			"goals": []interface{}{},
			"count": 0,
		}, nil
	}

	var activeGoals []map[string]interface{}
	for _, goal := range goals {
		if !goal.IsActive {
			continue
		}

		activeGoals = append(activeGoals, map[string]interface{}{
			"id":                   goal.ID,
			"name":                 goal.Name,
			"current_amount":       goal.CurrentAmount.String(),
			"target_amount":        goal.TargetAmount.String(),
			"progress":             goal.ProgressPercentage.InexactFloat64(),
			"monthly_contribution": goal.MonthlyRequired.String(),
		})
	}

	return map[string]interface{}{
		"goals": activeGoals,
		"count": len(activeGoals),
	}, nil
}

func getSpendingTrendsWidgetData(accountID int64) (interface{}, error) {
	// Get last 6 months of spending trends
	trends, err := db.GetSpendingTrends(accountID, 6)
	if err != nil {
		// Return empty data instead of error
		return map[string]interface{}{
			"trends": []interface{}{},
			"period": "6 months",
		}, nil
	}

	return map[string]interface{}{
		"trends": trends,
		"period": "6 months",
	}, nil
}

func getCategoryBreakdownWidgetData(accountID int64) (interface{}, error) {
	breakdown, err := db.GetCategoryBreakdown(accountID, "this_month")
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"breakdown": breakdown,
		"period":    "this month",
	}, nil
}

func getFinancialHealthWidgetData(accountID int64) (interface{}, error) {
	// For now, return a simple health score
	// In a real implementation, this would call the financial health calculation
	return map[string]interface{}{
		"score": 75,
		"grade": "B",
		"factors": map[string]interface{}{
			"savings_rate":     15,
			"budget_adherence": 80,
			"debt_ratio":       25,
		},
	}, nil
}

func getAlertsWidgetData(accountID int64) (interface{}, error) {
	alerts, _, err := db.GetAlerts(accountID, false, 5) // Get 5 most recent alerts
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"alerts": alerts,
		"count":  len(alerts),
		"unread": len(alerts),
	}, nil
}

func getSavingsSummaryWidgetData(accountID int64) (interface{}, error) {
	summary, err := db.GetSavingsSummary(accountID)
	if err != nil {
		// Return empty data instead of error
		return map[string]interface{}{
			"total_balance": "0",
			"total_pots":    0,
			"pots":          []interface{}{},
		}, nil
	}

	return summary, nil
}
