package auth

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
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

	firstName := normalizedNamePointer(req.FirstName, req.FirstNameAlt)
	lastName := normalizedNamePointer(req.LastName, req.LastNameAlt)
	if firstName != nil {
		req.FirstName = firstName
	}
	if lastName != nil {
		req.LastName = lastName
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

	// Check if user already exists
	var existingUser types.User
	err := database.NewSelect().
		Model(&existingUser).
		Where("email = ?", req.Email).
		Scan(context.Background())

	if err == nil {
		helpers.RespondError(w, http.StatusConflict, "User with this email already exists")
		return
	}

	// Hash password
	passwordHash, err := h.authService.HashPassword(req.Password)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	// Create user
	now := time.Now()
	user := &types.User{
		Email:         req.Email,
		PasswordHash:  passwordHash,
		FirstName:     req.FirstName,
		LastName:      req.LastName,
		IsActive:      true,
		EmailVerified: false,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	err = database.NewInsert().Model(user).Returning("*").Scan(context.Background())
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	accountOwnerName := "My"
	if req.FirstName != nil && strings.TrimSpace(*req.FirstName) != "" {
		accountOwnerName = strings.TrimSpace(*req.FirstName)
	}

	// Create associated account for the user
	account := &types.Account{
		UserID:   int64(user.ID),
		UserIDs:  []int64{int64(user.ID)},
		Name:     fmt.Sprintf("%s's Account", accountOwnerName),
		Email:    user.Email,
		Currency: "ZAR",
		Timezone: req.Timezone,
		Timestamps: types.Timestamps{
			CreatedDate: now,
		},
	}

	err = database.NewInsert().Model(account).Returning("*").Scan(context.Background())
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to create user account")
		return
	}

	// Generate device ID
	deviceID, err := h.authService.GenerateDeviceID()
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to generate device ID")
		return
	}

	// Generate tokens
	accessToken, refreshToken, err := h.authService.GenerateTokens(user, deviceID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to generate tokens")
		return
	}

	// Store refresh token
	refreshTokenHash := h.authService.hashToken(refreshToken)
	err = h.authService.StoreRefreshToken(user.ID, refreshTokenHash, time.Now().Add(RefreshTokenDuration))
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to store refresh token")
		return
	}

	// Create user session
	userAgent := r.UserAgent()
	ipAddress := r.RemoteAddr
	err = h.authService.CreateOrUpdateSession(user.ID, deviceID, "", "", userAgent, ipAddress, time.Now().Add(RefreshTokenDuration))
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to create session")
		return
	}

	// Update last login
	timeNow := time.Now()
	user.LastLogin = &timeNow
	_, err = database.NewUpdate().Model(user).Set("last_login = ?", user.LastLogin).Where("id = ?", user.ID).Exec(context.Background())
	if err != nil {
		// Don't fail the request if we can't update last login
		log.Printf("Warning: failed to update last login for user %d: %v", user.ID, err)
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

func normalizedNamePointer(primary *string, fallback *string) *string {
	if primary != nil {
		trimmed := strings.TrimSpace(*primary)
		if trimmed != "" {
			return &trimmed
		}
	}
	if fallback != nil {
		trimmed := strings.TrimSpace(*fallback)
		if trimmed != "" {
			return &trimmed
		}
	}
	return nil
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

	// Generate device ID
	deviceID, err := h.authService.GenerateDeviceID()
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to generate device ID")
		return
	}

	// Generate tokens
	accessToken, refreshToken, err := h.authService.GenerateTokens(&user, deviceID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to generate tokens")
		return
	}

	// Store refresh token
	refreshTokenHash := h.authService.hashToken(refreshToken)
	err = h.authService.StoreRefreshToken(user.ID, refreshTokenHash, time.Now().Add(RefreshTokenDuration))
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to store refresh token")
		return
	}

	// Create user session
	userAgent := r.UserAgent()
	ipAddress := r.RemoteAddr
	err = h.authService.CreateOrUpdateSession(user.ID, deviceID, "", "", userAgent, ipAddress, time.Now().Add(RefreshTokenDuration))
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to create session")
		return
	}

	// Update last login
	timeNow := time.Now()
	user.LastLogin = &timeNow
	_, err = database.NewUpdate().Model(&user).Set("last_login = ?", user.LastLogin).Where("id = ?", user.ID).Exec(context.Background())
	if err != nil {
		// Don't fail the request if we can't update last login
		log.Printf("Warning: failed to update last login for user %d: %v", user.ID, err)
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

	// Get device_id from the current access token if available. The access
	// token is usually expired at this point, so only its signature is
	// verified - reusing the device ID keeps the existing session alive
	// instead of minting a new device on every refresh.
	authHeader := r.Header.Get("Authorization")
	deviceID := ""
	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && parts[0] == "Bearer" {
			claims, err := h.authService.ExtractClaimsIgnoringExpiry(parts[1])
			if err == nil && claims.DeviceID != "" && claims.UserID == user.ID {
				deviceID = claims.DeviceID
			}
		}
	}

	// If no device_id, generate a new one
	if deviceID == "" {
		deviceID, err = h.authService.GenerateDeviceID()
		if err != nil {
			helpers.RespondError(w, http.StatusInternalServerError, "Failed to generate device ID")
			return
		}
	}

	// Generate new tokens
	accessToken, newRefreshToken, err := h.authService.GenerateTokens(&user, deviceID)
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
	err = h.authService.StoreRefreshToken(user.ID, newRefreshTokenHash, time.Now().Add(RefreshTokenDuration))
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to store refresh token")
		return
	}

	// Create or extend the session for this device. The new access token is
	// bound to deviceID, so without a matching session every subsequent
	// request would fail session validation and log the device out.
	err = h.authService.CreateOrUpdateSession(user.ID, deviceID, "", "", r.UserAgent(), r.RemoteAddr, time.Now().Add(RefreshTokenDuration))
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to create session")
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
	// Get device_id from token
	userID, ok := GetUserIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	deviceID, ok := GetDeviceIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "Device ID not found")
		return
	}

	database := db.GetDb()
	if database == nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Database not connected")
		return
	}

	// Delete the specific session for this device
	_, err := database.NewDelete().
		Model((*types.UserSession)(nil)).
		Where("user_id = ? AND device_id = ?", userID, deviceID).
		Exec(context.Background())

	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to revoke session")
		return
	}

	helpers.RespondData(w, map[string]string{"message": "Logged out successfully"}, 1)
}

