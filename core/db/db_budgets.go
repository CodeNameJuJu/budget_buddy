package db

import (
	"context"
	"time"

	appcontext "github.com/CodeNameJuJu/budget_buddy/core/context"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/shopspring/decimal"
)

func QueryBudgets(accountID int64, budgetID *int64) ([]types.Budget, int, error) {
	db := appcontext.GetDb()
	var budgets []types.Budget

	query := db.NewSelect().Model(&budgets).
		Relation("Category").
		Where("b.account_id = ?", accountID).
		Where("b.deleted_date IS NULL").
		Order("b.name ASC")

	if budgetID != nil {
		query = query.Where("b.id = ?", *budgetID)
	}

	count, err := query.ScanAndCount(context.Background())
	if err != nil {
		return nil, 0, err
	}

	// Get the account's billing cycle day and timezone
	billingCycleDay := 25
	loc := time.Local
	var account types.Account
	if err := db.NewSelect().Model(&account).Where("id = ?", accountID).Scan(context.Background()); err == nil {
		if account.BillingCycleDay != nil && *account.BillingCycleDay > 0 && *account.BillingCycleDay <= 31 {
			billingCycleDay = *account.BillingCycleDay
		}
		if account.Timezone != nil {
			if tz, err := time.LoadLocation(*account.Timezone); err == nil {
				loc = tz
			}
		}
	}

	// Calculate spent amount for each budget
	for i := range budgets {
		periodStart, periodEnd := getCurrentPeriodWindow(budgets[i].StartDate, budgets[i].Period, budgets[i].EndDate, billingCycleDay, loc)
		spent, calcErr := calculateBudgetSpent(budgets[i].CategoryID, budgets[i].AccountID, periodStart, periodEnd)
		if calcErr != nil {
			// If calculation fails, set spent to 0 instead of skipping
			zero := decimal.Zero
			budgets[i].Spent = &zero
			budgets[i].Remaining = &budgets[i].Amount
			continue
		}
		remaining := budgets[i].Amount.Sub(spent)
		budgets[i].Spent = &spent
		budgets[i].Remaining = &remaining
	}

	return budgets, count, nil
}

func calculateBudgetSpent(categoryID int64, accountID int64, startDate time.Time, endDate *time.Time) (decimal.Decimal, error) {
	db := appcontext.GetDb()
	var spent decimal.Decimal

	query := db.NewSelect().
		Model((*types.Transaction)(nil)).
		ColumnExpr("COALESCE(SUM(amount), 0)").
		Where("category_id = ?", categoryID).
		Where("account_id = ?", accountID).
		Where("type = ?", "expense").
		Where("deleted_date IS NULL").
		Where("date >= ?", startDate)

	if endDate != nil {
		query = query.Where("date < ?", *endDate)
	}

	err := query.Scan(context.Background(), &spent)
	return spent, err
}

// getCurrentPeriodWindow computes the start and end of the current budget period
// based on the billing cycle day and Period type. For recurring budgets (no EndDate),
// the window rolls forward so spent amounts reset each period. If EndDate is set and
// has passed, the budget is expired and a zero range is returned.
func getCurrentPeriodWindow(startDate time.Time, period string, endDate *time.Time, billingCycleDay int, loc *time.Location) (time.Time, *time.Time) {
	now := time.Now().In(loc)

	// If the budget hasn't started yet, use the original start date
	if startDate.After(now) {
		return startDate, endDate
	}

	// If EndDate is set and has passed, the budget is expired
	if endDate != nil && endDate.Before(now) {
		return startDate, endDate
	}

	var periodStart, periodEnd time.Time

	switch period {
	case "weekly":
		// Weekly periods still anchor to the original start date
		daysElapsed := int(now.Sub(startDate).Hours() / 24)
		periodsElapsed := daysElapsed / 7
		periodStart = startDate.AddDate(0, 0, periodsElapsed*7)
		periodEnd = periodStart.AddDate(0, 0, 7)
	case "yearly":
		// Yearly periods anchor to the billing cycle day in the start month
		yearsElapsed := now.Year() - startDate.Year()
		if now.Month() < startDate.Month() || (now.Month() == startDate.Month() && now.Day() < billingCycleDay) {
			yearsElapsed--
		}
		periodStart = time.Date(startDate.Year()+yearsElapsed, startDate.Month(), billingCycleDay, 0, 0, 0, 0, loc)
		periodEnd = periodStart.AddDate(1, 0, 0)
	default: // "monthly"
		// Monthly periods reset on the billing cycle day
		monthsElapsed := (now.Year()-startDate.Year())*12 + int(now.Month()-startDate.Month())
		if now.Day() < billingCycleDay {
			monthsElapsed--
		}
		periodStart = time.Date(startDate.Year(), startDate.Month(), billingCycleDay, 0, 0, 0, 0, loc).AddDate(0, monthsElapsed, 0)
		periodEnd = periodStart.AddDate(0, 1, 0)
	}

	// If EndDate is set, cap the period end at EndDate
	if endDate != nil && periodEnd.After(*endDate) {
		periodEnd = *endDate
	}

	return periodStart, &periodEnd
}

func InsertBudget(budget *types.Budget) error {
	db := appcontext.GetDb()
	_, err := db.NewInsert().Model(budget).
		Returning("*").
		Exec(context.Background())
	return err
}

func UpdateBudget(budget *types.Budget) error {
	db := appcontext.GetDb()
	now := time.Now()
	budget.ModifiedDate = &now

	_, err := db.NewUpdate().Model(budget).
		WherePK().
		OmitZero().
		Returning("*").
		Exec(context.Background())
	return err
}

func SoftDeleteBudgetForAccount(id int64, accountID int64) error {
	db := appcontext.GetDb()
	now := time.Now()

	_, err := db.NewUpdate().
		Model((*types.Budget)(nil)).
		Set("deleted_date = ?", now).
		Where("id = ?", id).
		Where("account_id = ?", accountID).
		Where("deleted_date IS NULL").
		Exec(context.Background())
	return err
}
