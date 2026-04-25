package types

import "time"

// Partnership represents a couples/partners relationship.
// Bun column tags must match the actual columns created by
// backend/migrations/005_create_partnership_schema.sql, which uses the
// created_date/modified_date/deleted_date naming used elsewhere in the
// project (not created_at/updated_at).
type Partnership struct {
	ID              int        `json:"id" bun:"id,pk,autoincrement"`
	Name            string     `json:"name" bun:"name"`
	Description     *string    `json:"description,omitempty" bun:"description"`
	CreatedByUserID int        `json:"created_by_user_id" bun:"created_by_user_id"`
	IsActive        bool       `json:"is_active" bun:"is_active"`
	CreatedAt       time.Time  `json:"created_at" bun:"created_date"`
	UpdatedAt       *time.Time `json:"updated_at,omitempty" bun:"modified_date"`
	DeletedAt       *time.Time `json:"deleted_at,omitempty" bun:"deleted_date,soft_delete"`

	// Relations
	SharedAccounts []SharedAccount `json:"shared_accounts,omitempty" bun:"rel:has-many,join:on=partnership_id"`
}

// PartnershipMember represents a user in a partnership.
// Permissions is nullable in the database so the Go field must be a pointer
// to avoid bun scan failures when the column is NULL.
type PartnershipMember struct {
	ID              int       `json:"id" bun:"id,pk,autoincrement"`
	PartnershipID   int       `json:"partnership_id" bun:"partnership_id"`
	UserID          int       `json:"user_id" bun:"user_id"`
	Role            string    `json:"role" bun:"role"`                         // 'owner', 'admin', 'member'
	Permissions     *string   `json:"permissions,omitempty" bun:"permissions"` // JSON string
	JoinedAt        time.Time `json:"joined_at" bun:"joined_at"`
	InvitedByUserID *int      `json:"invited_by_user_id,omitempty" bun:"invited_by_user_id"`

	// Relations
	Partnership *Partnership `json:"partnership,omitempty" bun:"rel:has-one,join:on=partnership_id"`
}

// PartnerInvitation represents an invitation to join a partnership
type PartnerInvitation struct {
	ID              int        `json:"id" bun:"id,pk,autoincrement"`
	PartnershipID   int        `json:"partnership_id" bun:"partnership_id"`
	InvitedEmail    string     `json:"invited_email" bun:"invited_email"`
	InvitedUserID   *int       `json:"invited_user_id,omitempty" bun:"invited_user_id"`
	InvitedByUserID int        `json:"invited_by_user_id" bun:"invited_by_user_id"`
	InvitationToken string     `json:"invitation_token" bun:"invitation_token"`
	Status          string     `json:"status" bun:"status"` // 'pending', 'accepted', 'declined', 'expired'
	Message         *string    `json:"message,omitempty" bun:"message"`
	ExpiresAt       time.Time  `json:"expires_at" bun:"expires_at"`
	AcceptedAt      *time.Time `json:"accepted_at,omitempty" bun:"accepted_at"`
	DeclinedAt      *time.Time `json:"declined_at,omitempty" bun:"declined_at"`
	CreatedAt       time.Time  `json:"created_at" bun:"created_date"`

	// Relations
	Partnership *Partnership `json:"partnership,omitempty" bun:"rel:has-one,join:on=partnership_id"`
}

// SharedAccount represents an account shared between partners
type SharedAccount struct {
	ID             int       `json:"id" bun:"id,pk,autoincrement"`
	PartnershipID  int       `json:"partnership_id" bun:"partnership_id"`
	AccountID      int       `json:"account_id" bun:"account_id"`
	SharedByUserID int       `json:"shared_by_user_id" bun:"shared_by_user_id"`
	Permissions    *string   `json:"permissions,omitempty" bun:"permissions"` // JSON string
	IsActive       bool      `json:"is_active" bun:"is_active"`
	CreatedAt      time.Time `json:"created_at" bun:"created_date"`

	// Relations
	Partnership *Partnership `json:"partnership,omitempty" bun:"rel:has-one,join:on=partnership_id"`
	Account     *Account     `json:"account,omitempty" bun:"rel:has-one,join:on=account_id"`
}

// PartnershipPermissions represents granular permissions for partnership members
type PartnershipPermissions struct {
	CanViewAccounts       bool `json:"can_view_accounts"`
	CanEditAccounts       bool `json:"can_edit_accounts"`
	CanViewTransactions   bool `json:"can_view_transactions"`
	CanAddTransactions    bool `json:"can_add_transactions"`
	CanEditTransactions   bool `json:"can_edit_transactions"`
	CanDeleteTransactions bool `json:"can_delete_transactions"`
	CanViewBudgets        bool `json:"can_view_budgets"`
	CanEditBudgets        bool `json:"can_edit_budgets"`
	CanViewSavings        bool `json:"can_view_savings"`
	CanEditSavings        bool `json:"can_edit_savings"`
	CanViewAnalytics      bool `json:"can_view_analytics"`
	CanInvitePartners     bool `json:"can_invite_partners"`
	CanManagePartners     bool `json:"can_manage_partners"`
}

