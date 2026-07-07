package account_merge

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"strings"
	"time"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
)

const (
	MergeTokenExpiry = 7 * 24 * time.Hour // 7 days
)

type AccountMergeService struct{}

func NewAccountMergeService() *AccountMergeService {
	return &AccountMergeService{}
}

// CreateMergeToken creates a token for merging accounts
func (s *AccountMergeService) CreateMergeToken(userID int, partnerEmail string) (*types.AccountMergeToken, error) {
	database := db.GetDb()
	if database == nil {
		return nil, fmt.Errorf("database not connected")
	}

	// Get current user's email and account
	var user types.User
	err := database.NewSelect().
		Model(&user).
		Where("id = ?", userID).
		Scan(context.Background())
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Check if partner user exists
	var partnerUser types.User
	err = database.NewSelect().
		Model(&partnerUser).
		Where("email = ?", partnerEmail).
		Scan(context.Background())
	if err != nil {
		return nil, fmt.Errorf("partner user not found: %w", err)
	}

	userAccountID, err := db.GetAccountIDForUser(int64(userID))
	if err != nil {
		return nil, fmt.Errorf("user account not found: %w", err)
	}

	partnerAccountID, err := db.GetAccountIDForUser(int64(partnerUser.ID))
	if err != nil {
		return nil, fmt.Errorf("partner account not found: %w", err)
	}

	if userAccountID == partnerAccountID {
		return nil, fmt.Errorf("users already share the same account")
	}

	// Generate token
	token, err := s.generateSecureToken(32)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Create merge token
	mergeToken := &types.AccountMergeToken{
		FromUserID: userID,
		FromEmail:  user.Email,
		ToUserID:   partnerUser.ID,
		ToEmail:    partnerEmail,
		Token:      token,
		Status:     "pending",
		ExpiresAt:  time.Now().Add(MergeTokenExpiry),
	}

	err = database.NewInsert().Model(mergeToken).Returning("*").Scan(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to create merge token: %w", err)
	}

	return mergeToken, nil
}

