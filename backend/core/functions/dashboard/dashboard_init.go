package dashboard

import (
	"net/http"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
)

func POSTInitializeDashboard(w http.ResponseWriter, r *http.Request) {
	// Create default dashboard layout for account 1
	defaultLayout := &types.DashboardLayout{
		AccountID: 1,
		Name:      "Main Dashboard",
		IsActive:  true,
		Layout:    db.GetDefaultDashboardLayout(),
	}

	err := db.CreateOrUpdateDashboardLayout(defaultLayout)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not initialize dashboard")
		return
	}

	helpers.RespondData(w, map[string]string{"message": "Dashboard initialized"}, 1)
}
