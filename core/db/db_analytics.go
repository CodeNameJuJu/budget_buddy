package db

import (
	"context"
	"time"

	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/shopspring/decimal"
)

type SpendingTrend struct {
	Month      string          `json:"month"`
	Income     decimal.Decimal `json:"income"`
	Expenses   decimal.Decimal `json:"expenses"`
	Savings    decimal.Decimal `json:"savings"`
	BudgetUsed decimal.Decimal `json:"budget_used"`
}

type CategoryBreakdown struct {
	CategoryID       int64           `json:"category_id"`
	CategoryName     string          `json:"category_name"`
	Amount           decimal.Decimal `json:"amount"`
	Percentage       decimal.Decimal `json:"percentage"`
	TransactionCount int             `json:"transaction_count"`
}

type FinancialHealth struct {
	Score           int             `json:"score"`            // 0-100
	SavingsRate     decimal.Decimal `json:"savings_rate"`     // percentage
	BudgetAdherence decimal.Decimal `json:"budget_adherence"` // percentage
	IncomeStability decimal.Decimal `json:"income_stability"` // percentage
	Recommendations []string        `json:"recommendations"`
}

func GetSpendingTrendsByBillingCycle(accountID int64, billingCycleDay int, months int) ([]SpendingTrend, error) {
	db := GetDb()
	var trends []SpendingTrend

	now := time.Now()
	currentCycleStart, currentCycleEnd := currentCycleBounds(billingCycleDay, now)

	// Budgets do not change per cycle iteration, so fetch them once
	budgets, _, budgetsErr := QueryBudgets(accountID, nil)

	for i := months - 1; i >= 0; i-- {
		cycleStart := currentCycleStart.AddDate(0, -i, 0)
		cycleEnd := currentCycleEnd.AddDate(0, -i, 0)

		var income decimal.Decimal
		err := db.NewSelect().
			Model((*types.Transaction)(nil)).
			ColumnExpr("COALESCE(SUM(amount), 0)").
			Where("account_id = ?", accountID).
			Where("type = ?", "income").
			Where("date >= ? AND date <= ?", cycleStart, cycleEnd).
			Where("deleted_date IS NULL").
			Scan(context.Background(), &income)
		if err != nil {
			return nil, err
		}

		var expenses decimal.Decimal
		err = db.NewSelect().
			Model((*types.Transaction)(nil)).
			ColumnExpr("COALESCE(SUM(amount), 0)").
			Where("account_id = ?", accountID).
			Where("type = ?", "expense").
			Where("date >= ? AND date <= ?", cycleStart, cycleEnd).
			Where("deleted_date IS NULL").
			Scan(context.Background(), &expenses)
		if err != nil {
			return nil, err
		}

		var budgetUsed decimal.Decimal
		if budgetsErr == nil {
			var totalBudget decimal.Decimal
			for _, budget := range budgets {
				if budget.StartDate.Before(cycleEnd) && (budget.EndDate == nil || budget.EndDate.After(cycleStart)) {
					totalBudget = totalBudget.Add(budget.Amount)
				}
			}

			if totalBudget.GreaterThan(decimal.Zero) {
				budgetUsed = expenses.Div(totalBudget).Mul(decimal.NewFromInt(100))
			}
		}

		savings := income.Sub(expenses)

		trends = append(trends, SpendingTrend{
			Month:      cycleStart.Format("2006-01"),
			Income:     income,
			Expenses:   expenses,
			Savings:    savings,
			BudgetUsed: budgetUsed,
		})
	}

	return trends, nil
}

// currentCycleBounds returns the start and end of the billing cycle that
// contains the current moment
func currentCycleBounds(billingCycleDay int, now time.Time) (time.Time, time.Time) {
	var start time.Time
	if now.Day() >= billingCycleDay {
		start = time.Date(now.Year(), now.Month(), billingCycleDay, 0, 0, 0, 0, now.Location())
	} else {
		start = time.Date(now.Year(), now.Month(), billingCycleDay, 0, 0, 0, 0, now.Location()).AddDate(0, -1, 0)
	}
	return start, start.AddDate(0, 1, 0).Add(-time.Nanosecond)
}

