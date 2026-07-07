package goals

import (
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/go-chi/chi/v5"
)

func DELETEGoal(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	goalIDStr := chi.URLParam(r, "id")
	if goalIDStr == "" {
		helpers.RespondError(w, http.StatusBadRequest, "id is required")
		return
	}

	goalID, err := strconv.ParseInt(goalIDStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid goal ID")
		return
	}

	err = db.SoftDeleteSavingsGoalForAccount(goalID, accountID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not delete savings goal")
		return
	}

	helpers.RespondData(w, nil, 0)
}

func DELETEGoalContribution(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	contributionIDStr := chi.URLParam(r, "id")
	if contributionIDStr == "" {
		helpers.RespondError(w, http.StatusBadRequest, "id is required")
		return
	}

	contributionID, err := strconv.ParseInt(contributionIDStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid contribution ID")
		return
	}

	err = db.SoftDeleteGoalContributionForAccount(contributionID, accountID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not delete goal contribution")
		return
	}

	helpers.RespondData(w, nil, 0)
}
