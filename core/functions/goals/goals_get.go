package goals

import (
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/go-chi/chi/v5"
)

func GETGoals(w http.ResponseWriter, r *http.Request) {
	accountIDStr := r.URL.Query().Get("account_id")
	if accountIDStr == "" {
		helpers.RespondError(w, http.StatusBadRequest, "account_id is required")
		return
	}

	accountID, err := strconv.ParseInt(accountIDStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid account_id")
		return
	}

	var goalID *int64
	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		idStr = r.URL.Query().Get("id")
	}
	if idStr != "" {
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid goal ID")
			return
		}
		goalID = &id
	}

	goals, count, err := db.QuerySavingsGoals(accountID, goalID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not query savings goals")
		return
	}

	helpers.RespondData(w, goals, count)
}

func GETGoalContributions(w http.ResponseWriter, r *http.Request) {
	accountIDStr := r.URL.Query().Get("account_id")
	if accountIDStr == "" {
		helpers.RespondError(w, http.StatusBadRequest, "account_id is required")
		return
	}

	accountID, err := strconv.ParseInt(accountIDStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid account_id")
		return
	}

	var goalID *int64
	contributionIDStr := chi.URLParam(r, "id")
	if contributionIDStr != "" {
		cid, err := strconv.ParseInt(contributionIDStr, 10, 64)
		if err != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid goal ID")
			return
		}
		goalID = &cid
	} else if idStr := r.URL.Query().Get("goal_id"); idStr != "" {
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid goal_id")
			return
		}
		goalID = &id
	}

	contributions, count, err := db.QueryGoalContributions(accountID, goalID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not query goal contributions")
		return
	}

	helpers.RespondData(w, contributions, count)
}

func GETGoalsSummary(w http.ResponseWriter, r *http.Request) {
	accountIDStr := r.URL.Query().Get("account_id")
	if accountIDStr == "" {
		helpers.RespondError(w, http.StatusBadRequest, "account_id is required")
		return
	}

	accountID, err := strconv.ParseInt(accountIDStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid account_id")
		return
	}

	summary, err := db.GetGoalsSummary(accountID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not get goals summary")
		return
	}

	helpers.RespondData(w, summary, len(summary))
}
