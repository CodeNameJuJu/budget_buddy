package db

import (
	"context"
	"fmt"
	"time"

	appcontext "github.com/CodeNameJuJu/budget_buddy/core/context"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/shopspring/decimal"
)

type DashboardSummary struct {
	TotalIncome   decimal.Decimal           `json:"total_income"`
	TotalExpenses decimal.Decimal           `json:"total_expenses"`
	Balance       decimal.Decimal           `json:"balance"`
	RecentTrans   []types.Transaction       `json:"recent_transactions"`
	TopCategories []CategorySpendingSummary `json:"top_categories"`
}

type CategorySpendingSummary struct {
	CategoryID   int64           `json:"category_id"`
	CategoryName string          `json:"category_name"`
	Total        decimal.Decimal `json:"total"`
}

func GetDashboardSummary(accountID int64, from time.Time, to time.Time) (*DashboardSummary, error) {
	fmt.Printf("GetDashboardSummary - accountID: %d, from: %s, to: %s\n", accountID, from.Format("2006-01-02"), to.Format("2006-01-02"))
	db := appcontext.GetDb()

	// Total income
	var totalIncome decimal.Decimal
	err := db.NewSelect().
		Model((*types.Transaction)(nil)).
		ColumnExpr("COALESCE(SUM(amount), 0)").
		Where("account_id = ?", accountID).
		Where("type = ?", "income").
		Where("deleted_date IS NULL").
		Where("date >= ?", from).
		Where("date <= ?", to).
		Scan(context.Background(), &totalIncome)
	if err != nil {
		return nil, err
	}
	fmt.Printf("GetDashboardSummary - totalIncome: %s\n", totalIncome.String())

	// Total expenses
	var totalExpenses decimal.Decimal
	err = db.NewSelect().
		Model((*types.Transaction)(nil)).
		ColumnExpr("COALESCE(SUM(amount), 0)").
		Where("account_id = ?", accountID).
		Where("type = ?", "expense").
		Where("deleted_date IS NULL").
		Where("date >= ?", from).
		Where("date <= ?", to).
		Scan(context.Background(), &totalExpenses)
	if err != nil {
		return nil, err
	}
	fmt.Printf("GetDashboardSummary - totalExpenses: %s\n", totalExpenses.String())

	// Recent transactions - filter by date range
	var recentTrans []types.Transaction
	err = db.NewSelect().
		Model(&recentTrans).
		Where("account_id = ?", accountID).
		Where("deleted_date IS NULL").
		Where("date >= ?", from).
		Where("date <= ?", to).
		Order("date DESC").
		Limit(10).
		Scan(context.Background())
	if err != nil {
		return nil, err
	}

	// Top categories
	var topCategories []CategorySpendingSummary
	err = db.NewSelect().
		Model((*types.Transaction)(nil)).
		TableExpr("transactions t").
		Join("JOIN categories cat ON t.category_id = cat.id").
		ColumnExpr("t.category_id, cat.name as category_name, COALESCE(SUM(t.amount), 0) as total").
		Where("t.account_id = ?", accountID).
		Where("t.type = ?", "expense").
		Where("t.deleted_date IS NULL").
		Where("t.category_id IS NOT NULL").
		Where("t.date >= ?", from).
		Where("t.date <= ?", to).
		GroupExpr("t.category_id, cat.name").
		OrderExpr("total DESC").
		Limit(5).
		Scan(context.Background(), &topCategories)
	if err != nil {
		return nil, err
	}

	return &DashboardSummary{
		TotalIncome:   totalIncome,
		TotalExpenses: totalExpenses,
		Balance:       totalIncome.Sub(totalExpenses),
		RecentTrans:   recentTrans,
		TopCategories: topCategories,
	}, nil
}

