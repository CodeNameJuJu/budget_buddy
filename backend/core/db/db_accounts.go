package db

import (
	"context"
	"time"

	appcontext "github.com/julian/budget-buddy/core/context"
	"github.com/julian/budget-buddy/utils/types"
)

func QueryAccounts(accountID *int64) ([]types.Account, int, error) {
	db := appcontext.GetDb()
	var accounts []types.Account

	query := db.NewSelect().Model(&accounts).
		Where("a.deleted_date IS NULL")

	if accountID != nil {
		query = query.Where("a.id = ?", *accountID)
	}

	count, err := query.ScanAndCount(context.Background())
	return accounts, count, err
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
