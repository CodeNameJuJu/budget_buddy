package functions

import (
	"net/http"

	"github.com/julian/budget-buddy/core/helpers"
)

func HealthCheck(w http.ResponseWriter, r *http.Request) {
	// Simple health check
	helpers.RespondData(w, map[string]interface{}{
		"status":  "ok",
		"service": "budget-buddy-backend",
	}, http.StatusOK)
}
