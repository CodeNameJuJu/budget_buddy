package auth

import (
	"testing"
	"time"

	"github.com/CodeNameJuJu/budget_buddy/utils/types"
)

func newTestAuthService(t *testing.T) *AuthService {
	t.Helper()
	t.Setenv("JWT_SECRET", "test-secret")
	return NewAuthService()
}

func testUser() *types.User {
	return &types.User{
		ID:    42,
		Email: "test@example.com",
	}
}

func TestGenerateAndValidateToken(t *testing.T) {
	service := newTestAuthService(t)

	accessToken, refreshToken, err := service.GenerateTokens(testUser(), "device-123")
	if err != nil {
		t.Fatalf("GenerateTokens returned error: %v", err)
	}

	claims, err := service.ValidateToken(accessToken)
	if err != nil {
		t.Fatalf("ValidateToken returned error: %v", err)
	}

	if claims.UserID != 42 {
		t.Errorf("expected user ID 42, got %d", claims.UserID)
	}
	if claims.Email != "test@example.com" {
		t.Errorf("expected email test@example.com, got %s", claims.Email)
	}
	if claims.Type != "access" {
		t.Errorf("expected token type access, got %s", claims.Type)
	}
	if claims.DeviceID != "device-123" {
		t.Errorf("expected device ID device-123, got %s", claims.DeviceID)
	}

	refreshClaims, err := service.ValidateToken(refreshToken)
	if err != nil {
		t.Fatalf("ValidateToken on refresh token returned error: %v", err)
	}
	if refreshClaims.Type != "refresh" {
		t.Errorf("expected token type refresh, got %s", refreshClaims.Type)
	}
}

func TestValidateTokenRejectsExpired(t *testing.T) {
	service := newTestAuthService(t)

	expiredToken, err := service.generateToken(testUser(), "access", -1*time.Minute, "device-123")
	if err != nil {
		t.Fatalf("generateToken returned error: %v", err)
	}

	if _, err := service.ValidateToken(expiredToken); err == nil {
		t.Error("expected ValidateToken to reject an expired token")
	}
}

func TestExtractClaimsIgnoringExpiry(t *testing.T) {
	service := newTestAuthService(t)

	expiredToken, err := service.generateToken(testUser(), "access", -1*time.Minute, "device-123")
	if err != nil {
		t.Fatalf("generateToken returned error: %v", err)
	}

	claims, err := service.ExtractClaimsIgnoringExpiry(expiredToken)
	if err != nil {
		t.Fatalf("ExtractClaimsIgnoringExpiry returned error: %v", err)
	}

	if claims.DeviceID != "device-123" {
		t.Errorf("expected device ID device-123, got %s", claims.DeviceID)
	}
	if claims.UserID != 42 {
		t.Errorf("expected user ID 42, got %d", claims.UserID)
	}
}

func TestExtractClaimsRejectsTamperedToken(t *testing.T) {
	service := newTestAuthService(t)

	token, _, err := service.GenerateTokens(testUser(), "device-123")
	if err != nil {
		t.Fatalf("GenerateTokens returned error: %v", err)
	}

	tampered := token[:len(token)-2] + "xx"
	if _, err := service.ExtractClaimsIgnoringExpiry(tampered); err == nil {
		t.Error("expected ExtractClaimsIgnoringExpiry to reject a tampered token")
	}
}

func TestHashPasswordAndVerify(t *testing.T) {
	service := newTestAuthService(t)

	hash, err := service.HashPassword("correct-horse")
	if err != nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}

	if !service.VerifyPassword("correct-horse", hash) {
		t.Error("expected password to verify against its hash")
	}
	if service.VerifyPassword("wrong-password", hash) {
		t.Error("expected wrong password to fail verification")
	}
}

func TestHashTokenDeterministic(t *testing.T) {
	service := newTestAuthService(t)

	first := service.hashToken("some-token")
	second := service.hashToken("some-token")
	other := service.hashToken("other-token")

	if first != second {
		t.Error("expected hashToken to be deterministic")
	}
	if first == other {
		t.Error("expected different tokens to produce different hashes")
	}
}