func GetDashboardSummaryAllTime(accountID int64) (*DashboardSummary, error) {
	db := appcontext.GetDb()

	// Total income
	var totalIncome decimal.Decimal
	err := db.NewSelect().
		Model((*types.Transaction)(nil)).
		ColumnExpr("COALESCE(SUM(amount), 0)").
		Where("account_id = ?", accountID).
		Where("type = ?", "income").
		Where("deleted_date IS NULL").
		Scan(context.Background(), &totalIncome)
	if err != nil {
		return nil, err
	}

	// Total expenses
	var totalExpenses decimal.Decimal
	err = db.NewSelect().
		Model((*types.Transaction)(nil)).
		ColumnExpr("COALESCE(SUM(amount), 0)").
		Where("account_id = ?", accountID).
		Where("type = ?", "expense").
		Where("deleted_date IS NULL").
		Scan(context.Background(), &totalExpenses)
	if err != nil {
		return nil, err
	}

	// Recent transactions
	var recentTrans []types.Transaction
	err = db.NewSelect().
		Model(&recentTrans).
		Relation("Category").
		Where("t.account_id = ?", accountID).
		Where("t.deleted_date IS NULL").
		Order("t.date DESC").
		Limit(10).
		Scan(context.Background())
	if err != nil {
		return nil, err
	}

	// Top categories (all time)
	var topCategories []CategorySpendingSummary
	err = db.NewSelect().
		Model((*types.Transaction)(nil)).
		TableExpr("transactions t").
		Join("JOIN categories cat ON t.category_id = cat.id").
		ColumnExpr("t.category_id, cat.name as category_name, COALESCE(SUM(t.amount), 0) as total").
		Where("t.account_id = ?", accountID).
		Where("t.type = ?", "expense").
		Where("t.deleted_date IS NULL").
		Where("t.category_id IS NOT NULL").
		GroupExpr("t.category_id, cat.name").
		OrderExpr("total DESC").
		Limit(5).
		Scan(context.Background(), &topCategories)
	if err != nil {
		return nil, err
	}

	return &DashboardSummary{
		TotalIncome:   totalIncome,
		TotalExpenses: totalExpenses,
		Balance:       totalIncome.Sub(totalExpenses),
		RecentTrans:   recentTrans,
		TopCategories: topCategories,
	}, nil
}

// Dashboard Layout Functions
func GetDashboardLayout(userID int64) (*types.DashboardLayout, error) {
	db := appcontext.GetDb()
	var layout types.DashboardLayout

	err := db.NewSelect().Model(&layout).
		Where("user_id = ?", userID).
		Where("is_active = ?", true).
		Scan(context.Background())
	if err != nil {
		return nil, err
	}

	return &layout, nil
}

func CreateOrUpdateDashboardLayout(layout *types.DashboardLayout) error {
	db := appcontext.GetDb()
	if layout.Name == "" {
		layout.Name = "Main Dashboard"
	}

	now := time.Now()
	layout.ModifiedDate = &now

	// Try user-scoped deactivation first
	_, err := db.NewUpdate().
		Model((*types.DashboardLayout)(nil)).
		Set("is_active = ?", false).
		Set("modified_date = ?", now).
		Where("user_id = ?", layout.UserID).
		Where("is_active = ?", true).
		Exec(context.Background())

	// If user_id column doesn't exist yet, fall back to account_id
	if err != nil {
		_, err = db.NewUpdate().
			Model((*types.DashboardLayout)(nil)).
			Set("is_active = ?", false).
			Set("modified_date = ?", now).
			Where("account_id = ?", layout.AccountID).
			Where("is_active = ?", true).
			Exec(context.Background())
		if err != nil {
			return err
		}
	}

	err = db.NewInsert().
		Model(layout).
		Returning("*").
		Scan(context.Background())

	return err
}

