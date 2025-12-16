package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/your/module/internal/config"
	"github.com/your/module/internal/db"
	"github.com/your/module/internal/email"
)

func main() {
	cfg := config.Load()
	sqlDB := db.Connect(cfg.DatabaseURL)
	db.EnsureVisitorStats(sqlDB)
	emailCfg := email.LoadConfig()
	log.Printf("[api] starting on :%s DB=%s", cfg.Port, cfg.DatabaseURL)

	// Check if email is configured
	if emailCfg.SMTPUser != "" && emailCfg.SMTPPassword != "" {
		log.Printf("[email] SMTP configured for %s", emailCfg.SMTPUser)
	} else {
		log.Printf("[email] SMTP not configured - emails will be logged only")
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(200) })

	mux.HandleFunc("/api/today", func(w http.ResponseWriter, r *http.Request) {
		setCORS(w, r)
		_ = db.IncrementVisitorCount(sqlDB)
		today := time.Now().Format("2006-01-02")
		payload, err := db.GetDailyPayloadDate(sqlDB, today)
		if err != nil {
			if errors.Is(err, os.ErrNotExist) || err.Error() == "not_found" {
				http.Error(w, `{"error":"not_found"}`, http.StatusNotFound)
				log.Printf("[api] not_found for %s", today)
				return
			}
			log.Printf("[api] /api/today error: %v", err)
			http.Error(w, `{"error":"server_error"}`, http.StatusInternalServerError)
			return
		}
		writeJSON(w, payload)
	})

	mux.HandleFunc("/api/post/", func(w http.ResponseWriter, r *http.Request) {
		setCORS(w, r)
		date := r.URL.Path[len("/api/post/"):]
		if _, err := time.Parse("2006-01-02", date); err != nil {
			http.Error(w, `{"error":"bad_date"}`, http.StatusBadRequest)
			return
		}
		payload, err := db.GetDailyPayloadDate(sqlDB, date)
		if err != nil {
			if err.Error() == "not_found" {
				http.Error(w, `{"error":"not_found"}`, http.StatusNotFound)
				return
			}
			log.Printf("[api] /api/post error: %v", err)
			http.Error(w, `{"error":"server_error"}`, http.StatusInternalServerError)
			return
		}
		writeJSON(w, payload)
	})

	mux.HandleFunc("/api/visitors", func(w http.ResponseWriter, r *http.Request) {
		setCORS(w, r)
		count, err := db.GetVisitorCount(sqlDB)
		if err != nil {
			http.Error(w, `{"error":"server_error"}`, http.StatusInternalServerError)
			return
		}
		writeJSON(w, map[string]int{"count": count})
	})

	// Subscription email endpoint
	mux.HandleFunc("/api/subscribe/email", func(w http.ResponseWriter, r *http.Request) {
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

		// Log subscription
		log.Printf("[subscription] New subscription:")
		log.Printf("  Name: %s", data.FullName)
		log.Printf("  Email: %s", data.Email)
		log.Printf("  Phone: %s", data.Phone)
		log.Printf("  Location: %s, %s, %s", data.Address, data.City, data.Country)

		// Prepare email content for response
		emailContent := map[string]string{
			"to":      data.Email,
			"subject": "Welcome to Scripture Daily!",
		}

		// Send actual email if SMTP is configured
		var emailStatus string
		if emailCfg.SMTPUser != "" && emailCfg.SMTPPassword != "" {
			log.Printf("[email] Sending welcome email to: %s", data.Email)
			err := email.SendWelcomeEmail(emailCfg, data.FullName, data.Email)
			if err != nil {
				log.Printf("[email] ERROR sending email: %v", err)
				emailStatus = "failed"
				http.Error(w, `{"error":"email_send_failed","message":"`+err.Error()+`"}`, http.StatusInternalServerError)
				return
			}
			log.Printf("[email] ✓ Email sent successfully to: %s", data.Email)
			emailStatus = "sent"
		} else {
			log.Printf("[email] SMTP not configured - email would be sent to: %s", data.Email)
			emailStatus = "not_configured"
		}

		writeJSON(w, map[string]any{
			"success":     true,
			"message":     "Subscription successful! Check your email for confirmation.",
			"emailStatus": emailStatus,
			"email":       emailContent,
		})
	})

	// Send daily scripture endpoint (for testing or manual sends)
	mux.HandleFunc("/api/send-daily", func(w http.ResponseWriter, r *http.Request) {
		setCORS(w, r)
		if r.Method != "POST" {
			http.Error(w, `{"error":"method_not_allowed"}`, http.StatusMethodNotAllowed)
			return
		}

		var data struct {
			Email string `json:"email"`
		}

		if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
			http.Error(w, `{"error":"invalid_json"}`, http.StatusBadRequest)
			return
		}

		if data.Email == "" {
			http.Error(w, `{"error":"email_required"}`, http.StatusBadRequest)
			return
		}

		// Get today's scripture
		today := time.Now().Format("2006-01-02")
		payload, err := db.GetDailyPayloadDate(sqlDB, today)
		if err != nil {
			log.Printf("[api] /api/send-daily error: %v", err)
			http.Error(w, `{"error":"scripture_not_found"}`, http.StatusNotFound)
			return
		}

		// Convert db.Daily to email.Daily
		emailPayload := &email.Daily{
			Date:    payload.Date,
			Area:    payload.Area,
			Quran:   payload.Quran,
			Torah:   payload.Torah,
			Bible:   payload.Bible,
			HD:      payload.HD,
			Summary: payload.Summary,
		}

		// Send email if SMTP is configured
		if emailCfg.SMTPUser != "" && emailCfg.SMTPPassword != "" {
			log.Printf("[email] Sending daily scripture to: %s", data.Email)
			err := email.SendDailyScriptureEmail(emailCfg, data.Email, emailPayload)
			if err != nil {
				log.Printf("[email] ERROR sending daily scripture: %v", err)
				http.Error(w, `{"error":"email_send_failed"}`, http.StatusInternalServerError)
				return
			}
			log.Printf("[email] ✓ Daily scripture sent to: %s", data.Email)
		} else {
			log.Printf("[email] SMTP not configured - would send daily scripture to: %s", data.Email)
		}

		writeJSON(w, map[string]any{
			"success": true,
			"message": "Daily scripture sent successfully!",
			"date":    today,
		})
	})

	srv := &http.Server{Addr: ":" + cfg.Port, Handler: mux}
	log.Printf("[api] listening on :%s", cfg.Port)
	log.Fatal(srv.ListenAndServe())
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}

func setCORS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusNoContent)
	}
}
