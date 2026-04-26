package types

import "time"

// User represents a user in the system
type User struct {
	ID            int        `json:"id" bun:"id,pk,autoincrement"`
	Email         string     `json:"email" bun:"email,unique"`
	PasswordHash  string     `json:"-" bun:"password_hash"`
	FirstName     *string    `json:"first_name,omitempty" bun:"first_name"`
	LastName      *string    `json:"last_name,omitempty" bun:"last_name"`
	IsActive      bool       `json:"is_active" bun:"is_active"`
	EmailVerified bool       `json:"email_verified" bun:"email_verified"`
	LastLogin     *time.Time `json:"last_login,omitempty" bun:"last_login"`
	CreatedAt     time.Time  `json:"created_at" bun:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at" bun:"updated_at"`
}

// RefreshToken represents a refresh token for JWT sessions
type RefreshToken struct {
	ID        int       `json:"id" bun:"id,pk,autoincrement"`
	UserID    int       `json:"user_id" bun:"user_id"`
	TokenHash string    `json:"-" bun:"token_hash"`
	ExpiresAt time.Time `json:"expires_at" bun:"expires_at"`
	CreatedAt time.Time `json:"created_at" bun:"created_at"`
}

// PasswordResetToken represents a password reset token
type PasswordResetToken struct {
	ID        int       `json:"id" bun:"id,pk,autoincrement"`
	UserID    int       `json:"user_id" bun:"user_id"`
	TokenHash string    `json:"-" bun:"token_hash"`
	ExpiresAt time.Time `json:"expires_at" bun:"expires_at"`
	CreatedAt time.Time `json:"created_at" bun:"created_at"`
}

// LoginRequest represents a login request
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

// RegisterRequest represents a registration request
type RegisterRequest struct {
	Email     string  `json:"email" validate:"required,email"`
	Password  string  `json:"password" validate:"required,min=6"`
	FirstName *string `json:"first_name,omitempty"`
	LastName  *string `json:"last_name,omitempty"`
}

// AuthResponse represents the response after successful authentication
type AuthResponse struct {
	User         User   `json:"user"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
}

// RefreshTokenRequest represents a refresh token request
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// PasswordResetRequest represents a password reset request
type PasswordResetRequest struct {
	Email string `json:"email" validate:"required,email"`
}

// PasswordResetConfirmRequest represents a password reset confirmation
type PasswordResetConfirmRequest struct {
	Token    string `json:"token" validate:"required"`
	Password string `json:"password" validate:"required,min=6"`
}

// ChangePasswordRequest represents a change password request
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=6"`
}

// UpdateProfileRequest represents an update profile request
type UpdateProfileRequest struct {
	Email     string `json:"email" validate:"required,email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

// VerifyEmailRequest represents a verify email request
type VerifyEmailRequest struct {
	Token string `json:"token" validate:"required"`
}

// VerificationToken represents a verification token
type VerificationToken struct {
	ID        int        `bun:"id,pk,autoincrement" json:"id"`
	UserID    int        `bun:"user_id" json:"user_id"`
	Token     string     `bun:"token" json:"token"`
	TokenType string     `bun:"token_type" json:"token_type"`
	Email     string     `bun:"email" json:"email"`
	ExpiresAt time.Time  `bun:"expires_at" json:"expires_at"`
	UsedAt    *time.Time `bun:"used_at" json:"used_at"`
	CreatedAt time.Time  `bun:"created_at" json:"created_at"`
	UpdatedAt time.Time  `bun:"updated_at" json:"updated_at"`
}

// JWT Claims represents the JWT token claims
type JWTClaims struct {
	UserID   int    `json:"user_id"`
	Email    string `json:"email"`
	Type     string `json:"type"` // "access" or "refresh"
	DeviceID string `json:"device_id"`
}

// UserSession represents a user's device/session
type UserSession struct {
	ID         int       `json:"id" bun:"id,pk,autoincrement"`
	UserID     int       `json:"user_id" bun:"user_id"`
	DeviceID   string    `json:"device_id" bun:"device_id"`
	DeviceName string    `json:"device_name" bun:"device_name"`
	DeviceType string    `json:"device_type" bun:"device_type"`
	UserAgent  string    `json:"user_agent" bun:"user_agent"`
	IPAddress  string    `json:"ip_address" bun:"ip_address"`
	LastActive time.Time `json:"last_active" bun:"last_active"`
	CreatedAt  time.Time `json:"created_at" bun:"created_at"`
	ExpiresAt  time.Time `json:"expires_at" bun:"expires_at"`
	IsActive   bool      `json:"is_active" bun:"is_active"`
}
