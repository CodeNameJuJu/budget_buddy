package credits

import (
	"fmt"
	"net/http"
	"time"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/shopspring/decimal"
)

type POSTCreditPotRequest struct {
	AccountID      int64   `json:"account_id"`
	Name           string  `json:"name"`
	Icon           *string `json:"icon,omitempty"`
	Colour         *string `json:"colour,omitempty"`
	TotalPayable   string  `json:"total_payable"`
	MonthlyPayment *string `json:"monthly_payment,omitempty"`
	PaymentPeriod  *string `json:"payment_period,omitempty"`
	InterestRate   *string `json:"interest_rate,omitempty"`
	InterestPeriod *string `json:"interest_period,omitempty"`
}

func (p *POSTCreditPotRequest) Validate() error {
	if p.AccountID == 0 {
		return fmt.Errorf("account_id is required")
	}
	if p.Name == "" {
		return fmt.Errorf("name is required")
	}
	if p.TotalPayable == "" {
		return fmt.Errorf("total_payable is required")
	}
	if _, err := decimal.NewFromString(p.TotalPayable); err != nil {
		return fmt.Errorf("total_payable must be a valid number")
	}
	if p.MonthlyPayment != nil {
		if _, err := decimal.NewFromString(*p.MonthlyPayment); err != nil {
			return fmt.Errorf("monthly_payment must be a valid number")
		}
	}
	if p.PaymentPeriod != nil {
		switch *p.PaymentPeriod {
		case "weekly", "fortnightly", "monthly":
		default:
			return fmt.Errorf("payment_period must be weekly, fortnightly, or monthly")
		}
	}
	if p.InterestRate != nil {
		if _, err := decimal.NewFromString(*p.InterestRate); err != nil {
			return fmt.Errorf("interest_rate must be a valid number")
		}
	}
	if p.InterestPeriod != nil {
		switch *p.InterestPeriod {
		case "monthly", "annually":
		default:
			return fmt.Errorf("interest_period must be monthly or annually")
		}
	}
	return nil
}

func POSTCreditPot(w http.ResponseWriter, r *http.Request) {
	var req POSTCreditPotRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := req.Validate(); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	totalPayable, _ := decimal.NewFromString(req.TotalPayable)

	pot := types.CreditPot{
		AccountID:    req.AccountID,
		Name:         req.Name,
		Icon:         req.Icon,
		Colour:       req.Colour,
		TotalPayable: totalPayable,
	}

	if req.MonthlyPayment != nil {
		mp, _ := decimal.NewFromString(*req.MonthlyPayment)
		pot.MonthlyPayment = &mp
	}
	if req.PaymentPeriod != nil {
		pot.PaymentPeriod = req.PaymentPeriod
	}
	if req.InterestRate != nil {
		ir, _ := decimal.NewFromString(*req.InterestRate)
		pot.InterestRate = &ir
	}
	if req.InterestPeriod != nil {
		pot.InterestPeriod = req.InterestPeriod
	}

	if err := db.InsertCreditPot(&pot); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not create credit pot")
		return
	}

	helpers.RespondData(w, pot, 1)
}

type POSTCreditPaymentRequest struct {
	AccountID   int64   `json:"account_id"`
	CreditPotID int64   `json:"credit_pot_id"`
	Amount      string  `json:"amount"`
	Notes       *string `json:"notes,omitempty"`
}

func (p *POSTCreditPaymentRequest) Validate() error {
	if p.AccountID == 0 {
		return fmt.Errorf("account_id is required")
	}
	if p.CreditPotID == 0 {
		return fmt.Errorf("credit_pot_id is required")
	}
	if p.Amount == "" {
		return fmt.Errorf("amount is required")
	}
	if _, err := decimal.NewFromString(p.Amount); err != nil {
		return fmt.Errorf("amount must be a valid number")
	}
	return nil
}

func POSTCreditPayment(w http.ResponseWriter, r *http.Request) {
	var req POSTCreditPaymentRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := req.Validate(); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	amount, _ := decimal.NewFromString(req.Amount)

	payment := types.CreditPayment{
		AccountID:   req.AccountID,
		CreditPotID: req.CreditPotID,
		Amount:      amount,
		Notes:       req.Notes,
	}

	if err := db.InsertCreditPayment(&payment); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not create credit payment")
		return
	}

	// Create automatic transaction for the credit payment
	accountType := "credit"
	transactionType := "expense"
	description := "Credit payment"

	transaction := types.Transaction{
		AccountID:       req.AccountID,
		Amount:          amount,
		Type:            transactionType,
		Description:     &description,
		Date:            time.Now(),
		CreditPaymentID: &payment.ID,
		AccountType:     &accountType,
	}

	if err := db.InsertTransaction(&transaction); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not create transaction for credit payment")
		return
	}

	helpers.RespondData(w, payment, 1)
}
