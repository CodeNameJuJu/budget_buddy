package dashboard

import (
	"net/http"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
)

func POSTInitializeDashboard(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	defaultLayout := &types.DashboardLayout{
		AccountID: accountID,
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
