package budgets

import (
	"net/http"
	"strconv"
	"time"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/go-chi/chi/v5"
	"github.com/shopspring/decimal"
)

type PATCHBudgetRequest struct {
	CategoryID *int64  `json:"category_id,omitempty"`
	Name       *string `json:"name,omitempty"`
	Amount     *string `json:"amount,omitempty"`
	Period     *string `json:"period,omitempty"`
	StartDate  *string `json:"start_date,omitempty"`
	EndDate    *string `json:"end_date,omitempty"`
}

func PATCHBudget(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid budget ID")
		return
	}

	// Verify ownership
	existing, _, err := db.QueryBudgets(accountID, &id)
	if err != nil || len(existing) == 0 {
		helpers.RespondError(w, http.StatusNotFound, "Budget not found")
		return
	}

	var req PATCHBudgetRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	budget := types.Budget{ID: id}

	if req.CategoryID != nil {
		budget.CategoryID = *req.CategoryID
	}
	if req.Name != nil {
		budget.Name = *req.Name
	}
	if req.Amount != nil {
		amount, parseErr := decimal.NewFromString(*req.Amount)
		if parseErr != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid amount")
			return
		}
		budget.Amount = amount
	}
	if req.Period != nil {
		switch *req.Period {
		case "weekly", "monthly", "yearly":
			budget.Period = *req.Period
		default:
			helpers.RespondError(w, http.StatusBadRequest, "period must be weekly, monthly, or yearly")
			return
		}
	}
	if req.StartDate != nil {
		startDate, parseErr := time.Parse("2006-01-02", *req.StartDate)
		if parseErr != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid start_date format")
			return
		}
		budget.StartDate = startDate
	}
	if req.EndDate != nil {
		endDate, parseErr := time.Parse("2006-01-02", *req.EndDate)
		if parseErr != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid end_date format")
			return
		}
		budget.EndDate = &endDate
	}

	if err := db.UpdateBudget(&budget); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not update budget")
		return
	}

	helpers.RespondData(w, budget, 1)
}
