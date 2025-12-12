#!/bin/bash
set -e

echo "🚀 Starting user_core service..."

echo "📦 Skipping database migrations (using SQLite fallback)..."

echo "🌐 Starting uvicorn server..."
exec uvicorn api.main:app --host 0.0.0.0 --port 8001
