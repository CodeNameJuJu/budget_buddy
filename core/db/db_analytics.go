package db

import (
	"context"
	"time"

	appcontext "github.com/CodeNameJuJu/budget_buddy/core/context"
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

func GetSpendingTrends(accountID int64, months int) ([]SpendingTrend, error) {
	db := appcontext.GetDb()
	var trends []SpendingTrend

	// Calculate start date
	endDate := time.Now().Truncate(time.Hour * 24).Add(time.Hour * 24) // End of today
	startDate := endDate.AddDate(0, -months, 0)

	for i := 0; i < months; i++ {
		monthStart := startDate.AddDate(0, i, 0)
		monthEnd := monthStart.AddDate(0, 1, 0).Add(-time.Nanosecond)

		// Get income for the month
		var income decimal.Decimal
		err := db.NewSelect().
			Model((*types.Transaction)(nil)).
			ColumnExpr("COALESCE(SUM(amount), 0)").
			Where("account_id = ?", accountID).
			Where("type = ?", "income").
			Where("date >= ? AND date <= ?", monthStart, monthEnd).
			Where("deleted_date IS NULL").
			Scan(context.Background(), &income)
		if err != nil {
			return nil, err
		}

		// Get expenses for the month
		var expenses decimal.Decimal
		err = db.NewSelect().
			Model((*types.Transaction)(nil)).
			ColumnExpr("COALESCE(SUM(amount), 0)").
			Where("account_id = ?", accountID).
			Where("type = ?", "expense").
			Where("date >= ? AND date <= ?", monthStart, monthEnd).
			Where("deleted_date IS NULL").
			Scan(context.Background(), &expenses)
		if err != nil {
			return nil, err
		}

		// Get budget usage for the month
		var budgetUsed decimal.Decimal
		budgets, _, err := QueryBudgets(accountID, nil)
		if err == nil {
			var totalBudget decimal.Decimal
			for _, budget := range budgets {
				if budget.StartDate.Before(monthEnd) && (budget.EndDate == nil || budget.EndDate.After(monthStart)) {
					totalBudget = totalBudget.Add(budget.Amount)
				}
			}

			if totalBudget.GreaterThan(decimal.Zero) {
				budgetUsed = expenses.Div(totalBudget).Mul(decimal.NewFromInt(100))
			}
		}

		savings := income.Sub(expenses)

		trends = append(trends, SpendingTrend{
			Month:      monthStart.Format("2006-01"),
			Income:     income,
			Expenses:   expenses,
			Savings:    savings,
			BudgetUsed: budgetUsed,
		})
	}

	return trends, nil
}

func GetCategoryBreakdown(accountID int64, period string) ([]CategoryBreakdown, error) {
	db := appcontext.GetDb()
	var breakdown []CategoryBreakdown

	var startDate, endDate time.Time
	now := time.Now()

	switch period {
	case "current_month":
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		endDate = startDate.AddDate(0, 1, 0).Add(-time.Nanosecond)
	case "last_month":
		startDate = time.Date(now.Year(), now.Month()-1, 1, 0, 0, 0, 0, now.Location())
		endDate = startDate.AddDate(0, 1, 0).Add(-time.Nanosecond)
	case "current_year":
		startDate = time.Date(now.Year(), 1, 1, 0, 0, 0, 0, now.Location())
		endDate = time.Date(now.Year(), 12, 31, 23, 59, 59, 999999999, now.Location())
	default:
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		endDate = startDate.AddDate(0, 1, 0).Add(-time.Nanosecond)
	}

	// Get category spending
	type CategorySpending struct {
		CategoryID       int64           `bun:"category_id"`
		CategoryName     string          `bun:"category_name"`
		TotalAmount      decimal.Decimal `bun:"total_amount"`
		TransactionCount int             `bun:"transaction_count"`
	}

	var categorySpending []CategorySpending
	err := db.NewSelect().
		Model((*types.Transaction)(nil)).
		ColumnExpr("category_id, COALESCE(SUM(amount), 0) as total_amount, COUNT(id) as transaction_count").
		Where("account_id = ?", accountID).
		Where("type = ?", "expense").
		Where("date >= ? AND date <= ?", startDate, endDate).
		Where("deleted_date IS NULL").
		Where("category_id IS NOT NULL").
		Group("category_id").
		Order("total_amount DESC").
		Scan(context.Background(), &categorySpending)
	if err != nil {
		return nil, err
	}

	// Calculate total expenses for percentage calculation
	var totalExpenses decimal.Decimal
	for _, cs := range categorySpending {
		totalExpenses = totalExpenses.Add(cs.TotalAmount)
	}

	// Convert to breakdown format and get category names
	for _, cs := range categorySpending {
		// Get category name
		var category types.Category
		err := db.NewSelect().
			Model(&category).
			Where("id = ?", cs.CategoryID).
			Scan(context.Background())
		if err != nil {
			continue // Skip if category not found
		}

		percentage := decimal.Zero
		if totalExpenses.GreaterThan(decimal.Zero) {
			percentage = cs.TotalAmount.Div(totalExpenses).Mul(decimal.NewFromInt(100))
		}

		breakdown = append(breakdown, CategoryBreakdown{
			CategoryID:       cs.CategoryID,
			CategoryName:     category.Name,
			Amount:           cs.TotalAmount,
			Percentage:       percentage,
			TransactionCount: cs.TransactionCount,
		})
	}

	return breakdown, nil
}

func CalculateFinancialHealth(accountID int64) (*FinancialHealth, error) {
	db := appcontext.GetDb()
	health := &FinancialHealth{
		Recommendations: []string{},
	}

	// Get current and previous month data
	now := time.Now()
	currentMonthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	previousMonthStart := currentMonthStart.AddDate(0, -1, 0)

	// Calculate savings rate (income - expenses) / income
	var currentIncome, currentExpenses decimal.Decimal
	err := db.NewSelect().
		Model((*types.Transaction)(nil)).
		ColumnExpr("COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income, COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses").
		Where("account_id = ?", accountID).
		Where("date >= ?", currentMonthStart).
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

	// Calculate budget adherence
	budgets, _, err := QueryBudgets(accountID, nil)
	if err == nil && len(budgets) > 0 {
		var totalBudget, totalSpent decimal.Decimal
		for _, budget := range budgets {
			if budget.StartDate.Before(now) && (budget.EndDate == nil || budget.EndDate.After(now)) {
				totalBudget = totalBudget.Add(budget.Amount)
				if budget.Spent != nil {
					totalSpent = totalSpent.Add(*budget.Spent)
				}
			}
		}

		if totalBudget.GreaterThan(decimal.Zero) {
			health.BudgetAdherence = decimal.NewFromInt(100).Sub(totalSpent.Div(totalBudget).Mul(decimal.NewFromInt(100)))
			if health.BudgetAdherence.LessThan(decimal.Zero) {
				health.BudgetAdherence = decimal.Zero
			}
		}
	}

	// Calculate income stability (compare current month to previous month)
	var previousIncome decimal.Decimal
	err = db.NewSelect().
		Model((*types.Transaction)(nil)).
		ColumnExpr("COALESCE(SUM(amount), 0)").
		Where("account_id = ?", accountID).
		Where("type = ?", "income").
		Where("date >= ? AND date < ?", previousMonthStart, currentMonthStart).
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

	// Calculate overall score (weighted average)
	savingsScore := health.SavingsRate.Mul(decimal.NewFromFloat(0.4))
	budgetScore := health.BudgetAdherence.Mul(decimal.NewFromFloat(0.4))
	stabilityScore := health.IncomeStability.Mul(decimal.NewFromFloat(0.2))

	totalScore := savingsScore.Add(budgetScore).Add(stabilityScore)
	health.Score = int(totalScore.IntPart())

	// Generate recommendations
	if health.SavingsRate.LessThan(decimal.NewFromInt(10)) {
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