func GetCategoryBreakdown(accountID int64, period string, billingCycleDay int) ([]CategoryBreakdown, error) {
	var startDate, endDate time.Time
	now := time.Now()

	switch period {
	case "last_cycle":
		cycleStart, cycleEnd := currentCycleBounds(billingCycleDay, now)
		startDate = cycleStart.AddDate(0, -1, 0)
		endDate = cycleEnd.AddDate(0, -1, 0)
	case "current_month":
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		endDate = startDate.AddDate(0, 1, 0).Add(-time.Nanosecond)
	case "last_month":
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location()).AddDate(0, -1, 0)
		endDate = startDate.AddDate(0, 1, 0).Add(-time.Nanosecond)
	case "current_year":
		startDate = time.Date(now.Year(), 1, 1, 0, 0, 0, 0, now.Location())
		endDate = startDate.AddDate(1, 0, 0).Add(-time.Nanosecond)
	default: // "current_cycle" and anything unrecognised
		startDate, endDate = currentCycleBounds(billingCycleDay, now)
	}

	return GetCategoryBreakdownByDateRange(accountID, startDate, endDate)
}

func GetCategoryBreakdownByDateRange(accountID int64, startDate, endDate time.Time) ([]CategoryBreakdown, error) {
	db := GetDb()
	var breakdown []CategoryBreakdown

	// Get category spending
	type CategorySpending struct {
		CategoryID       int64           `bun:"category_id"`
		CategoryName     string          `bun:"category_name"`
		TotalAmount      decimal.Decimal `bun:"total_amount"`
		TransactionCount int             `bun:"transaction_count"`
	}

	// Include uncategorised spending so percentages reflect all expenses in
	// the period, and resolve category names in a single joined query
	var categorySpending []CategorySpending
	err := db.NewSelect().
		Model((*types.Transaction)(nil)).
		ColumnExpr("COALESCE(t.category_id, 0) as category_id").
		ColumnExpr("COALESCE(cat.name, 'Uncategorised') as category_name").
		ColumnExpr("COALESCE(SUM(t.amount), 0) as total_amount").
		ColumnExpr("COUNT(t.id) as transaction_count").
		Join("LEFT JOIN categories AS cat ON cat.id = t.category_id").
		Where("t.account_id = ?", accountID).
		Where("t.type = ?", "expense").
		Where("t.date >= ? AND t.date <= ?", startDate, endDate).
		Where("t.deleted_date IS NULL").
		GroupExpr("COALESCE(t.category_id, 0), COALESCE(cat.name, 'Uncategorised')").
		OrderExpr("total_amount DESC").
		Scan(context.Background(), &categorySpending)
	if err != nil {
		return nil, err
	}

	// Calculate total expenses for percentage calculation
	var totalExpenses decimal.Decimal
	for _, cs := range categorySpending {
		totalExpenses = totalExpenses.Add(cs.TotalAmount)
	}

	for _, cs := range categorySpending {
		percentage := decimal.Zero
		if totalExpenses.GreaterThan(decimal.Zero) {
			percentage = cs.TotalAmount.Div(totalExpenses).Mul(decimal.NewFromInt(100))
		}

		breakdown = append(breakdown, CategoryBreakdown{
			CategoryID:       cs.CategoryID,
			CategoryName:     cs.CategoryName,
			Amount:           cs.TotalAmount,
			Percentage:       percentage,
			TransactionCount: cs.TransactionCount,
		})
	}

	return breakdown, nil
}

