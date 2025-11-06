.PHONY: help install test test-unit test-contract test-integration clean dev-user-core dev-resort dev-snowbuddy up down

help:  ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install:  ## Install all dependencies
	pip install -r platform/user_core/requirements.txt
	pip install -r resort_api/requirements.txt
	pip install -r snowbuddy_matching/requirements.txt

test:  ## Run all tests
	pytest tests/ -v

test-unit:  ## Run unit tests only
	pytest tests/unit/ -v

test-contract:  ## Run contract tests only
	pytest tests/contract/ -v

test-integration:  ## Run integration tests only
	pytest tests/integration/ -v

test-user-core:  ## Run all user-core tests
	pytest tests/unit/user_core/ tests/contract/user_core/ tests/integration/user_core/ -v

clean:  ## Clean temporary files
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.db" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true

dev-user-core:  ## Run user-core service locally
	cd platform/user_core && uvicorn api.main:app --reload --port 8001

dev-resort:  ## Run resort-services locally
	cd resort_api && uvicorn app.main:app --reload --port 8000

dev-snowbuddy:  ## Run snowbuddy-matching locally
	cd snowbuddy_matching && uvicorn app.main:app --reload --port 8002

up:  ## Start all services with docker-compose
	docker-compose up --build

down:  ## Stop all services
	docker-compose down

migrate-user-core:  ## Run user-core database migrations
	cd platform/user_core && alembic upgrade head

seed-preferences:  ## Load sample notification preferences
	python scripts/seeds/load_sample_preferences.py --db-url sqlite:///./user_core.db --dry-run

backfill-members:  ## Backfill legacy members (dry-run)
	@echo "Run: python scripts/migrations/user_core/backfill_members.py --members <CSV> --output <OUT> --dry-run"
