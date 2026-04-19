package middleware

import (
	"net/http"

	appcontext "github.com/julian/budget-buddy/core/context"
	"github.com/julian/budget-buddy/core/helpers"
)

// DatabaseMiddleware checks database connection before processing requests
func DatabaseMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// For endpoints that don't require database, allow them through
		if r.URL.Path == "/api/health" {
			next.ServeHTTP(w, r)
			return
		}

		// Check if database is connected
		if !appcontext.IsDbConnected() {
			helpers.RespondError(w, http.StatusServiceUnavailable, 
				"Database temporarily unavailable. Please try again later.")
			return
		}

		next.ServeHTTP(w, r)
	})
}
