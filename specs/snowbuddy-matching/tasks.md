# `snowbuddy-matching` 開發任務列表 (Tasks)

本文件基於 `spec.md` 與 `plan.md`，將 `snowbuddy-matching` 服務的開發工作拆解為具體的、可追蹤的任務項。

## Epic 1: 專案初始化與基礎設定 (Project Scaffolding)

- [ ] **T1.1:** 初始化 Python 專案，建立標準目錄結構 (e.g., `app/`, `tests/`)。
- [ ] **T1.2:** 設定 `poetry` 或 `venv` 虛擬環境，並安裝基礎依賴：`fastapi`, `uvicorn`, `pydantic`。
- [ ] **T1.3:** 安裝用於 API 呼叫的 `httpx` 函式庫。
- [ ] **T1.4:** 建立基礎的 `main.py`，包含一個 `/health` 健康檢查端點。

## Epic 2: 外部服務客戶端建構 (API Clients)

- [ ] **T2.1:** 建立 `app/clients/user_core_client.py` 模組。
  - [ ] **T2.1.1:** 實作一個函式，用於呼叫 `user-core` 的 `GET /users` 端點，並能處理篩選參數。
  - [ ] **T2.1.2:** 實作一個函式，用於呼叫 `user-core` 的 `POST /events` 端點，以提交行為事件。
- [ ] **T2.2:** 建立 `app/clients/resort_services_client.py` 模組。
  - [ ] **T2.2.1:** 實作一個函式，用於呼叫 `resort-services` 的 `GET /resorts` 端點。
- [ ] **T2.3 (New):** 建立 `app/clients/knowledge_engagement_client.py` 模組。
  - [ ] **T2.3.1:** 實作一個函式，用於呼叫 `knowledge-engagement` 的 `GET /users/{user_id}/skill-profile` 端點。

## Epic 3: 核心媒合引擎開發 (Matching Engine)

- [ ] **T3.1:** 在 `app/models/` 中，使用 Pydantic 定義媒合偏好 (`MatchingPreference`) 與候選人資料 (`CandidateProfile`) 的資料模型。 **(需新增 `include_knowledge_score: bool` 欄位)**
- [ ] **T3.2:** 建立 `app/core/matching_logic.py` 模組。
- [ ] **T3.3:** 實作候選人過濾邏輯 (Phase 1)，根據基本條件向 `user-core` 發起初步查詢。
- [ ] **T3.4:** 實作多維度計分函式 (Phase 2)，包含：
  - [ ] **T3.4.1:** `calculate_skill_score()`
  - [ ] **T3.4.2:** `calculate_location_score()` (此函式可能需要呼叫 `resort-services` client)
  - [ ] **T3.4.3:** `calculate_availability_score()`
  - [ ] **T3.4.4:** `calculate_role_score()`
  - [ ] **T3.4.5 (New):** `calculate_knowledge_score()`
- [ ] **T3.5:** 實作最終的排序與結果格式化邏輯 (Phase 3)，將候選人資料轉換為匿名的摘要格式。

## Epic 4: API 端點實作 (API Endpoints)

- [ ] **T4.1:** 實作 `POST /matching/searches` 端點。
  - [ ] **T4.1.1:** 整合 FastAPI 的 `BackgroundTasks`，將核心媒合演算法 (`T3.2`-`T3.5`) 作為背景任務執行。
  - [ ] **T4.1.2:** 實作一個簡單的任務狀態管理器 (in-memory or Redis-based)，用於儲存 `search_id` 與其對應的結果。
- [ ] **T4.2:** 實作 `GET /matching/searches/{search_id}` 端點，用於查詢媒合任務的狀態與結果。
- [ ] **T4.3:** 實作 `POST /matching/requests` 端點。
  - [ ] **T4.3.1:** 根據請求內容，建構一個 `event_type` 為 `matching.request.sent` 的行為事件 payload。
  - [ ] **T4.3.2:** 呼叫 `user_core_client` 將事件發送出去。
- [ ] **T4.4:** 實作 `PUT /matching/requests/{request_id}` 端點。
  - [ ] **T4.4.1:** 根據請求是 `accept` 還是 `decline`，建構對應的行為事件 (`matching.request.accepted` 或 `matching.request.declined`)。
  - [ ] **T4.4.2:** 呼叫 `user_core_client` 將事件發送出去。

## Epic 5: 測試 (Testing)

- [ ] **T5.1:** 安裝 `pytest` 和 `pytest-asyncio`。
- [ ] **T5.2:** 為 `matching_logic.py` 中的計分函式撰寫單元測試。
- [ ] **T5.3:** 使用 `TestClient` 和 `unittest.mock`，為所有 API 端點撰寫整合測試。
  - [ ] **T5.3.1:** Mock `user-core` 和 `resort-services` 的 API 回應，以隔離測試 `snowbuddy-matching` 服務本身的邏輯。

## Epic 6: 部署準備 (Deployment)

- [ ] **T6.1:** 撰寫 `Dockerfile`，定義服務的容器化環境。
- [ ] **T6.2:** 更新根目錄的 `docker-compose.yml`，加入 `snowbuddy-matching` 服務，使其能與其他服務一同啟動。
- [ ] **T6.3:** 撰寫一份簡易的 `README.md`，說明如何在本機啟動與測試此服務。
