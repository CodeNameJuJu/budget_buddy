package goals

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/shopspring/decimal"
)

type UpdateGoalRequest struct {
	Name         *string `json:"name,omitempty"`
	Description  *string `json:"description,omitempty"`
	TargetAmount *string `json:"target_amount,omitempty"`
	TargetDate   *string `json:"target_date,omitempty"`
	Category     *string `json:"category,omitempty"`
	Priority     *int    `json:"priority,omitempty"`
	IsActive     *bool   `json:"is_active,omitempty"`
}

func PATCHGoal(w http.ResponseWriter, r *http.Request) {
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

	var req UpdateGoalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Get existing goal
	goals, _, err := db.QuerySavingsGoals(0, &goalID)
	if err != nil || len(goals) == 0 {
		helpers.RespondError(w, http.StatusNotFound, "Goal not found")
		return
	}

	goal := &goals[0]

	// Update fields if provided
	if req.Name != nil {
		goal.Name = *req.Name
	}
	if req.Description != nil {
		goal.Description = req.Description
	}
	if req.TargetAmount != nil {
		targetAmount, err := decimal.NewFromString(*req.TargetAmount)
		if err != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid target_amount")
			return
		}
		goal.TargetAmount = targetAmount
	}
	if req.TargetDate != nil {
		if *req.TargetDate == "" {
			goal.TargetDate = nil
		} else {
			parsedDate, err := time.Parse("2006-01-02", *req.TargetDate)
			if err != nil {
				helpers.RespondError(w, http.StatusBadRequest, "Invalid target_date format. Use YYYY-MM-DD")
				return
			}
			goal.TargetDate = &parsedDate
		}
	}
	if req.Category != nil {
		goal.Category = *req.Category
	}
	if req.Priority != nil {
		if *req.Priority < 1 || *req.Priority > 5 {
			helpers.RespondError(w, http.StatusBadRequest, "Priority must be between 1 and 5")
			return
		}
		goal.Priority = *req.Priority
	}
	if req.IsActive != nil {
		goal.IsActive = *req.IsActive
	}

	err = db.UpdateSavingsGoal(goal)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not update savings goal")
		return
	}

	helpers.RespondData(w, goal, 1)
}
