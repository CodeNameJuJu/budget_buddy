package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/julian/budget-buddy/core/context"
	"github.com/uptrace/bun"
)

// PATCHProfilePicture updates the user's profile picture URL
func PATCHProfilePicture(w http.ResponseWriter, r *http.Request) {
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

	var req struct {
		ProfilePictureURL string `json:"profile_picture_url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.ProfilePictureURL == "" {
		http.Error(w, "Profile picture URL is required", http.StatusBadRequest)
		return
	}

	// Update user's profile picture
	now := time.Now()
	_, err := db.NewUpdate().
		TableExpr("users").
		Set("profile_picture_url = ?", req.ProfilePictureURL).
		Set("updated_at = ?", now).
		Where("id = ?", userID).
		Exec(ctx)

	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to update profile picture: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Profile picture updated successfully",
		"profile_picture_url": req.ProfilePictureURL,
	})
}
