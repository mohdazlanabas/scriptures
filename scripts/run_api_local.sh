
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."/backend
export DATABASE_URL=${DATABASE_URL:-file:./scripture.db?cache=shared&_fk=1}
export PORT=${PORT:-8080}
go run ./cmd/api
