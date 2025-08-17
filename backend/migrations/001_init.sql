
CREATE TABLE IF NOT EXISTS daily_payloads (
    date TEXT PRIMARY KEY,
    payload_json TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visitor_stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,         -- 'quran', 'torah', 'bible', 'human_design'
    ref TEXT NOT NULL,
    text TEXT NOT NULL,
    topics TEXT NOT NULL          -- comma-separated topics
);
