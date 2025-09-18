package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"time"

	"github.com/your/module/internal/config"
	"github.com/your/module/internal/db"
)

type Daily struct {
	Date    string                 `json:"date"`
	Area    string                 `json:"area"`
	Quran   map[string]string      `json:"quran"`
	Torah   map[string]string      `json:"torah"`
	Bible   map[string]string      `json:"bible"`
	HD      map[string]string      `json:"human_design"`
	Summary string                 `json:"summary"`
	Meta    map[string]interface{} `json:"meta,omitempty"`
}

func main() {
	cfg := config.Load()
	sqlDB := db.Connect(cfg.DatabaseURL)
	ensureMigrated(sqlDB)
	db.SeedExampleVerses(sqlDB)

	today := time.Now().Format("2006-01-02")
	topic, _ := db.GetRandomTopic(sqlDB)
	qRef, qText, _ := db.GetVerseByTopicAndSource(sqlDB, "quran", topic)
	tRef, tText, _ := db.GetVerseByTopicAndSource(sqlDB, "torah", topic)
	bRef, bText, _ := db.GetVerseByTopicAndSource(sqlDB, "bible", topic)
	hdRef, hdText, _ := db.GetVerseByTopicAndSource(sqlDB, "human_design", topic)

	payload := Daily{
		Date:    today,
		Area:    topic,
		Quran:   map[string]string{"ref": qRef, "text": qText},
		Torah:   map[string]string{"ref": tRef, "text": tText},
		Bible:   map[string]string{"ref": bRef, "text": bText},
		HD:      map[string]string{"ref": hdRef, "text": hdText},
		Summary: "Today's theme is '" + topic + "'. Each tradition highlights this value: Qur'an (" + qRef + "), Torah (" + tRef + "), Bible (" + bRef + "), Human Design (" + hdRef + ").",
	}
	b, _ := json.Marshal(payload)
	_, _ = sqlDB.Exec(`INSERT INTO daily_payloads(date, payload_json) VALUES($1,$2)
        ON CONFLICT(date) DO UPDATE SET payload_json=excluded.payload_json`, today, string(b))
	log.Println("[worker] seeded today's payload and exited")
}

func ensureMigrated(db *sql.DB) {
	_, _ = db.Exec(`CREATE TABLE IF NOT EXISTS daily_payloads (
        date TEXT PRIMARY KEY,
        payload_json TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );`)
}
