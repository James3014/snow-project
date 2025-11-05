# `resort-services` 開發任務列表 (Tasks)

本文件將 `spec.md` 中定義的功能需求與 `plan.md` 中的技術規劃，拆解為具體、可執行的開發任務。開發人員可依此列表循序漸進地完成 `resort-services` 的建構。

## Epic 1: 專案基礎建設 (Project Scaffolding & Setup)

- [ ] **T1.1:** 初始化一個新的 Python 專案目錄結構。
- [ ] **T1.2:** 使用 `venv` 或 `poetry` 建立專案的虛擬環境。
- [ ] **T1.3:** 安裝核心依賴套件：`fastapi`, `uvicorn`, `pydantic`, `PyYAML`。
- [ ] **T1.4:** 建立基礎的 `main.py` 檔案，並設定一個簡單的 `/health` 健康檢查端點。

## Epic 2: 資料層建構 (Data Layer Construction)

- [ ] **T2.1:** 根據 `api-openapi.yaml` 中的 Schema，使用 Pydantic 建立對應的資料模型 (e.g., `Resort`, `Course`, `SnowStats` 等)。
- [ ] **T2.2:** 建立 `data_loader.py` 模組，用於處理資料的載入與解析。
- [ ] **T2.3:** 在 `data_loader.py` 中，實作一個函式，使其能遞迴掃描 `specs/resort-services/data/` 目錄下的所有 `.yaml` 檔案。
- [ ] **T2.4:** 實作 YAML 檔案的解析邏輯，並使用 T2.1 中建立的 Pydantic 模型進行資料驗證，確保資料格式的正確性。
- [ ] **T2.5:** 建立一個單例 (Singleton) 或全域服務 (`data_store.py`)，在服務啟動時呼叫 `data_loader`，並將所有雪場資料儲存在一個以 `resort_id` 為鍵的記憶體字典中，以供快速查詢。

## Epic 3: API 核心功能實作 (Core API Implementation)

- [ ] **T3.1:** 在 `main.py` 中，實作 `GET /resorts` 端點。
  - [ ] **T3.1.1:** 實現從 `data_store` 獲取所有雪場列表的邏輯。
  - [ ] **T3.1.2:** 新增依 `region` 和 `country_code` 進行篩選的功能。
  - [ ] **T3.1.3:** 新增依 `q` 參數對名稱、描述等欄位進行關鍵字搜尋的功能。
  - [ ] **T3.1.4:** 實現分頁邏輯 (`limit` 和 `cursor`)。
- [ ] **T3.2:** 實作 `GET /resorts/{resort_id}` 端點。
  - [ ] **T3.2.1:** 實現從 `data_store` 的字典中直接查詢特定 `resort_id` 的邏輯。
  - [ ] **T3.2.2:** 處理找不到 `resort_id` 時回傳 404 錯誤的情況。
- [ ] **T3.3:** 根據 `plan.md` 的規劃，為 API 端點加上快取機制 (可先從簡單的 in-memory TTL cache 開始)。

## Epic 4: 外部服務整合 (External Service Integration)

- [ ] **T4.1:** 實作 `POST /users/{user_id}/ski-history` 端點。
- [ ] **T4.2:** 安裝 `httpx` 或 `requests` 函式庫，用於發起 HTTP 請求。
- [ ] **T4.3:** 根據 `user-core` 的 API 規格，定義 `BehaviorEventCreate` 的 Pydantic 模型。
- [ ] **T4.4:** 在端點邏輯中，建構 `BehaviorEventCreate` 物件，並向 `user-core` 服務的 `/events` 端點發送 `POST` 請求。
- [ ] **T4.5:** 處理與 `user-core` 服務通訊時可能發生的網路錯誤或 API 錯誤。

## Epic 5: 分享圖卡功能開發 (Feature: Shareable Card)

- [ ] **T5.1:** 安裝 `Pillow` 圖片處理函式庫。
- [ ] **T5.2:** 設計並建立至少一款分享圖卡的背景圖片範本 (`template.png`)。
- [ ] **T5.3:** 建立 `card_generator.py` 模組。
- [ ] **T5.4:** 在模組中，實作一個函式，接收 `resort` 物件，使用 Pillow 將雪場名稱、標語等文字繪製到背景範本上。
- [ ] **T5.5:** 實作 `GET /resorts/{resort_id}/share-card` 端點，該端點呼叫圖卡生成函式，並回傳一個 `image/png` 格式的 HTTP Response。

## Epic 6: 測試與驗證 (Testing & Validation)

- [ ] **T6.1:** 安裝 `pytest` 測試框架。
- [ ] **T6.2:** 為 `data_loader.py` 撰寫單元測試，確保 YAML 檔案能被正確解析與驗證。
- [ ] **T6.3:** 使用 FastAPI 的 `TestClient`，為所有 API 端點撰寫整合測試，驗證其篩選、分頁、錯誤處理等邏輯是否正確。
- [ ] **T6.4:** 為 `card_generator.py` 撰寫單元測試，確保圖片生成邏輯的正確性。

## Epic 7: 部署準備 (Deployment)

- [ ] **T7.1:** 撰寫 `Dockerfile`，將 FastAPI 應用程式打包成一個標準的容器映像檔。
- [ ] **T7.2:** 撰寫 `docker-compose.yml` 檔案，用於在本機環境中快速啟動服務及其可能的依賴 (如 Redis 快取)。
- [ ] **T7.3:** 撰寫一份簡易的部署說明文件 (`DEPLOYMENT.md`)。
