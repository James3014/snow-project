# SnowTrace 開發工具 Makefile
# 統一程式碼品質和開發流程

.PHONY: help install test lint format type-check clean build docker-build docker-up docker-down

# 預設目標
help:
	@echo "SnowTrace 開發工具"
	@echo ""
	@echo "可用命令:"
	@echo "  install      - 安裝開發依賴"
	@echo "  test         - 執行所有測試"
	@echo "  test-unit    - 執行單元測試"
	@echo "  test-integration - 執行整合測試"
	@echo "  lint         - 執行程式碼檢查"
	@echo "  format       - 格式化程式碼"
	@echo "  type-check   - 執行型別檢查"
	@echo "  clean        - 清理暫存檔案"
	@echo "  build        - 構建所有服務"
	@echo "  docker-build - 構建 Docker 映像"
	@echo "  docker-up    - 啟動所有服務"
	@echo "  docker-down  - 停止所有服務"

# 安裝開發依賴
install:
	pip install --break-system-packages black isort flake8 mypy pytest pytest-cov pytest-asyncio
	@echo "✅ 開發依賴安裝完成"

# 測試相關
test:
	@echo "🧪 執行所有測試..."
	PYTHONPATH=. python3 -m pytest tests/ -v --cov=services --cov=platform --cov-report=term-missing

test-unit:
	@echo "🧪 執行單元測試..."
	PYTHONPATH=. python3 -m pytest tests/ -v -m "not integration"

test-integration:
	@echo "🧪 執行整合測試..."
	PYTHONPATH=. python3 -m pytest tests/ -v -m "integration"

test-services:
	@echo "🧪 執行服務測試..."
	PYTHONPATH=. python3 -m pytest tests/services/ -v

test-frontend:
	@echo "🧪 執行前端測試..."
	@if [ -d "tests/frontend" ]; then \
		PYTHONPATH=. python3 -m pytest tests/frontend/ -v; \
	else \
		echo "前端測試需要 Jest 環境"; \
	fi

# 程式碼品質
lint:
	@echo "🔍 執行程式碼檢查..."
	flake8 services/ platform/ --count --select=E9,F63,F7,F82 --show-source --statistics
	flake8 services/ platform/ --count --exit-zero --max-complexity=10 --max-line-length=100 --statistics

format:
	@echo "🎨 格式化程式碼..."
	black services/ platform/ tests/
	isort services/ platform/ tests/
	@echo "✅ 程式碼格式化完成"

format-check:
	@echo "🎨 檢查程式碼格式..."
	black --check services/ platform/ tests/
	isort --check-only services/ platform/ tests/

type-check:
	@echo "🔍 執行型別檢查..."
	mypy services/ --ignore-missing-imports
	@echo "✅ 型別檢查完成"

# 清理
clean:
	@echo "🧹 清理暫存檔案..."
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	find . -type f -name ".coverage" -delete
	@echo "✅ 清理完成"

# 構建
build:
	@echo "🏗️ 構建所有服務..."
	@for service in calendar-service gear-service social-service; do \
		echo "構建 $$service..."; \
		cd services/$$service && python3 -m py_compile *.py && cd ../..; \
	done
	@echo "✅ 構建完成"

# Docker 相關
docker-build:
	@echo "🐳 構建 Docker 映像..."
	docker-compose build

docker-up:
	@echo "🚀 啟動所有服務..."
	docker-compose up -d

docker-down:
	@echo "🛑 停止所有服務..."
	docker-compose down

docker-logs:
	@echo "📋 查看服務日誌..."
	docker-compose logs -f

# 開發環境
dev-setup: install
	@echo "🔧 設置開發環境..."
	@if [ ! -f .env ]; then \
		cp .env.example .env 2>/dev/null || echo "NODE_ENV=development" > .env; \
	fi
	@echo "✅ 開發環境設置完成"

# 程式碼品質檢查 (CI/CD 用)
ci-check: format-check lint type-check test
	@echo "✅ 所有檢查通過"

# 快速檢查
quick-check:
	@echo "⚡ 快速檢查..."
	PYTHONPATH=. python3 -m pytest tests/services/test_config_service.py tests/services/test_service_discovery.py tests/services/test_load_balancer.py tests/services/test_error_handler.py -v
	@echo "✅ 快速檢查完成"

# 服務健康檢查
health-check:
	@echo "🏥 檢查服務健康狀態..."
	@curl -s http://localhost:8080/health || echo "API Gateway 未運行"
	@curl -s http://localhost:8001/health || echo "User Core 未運行"
	@curl -s http://localhost:8003/health || echo "Calendar Service 未運行"
	@curl -s http://localhost:8004/health || echo "Gear Service 未運行"
	@curl -s http://localhost:8005/health || echo "Social Service 未運行"
