package couples

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"time"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/uptrace/bun"
)

const (
	InvitationExpiry = 7 * 24 * time.Hour // 7 days
)

type CouplesService struct{}

func NewCouplesService() *CouplesService {
	return &CouplesService{}
}

// CreatePartnership creates a new partnership
func (s *CouplesService) CreatePartnership(userID int, req *types.CreatePartnershipRequest) (*types.Partnership, error) {
	database := db.GetDb()
	if database == nil {
		return nil, fmt.Errorf("database not connected")
	}

	// Create partnership
	partnership := &types.Partnership{
		Name:            req.Name,
		Description:     req.Description,
		CreatedByUserID: userID,
		IsActive:        true,
	}

	err := database.NewInsert().Model(partnership).Returning("*").Scan(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to create partnership: %w", err)
	}

	// Add creator as owner member
	member := &types.PartnershipMember{
		PartnershipID: partnership.ID,
		UserID:        userID,
		Role:          "owner",
		JoinedAt:      time.Now(),
	}

	err = database.NewInsert().Model(member).Scan(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to add creator as member: %w", err)
	}

	// Load partnership with members
	err = database.NewSelect().
		Model(partnership).
		Relation("Members").
		Where("id = ?", partnership.ID).
		Scan(context.Background())

	if err != nil {
		return nil, fmt.Errorf("failed to load partnership details: %w", err)
	}

	return partnership, nil
}

