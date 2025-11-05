# Tasks: Unified Rider Identity Core

**Input**: `specs/user-core/spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`  
**Prerequisites**: 完成架構決策（語言、框架）、確認資料庫環境

## Phase 1: Setup (Shared Infrastructure)

**Goal**: 建立專案骨架與開發環境，讓後續任務有固定目錄與工具。

- [x] UC-T101 [P] [Setup] 建立 `platform/user_core/` 目錄與 `models/`, `schemas/`, `services/`, `api/`, `audit/` 子目錄。
- [x] UC-T102 [P] [Setup] 在 `requirements.txt` 新增 FastAPI、Pydantic、SQLAlchemy、psycopg、alembic、pytest、schemathesis 等依賴。
- [x] UC-T103 [Setup] 建立 `.env.example`，填入 `USER_CORE_DB_URL`, `USER_CORE_CHANGEFEED_URL`, `USER_CORE_API_KEY` 等環境變數。
- [x] UC-T104 [P] [Setup] 初始化 `platform/user_core/alembic/` 與 Alembic 設定（`alembic.ini`, `env.py` 指向 user_core schema）。
- [x] UC-T105 [Setup] 建立 `tests/unit/`, `tests/contract/`, `tests/integration/` 目錄與 pytest 設定。

---

## Phase 2: Foundational (Blocking Prerequisites)

**Goal**: 在開始任何 user story 前，完成資料層與服務框架，確保向後兼容與審計能力。

- [x] UC-T201 [Foundational] 設計初版 Alembic migration（`1a02e6b90c45_create_initial_tables.py`）涵蓋核心資料表。
- [x] UC-T202 [Foundational] 在 `platform/user_core/models/` 建立 ORM 模型（`user_profile.py`, `behavior_event.py`, `notification_preference.py`, `change_feed.py`, `legacy_mapping.py`）。
- [x] UC-T203 [Foundational] 在 `platform/user_core/schemas/` 建立 Pydantic schema（`user_profile.py`, `behavior_event.py`, `notification_preference.py`）。
- [x] UC-T203A [Foundational] 建立 `specs/shared/event_catalog.yaml` 與維護流程說明，供跨專案提交新事件型錄時使用。
- [x] UC-T204 [Foundational] 建立 `platform/user_core/services/db.py`（資料庫 session/交易管理）與 `config.py`（環境設定載入）。
- [x] UC-T205 [Foundational] 在 `platform/user_core/api/__init__.py` 建立 FastAPI 應用骨架（健康檢查、路由掛載）。
- [x] UC-T206 [Foundational] 建立 `platform/user_core/audit/logger.py` 與 `audit/publisher.py`，支援變更事件發佈。
- [ ] UC-T207 [Foundational] 建立 `tests/unit/user_core/test_models_basic.py` 驗證模型欄位與關聯，確保 schema 與 migration 對齊。
- [ ] UC-T208 [Foundational] 建立 `tests/contract/user_core/test_openapi_structure.py`，使用 `contracts/api-openapi.yaml` 驗證 FastAPI 路由初始對應。
- [x] UC-T209 [Foundational] 編寫 `specs/user-core/spec/MIGRATION_PLAN.md`，概述雙寫與回滾策略。

**Checkpoint**: 資料庫、模型、API 骨架與審計支援就緒，可開始各 User Story。

---

## Phase 3: User Story 1 - 建立與維護單一使用者檔案 (Priority: P1) 🎯 MVP

**Goal**: 提供 user profile CRUD 與合併流程，確保單一 `User ID` 生效。  
**Independent Test**: 使用 API 建立/更新/合併使用者，驗證資料庫與 change feed 皆正確。

- [x] UC-T301 [US1] 在 `platform/user_core/services/user_profile_service.py` 實作建立/更新/停用/合併邏輯，含審計記錄與 diff。
- [x] UC-T302 [US1] 在 `platform/user_core/api/user_profiles.py` 暴露 `/users`, `/users/{id}`, `/users/{id}/merge` 路由，串接 service。
- [ ] UC-T303 [US1] 實作 `legacy_mapping_service.py`，在建立/合併時管理 `LegacyMapping` 與 `legacy_ids`。（目前整合於 user_profile_service，待決定是否拆分模組）
- [x] UC-T304 [US1] 於 `platform/user_core/audit/publisher.py` 實做 webhook 發送，對接 change feed 契約。
- [x] UC-T305 [US1] 建立 `tests/integration/user_core/test_uc_e2e.py` 覆蓋 create/update/deactivate/merge 與 change feed。
- [ ] UC-T306 [US1] 建立 `tests/contract/user_core/test_user_profile_api.py`：以 OpenAPI schema 驗證 request/response。
- [ ] UC-T307 [US1] 實作 `scripts/migrations/user_core/backfill_members.py`，將 `members-utf8.csv` 匯入 `user_profiles`。

