# Scripture Daily - Quick Start Guide

## Simple 3-Step Startup

### Prerequisites
- **Docker** - For PostgreSQL database
- **Go 1.22+** - For backend
- **Node.js** - For frontend

---

## How to Start the Application

### Step 0: Start Docker Desktop
Make sure Docker Desktop is running:
- **macOS**: Open Docker Desktop from Applications
- **Windows**: Open Docker Desktop from Start Menu
- Wait until you see "Docker Desktop is running" in the menu bar/system tray

### Step 1: Start the Database (Docker)
```bash
docker compose up -d
```

This starts PostgreSQL in a Docker container:
- Database: `scripture`
- Port: `5432`
- Credentials: `postgres/postgres`

### Step 2: Start the Backend
In a new terminal:
```bash
./start-backend.sh
```

This will:
- Check if database is running (starts it if not)
- Seed the database with scripture verses
- Start the API server on port **8080**

### Step 3: Start the Frontend
In another terminal:
```bash
./start-frontend.sh
```

This will:
- Install dependencies (first time only)
- Start Vite dev server on port **5173**

### Step 4: Open Your Browser
Navigate to: **http://localhost:5173**

---

## That's It!

You now have:
- ✅ PostgreSQL running in Docker
- ✅ Go API server running on port 8080
- ✅ React frontend running on port 5173

---

## Stop the Application

### Stop Backend & Frontend
Press `Ctrl+C` in each terminal

### Stop Database
```bash
docker compose down
```

To remove database data as well:
```bash
docker compose down -v
```

---

## Manual Commands (Advanced)

### Database Only
```bash
# Start
docker compose up -d db

# Stop
docker compose stop db

# View logs
docker compose logs db
```

### Backend Only
```bash
cd backend

# Run worker (seed database)
go run ./cmd/worker

# Run API server
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/scripture?sslmode=disable
export PORT=8080
go run ./cmd/api
```

### Frontend Only
```bash
cd web
npm install  # First time only
npm run dev
```

---

## API Endpoints

Once backend is running:

- **GET** `http://localhost:8080/api/today` - Today's scripture
- **GET** `http://localhost:8080/api/post/:date` - Scripture for specific date (YYYY-MM-DD)
- **GET** `http://localhost:8080/api/visitors` - Visitor count
- **GET** `http://localhost:8080/healthz` - Health check

Example:
```bash
curl http://localhost:8080/api/today
```

---

## Environment Variables

All have sensible defaults. Only change if needed:

### Backend
- `DATABASE_URL` - Default: `postgres://postgres:postgres@localhost:5432/scripture?sslmode=disable`
- `PORT` - Default: `8080`

### Frontend
Configuration in [vite.config.ts](web/vite.config.ts:1):
- Dev server port: `5173`
- API proxy: `/api` → `http://localhost:8080`

---

## Troubleshooting

### "Cannot connect to the Docker daemon" error
**Docker Desktop is not running!**

1. Open Docker Desktop application
2. Wait for it to fully start (watch for "Docker Desktop is running" in menu bar)
3. Try again: `docker compose up -d`

### "Database not running" error
```bash
docker compose up -d
```

### Port 5432 already in use
Stop local PostgreSQL:
```bash
# macOS
brew services stop postgresql

# Or change Docker port in docker-compose.yml
```

### Port 8080 or 5173 already in use
Find and kill the process:
```bash
# macOS/Linux
lsof -ti:8080 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Reset everything
```bash
docker compose down -v
docker compose up -d
./start-backend.sh  # In new terminal
./start-frontend.sh # In another terminal
```

---

## Project Structure

```
app_scriptures/
├── start-backend.sh      # 🚀 Start backend (one command)
├── start-frontend.sh     # 🚀 Start frontend (one command)
├── docker-compose.yml    # Database configuration
├── backend/
│   ├── cmd/
│   │   ├── api/         # API server
│   │   └── worker/      # Database seeding
│   └── internal/        # Internal packages
└── web/
    └── src/             # React source code
```

---

## Development Workflow

1. **Start everything** (3 terminals):
   - Terminal 1: `docker compose up -d` (database)
   - Terminal 2: `./start-backend.sh` (API)
   - Terminal 3: `./start-frontend.sh` (frontend)

2. **Make changes**:
   - Backend: Edit Go files, restart backend script
   - Frontend: Edit React files (auto-reloads)
   - Database: Re-run worker with `cd backend && go run ./cmd/worker`

3. **Stop everything**:
   - Ctrl+C in backend/frontend terminals
   - `docker compose down` for database

---

## Quick Reference

| Component | Port | Command |
|-----------|------|---------|
| Database  | 5432 | `docker compose up -d` |
| Backend   | 8080 | `./start-backend.sh` |
| Frontend  | 5173 | `./start-frontend.sh` |

---

## Legacy Commands (from start.txt)

### From the root directory:
```bash
./scripts/run_worker_local.sh
./scripts/run_api_local.sh
```

### From the web directory:
```bash
./scripts/api_worker_local.sh
```

**Note:** These are legacy commands. Use the simplified commands above instead.

---

For detailed architecture and features, see [README.md](README.md:1).