// AcceptMerge accepts a merge request and merges the accounts
func (s *AccountMergeService) AcceptMerge(userID int, token string) error {
	database := db.GetDb()
	if database == nil {
		return fmt.Errorf("database not connected")
	}

	// Find and validate merge token
	var mergeToken types.AccountMergeToken
	err := database.NewSelect().
		Model(&mergeToken).
		Where("token = ? AND status = ? AND expires_at > ?", token, "pending", time.Now()).
		Scan(context.Background())

	if err != nil {
		return fmt.Errorf("invalid or expired merge token: %w", err)
	}

	// Verify that the token is for this user
	if mergeToken.ToUserID != userID {
		return fmt.Errorf("merge token is not for this user")
	}

	// Verify email matches
	var user types.User
	err = database.NewSelect().
		Model(&user).
		Where("id = ?", userID).
		Scan(context.Background())
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	if strings.ToLower(strings.TrimSpace(user.Email)) != strings.ToLower(strings.TrimSpace(mergeToken.ToEmail)) {
		return fmt.Errorf("email does not match merge token")
	}

	fromAccountID, err := db.GetAccountIDForUser(int64(mergeToken.FromUserID))
	if err != nil {
		return fmt.Errorf("from account not found: %w", err)
	}

	toAccountID, err := db.GetAccountIDForUser(int64(userID))
	if err != nil {
		return fmt.Errorf("to account not found: %w", err)
	}

	if fromAccountID == toAccountID {
		err = s.addUserToAccountMembers(fromAccountID, int64(userID))
		if err != nil {
			return fmt.Errorf("failed to add recipient to account members: %w", err)
		}

		now := time.Now()
		_, err = database.NewUpdate().
			Model(&mergeToken).
			Set("status = ?", "accepted").
			Set("accepted_at = ?", now).
			Where("id = ?", mergeToken.ID).
			Exec(context.Background())
		if err != nil {
			return fmt.Errorf("failed to update merge token: %w", err)
		}

		return nil
	}

	// Merge accounts: update all data from toAccount to fromAccount
	// Update transactions
	_, err = database.NewUpdate().
		Model((*types.Transaction)(nil)).
		Set("account_id = ?", fromAccountID).
		Where("account_id = ?", toAccountID).
		Exec(context.Background())
	if err != nil {
		return fmt.Errorf("failed to merge transactions: %w", err)
	}

	// Update budgets
	_, err = database.NewUpdate().
		Model((*types.Budget)(nil)).
		Set("account_id = ?", fromAccountID).
		Where("account_id = ?", toAccountID).
		Exec(context.Background())
	if err != nil {
		return fmt.Errorf("failed to merge budgets: %w", err)
	}

	// Update categories
	_, err = database.NewUpdate().
		Model((*types.Category)(nil)).
		Set("account_id = ?", fromAccountID).
		Where("account_id = ?", toAccountID).
		Exec(context.Background())
	if err != nil {
		return fmt.Errorf("failed to merge categories: %w", err)
	}

	// Update savings goals
	_, err = database.NewUpdate().
		Model((*types.SavingsGoal)(nil)).
		Set("account_id = ?", fromAccountID).
		Where("account_id = ?", toAccountID).
		Exec(context.Background())
	if err != nil {
		return fmt.Errorf("failed to merge savings goals: %w", err)
	}

	// Update goal contributions
	_, err = database.NewUpdate().
		Model((*types.GoalContribution)(nil)).
		Set("account_id = ?", fromAccountID).
		Where("account_id = ?", toAccountID).
		Exec(context.Background())
	if err != nil {
		return fmt.Errorf("failed to merge goal contributions: %w", err)
	}

	// Update savings pots
	_, err = database.NewUpdate().
		Model((*types.SavingsPot)(nil)).
		Set("account_id = ?", fromAccountID).
		Where("account_id = ?", toAccountID).
		Exec(context.Background())
	if err != nil {
		return fmt.Errorf("failed to merge savings pots: %w", err)
	}

	// Update savings allocations
	_, err = database.NewUpdate().
		Model((*types.SavingsAllocation)(nil)).
		Set("account_id = ?", fromAccountID).
		Where("account_id = ?", toAccountID).
		Exec(context.Background())
	if err != nil {
		return fmt.Errorf("failed to merge savings allocations: %w", err)
	}

	// Update credit pots
	_, err = database.NewUpdate().
		Model((*types.CreditPot)(nil)).
		Set("account_id = ?", fromAccountID).
		Where("account_id = ?", toAccountID).
		Exec(context.Background())
	if err != nil {
		return fmt.Errorf("failed to merge credit pots: %w", err)
	}

	// Update credit payments
	_, err = database.NewUpdate().
		Model((*types.CreditPayment)(nil)).
		Set("account_id = ?", fromAccountID).
		Where("account_id = ?", toAccountID).
		Exec(context.Background())
	if err != nil {
		return fmt.Errorf("failed to merge credit payments: %w", err)
	}

	// Update alerts
	_, err = database.NewUpdate().
		Model((*types.Alert)(nil)).
		Set("account_id = ?", fromAccountID).
		Where("account_id = ?", toAccountID).
		Exec(context.Background())
	if err != nil {
		return fmt.Errorf("failed to merge alerts: %w", err)
	}

	// Update dashboard layouts
	_, err = database.NewUpdate().
		Model((*types.DashboardLayout)(nil)).
		Set("account_id = ?", fromAccountID).
		Where("account_id = ?", toAccountID).
		Exec(context.Background())
	if err != nil {
		return fmt.Errorf("failed to merge dashboard layouts: %w", err)
	}

	// Update alert preferences
	_, err = database.NewUpdate().
		Model((*types.AlertPreference)(nil)).
		Set("account_id = ?", fromAccountID).
		Where("account_id = ?", toAccountID).
		Exec(context.Background())
	if err != nil {
		return fmt.Errorf("failed to merge alert preferences: %w", err)
	}

	err = s.addUserToAccountMembers(fromAccountID, int64(userID))
	if err != nil {
		return fmt.Errorf("failed to update account members: %w", err)
	}

	// Map recipient user to source account owner for shared-account resolution
	_, err = database.NewUpdate().
		Model((*types.Account)(nil)).
		Set("user_id = ?", mergeToken.FromUserID).
		Set("deleted_date = ?", time.Now()).
		Set("modified_date = ?", time.Now()).
		Where("id = ?", toAccountID).
		Exec(context.Background())
	if err != nil {
		return fmt.Errorf("failed to remap recipient account: %w", err)
	}

	// Keep recipient user active and linked through accepted merge token
	_, err = database.NewUpdate().
		Model((*types.User)(nil)).
		Set("updated_at = ?", time.Now()).
		Where("id = ?", userID).
		Exec(context.Background())
	if err != nil {
		return fmt.Errorf("failed to update recipient user: %w", err)
	}

	// Update merge token status
	now := time.Now()
	_, err = database.NewUpdate().
		Model(&mergeToken).
		Set("status = ?", "accepted").
		Set("accepted_at = ?", now).
		Where("id = ?", mergeToken.ID).
		Exec(context.Background())
	if err != nil {
		return fmt.Errorf("failed to update merge token: %w", err)
	}

	return nil
}

// GetPendingMergeTokens gets pending merge tokens for a user
func (s *AccountMergeService) GetPendingMergeTokens(userID int) ([]types.AccountMergeToken, error) {
	database := db.GetDb()
	if database == nil {
		return nil, fmt.Errorf("database not connected")
	}

	// Get user email
	var user types.User
	err := database.NewSelect().
		Model(&user).
		Where("id = ?", userID).
		Scan(context.Background())
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Get pending tokens where user is the recipient
	var tokens []types.AccountMergeToken
	err = database.NewSelect().
		Model(&tokens).
		Where("to_email = ? AND status = ? AND expires_at > ?", user.Email, "pending", time.Now()).
		Order("created_date DESC").
		Scan(context.Background())

	if err != nil {
		return nil, fmt.Errorf("failed to get pending merge tokens: %w", err)
	}

	return tokens, nil
}

// Helper function to generate secure token
func (s *AccountMergeService) generateSecureToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate secure token: %w", err)
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}

func (s *AccountMergeService) addUserToAccountMembers(accountID int64, userID int64) error {
	database := db.GetDb()
	if database == nil {
		return fmt.Errorf("database not connected")
	}

	_, err := database.NewRaw(`
		UPDATE accounts
		SET user_ids = (
			SELECT ARRAY(
				SELECT DISTINCT member_id
				FROM unnest(COALESCE(user_ids, ARRAY[]::BIGINT[]) || ARRAY[?]::BIGINT[]) AS member_id
			)
		),
		modified_date = ?
		WHERE id = ?
	`, userID, time.Now(), accountID).Exec(context.Background())
	if err != nil {
		return err
	}

	return nil
}
