
CREATE TABLE IF NOT EXISTS daily_payloads (
    date TEXT PRIMARY KEY,
    payload_json TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visitor_stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS verses (
    id SERIAL PRIMARY KEY,
    source TEXT NOT NULL,         -- 'quran', 'torah', 'bible', 'human_design'
    ref TEXT NOT NULL,
    text TEXT NOT NULL,
    topics TEXT NOT NULL          -- comma-separated topics
);
