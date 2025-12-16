package email

import (
	"fmt"
	"net/smtp"
	"os"
	"strings"
)

// Config holds email configuration
type Config struct {
	SMTPHost     string
	SMTPPort     string
	SMTPUser     string
	SMTPPassword string
	FromEmail    string
	FromName     string
}

// LoadConfig loads email configuration from environment variables
func LoadConfig() *Config {
	return &Config{
		SMTPHost:     getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:     getEnv("SMTP_PORT", "587"),
		SMTPUser:     getEnv("SMTP_USER", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		FromEmail:    getEnv("FROM_EMAIL", getEnv("SMTP_USER", "noreply@scripturedaily.com")),
		FromName:     getEnv("FROM_NAME", "Scripture Daily"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// SendEmail sends an email using SMTP
func SendEmail(cfg *Config, to, subject, body string) error {
	// Check if SMTP is configured
	if cfg.SMTPUser == "" || cfg.SMTPPassword == "" {
		return fmt.Errorf("SMTP not configured - set SMTP_USER and SMTP_PASSWORD environment variables")
	}

	// Prepare email headers and body
	from := fmt.Sprintf("%s <%s>", cfg.FromName, cfg.FromEmail)
	msg := []byte(
		"From: " + from + "\r\n" +
			"To: " + to + "\r\n" +
			"Subject: " + subject + "\r\n" +
			"MIME-Version: 1.0\r\n" +
			"Content-Type: text/plain; charset=\"UTF-8\"\r\n" +
			"\r\n" +
			body + "\r\n")

	// Set up authentication
	auth := smtp.PlainAuth("", cfg.SMTPUser, cfg.SMTPPassword, cfg.SMTPHost)

	// Send email
	addr := cfg.SMTPHost + ":" + cfg.SMTPPort
	err := smtp.SendMail(addr, auth, cfg.FromEmail, []string{to}, msg)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

// SendWelcomeEmail sends a welcome email to new subscribers
func SendWelcomeEmail(cfg *Config, name, email string) error {
	subject := "Welcome to Scripture Daily!"
	body := fmt.Sprintf(`Dear %s,

Thank you for subscribing to Scripture Daily!

You will now receive daily scripture passages from the Qur'an, Torah, Bible, and Human Design,
along with thematic summaries delivered to your inbox every day.

Your subscription details:
- Name: %s
- Email: %s

What to expect:
✓ Daily scripture passages from multiple traditions
✓ Thematic connections and insights
✓ Delivered fresh to your inbox each morning

If you have any questions or need support, please contact us at support@net1io.com

Best regards,
The Scripture Daily Team

---
Developed by Net1io.com
Copyright (C) Reserved 2025

To unsubscribe, please contact support@net1io.com
`, name, name, email)

	return SendEmail(cfg, email, subject, body)
}

// Daily represents the daily scripture payload
type Daily struct {
	Date    string            `json:"date"`
	Area    string            `json:"area"`
	Quran   map[string]string `json:"quran"`
	Torah   map[string]string `json:"torah"`
	Bible   map[string]string `json:"bible"`
	HD      map[string]string `json:"human_design"`
	Summary string            `json:"summary"`
}

// SendDailyScriptureEmail sends the daily scripture to a subscriber
func SendDailyScriptureEmail(cfg *Config, toEmail string, daily *Daily) error {
	subject := fmt.Sprintf("Scripture Daily - %s: %s", daily.Date, strings.Title(daily.Area))

	body := fmt.Sprintf(`Scripture Daily for %s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOPIC OF TODAY: %s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUR'AN (%s)
%s

TORAH (%s)
%s

BIBLE (%s)
%s

HUMAN DESIGN (%s)
%s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMMON GROUND
%s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for being part of Scripture Daily.

Visit us at: https://scripturedaily.com
View archive: https://scripturedaily.com/post/%s

---
Developed by Net1io.com
Copyright (C) Reserved 2025

To unsubscribe, please contact support@net1io.com
`,
		daily.Date,
		strings.ToUpper(daily.Area),
		daily.Quran["ref"], daily.Quran["text"],
		daily.Torah["ref"], daily.Torah["text"],
		daily.Bible["ref"], daily.Bible["text"],
		daily.HD["ref"], daily.HD["text"],
		daily.Summary,
		daily.Date,
	)

	return SendEmail(cfg, toEmail, subject, body)
}
