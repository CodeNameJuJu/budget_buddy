package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/julian/budget-buddy/core/db"
	"github.com/julian/budget-buddy/utils/types"
)

const (
	AccessTokenDuration  = 15 * time.Minute
	RefreshTokenDuration = 7 * 24 * time.Hour
	TokenResetDuration   = 1 * time.Hour
)

type AuthService struct {
	jwtSecret []byte
}

func NewAuthService() *AuthService {
	// Get JWT secret from environment or use a default for development
	secret := []byte("your-super-secret-jwt-key-change-in-production")
	if envSecret := []byte(getEnv("JWT_SECRET", "")); len(envSecret) > 0 {
		secret = envSecret
	}

	return &AuthService{
		jwtSecret: secret,
	}
}

// HashPassword hashes a password using bcrypt
func (s *AuthService) HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}
	return string(hash), nil
}

// VerifyPassword verifies a password against its hash
func (s *AuthService) VerifyPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// GenerateTokens generates both access and refresh tokens
func (s *AuthService) GenerateTokens(user *types.User) (string, string, error) {
	// Generate access token
	accessToken, err := s.generateToken(user, "access", AccessTokenDuration)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate access token: %w", err)
	}

	// Generate refresh token
	refreshToken, err := s.generateToken(user, "refresh", RefreshTokenDuration)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return accessToken, refreshToken, nil
}

// generateToken generates a JWT token
func (s *AuthService) generateToken(user *types.User, tokenType string, duration time.Duration) (string, error) {
	claims := jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"type":    tokenType,
		"exp":     time.Now().Add(duration).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

// ValidateToken validates a JWT token and returns the claims
func (s *AuthService) ValidateToken(tokenString string) (*types.JWTClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userID, ok := claims["user_id"].(float64)
		if !ok {
			return nil, fmt.Errorf("invalid user_id in token")
		}

		email, ok := claims["email"].(string)
		if !ok {
			return nil, fmt.Errorf("invalid email in token")
		}

		tokenType, ok := claims["type"].(string)
		if !ok {
			return nil, fmt.Errorf("invalid token type in token")
		}

		return &types.JWTClaims{
			UserID: int(userID),
			Email:  email,
			Type:   tokenType,
		}, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// GenerateSecureToken generates a secure random token
func (s *AuthService) GenerateSecureToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate secure token: %w", err)
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}

// StoreRefreshToken stores a refresh token in the database
func (s *AuthService) StoreRefreshToken(userID int, tokenHash string, expiresAt time.Time) error {
	database := db.GetDb()
	if database == nil {
		return fmt.Errorf("database not connected")
	}

	refreshToken := &types.RefreshToken{
		UserID:    userID,
		TokenHash: tokenHash,
		ExpiresAt: expiresAt,
	}

	_, err := database.NewInsert().Model(refreshToken).Exec(context.Background())
	if err != nil {
		return fmt.Errorf("failed to store refresh token: %w", err)
	}

	return nil
}

// ValidateRefreshToken validates a refresh token against the database
func (s *AuthService) ValidateRefreshToken(tokenString string) (*types.RefreshToken, error) {
	database := db.GetDb()
	if database == nil {
		return nil, fmt.Errorf("database not connected")
	}

	// Hash the token for comparison
	tokenHash := s.hashToken(tokenString)

	var refreshToken types.RefreshToken
	err := database.NewSelect().
		Model(&refreshToken).
		Where("token_hash = ? AND expires_at > ?", tokenHash, time.Now()).
		Scan(context.Background())

	if err != nil {
		return nil, fmt.Errorf("invalid or expired refresh token: %w", err)
	}

	return &refreshToken, nil
}

// RevokeRefreshToken revokes a refresh token
func (s *AuthService) RevokeRefreshToken(tokenID int) error {
	database := db.GetDb()
	if database == nil {
		return fmt.Errorf("database not connected")
	}

	_, err := database.NewDelete().
		Model((*types.RefreshToken)(nil)).
		Where("id = ?", tokenID).
		Exec(context.Background())

	if err != nil {
		return fmt.Errorf("failed to revoke refresh token: %w", err)
	}

	return nil
}

// RevokeAllUserTokens revokes all refresh tokens for a user
func (s *AuthService) RevokeAllUserTokens(userID int) error {
	database := db.GetDb()
	if database == nil {
		return fmt.Errorf("database not connected")
	}

	_, err := database.NewDelete().
		Model((*types.RefreshToken)(nil)).
		Where("user_id = ?", userID).
		Exec(context.Background())

	if err != nil {
		return fmt.Errorf("failed to revoke user tokens: %w", err)
	}

	return nil
}

// hashToken creates a hash of the token for storage
func (s *AuthService) hashToken(token string) string {
	// For simplicity, we'll use bcrypt to hash the token
	// In production, you might want to use a different approach
	hash, _ := bcrypt.GenerateFromPassword([]byte(token), bcrypt.DefaultCost)
	return string(hash)
}

// getEnv gets an environment variable with a default value
func getEnv(key, defaultValue string) string {
	if value := getEnvDirect(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvDirect gets an environment variable
func getEnvDirect(key string) string {
	return os.Getenv(key)
}
