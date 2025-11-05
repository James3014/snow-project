# Tasks: Gear Operations & Maintenance

**Input**: `specs/gear-ops/spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

## Phase 1: Setup

- [ ] GO-T101 [P][Setup] 建立 `platform/gear_ops/` 目錄與 `models/`, `schemas/`, `services/`, `api/`, `jobs/`, `integrations/`, `audit/`。 
- [ ] GO-T102 [P][Setup] 建立 `requirements-gear.txt`，列出 FastAPI、SQLAlchemy、Pydantic、Celery/APS、redis、httpx、pytest、schemathesis。 
- [ ] GO-T103 [Setup] 建立 `.env.gear.example`，包含 `GEAR_DB_URL`, `GEAR_REDIS_URL`, `USER_CORE_BASE_URL`, `NOTIFICATION_GATEWAY_URL` 等。 
- [ ] GO-T104 [P][Setup] 初始化 `scripts/migrations/gear_ops/` 與 Alembic 設定。 
- [ ] GO-T105 [Setup] 建立 `tests/unit|integration|contract/gear_ops` 目錄與 pytest 設定。 

## Phase 2: Foundational

- [ ] GO-T201 設計 Alembic migration：建立 `gear_items`, `gear_inspections`, `gear_reminders`, `gear_listings`, `gear_trades`, `gear_recommendations`, `gear_safety_flags`。 
- [ ] GO-T202 實作 ORM 模型與 Pydantic schema（對應資料表）。 
- [ ] GO-T203 建立 `integrations/user_core_client.py`, `notification_client.py`, `payment_provider.py` stub。 
- [ ] GO-T204 建立 `api/__init__.py`（FastAPI 應用、API key middleware、health endpoint）。 
- [ ] GO-T205 建立 `audit/logger.py` 與 `changefeed/publisher.py` stub。 
- [ ] GO-T206 撰寫 `tests/unit/gear_ops/test_models_schema.py`。 
- [ ] GO-T207 設計 `docs/gear-ops/migration-plan.md`，列出雙寫與回滾策略。 

**Checkpoint**: 基礎資料層與 API 骨架完成。

## Phase 3: User Story 1 - 裝備檢查與提醒 (P1)

- [ ] GO-T301 建立 `services/inventory.py`（GearItem CRUD）與 `api/items.py`。 
- [ ] GO-T302 建立 `services/inspections.py` 處理檢查流程與 checklist 驗證。 
- [ ] GO-T303 實作 `api/inspections.py` 與對應 contract 測試。 
- [ ] GO-T304 實作 `services/reminders.py` 與 `jobs/reminder_runner.py`，串接 NotificationPreference。 
- [ ] GO-T305 更新 change feed publisher 發布 `gear.check.completed`、`gear.reminder.sent`。 
- [ ] GO-T306 建立 `tests/integration/gear_ops/test_inspection_and_reminder_flow.py`。 
- [ ] GO-T307 撰寫 `scripts/tools/run_gear_reminder_simulation.py`。 

**Checkpoint**: 檢查/提醒流程可獨立運作。

## Phase 4: User Story 2 - 雪具買賣與交易管理 (P2)

- [ ] GO-T401 實作 `services/marketplace.py`，涵蓋刊登、搜尋、狀態更新。 
- [ ] GO-T402 建立 `api/listings.py`, `api/trades.py`。 
- [ ] GO-T403 實作交易流程、狀態機（含 `disputed`）。 
- [ ] GO-T404 更新 change feed：`gear.trade.posted`, `gear.trade.completed`。 
- [ ] GO-T405 建立 `tests/integration/gear_ops/test_marketplace_flow.py`。 
- [ ] GO-T406 如需金流，撰寫 `integrations/payment_provider.py` stub 與模擬。 

**Checkpoint**: 買賣流程與交易記錄可運作。

## Phase 5: User Story 3 - 保養建議與安全追蹤 (P3)

- [ ] GO-T501 實作 `services/recommendations.py`，根據檢查與使用數據生成建議。 
- [ ] GO-T502 建立 `api/recommendations.py` 與 `api/safety.py`。 
- [ ] GO-T503 在 `services/safety.py` 管理 GearSafetyFlag 與客服流程 hooks。 
- [ ] GO-T504 更新 change feed：`gear.recommendation.sent`, `gear.flag.raised`。 
- [ ] GO-T505 建立 `tests/integration/gear_ops/test_recommendation_and_flag_flow.py`。 
- [ ] GO-T506 撰寫 `docs/gear-ops/safety-playbook.md`，定義客服介入流程。 

**Checkpoint**: 保養建議與安全審查可獨立運作。

## Phase 6: Polish

- [ ] GO-T601 建立 `Makefile` / `scripts/dev/setup_gear.sh`。 
- [ ] GO-T602 整合 OpenTelemetry 指標（提醒、交易、旗標）。 
- [ ] GO-T603 建立 `tests/perf/gear_ops/test_reminder_performance.py`，模擬大量提醒。 
- [ ] GO-T604 更新 `PROJECTS.md` Shared Infrastructure（gear API、事件、依賴）。 
- [ ] GO-T605 撰寫 `docs/gear-ops/changefeed-upgrade.md`（webhook → Kafka/SNS）。 
- [ ] GO-T606 準備發佈 Checklist：資料備援、回滾、客服訓練。 
