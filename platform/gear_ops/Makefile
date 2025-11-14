# Gear Operations Makefile
#
# 简单实用的开发命令快捷方式

.PHONY: help test migrate run send-reminders clean

help:
	@echo "Gear Operations - Available commands:"
	@echo ""
	@echo "  make test            - Run unit and integration tests"
	@echo "  make migrate         - Run database migrations"
	@echo "  make run             - Start the API server"
	@echo "  make send-reminders  - Run reminder sending job"
	@echo "  make clean           - Clean Python cache files"
	@echo ""

test:
	@echo "Running tests..."
	pytest tests/unit/gear_ops tests/integration/gear_ops -v

migrate:
	@echo "Running migrations..."
	cd $(shell pwd) && GEAR_DB_URL=$${DB_URL} alembic upgrade head

run:
	@echo "Starting Gear Operations API on port 8002..."
	python api/main.py

send-reminders:
	@echo "Sending pending reminders..."
	python jobs/send_reminders.py

clean:
	@echo "Cleaning Python cache..."
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	@echo "Done."
