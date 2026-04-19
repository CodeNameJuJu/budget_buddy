package budgets

import (
	"fmt"
	"net/http"
	"time"

	"github.com/shopspring/decimal"
	"github.com/julian/budget-buddy/core/db"
	"github.com/julian/budget-buddy/core/helpers"
	"github.com/julian/budget-buddy/utils/types"
)

type POSTBudgetRequest struct {
	AccountID  int64  `json:"account_id"`
	CategoryID int64  `json:"category_id"`
	Name       string `json:"name"`
	Amount     string `json:"amount"`
	Period     string `json:"period"`
	StartDate  string `json:"start_date"`
	EndDate    string `json:"end_date,omitempty"`
}

func (p *POSTBudgetRequest) Validate() error {
	if p.AccountID == 0 {
		return fmt.Errorf("account_id is required")
	}
	if p.CategoryID == 0 {
		return fmt.Errorf("category_id is required")
	}
	if p.Name == "" {
		return fmt.Errorf("name is required")
	}
	if p.Amount == "" {
		return fmt.Errorf("amount is required")
	}
	if _, err := decimal.NewFromString(p.Amount); err != nil {
		return fmt.Errorf("amount must be a valid number")
	}
	if p.Period != "monthly" && p.Period != "weekly" && p.Period != "yearly" {
		return fmt.Errorf("period must be 'monthly', 'weekly', or 'yearly'")
	}
	if p.StartDate == "" {
		return fmt.Errorf("start_date is required")
	}
	if _, err := time.Parse("2006-01-02", p.StartDate); err != nil {
		return fmt.Errorf("start_date must be in YYYY-MM-DD format")
	}
	return nil
}

func POSTBudget(w http.ResponseWriter, r *http.Request) {
	var req POSTBudgetRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := req.Validate(); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	amount, _ := decimal.NewFromString(req.Amount)
	startDate, _ := time.Parse("2006-01-02", req.StartDate)

	budget := types.Budget{
		AccountID:  req.AccountID,
		CategoryID: req.CategoryID,
		Name:       req.Name,
		Amount:     amount,
		Period:     req.Period,
		StartDate:  startDate,
	}

	if req.EndDate != "" {
		endDate, err := time.Parse("2006-01-02", req.EndDate)
		if err != nil {
			helpers.RespondError(w, http.StatusBadRequest, "end_date must be in YYYY-MM-DD format")
			return
		}
		budget.EndDate = &endDate
	}

	if err := db.InsertBudget(&budget); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not create budget")
		return
	}

	helpers.RespondData(w, budget, 1)
}
