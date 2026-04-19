package budgets

import (
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/shopspring/decimal"
	"github.com/julian/budget-buddy/core/db"
	"github.com/julian/budget-buddy/core/helpers"
	"github.com/julian/budget-buddy/utils/types"
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
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid budget ID")
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
		budget.Period = *req.Period
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
