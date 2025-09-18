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
)

func main() {
	cfg := config.Load()
	sqlDB := db.Connect(cfg.DatabaseURL)
	db.EnsureVisitorStats(sqlDB)
	log.Printf("[api] starting on :%s DB=%s", cfg.Port, cfg.DatabaseURL)

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
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusNoContent)
	}
}
