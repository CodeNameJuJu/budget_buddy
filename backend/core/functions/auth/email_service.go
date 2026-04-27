package auth

import (
	"fmt"
	"os"

	"github.com/resendlabs/resend-go"
)

// EmailService handles email-related operations
type EmailService struct {
	client *resend.Client
}

func NewEmailService() *EmailService {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		fmt.Println("Warning: RESEND_API_KEY not set, emails will not be sent")
	}
	return &EmailService{
		client: resend.NewClient(apiKey),
	}
}

// SendVerificationEmail sends a verification email to the user
func (e *EmailService) SendVerificationEmail(email string, token string) error {
	// TODO: Implement verification email sending
	return nil
}

// SendPasswordResetEmail sends a password reset email to the user
func (e *EmailService) SendPasswordResetEmail(email string, token string) error {
	// TODO: Implement password reset email sending
	return nil
}

// VerifyToken verifies a verification token
func (e *EmailService) VerifyToken(token string, tokenType string) (int, error) {
	// TODO: Implement token verification
	return 0, nil
}

// getVerificationEmailTemplate returns the HTML template for verification email
func (e *EmailService) getVerificationEmailTemplate(token string) string {
	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%%, #059669 100%%); color: white; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 5px; }
        .button { display: inline-block; padding: 15px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Bêre Bietjie</h1>
        </div>
        <div class="content">
            <h2>Verify Your Email</h2>
            <p>Thank you for signing up for Bêre Bietjie! Please click the button below to verify your email address:</p>
            <a href="https://budgetbuddy-production-b70f.up.railway.app/verify?token=%s" class="button">Verify Email</a>
            <p>Or copy and paste this link into your browser:</p>
            <p>https://budgetbuddy-production-b70f.up.railway.app/verify?token=%s</p>
            <p>This link will expire in 24 hours.</p>
        </div>
        <div class="footer">
            <p>If you didn't create an account with Bêre Bietjie, please ignore this email.</p>
        </div>
    </div>
</body>
</html>
`, token, token)
}
