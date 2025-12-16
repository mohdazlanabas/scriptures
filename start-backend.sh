#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Starting Scripture Daily Backend..."
echo ""

# Check if database is running
if ! docker compose ps db | grep -q "Up"; then
    echo "⚠️  Database not running. Starting database first..."
    docker compose up -d db
    echo "⏳ Waiting for database to be ready..."
    sleep 5
fi

# Set environment variables
export DATABASE_URL=${DATABASE_URL:-postgres://postgres:postgres@localhost:5432/scripture?sslmode=disable}
export PORT=${PORT:-8080}

# Email configuration (REQUIRED for sending emails)
# TODO: Replace these with your actual Gmail credentials
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="your-email@gmail.com"           # ← CHANGE THIS to your Gmail address
export SMTP_PASSWORD="xxxx xxxx xxxx xxxx"        # ← CHANGE THIS to your Gmail App Password
export FROM_EMAIL="your-email@gmail.com"           # ← CHANGE THIS to your Gmail address
export FROM_NAME="Scripture Daily"

# Run worker first to seed database (if needed)
echo "📚 Running worker to seed database..."
cd backend
go run ./cmd/worker

echo ""
echo "🌐 Starting API server on port ${PORT}..."
go run ./cmd/api
