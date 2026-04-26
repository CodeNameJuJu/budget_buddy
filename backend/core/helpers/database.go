package helpers

import (
	"net/http"

	appcontext "github.com/CodeNameJuJu/budget_buddy/core/context"
)

// CheckDatabaseConnection returns an error response if database is not connected
func CheckDatabaseConnection(w http.ResponseWriter) bool {
	if !appcontext.IsDbConnected() {
		RespondError(w, http.StatusServiceUnavailable, "Database connection unavailable. Please try again later.")
		return false
	}
	return true
}
