# Payment System - Production Setup Guide

## Current Status

### ✅ What's Already Working (Local Development)
- Subscription form with user data collection
- Payment form with card validation
- Email integration (welcome emails)
- Stripe payment link configured: https://buy.stripe.com/dRm9ATbGh2fmfTG8ww
- Environment-based routing (localhost vs production)

### ⚠️ What Needs to Be Finalized for Production

The current setup redirects to Stripe in production but **does NOT handle the return flow** or store subscription data. This guide covers what needs to be implemented.

---

## Phase 1: Stripe Configuration (Required)

### 1.1 Verify Stripe Payment Link ⬜
**Current Link:** https://buy.stripe.com/dRm9ATbGh2fmfTG8ww

**Steps to Verify:**
1. Go to https://dashboard.stripe.com/payment-links
2. Find the payment link for "Scripture Daily Monthly Subscription"
3. Verify settings:
   - **Amount:** $9.99 USD
   - **Billing:** Recurring (monthly)
   - **Product Name:** Scripture Daily Monthly Subscription

**If link doesn't exist or is incorrect:**
1. Create new Payment Link in Stripe Dashboard
2. Set up product: "Scripture Daily Monthly Subscription"
3. Price: $9.99/month recurring
4. Copy the new payment link
5. Update in [web/src/pages/Subscribe.tsx:41](web/src/pages/Subscribe.tsx#L41)

---

### 1.2 Configure Stripe Webhook ⬜
**Why:** To receive notifications when payments succeed/fail

**Steps:**
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your endpoint URL: `https://YOUR_PRODUCTION_URL/api/stripe/webhook`
4. Select events to listen for:
   - ✅ `checkout.session.completed` - Payment successful
   - ✅ `payment_intent.succeeded` - Payment processed
   - ✅ `payment_intent.payment_failed` - Payment failed
   - ✅ `customer.subscription.created` - New subscription
   - ✅ `customer.subscription.deleted` - Subscription canceled
   - ✅ `customer.subscription.updated` - Subscription changed

5. Click "Add endpoint"
6. **Copy the Signing Secret** (looks like: `whsec_...`)
7. Save this secret - you'll need it in the backend

**Important:** You'll need different webhooks for test mode and live mode.

---

### 1.3 Configure Success/Cancel URLs ⬜
**Current Issue:** Payment link doesn't know where to redirect after payment

**Steps:**
1. Go to Stripe Payment Link settings
2. Update redirect URLs:
   - **Success URL:** `https://YOUR_DOMAIN/payment-success?session_id={CHECKOUT_SESSION_ID}`
   - **Cancel URL:** `https://YOUR_DOMAIN/subscribe?canceled=true`

**Important:** Replace `YOUR_DOMAIN` with your actual production domain.

---

## Phase 2: Backend Implementation (Required)

### 2.1 Create Subscribers Database Table ⬜
**Why:** Store subscription data permanently

**Create Migration:** `backend/migrations/002_create_subscribers.sql`

```sql
CREATE TABLE IF NOT EXISTS subscribers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address VARCHAR(255),
    city VARCHAR(100),
    country VARCHAR(100),

    -- Stripe data
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_payment_status VARCHAR(50),

    -- Subscription status
    status VARCHAR(50) DEFAULT 'pending', -- pending, active, canceled, past_due
    subscription_start_date TIMESTAMP,
    subscription_end_date TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_email_sent TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_stripe_customer (stripe_customer_id),
    INDEX idx_status (status)
);
```

**Apply Migration:**
```bash
psql $DATABASE_URL < backend/migrations/002_create_subscribers.sql
```

---

### 2.2 Implement Stripe Webhook Handler ⬜
**Why:** Process Stripe events automatically

**Create File:** `backend/internal/stripe/webhook.go`

```go
package stripe

import (
    "encoding/json"
    "fmt"
    "io"
    "log"
    "net/http"
    "os"

    "github.com/stripe/stripe-go/v76"
    "github.com/stripe/stripe-go/v76/webhook"
)

func HandleWebhook(w http.ResponseWriter, r *http.Request) {
    const MaxBodyBytes = int64(65536)
    r.Body = http.MaxBytesReader(w, r.Body, MaxBodyBytes)
    payload, err := io.ReadAll(r.Body)
    if err != nil {
        log.Printf("[stripe] Error reading request body: %v", err)
        w.WriteHeader(http.StatusServiceUnavailable)
        return
    }

    // Verify webhook signature
    endpointSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")
    event, err := webhook.ConstructEvent(payload, r.Header.Get("Stripe-Signature"), endpointSecret)
    if err != nil {
        log.Printf("[stripe] Webhook signature verification failed: %v", err)
        w.WriteHeader(http.StatusBadRequest)
        return
    }

    // Handle the event
    switch event.Type {
    case "checkout.session.completed":
        var session stripe.CheckoutSession
        err := json.Unmarshal(event.Data.Raw, &session)
        if err != nil {
            log.Printf("[stripe] Error parsing webhook JSON: %v", err)
            w.WriteHeader(http.StatusBadRequest)
            return
        }
        handleCheckoutSessionCompleted(session)

    case "customer.subscription.created":
        var subscription stripe.Subscription
        err := json.Unmarshal(event.Data.Raw, &subscription)
        if err != nil {
            log.Printf("[stripe] Error parsing webhook JSON: %v", err)
            w.WriteHeader(http.StatusBadRequest)
            return
        }
        handleSubscriptionCreated(subscription)

    case "customer.subscription.deleted":
        var subscription stripe.Subscription
        err := json.Unmarshal(event.Data.Raw, &subscription)
        if err != nil {
            log.Printf("[stripe] Error parsing webhook JSON: %v", err)
            w.WriteHeader(http.StatusBadRequest)
            return
        }
        handleSubscriptionDeleted(subscription)

    default:
        log.Printf("[stripe] Unhandled event type: %s", event.Type)
    }

    w.WriteHeader(http.StatusOK)
}

func handleCheckoutSessionCompleted(session stripe.CheckoutSession) {
    log.Printf("[stripe] Payment successful for session: %s", session.ID)
    log.Printf("[stripe] Customer: %s", session.Customer.ID)
    log.Printf("[stripe] Subscription: %s", session.Subscription.ID)

    // TODO: Update database with subscription info
    // TODO: Send welcome email
    // TODO: Activate subscriber
}

func handleSubscriptionCreated(subscription stripe.Subscription) {
    log.Printf("[stripe] Subscription created: %s", subscription.ID)
    // TODO: Update subscriber status to 'active'
}

func handleSubscriptionDeleted(subscription stripe.Subscription) {
    log.Printf("[stripe] Subscription canceled: %s", subscription.ID)
    // TODO: Update subscriber status to 'canceled'
}
```

**Install Stripe Go SDK:**
```bash
cd backend
go get github.com/stripe/stripe-go/v76
```

---

### 2.3 Create Subscriber Management Endpoints ⬜
**Why:** Store and manage subscriber data

**Create File:** `backend/internal/db/subscribers.go`

```go
package db

import (
    "database/sql"
    "time"
)

type Subscriber struct {
    ID                    int       `json:"id"`
    FullName              string    `json:"full_name"`
    Email                 string    `json:"email"`
    Phone                 string    `json:"phone,omitempty"`
    Address               string    `json:"address,omitempty"`
    City                  string    `json:"city,omitempty"`
    Country               string    `json:"country,omitempty"`
    StripeCustomerID      string    `json:"stripe_customer_id,omitempty"`
    StripeSubscriptionID  string    `json:"stripe_subscription_id,omitempty"`
    StripePaymentStatus   string    `json:"stripe_payment_status,omitempty"`
    Status                string    `json:"status"`
    SubscriptionStartDate time.Time `json:"subscription_start_date,omitempty"`
    CreatedAt             time.Time `json:"created_at"`
    UpdatedAt             time.Time `json:"updated_at"`
}

func CreateSubscriber(db *sql.DB, sub *Subscriber) error {
    query := `
        INSERT INTO subscribers (
            full_name, email, phone, address, city, country,
            stripe_customer_id, stripe_subscription_id, stripe_payment_status,
            status, subscription_start_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, created_at, updated_at
    `

    return db.QueryRow(
        query,
        sub.FullName, sub.Email, sub.Phone, sub.Address, sub.City, sub.Country,
        sub.StripeCustomerID, sub.StripeSubscriptionID, sub.StripePaymentStatus,
        sub.Status, sub.SubscriptionStartDate,
    ).Scan(&sub.ID, &sub.CreatedAt, &sub.UpdatedAt)
}

func GetSubscriberByEmail(db *sql.DB, email string) (*Subscriber, error) {
    query := `
        SELECT id, full_name, email, phone, address, city, country,
               stripe_customer_id, stripe_subscription_id, stripe_payment_status,
               status, subscription_start_date, created_at, updated_at
        FROM subscribers
        WHERE email = $1
    `

    sub := &Subscriber{}
    err := db.QueryRow(query, email).Scan(
        &sub.ID, &sub.FullName, &sub.Email, &sub.Phone, &sub.Address, &sub.City, &sub.Country,
        &sub.StripeCustomerID, &sub.StripeSubscriptionID, &sub.StripePaymentStatus,
        &sub.Status, &sub.SubscriptionStartDate, &sub.CreatedAt, &sub.UpdatedAt,
    )

    if err != nil {
        return nil, err
    }
    return sub, nil
}

func UpdateSubscriberStripeInfo(db *sql.DB, email, customerID, subscriptionID, status string) error {
    query := `
        UPDATE subscribers
        SET stripe_customer_id = $1,
            stripe_subscription_id = $2,
            status = $3,
            subscription_start_date = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE email = $4
    `

    _, err := db.Exec(query, customerID, subscriptionID, status, email)
    return err
}

func GetActiveSubscribers(db *sql.DB) ([]*Subscriber, error) {
    query := `
        SELECT id, full_name, email, phone, address, city, country,
               stripe_customer_id, stripe_subscription_id, stripe_payment_status,
               status, subscription_start_date, created_at, updated_at
        FROM subscribers
        WHERE status = 'active'
        ORDER BY created_at DESC
    `

    rows, err := db.Query(query)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var subscribers []*Subscriber
    for rows.Next() {
        sub := &Subscriber{}
        err := rows.Scan(
            &sub.ID, &sub.FullName, &sub.Email, &sub.Phone, &sub.Address, &sub.City, &sub.Country,
            &sub.StripeCustomerID, &sub.StripeSubscriptionID, &sub.StripePaymentStatus,
            &sub.Status, &sub.SubscriptionStartDate, &sub.CreatedAt, &sub.UpdatedAt,
        )
        if err != nil {
            return nil, err
        }
        subscribers = append(subscribers, sub)
    }

    return subscribers, nil
}
```

---

### 2.4 Update API to Store Subscribers ⬜
**Why:** Save subscriber data before redirecting to Stripe

**Update:** `backend/cmd/api/main.go`

Add after the existing `/api/subscribe/email` endpoint:

```go
// Store subscriber before payment
mux.HandleFunc("/api/subscribe/store", func(w http.ResponseWriter, r *http.Request) {
    setCORS(w, r)
    if r.Method != "POST" {
        http.Error(w, `{"error":"method_not_allowed"}`, http.StatusMethodNotAllowed)
        return
    }

    var data struct {
        FullName string `json:"fullName"`
        Email    string `json:"email"`
        Phone    string `json:"phone"`
        Address  string `json:"address"`
        City     string `json:"city"`
        Country  string `json:"country"`
    }

    if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
        http.Error(w, `{"error":"invalid_json"}`, http.StatusBadRequest)
        return
    }

    // Validate required fields
    if data.FullName == "" || data.Email == "" {
        http.Error(w, `{"error":"missing_required_fields"}`, http.StatusBadRequest)
        return
    }

    // Create subscriber with 'pending' status
    subscriber := &db.Subscriber{
        FullName: data.FullName,
        Email:    data.Email,
        Phone:    data.Phone,
        Address:  data.Address,
        City:     data.City,
        Country:  data.Country,
        Status:   "pending", // Will be updated to 'active' by webhook
    }

    err := db.CreateSubscriber(sqlDB, subscriber)
    if err != nil {
        log.Printf("[api] Error creating subscriber: %v", err)
        http.Error(w, `{"error":"database_error"}`, http.StatusInternalServerError)
        return
    }

    log.Printf("[api] Subscriber created: %s (ID: %d)", data.Email, subscriber.ID)

    writeJSON(w, map[string]any{
        "success": true,
        "message": "Subscriber registered",
        "subscriber_id": subscriber.ID,
    })
})

// Stripe webhook endpoint
mux.HandleFunc("/api/stripe/webhook", stripe.HandleWebhook)
```

---

## Phase 3: Frontend Updates (Required)

### 3.1 Update Subscribe Page to Store Data First ⬜
**Why:** Save subscriber before redirecting to Stripe

**Update:** `web/src/pages/Subscribe.tsx`

Replace the `handleStripePayment` function:

```typescript
const handleStripePayment = async () => {
  if (!agreedToTerms) {
    alert('Please agree to the Terms & Conditions to continue.')
    return
  }

  if (!formData.fullName || !formData.email) {
    alert('Please fill in at least your name and email.')
    return
  }

  // Store subscriber data in backend FIRST
  try {
    const response = await fetch('/api/subscribe/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    if (!response.ok) {
      throw new Error('Failed to store subscriber data')
    }

    const result = await response.json()
    console.log('Subscriber stored:', result)

    // Also store in localStorage as backup
    localStorage.setItem('subscriptionUserData', JSON.stringify(formData))
    localStorage.setItem('subscriberId', result.subscriber_id)

    // Redirect to Stripe
    const isProduction = window.location.hostname !== 'localhost'
    const STRIPE_CHECKOUT_URL = 'https://buy.stripe.com/dRm9ATbGh2fmfTG8ww'

    if (isProduction) {
      console.log('Redirecting to Stripe checkout...')
      window.location.href = STRIPE_CHECKOUT_URL
    } else {
      console.log('Using local payment page for development...')
      window.location.href = '/payment'
    }
  } catch (error) {
    console.error('Error storing subscriber:', error)
    alert('An error occurred. Please try again.')
  }
}
```

---

### 3.2 Create Payment Success Page ⬜
**Why:** Handle successful payment redirects from Stripe

**Create File:** `web/src/pages/PaymentSuccess.tsx`

```typescript
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      setStatus('error')
      return
    }

    // Get user data from localStorage
    const storedData = localStorage.getItem('subscriptionUserData')
    if (storedData) {
      setUserData(JSON.parse(storedData))
    }

    // Verify payment with backend (optional but recommended)
    verifyPayment(sessionId)
  }, [searchParams])

  const verifyPayment = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
      const data = await response.json()

      if (data.success) {
        setStatus('success')
        // Clear localStorage
        localStorage.removeItem('subscriptionUserData')
        localStorage.removeItem('subscriberId')
      } else {
        setStatus('error')
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
      // Still show success if we can't verify (payment already completed)
      setStatus('success')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin h-16 w-16 text-blue-600 mx-auto mb-4">
            <svg className="h-16 w-16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Payment</h2>
          <p className="text-gray-600">Please wait while we confirm your subscription...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <svg className="h-16 w-16 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h2>
          <p className="text-gray-600 mb-6">
            We couldn't verify your payment. Please contact support if your card was charged.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          <svg className="h-16 w-16 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for subscribing to Scripture Daily. Your daily scriptures will be delivered to your inbox.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Subscription Confirmed</strong>
            </p>
            {userData && (
              <>
                <p className="text-sm text-gray-600">Name: {userData.fullName}</p>
                <p className="text-sm text-gray-600">Email: {userData.email}</p>
                <p className="text-sm text-gray-600 mt-2">Plan: Scripture Daily Monthly</p>
                <p className="text-sm text-gray-600">Amount: $9.99/month</p>
              </>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              A confirmation email has been sent to <strong>{userData?.email}</strong>
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

### 3.3 Add Payment Success Route ⬜

**Update:** `web/src/App.tsx`

Add the new route:

```typescript
import PaymentSuccess from './pages/PaymentSuccess'

// In your routes:
<Route path="/payment-success" element={<PaymentSuccess />} />
```

---

## Phase 4: Batch Email System (Required for Daily Emails)

### 4.1 Create Batch Email Endpoint ⬜
**Why:** Send daily scripture to all active subscribers

**Update:** `backend/cmd/api/main.go`

Add new endpoint:

```go
// Send daily scripture to all active subscribers
mux.HandleFunc("/api/send-daily-batch", func(w http.ResponseWriter, r *http.Request) {
    setCORS(w, r)
    if r.Method != "POST" {
        http.Error(w, `{"error":"method_not_allowed"}`, http.StatusMethodNotAllowed)
        return
    }

    // Get all active subscribers
    subscribers, err := db.GetActiveSubscribers(sqlDB)
    if err != nil {
        log.Printf("[api] Error getting subscribers: %v", err)
        http.Error(w, `{"error":"database_error"}`, http.StatusInternalServerError)
        return
    }

    // Get today's scripture
    today := time.Now().Format("2006-01-02")
    payload, err := db.GetDailyPayloadDate(sqlDB, today)
    if err != nil {
        log.Printf("[api] /api/send-daily-batch error: %v", err)
        http.Error(w, `{"error":"scripture_not_found"}`, http.StatusNotFound)
        return
    }

    // Convert to email format
    emailPayload := &email.Daily{
        Date:    payload.Date,
        Area:    payload.Area,
        Quran:   payload.Quran,
        Torah:   payload.Torah,
        Bible:   payload.Bible,
        HD:      payload.HD,
        Summary: payload.Summary,
    }

    // Send to all subscribers
    successCount := 0
    failCount := 0

    for _, subscriber := range subscribers {
        if emailCfg.SMTPUser != "" && emailCfg.SMTPPassword != "" {
            err := email.SendDailyScriptureEmail(emailCfg, subscriber.Email, emailPayload)
            if err != nil {
                log.Printf("[email] ERROR sending to %s: %v", subscriber.Email, err)
                failCount++
            } else {
                log.Printf("[email] ✓ Sent to: %s", subscriber.Email)
                successCount++
            }
        }
    }

    log.Printf("[email] Batch complete: %d sent, %d failed", successCount, failCount)

    writeJSON(w, map[string]any{
        "success": true,
        "sent": successCount,
        "failed": failCount,
        "total": len(subscribers),
        "date": today,
    })
})
```

---

### 4.2 Set Up Cloud Scheduler (GCP) ⬜
**Why:** Automatically send daily emails

**After deploying to GCP:**

```bash
# Create scheduler job to run at 6 AM daily
gcloud scheduler jobs create http daily-scripture-emails \
  --schedule="0 6 * * *" \
  --time-zone="America/New_York" \
  --uri="https://YOUR_PRODUCTION_URL/api/send-daily-batch" \
  --http-method=POST \
  --headers="Content-Type=application/json" \
  --description="Send daily scripture emails to all active subscribers"
```

**Test the scheduler:**
```bash
gcloud scheduler jobs run daily-scripture-emails
```

---

## Phase 5: Testing Checklist

### Local Testing ✅
- [x] Payment form works
- [x] Email sending works
- [x] Database connection works
- [ ] Subscriber storage works
- [ ] Batch email endpoint works

### Production Testing ⬜
- [ ] Stripe payment completes successfully
- [ ] Webhook receives events from Stripe
- [ ] Subscriber status updates to 'active' after payment
- [ ] Welcome email sends after successful payment
- [ ] Payment success page displays correctly
- [ ] Batch email sends to all active subscribers
- [ ] Cloud Scheduler triggers daily emails
- [ ] Unsubscribe flow works (future)

---

## Environment Variables Required

### Production Backend

Add these to your Cloud Run or deployment environment:

```bash
# Existing
DATABASE_URL=your_cloud_sql_connection_string
PORT=8080
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=your@gmail.com
FROM_NAME=Scripture Daily

# New - Stripe
STRIPE_SECRET_KEY=sk_live_...              # From Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_...            # From Stripe Webhook settings
STRIPE_PAYMENT_LINK=https://buy.stripe.com/dRm9ATbGh2fmfTG8ww
```

---

## Cost Estimate for Payment System

### Stripe Fees
- **Per Transaction:** 2.9% + $0.30
- **For $9.99 monthly subscription:** $0.59 per payment
- **Net Revenue:** $9.40 per subscriber per month

### Additional Costs
- Cloud Scheduler: $0.10/month
- Cloud SQL: ~$10-25/month
- Email (Gmail SMTP): Free (with limits)

---

## Security Considerations

### 1. Never Store Card Details
- ✅ Already handled by Stripe
- Never store card numbers, CVV, or expiry dates

### 2. Verify Webhook Signatures
- ✅ Implemented in webhook handler
- Always verify Stripe-Signature header

### 3. Use HTTPS Only
- Required for PCI compliance
- GCP handles this automatically

### 4. Secure Webhook Endpoint
- Consider adding IP whitelist for Stripe IPs
- Log all webhook events for auditing

---

## Next Steps (Priority Order)

1. **Create subscribers table** (Phase 2.1)
2. **Configure Stripe webhook** (Phase 1.2)
3. **Implement webhook handler** (Phase 2.2)
4. **Update frontend to store subscribers** (Phase 3.1)
5. **Create payment success page** (Phase 3.2)
6. **Test locally with Stripe test mode**
7. **Deploy to production**
8. **Configure production Stripe webhook**
9. **Set up Cloud Scheduler for daily emails**
10. **Test end-to-end in production**

---

## Troubleshooting

### Payment Completes but Subscriber Not Created
- Check webhook endpoint is accessible
- Verify STRIPE_WEBHOOK_SECRET is correct
- Check Cloud Run logs for webhook errors

### Emails Not Sending After Payment
- Verify SMTP credentials in production
- Check Cloud Run environment variables
- Review logs for email sending errors

### Stripe Webhook Timing Out
- Webhook should respond within 5 seconds
- Move heavy processing (emails) to background job
- Return 200 immediately, process async

---

**Last Updated:** 2025-12-16
**Status:** Ready for Implementation
**Next Action:** Create subscribers table

**Developed by:** Net1io.com
**Copyright (C) Reserved 2025**
