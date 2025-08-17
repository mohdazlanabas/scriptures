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
	if err != nil {
		log.Fatalf("db open error: %v", err)
	}
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
	_, _ = db.Exec(`CREATE TABLE IF NOT EXISTS visitor_stats (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        count INTEGER NOT NULL DEFAULT 0
    );`)
	_, _ = db.Exec(`CREATE TABLE IF NOT EXISTS verses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL,         -- 'quran', 'torah', 'bible', 'human_design'
        ref TEXT NOT NULL,
        text TEXT NOT NULL,
        topics TEXT NOT NULL          -- comma-separated topics
    );`)
	EnsureVisitorStats(db)
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

func EnsureVisitorStats(db *sql.DB) {
	_, _ = db.Exec(`INSERT OR IGNORE INTO visitor_stats (id, count) VALUES (1, 0);`)
}

func IncrementVisitorCount(db *sql.DB) error {
	_, err := db.Exec(`UPDATE visitor_stats SET count = count + 1 WHERE id = 1;`)
	return err
}

func GetVisitorCount(db *sql.DB) (int, error) {
	var count int
	err := db.QueryRow(`SELECT count FROM visitor_stats WHERE id = 1;`).Scan(&count)
	return count, err
}

func SeedExampleVerses(db *sql.DB) {
	// Only seed if table is empty
	var count int
	_ = db.QueryRow(`SELECT COUNT(*) FROM verses`).Scan(&count)
	if count > 0 {
		return
	}
	// Example: generosity topic
	db.Exec(`INSERT INTO verses (source, ref, text, topics) VALUES
        -- Generosity
        ('quran', '2:177', 'It is not righteousness that you turn your faces towards the East or the West, but righteousness is in one who believes in Allah, the Last Day, the Angels, the Book, and the Prophets and gives his wealth, in spite of love for it, to relatives, orphans, the needy, the traveler, those who ask [for help], and for freeing slaves; [and who] establishes prayer and gives zakah; [those who] fulfill their promise when they promise; and [those who] are patient in poverty and hardship and during battle. Those are the ones who have been true, and it is those who are the righteous.', 'generosity'),
        ('torah', 'Deut 15:7', 'If there is a poor man among your brothers in any of the towns of the land that the LORD your God is giving you, do not be hard-hearted or tight-fisted toward your poor brother.', 'generosity'),
        ('bible', 'Prov 11:24', 'One person gives freely, yet gains even more; another withholds unduly, but comes to poverty.', 'generosity'),
        ('human_design', 'Gate 34', 'Gate 34: The Power of the Great. The pure, undiluted power to be oneself. This is the gate of power, of doing, of responding in the now with the full force of your being, without interference from the mind.', 'generosity'),
        -- Patience
        ('quran', '2:153', 'O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.', 'patience'),
        ('torah', 'Exodus 14:14', 'The LORD will fight for you; you need only to be still.', 'patience'),
        ('bible', 'James 1:4', 'Let perseverance finish its work so that you may be mature and complete, not lacking anything.', 'patience'),
        ('human_design', 'Gate 5', 'Gate 5: Fixed Rhythms. The power of patience and waiting for the right timing.', 'patience'),
        -- Faith
        ('quran', '2:286', 'Allah does not burden a soul beyond that it can bear...', 'faith'),
        ('torah', 'Genesis 15:6', 'Abram believed the LORD, and he credited it to him as righteousness.', 'faith'),
        ('bible', 'Hebrews 11:1', 'Now faith is confidence in what we hope for and assurance about what we do not see.', 'faith'),
        ('human_design', 'Gate 20', 'Gate 20: The Now. Faith in the present moment and the power of being present.', 'faith'),
        -- Justice
        ('quran', '4:135', 'O you who have believed, be persistently standing firm in justice, witnesses for Allah, even if it be against yourselves or parents and relatives...', 'justice'),
        ('torah', 'Leviticus 19:15', 'Do not pervert justice; do not show partiality to the poor or favoritism to the great, but judge your neighbor fairly.', 'justice'),
        ('bible', 'Micah 6:8', 'He has shown you, O mortal, what is good. And what does the LORD require of you? To act justly and to love mercy and to walk humbly with your God.', 'justice'),
        ('human_design', 'Gate 18', 'Gate 18: Correction. The drive to improve and correct for the sake of justice and betterment.', 'justice')
    `)
}

func GetRandomTopic(db *sql.DB) (string, error) {
	var topic string
	err := db.QueryRow(`SELECT topics FROM verses ORDER BY RANDOM() LIMIT 1`).Scan(&topic)
	if err != nil {
		return "generosity", nil // fallback
	}
	// Only return the first topic if multiple
	if idx := len(topic); idx > 0 {
		if comma := stringIndex(topic, ','); comma > 0 {
			return topic[:comma], nil
		}
	}
	return topic, nil
}

func GetVerseByTopicAndSource(db *sql.DB, source, topic string) (ref, text string, err error) {
	err = db.QueryRow(`SELECT ref, text FROM verses WHERE source = ? AND topics LIKE ? ORDER BY RANDOM() LIMIT 1`, source, "%"+topic+"%").Scan(&ref, &text)
	return
}

// Helper for string index (since strings.Index not available in SQL)
func stringIndex(s string, sep byte) int {
	for i := 0; i < len(s); i++ {
		if s[i] == sep {
			return i
		}
	}
	return -1
}
