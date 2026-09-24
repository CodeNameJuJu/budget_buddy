package db

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/CodeNameJuJu/budget_buddy/utils/types"
)

type RecurringTransactionFilters struct {
	AccountID   int64
	RecurringID *int64
	BudgetID    *int64
	ActiveOnly  bool
}

// QueryRecurringTransactions lists recurring templates and marks each one with
// whether it has already been triggered in its budget's current period.
func QueryRecurringTransactions(filters RecurringTransactionFilters) ([]types.RecurringTransaction, int, error) {
	db := GetDb()
	var items []types.RecurringTransaction

	query := db.NewSelect().Model(&items).
		Relation("Category").
		Relation("Budget").
		Where("rt.account_id = ?", filters.AccountID).
		Where("rt.deleted_date IS NULL").
		Order("rt.due_day ASC NULLS LAST", "rt.description ASC")

	if filters.RecurringID != nil {
		query = query.Where("rt.id = ?", *filters.RecurringID)
	}
	if filters.BudgetID != nil {
		query = query.Where("rt.budget_id = ?", *filters.BudgetID)
	}
	if filters.ActiveOnly {
		query = query.Where("rt.is_active = TRUE")
	}

	count, err := query.ScanAndCount(context.Background())
	if err != nil {
		return nil, 0, err
	}

	if len(items) == 0 {
		return items, count, nil
	}

	billingCycleDay, loc := GetAccountBillingSettings(filters.AccountID)

	// Period windows are per budget, so compute each once
	windows := map[int64][2]*time.Time{}
	for i := range items {
		budget := items[i].Budget
		if budget == nil {
			continue
		}
		window, ok := windows[budget.ID]
		if !ok {
			periodStart, periodEnd := getCurrentPeriodWindow(budget.StartDate, budget.Period, budget.EndDate, billingCycleDay, loc)
			window = [2]*time.Time{&periodStart, periodEnd}
			windows[budget.ID] = window
		}
		budget.PeriodStart = window[0]
		budget.PeriodEnd = window[1]

		triggered, err := findTriggeredTransaction(items[i].ID, *window[0], window[1])
		if err == nil && triggered != nil {
			items[i].TriggeredThisPeriod = true
			items[i].TriggeredTransaction = triggered
		}
	}

	return items, count, nil
}

func findTriggeredTransaction(recurringID int64, startDate time.Time, endDate *time.Time) (*types.Transaction, error) {
	db := GetDb()
	var transaction types.Transaction

	query := db.NewSelect().Model(&transaction).
		Where("t.recurring_transaction_id = ?", recurringID).
		Where("t.deleted_date IS NULL").
		Where("t.date >= ?", startDate).
		Order("t.date DESC").
		Limit(1)
	if endDate != nil {
		query = query.Where("t.date < ?", *endDate)
	}

	err := query.Scan(context.Background())
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &transaction, nil
}

// countRecurringForBudget returns the number of active recurring templates on a
// budget and how many of them have not yet been triggered in the given period.
func countRecurringForBudget(budgetID int64, startDate time.Time, endDate *time.Time) (int, int, error) {
	db := GetDb()

	total, err := db.NewSelect().
		Model((*types.RecurringTransaction)(nil)).
		Where("rt.budget_id = ?", budgetID).
		Where("rt.is_active = TRUE").
		Where("rt.deleted_date IS NULL").
		Count(context.Background())
	if err != nil {
		return 0, 0, err
	}
	if total == 0 {
		return 0, 0, nil
	}

	triggeredQuery := db.NewSelect().
		Model((*types.Transaction)(nil)).
		ColumnExpr("t.recurring_transaction_id").
		Where("t.recurring_transaction_id = rt.id").
		Where("t.deleted_date IS NULL").
		Where("t.date >= ?", startDate)
	if endDate != nil {
		triggeredQuery = triggeredQuery.Where("t.date < ?", *endDate)
	}

	due, err := db.NewSelect().
		Model((*types.RecurringTransaction)(nil)).
		Where("rt.budget_id = ?", budgetID).
		Where("rt.is_active = TRUE").
		Where("rt.deleted_date IS NULL").
		Where("NOT EXISTS (?)", triggeredQuery).
		Count(context.Background())
	if err != nil {
		return total, 0, err
	}

	return total, due, nil
}

func InsertRecurringTransaction(item *types.RecurringTransaction) error {
	db := GetDb()
	_, err := db.NewInsert().Model(item).
		Returning("*").
		Exec(context.Background())
	return err
}

func UpdateRecurringTransaction(item *types.RecurringTransaction) error {
	db := GetDb()
	now := time.Now()
	item.ModifiedDate = &now

	_, err := db.NewUpdate().Model(item).
		Column("budget_id", "category_id", "amount", "type", "description", "notes", "due_day", "is_active", "modified_date").
		WherePK().
		Where("rt.account_id = ?", item.AccountID).
		Returning("*").
		Exec(context.Background())
	return err
}

func SoftDeleteRecurringTransactionForAccount(id int64, accountID int64) error {
	db := GetDb()
	now := time.Now()

	_, err := db.NewUpdate().
		Model((*types.RecurringTransaction)(nil)).
		Set("deleted_date = ?", now).
		Where("id = ?", id).
		Where("account_id = ?", accountID).
		Where("deleted_date IS NULL").
		Exec(context.Background())
	return err
}
