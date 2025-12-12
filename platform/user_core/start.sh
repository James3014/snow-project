#!/bin/bash
set -e

echo "🚀 Starting user_core service..."

echo "📦 Running database migrations..."

# Fix multiple heads issue by merging them first
alembic merge heads || echo "No heads to merge or already merged"

# Then upgrade to the latest
alembic upgrade head

echo "✅ Database migrations completed"

echo "🌐 Starting uvicorn server..."
exec uvicorn api.main:app --host 0.0.0.0 --port 8001