// GetUserPartnerships gets all partnerships for a user
func (s *CouplesService) GetUserPartnerships(userID int) (*struct {
	Partnerships       []types.Partnership       `json:"partnerships"`
	PendingInvitations []types.PartnerInvitation `json:"pending_invitations"`
}, error) {
	database := db.GetDb()
	if database == nil {
		return nil, fmt.Errorf("database not connected")
	}

	// Get user email first for pending invitations query
	var user types.User
	err := database.NewSelect().
		Model(&user).
		Where("id = ?", userID).
		Scan(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Simplify partnership query - avoid complex relation loading
	var partnershipIDs []int
	err = database.NewSelect().
		Column("partnership_id").
		Model((*types.PartnershipMember)(nil)).
		Where("user_id = ?", userID).
		Scan(context.Background(), &partnershipIDs)

	if err != nil {
		return nil, fmt.Errorf("failed to get partnership IDs: %w", err)
	}

	var partnerships []types.Partnership
	if len(partnershipIDs) > 0 {
		err = database.NewSelect().
			Model(&partnerships).
			Where("id IN (?) AND is_active = ?", bun.In(partnershipIDs), true).
			Order("created_date DESC").
			Scan(context.Background())

		if err != nil {
			return nil, fmt.Errorf("failed to get user partnerships: %w", err)
		}
	}

	// Get pending invitations using user email
	var invitations []types.PartnerInvitation
	err = database.NewSelect().
		Model(&invitations).
		Where("invited_email = ? AND status = ?", user.Email, "pending").
		Order("created_date DESC").
		Scan(context.Background())

	if err != nil {
		return nil, fmt.Errorf("failed to get pending invitations: %w", err)
	}

	return &struct {
		Partnerships       []types.Partnership       `json:"partnerships"`
		PendingInvitations []types.PartnerInvitation `json:"pending_invitations"`
	}{
		Partnerships:       partnerships,
		PendingInvitations: invitations,
	}, nil
}

// InvitePartner invites a user to join a partnership
func (s *CouplesService) InvitePartner(partnershipID, inviterUserID int, req *types.InvitePartnerRequest) (*types.PartnerInvitation, error) {
	database := db.GetDb()
	if database == nil {
		return nil, fmt.Errorf("database not connected")
	}

	// Check if inviter has permission to invite
	if !s.hasPermission(partnershipID, inviterUserID, "can_invite_partners") {
		return nil, fmt.Errorf("user does not have permission to invite partners")
	}

	// Check if user is already a member
	var existingMember types.PartnershipMember
	err := database.NewSelect().
		Model(&existingMember).
		Join("JOIN users u ON u.id = partnership_members.user_id").
		Where("partnership_id = ? AND u.email = ?", partnershipID, req.Email).
		Scan(context.Background())

	if err == nil {
		return nil, fmt.Errorf("user with this email is already a member of the partnership")
	}

	// Generate invitation token
	token, err := s.generateSecureToken(32)
	if err != nil {
		return nil, fmt.Errorf("failed to generate invitation token: %w", err)
	}

	// Note: Permissions will be set when the invitation is accepted

	// Create invitation
	invitation := &types.PartnerInvitation{
		PartnershipID:   partnershipID,
		InvitedEmail:    req.Email,
		InvitedByUserID: inviterUserID,
		InvitationToken: token,
		Status:          "pending",
		Message:         req.Message,
		ExpiresAt:       time.Now().Add(InvitationExpiry),
	}

	err = database.NewInsert().Model(invitation).Returning("*").Scan(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to create invitation: %w", err)
	}

	// Load partnership details
	err = database.NewSelect().
		Model(invitation).
		Relation("Partnership").
		Relation("InvitedByUser").
		Where("id = ?", invitation.ID).
		Scan(context.Background())

	if err != nil {
		return nil, fmt.Errorf("failed to load invitation details: %w", err)
	}

	return invitation, nil
}

// RespondToInvitation responds to a partnership invitation
func (s *CouplesService) RespondToInvitation(userID int, token string, action string) error {
	database := db.GetDb()
	if database == nil {
		return fmt.Errorf("database not connected")
	}

	// Find and validate invitation
	var invitation types.PartnerInvitation
	err := database.NewSelect().
		Model(&invitation).
		Relation("Partnership").
		Where("invitation_token = ? AND status = ? AND expires_at > ?", token, "pending", time.Now()).
		Scan(context.Background())

	if err != nil {
		return fmt.Errorf("invalid or expired invitation: %w", err)
	}

	// Verify that the invitation is for this user
	if invitation.InvitedUserID != nil && *invitation.InvitedUserID != userID {
		return fmt.Errorf("invitation is not for this user")
	}

	// Check if user email matches invited email
	var user types.User
	err = database.NewSelect().
		Model(&user).
		Where("id = ?", userID).
		Scan(context.Background())

	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	if user.Email != invitation.InvitedEmail {
		return fmt.Errorf("invitation email does not match user email")
	}

	if action == "accept" {
		// Add user to partnership
		member := &types.PartnershipMember{
			PartnershipID: invitation.PartnershipID,
			UserID:        userID,
			Role:          "member", // Default role, can be changed later
			JoinedAt:      time.Now(),
		}

		err = database.NewInsert().Model(member).Scan(context.Background())
		if err != nil {
			return fmt.Errorf("failed to add user to partnership: %w", err)
		}

		// Update invitation
		now := time.Now()
		_, err = database.NewUpdate().
			Model(&invitation).
			Set("status = ?", "accepted").
			Set("accepted_at = ?", now).
			Set("invited_user_id = ?", userID).
			Where("id = ?", invitation.ID).
			Exec(context.Background())

		if err != nil {
			return fmt.Errorf("failed to update invitation: %w", err)
		}

	} else if action == "decline" {
		// Update invitation
		now := time.Now()
		_, err = database.NewUpdate().
			Model(&invitation).
			Set("status = ?", "declined").
			Set("declined_at = ?", now).
			Where("id = ?", invitation.ID).
			Exec(context.Background())

		if err != nil {
			return fmt.Errorf("failed to update invitation: %w", err)
		}
	} else {
		return fmt.Errorf("invalid action: %s", action)
	}

	return nil
}

// ShareAccount shares an account with partnership members
func (s *CouplesService) ShareAccount(partnershipID, userID, accountID int, permissions *types.PartnershipPermissions) error {
	database := db.GetDb()
	if database == nil {
		return fmt.Errorf("database not connected")
	}

	// Check if user has permission to share accounts
	if !s.hasPermission(partnershipID, userID, "can_edit_accounts") {
		return fmt.Errorf("user does not have permission to share accounts")
	}

	// Verify account belongs to user
	var account types.Account
	err := database.NewSelect().
		Model(&account).
		Where("id = ? AND user_id = ?", accountID, userID).
		Scan(context.Background())

	if err != nil {
		return fmt.Errorf("account not found or does not belong to user: %w", err)
	}

	// Check if account is already shared
	var existingShared types.SharedAccount
	err = database.NewSelect().
		Model(&existingShared).
		Where("partnership_id = ? AND account_id = ?", partnershipID, accountID).
		Scan(context.Background())

	if err == nil {
		return fmt.Errorf("account is already shared with this partnership")
	}

	// Serialize permissions
	var permStr string
	if permissions != nil {
		permBytes, _ := json.Marshal(permissions)
		permStr = string(permBytes)
	} else {
		defaultPerms := types.DefaultPermissionsForRole("member")
		permBytes, _ := json.Marshal(defaultPerms)
		permStr = string(permBytes)
	}

	// Create shared account
	sharedAccount := &types.SharedAccount{
		PartnershipID:  partnershipID,
		AccountID:      accountID,
		SharedByUserID: userID,
		Permissions:    &permStr,
		IsActive:       true,
	}

	err = database.NewInsert().Model(sharedAccount).Scan(context.Background())
	if err != nil {
		return fmt.Errorf("failed to share account: %w", err)
	}

	return nil
}

// GetPartnershipDetails gets detailed information about a partnership
func (s *CouplesService) GetPartnershipDetails(partnershipID, userID int) (*types.PartnershipSummary, error) {
	database := db.GetDb()
	if database == nil {
		return nil, fmt.Errorf("database not connected")
	}

	// Check if user is a member
	var member types.PartnershipMember
	err := database.NewSelect().
		Model(&member).
		Where("partnership_id = ? AND user_id = ?", partnershipID, userID).
		Scan(context.Background())

	if err != nil {
		return nil, fmt.Errorf("user is not a member of this partnership: %w", err)
	}

	// Get partnership details
	var partnership types.Partnership
	err = database.NewSelect().
		Model(&partnership).
		Relation("Members", func(q *bun.SelectQuery) *bun.SelectQuery {
			return q.Order("joined_at ASC")
		}).
		Relation("Members.User").
		Relation("SharedAccounts").
		Relation("SharedAccounts.Account").
		Where("id = ?", partnershipID).
		Scan(context.Background())

	if err != nil {
		return nil, fmt.Errorf("failed to get partnership details: %w", err)
	}

	// Convert to summary
	summary := &types.PartnershipSummary{
		ID:              partnership.ID,
		Name:            partnership.Name,
		Description:     partnership.Description,
		IsActive:        partnership.IsActive,
		CreatedAt:       partnership.CreatedAt,
		MemberCount:     len(partnership.Members),
		CurrentUserRole: member.Role,
		Members:         partnership.Members,
		SharedAccounts:  partnership.SharedAccounts,
	}

	return summary, nil
}

// RemoveMember removes a member from a partnership
func (s *CouplesService) RemoveMember(partnershipID, removerUserID, memberUserID int) error {
	database := db.GetDb()
	if database == nil {
		return fmt.Errorf("database not connected")
	}

	// Check if remover has permission
	if !s.hasPermission(partnershipID, removerUserID, "can_manage_partners") {
		return fmt.Errorf("user does not have permission to remove members")
	}

	// Cannot remove the owner
	var member types.PartnershipMember
	err := database.NewSelect().
		Model(&member).
		Where("partnership_id = ? AND user_id = ?", partnershipID, memberUserID).
		Scan(context.Background())

	if err != nil {
		return fmt.Errorf("member not found: %w", err)
	}

	if member.Role == "owner" {
		return fmt.Errorf("cannot remove partnership owner")
	}

	// Remove member
	_, err = database.NewDelete().
		Model((*types.PartnershipMember)(nil)).
		Where("partnership_id = ? AND user_id = ?", partnershipID, memberUserID).
		Exec(context.Background())

	if err != nil {
		return fmt.Errorf("failed to remove member: %w", err)
	}

	return nil
}

// UpdateMemberRole updates a member's role and permissions
func (s *CouplesService) UpdateMemberRole(partnershipID, updaterUserID, memberUserID int, req *types.UpdateMemberRoleRequest) error {
	database := db.GetDb()
	if database == nil {
		return fmt.Errorf("database not connected")
	}

	// Check if updater has permission
	if !s.hasPermission(partnershipID, updaterUserID, "can_manage_partners") {
		return fmt.Errorf("user does not have permission to manage members")
	}

	// Serialize permissions
	var permStr string
	if req.Permissions != nil {
		permBytes, _ := json.Marshal(req.Permissions)
		permStr = string(permBytes)
	} else {
		defaultPerms := types.DefaultPermissionsForRole(req.Role)
		permBytes, _ := json.Marshal(defaultPerms)
		permStr = string(permBytes)
	}

	// Update member
	_, err := database.NewUpdate().
		Model((*types.PartnershipMember)(nil)).
		Set("role = ?", req.Role).
		Set("permissions = ?", permStr).
		Where("partnership_id = ? AND user_id = ?", partnershipID, memberUserID).
		Exec(context.Background())

	if err != nil {
		return fmt.Errorf("failed to update member role: %w", err)
	}

	return nil
}

// Helper functions

func (s *CouplesService) generateSecureToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate secure token: %w", err)
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}

