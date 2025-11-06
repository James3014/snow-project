#!/bin/bash
# Startup script for user_core service with automatic database migration

set -e  # Exit on error

echo "🚀 Starting user_core service..."

# Step 1: Run database migrations
echo "📦 Running database migrations..."
alembic upgrade head

# Check if migration was successful
if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed successfully"
else
    echo "❌ Database migration failed!"
    exit 1
fi

# Step 2: Start the application
echo "🌐 Starting uvicorn server..."
exec uvicorn api.main:app --host 0.0.0.0 --port 8001
