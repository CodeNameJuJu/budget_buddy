package alerts

import (
	"net/http"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
)

func POSTInitializeAlerts(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	preferences := []types.AlertPreference{
		{
			AccountID: accountID,
			Type:      types.AlertBudgetThreshold,
			Enabled:   true,
			Threshold: intPtr(70),
		},
		{
			AccountID: accountID,
			Type:      types.AlertBudgetExceeded,
			Enabled:   true,
		},
		{
			AccountID: accountID,
			Type:      types.AlertGoalAchieved,
			Enabled:   true,
		},
		{
			AccountID: accountID,
			Type:      types.AlertGoalMilestone,
			Enabled:   true,
		},
		{
			AccountID: accountID,
			Type:      types.AlertWeeklySummary,
			Enabled:   false,
		},
		{
			AccountID: accountID,
			Type:      types.AlertMonthlySummary,
			Enabled:   false,
		},
	}

	for _, pref := range preferences {
		err := db.UpdateAlertPreference(&pref)
		if err != nil {
			// Ignore errors for now - likely means preference already exists
			continue
		}
	}

	helpers.RespondData(w, map[string]string{"message": "Alerts initialized"}, 1)
}

func intPtr(i int) *int {
	return &i
}
