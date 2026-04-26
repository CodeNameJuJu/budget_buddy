package auth

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/julian/budget-buddy/core/db"
	"github.com/julian/budget-buddy/core/helpers"
	"github.com/julian/budget-buddy/utils/types"
)

// AuthHandler handles authentication requests
type AuthHandler struct {
	authService  *AuthService
	emailService *EmailService
}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{
		authService:  NewAuthService(),
		emailService: NewEmailService(),
	}
}

// Register handles user registration
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req types.RegisterRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if req.Email == "" || req.Password == "" {
		helpers.RespondError(w, http.StatusBadRequest, "Email and password are required")
		return
	}

	database := db.GetDb()
	if database == nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Database not connected")
		return
	}

	// Check if user already exists
	var existingUser types.User
	err := database.NewSelect().
		Model(&existingUser).
		Where("email = ?", req.Email).
		Scan(context.Background())

	if err == nil {
		helpers.RespondError(w, http.StatusConflict, "User already exists")
		return
	}

	// Hash password
	passwordHash, err := h.authService.HashPassword(req.Password)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	// Create user
	user := &types.User{
		Email:         req.Email,
		PasswordHash:  passwordHash,
		FirstName:     req.FirstName,
		LastName:      req.LastName,
		IsActive:      true,
		EmailVerified: false,
	}

	err = database.NewInsert().Model(user).Returning("*").Scan(context.Background())
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	// Create associated account for the user
	account := &types.Account{
		Name:     fmt.Sprintf("%s %s's Account", user.FirstName, user.LastName),
		Email:    user.Email,
		Currency: "ZAR",
	}

	err = database.NewInsert().Model(account).Returning("*").Scan(context.Background())
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to create user account")
		return
	}

	// Generate tokens
	accessToken, refreshToken, err := h.authService.GenerateTokens(user)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to generate tokens")
		return
	}

	// Store refresh token
	refreshTokenHash := h.authService.hashToken(refreshToken)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to process refresh token")
		return
	}

	err = h.authService.StoreRefreshToken(user.ID, refreshTokenHash, time.Now().Add(RefreshTokenDuration))
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to store refresh token")
		return
	}

	// Update last login
	user.LastLogin = &time.Time{}
	*user.LastLogin = time.Now()
	_, err = database.NewUpdate().Model(user).Set("last_login = ?", user.LastLogin).Where("id = ?", user.ID).Exec(context.Background())
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to update last login")
		return
	}

	response := types.AuthResponse{
		User:         *user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int(AccessTokenDuration.Seconds()),
	}

	helpers.RespondJSON(w, http.StatusCreated, response)
}

// POSTProfilePicture updates the user's profile picture URL
func (h *AuthHandler) POSTProfilePicture(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	database := db.GetDb()
	if database == nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Database not connected")
		return
	}

	user, ok := r.Context().Value("user").(*types.User)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Parse multipart form
	err := r.ParseMultipartForm(10 << 20) // 10MB max
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Failed to parse form")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "No file provided")
		return
	}
	defer file.Close()

	// Validate file type
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/webp": true,
	}

	contentType := header.Header.Get("Content-Type")
	if !allowedTypes[contentType] {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid file type. Only JPEG, PNG, and WebP are allowed")
		return
	}

	// Get Cloudinary config
	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")

	if cloudName == "" || apiKey == "" || apiSecret == "" {
		helpers.RespondError(w, http.StatusInternalServerError, "Cloudinary not configured")
		return
	}

	// Upload to Cloudinary
	cld, err := cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to initialize Cloudinary")
		return
	}

	uploadParams := uploader.UploadParams{
		PublicID:       fmt.Sprintf("profile_pictures/user_%d_%d", user.ID, time.Now().Unix()),
		Folder:         "profile_pictures",
		Transformation: "c_fill,w_200,h_200,q_80",
	}

	result, err := cld.Upload.Upload(ctx, file, uploadParams)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to upload image")
		return
	}

	// Update user's profile picture URL in database
	_, err = database.NewUpdate().
		Model(&types.User{}).
		Set("profile_picture_url = ?", result.SecureURL).
		Where("id = ?", user.ID).
		Exec(ctx)

	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to update profile picture")
		return
	}

	helpers.RespondData(w, map[string]interface{}{
		"message":             "Profile picture updated successfully",
		"profile_picture_url": result.SecureURL,
	}, http.StatusOK)
}

// Login handles user login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req types.LoginRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Basic validation
	if req.Email == "" || req.Password == "" {
		helpers.RespondError(w, http.StatusBadRequest, "Email and password are required")
		return
	}

	database := db.GetDb()
	if database == nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Database not connected")
		return
	}

	// Find user
	var user types.User
	err := database.NewSelect().
		Model(&user).
		Where("email = ?", req.Email).
		Scan(context.Background())

	if err != nil {
		helpers.RespondError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	// Check if user is active
	if !user.IsActive {
		helpers.RespondError(w, http.StatusForbidden, "Account is deactivated")
		return
	}

	// Verify password
	if !h.authService.VerifyPassword(req.Password, user.PasswordHash) {
		helpers.RespondError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	// Generate tokens
	accessToken, refreshToken, err := h.authService.GenerateTokens(&user)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to generate tokens")
		return
	}

	// Store refresh token
	refreshTokenHash := h.authService.hashToken(refreshToken)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to process refresh token")
		return
	}

	err = h.authService.StoreRefreshToken(user.ID, refreshTokenHash, time.Now().Add(RefreshTokenDuration))
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to store refresh token")
		return
	}

	// Update last login
	user.LastLogin = &time.Time{}
	*user.LastLogin = time.Now()
	_, err = database.NewUpdate().Model(&user).Set("last_login = ?", user.LastLogin).Where("id = ?", user.ID).Exec(context.Background())
	if err != nil {
		// Don't fail the request if we can't update last login
	}

	response := types.AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int(AccessTokenDuration.Seconds()),
	}

	helpers.RespondJSON(w, http.StatusOK, response)
}

