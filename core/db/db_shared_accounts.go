package db

import (
	"context"

	appcontext "github.com/CodeNameJuJu/budget_buddy/core/context"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
)

// GetSharedAccountsForUser returns all accounts shared with the user through partnerships
func GetSharedAccountsForUser(userID int64) ([]types.SharedAccount, error) {
	db := appcontext.GetDb()
	var sharedAccounts []types.SharedAccount

	query := db.NewSelect().Model(&sharedAccounts).
		Relation("Account").
		Relation("Partnership").
		Relation("SharedByUser").
		Join("JOIN partnership_members pm ON pm.partnership_id = shared_accounts.partnership_id").
		Where("pm.user_id = ?", userID).
		Where("shared_accounts.is_active = ?", true).
		Where("pm.user_id != shared_accounts.shared_by_user_id"). // Don't include accounts the user shared themselves
		Order("shared_accounts.created_at DESC")

	err := query.Scan(context.Background())
	return sharedAccounts, err
}

// GetUserAccessibleAccounts returns both user's own accounts and shared accounts
func GetUserAccessibleAccounts(userID int64) ([]types.Account, error) {
	db := appcontext.GetDb()
	
	// Get user's own accounts
	var ownAccounts []types.Account
	err := db.NewSelect().
		Model(&ownAccounts).
		Where("user_id = ?", userID).
		Where("deleted_date IS NULL").
		Order("name ASC").
		Scan(context.Background())
	if err != nil {
		return nil, err
	}

	// Get shared accounts through partnerships
	sharedAccounts, err := GetSharedAccountsForUser(userID)
	if err != nil {
		return nil, err
	}

	// Combine accounts (shared accounts are already loaded with Account relation)
	// We'll need to extract the Account objects from shared accounts
	for _, shared := range sharedAccounts {
		if shared.Account != nil {
			ownAccounts = append(ownAccounts, *shared.Account)
		}
	}

	return ownAccounts, nil
}

// ShareAccountWithPartnership shares an account with all members of a partnership
func ShareAccountWithPartnership(partnershipID int64, userID int64, accountID int64, permissions *types.PartnershipPermissions) error {
	db := appcontext.GetDb()

	// Check if user has permission to share this account
	// User must own the account or have sharing permissions
	var account types.Account
	err := db.NewSelect().
		Model(&account).
		Where("id = ? AND user_id = ?", accountID, userID).
		Scan(context.Background())
	if err != nil {
		return err // User doesn't own this account
	}

	// Check if user is member of the partnership
	var member types.PartnershipMember
	err = db.NewSelect().
		Model(&member).
		Where("partnership_id = ? AND user_id = ?", partnershipID, userID).
		Scan(context.Background())
	if err != nil {
		return err // User is not a member of this partnership
	}

	// Check if account is already shared with this partnership
	var existingShared types.SharedAccount
	err = db.NewSelect().
		Model(&existingShared).
		Where("partnership_id = ? AND account_id = ?", partnershipID, accountID).
		Scan(context.Background())
	if err == nil {
		// Account already shared, update permissions
		// Convert permissions to JSON string (simplified for now)
		permissionsJSON := `{"can_view_accounts": true, "can_view_transactions": true, "can_add_transactions": true}`
		
		_, err = db.NewUpdate().
			Model(&existingShared).
			Set("permissions", permissionsJSON).
			Set("is_active", true).
			Where("id = ?", existingShared.ID).
			Exec(context.Background())
		return err
	}

	// Create new shared account entry
	sharedAccount := &types.SharedAccount{
		PartnershipID:  partnershipID,
		AccountID:     accountID,
		SharedByUserID: userID,
		Permissions:   `{"can_view_accounts": true, "can_view_transactions": true, "can_add_transactions": true}`, // Default permissions
		IsActive:      true,
	}

	_, err = db.NewInsert().Model(sharedAccount).Exec(context.Background())
	return err
}

// CanUserAccessAccount checks if a user can access an account (either owns it or it's shared with them)
func CanUserAccessAccount(userID int64, accountID int64) (bool, error) {
	db := appcontext.GetDb()

	// Check if user owns the account
	var ownAccount types.Account
	err := db.NewSelect().
		Model(&ownAccount).
		Where("id = ? AND user_id = ?", accountID, userID).
		Where("deleted_date IS NULL").
		Scan(context.Background())
	if err == nil {
		return true, nil // User owns the account
	}

	// Check if account is shared with user through partnership
	var sharedAccount types.SharedAccount
	err = db.NewSelect().
		Model(&sharedAccount).
		Join("JOIN partnership_members pm ON pm.partnership_id = shared_accounts.partnership_id").
		Where("shared_accounts.account_id = ?", accountID).
		Where("pm.user_id = ?", userID).
		Where("shared_accounts.is_active = ?", true).
		Scan(context.Background())
	
	return err == nil, nil
}
