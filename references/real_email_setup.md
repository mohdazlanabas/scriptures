# Real Email Setup Guide - Scripture Daily

## Overview

The backend is now configured to send **real emails** using SMTP. You just need to set up your email credentials.

## Quick Setup with Gmail (Recommended for Testing)

### Step 1: Create Gmail App Password

**IMPORTANT: You MUST complete this step to receive emails locally!**

1. **Go to your Google Account**: https://myaccount.google.com/apppasswords
   - Or navigate: https://myaccount.google.com → Security → 2-Step Verification → App passwords

2. **Enable 2-Factor Authentication** (if not already enabled):
   - Go to Security → 2-Step Verification
   - Follow the setup process
   - **You MUST have 2FA enabled to create App Passwords**

3. **Create App Password**:
   - Go to Security → 2-Step Verification → App passwords
   - Select app: "Mail"
   - Select device: "Other" → Enter "Scripture Daily"
   - Click "Generate"
   - **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)
   - **Save this password - you'll need it in the next step!**

### Step 2: Configure start-backend.sh

**Edit the file `start-backend.sh` in your project root** and replace these three lines (around lines 23-25):

**BEFORE (placeholder values):**
```bash
export SMTP_USER="your-email@gmail.com"           # ← CHANGE THIS
export SMTP_PASSWORD="xxxx xxxx xxxx xxxx"        # ← CHANGE THIS
export FROM_EMAIL="your-email@gmail.com"           # ← CHANGE THIS
```

**AFTER (your actual credentials):**
```bash
export SMTP_USER="youractual@gmail.com"           # ← Your real Gmail address
export SMTP_PASSWORD="abcd efgh ijkl mnop"        # ← The App Password from Step 1
export FROM_EMAIL="youractual@gmail.com"           # ← Same as SMTP_USER
```

**Example:**
If your Gmail is `john.doe@gmail.com` and your App Password is `wxyz abcd 1234 5678`:

```bash
export SMTP_USER="john.doe@gmail.com"
export SMTP_PASSWORD="wxyz abcd 1234 5678"
export FROM_EMAIL="john.doe@gmail.com"
export FROM_NAME="Scripture Daily"
```

**CRITICAL:** The App Password has **spaces** - include them exactly as shown by Google!

### Step 3: Restart Backend

Stop your backend (Ctrl+C) and restart it:

```bash
./start-backend.sh
```

**VERIFY EMAIL IS CONFIGURED:**

Look for this line in the startup logs:
```
[email] SMTP configured for youractual@gmail.com
```

**If you see this instead, it means the credentials are NOT set:**
```
[email] SMTP not configured - emails will be logged only
```

**Troubleshooting:**
- Make sure you edited `start-backend.sh` and saved the file
- Make sure you restarted the backend AFTER editing
- Check that there are no typos in your email or App Password
- The App Password should have spaces: `abcd efgh ijkl mnop` NOT `abcdefghijklmnop`

### Step 4: Test It!

**Testing Welcome Email (Subscription Confirmation):**

1. Go to http://localhost:5173
2. Click "Subscribe" button (top right)
3. Fill in the form with YOUR real email address
4. Agree to terms and click "Proceed to Payment"
5. Enter any 16-digit card number (e.g., `4242 4242 4242 4242`)
6. Fill in cardholder name, expiry (e.g., `12/25`), CVV (e.g., `123`)
7. Click "Pay $9.99/month"
8. Wait for "Payment Successful" message
9. **Check your Gmail inbox!** You should receive a welcome email

**Testing Daily Scripture Email:**

You can also test the daily scripture email with this command:

```bash
curl -X POST http://localhost:8080/api/send-daily \
  -H "Content-Type: application/json" \
  -d '{"email": "youractual@gmail.com"}'
```

Replace `youractual@gmail.com` with your real email address.

**Expected Result:** You'll receive an email with today's scripture passages from all four sources!

---

**IMPORTANT:** Emails work **locally** - you do NOT need to deploy to production to test! Gmail SMTP works from anywhere.

## How to Send Daily Scripture Emails

### Option 1: Manual API Call (Testing)

Send today's scripture to any email:

