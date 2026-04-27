package db

import (
	"context"
	"fmt"
	"time"

	appcontext "github.com/CodeNameJuJu/budget_buddy/core/context"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
)

func QueryAccounts(accountID *int64) ([]types.Account, int, error) {
	db := appcontext.GetDb()
	var accounts []types.Account
	userID := appcontext.GetUserID(context.Background())

	// Use raw SQL to ensure dashboard_layout is included
	query := db.NewRaw(`
		SELECT a.id, a.name, a.email, a.currency, a.timezone, a.savings_balance, a.dashboard_layout, a.created_date, a.modified_date, a.deleted_date
		FROM accounts AS a
		WHERE a.deleted_date IS NULL
	`)

	// If user is authenticated, include their own accounts and shared accounts
	if userID != 0 {
		// Get user's own accounts
		query = query.NewRaw(`
			SELECT a.id, a.name, a.email, a.currency, a.timezone, a.savings_balance, a.dashboard_layout, a.created_date, a.modified_date, a.deleted_date
			FROM accounts AS a
			WHERE a.deleted_date IS NULL
			AND (a.email IN (SELECT email FROM users WHERE id = ?)
				OR a.id IN (SELECT account_id FROM shared_accounts WHERE partnership_id IN (SELECT partnership_id FROM partnership_members WHERE user_id = ?)))
		`, userID, userID)
	}

	if accountID != nil {
		query = query.NewRaw(`
			SELECT a.id, a.name, a.email, a.currency, a.timezone, a.savings_balance, a.dashboard_layout, a.created_date, a.modified_date, a.deleted_date
			FROM accounts AS a
			WHERE a.deleted_date IS NULL
			AND a.id = ?
		`, *accountID)
	}

	err := query.Scan(context.Background(), &accounts)

	// Get count
	count := len(accounts)

	// Debug: log the first account's dashboard_layout
	if len(accounts) > 0 && accounts[0].DashboardLayout != nil {
		fmt.Printf("DEBUG: dashboard_layout from DB: %s\n", *accounts[0].DashboardLayout)
	} else {
		fmt.Printf("DEBUG: dashboard_layout is nil or accounts empty, count: %d\n", count)
	}

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
