package partnership

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/julian/budget-buddy/core/context"
	"github.com/julian/budget-buddy/utils/types"
	"github.com/uptrace/bun"
)

// GETPartnerships returns all partnerships for the current user
func GETPartnerships(w http.ResponseWriter, r *http.Request) {
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

	// Get partnerships where user is a member
	var partnerships []types.Partnership
	err := db.NewSelect().
		Model(&partnerships).
		Relation("Members", func(q *bun.SelectQuery) *bun.SelectQuery {
			return q.Relation("User")
		}).
		Where("partnership.id IN (SELECT partnership_id FROM partnership_members WHERE user_id = ?)", userID).
		Where("partnership.is_active = ?", true).
		Scan(ctx)

	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to fetch partnerships: %v", err), http.StatusInternalServerError)
		return
	}

	// Get pending invitations for the user
	var invitations []types.PartnerInvitation
	err = db.NewSelect().
		Model(&invitations).
		Where("invited_email IN (SELECT email FROM users WHERE id = ?)", userID).
		Where("status = ?", "pending").
		Where("expires_at > ?", time.Now()).
		Scan(ctx)

	if err != nil && err != sql.ErrNoRows {
		http.Error(w, fmt.Sprintf("Failed to fetch invitations: %v", err), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"partnerships":        partnerships,
		"pending_invitations": invitations,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
