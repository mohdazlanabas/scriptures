
CREATE TABLE IF NOT EXISTS daily_payloads (
    date TEXT PRIMARY KEY,
    payload_json TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
