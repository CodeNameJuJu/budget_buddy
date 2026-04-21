package db

import (
	"context"
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