**Checkpoint**: User Profile API 可獨立運作並與 change feed 整合，可作為第一版 MVP。

---

## Phase 4: User Story 2 - 統一行為事件記錄 (Priority: P2)

**Goal**: 提供事件寫入與查詢，支援跨專案監控與分析。  
**Independent Test**: 模擬其他專案寫入事件並查詢，確認 schema 驗證與版本處理。

- [x] UC-T401 [US2] 在 `platform/user_core/services/behavior_event_service.py` 實作事件寫入、schema 驗證、版本控管與 SLA 計時。
- [x] UC-T402 [US2] 在 `platform/user_core/api/behavior_events.py` 實作 `/events` POST/GET，支援排序與來源過濾。
- [ ] UC-T403 [US2] 實作 `platform/user_core/schemas/event_catalog.py`，定義事件型錄與欄位驗證器。（以 `event_schema_registry.py` 部分替代，文件仍待補）
- [x] UC-T404 [US2] 更新 `tests/integration/user_core/test_uc_e2e.py` 覆蓋寫入成功、schema 錯誤、查詢篩選、自訂事件。
- [x] UC-T405 [US2] 建立 `tests/contract/user_core/test_openapi_contract.py`，確認 OpenAPI 與實作一致。
- [ ] UC-T406 [US2] 在 `platform/user_core/audit/publisher.py` 增加 `publish_behavior_event_metrics(...)` stub（供後續監控使用）。
- [ ] UC-T407 [US2] 更新 `specs/user-core/data-model.md` 的 Event Catalog 並同步到 `contracts/api-openapi.yaml`。

**Checkpoint**: 行為事件寫入與查詢完成，可供其他專案串接。

---

## Phase 5: User Story 3 - 管理推播偏好與授權 (Priority: P3)

**Goal**: 集中管理推播設定，確保通知尊重使用者選擇。  
**Independent Test**: 更新偏好並模擬下游服務查詢，確保同步與授權正確。

- [x] UC-T501 [US3] 在 `platform/user_core/services/notification_preference_service.py` 實作偏好 upsert/查詢與審計。
- [x] UC-T502 [US3] 在 `platform/user_core/api/notification_preferences.py` 實作 `/users/{id}/preferences` GET/PUT。
- [x] UC-T503 [US3] 以 `change_feed_service.publish_change_event` 通用邏輯處理偏好變更。
- [x] UC-T504 [US3] 更新 `tests/integration/user_core/test_uc_e2e.py` 覆蓋偏好更新、授權邏輯、變更事件。
- [x] UC-T505 [US3] 更新 `contracts/change-feed.md` Snapshot 範例，如新增欄位或 metadata。
- [ ] UC-T506 [US3] 建立 `scripts/seeds/load_sample_preferences.py`，匯入初始偏好或停用預設。
- [ ] UC-T507 [US3] 產生 `notification_preference_templates.csv/json` 並於 migration/seed 階段載入，涵蓋各國預設與 consent 要求。

**Checkpoint**: 推播偏好流程可獨立運作並支援 change feed。

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] UC-T601 [Polish] 將 `quickstart.md` 中的步驟落實為 `Makefile` 或 `scripts/dev/setup.sh`，方便一鍵啟動。
- [ ] UC-T602 [Polish] 設定 OpenTelemetry / logging，收集 API latency 與事件處理指標。
- [ ] UC-T603 [Polish] 實作 `tests/integration/user_core/test_dual_write_migration.py`，模擬舊系統雙寫並驗證資料一致性。
- [ ] UC-T604 [Polish] 與安全團隊確認 API key 或 OAuth 流程，更新 `contracts/api-openapi.yaml` 安全性段落。
- [ ] UC-T605 [Polish] 進行負載測試腳本（`tests/perf/user_core/load_events.py`），確保事件寫入成功率符合 SC-002。
- [ ] UC-T606 [Polish] 更新 `PROJECTS.md` 的 Shared Infrastructure，描述 user-core API 與 change feed 接入方式。
- [ ] UC-T607 [Polish] 完成發佈前 Checklist：遷移演練、回滾測試、監控告警驗證，記錄於 `docs/user-core/release-checklist.md`。
- [ ] UC-T608 [Polish] 評估 change feed 從 webhook 升級至 Kafka/SNS 的門檻與計畫，產出升級提案文件。

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → User Stories（3, 4, 5）→ Phase 6。  
- User Stories 可在 Phase 2 完成後依優先度分工，但需確保 change feed/publisher 共享模組協調。  
- 所有測試目錄與腳本建立後應納入 CI，確保每個故事在合併前獨立驗證。
