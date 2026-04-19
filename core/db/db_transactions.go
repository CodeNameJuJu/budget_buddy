package db

import (
	"context"
	"time"

	appcontext "github.com/CodeNameJuJu/budget_buddy/core/context"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
)

type TransactionFilters struct {
	AccountID     int64
	TransactionID *int64
	CategoryID    *int64
	BudgetID      *int64
	Type          *string
	DateFrom      *time.Time
	DateTo        *time.Time
	Limit         int
	Offset        int
}

func QueryTransactions(filters TransactionFilters) ([]types.Transaction, int, error) {
	db := appcontext.GetDb()
	var transactions []types.Transaction

	query := db.NewSelect().Model(&transactions).
		Relation("Category").
		Relation("Budget").
		Where("t.account_id = ?", filters.AccountID).
		Where("t.deleted_date IS NULL").
		Order("t.date DESC")

	if filters.TransactionID != nil {
		query = query.Where("t.id = ?", *filters.TransactionID)
	}
	if filters.CategoryID != nil {
		query = query.Where("t.category_id = ?", *filters.CategoryID)
	}
	if filters.BudgetID != nil {
		query = query.Where("t.budget_id = ?", *filters.BudgetID)
	}
	if filters.Type != nil {
		query = query.Where("t.type = ?", *filters.Type)
	}
	if filters.DateFrom != nil {
		query = query.Where("t.date >= ?", *filters.DateFrom)
	}
	if filters.DateTo != nil {
		query = query.Where("t.date <= ?", *filters.DateTo)
	}

	if filters.Limit > 0 {
		query = query.Limit(filters.Limit)
	} else {
		query = query.Limit(50)
	}

	if filters.Offset > 0 {
		query = query.Offset(filters.Offset)
	}

	count, err := query.ScanAndCount(context.Background())
	return transactions, count, err
}

func InsertTransaction(transaction *types.Transaction) error {
	db := appcontext.GetDb()
	_, err := db.NewInsert().Model(transaction).
		Returning("*").
		Exec(context.Background())
	return err
}

func UpdateTransaction(transaction *types.Transaction) error {
	db := appcontext.GetDb()
	now := time.Now()
	transaction.ModifiedDate = &now

	_, err := db.NewUpdate().Model(transaction).
		WherePK().
		OmitZero().
		Returning("*").
		Exec(context.Background())
	return err
}

func SoftDeleteTransaction(id int64) error {
	db := appcontext.GetDb()
	now := time.Now()

	_, err := db.NewUpdate().
		Model((*types.Transaction)(nil)).
		Set("deleted_date = ?", now).
		Where("id = ?", id).
		Exec(context.Background())
	return err
}
