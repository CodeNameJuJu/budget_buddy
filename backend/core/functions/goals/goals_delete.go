package goals

import (
	"net/http"
	"strconv"

	"github.com/julian/budget-buddy/core/db"
	"github.com/julian/budget-buddy/core/helpers"
)

func DELETEGoal(w http.ResponseWriter, r *http.Request) {
	goalIDStr := r.URL.Query().Get("id")
	if goalIDStr == "" {
		helpers.RespondError(w, http.StatusBadRequest, "id is required")
		return
	}

	goalID, err := strconv.ParseInt(goalIDStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid goal ID")
		return
	}

	err = db.SoftDeleteSavingsGoal(goalID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not delete savings goal")
		return
	}

	helpers.RespondData(w, nil, 0)
}

func DELETEGoalContribution(w http.ResponseWriter, r *http.Request) {
	contributionIDStr := r.URL.Query().Get("id")
	if contributionIDStr == "" {
		helpers.RespondError(w, http.StatusBadRequest, "id is required")
		return
	}

	contributionID, err := strconv.ParseInt(contributionIDStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid contribution ID")
		return
	}

	err = db.SoftDeleteGoalContribution(contributionID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not delete goal contribution")
		return
	}

	helpers.RespondData(w, nil, 0)
}
