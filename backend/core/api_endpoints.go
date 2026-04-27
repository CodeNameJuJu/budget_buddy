package core

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/CodeNameJuJu/budget_buddy/core/functions"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/accounts"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/alerts"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/analytics"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/budgets"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/categories"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/dashboard"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/debug"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/goals"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/savings"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/tags"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/transactions"
	"github.com/go-chi/chi/v5"
)

// FileServer conveniently sets up a http.FileServer handler to serve
// static files from a http.FileSystem.
func FileServer(r chi.Router, path string, root http.FileSystem) {
	if strings.ContainsAny(path, "{}*") {
		panic("FileServer does not permit any URL parameters.")
	}

	if path != "/" && path[len(path)-1] != '/' {
		r.Get(path, http.RedirectHandler(path+"/", http.StatusMovedPermanently).ServeHTTP)
		path += "/"
	}
	path += "*"

	r.Get(path, func(w http.ResponseWriter, r *http.Request) {
		rctx := chi.RouteContext(r.Context())
		pathPrefix := strings.TrimSuffix(rctx.RoutePattern(), "/*")
		fs := http.StripPrefix(pathPrefix, http.FileServer(root))
		fs.ServeHTTP(w, r)
	})
}

func RegisterRoutes(r chi.Router) {
	// Serve static files from frontend dist folder
	staticDir := http.Dir("/app/frontend/dist")
	FileServer(r, "/static", staticDir)
	FileServer(r, "/assets", staticDir)

	// Serve index.html for root and unmatched routes (SPA support)
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "/app/frontend/dist/index.html")
	})

	// Add debug endpoint outside of /api to bypass all middleware
	r.Get("/debug", debug.DebugCategoryCreation)

	r.Route("/api", func(r chi.Router) {
		/* ----------- HEALTH ----------- */
		r.Get("/health", functions.HealthCheck)

		/* ----------- AUTHENTICATION ----------- */
		authHandler := auth.NewAuthHandler()
		r.Post("/auth/register", authHandler.Register)
		r.Post("/auth/login", authHandler.Login)
		r.Post("/auth/refresh", authHandler.RefreshToken)
		r.Get("/auth/me", authHandler.GetProfile)
		r.Post("/auth/profile-picture", authHandler.POSTProfilePicture)

		/* ----------- ACCOUNTS ----------- */
		r.Get("/accounts/{accountId}/dashboard-layout", accounts.GETDashboardLayout)
		r.Post("/accounts/{accountId}/dashboard-layout", accounts.POSTDashboardLayout)
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

		/* ----------- PARTNERSHIPS ----------- */
		r.Get("/partnerships", partnership.GETPartnerships)
		r.Post("/partnerships", partnership.POSTPartnerships)
		r.Post("/partnerships/{partnershipID}/invite", partnership.POSTInvitePartner)
		r.Post("/partnerships/invitations/{token}/respond", partnership.POSTRespondToInvitation)
	})
}
