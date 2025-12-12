#!/bin/bash
set -e

echo "🚀 Starting user_core service..."

echo "📦 Setting up fresh database..."

# Create initial migration if none exists
if [ ! "$(ls -A alembic/versions/*.py 2>/dev/null)" ]; then
    echo "Creating initial migration..."
    alembic revision --autogenerate -m "initial_migration"
fi

# Apply migrations
alembic upgrade head

echo "✅ Database setup completed"

echo "🌐 Starting uvicorn server..."
PORT=${PORT:-8001}
exec uvicorn api.main:app --host 0.0.0.0 --port $PORT