func (s *CouplesService) hasPermission(partnershipID, userID int, permission string) bool {
	database := db.GetDb()
	if database == nil {
		return false
	}

	var member types.PartnershipMember
	err := database.NewSelect().
		Model(&member).
		Where("partnership_id = ? AND user_id = ?", partnershipID, userID).
		Scan(context.Background())

	if err != nil {
		return false
	}

	// Owners have all permissions
	if member.Role == "owner" {
		return true
	}

	// Parse permissions JSON
	var permissions types.PartnershipPermissions
	if member.Permissions != nil && *member.Permissions != "" {
		if err := json.Unmarshal([]byte(*member.Permissions), &permissions); err != nil {
			return false
		}
	} else {
		permissions = types.DefaultPermissionsForRole(member.Role)
	}

	// Check specific permission
	switch permission {
	case "can_view_accounts":
		return permissions.CanViewAccounts
	case "can_edit_accounts":
		return permissions.CanEditAccounts
	case "can_view_transactions":
		return permissions.CanViewTransactions
	case "can_add_transactions":
		return permissions.CanAddTransactions
	case "can_edit_transactions":
		return permissions.CanEditTransactions
	case "can_delete_transactions":
		return permissions.CanDeleteTransactions
	case "can_view_budgets":
		return permissions.CanViewBudgets
	case "can_edit_budgets":
		return permissions.CanEditBudgets
	case "can_view_savings":
		return permissions.CanViewSavings
	case "can_edit_savings":
		return permissions.CanEditSavings
	case "can_view_analytics":
		return permissions.CanViewAnalytics
	case "can_invite_partners":
		return permissions.CanInvitePartners
	case "can_manage_partners":
		return permissions.CanManagePartners
	default:
		return false
	}
}
