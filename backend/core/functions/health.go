package functions

import (
	"net/http"

	"github.com/CodeNameJuJu/budget_buddy/core/context"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
)

func HealthCheck(w http.ResponseWriter, r *http.Request) {
	// Comprehensive health check
	health := map[string]interface{}{
		"status":  "ok",
		"service": "budget-buddy-backend",
		"database": map[string]interface{}{
			"connected": context.IsDbConnected(),
		},
	}

	// If database is not connected, mark service as degraded
	if !context.IsDbConnected() {
		health["status"] = "degraded"
		health["database"].(map[string]interface{})["error"] = "Database connection failed"
	}

	helpers.RespondData(w, health, 1)
}
