package credits

import (
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/go-chi/chi/v5"
	"github.com/shopspring/decimal"
)

type PATCHCreditPotRequest struct {
	Name           *string `json:"name,omitempty"`
	Icon           *string `json:"icon,omitempty"`
	Colour         *string `json:"colour,omitempty"`
	TotalPayable   *string `json:"total_payable,omitempty"`
	MonthlyPayment *string `json:"monthly_payment,omitempty"`
	PaymentPeriod  *string `json:"payment_period,omitempty"`
	InterestRate   *string `json:"interest_rate,omitempty"`
	InterestPeriod *string `json:"interest_period,omitempty"`
}

func PATCHCreditPot(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid pot ID")
		return
	}

	// Verify ownership
	existing, _, err := db.QueryCreditPots(accountID, &id)
	if err != nil || len(existing) == 0 {
		helpers.RespondError(w, http.StatusNotFound, "Credit pot not found")
		return
	}

	var req PATCHCreditPotRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	pot := types.CreditPot{ID: id}

	if req.Name != nil {
		pot.Name = *req.Name
	}
	if req.Icon != nil {
		pot.Icon = req.Icon
	}
	if req.Colour != nil {
		pot.Colour = req.Colour
	}
	if req.TotalPayable != nil {
		t, parseErr := decimal.NewFromString(*req.TotalPayable)
		if parseErr != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid total_payable amount")
			return
		}
		pot.TotalPayable = t
	}
	if req.MonthlyPayment != nil {
		mp, parseErr := decimal.NewFromString(*req.MonthlyPayment)
		if parseErr != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid monthly_payment amount")
			return
		}
		pot.MonthlyPayment = &mp
	}
	if req.PaymentPeriod != nil {
		switch *req.PaymentPeriod {
		case "weekly", "fortnightly", "monthly":
			pot.PaymentPeriod = req.PaymentPeriod
		default:
			helpers.RespondError(w, http.StatusBadRequest, "payment_period must be weekly, fortnightly, or monthly")
			return
		}
	}
	if req.InterestRate != nil {
		ir, parseErr := decimal.NewFromString(*req.InterestRate)
		if parseErr != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid interest_rate amount")
			return
		}
		pot.InterestRate = &ir
	}
	if req.InterestPeriod != nil {
		switch *req.InterestPeriod {
		case "monthly", "annually":
			pot.InterestPeriod = req.InterestPeriod
		default:
			helpers.RespondError(w, http.StatusBadRequest, "interest_period must be monthly or annually")
			return
		}
	}

	if err := db.UpdateCreditPot(&pot); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not update credit pot")
		return
	}

	helpers.RespondData(w, pot, 1)
}
