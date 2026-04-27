package db

import (
	"context"
	"time"

	appcontext "github.com/CodeNameJuJu/budget_buddy/core/context"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
)

func QueryAccounts(accountID *int64) ([]types.Account, int, error) {
	db := appcontext.GetDb()
	var accounts []types.Account
	userID := appcontext.GetUserID(context.Background())

	// Use raw SQL to ensure dashboard_layout is included
	query := db.NewSelect().
		ColumnExpr("a.*").
		TableExpr("accounts AS a").
		Where("a.deleted_date IS NULL")

	// If user is authenticated, include their own accounts and shared accounts
	if userID != 0 {
		// Get user's own accounts
		query = query.Where("a.email IN (SELECT email FROM users WHERE id = ?)", userID)

		// Also include shared accounts from partnerships
		query = query.WhereOr("a.id IN (SELECT account_id FROM shared_accounts WHERE partnership_id IN (SELECT partnership_id FROM partnership_members WHERE user_id = ?))", userID)
	} else {
		query = query.Where("a.email IN (SELECT email FROM users WHERE id = ?)", userID)
	}

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

	// Build the update query dynamically based on which fields are set
	update := db.NewUpdate().
		Table("accounts").
		Where("id = ?", account.ID).
		Set("name = ?", account.Name).
		Set("email = ?", account.Email).
		Set("currency = ?", account.Currency).
		Set("modified_date = ?", account.ModifiedDate)

	if account.Timezone != nil {
		update = update.Set("timezone = ?", account.Timezone)
	}
	if account.SavingsBalance != nil {
		update = update.Set("savings_balance = ?", account.SavingsBalance)
	}
	if account.DashboardLayout != nil {
		update = update.Set("dashboard_layout = ?", account.DashboardLayout)
	}

	result, err := update.Returning("*").Exec(context.Background())

	if err != nil {
		return err
	}

	// Scan the result back into the account struct
	return db.NewSelect().Model(account).
		Where("id = ?", account.ID).
		Column("a.*").
		Scan(context.Background())
}
