package auth

import (
	"context"
	"net/http"
	"strings"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
)

// AuthMiddleware creates a middleware for JWT authentication
func (h *AuthHandler) AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			helpers.RespondError(w, http.StatusUnauthorized, "Authorization header required")
			return
		}

		// Check Bearer token format
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			helpers.RespondError(w, http.StatusUnauthorized, "Invalid authorization header format")
			return
		}

		// Validate token
		claims, err := h.authService.ValidateToken(parts[1])
		if err != nil {
			helpers.RespondError(w, http.StatusUnauthorized, "Invalid token")
			return
		}

		// Check token type
		if claims.Type != "access" {
			helpers.RespondError(w, http.StatusUnauthorized, "Invalid token type")
			return
		}

		// Validate session (check device_id)
		err = h.authService.ValidateSession(claims.UserID, claims.DeviceID)
		if err != nil {
			helpers.RespondError(w, http.StatusUnauthorized, "Invalid or expired session")
			return
		}

		// Get user from database
		database := db.GetDb()
		if database == nil {
			helpers.RespondError(w, http.StatusInternalServerError, "Database not connected")
			return
		}

		var user types.User
		err = database.NewSelect().
			Model(&user).
			Where("id = ?", claims.UserID).
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

		// Add user to context
		ctx := context.WithValue(r.Context(), "user", &user)
		ctx = context.WithValue(ctx, "user_id", user.ID)
		ctx = context.WithValue(ctx, "user_email", user.Email)
		ctx = context.WithValue(ctx, "device_id", claims.DeviceID)

		// Call next handler with updated context
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// OptionalAuthMiddleware creates a middleware that doesn't require authentication but adds user if available
func (h *AuthHandler) OptionalAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			// No auth header, continue without user
			next.ServeHTTP(w, r)
			return
		}

		// Check Bearer token format
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			// Invalid format, continue without user
			next.ServeHTTP(w, r)
			return
		}

		// Validate token
		claims, err := h.authService.ValidateToken(parts[1])
		if err != nil {
			// Invalid token, continue without user
			next.ServeHTTP(w, r)
			return
		}

		// Check token type
		if claims.Type != "access" {
			// Invalid token type, continue without user
			next.ServeHTTP(w, r)
			return
		}

		// Get user from database
		database := db.GetDb()
		if database == nil {
			// Database not connected, continue without user
			next.ServeHTTP(w, r)
			return
		}

		var user types.User
		err = database.NewSelect().
			Model(&user).
			Where("id = ?", claims.UserID).
			Scan(context.Background())

		if err != nil || !user.IsActive {
			// User not found or inactive, continue without user
			next.ServeHTTP(w, r)
			return
		}

		// Add user to context
		ctx := context.WithValue(r.Context(), "user", &user)
		ctx = context.WithValue(ctx, "user_id", user.ID)
		ctx = context.WithValue(ctx, "user_email", user.Email)
		ctx = context.WithValue(ctx, "device_id", claims.DeviceID)

		// Call next handler with updated context
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// AdminMiddleware creates a middleware for admin-only routes
func (h *AuthHandler) AdminMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// First check if user is authenticated
		user, ok := r.Context().Value("user").(*types.User)
		if !ok {
			helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
			return
		}

		// Check if user is admin (you might want to add an is_admin field to users table)
		// For now, we'll check if email contains admin or if user ID is 1 (first user)
		isAdmin := strings.Contains(strings.ToLower(user.Email), "admin") || user.ID == 1

		if !isAdmin {
			helpers.RespondError(w, http.StatusForbidden, "Admin access required")
			return
		}

		// Call next handler
		next.ServeHTTP(w, r)
	})
}

// GetUserFromContext gets the user from the request context
func GetUserFromContext(r *http.Request) (*types.User, bool) {
	user, ok := r.Context().Value("user").(*types.User)
	return user, ok
}

// GetUserIDFromContext gets the user ID from the request context
func GetUserIDFromContext(r *http.Request) (int, bool) {
	userID, ok := r.Context().Value("user_id").(int)
	return userID, ok
}

// GetUserEmailFromContext gets the user email from the request context
func GetUserEmailFromContext(r *http.Request) (string, bool) {
	email, ok := r.Context().Value("user_email").(string)
	return email, ok
}

// GetDeviceIDFromContext gets the device ID from the request context
func GetDeviceIDFromContext(r *http.Request) (string, bool) {
	deviceID, ok := r.Context().Value("device_id").(string)
	return deviceID, ok
}
