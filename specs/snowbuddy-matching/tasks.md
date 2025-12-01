# `snowbuddy-matching` 開發任務列表 (Tasks)

本文件基於 `spec.md` 與 `plan.md`，將 `snowbuddy-matching` 服務的開發工作拆解為具體的、可追蹤的任務項。

## Epic 1: 專案初始化與基礎設定 (Project Scaffolding)

- [x] **T1.1:** 初始化 Python 專案，建立標準目錄結構 (e.g., `app/`, `tests/`)。
- [x] **T1.2:** 設定 `poetry` 或 `venv` 虛擬環境，並安裝基礎依賴：`fastapi`, `uvicorn`, `pydantic`。
- [x] **T1.3:** 安裝用於 API 呼叫的 `httpx` 函式庫。
- [x] **T1.4:** 建立基礎的 `main.py`，包含一個 `/health` 健康檢查端點。

## Epic 2: 外部服務客戶端建構 (API Clients)

- [x] **T2.1:** 建立 `app/clients/user_core_client.py` 模組。
  - [x] **T2.1.1:** 實作一個函式，用於呼叫 `user-core` 的 `GET /users` 端點，並能處理篩選參數。
  - [x] **T2.1.2:** 實作一個函式，用於呼叫 `user-core` 的 `POST /events` 端點，以提交行為事件。
- [x] **T2.2:** 建立 `app/clients/resort_services_client.py` 模組。
  - [x] **T2.2.1:** 實作一個函式，用於呼叫 `resort-services` 的 `GET /resorts` 端點。
- [x] **T2.3 (New):** 建立 `app/clients/knowledge_engagement_client.py` 模組。
  - [x] **T2.3.1:** 實作一個函式，用於呼叫 `knowledge-engagement` 的 `GET /users/{user_id}/skill-profile` 端點。

## Epic 3: 核心媒合引擎開發 (Matching Engine)

- [x] **T3.1:** 在 `app/models/` 中，使用 Pydantic 定義媒合偏好 (`MatchingPreference`) 與候選人資料 (`CandidateProfile`) 的資料模型。 **(已加入 `include_knowledge_score: bool` 欄位)**
- [x] **T3.2:** 建立 `app/core/matching_logic.py` 模組。
- [x] **T3.3:** 實作候選人過濾邏輯 (Phase 1)，根據基本條件向 `user-core` 發起初步查詢。
- [x] **T3.4:** 實作多維度計分函式 (Phase 2)，包含：
  - [x] **T3.4.1:** `calculate_skill_score()`
  - [x] **T3.4.2:** `calculate_location_score()` （已整合 `resort-services` 回傳的地點資料）
  - [x] **T3.4.3:** `calculate_availability_score()`
  - [x] **T3.4.4:** `calculate_role_score()`
  - [x] **T3.4.5 (New):** `calculate_knowledge_score()`（已串接 `knowledge-engagement`）
- [x] **T3.5:** 實作最終的排序與結果格式化邏輯 (Phase 3)，將候選人資料轉換為匿名的摘要格式。

## Epic 4: API 端點實作 (API Endpoints)

- [x] **T4.1:** 實作 `POST /matching/searches` 端點。
  - [x] **T4.1.1:** 整合 FastAPI 的 `BackgroundTasks`，將核心媒合演算法 (`T3.2`-`T3.5`) 作為背景任務執行。
  - [x] **T4.1.2:** 實作一個簡單的任務狀態管理器 (Redis-based)，用於儲存 `search_id` 與其對應的結果。
- [x] **T4.2:** 實作 `GET /matching/searches/{search_id}` 端點，用於查詢媒合任務的狀態與結果。
- [x] **T4.3:** 實作 `POST /matching/requests` 端點。
  - [x] **T4.3.1:** 根據請求內容，建構一個 `event_type` 為 `matching.request.sent` 的行為事件 payload。
  - [x] **T4.3.2:** 呼叫 `user_core_client` 將事件發送出去。
- [x] **T4.4:** 實作 `PUT /matching/requests/{request_id}` 端點。
  - [x] **T4.4.1:** 根據請求是 `accept` 還是 `decline`，建構對應的行為事件 (`matching.request.accepted` 或 `matching.request.declined`)。
  - [x] **T4.4.2:** 呼叫 `user_core_client` 將事件發送出去。

## Epic 5: 測試 (Testing)

- [x] **T5.1:** 安裝 `pytest` 和 `pytest-asyncio`。
- [x] **T5.2:** 為 `matching_logic.py` 中的計分函式撰寫單元測試。
- [x] **T5.3:** 使用 `TestClient` 和 `unittest.mock`，為所有 API 端點撰寫整合測試。
  - [x] **T5.3.1:** Mock `user-core` 和 `resort-services` 的 API 回應，以隔離測試 `snowbuddy-matching` 服務本身的邏輯。

## Epic 6: 部署準備 (Deployment)

- [x] **T6.1:** 撰寫 `Dockerfile`，定義服務的容器化環境。
- [x] **T6.2:** 更新根目錄的 `docker-compose.yml`，加入 `snowbuddy-matching` 服務，使其能與其他服務一同啟動。
- [x] **T6.3:** 撰寫一份簡易的 `README.md`，說明如何在本機啟動與測試此服務。

## Epic 7: 行程媒合整合 (Trip-aligned Matching)

- [ ] **T7.1:** 設計一個 helper，將 `Trip` 的 `resort_id`, `start_date`, `end_date`, `visibility` 等欄位轉換為 `MatchingPreference`，並考慮 `max_buddies` 與 `seeking_role`。
- [ ] **T7.2:** 在 `CreateMultipleTripsTool` 或 trip planning service 成功創建行程後，呼叫 `POST /matching/searches`，並把回傳的 `search_id` 儲存在該 Trip 的 metadata/notes/欄位。
- [ ] **T7.3:** 建立 `TripBuddy` 撈取流程，將 matching 結果（`MatchSummary`）以 pending request 形式寫入 `TripBuddy`，並透過 `matching.request.sent` 等事件保持一致。
- [ ] **T7.4:** 在 `run_matching_process` 中加入 `filter_candidates_by_trip(trip_info, candidates)` 邏輯，使得 scoring 只作用於與該 trip 地點/時間相符的使用者。
## 目前差距與調整建議

- **✓ 候選人過濾已實作 (T3.3):** 已在 `matching_logic.py` 中實作 `filter_candidates()` 函式，根據技能等級、地點偏好等條件預先過濾候選人，並在 `main.py` 的 `run_matching_process` 中使用，大幅提升效能。
- **✓ 知識分數已建立 (T3.4.5/T2.3):** 已建立 `app/clients/knowledge_engagement_client.py`，實作 `calculate_knowledge_score()` 函式，並在 `MatchingPreference` 模型中加入 `include_knowledge_score` 欄位。當啟用時，系統會從 `knowledge-engagement` 服務獲取技能檔案並計算相似度分數。
- **權重已調整:** 為了納入知識分數，計分權重已重新分配：
  - WEIGHT_SKILL: 0.3 (原 0.4)
  - WEIGHT_LOCATION: 0.25 (原 0.3)
  - WEIGHT_AVAILABILITY: 0.2 (維持)
  - WEIGHT_ROLE: 0.15 (原 0.1)
  - WEIGHT_KNOWLEDGE: 0.1 (新增)
- **行程媒合整合待實作 (Epic 7):** 需要與 Trip 模型和 trip planning service 整合，目前暫時無法完成，需要等待相關服務就緒。
