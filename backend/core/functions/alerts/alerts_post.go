package alerts

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/julian/budget-buddy/core/db"
	"github.com/julian/budget-buddy/core/helpers"
	"github.com/julian/budget-buddy/utils/types"
)

type CreateAlertPreferenceRequest struct {
	AccountID int64     `json:"account_id"`
	Type      string    `json:"type"`
	Enabled   bool      `json:"enabled"`
	Threshold *int      `json:"threshold,omitempty"`
}

func POSTMarkAlertAsRead(w http.ResponseWriter, r *http.Request) {
	alertIDStr := r.URL.Query().Get("alert_id")
	if alertIDStr == "" {
		helpers.RespondError(w, http.StatusBadRequest, "alert_id is required")
		return
	}

	alertID, err := strconv.ParseInt(alertIDStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid alert_id")
		return
	}

	err = db.MarkAlertAsRead(alertID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not mark alert as read")
		return
	}

	helpers.RespondData(w, nil, 0)
}

func POSTMarkAllAlertsAsRead(w http.ResponseWriter, r *http.Request) {
	var req struct {
		AccountID int64 `json:"account_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.AccountID == 0 {
		helpers.RespondError(w, http.StatusBadRequest, "account_id is required")
		return
	}

	err := db.MarkAllAlertsAsRead(req.AccountID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not mark all alerts as read")
		return
	}

	helpers.RespondData(w, nil, 0)
}

func POSTAlertPreference(w http.ResponseWriter, r *http.Request) {
	var req CreateAlertPreferenceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate alert type
	alertType := types.AlertType(req.Type)
	validTypes := map[types.AlertType]bool{
		types.AlertBudgetThreshold: true,
		types.AlertBudgetExceeded:  true,
		types.AlertGoalAchieved:    true,
		types.AlertGoalMilestone:   true,
		types.AlertWeeklySummary:   true,
		types.AlertMonthlySummary:  true,
	}

	if !validTypes[alertType] {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid alert type")
		return
	}

	// Validate threshold if provided
	if req.Threshold != nil && (*req.Threshold < 1 || *req.Threshold > 100) {
		helpers.RespondError(w, http.StatusBadRequest, "Threshold must be between 1 and 100")
		return
	}

	preference := &types.AlertPreference{
		AccountID: req.AccountID,
		Type:      alertType,
		Enabled:   req.Enabled,
		Threshold: req.Threshold,
	}

	err := db.UpdateAlertPreference(preference)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not update alert preference")
		return
	}

	helpers.RespondData(w, preference, 1)
}

func POSTTriggerAlerts(w http.ResponseWriter, r *http.Request) {
	var req struct {
		AccountID int64 `json:"account_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.AccountID == 0 {
		helpers.RespondError(w, http.StatusBadRequest, "account_id is required")
		return
	}

	// Generate budget threshold alerts
	if err := db.GenerateBudgetThresholdAlerts(req.AccountID); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not generate budget alerts")
		return
	}

	// Generate goal achievement alerts
	if err := db.GenerateGoalAchievementAlerts(req.AccountID); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not generate goal alerts")
		return
	}

	helpers.RespondData(w, map[string]string{"message": "Alerts generated successfully"}, 1)
}
