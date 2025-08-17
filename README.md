
# Scripture Daily – Go + React (Clean Build)

## Run locally
```bash
./scripts/run_worker_local.sh
./scripts/run_api_local.sh
cd web && npm install && npm run dev
# open http://localhost:5173
```

## Run with Docker
```bash
docker compose build --no-cache
docker compose up
# API: http://localhost:8080/api/today
```
