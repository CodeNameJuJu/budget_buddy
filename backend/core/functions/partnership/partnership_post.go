package partnership

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/julian/budget-buddy/core/context"
	"github.com/julian/budget-buddy/utils/types"
)

// POSTPartnerships creates a new partnership
func POSTPartnerships(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	db := context.GetDB(ctx)
	userID := context.GetUserID(ctx)

	if db == nil {
		http.Error(w, "Database connection not available", http.StatusInternalServerError)
		return
	}

	if userID == 0 {
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return
	}

	var req types.CreatePartnershipRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Create partnership
	partnership := types.Partnership{
		Name:            req.Name,
		Description:     req.Description,
		CreatedByUserID: userID,
		IsActive:        true,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	result, err := db.NewInsert().Model(&partnership).Exec(ctx)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to create partnership: %v", err), http.StatusInternalServerError)
		return
	}

	partnershipID, _ := result.LastInsertId()

	// Add creator as owner member
	member := types.PartnershipMember{
		PartnershipID: int(partnershipID),
		UserID:        userID,
		Role:          "owner",
		JoinedAt:      time.Now(),
	}

	if _, err := db.NewInsert().Model(&member).Exec(ctx); err != nil {
		http.Error(w, fmt.Sprintf("Failed to add partnership member: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(partnership)
}

// POSTInvitePartner sends an invitation to a partner
func POSTInvitePartner(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	db := context.GetDB(ctx)
	userID := context.GetUserID(ctx)

	if db == nil {
		http.Error(w, "Database connection not available", http.StatusInternalServerError)
		return
	}

	if userID == 0 {
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return
	}

	partnershipID := chi.URLParam(r, "partnershipID")
	if partnershipID == "" {
		http.Error(w, "Partnership ID required", http.StatusBadRequest)
		return
	}

	var req types.InvitePartnerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Generate invitation token
	tokenBytes := make([]byte, 32)
	rand.Read(tokenBytes)
	token := hex.EncodeToString(tokenBytes)

	// Serialize permissions
	var permissionsJSON string
	if req.Permissions != nil {
		permBytes, err := json.Marshal(req.Permissions)
		if err != nil {
			http.Error(w, "Failed to serialize permissions", http.StatusInternalServerError)
			return
		}
		permissionsJSON = string(permBytes)
	} else {
		// Use default permissions for the role
		defaultPerms := types.DefaultPermissionsForRole(req.Role)
		permBytes, err := json.Marshal(defaultPerms)
		if err != nil {
			http.Error(w, "Failed to serialize default permissions", http.StatusInternalServerError)
			return
		}
		permissionsJSON = string(permBytes)
	}

	invitation := types.PartnerInvitation{
		PartnershipID:   parseInt(partnershipID),
		InvitedEmail:    req.Email,
		InvitedByUserID: userID,
		InvitationToken: token,
		Status:          "pending",
		Message:         req.Message,
		ExpiresAt:       time.Now().Add(7 * 24 * time.Hour), // 7 days
		CreatedAt:       time.Now(),
	}

	if _, err := db.NewInsert().Model(&invitation).Exec(ctx); err != nil {
		http.Error(w, fmt.Sprintf("Failed to create invitation: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Invitation sent successfully",
		"token":   token,
	})
}

// POSTRespondToInvitation accepts or declines a partnership invitation
func POSTRespondToInvitation(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	db := context.GetDB(ctx)
	userID := context.GetUserID(ctx)

	if db == nil {
		http.Error(w, "Database connection not available", http.StatusInternalServerError)
		return
	}

	if userID == 0 {
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return
	}

	token := chi.URLParam(r, "token")
	if token == "" {
		http.Error(w, "Invitation token required", http.StatusBadRequest)
		return
	}

	var req types.RespondToInvitationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get the invitation
	var invitation types.PartnerInvitation
	err := db.NewSelect().
		Model(&invitation).
		Where("invitation_token = ?", token).
		Where("status = ?", "pending").
		Where("expires_at > ?", time.Now()).
		Scan(ctx)

	if err != nil {
		http.Error(w, "Invalid or expired invitation", http.StatusNotFound)
		return
	}

	if req.Action == "accept" {
		now := time.Now()

		// Update invitation status
		invitation.Status = "accepted"
		invitation.AcceptedAt = &now
		if _, err := db.NewUpdate().Model(&invitation).WherePK().Exec(ctx); err != nil {
			http.Error(w, fmt.Sprintf("Failed to update invitation: %v", err), http.StatusInternalServerError)
			return
		}

		// Add user as partnership member
		member := types.PartnershipMember{
			PartnershipID:   invitation.PartnershipID,
			UserID:          userID,
			InvitedByUserID: &invitation.InvitedByUserID,
			JoinedAt:        now,
		}

		// Get the invitation to determine role and permissions
		// For now, default to member role
		member.Role = "member"

		if _, err := db.NewInsert().Model(&member).Exec(ctx); err != nil {
			http.Error(w, fmt.Sprintf("Failed to add partnership member: %v", err), http.StatusInternalServerError)
			return
		}

		// Get the inviter's account to share with the new partner
		var inviterAccount struct {
			ID     int `bun:"id"`
			UserID int `bun:"user_id"`
		}
		err = db.NewSelect().
			Model(&inviterAccount).
			TableExpr("accounts").
			Where("user_id = ?", invitation.InvitedByUserID).
			Order("created_at ASC").
			Limit(1).
			Scan(ctx)

		if err == nil && inviterAccount.ID != 0 {
			// Share the inviter's account with the new partner
			sharedAccount := types.SharedAccount{
				PartnershipID:  invitation.PartnershipID,
				AccountID:      inviterAccount.ID,
				SharedByUserID: invitation.InvitedByUserID,
				Permissions:    "", // Will use default member permissions
				IsActive:       true,
				CreatedAt:      now,
			}

			if _, err := db.NewInsert().Model(&sharedAccount).Exec(ctx); err != nil {
				// Log error but don't fail - the partnership is still created
				fmt.Printf("Failed to share account: %v", err)
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Invitation accepted successfully",
		})
	} else if req.Action == "decline" {
		now := time.Now()
		invitation.Status = "declined"
		invitation.DeclinedAt = &now

		if _, err := db.NewUpdate().Model(&invitation).WherePK().Exec(ctx); err != nil {
			http.Error(w, fmt.Sprintf("Failed to update invitation: %v", err), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Invitation declined",
		})
	} else {
		http.Error(w, "Invalid action", http.StatusBadRequest)
	}
}

func parseInt(s string) int {
	var i int
	fmt.Sscanf(s, "%d", &i)
	return i
}
