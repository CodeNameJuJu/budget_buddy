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

	query := db.NewSelect().Model(&accounts).
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

	_, err := db.NewUpdate().Model(account).
		WherePK().
		OmitZero().
		Returning("*").
		Exec(context.Background())
	return err
}

// DashboardLayout functions

func GetActiveDashboardLayout(accountID int64) (*types.DashboardLayout, error) {
	db := appcontext.GetDb()
	var layout types.DashboardLayout

	err := db.NewSelect().Model(&layout).
		Where("account_id = ? AND is_active = ?", accountID, true).
		Order("id DESC").
		Scan(context.Background())

	if err != nil {
		return nil, err
	}
	return &layout, nil
}

func SaveDashboardLayout(accountID int64, layoutJSON string) error {
	db := appcontext.GetDb()
	now := time.Now()

	// Deactivate existing layouts
	_, err := db.NewUpdate().
		Table("dashboard_layouts").
		Set("is_active = false").
		Where("account_id = ?", accountID).
		Exec(context.Background())

	if err != nil {
		return err
	}

	// Insert new layout
	layout := types.DashboardLayout{
		AccountID:    accountID,
		Name:         "Custom Layout",
		IsActive:     true,
		Layout:       layoutJSON,
		CreatedDate:  now,
		ModifiedDate: now,
	}

	_, err = db.NewInsert().Model(&layout).
		Exec(context.Background())

	return err
}
