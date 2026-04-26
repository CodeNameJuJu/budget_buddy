package auth

import (
	"context"
	"fmt"
	"time"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
)

// EmailService handles email-related operations
type EmailService struct{}

func NewEmailService() *EmailService {
	return &EmailService{}
}

// SendVerificationEmail sends a verification email to the user
func (s *EmailService) SendVerificationEmail(userID int, email string, token string) error {
	database := db.GetDb()
	if database == nil {
		return fmt.Errorf("database not connected")
	}

	// Store the verification token
	expiresAt := time.Now().Add(24 * time.Hour) // Token expires in 24 hours
	
	verificationToken := types.VerificationToken{
		UserID:    userID,
		Token:     token,
		TokenType: "email_verification",
		Email:     email,
		ExpiresAt: expiresAt,
	}

	_, err := database.NewInsert().
		Model(&verificationToken).
		Exec(context.Background())

	if err != nil {
		return fmt.Errorf("failed to store verification token: %w", err)
	}

	// In a real implementation, you would send an actual email here
	// For now, we'll just log it
	fmt.Printf("Verification email sent to %s with token: %s\n", email, token)
	fmt.Printf("Verification link: https://budgetbuddy-production-b70f.up.railway.app/verify?token=%s\n", token)

	// TODO: Integrate with an email service like SendGrid, AWS SES, or Mailgun
	// Example:
	// err = s.sendEmailViaSES(email, "Verify your email", s.getVerificationEmailTemplate(token))
	// if err != nil {
	//     return fmt.Errorf("failed to send email: %w", err)
	// }

	return nil
}

// VerifyToken verifies a verification token
func (s *EmailService) VerifyToken(token string, tokenType string) (int, error) {
	database := db.GetDb()
	if database == nil {
		return 0, fmt.Errorf("database not connected")
	}

	var verificationToken types.VerificationToken
	err := database.NewSelect().
		Model(&verificationToken).
		Where("token = ? AND token_type = ? AND used_at IS NULL AND expires_at > ?", token, tokenType, time.Now()).
		Scan(context.Background())

	if err != nil {
		return 0, fmt.Errorf("invalid or expired token")
	}

	// Mark token as used
	now := time.Now()
	_, err = database.NewUpdate().
		Model(&types.VerificationToken{}).
		Set("used_at = ?", now).
		Set("updated_at = ?", now).
		Where("id = ?", verificationToken.ID).
		Exec(context.Background())

	if err != nil {
		return 0, fmt.Errorf("failed to mark token as used: %w", err)
	}

	return verificationToken.UserID, nil
}

// getVerificationEmailTemplate returns the HTML template for verification email
func (s *EmailService) getVerificationEmailTemplate(token string) string {
	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 5px; }
        .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Budget Buddy</h1>
        </div>
        <div class="content">
            <h2>Verify Your Email</h2>
            <p>Thank you for signing up for Budget Buddy! Please click the button below to verify your email address:</p>
            <a href="https://budgetbuddy-production-b70f.up.railway.app/verify?token=%s" class="button">Verify Email</a>
            <p>Or copy and paste this link into your browser:</p>
            <p>https://budgetbuddy-production-b70f.up.railway.app/verify?token=%s</p>
            <p>This link will expire in 24 hours.</p>
        </div>
        <div class="footer">
            <p>If you didn't create an account with Budget Buddy, please ignore this email.</p>
        </div>
    </div>
</body>
</html>
`, token, token)
}