func CalculateFinancialHealth(accountID int64, billingCycleDay int) (*FinancialHealth, error) {
	db := GetDb()
	health := &FinancialHealth{
		Recommendations: []string{},
	}

	now := time.Now()
	currentCycleStart, currentCycleEnd := currentCycleBounds(billingCycleDay, now)
	previousCycleStart := currentCycleStart.AddDate(0, -1, 0)
	previousCycleEnd := currentCycleEnd.AddDate(0, -1, 0)

	// Calculate savings rate (income - expenses) / income
	var currentIncome, currentExpenses decimal.Decimal
	err := db.NewSelect().
		Model((*types.Transaction)(nil)).
		ColumnExpr("COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income, COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses").
		Where("account_id = ?", accountID).
		Where("date >= ? AND date <= ?", currentCycleStart, currentCycleEnd).
		Where("deleted_date IS NULL").
		Scan(context.Background(), &currentIncome, &currentExpenses)
	if err != nil {
		return nil, err
	}

	if currentIncome.GreaterThan(decimal.Zero) {
		savings := currentIncome.Sub(currentExpenses)
		health.SavingsRate = savings.Div(currentIncome).Mul(decimal.NewFromInt(100))
	} else {
		health.SavingsRate = decimal.Zero
	}

	// Calculate budget adherence: the share of active budgets that are still
	// within their limit. Staying under budget scores 100; each overspent
	// budget lowers the score.
	budgets, _, err := QueryBudgets(accountID, nil)
	if err == nil {
		activeBudgets := 0
		withinBudget := 0
		for _, budget := range budgets {
			if budget.StartDate.Before(now) && (budget.EndDate == nil || budget.EndDate.After(now)) {
				activeBudgets++
				spent := decimal.Zero
				if budget.Spent != nil {
					spent = *budget.Spent
				}
				if spent.LessThanOrEqual(budget.Amount) {
					withinBudget++
				}
			}
		}

		if activeBudgets > 0 {
			health.BudgetAdherence = decimal.NewFromInt(int64(withinBudget)).
				Div(decimal.NewFromInt(int64(activeBudgets))).
				Mul(decimal.NewFromInt(100))
		}
	}

	// Calculate income stability (compare current cycle to previous cycle)
	var previousIncome decimal.Decimal
	err = db.NewSelect().
		Model((*types.Transaction)(nil)).
		ColumnExpr("COALESCE(SUM(amount), 0)").
		Where("account_id = ?", accountID).
		Where("type = ?", "income").
		Where("date >= ? AND date <= ?", previousCycleStart, previousCycleEnd).
		Where("deleted_date IS NULL").
		Scan(context.Background(), &previousIncome)
	if err != nil {
		return nil, err
	}

	if previousIncome.GreaterThan(decimal.Zero) {
		change := currentIncome.Sub(previousIncome).Div(previousIncome).Abs()
		health.IncomeStability = decimal.NewFromInt(100).Sub(change.Mul(decimal.NewFromInt(100)))
		if health.IncomeStability.LessThan(decimal.Zero) {
			health.IncomeStability = decimal.Zero
		}
	} else if currentIncome.GreaterThan(decimal.Zero) {
		health.IncomeStability = decimal.NewFromInt(50) // Neutral score for new income
	} else {
		health.IncomeStability = decimal.Zero
	}

	// Calculate overall score (weighted average). The savings component is
	// clamped to 0-100 so a negative savings rate cannot push the score
	// below zero, and 20%+ savings already counts as a full savings score.
	savingsComponent := health.SavingsRate.Mul(decimal.NewFromInt(5)) // 20% savings = 100
	if savingsComponent.LessThan(decimal.Zero) {
		savingsComponent = decimal.Zero
	}
	if savingsComponent.GreaterThan(decimal.NewFromInt(100)) {
		savingsComponent = decimal.NewFromInt(100)
	}

	savingsScore := savingsComponent.Mul(decimal.NewFromFloat(0.4))
	budgetScore := health.BudgetAdherence.Mul(decimal.NewFromFloat(0.4))
	stabilityScore := health.IncomeStability.Mul(decimal.NewFromFloat(0.2))

	totalScore := savingsScore.Add(budgetScore).Add(stabilityScore)
	health.Score = int(totalScore.IntPart())
	if health.Score < 0 {
		health.Score = 0
	}
	if health.Score > 100 {
		health.Score = 100
	}

	// Generate recommendations
	if health.SavingsRate.LessThan(decimal.Zero) {
		health.Recommendations = append(health.Recommendations, "You are spending more than you earn this cycle - review your expenses")
	} else if health.SavingsRate.LessThan(decimal.NewFromInt(10)) {
		health.Recommendations = append(health.Recommendations, "Consider increasing your savings rate to at least 10%")
	}
	if health.BudgetAdherence.LessThan(decimal.NewFromInt(80)) {
		health.Recommendations = append(health.Recommendations, "Review your budget categories to better align with actual spending")
	}
	if health.IncomeStability.LessThan(decimal.NewFromInt(70)) {
		health.Recommendations = append(health.Recommendations, "Focus on building consistent income streams")
	}
	if len(health.Recommendations) == 0 {
		health.Recommendations = append(health.Recommendations, "Great job! Your financial health is excellent")
	}

	return health, nil
}
