# Scripture Daily - Deployment Plan

## Overview
This document outlines the remaining tasks to deploy Scripture Daily to production on Google Cloud Platform (GCP).

---

## Phase 1: Local Testing (Complete Before Deployment)

### 1.1 Configure Email Service ⬜
**Status:** Pending - User action required
**Guide:** See [REAL_EMAIL_SETUP.md](REAL_EMAIL_SETUP.md)

**Steps:**
1. Get Gmail App Password
   - Go to https://myaccount.google.com/apppasswords
   - Enable 2-Factor Authentication if not already enabled
   - Create App Password for "Scripture Daily"
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

2. Configure `start-backend.sh`
   - Edit lines 23-25
   - Replace `your-email@gmail.com` with actual Gmail
   - Replace `xxxx xxxx xxxx xxxx` with App Password
   - Save file

3. Restart backend
   ```bash
   ./start-backend.sh
   ```

4. Verify in logs:
   ```
   [email] SMTP configured for youremail@gmail.com
   ```

**Success Criteria:**
- Backend logs show "SMTP configured" message
- No errors on startup

---

### 1.2 Test Email Functionality (Local) ⬜
**Status:** Pending - Depends on 1.1
**Prerequisites:** Email configured (1.1)

**Test 1: Welcome Email (Subscription Confirmation)**
1. Go to http://localhost:5173
2. Click "Subscribe" button
3. Fill form with YOUR real email
4. Complete payment (use card: `4242 4242 4242 4242`)
5. Check Gmail inbox for welcome email

**Expected Result:**
- Email subject: "Welcome to Scripture Daily!"
- Email from: Scripture Daily
- Contains welcome message and subscription details

**Test 2: Daily Scripture Email**
```bash
curl -X POST http://localhost:8080/api/send-daily \
  -H "Content-Type: application/json" \
  -d '{"email": "youremail@gmail.com"}'
```

**Expected Result:**
- Email subject: "Scripture Daily - 2025-12-16: JUSTICE"
- Contains Qur'an, Torah, Bible, Human Design passages
- Contains Common Ground summary

**Success Criteria:**
- Both emails received in inbox
- Emails are properly formatted
- All content displays correctly

---

### 1.3 Test Payment Flow (Local) ⬜
**Status:** Pending
**Prerequisites:** Email configured (1.1)

**Full Flow Test:**
1. Navigate to http://localhost:5173
2. Click "Subscribe" button
3. Fill in subscription form:
   - Full Name
   - Email
   - Phone (optional)
   - Address, City, Country (optional)
4. Agree to Terms & Conditions
5. Click "Proceed to Payment"
6. Fill payment form:
   - Card Number: `4242 4242 4242 4242`
   - Name: Any name
   - Expiry: `12/25`
   - CVV: `123`
7. Click "Pay $9.99/month"
8. Wait for processing
9. Verify "Payment Successful" screen
10. Check email for confirmation

**Success Criteria:**
- No errors during flow
- Payment success message displays
- Email received
- User redirected to success page

---

### 1.4 Test Database (Local) ✅
**Status:** Complete - Already working
**Database:** PostgreSQL 16 in Docker

**Verify:**
```bash
docker compose ps
```

**Expected:**
- Database status: "Up"
- Port 5432 accessible

**API Test:**
```bash
curl http://localhost:8080/api/today
```

**Expected:**
- Returns today's scripture JSON
- No database errors

**Success Criteria:**
- Database running and accessible
- API returns data successfully
- Visitor count incrementing

---

## Phase 2: Production Deployment to GCP

### 2.1 Prepare for Deployment ⬜
**Status:** Not started

**Tasks:**
1. Choose GCP services:
   - **Option A:** Cloud Run (recommended - serverless, auto-scaling)
   - **Option B:** Compute Engine (VM - more control)
   - **Option C:** App Engine (platform-as-a-service)

2. Set up PostgreSQL:
   - **Option A:** Cloud SQL for PostgreSQL (managed)
   - **Option B:** Self-hosted on Compute Engine

3. Set up environment variables in GCP:
   - `DATABASE_URL` (production database)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
   - `FROM_EMAIL`, `FROM_NAME`
   - `PORT` (default: 8080)

4. Update frontend API URLs:
   - Change from `http://localhost:8080` to production URL
   - Update CORS settings in backend

---

### 2.2 Deploy Backend to GCP ⬜
**Status:** Not started
**Prerequisites:** 2.1 complete

**Recommended Approach: Cloud Run**

**Steps:**
1. Create `Dockerfile` for backend:
```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o api ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -o worker ./cmd/worker

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/api .
COPY --from=builder /app/worker .
CMD ["./api"]
```

2. Build and push to Google Container Registry:
```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/scripture-api
```

