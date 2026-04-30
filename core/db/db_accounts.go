package db

import (
	"context"
	"database/sql"
	"errors"
	"time"

	appcontext "github.com/CodeNameJuJu/budget_buddy/core/context"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
)

func QueryAccounts(accountID *int64, userID *int64) ([]types.Account, int, error) {
	db := appcontext.GetDb()
	var accounts []types.Account

	query := db.NewSelect().Model(&accounts).
		Where("a.deleted_date IS NULL").
		Order("a.name ASC")

	if accountID != nil {
		query = query.Where("a.id = ?", *accountID)
	}

	if userID != nil {
		query = query.Where("a.user_id = ?", *userID)
	}

	count, err := query.ScanAndCount(context.Background())
	if err != nil {
		return nil, 0, err
	}

	return accounts, count, nil
}

func InsertAccount(account *types.Account) error {
	db := appcontext.GetDb()
	_, err := db.NewInsert().Model(account).
		Returning("*").
		Exec(context.Background())
	return err
}

func GetAccountIDForUser(userID int64) (int64, error) {
	db := appcontext.GetDb()
	ctx := context.Background()

	var account types.Account
	err := db.NewSelect().
		Model(&account).
		Column("id").
		Where("user_id = ?", userID).
		Where("deleted_date IS NULL").
		Order("id ASC").
		Limit(1).
		Scan(ctx)
	if err == nil {
		return account.ID, nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return 0, err
	}

	var mergeToken types.AccountMergeToken
	err = db.NewSelect().
		Model(&mergeToken).
		Column("from_user_id").
		Where("to_user_id = ?", userID).
		Where("status = ?", "accepted").
		OrderExpr("COALESCE(accepted_at, created_date) DESC").
		Limit(1).
		Scan(ctx)
	if err != nil {
		return 0, err
	}

	err = db.NewSelect().
		Model(&account).
		Column("id").
		Where("user_id = ?", mergeToken.FromUserID).
		Where("deleted_date IS NULL").
		Order("id ASC").
		Limit(1).
		Scan(ctx)
	if err != nil {
		return 0, err
	}

	return account.ID, nil
}

func UpdateAccount(account *types.Account) error {
	db := appcontext.GetDb()
	now := time.Now()
	account.ModifiedDate = &now

	_, err := db.NewUpdate().Model(account).
		WherePK().
		OmitZero().
		Returning("*").
		Exec(context.Background())
	return err
}