```bash
curl -X POST http://localhost:8080/api/send-daily \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com"}'
```

### Option 2: Automated Daily Emails (Production)

Set up a cron job or scheduled task:

**On macOS/Linux** (add to crontab):
```bash
# Send daily scripture at 6 AM every day
0 6 * * * curl -X POST http://localhost:8080/api/send-daily -H "Content-Type: application/json" -d '{"email": "subscriber@email.com"}'
```

**Better: Use a subscriber database** (future enhancement):
- Store subscriber emails in database
- Create a script that loops through all subscribers
- Send daily scripture to each one

## Alternative Email Services

### SendGrid (100 free emails/day)

1. Sign up: https://sendgrid.com
2. Get API key from Settings → API Keys
3. Install Go library:
   ```bash
   cd backend
   go get github.com/sendgrid/sendgrid-go
   ```

4. Update `backend/internal/email/email.go` to use SendGrid API instead of SMTP

### Mailgun (5,000 free emails/month for 3 months)

1. Sign up: https://www.mailgun.com
2. Verify your domain
3. Get API key
4. Similar integration to SendGrid

### AWS SES (Very cheap, $0.10 per 1,000 emails)

1. Sign up for AWS
2. Verify email/domain in SES
3. Use AWS SDK for Go

## Troubleshooting

### "SMTP not configured" message

**Problem**: Environment variables not set

**Solution**: Make sure you've exported the variables and restarted the backend

```bash
echo $SMTP_USER  # Should show your email
```

### "Email send failed: 535 Authentication failed"

**Problem**: Wrong password or app password not created

**Solutions**:
1. Double-check you're using the **App Password**, not your regular Gmail password
2. Make sure there are no extra spaces in the password
3. Recreate the App Password if needed

### "Email send failed: 534 Please log in via your web browser"

**Problem**: Gmail security block

**Solutions**:
1. Go to https://accounts.google.com/DisplayUnlockCaptcha
2. Click "Continue"
3. Try sending email again

### Emails go to spam

**Solutions**:
1. Ask recipients to mark as "Not Spam"
2. Set up SPF records for your domain (production only)
3. Use a professional email service like SendGrid
4. Warm up your email by sending gradually (start with 10/day)

### "Connection refused" or timeout errors

**Problem**: Firewall blocking port 587

**Solutions**:
1. Check if port 587 is open: `nc -zv smtp.gmail.com 587`
2. Try port 465 (SSL) instead
3. Check your network/firewall settings

## Email Content

### Welcome Email
Sent when user subscribes. Contains:
- Personalized greeting
- Subscription confirmation
- What to expect
- Support contact

### Daily Scripture Email
Sent daily (or on-demand). Contains:
- Today's date and topic
- Qur'an passage with reference
- Torah passage with reference
- Bible passage with reference
- Human Design passage with reference
- Common Ground summary
- Link to website

## Testing Checklist

- [ ] Set SMTP environment variables
- [ ] Restart backend
- [ ] See "SMTP configured" in logs
- [ ] Subscribe with YOUR email
- [ ] Receive welcome email in inbox
- [ ] Test daily scripture endpoint
- [ ] Receive daily scripture email

## Production Deployment

When deploying to production:

1. **Use environment variables** (don't commit credentials!)
2. **Set up email service** (SendGrid/Mailgun recommended)
3. **Configure proper FROM address** (use your domain)
4. **Set up SPF/DKIM records** for your domain
5. **Monitor email delivery** rates
6. **Handle unsubscribes** properly
7. **Respect email limits** (don't spam!)

## Current Endpoints

### POST `/api/subscribe/email`
Sends welcome email to new subscriber
- Requires: `fullName`, `email`
- Returns: Success status and email info

### POST `/api/send-daily`
Sends today's scripture to an email
- Requires: `email`
- Returns: Success status and date

## Next Steps

1. **Create subscriber database table**
2. **Add subscribe/unsubscribe management**
3. **Create daily email scheduler script**
4. **Set up proper email analytics**
5. **Add email templates (HTML)**

---

**Ready to send real emails!** 📧

Questions? Check the logs or contact support.

Developed by Net1io.com
Copyright (C) Reserved 2025
