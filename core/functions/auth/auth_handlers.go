package auth

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
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
		UserID:   int64(user.ID),
		Name:     fmt.Sprintf("%s %s's Account", user.FirstName, user.LastName),
		Email:    user.Email,
		Currency: "ZAR",
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
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to process refresh token")
		return
	}

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
	user.LastLogin = &time.Time{}
	*user.LastLogin = time.Now()
	_, err = database.NewUpdate().Model(user).Set("last_login = ?", user.LastLogin).Where("id = ?", user.ID).Exec(context.Background())
	if err != nil {
		// Don't fail the request if we can't update last login
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
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to process refresh token")
		return
	}

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

	// Get device_id from current access token if available
	authHeader := r.Header.Get("Authorization")
	deviceID := ""
	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && parts[0] == "Bearer" {
			claims, err := h.authService.ValidateToken(parts[1])
			if err == nil && claims.DeviceID != "" {
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

	// Revoke refresh tokens for this user (optional - could be device-specific)
	err = h.authService.RevokeAllUserTokens(user.ID)
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

// UpdateProfile handles profile update
func (h *AuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	// Get user from context (set by auth middleware)
	user, ok := r.Context().Value("user").(*types.User)
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

	helpers.RespondData(w, updatedUser, http.StatusOK)
}

// SendVerificationEmail handles sending a verification email
func (h *AuthHandler) SendVerificationEmail(w http.ResponseWriter, r *http.Request) {
	// Get user from context (set by auth middleware)
	user, ok := r.Context().Value("user").(*types.User)
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
		helpers.RespondError(w, http.StatusInternalServerError, "Failed to send verification email")
		return
	}

	helpers.RespondData(w, map[string]string{
		"message": "Verification email sent",
		"email":   user.Email,
	}, http.StatusOK)
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

	helpers.RespondData(w, map[string]string{"message": "Email verified successfully"}, http.StatusOK)
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

	helpers.RespondData(w, sessions, http.StatusOK)
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

	helpers.RespondData(w, map[string]string{"message": "Device revoked successfully"}, http.StatusOK)
}