// RefreshToken handles token refresh
func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req types.RefreshTokenRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate refresh token
	refreshToken, err := h.authService.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		helpers.RespondError(w, http.StatusUnauthorized, "Invalid or expired refresh token")
		return
	}

	database := db.GetDb()
	if database == nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Database not connected")
		return
	}

	// Get user
	var user types.User
	err = database.NewSelect().
		Model(&user).
		Where("id = ?", refreshToken.UserID).
		Scan(context.Background())

	if err != nil {
		helpers.RespondError(w, http.StatusUnauthorized, "User not found")
		return
	}

	// Check if user is active
	if !user.IsActive {
		helpers.RespondError(w, http.StatusForbidden, "Account is deactivated")
		return
	}

	// Generate new tokens
	accessToken, newRefreshToken, err := h.authService.GenerateTokens(&user)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to generate tokens")
		return
	}

	// Revoke old refresh token
	err = h.authService.RevokeRefreshToken(refreshToken.ID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to revoke old token")
		return
	}

	// Store new refresh token
	newRefreshTokenHash := h.authService.hashToken(newRefreshToken)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to process refresh token")
		return
	}

	err = h.authService.StoreRefreshToken(user.ID, newRefreshTokenHash, time.Now().Add(RefreshTokenDuration))
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to store refresh token")
		return
	}

	response := types.AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int(AccessTokenDuration.Seconds()),
	}

	helpers.RespondJSON(w, http.StatusOK, response)
}

// Logout handles user logout for the current device
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	// Get user from context (set by auth middleware)
	user, ok := r.Context().Value("user").(*types.User)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Revoke refresh tokens for this user
	err := h.authService.RevokeAllUserTokens(user.ID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to revoke tokens")
		return
	}

	helpers.RespondData(w, map[string]string{"message": "Logged out successfully"}, http.StatusOK)
}

// GetProfile handles getting user profile
func (h *AuthHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	// Get user from context (set by auth middleware)
	user, ok := r.Context().Value("user").(*types.User)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	helpers.RespondData(w, user, http.StatusOK)
}

// UpdateProfile handles user profile update
func (h *AuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	helpers.RespondError(w, http.StatusNotImplemented, "Profile update not implemented yet")
}

// SendVerificationEmail handles sending a verification email
func (h *AuthHandler) SendVerificationEmail(w http.ResponseWriter, r *http.Request) {
	helpers.RespondError(w, http.StatusNotImplemented, "Verification email not implemented yet")
}

// VerifyEmail handles email verification
func (h *AuthHandler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	helpers.RespondError(w, http.StatusNotImplemented, "Email verification not implemented yet")
}

// ChangePassword handles password change
func (h *AuthHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	// Get user from context (set by auth middleware)
	user, ok := r.Context().Value("user").(*types.User)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req types.ChangePasswordRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Basic validation
	if req.CurrentPassword == "" || req.NewPassword == "" {
		helpers.RespondError(w, http.StatusBadRequest, "Current password and new password are required")
		return
	}

	// Verify current password
	if !h.authService.VerifyPassword(req.CurrentPassword, user.PasswordHash) {
		helpers.RespondError(w, http.StatusUnauthorized, "Current password is incorrect")
		return
	}

	// Hash new password
	newPasswordHash, err := h.authService.HashPassword(req.NewPassword)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	database := db.GetDb()
	if database == nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Database not connected")
		return
	}

	// Update password
	_, err = database.NewUpdate().
		Model(&types.User{}).
		Set("password_hash = ?", newPasswordHash).
		Set("updated_at = ?", time.Now()).
		Where("id = ?", user.ID).
		Exec(context.Background())

	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to update password")
		return
	}

	// Revoke all user tokens (force re-login)
	err = h.authService.RevokeAllUserTokens(user.ID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to revoke tokens")
		return
	}

	helpers.RespondData(w, map[string]string{"message": "Password changed successfully"}, http.StatusOK)
}

// ListDevices lists all devices/sessions for the current user
func (h *AuthHandler) ListDevices(w http.ResponseWriter, r *http.Request) {
	helpers.RespondError(w, http.StatusNotImplemented, "Device list not implemented yet")
}

// RevokeDevice revokes a specific device/session
func (h *AuthHandler) RevokeDevice(w http.ResponseWriter, r *http.Request) {
	helpers.RespondError(w, http.StatusNotImplemented, "Device revocation not implemented yet")
}