// GetProfile handles getting user profile
func (h *AuthHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	// Get user from context (set by auth middleware)
	user, ok := GetUserFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	helpers.RespondData(w, user, 1)
}

// UpdateProfile handles profile update
func (h *AuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	// Get user from context (set by auth middleware)
	user, ok := GetUserFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req types.UpdateProfileRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Basic validation
	if req.Email == "" {
		helpers.RespondError(w, http.StatusBadRequest, "Email is required")
		return
	}

	database := db.GetDb()
	if database == nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Database not connected")
		return
	}

	// Check if email is being changed to a different email that already exists
	if req.Email != user.Email {
		var existingUser types.User
		err := database.NewSelect().
			Model(&existingUser).
			Where("email = ? AND id != ?", req.Email, user.ID).
			Scan(context.Background())

		if err == nil {
			helpers.RespondError(w, http.StatusConflict, "Email already in use")
			return
		}
	}

	// Update user profile
	_, err := database.NewUpdate().
		Model(&types.User{}).
		Set("email = ?", req.Email).
		Set("first_name = ?", req.FirstName).
		Set("last_name = ?", req.LastName).
		Set("updated_at = ?", time.Now()).
		// If email changed, mark as unverified
		Set("email_verified = ?", req.Email == user.Email).
		Where("id = ?", user.ID).
		Exec(context.Background())

	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	// Fetch updated user
	var updatedUser types.User
	err = database.NewSelect().
		Model(&updatedUser).
		Where("id = ?", user.ID).
		Scan(context.Background())

	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to fetch updated user")
		return
	}

	helpers.RespondData(w, updatedUser, 1)
}

// SendVerificationEmail handles sending a verification email
func (h *AuthHandler) SendVerificationEmail(w http.ResponseWriter, r *http.Request) {
	// Get user from context (set by auth middleware)
	user, ok := GetUserFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Generate verification token
	verificationToken, err := h.authService.GenerateSecureToken(32)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to generate verification token")
		return
	}

	// Send verification email using email service
	err = h.emailService.SendVerificationEmail(user.ID, user.Email, verificationToken)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to send verification email: %v", err))
		return
	}

	helpers.RespondData(w, map[string]string{
		"message": "Verification email sent",
		"email":   user.Email,
	}, 1)
}

// VerifyEmail handles email verification
func (h *AuthHandler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	var req types.VerifyEmailRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Token == "" {
		helpers.RespondError(w, http.StatusBadRequest, "Token is required")
		return
	}

	// Verify token using email service
	userID, err := h.emailService.VerifyToken(req.Token, "email_verification")
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid or expired token")
		return
	}

	database := db.GetDb()
	if database == nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Database not connected")
		return
	}

	// Mark user as verified
	_, err = database.NewUpdate().
		Model(&types.User{}).
		Set("email_verified = ?", true).
		Set("updated_at = ?", time.Now()).
		Where("id = ?", userID).
		Exec(context.Background())

	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to verify email")
		return
	}

	helpers.RespondData(w, map[string]string{"message": "Email verified successfully"}, 1)
}

