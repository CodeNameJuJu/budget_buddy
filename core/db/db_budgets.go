package db

import (
	"context"
	"time"

	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/shopspring/decimal"
	"github.com/uptrace/bun"
)

func QueryBudgets(accountID int64, budgetID *int64) ([]types.Budget, int, error) {
	db := GetDb()
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

	billingCycleDay, loc := GetAccountBillingSettings(accountID)

	// Calculate spent amount and recurring status for each budget
	for i := range budgets {
		periodStart, periodEnd := getCurrentPeriodWindow(budgets[i].StartDate, budgets[i].Period, budgets[i].EndDate, billingCycleDay, loc)
		budgets[i].PeriodStart = &periodStart
		budgets[i].PeriodEnd = periodEnd

		spent, calcErr := calculateBudgetSpent(&budgets[i], periodStart, periodEnd)
		if calcErr != nil {
			// If calculation fails, set spent to 0 instead of skipping
			zero := decimal.Zero
			budgets[i].Spent = &zero
			budgets[i].Remaining = &budgets[i].Amount
		} else {
			remaining := budgets[i].Amount.Sub(spent)
			budgets[i].Spent = &spent
			budgets[i].Remaining = &remaining
		}

		total, due, recErr := countRecurringForBudget(budgets[i].ID, periodStart, periodEnd)
		if recErr == nil {
			budgets[i].RecurringCount = total
			budgets[i].RecurringDue = due
		}
	}

	return budgets, count, nil
}

// GetAccountBillingSettings returns the billing cycle day and timezone for an
// account, falling back to the 25th and the server's local timezone.
func GetAccountBillingSettings(accountID int64) (int, *time.Location) {
	db := GetDb()
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
	return billingCycleDay, loc
}

// applyBudgetTransactionMatch restricts a transactions query to the
// transactions that belong to a budget: anything explicitly linked via
// budget_id, plus unlinked transactions in the budget's category. A
// transaction linked to a different budget is never counted, even if it
// shares the category.
func applyBudgetTransactionMatch(query *bun.SelectQuery, budget *types.Budget, startDate time.Time, endDate *time.Time) *bun.SelectQuery {
	query = query.
		Where("t.account_id = ?", budget.AccountID).
		Where("t.deleted_date IS NULL").
		Where("(t.budget_id = ? OR (t.budget_id IS NULL AND t.category_id = ?))", budget.ID, budget.CategoryID).
		Where("t.date >= ?", startDate)

	if endDate != nil {
		query = query.Where("t.date < ?", *endDate)
	}
	return query
}

func calculateBudgetSpent(budget *types.Budget, startDate time.Time, endDate *time.Time) (decimal.Decimal, error) {
	db := GetDb()
	var spent decimal.Decimal

	query := db.NewSelect().
		Model((*types.Transaction)(nil)).
		ColumnExpr("COALESCE(SUM(t.amount), 0)").
		Where("t.type = ?", "expense")
	query = applyBudgetTransactionMatch(query, budget, startDate, endDate)

	err := query.Scan(context.Background(), &spent)
	return spent, err
}

// QueryBudgetTransactions returns the transactions counted against a budget in
// its current period, using the same matching rule as the spent calculation.
func QueryBudgetTransactions(budget *types.Budget) ([]types.Transaction, int, error) {
	db := GetDb()
	var transactions []types.Transaction

	if budget.PeriodStart == nil {
		billingCycleDay, loc := GetAccountBillingSettings(budget.AccountID)
		periodStart, periodEnd := getCurrentPeriodWindow(budget.StartDate, budget.Period, budget.EndDate, billingCycleDay, loc)
		budget.PeriodStart = &periodStart
		budget.PeriodEnd = periodEnd
	}

	query := db.NewSelect().Model(&transactions).
		Relation("Category").
		Order("t.date DESC", "t.id DESC")
	query = applyBudgetTransactionMatch(query, budget, *budget.PeriodStart, budget.PeriodEnd)

	count, err := query.ScanAndCount(context.Background())
	return transactions, count, err
}

// getCurrentPeriodWindow computes the start and end of the current budget period
// based on the billing cycle day and Period type. The window always rolls forward
// so spent amounts reset each period. EndDate only caps the period end when the
// current rolling period genuinely starts before it (the budget's last partial
// period); once the rolling period has moved past EndDate entirely, EndDate is
// ignored so the budget keeps recurring indefinitely.
func getCurrentPeriodWindow(startDate time.Time, period string, endDate *time.Time, billingCycleDay int, loc *time.Location) (time.Time, *time.Time) {
	now := time.Now().In(loc)

	// If the budget hasn't started yet, use the original start date
	if startDate.After(now) {
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

	// If EndDate is set and the current period genuinely starts before it,
	// cap the period end there (the budget's last partial period). If the
	// rolling period has moved past EndDate entirely, ignore EndDate.
	if endDate != nil && periodStart.Before(*endDate) && periodEnd.After(*endDate) {
		periodEnd = *endDate
	}

	return periodStart, &periodEnd
}

func InsertBudget(budget *types.Budget) error {
	db := GetDb()
	_, err := db.NewInsert().Model(budget).
		Returning("*").
		Exec(context.Background())
	return err
}

func UpdateBudget(budget *types.Budget) error {
	db := GetDb()
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
	db := GetDb()
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
