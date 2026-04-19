package core

import (
	"github.com/go-chi/chi/v5"
	"github.com/julian/budget-buddy/core/functions"
	"github.com/julian/budget-buddy/core/functions/accounts"
	"github.com/julian/budget-buddy/core/functions/alerts"
	"github.com/julian/budget-buddy/core/functions/analytics"
	"github.com/julian/budget-buddy/core/functions/budgets"
	"github.com/julian/budget-buddy/core/functions/categories"
	"github.com/julian/budget-buddy/core/functions/dashboard"
	"github.com/julian/budget-buddy/core/functions/goals"
	"github.com/julian/budget-buddy/core/functions/savings"
	"github.com/julian/budget-buddy/core/functions/tags"
	"github.com/julian/budget-buddy/core/functions/transactions"
)

func RegisterRoutes(r chi.Router) {
	r.Route("/api", func(r chi.Router) {
		/* ----------- HEALTH ----------- */
		r.Get("/health", functions.HealthCheck)

		/* ----------- ACCOUNTS ----------- */
		r.Get("/accounts", accounts.GETAccount)
		r.Post("/accounts", accounts.POSTAccount)
		r.Patch("/accounts/{id}", accounts.PATCHAccount)

		/* ----------- CATEGORIES ----------- */
		r.Get("/categories", categories.GETCategories)
		r.Post("/categories", categories.POSTCategory)
		r.Patch("/categories/{id}", categories.PATCHCategory)
		r.Delete("/categories/{id}", categories.DELETECategory)

		/* ----------- TRANSACTIONS ----------- */
		r.Get("/transactions", transactions.GETTransactions)
		r.Post("/transactions", transactions.POSTTransaction)
		r.Patch("/transactions/{id}", transactions.PATCHTransaction)
		r.Delete("/transactions/{id}", transactions.DELETETransaction)

		/* ----------- BUDGETS ----------- */
		r.Get("/budgets", budgets.GETBudgets)
		r.Post("/budgets", budgets.POSTBudget)
		r.Patch("/budgets/{id}", budgets.PATCHBudget)
		r.Delete("/budgets/{id}", budgets.DELETEBudget)

		/* ----------- SAVINGS ----------- */
		r.Get("/savings/pots", savings.GETSavingsPots)
		r.Post("/savings/pots", savings.POSTPot)
		r.Patch("/savings/pots/{id}", savings.PATCHPot)
		r.Delete("/savings/pots/{id}", savings.DELETEPot)
		r.Get("/savings/allocations", savings.GETSavingsAllocations)
		r.Post("/savings/allocations", savings.POSTAllocation)
		r.Delete("/savings/allocations/{id}", savings.DELETEAllocation)
		r.Get("/savings/summary", savings.GETSavingsSummary)
		r.Get("/savings/forecast", savings.GETSavingsForecast)
		r.Post("/savings/balance", savings.POSTSavingsBalance)

		/* ----------- DASHBOARD ----------- */
		r.Get("/dashboard/summary", dashboard.GETSummary)
		r.Get("/dashboard/layout", dashboard.GETDashboardLayout)
		r.Post("/dashboard/layout", dashboard.POSTDashboardLayout)
		r.Get("/dashboard/widgets", dashboard.GETAvailableWidgets)
		r.Get("/dashboard/widget-data", dashboard.GETWidgetData)
		r.Post("/dashboard/init", dashboard.POSTInitializeDashboard)
		r.Post("/dashboard/setup", dashboard.POSTCreateTables)

		/* ----------- ANALYTICS ----------- */
		r.Get("/analytics/trends", analytics.GETAnalyticsTrends)
		r.Get("/analytics/category-breakdown", analytics.GETAnalyticsCategoryBreakdown)
		r.Get("/analytics/financial-health", analytics.GETAnalyticsFinancialHealth)

		/* ----------- GOALS ----------- */
		r.Get("/goals", goals.GETGoals)
		r.Post("/goals", goals.POSTGoal)
		r.Patch("/goals/{id}", goals.PATCHGoal)
		r.Delete("/goals/{id}", goals.DELETEGoal)
		r.Get("/goals/contributions", goals.GETGoalContributions)
		r.Post("/goals/contributions", goals.POSTGoalContribution)
		r.Delete("/goals/contributions/{id}", goals.DELETEGoalContribution)
		r.Get("/goals/summary", goals.GETGoalsSummary)

		/* ----------- TAGS ----------- */
		r.Get("/tags/stats", tags.GETTagStats)
		r.Get("/tags/popular", tags.GETPopularTags)

		/* ----------- ALERTS ----------- */
		r.Get("/alerts", alerts.GETAlerts)
		r.Get("/alerts/preferences", alerts.GETAlertPreferences)
		r.Post("/alerts/mark-read", alerts.POSTMarkAlertAsRead)
		r.Post("/alerts/mark-all-read", alerts.POSTMarkAllAlertsAsRead)
		r.Post("/alerts/preferences", alerts.POSTAlertPreference)
		r.Post("/alerts/trigger", alerts.POSTTriggerAlerts)
		r.Post("/alerts/init", alerts.POSTInitializeAlerts)
	})
}