3. Deploy to Cloud Run:
```bash
gcloud run deploy scripture-api \
  --image gcr.io/YOUR_PROJECT_ID/scripture-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=YOUR_DB_URL,SMTP_HOST=smtp.gmail.com,SMTP_PORT=587,SMTP_USER=YOUR_EMAIL,SMTP_PASSWORD=YOUR_APP_PASSWORD,FROM_EMAIL=YOUR_EMAIL,FROM_NAME="Scripture Daily"
```

**Success Criteria:**
- Backend deployed and accessible
- Health check endpoint responds: `https://YOUR_URL/healthz`

---

### 2.3 Set Up Production Database ⬜
**Status:** Not started
**Prerequisites:** GCP project created

**Recommended: Cloud SQL for PostgreSQL**

**Steps:**
1. Create Cloud SQL instance:
```bash
gcloud sql instances create scripture-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1
```

2. Create database:
```bash
gcloud sql databases create scripture --instance=scripture-db
```

3. Create user:
```bash
gcloud sql users create scripture-user \
  --instance=scripture-db \
  --password=SECURE_PASSWORD
```

4. Get connection string
5. Update backend environment variable
6. Run worker to seed database:
```bash
./worker
```

**Success Criteria:**
- Database accessible from Cloud Run
- Worker successfully seeds scripture data
- API can query database

---

### 2.4 Deploy Frontend to GCP ⬜
**Status:** Not started
**Prerequisites:** 2.2 complete (backend deployed)

**Recommended Approach: Firebase Hosting or Cloud Storage + CDN**

**Option A: Firebase Hosting (Recommended)**

**Steps:**
1. Build frontend:
```bash
cd web
npm run build
```

2. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

3. Initialize Firebase:
```bash
firebase init hosting
```

4. Configure `firebase.json`:
```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "/api/**",
        "run": {
          "serviceId": "scripture-api",
          "region": "us-central1"
        }
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

5. Deploy:
```bash
firebase deploy
```

**Option B: Cloud Storage + CDN**

**Steps:**
1. Build frontend
2. Create Cloud Storage bucket
3. Upload dist/ to bucket
4. Enable Cloud CDN
5. Set up custom domain (optional)

**Success Criteria:**
- Frontend accessible via public URL
- API calls reach backend
- All routes work correctly

---

### 2.5 Configure Production Environment ⬜
**Status:** Not started
**Prerequisites:** 2.2, 2.3, 2.4 complete

**Tasks:**
1. Update frontend environment:
   - Change API endpoint from localhost to production URL
   - Update Stripe redirect URLs

2. Configure CORS in backend:
   - Allow production domain
   - Remove localhost from allowed origins (or keep for testing)

3. Set up SSL/TLS:
   - Cloud Run: Automatic with custom domain
   - Firebase Hosting: Automatic

4. Configure custom domain (optional):
   - Register domain (e.g., scripturedaily.com)
   - Point to Cloud Run or Firebase
   - Set up SSL certificate

5. Set up monitoring:
   - Cloud Logging
   - Cloud Monitoring
   - Error Reporting

**Success Criteria:**
- HTTPS enabled
- Custom domain working (if configured)
- Logs accessible in GCP Console

---

## Phase 3: Production Testing

### 3.1 Test Database (Production) ⬜
**Status:** Not started
**Prerequisites:** 2.3 complete

**Tests:**
1. Verify database connectivity:
```bash
curl https://YOUR_PRODUCTION_URL/api/today
```

2. Check visitor count:
```bash
curl https://YOUR_PRODUCTION_URL/api/visitors
```

3. Test scripture retrieval:
```bash
curl https://YOUR_PRODUCTION_URL/api/post/2025-12-16
```

**Success Criteria:**
- All API endpoints return data
- No database connection errors
- Data persists between requests

---

### 3.2 Test Email (Production) ⬜
**Status:** Not started
**Prerequisites:** 2.2, 2.5 complete

**Test 1: Welcome Email**
1. Go to production URL
2. Complete subscription flow
3. Verify email received

**Test 2: Daily Scripture Email**
```bash
curl -X POST https://YOUR_PRODUCTION_URL/api/send-daily \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com"}'
```

**Check Backend Logs:**
```bash
gcloud run logs read scripture-api --limit 50
```

**Look for:**
```
[email] SMTP configured for your@gmail.com
[email] ✓ Email sent successfully to: subscriber@email.com
```

**Success Criteria:**
- Welcome emails sent on subscription
- Daily scripture emails send successfully
- No SMTP errors in logs
- Emails delivered to inbox (not spam)

---

### 3.3 Test Payment (Production) ⬜
**Status:** Not started
**Prerequisites:** 2.4, 2.5 complete

**Test Flow:**
1. Navigate to production URL
2. Click "Subscribe"
3. Fill in subscription form with REAL information
4. Click "Proceed to Payment"
5. Should redirect to Stripe checkout (production uses real Stripe link)
6. **IMPORTANT:** Use Stripe test mode OR real payment
7. Complete payment on Stripe
8. Verify redirect back to success page
9. Check email for confirmation

**Stripe Test Cards (if in test mode):**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

**Success Criteria:**
- Stripe checkout loads
- Payment processes
- User redirected back to site
- Email confirmation sent
- No console errors

---

## Phase 4: Post-Deployment

### 4.1 Set Up Daily Email Scheduler ⬜
**Status:** Not started

**Options:**

**Option A: Cloud Scheduler + Cloud Run**
```bash
gcloud scheduler jobs create http daily-scripture \
  --schedule="0 6 * * *" \
  --uri="https://YOUR_URL/api/send-daily-batch" \
  --http-method=POST
