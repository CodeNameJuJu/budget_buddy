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

	// Calculate spent amount for each budget
	for i := range budgets {
		periodStart, periodEnd := getCurrentPeriodWindow(budgets[i].StartDate, budgets[i].Period, budgets[i].EndDate)
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
// based on the original StartDate and Period type. For recurring budgets (no EndDate),
// the window rolls forward so spent amounts reset each period. If EndDate is set and
// has passed, the budget is expired and a zero range is returned.
func getCurrentPeriodWindow(startDate time.Time, period string, endDate *time.Time) (time.Time, *time.Time) {
	now := time.Now()

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
		daysElapsed := int(now.Sub(startDate).Hours() / 24)
		periodsElapsed := daysElapsed / 7
		periodStart = startDate.AddDate(0, 0, periodsElapsed*7)
		periodEnd = periodStart.AddDate(0, 0, 7)
	case "yearly":
		yearsElapsed := now.Year() - startDate.Year()
		if now.Month() < startDate.Month() || (now.Month() == startDate.Month() && now.Day() < startDate.Day()) {
			yearsElapsed--
		}
		periodStart = startDate.AddDate(yearsElapsed, 0, 0)
		periodEnd = periodStart.AddDate(1, 0, 0)
	default: // "monthly"
		monthsElapsed := (now.Year()-startDate.Year())*12 + int(now.Month()-startDate.Month())
		if now.Day() < startDate.Day() {
			monthsElapsed--
		}
		periodStart = startDate.AddDate(0, monthsElapsed, 0)
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

func SoftDeleteBudget(id int64) error {
	db := appcontext.GetDb()
	now := time.Now()

	_, err := db.NewUpdate().
		Model((*types.Budget)(nil)).
		Set("deleted_date = ?", now).
		Where("id = ?", id).
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
