
# Scripture Daily – Go + React

Scripture Daily is a full-stack web application that delivers daily passages from the Qur'an, Torah, Bible, and Human Design, along with a summary, for a given date. It is built with a Go backend (API and worker) and a React + Tailwind CSS frontend.

---

## Features
- **Dynamic daily scripture selection** from multiple traditions based on themes
- **Automated verse matching** across Quran, Torah, Bible, and Human Design
- **Visitor counting** and analytics
- **User location and date display**
- **Simple REST API** (Go, PostgreSQL)
- **Modern React frontend** (Vite, Tailwind CSS)
- **Dockerized** for easy deployment

---

## Architecture

### Backend (Go)
- **API Service** (`/backend/cmd/api/main.go`):
  - Endpoints:
    - `GET /api/today` – Returns today's scripture payload (increments visitor count)
    - `GET /api/post/:date` – Returns scripture payload for a specific date (YYYY-MM-DD)
    - `GET /api/visitors` – Returns current visitor count
    - `GET /healthz` – Health check
  - Reads from a PostgreSQL database (`daily_payloads` and `verses` tables)
  - Handles CORS for API endpoints

- **Worker Service** (`/backend/cmd/worker/main.go`):
  - **Dynamic verse selection**: Picks a random theme each day
  - **Automated matching**: Selects one verse from each source for the chosen theme
  - **Database seeding**: Populates the verses table with themed scripture collections
  - Runs as a one-off job to generate daily payloads

- **Database** (PostgreSQL):
  - **`daily_payloads`** table: Stores daily scripture payloads
  - **`verses` table**: Contains verses from all sources, tagged by themes
  - **`visitor_stats` table**: Tracks total site visitors
  - Migrations in `/backend/migrations/`

- **Configuration**:
  - Environment variables:
    - `DATABASE_URL` (default: `postgres://postgres:postgres@localhost:5432/scripture?sslmode=disable`)
    - `PORT` (default: `8080`)
    - `BASE_URL` (default: `http://localhost:8080`)

### Frontend (React + Vite + Tailwind CSS)
- **Pages**:
  - `/` – Today's scripture (fetches `/api/today`)
  - `/post/:date` – Scripture for a specific date (fetches `/api/post/:date`)
- **Features**:
  - **Full verse display**: Shows complete scripture text, not just snippets
  - **User information**: Displays current date/time and location (via Geolocation API)
  - **Visitor counter**: Shows total number of site visitors
- **Styling**: Tailwind CSS utility classes, custom card/badge/container classes
- **Development**: Vite dev server on port 5173, proxies `/api` to backend

---

## API Endpoints
- `GET /api/today` – Get today's scripture payload (increments visitor count)
- `GET /api/post/:date` – Get scripture payload for a specific date (YYYY-MM-DD)
- `GET /api/visitors` – Get current visitor count
- `GET /healthz` – Health check

Example response:
```json
{
  "date": "2025-08-18",
  "area": "generosity",
  "quran": { 
    "ref": "2:177", 
    "text": "It is not righteousness that you turn your faces towards the East or the West, but righteousness is in one who believes in Allah, the Last Day, the Angels, the Book, and the Prophets and gives his wealth, in spite of love for it, to relatives, orphans, the needy, the traveler, those who ask [for help], and for freeing slaves; [and who] establishes prayer and gives zakah; [those who] fulfill their promise when they promise; and [those who] are patient in poverty and hardship and during battle. Those are the ones who have been true, and it is those who are the righteous." 
  },
  "torah": { 
    "ref": "Deut 15:7", 
    "text": "If there is a poor man among your brothers in any of the towns of the land that the LORD your God is giving you, do not be hard-hearted or tight-fisted toward your poor brother." 
  },
  "bible": { 
    "ref": "Prov 11:24", 
    "text": "One person gives freely, yet gains even more; another withholds unduly, but comes to poverty." 
  },
  "human_design": { 
    "ref": "Gate 34", 
    "text": "Gate 34: The Power of the Great. The pure, undiluted power to be oneself. This is the gate of power, of doing, of responding in the now with the full force of your being, without interference from the mind." 
  },
  "summary": "Today's theme is 'generosity'. Each tradition highlights this value: Qur'an (2:177), Torah (Deut 15:7), Bible (Prov 11:24), Human Design (Gate 34)."
}
```

---

## Database Schema
```sql
-- Daily scripture payloads
CREATE TABLE IF NOT EXISTS daily_payloads (
    date TEXT PRIMARY KEY,
    payload_json TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Scripture verses with theme tags
CREATE TABLE IF NOT EXISTS verses (
    id SERIAL PRIMARY KEY,
    source TEXT NOT NULL,         -- 'quran', 'torah', 'bible', 'human_design'
    ref TEXT NOT NULL,
    text TEXT NOT NULL,
    topics TEXT NOT NULL          -- comma-separated topics
);

-- Visitor statistics
CREATE TABLE IF NOT EXISTS visitor_stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    count INTEGER NOT NULL DEFAULT 0
);
```

---

## Dynamic Verse Selection
The system automatically selects themed verses each day:

1. **Theme Selection**: Worker picks a random theme (generosity, patience, faith, justice)
2. **Verse Matching**: One verse from each source is selected for the chosen theme
3. **Daily Variety**: Each day shows different themed collections
4. **Automated Summary**: Summary is generated highlighting the common theme and references

**Current Themes Available:**
- **Generosity**: Giving, charity, helping others
- **Patience**: Endurance, waiting, stillness
- **Faith**: Belief, trust, confidence
- **Justice**: Fairness, correction, righteousness

---

## Tech Stack
- Go 1.22 (API, worker)
- PostgreSQL (database)
- React 18, Vite, Tailwind CSS (frontend)
- Docker, Docker Compose (deployment)

---

## Environment Variables
- `DATABASE_URL` – Postgres DSN (default: `postgres://postgres:postgres@localhost:5432/scripture?sslmode=disable`)
- `PORT` – API port (default: `8080`)
- `BASE_URL` – Base URL for API (default: `http://localhost:8080`)

---

## Run locally
```bash
# Ensure PostgreSQL is running (or run docker compose below)
# Default DSN expects: user=postgres password=postgres db=scripture host=localhost port=5432

# Start the worker to seed database and generate today's payload
./scripts/run_worker_local.sh

# Start the API server
./scripts/run_api_local.sh

# Start the frontend
cd web && npm install && npm run dev
# open http://localhost:5173
```

## Run with Docker
```bash
docker compose build --no-cache
docker compose up
# API: http://localhost:8080/api/today
```

---

## Extending the System

### Adding New Themes
Insert new verses into the `verses` table:
```sql
INSERT INTO verses (source, ref, text, topics) VALUES 
('quran', 'new:ref', 'Full verse text...', 'new_theme');
```

### Adding New Sources
Extend the `verses` table and update the worker logic to include additional scripture traditions.

### External API Integration
Connect to external scripture APIs (Quran.com, Sefaria, Bible API) for live verse fetching and expanded collections.
