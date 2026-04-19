package alerts

import (
	"net/http"

	"github.com/julian/budget-buddy/core/db"
	"github.com/julian/budget-buddy/core/helpers"
	"github.com/julian/budget-buddy/utils/types"
)

func POSTInitializeAlerts(w http.ResponseWriter, r *http.Request) {
	// Create default alert preferences for account 1
	preferences := []types.AlertPreference{
		{
			AccountID: 1,
			Type:      types.AlertBudgetThreshold,
			Enabled:   true,
			Threshold: intPtr(70),
		},
		{
			AccountID: 1,
			Type:      types.AlertBudgetExceeded,
			Enabled:   true,
		},
		{
			AccountID: 1,
			Type:      types.AlertGoalAchieved,
			Enabled:   true,
		},
		{
			AccountID: 1,
			Type:      types.AlertGoalMilestone,
			Enabled:   true,
		},
		{
			AccountID: 1,
			Type:      types.AlertWeeklySummary,
			Enabled:   false,
		},
		{
			AccountID: 1,
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