func GetAvailableWidgets() []types.WidgetDefinition {
	return []types.WidgetDefinition{
		{
			Type:         types.WidgetBalance,
			Name:         "Account Balance",
			Description:  "Shows current account balance and recent changes",
			DefaultSize:  types.SizeSmall,
			Sizes:        []types.WidgetSize{types.SizeSmall, types.SizeMedium},
			MinSize:      types.SizeSmall,
			MaxSize:      types.SizeMedium,
			Configurable: false,
		},
		{
			Type:         types.WidgetRecentTransactions,
			Name:         "Recent Transactions",
			Description:  "Displays your most recent transactions",
			DefaultSize:  types.SizeMedium,
			Sizes:        []types.WidgetSize{types.SizeSmall, types.SizeMedium, types.SizeLarge},
			MinSize:      types.SizeSmall,
			MaxSize:      types.SizeLarge,
			Configurable: true, // Number of transactions to show
		},
		{
			Type:         types.WidgetBudgetProgress,
			Name:         "Budget Progress",
			Description:  "Shows progress towards your budget limits",
			DefaultSize:  types.SizeMedium,
			Sizes:        []types.WidgetSize{types.SizeSmall, types.SizeMedium, types.SizeLarge},
			MinSize:      types.SizeSmall,
			MaxSize:      types.SizeLarge,
			Configurable: true, // Which budgets to show
		},
		{
			Type:         types.WidgetGoalsOverview,
			Name:         "Savings Goals",
			Description:  "Overview of your savings goals and progress",
			DefaultSize:  types.SizeMedium,
			Sizes:        []types.WidgetSize{types.SizeSmall, types.SizeMedium, types.SizeLarge},
			MinSize:      types.SizeSmall,
			MaxSize:      types.SizeLarge,
			Configurable: false,
		},
		{
			Type:         types.WidgetSpendingTrends,
			Name:         "Spending Trends",
			Description:  "Chart showing spending trends over time",
			DefaultSize:  types.SizeLarge,
			Sizes:        []types.WidgetSize{types.SizeMedium, types.SizeLarge, types.SizeFull},
			MinSize:      types.SizeMedium,
			MaxSize:      types.SizeFull,
			Configurable: true, // Time period
		},
		{
			Type:         types.WidgetCategoryBreakdown,
			Name:         "Category Breakdown",
			Description:  "Pie chart of spending by category",
			DefaultSize:  types.SizeMedium,
			Sizes:        []types.WidgetSize{types.SizeSmall, types.SizeMedium, types.SizeLarge},
			MinSize:      types.SizeSmall,
			MaxSize:      types.SizeLarge,
			Configurable: false,
		},
		{
			Type:         types.WidgetFinancialHealth,
			Name:         "Financial Health",
			Description:  "Overall financial health score and indicators",
			DefaultSize:  types.SizeSmall,
			Sizes:        []types.WidgetSize{types.SizeSmall, types.SizeMedium},
			MinSize:      types.SizeSmall,
			MaxSize:      types.SizeMedium,
			Configurable: false,
		},
		{
			Type:         types.WidgetAlerts,
			Name:         "Recent Alerts",
			Description:  "Shows your most recent alerts and notifications",
			DefaultSize:  types.SizeSmall,
			Sizes:        []types.WidgetSize{types.SizeSmall, types.SizeMedium},
			MinSize:      types.SizeSmall,
			MaxSize:      types.SizeMedium,
			Configurable: true, // Number of alerts to show
		},
		{
			Type:         types.WidgetSavingsSummary,
			Name:         "Savings Summary",
			Description:  "Overview of your savings accounts and pots",
			DefaultSize:  types.SizeMedium,
			Sizes:        []types.WidgetSize{types.SizeSmall, types.SizeMedium, types.SizeLarge},
			MinSize:      types.SizeSmall,
			MaxSize:      types.SizeLarge,
			Configurable: false,
		},
	}
}

func GetDefaultDashboardLayout() string {
	// Create a default layout with common widgets
	// Convert to JSON (simplified for now - in production use proper JSON marshaling)
	// For now, return a simple JSON string representation
	return `[{"id":"balance-1","type":"balance","title":"Account Balance","size":"small","position":{"x":0,"y":0,"w":3,"h":2},"is_visible":true},{"id":"recent-transactions-1","type":"recent_transactions","title":"Recent Transactions","size":"medium","position":{"x":3,"y":0,"w":6,"h":4},"is_visible":true},{"id":"budget-progress-1","type":"budget_progress","title":"Budget Progress","size":"medium","position":{"x":9,"y":0,"w":3,"h":4},"is_visible":true},{"id":"spending-trends-1","type":"spending_trends","title":"Spending Trends","size":"large","position":{"x":0,"y":4,"w":6,"h":4},"is_visible":true},{"id":"goals-overview-1","type":"goals_overview","title":"Savings Goals","size":"medium","position":{"x":6,"y":4,"w":6,"h":4},"is_visible":true}]`
}