```

**Option B: Cron job (if using Compute Engine)**
```bash
0 6 * * * curl -X POST https://YOUR_URL/api/send-daily-batch
```

**Tasks:**
1. Create subscriber database table
2. Implement `/api/send-daily-batch` endpoint
3. Set up scheduler
4. Test scheduler

---

### 4.2 Monitoring & Maintenance ⬜
**Status:** Not started

**Set Up:**
1. Cloud Monitoring dashboards
2. Error alerting (email/SMS)
3. Uptime checks
4. Log analysis

**Monitor:**
- API response times
- Database performance
- Email delivery rates
- Error rates
- User subscriptions

---

### 4.3 Documentation Updates ⬜
**Status:** Not started

**Update:**
1. README.md with production URLs
2. Add production deployment guide
3. Document environment variables
4. Add troubleshooting section
5. Update architecture diagrams

---

## Quick Reference

### Current Status
- ✅ Local development environment set up
- ✅ Database (Docker PostgreSQL) working
- ✅ API endpoints functional
- ✅ Frontend subscription flow complete
- ✅ Email service implemented
- ⬜ Email configured (user action required)
- ⬜ Local testing complete
- ⬜ Production deployment

### What's Next (In Order)
1. **Configure email locally** (5 minutes) - Follow [REAL_EMAIL_SETUP.md](REAL_EMAIL_SETUP.md)
2. **Test email locally** (5 minutes) - Send test emails
3. **Test payment flow locally** (5 minutes) - Complete subscription
4. **Plan GCP deployment** - Choose services and architecture
5. **Deploy to production** - Follow Phase 2
6. **Test in production** - Follow Phase 3

### Deployment Commands Reference

**Local:**
```bash
docker compose up -d        # Start database
./start-backend.sh          # Start backend
./start-frontend.sh         # Start frontend
```

**Production (after setup):**
```bash
gcloud run deploy scripture-api --image gcr.io/PROJECT/scripture-api
firebase deploy
```

### Environment Variables Required

**Local:**
- `DATABASE_URL` (default in start-backend.sh)
- `PORT` (default: 8080)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` (REQUIRED for email)
- `FROM_EMAIL`, `FROM_NAME`

**Production (same as local, but):**
- `DATABASE_URL` = Cloud SQL connection string
- All SMTP variables same as local (Gmail works in production too)

### Important URLs

**Local:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Database: localhost:5432

**Production (TBD):**
- Frontend: https://scripturedaily.com (or your domain)
- Backend API: https://scripture-api-XXX.run.app
- Database: Cloud SQL private IP

---

## Cost Estimates (GCP)

### Minimal Setup (for testing/small scale)
- Cloud Run (API): ~$0-5/month (free tier: 2M requests)
- Cloud SQL (db-f1-micro): ~$10-15/month
- Firebase Hosting: Free tier (10GB/month)
- Cloud Storage: ~$1/month
- **Total: ~$11-21/month**

### Production Setup (scaled)
- Cloud Run: ~$10-50/month (depends on traffic)
- Cloud SQL (db-g1-small): ~$25-35/month
- Cloud CDN: ~$5-20/month
- Cloud Scheduler: ~$0.10/month
- **Total: ~$40-105/month**

---

## Troubleshooting

### Email Not Sending
1. Check backend logs: `[email] SMTP configured` message
2. Verify App Password is correct (with spaces)
3. Check Gmail security settings
4. Look for error in logs: `[email] ERROR sending email`

### Database Connection Failed
1. Check Docker: `docker compose ps`
2. Verify DATABASE_URL is correct
3. Check PostgreSQL logs: `docker compose logs db`

### API Returns 404
1. Verify backend is running: `curl http://localhost:8080/healthz`
2. Check CORS settings
3. Verify route paths match

### Payment Flow Broken
1. Check localStorage: User data should persist
2. Verify API endpoint: `/api/subscribe/email`
3. Check browser console for errors
4. Verify backend logs show subscription

---

**Last Updated:** 2025-12-16
**Developed by:** Net1io.com
**Copyright (C) Reserved 2025**
