package db

import (
	"context"
	"time"

	appcontext "github.com/julian/budget-buddy/core/context"
	"github.com/julian/budget-buddy/utils/types"
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
		spent, calcErr := calculateBudgetSpent(budgets[i].ID, budgets[i].AccountID, budgets[i].StartDate, budgets[i].EndDate)
		if calcErr != nil {
			continue
		}
		remaining := budgets[i].Amount.Sub(spent)
		budgets[i].Spent = &spent
		budgets[i].Remaining = &remaining
	}

	return budgets, count, nil
}

func calculateBudgetSpent(budgetID int64, accountID int64, startDate time.Time, endDate *time.Time) (decimal.Decimal, error) {
	db := appcontext.GetDb()
	var spent decimal.Decimal

	// First get the budget to find its category
	var budget types.Budget
	err := db.NewSelect().Model(&budget).
		Where("id = ?", budgetID).
		Where("account_id = ?", accountID).
		Scan(context.Background())
	if err != nil {
		return decimal.Zero, err
	}

	query := db.NewSelect().
		Model((*types.Transaction)(nil)).
		ColumnExpr("COALESCE(SUM(amount), 0)").
		Where("category_id = ?", budget.CategoryID).
		Where("account_id = ?", accountID).
		Where("type = ?", "expense").
		Where("deleted_date IS NULL").
		Where("date >= ?", startDate)

	if endDate != nil {
		query = query.Where("date <= ?", *endDate)
	}

	err = query.Scan(context.Background(), &spent)
	return spent, err
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
