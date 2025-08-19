
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."/backend
export DATABASE_URL=${DATABASE_URL:-postgres://postgres:postgres@localhost:5432/scripture?sslmode=disable}
export PORT=${PORT:-8080}
go run ./cmd/api
