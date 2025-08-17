
package db

import (
    "database/sql"
    "encoding/json"
    "errors"
    "log"

    _ "modernc.org/sqlite"
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

func Connect(dsn string) *sql.DB {
    db, err := sql.Open("sqlite", dsn)
    if err != nil { log.Fatalf("db open error: %v", err) }
    _, _ = db.Exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;`)
    ensureMigrated(db)
    return db
}

func ensureMigrated(db *sql.DB) {
    _, _ = db.Exec(`CREATE TABLE IF NOT EXISTS daily_payloads (
        date TEXT PRIMARY KEY,
        payload_json TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`)
}

func GetDailyPayloadDate(dbh *sql.DB, date string) (*Daily, error) {
    var js string
    err := dbh.QueryRow(`SELECT payload_json FROM daily_payloads WHERE date=?`, date).Scan(&js)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, errors.New("not_found")
        }
        return nil, err
    }
    var d Daily
    if err := json.Unmarshal([]byte(js), &d); err != nil {
        return nil, err
    }
    return &d, nil
}
