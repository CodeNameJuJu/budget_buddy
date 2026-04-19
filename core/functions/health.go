package functions

import (
	"fmt"
	"net/http"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
)

func HealthCheck(w http.ResponseWriter, r *http.Request) {
	// Enhanced health check with database status
	response := map[string]interface{}{
		"status":  "ok",
		"service": "budget-buddy-backend",
	}

	// Check database connection
	database := db.GetDb()
	if database == nil {
		response["status"] = "error"
		response["database"] = "not_connected"
		response["error"] = "Database not initialized"
		helpers.RespondData(w, response, http.StatusServiceUnavailable)
		return
	}

	if err := database.Ping(); err != nil {
		response["status"] = "error"
		response["database"] = "connection_failed"
		response["error"] = fmt.Sprintf("Database connection failed: %s", err.Error())
		helpers.RespondData(w, response, http.StatusServiceUnavailable)
		return
	}

	response["database"] = "connected"
	helpers.RespondData(w, response, http.StatusOK)
}
