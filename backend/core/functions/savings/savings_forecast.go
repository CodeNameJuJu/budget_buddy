package savings

import (
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/julian/budget-buddy/core/db"
	"github.com/julian/budget-buddy/core/helpers"
	"github.com/shopspring/decimal"
)

// PotForecast contains the projected savings data for a single pot.
type PotForecast struct {
	PotID              int64    `json:"pot_id"`
	PotName            string   `json:"pot_name"`
	Allocated          string   `json:"allocated"`
	Target             *string  `json:"target,omitempty"`
	Contribution       *string  `json:"contribution,omitempty"`
	ContributionPeriod *string  `json:"contribution_period,omitempty"`
	MonthsToTarget     *int     `json:"months_to_target,omitempty"`
	TargetDate         *string  `json:"target_date,omitempty"`
	Projections        []string `json:"projections"`
}

// ForecastResponse is the full forecast for all pots.
type ForecastResponse struct {
	Pots               []PotForecast `json:"pots"`
	TotalMonthly       string        `json:"total_monthly"`
	ProjectedTotal3Mo  string        `json:"projected_total_3mo"`
	ProjectedTotal6Mo  string        `json:"projected_total_6mo"`
	ProjectedTotal12Mo string        `json:"projected_total_12mo"`
}

// contributionsPerMonth normalises a contribution amount to a monthly equivalent.
func contributionsPerMonth(amount decimal.Decimal, period string) decimal.Decimal {
	switch period {
	case "weekly":
		// ~4.33 weeks per month
		return amount.Mul(decimal.NewFromFloat(52.0 / 12.0))
	case "fortnightly":
		// ~2.17 fortnights per month
		return amount.Mul(decimal.NewFromFloat(26.0 / 12.0))
	case "monthly":
		return amount
	default:
		return amount
	}
}

// GETSavingsForecast returns projected savings data for all pots with contributions.
func GETSavingsForecast(w http.ResponseWriter, r *http.Request) {
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

	pots, _, err := db.QuerySavingsPots(accountID, nil)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not query savings pots")
		return
	}

	totalMonthly := decimal.Zero
	projTotal3 := decimal.Zero
	projTotal6 := decimal.Zero
	projTotal12 := decimal.Zero

	var forecasts []PotForecast

	for _, pot := range pots {
		allocated := decimal.Zero
		if pot.Allocated != nil {
			allocated = *pot.Allocated
		}

		f := PotForecast{
			PotID:     pot.ID,
			PotName:   pot.Name,
			Allocated: allocated.StringFixed(2),
		}

		if pot.Target != nil {
			ts := pot.Target.StringFixed(2)
			f.Target = &ts
		}
		if pot.Contribution != nil {
			cs := pot.Contribution.StringFixed(2)
			f.Contribution = &cs
		}
		if pot.ContributionPeriod != nil {
			f.ContributionPeriod = pot.ContributionPeriod
		}

		// Calculate projections at 3, 6, and 12 months
		projections := make([]string, 3)
		if pot.Contribution != nil && pot.ContributionPeriod != nil {
			monthly := contributionsPerMonth(*pot.Contribution, *pot.ContributionPeriod)
			totalMonthly = totalMonthly.Add(monthly)

			proj3 := allocated.Add(monthly.Mul(decimal.NewFromInt(3)))
			proj6 := allocated.Add(monthly.Mul(decimal.NewFromInt(6)))
			proj12 := allocated.Add(monthly.Mul(decimal.NewFromInt(12)))

			projections[0] = proj3.StringFixed(2)
			projections[1] = proj6.StringFixed(2)
			projections[2] = proj12.StringFixed(2)

			projTotal3 = projTotal3.Add(proj3)
			projTotal6 = projTotal6.Add(proj6)
			projTotal12 = projTotal12.Add(proj12)

			// Calculate months to target
			if pot.Target != nil && pot.Target.GreaterThan(allocated) && monthly.GreaterThan(decimal.Zero) {
				remaining := pot.Target.Sub(allocated)
				monthsFloat := remaining.Div(monthly).InexactFloat64()
				months := int(math.Ceil(monthsFloat))
				f.MonthsToTarget = &months

				targetDate := time.Now().AddDate(0, months, 0).Format("2006-01-02")
				f.TargetDate = &targetDate
			}
		} else {
			projections[0] = allocated.StringFixed(2)
			projections[1] = allocated.StringFixed(2)
			projections[2] = allocated.StringFixed(2)

			projTotal3 = projTotal3.Add(allocated)
			projTotal6 = projTotal6.Add(allocated)
			projTotal12 = projTotal12.Add(allocated)
		}
		f.Projections = projections

		forecasts = append(forecasts, f)
	}

	resp := ForecastResponse{
		Pots:               forecasts,
		TotalMonthly:       totalMonthly.StringFixed(2),
		ProjectedTotal3Mo:  projTotal3.StringFixed(2),
		ProjectedTotal6Mo:  projTotal6.StringFixed(2),
		ProjectedTotal12Mo: projTotal12.StringFixed(2),
	}

	helpers.RespondData(w, resp, 1)
}
