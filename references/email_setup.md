# Email Setup Guide

## Current Implementation

The subscription system currently **logs emails to the console** for testing purposes. The email content is generated and displayed in the backend logs when a user successfully subscribes.

## Testing the Email Flow

1. **Start the backend**:
   ```bash
   ./start-backend.sh
   ```

2. **Start the frontend**:
   ```bash
   ./start-frontend.sh
   ```

3. **Complete a test subscription**:
   - Navigate to http://localhost:5173
   - Click "Subscribe"
   - Fill in the form
   - Accept terms and conditions
   - Click "Proceed to Payment"
   - Wait for payment processing (2 seconds)

4. **Check the backend logs** (in the terminal running `./start-backend.sh`):
   ```
   [subscription] New subscription:
     Name: John Doe
     Email: john@example.com
     Phone: +1 555-0000
     Location: 123 Main St, New York, United States
   [email] Would send email to: john@example.com
   [email] Subject: Welcome to Scripture Daily!
   [email] Body:
   Dear John Doe,

   Thank you for subscribing to Scripture Daily!
   ...
   ```

5. **Check browser console** (Developer Tools → Console):
   - The email content is also logged to the browser console
   - Look for "=== SUBSCRIPTION EMAIL ==="

## Production Email Integration

To send actual emails in production, integrate one of these services:

### Option 1: SMTP (Simple Mail Transfer Protocol)

Use Go's built-in `net/smtp` package:

```go
import "net/smtp"

func sendEmail(to, subject, body string) error {
    from := "noreply@scripturedaily.com"
    password := os.Getenv("SMTP_PASSWORD")

    smtpHost := "smtp.gmail.com"
    smtpPort := "587"

    message := []byte("To: " + to + "\r\n" +
        "Subject: " + subject + "\r\n" +
        "\r\n" +
        body + "\r\n")

    auth := smtp.PlainAuth("", from, password, smtpHost)

    return smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{to}, message)
}
```

**Environment variables needed:**
- `SMTP_HOST` - SMTP server (e.g., smtp.gmail.com)
- `SMTP_PORT` - SMTP port (usually 587)
- `SMTP_USER` - Your email address
- `SMTP_PASSWORD` - Your email password or app-specific password

### Option 2: SendGrid (Recommended)

SendGrid offers 100 free emails/day.

1. **Sign up** at https://sendgrid.com
2. **Get API key** from Settings → API Keys
3. **Install SendGrid Go library**:
   ```bash
   cd backend
   go get github.com/sendgrid/sendgrid-go
   ```

4. **Update code**:
   ```go
   import (
       "github.com/sendgrid/sendgrid-go"
       "github.com/sendgrid/sendgrid-go/helpers/mail"
   )

   func sendEmail(to, subject, body string) error {
       from := mail.NewEmail("Scripture Daily", "noreply@scripturedaily.com")
       recipient := mail.NewEmail("", to)
       message := mail.NewSingleEmail(from, subject, recipient, body, body)

       client := sendgrid.NewSendClient(os.Getenv("SENDGRID_API_KEY"))
       _, err := client.Send(message)
       return err
   }
   ```

**Environment variable needed:**
- `SENDGRID_API_KEY` - Your SendGrid API key

### Option 3: Mailgun

Mailgun offers 5,000 free emails/month for 3 months.

1. **Sign up** at https://www.mailgun.com
2. **Get API key** from Settings → API Keys
3. **Install Mailgun Go library**:
   ```bash
   cd backend
   go get github.com/mailgun/mailgun-go/v4
   ```

4. **Update code**:
   ```go
   import "github.com/mailgun/mailgun-go/v4"

   func sendEmail(to, subject, body string) error {
       mg := mailgun.NewMailgun("yourdomain.com", os.Getenv("MAILGUN_API_KEY"))
       message := mg.NewMessage(
           "Scripture Daily <noreply@yourdomain.com>",
           subject,
           body,
           to,
       )

       _, _, err := mg.Send(context.Background(), message)
       return err
   }
   ```

**Environment variables needed:**
- `MAILGUN_API_KEY` - Your Mailgun API key
- `MAILGUN_DOMAIN` - Your verified domain

## Implementing Email Service

To replace the console logs with actual email sending:

1. Choose an email service (SendGrid recommended for ease of use)

2. Update `backend/cmd/api/main.go` at line 107:
   ```go
   // Replace this comment:
   // TODO: Send actual email using SMTP, SendGrid, Mailgun, etc.

   // With actual email sending:
   err := sendEmail(data.Email, emailContent["subject"], emailContent["body"])
   if err != nil {
       log.Printf("[email] Failed to send: %v", err)
       http.Error(w, `{"error":"email_failed"}`, http.StatusInternalServerError)
       return
   }
   ```

3. Set environment variables:
   ```bash
   export SENDGRID_API_KEY="your-api-key-here"
   ```

4. Restart the backend

## Email Template Customization

The email template is in `backend/cmd/api/main.go` starting at line 109. You can customize:

- **Subject line**: `"subject": "Welcome to Scripture Daily!"`
- **Email body**: The multiline string in the `"body"` field
- **Sender info**: Update "support@net1io.com" to your actual support email

## Testing Production Emails

1. Use a test email service like [Mailtrap](https://mailtrap.io) to catch emails without sending to real addresses
2. Or use your personal email for initial testing
3. Check spam folder if emails don't appear in inbox
4. Verify SPF, DKIM, and DMARC records are set up for your domain

## Troubleshooting

### Email not showing in logs
- Check that backend is running (`./start-backend.sh`)
- Check that payment completes successfully
- Look for `[email]` prefix in backend logs

### Email API returns error
- Check browser console for error messages
- Verify backend is running on port 8080
- Check CORS is properly configured

### Production emails go to spam
- Set up SPF records for your domain
- Use a verified domain with your email service
- Add unsubscribe link to emails
- Avoid spam trigger words in subject/body

---

**Current Status**: Email content is logged to console for testing. Follow this guide to enable actual email sending in production.

Developed by Net1io.com
Copyright (C) Reserved 2025
