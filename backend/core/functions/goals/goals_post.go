package goals

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/julian/budget-buddy/core/db"
	"github.com/julian/budget-buddy/core/helpers"
	"github.com/julian/budget-buddy/utils/types"
	"github.com/shopspring/decimal"
)

type CreateGoalRequest struct {
	AccountID    int64   `json:"account_id"`
	Name         string  `json:"name"`
	Description  *string `json:"description,omitempty"`
	TargetAmount string  `json:"target_amount"`
	TargetDate   *string `json:"target_date,omitempty"`
	Category     string  `json:"category"`
	Priority     int     `json:"priority"`
}

type CreateContributionRequest struct {
	GoalID    int64   `json:"goal_id"`
	AccountID int64   `json:"account_id"`
	Amount    string  `json:"amount"`
	Date      string  `json:"date"`
	Notes     *string `json:"notes,omitempty"`
	Source    string  `json:"source"`
}

func POSTGoal(w http.ResponseWriter, r *http.Request) {
	var req CreateGoalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Name == "" || req.TargetAmount == "" || req.Category == "" {
		helpers.RespondError(w, http.StatusBadRequest, "name, target_amount, and category are required")
		return
	}

	// Parse amounts
	targetAmount, err := decimal.NewFromString(req.TargetAmount)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid target_amount")
		return
	}

	// Parse target date if provided
	var targetDate *time.Time
	if req.TargetDate != nil && *req.TargetDate != "" {
		parsedDate, err := time.Parse("2006-01-02", *req.TargetDate)
		if err != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid target_date format. Use YYYY-MM-DD")
			return
		}
		targetDate = &parsedDate
	}

	// Validate priority
	if req.Priority < 1 || req.Priority > 5 {
		helpers.RespondError(w, http.StatusBadRequest, "Priority must be between 1 and 5")
		return
	}

	goal := &types.SavingsGoal{
		AccountID:     req.AccountID,
		Name:          req.Name,
		Description:   req.Description,
		TargetAmount:  targetAmount,
		CurrentAmount: decimal.Zero,
		TargetDate:    targetDate,
		Category:      req.Category,
		Priority:      req.Priority,
		IsActive:      true,
	}

	err = db.InsertSavingsGoal(goal)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not create savings goal")
		return
	}

	helpers.RespondData(w, goal, 1)
}

func POSTGoalContribution(w http.ResponseWriter, r *http.Request) {
	var req CreateContributionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Amount == "" || req.Date == "" || req.Source == "" {
		helpers.RespondError(w, http.StatusBadRequest, "amount, date, and source are required")
		return
	}

	// Parse amount
	amount, err := decimal.NewFromString(req.Amount)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid amount")
		return
	}

	// Parse date
	parsedDate, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid date format. Use YYYY-MM-DD")
		return
	}

	contribution := &types.GoalContribution{
		GoalID:    req.GoalID,
		AccountID: req.AccountID,
		Amount:    amount,
		Date:      parsedDate,
		Notes:     req.Notes,
		Source:    req.Source,
	}

	err = db.InsertGoalContribution(contribution)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not create goal contribution")
		return
	}

	helpers.RespondData(w, contribution, 1)
}
