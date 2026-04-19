package savings

import (
	"fmt"
	"net/http"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/shopspring/decimal"
)

type POSTPotRequest struct {
	AccountID          int64   `json:"account_id"`
	Name               string  `json:"name"`
	Icon               *string `json:"icon,omitempty"`
	Colour             *string `json:"colour,omitempty"`
	Target             *string `json:"target,omitempty"`
	Contribution       *string `json:"contribution,omitempty"`
	ContributionPeriod *string `json:"contribution_period,omitempty"`
}

func (p *POSTPotRequest) Validate() error {
	if p.AccountID == 0 {
		return fmt.Errorf("account_id is required")
	}
	if p.Name == "" {
		return fmt.Errorf("name is required")
	}
	if p.Target != nil {
		if _, err := decimal.NewFromString(*p.Target); err != nil {
			return fmt.Errorf("target must be a valid number")
		}
	}
	if p.Contribution != nil {
		if _, err := decimal.NewFromString(*p.Contribution); err != nil {
			return fmt.Errorf("contribution must be a valid number")
		}
	}
	if p.ContributionPeriod != nil {
		switch *p.ContributionPeriod {
		case "weekly", "fortnightly", "monthly":
		default:
			return fmt.Errorf("contribution_period must be weekly, fortnightly, or monthly")
		}
	}
	return nil
}

func POSTPot(w http.ResponseWriter, r *http.Request) {
	var req POSTPotRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := req.Validate(); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	pot := types.SavingsPot{
		AccountID: req.AccountID,
		Name:      req.Name,
		Icon:      req.Icon,
		Colour:    req.Colour,
	}

	if req.Target != nil {
		t, _ := decimal.NewFromString(*req.Target)
		pot.Target = &t
	}
	if req.Contribution != nil {
		c, _ := decimal.NewFromString(*req.Contribution)
		pot.Contribution = &c
	}
	if req.ContributionPeriod != nil {
		pot.ContributionPeriod = req.ContributionPeriod
	}

	if err := db.InsertSavingsPot(&pot); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not create savings pot")
		return
	}

	helpers.RespondData(w, pot, 1)
}

type POSTAllocationRequest struct {
	AccountID    int64   `json:"account_id"`
	SavingsPotID int64   `json:"savings_pot_id"`
	Amount       string  `json:"amount"`
	Notes        *string `json:"notes,omitempty"`
}

func (p *POSTAllocationRequest) Validate() error {
	if p.AccountID == 0 {
		return fmt.Errorf("account_id is required")
	}
	if p.SavingsPotID == 0 {
		return fmt.Errorf("savings_pot_id is required")
	}
	if p.Amount == "" {
		return fmt.Errorf("amount is required")
	}
	if _, err := decimal.NewFromString(p.Amount); err != nil {
		return fmt.Errorf("amount must be a valid number")
	}
	return nil
}

func POSTAllocation(w http.ResponseWriter, r *http.Request) {
	var req POSTAllocationRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := req.Validate(); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	amount, _ := decimal.NewFromString(req.Amount)

	allocation := types.SavingsAllocation{
		AccountID:    req.AccountID,
		SavingsPotID: req.SavingsPotID,
		Amount:       amount,
		Notes:        req.Notes,
	}

	if err := db.InsertSavingsAllocation(&allocation); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not create savings allocation")
		return
	}

	helpers.RespondData(w, allocation, 1)
}

type POSTSavingsBalanceRequest struct {
	SavingsBalance string `json:"savings_balance"`
}

func POSTSavingsBalance(w http.ResponseWriter, r *http.Request) {
	accountIDStr := r.URL.Query().Get("account_id")
	if accountIDStr == "" {
		helpers.RespondError(w, http.StatusBadRequest, "account_id is required")
		return
	}

	var req POSTSavingsBalanceRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	balance, err := decimal.NewFromString(req.SavingsBalance)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "savings_balance must be a valid number")
		return
	}

	var accountID int64
	fmt.Sscanf(accountIDStr, "%d", &accountID)

	account := types.Account{
		ID:             accountID,
		SavingsBalance: &balance,
	}

	if err := db.UpdateAccount(&account); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not update savings balance")
		return
	}

	helpers.RespondData(w, account, 1)
}
