package db

import (
	"context"
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

	// Top spending categories
	var topCategories []CategorySpendingSummary
	err = db.NewSelect().
		Model((*types.Transaction)(nil)).
		ColumnExpr("t.category_id AS category_id").
		ColumnExpr("cat.name AS category_name").
		ColumnExpr("SUM(t.amount) AS total").
		Join("LEFT JOIN categories AS cat ON cat.id = t.category_id").
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

// Dashboard Layout Functions
func GetDashboardLayout(accountID int64) (*types.DashboardLayout, error) {
	db := appcontext.GetDb()
	var layout types.DashboardLayout

	err := db.NewSelect().Model(&layout).
		Where("account_id = ?", accountID).
		Where("is_active = ?", true).
		Scan(context.Background())
	if err != nil {
		return nil, err
	}

	return &layout, nil
}

func CreateOrUpdateDashboardLayout(layout *types.DashboardLayout) error {
	db := appcontext.GetDb()
	now := time.Now()

	// Use raw SQL to avoid issues with Bun ORM
	query := `
		INSERT INTO dashboard_layouts (account_id, name, is_active, layout, created_date, modified_date)
		VALUES (?, ?, ?, ?, ?, ?)
		ON CONFLICT (account_id, is_active) WHERE is_active = TRUE
		DO UPDATE SET 
			name = EXCLUDED.name,
			layout = EXCLUDED.layout,
			modified_date = EXCLUDED.modified_date
		RETURNING id, created_date, modified_date
	`

	err := db.NewRaw(query, layout.AccountID, layout.Name, layout.IsActive, layout.Layout, now, now).
		Scan(context.Background(), &layout.ID, &layout.CreatedDate, &layout.ModifiedDate)

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
