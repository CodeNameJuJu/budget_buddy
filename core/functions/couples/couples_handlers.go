package couples

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
)

// CouplesHandler handles couples/partners API requests
type CouplesHandler struct {
	couplesService *CouplesService
}

func NewCouplesHandler() *CouplesHandler {
	return &CouplesHandler{
		couplesService: NewCouplesService(),
	}
}

// GetPartnerships gets all partnerships for the current user
func (h *CouplesHandler) GetPartnerships(w http.ResponseWriter, r *http.Request) {
	defer func() {
		if r := recover(); r != nil {
			helpers.RespondError(w, http.StatusInternalServerError, "Internal server error")
		}
	}()

	userID := r.Context().Value("user_id").(int)

	partnerships, err := h.couplesService.GetUserPartnerships(userID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to get partnerships")
		return
	}

	helpers.RespondData(w, partnerships, http.StatusOK)
}

// CreatePartnership creates a new partnership
func (h *CouplesHandler) CreatePartnership(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)

	var req types.CreatePartnershipRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Basic validation
	if req.Name == "" {
		helpers.RespondError(w, http.StatusBadRequest, "Partnership name is required")
		return
	}

	partnership, err := h.couplesService.CreatePartnership(userID, &req)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to create partnership")
		return
	}

	helpers.RespondData(w, partnership, http.StatusCreated)
}

// GetPartnershipDetails gets detailed information about a specific partnership
func (h *CouplesHandler) GetPartnershipDetails(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)

	partnershipID, err := strconv.Atoi(r.URL.Query().Get("partnership_id"))
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid partnership ID")
		return
	}

	details, err := h.couplesService.GetPartnershipDetails(partnershipID, userID)
	if err != nil {
		helpers.RespondError(w, http.StatusNotFound, "Partnership not found")
		return
	}

	helpers.RespondData(w, details, http.StatusOK)
}

// InvitePartner invites a user to join a partnership
func (h *CouplesHandler) InvitePartner(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)

	var req types.InvitePartnerRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Basic validation
	if req.Email == "" {
		helpers.RespondError(w, http.StatusBadRequest, "Partner email is required")
		return
	}

	partnershipID, err := strconv.Atoi(r.URL.Query().Get("partnership_id"))
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid partnership ID")
		return
	}

	invitation, err := h.couplesService.InvitePartner(partnershipID, userID, &req)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Failed to invite partner")
		return
	}

	helpers.RespondData(w, invitation, http.StatusCreated)
}

// RespondToInvitation responds to a partnership invitation
func (h *CouplesHandler) RespondToInvitation(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)

	var req types.RespondToInvitationRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Basic validation
	if req.Action == "" {
		helpers.RespondError(w, http.StatusBadRequest, "Action is required")
		return
	}

	token := r.URL.Query().Get("token")
	if token == "" {
		helpers.RespondError(w, http.StatusBadRequest, "Invitation token is required")
		return
	}

	err := h.couplesService.RespondToInvitation(userID, token, req.Action)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Failed to respond to invitation")
		return
	}

	message := "Invitation " + req.Action + "ed successfully"
	helpers.RespondData(w, map[string]string{"message": message}, http.StatusOK)
}

// ShareAccount shares an account with partnership members
func (h *CouplesHandler) ShareAccount(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)

	var req types.ShareAccountRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Basic validation
	if req.AccountID == 0 {
		helpers.RespondError(w, http.StatusBadRequest, "Account ID is required")
		return
	}

	partnershipID, err := strconv.Atoi(r.URL.Query().Get("partnership_id"))
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid partnership ID")
		return
	}

	err = h.couplesService.ShareAccount(partnershipID, userID, req.AccountID, req.Permissions)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Failed to share account")
		return
	}

	helpers.RespondData(w, map[string]string{"message": "Account shared successfully"}, http.StatusOK)
}

// RemoveMember removes a member from a partnership
func (h *CouplesHandler) RemoveMember(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)

	partnershipID, err := strconv.Atoi(r.URL.Query().Get("partnership_id"))
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid partnership ID")
		return
	}

	memberUserID, err := strconv.Atoi(r.URL.Query().Get("member_id"))
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid member ID")
		return
	}

	err = h.couplesService.RemoveMember(partnershipID, userID, memberUserID)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Failed to remove member")
		return
	}

	helpers.RespondData(w, map[string]string{"message": "Member removed successfully"}, http.StatusOK)
}

// UpdateMemberRole updates a member's role and permissions
func (h *CouplesHandler) UpdateMemberRole(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)

	var req types.UpdateMemberRoleRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Basic validation
	if req.Role == "" {
		helpers.RespondError(w, http.StatusBadRequest, "Role is required")
		return
	}

	partnershipID, err := strconv.Atoi(r.URL.Query().Get("partnership_id"))
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid partnership ID")
		return
	}

	memberUserID, err := strconv.Atoi(r.URL.Query().Get("member_id"))
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid member ID")
		return
	}

	err = h.couplesService.UpdateMemberRole(partnershipID, userID, memberUserID, &req)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Failed to update member role")
		return
	}

	helpers.RespondData(w, map[string]string{"message": "Member role updated successfully"}, http.StatusOK)
}

// GetInvitationDetails gets details about a specific invitation (for accepting/declining)
func (h *CouplesHandler) GetInvitationDetails(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)

	token := r.URL.Query().Get("token")
	if token == "" {
		helpers.RespondError(w, http.StatusBadRequest, "Invitation token is required")
		return
	}

	// This would typically return invitation details for the UI to display
	// For now, we'll just validate the token exists and is for this user
	database := db.GetDb()
	if database == nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Database not connected")
		return
	}

	var invitation types.PartnerInvitation
	err := database.NewSelect().
		Model(&invitation).
		Relation("Partnership").
		Relation("InvitedByUser").
		Where("invitation_token = ? AND status = ? AND expires_at > ?", token, "pending", time.Now()).
		Scan(context.Background())

	if err != nil {
		helpers.RespondError(w, http.StatusNotFound, "Invalid or expired invitation")
		return
	}

	// Verify that the invitation is for this user
	if invitation.InvitedUserID != nil && *invitation.InvitedUserID != userID {
		helpers.RespondError(w, http.StatusForbidden, "Invitation is not for this user")
		return
	}

	// Check if user email matches invited email
	var user types.User
	err = database.NewSelect().
		Model(&user).
		Where("id = ?", userID).
		Scan(context.Background())

	if err != nil {
		helpers.RespondError(w, http.StatusNotFound, "User not found")
		return
	}

	if user.Email != invitation.InvitedEmail {
		helpers.RespondError(w, http.StatusForbidden, "Invitation email does not match user email")
		return
	}

	helpers.RespondData(w, invitation, http.StatusOK)
}