// Request types for API

// CreatePartnershipRequest represents a request to create a new partnership
type CreatePartnershipRequest struct {
	Name        string  `json:"name" validate:"required,min=1,max=255"`
	Description *string `json:"description,omitempty"`
}

// InvitePartnerRequest represents a request to invite a partner
type InvitePartnerRequest struct {
	Email       string                  `json:"email" validate:"required,email"`
	Message     *string                 `json:"message,omitempty"`
	Role        string                  `json:"role" validate:"required,oneof=admin member"`
	Permissions *PartnershipPermissions `json:"permissions,omitempty"`
}

// RespondToInvitationRequest represents a response to a partnership invitation
type RespondToInvitationRequest struct {
	Action string `json:"action" validate:"required,oneof=accept decline"`
}

// ShareAccountRequest represents a request to share an account with partners
type ShareAccountRequest struct {
	AccountID   int                     `json:"account_id" validate:"required"`
	Permissions *PartnershipPermissions `json:"permissions,omitempty"`
}

// UpdatePartnershipRequest represents a request to update partnership details
type UpdatePartnershipRequest struct {
	Name        *string `json:"name,omitempty"`
	Description *string `json:"description,omitempty"`
	IsActive    *bool   `json:"is_active,omitempty"`
}

// UpdateMemberRoleRequest represents a request to update a member's role
type UpdateMemberRoleRequest struct {
	Role        string                  `json:"role" validate:"required,oneof=owner admin member"`
	Permissions *PartnershipPermissions `json:"permissions,omitempty"`
}

// Response types

// PartnershipSummary represents a summary of a partnership with member info
type PartnershipSummary struct {
	ID              int                 `json:"id"`
	Name            string              `json:"name"`
	Description     *string             `json:"description,omitempty"`
	IsActive        bool                `json:"is_active"`
	CreatedAt       time.Time           `json:"created_at"`
	MemberCount     int                 `json:"member_count"`
	CurrentUserRole string              `json:"current_user_role"`
	Members         []PartnershipMember `json:"members"`
	SharedAccounts  []SharedAccount     `json:"shared_accounts"`
}

// UserPartnerships represents all partnerships a user belongs to
type UserPartnerships struct {
	Partnerships       []PartnershipSummary `json:"partnerships"`
	PendingInvitations []PartnerInvitation  `json:"pending_invitations"`
}

// PartnerInfo represents basic partner information for display
type PartnerInfo struct {
	ID        int       `json:"id"`
	Email     string    `json:"email"`
	FirstName *string   `json:"first_name,omitempty"`
	LastName  *string   `json:"last_name,omitempty"`
	Role      string    `json:"role"`
	JoinedAt  time.Time `json:"joined_at"`
}

// Default permissions for different roles
func DefaultPermissionsForRole(role string) PartnershipPermissions {
	switch role {
	case "owner":
		return PartnershipPermissions{
			CanViewAccounts:       true,
			CanEditAccounts:       true,
			CanViewTransactions:   true,
			CanAddTransactions:    true,
			CanEditTransactions:   true,
			CanDeleteTransactions: true,
			CanViewBudgets:        true,
			CanEditBudgets:        true,
			CanViewSavings:        true,
			CanEditSavings:        true,
			CanViewAnalytics:      true,
			CanInvitePartners:     true,
			CanManagePartners:     true,
		}
	case "admin":
		return PartnershipPermissions{
			CanViewAccounts:       true,
			CanEditAccounts:       true,
			CanViewTransactions:   true,
			CanAddTransactions:    true,
			CanEditTransactions:   true,
			CanDeleteTransactions: true,
			CanViewBudgets:        true,
			CanEditBudgets:        true,
			CanViewSavings:        true,
			CanEditSavings:        true,
			CanViewAnalytics:      true,
			CanInvitePartners:     true,
			CanManagePartners:     false,
		}
	case "member":
		return PartnershipPermissions{
			CanViewAccounts:       true,
			CanEditAccounts:       false,
			CanViewTransactions:   true,
			CanAddTransactions:    true,
			CanEditTransactions:   true,
			CanDeleteTransactions: false,
			CanViewBudgets:        true,
			CanEditBudgets:        false,
			CanViewSavings:        true,
			CanEditSavings:        false,
			CanViewAnalytics:      true,
			CanInvitePartners:     false,
			CanManagePartners:     false,
		}
	default:
		return PartnershipPermissions{}
	}
}