// ChangePassword handles password change
func (h *AuthHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	// Get user from context (set by auth middleware)
	user, ok := GetUserFromContext(r)
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

	helpers.RespondData(w, map[string]string{"message": "Password changed successfully"}, 1)
}

// ListDevices lists all devices/sessions for the current user
func (h *AuthHandler) ListDevices(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	database := db.GetDb()
	if database == nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Database not connected")
		return
	}

	var sessions []types.UserSession
	err := database.NewSelect().
		Model(&sessions).
		Where("user_id = ?", userID).
		Order("last_active DESC").
		Scan(context.Background())

	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to fetch devices")
		return
	}

	helpers.RespondData(w, sessions, len(sessions))
}

// RevokeDevice revokes a specific device/session
func (h *AuthHandler) RevokeDevice(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	deviceID := r.URL.Query().Get("device_id")
	if deviceID == "" {
		helpers.RespondError(w, http.StatusBadRequest, "device_id is required")
		return
	}

	database := db.GetDb()
	if database == nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Database not connected")
		return
	}

	_, err := database.NewDelete().
		Model((*types.UserSession)(nil)).
		Where("user_id = ? AND device_id = ?", userID, deviceID).
		Exec(context.Background())

	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to revoke device")
		return
	}

	helpers.RespondData(w, map[string]string{"message": "Device revoked successfully"}, 1)
}

// POSTProfilePicture updates the user's profile picture URL
func (h *AuthHandler) POSTProfilePicture(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	database := db.GetDb()
	if database == nil {
		log.Println("Database not connected")
		helpers.RespondError(w, http.StatusInternalServerError, "Database not connected")
		return
	}

	user, ok := GetUserFromContext(r)
	if !ok {
		log.Println("User not authenticated")
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	log.Printf("User ID: %d, attempting to upload profile picture", user.ID)

	// Parse multipart form
	err := r.ParseMultipartForm(10 << 20) // 10MB max
	if err != nil {
		log.Printf("Failed to parse multipart form: %v", err)
		helpers.RespondError(w, http.StatusBadRequest, "Failed to parse form")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		log.Printf("Failed to get file from form: %v", err)
		helpers.RespondError(w, http.StatusBadRequest, "No file provided")
		return
	}
	defer file.Close()

	log.Printf("File received: %s, Content-Type: %s", header.Filename, header.Header.Get("Content-Type"))

	// Validate file type
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/webp": true,
	}

	contentType := header.Header.Get("Content-Type")
	if !allowedTypes[contentType] {
		log.Printf("Invalid file type: %s", contentType)
		helpers.RespondError(w, http.StatusBadRequest, "Invalid file type. Only JPEG, PNG, and WebP are allowed")
		return
	}

	// Get Cloudinary config
	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")

	log.Printf("Cloudinary config - CloudName: %s, APIKey set: %v, APISecret set: %v",
		cloudName, apiKey != "", apiSecret != "")

	if cloudName == "" || apiKey == "" || apiSecret == "" {
		log.Println("Cloudinary not configured")
		helpers.RespondError(w, http.StatusInternalServerError, "Cloudinary not configured")
		return
	}

	// Upload to Cloudinary
	cld, err := cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
	if err != nil {
		log.Printf("Failed to initialize Cloudinary: %v", err)
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to initialize Cloudinary")
		return
	}

	uploadParams := uploader.UploadParams{
		PublicID:       fmt.Sprintf("profile_pictures/user_%d_%d", user.ID, time.Now().Unix()),
		Folder:         "profile_pictures",
		Transformation: "c_fill,w_200,h_200,q_80",
	}

	log.Printf("Uploading to Cloudinary with PublicID: %s", uploadParams.PublicID)

	result, err := cld.Upload.Upload(ctx, file, uploadParams)
	if err != nil {
		log.Printf("Failed to upload image to Cloudinary: %v", err)
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to upload image")
		return
	}

	log.Printf("Cloudinary upload successful, URL: %s", result.SecureURL)

	// Update user's profile picture URL in database
	_, err = database.NewUpdate().
		Model(&types.User{}).
		Set("profile_picture_url = ?", result.SecureURL).
		Where("id = ?", user.ID).
		Exec(ctx)

	if err != nil {
		log.Printf("Failed to update profile picture in database: %v", err)
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to update profile picture")
		return
	}

	log.Printf("Profile picture updated successfully for user ID: %d", user.ID)

	helpers.RespondData(w, map[string]interface{}{
		"message":             "Profile picture updated successfully",
		"profile_picture_url": result.SecureURL,
	}, 1)
}
