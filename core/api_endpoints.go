package core

import (
	"github.com/CodeNameJuJu/budget_buddy/core/functions"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/accounts"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/alerts"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/analytics"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/budgets"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/categories"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/couples"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/dashboard"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/goals"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/savings"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/tags"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/transactions"
	"github.com/go-chi/chi/v5"
)

func RegisterRoutes(r chi.Router) {
	// Initialize handlers
	authHandler := auth.NewAuthHandler()
	couplesHandler := couples.NewCouplesHandler()

	r.Route("/api", func(r chi.Router) {
		/* ----------- HEALTH ----------- */
		r.Get("/health", functions.HealthCheck)

		/* ----------- AUTH ----------- */
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", authHandler.Register)
			r.Post("/login", authHandler.Login)
			r.Post("/refresh", authHandler.RefreshToken)
			r.Post("/logout", authHandler.Logout) // Requires auth middleware

			// Protected routes
			r.With(authHandler.AuthMiddleware).Group(func(r chi.Router) {
				r.Get("/profile", authHandler.GetProfile)
				r.Post("/change-password", authHandler.ChangePassword)
			})
		})

		/* ----------- COUPLES/PARTNERS ----------- */
		r.With(authHandler.AuthMiddleware).Group(func(r chi.Router) {
			r.Get("/couples", couplesHandler.GetPartnerships)
			r.Post("/couples", couplesHandler.CreatePartnership)
			r.Get("/couples/details", couplesHandler.GetPartnershipDetails)
			r.Post("/couples/invite", couplesHandler.InvitePartner)
			r.Post("/couples/respond", couplesHandler.RespondToInvitation)
			r.Get("/couples/invitation", couplesHandler.GetInvitationDetails)
			r.Post("/couples/share-account", couplesHandler.ShareAccount)
			r.Delete("/couples/remove-member", couplesHandler.RemoveMember)
			r.Patch("/couples/update-role", couplesHandler.UpdateMemberRole)
		})

		/* ----------- ACCOUNTS ----------- */
		r.With(authHandler.AuthMiddleware).Group(func(r chi.Router) {
			r.Get("/accounts", accounts.GETAccount)
			r.Get("/accounts/my", accounts.GETMyAccount)
			r.Post("/accounts", accounts.POSTAccount)
			r.Patch("/accounts/{id}", accounts.PATCHAccount)
		})

		/* ----------- CATEGORIES ----------- */
		r.With(authHandler.AuthMiddleware).Group(func(r chi.Router) {
			r.Get("/categories", categories.GETCategories)
			r.Post("/categories", categories.POSTCategory)
			r.Patch("/categories/{id}", categories.PATCHCategory)
			r.Delete("/categories/{id}", categories.DELETECategory)
		})

		/* ----------- TRANSACTIONS ----------- */
		r.With(authHandler.AuthMiddleware).Group(func(r chi.Router) {
			r.Get("/transactions", transactions.GETTransactions)
			r.Post("/transactions", transactions.POSTTransaction)
			r.Patch("/transactions/{id}", transactions.PATCHTransaction)
			r.Delete("/transactions/{id}", transactions.DELETETransaction)
		})

		/* ----------- BUDGETS ----------- */
		r.With(authHandler.AuthMiddleware).Group(func(r chi.Router) {
			r.Get("/budgets", budgets.GETBudgets)
			r.Post("/budgets", budgets.POSTBudget)
			r.Patch("/budgets/{id}", budgets.PATCHBudget)
			r.Delete("/budgets/{id}", budgets.DELETEBudget)
		})

		/* ----------- SAVINGS ----------- */
		r.With(authHandler.AuthMiddleware).Group(func(r chi.Router) {
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
		})

		/* ----------- DASHBOARD ----------- */
		r.With(authHandler.AuthMiddleware).Group(func(r chi.Router) {
			r.Get("/dashboard/summary", dashboard.GETSummary)
			r.Get("/dashboard/layout", dashboard.GETDashboardLayout)
			r.Post("/dashboard/layout", dashboard.POSTDashboardLayout)
			r.Get("/dashboard/widgets", dashboard.GETAvailableWidgets)
			r.Get("/dashboard/widget-data", dashboard.GETWidgetData)
			r.Post("/dashboard/init", dashboard.POSTInitializeDashboard)
			r.Post("/dashboard/setup", dashboard.POSTCreateTables)
		})

		/* ----------- ANALYTICS ----------- */
		r.With(authHandler.AuthMiddleware).Group(func(r chi.Router) {
			r.Get("/analytics/trends", analytics.GETAnalyticsTrends)
			r.Get("/analytics/category-breakdown", analytics.GETAnalyticsCategoryBreakdown)
			r.Get("/analytics/financial-health", analytics.GETAnalyticsFinancialHealth)
		})

		/* ----------- GOALS ----------- */
		r.With(authHandler.AuthMiddleware).Group(func(r chi.Router) {
			r.Get("/goals", goals.GETGoals)
			r.Post("/goals", goals.POSTGoal)
			r.Patch("/goals/{id}", goals.PATCHGoal)
			r.Delete("/goals/{id}", goals.DELETEGoal)
		})
		r.With(authHandler.AuthMiddleware).Group(func(r chi.Router) {
			r.Get("/goals/contributions", goals.GETGoalContributions)
			r.Post("/goals/contributions", goals.POSTGoalContribution)
			r.Delete("/goals/contributions/{id}", goals.DELETEGoalContribution)
			r.Get("/goals/summary", goals.GETGoalsSummary)
		})

		/* ----------- TAGS ----------- */
		r.With(authHandler.AuthMiddleware).Group(func(r chi.Router) {
			r.Get("/tags/stats", tags.GETTagStats)
			r.Get("/tags/popular", tags.GETPopularTags)
		})

		/* ----------- ALERTS ----------- */
		r.With(authHandler.AuthMiddleware).Group(func(r chi.Router) {
			r.Get("/alerts", alerts.GETAlerts)
			r.Get("/alerts/preferences", alerts.GETAlertPreferences)
			r.Post("/alerts/mark-read", alerts.POSTMarkAlertAsRead)
			r.Post("/alerts/mark-all-read", alerts.POSTMarkAllAlertsAsRead)
			r.Post("/alerts/preferences", alerts.POSTAlertPreference)
			r.Post("/alerts/trigger", alerts.POSTTriggerAlerts)
			r.Post("/alerts/init", alerts.POSTInitializeAlerts)
		})
	})
}
