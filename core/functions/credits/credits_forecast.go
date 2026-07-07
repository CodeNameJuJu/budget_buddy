package credits

import (
	"math"
	"net/http"
	"time"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/shopspring/decimal"
)

// CreditPotForecast contains the projected payoff data for a single credit pot.
type CreditPotForecast struct {
	PotID          int64    `json:"pot_id"`
	PotName        string   `json:"pot_name"`
	TotalPayable   string   `json:"total_payable"`
	Paid           string   `json:"paid"`
	Remaining      string   `json:"remaining"`
	MonthlyPayment *string  `json:"monthly_payment,omitempty"`
	PaymentPeriod  *string  `json:"payment_period,omitempty"`
	MonthsToPayoff *int     `json:"months_to_payoff,omitempty"`
	PayoffDate     *string  `json:"payoff_date,omitempty"`
	Projections    []string `json:"projections"`
}

// CreditForecastResponse is the full forecast for all credit pots.
type CreditForecastResponse struct {
	Pots               []CreditPotForecast `json:"pots"`
	TotalMonthly       string              `json:"total_monthly"`
	ProjectedTotal3Mo  string              `json:"projected_total_3mo"`
	ProjectedTotal6Mo  string              `json:"projected_total_6mo"`
	ProjectedTotal12Mo string              `json:"projected_total_12mo"`
}

// paymentsPerMonth normalises a payment amount to a monthly equivalent.
func paymentsPerMonth(amount decimal.Decimal, period string) decimal.Decimal {
	switch period {
	case "weekly":
		return amount.Mul(decimal.NewFromFloat(52.0 / 12.0))
	case "fortnightly":
		return amount.Mul(decimal.NewFromFloat(26.0 / 12.0))
	case "monthly":
		return amount
	default:
		return amount
	}
}

// GETCreditForecast returns projected payoff data for all credit pots with monthly payments.
func GETCreditForecast(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "Account not found in context")
		return
	}

	pots, _, err := db.QueryCreditPots(accountID, nil)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not query credit pots")
		return
	}

	totalMonthly := decimal.Zero
	totalPaid3 := decimal.Zero
	totalPaid6 := decimal.Zero
	totalPaid12 := decimal.Zero

	var forecasts []CreditPotForecast

	for _, pot := range pots {
		paid := decimal.Zero
		if pot.Paid != nil {
			paid = *pot.Paid
		}

		remaining := pot.TotalPayable.Sub(paid)

		f := CreditPotForecast{
			PotID:        pot.ID,
			PotName:      pot.Name,
			TotalPayable: pot.TotalPayable.StringFixed(2),
			Paid:         paid.StringFixed(2),
			Remaining:    remaining.StringFixed(2),
		}

		if pot.MonthlyPayment != nil {
			mps := pot.MonthlyPayment.StringFixed(2)
			f.MonthlyPayment = &mps
		}
		if pot.PaymentPeriod != nil {
			f.PaymentPeriod = pot.PaymentPeriod
		}

		// Calculate projections at 3, 6, and 12 months
		projections := make([]string, 3)
		if pot.MonthlyPayment != nil && pot.PaymentPeriod != nil {
			monthly := paymentsPerMonth(*pot.MonthlyPayment, *pot.PaymentPeriod)
			totalMonthly = totalMonthly.Add(monthly)

			paid3 := paid.Add(monthly.Mul(decimal.NewFromInt(3)))
			paid6 := paid.Add(monthly.Mul(decimal.NewFromInt(6)))
			paid12 := paid.Add(monthly.Mul(decimal.NewFromInt(12)))

			remaining3 := pot.TotalPayable.Sub(paid3)
			remaining6 := pot.TotalPayable.Sub(paid6)
			remaining12 := pot.TotalPayable.Sub(paid12)

			// Ensure projections don't go below zero
			if remaining3.IsNegative() {
				remaining3 = decimal.Zero
			}
			if remaining6.IsNegative() {
				remaining6 = decimal.Zero
			}
			if remaining12.IsNegative() {
				remaining12 = decimal.Zero
			}

			projections[0] = remaining3.StringFixed(2)
			projections[1] = remaining6.StringFixed(2)
			projections[2] = remaining12.StringFixed(2)

			totalPaid3 = totalPaid3.Add(paid3)
			totalPaid6 = totalPaid6.Add(paid6)
			totalPaid12 = totalPaid12.Add(paid12)

			// Calculate months to payoff
			if remaining.GreaterThan(decimal.Zero) && monthly.GreaterThan(decimal.Zero) {
				monthsFloat := remaining.Div(monthly).InexactFloat64()
				months := int(math.Ceil(monthsFloat))
				f.MonthsToPayoff = &months

				payoffDate := time.Now().AddDate(0, months, 0).Format("2006-01-02")
				f.PayoffDate = &payoffDate
			}
		} else {
			projections[0] = remaining.StringFixed(2)
			projections[1] = remaining.StringFixed(2)
			projections[2] = remaining.StringFixed(2)

			totalPaid3 = totalPaid3.Add(paid)
			totalPaid6 = totalPaid6.Add(paid)
			totalPaid12 = totalPaid12.Add(paid)
		}
		f.Projections = projections

		forecasts = append(forecasts, f)
	}

	// Calculate total remaining after projections
	var totalPayable decimal.Decimal
	for _, pot := range pots {
		totalPayable = totalPayable.Add(pot.TotalPayable)
	}

	remaining3 := totalPayable.Sub(totalPaid3)
	remaining6 := totalPayable.Sub(totalPaid6)
	remaining12 := totalPayable.Sub(totalPaid12)

	if remaining3.IsNegative() {
		remaining3 = decimal.Zero
	}
	if remaining6.IsNegative() {
		remaining6 = decimal.Zero
	}
	if remaining12.IsNegative() {
		remaining12 = decimal.Zero
	}

	resp := CreditForecastResponse{
		Pots:               forecasts,
		TotalMonthly:       totalMonthly.StringFixed(2),
		ProjectedTotal3Mo:  remaining3.StringFixed(2),
		ProjectedTotal6Mo:  remaining6.StringFixed(2),
		ProjectedTotal12Mo: remaining12.StringFixed(2),
	}

	helpers.RespondData(w, resp, 1)
}
