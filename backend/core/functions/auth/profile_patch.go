package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/julian/budget-buddy/core/context"
)

// PATCHProfilePicture updates the user's profile picture URL
func PATCHProfilePicture(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	db := context.GetDb()
	userID := context.GetUserID(ctx)

	if db == nil {
		http.Error(w, "Database connection not available", http.StatusInternalServerError)
		return
	}

	if userID == 0 {
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return
	}

	// Parse multipart form (up to 10MB)
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "File is required", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate file type
	contentType := header.Header.Get("Content-Type")
	if contentType != "image/jpeg" && contentType != "image/png" && contentType != "image/jpg" && contentType != "image/webp" {
		http.Error(w, "Invalid file type. Only JPEG, PNG, and WebP are allowed", http.StatusBadRequest)
		return
	}

	// Initialize Cloudinary
	cloudName := context.GetEnv("CLOUDINARY_CLOUD_NAME")
	apiKey := context.GetEnv("CLOUDINARY_API_KEY")
	apiSecret := context.GetEnv("CLOUDINARY_API_SECRET")

	if cloudName == "" || apiKey == "" || apiSecret == "" {
		http.Error(w, "Cloudinary configuration not set", http.StatusInternalServerError)
		return
	}

	cld, err := cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
	if err != nil {
		http.Error(w, "Failed to initialize Cloudinary", http.StatusInternalServerError)
		return
	}

	// Upload to Cloudinary
	uploadParams := uploader.UploadParams{
		Folder:         "profile_pictures",
		PublicID:       fmt.Sprintf("user_%d_%d", userID, time.Now().Unix()),
		Transformation: "c_fill,w_200,h_200,q_80",
		AllowedFormats: []string{"jpg", "jpeg", "png", "webp"},
	}

	result, err := cld.Upload.Upload(ctx, file, uploadParams)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to upload image: %v", err), http.StatusInternalServerError)
		return
	}

	// Update user's profile picture in database
	now := time.Now()
	_, err = db.NewUpdate().
		TableExpr("users").
		Set("profile_picture_url = ?", result.SecureURL).
		Set("updated_at = ?", now).
		Where("id = ?", userID).
		Exec(ctx)

	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to update profile picture: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":             "Profile picture updated successfully",
		"profile_picture_url": result.SecureURL,
	})
}
