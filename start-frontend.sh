#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Starting Scripture Daily Frontend..."
echo ""

cd web

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🌐 Starting Vite dev server on port 5173..."
echo "📍 Frontend will be available at: http://localhost:5173"
echo "🔗 API proxy configured to: http://localhost:8080"
echo ""

npm run dev
