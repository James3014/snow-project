# `resort-services` 技術計畫書 (Plan)

## 1. 簡介 (Introduction)

本文件旨在為 `resort-services` 的開發與實作提供一份清晰的技術藍圖。內容涵蓋系統架構、資料管理、API 實作細節、快取策略、與外部服務的整合，以及特定功能的實現方案，以作為後續開發任務的依據。

## 2. 系統架構 (System Architecture)

`resort-services` 將作為一個獨立的、無狀態 (stateless) 的微服務來建構。其核心職責是提供雪場資料的唯讀存取，並處理與雪場相關的特定業務邏輯 (如生成分享圖卡)。

- **資料來源 (Data Source):** 服務的主要資料來源是 `specs/resort-services/data/` 目錄下的所有 YAML 檔案。這些檔案被視為雪場資料的「原始真相 (Source of Truth)」。
- **API:** 服務將透過 RESTful API 對外提供功能，其介面規格嚴格遵循 `api-openapi.yaml` 文件的定義。
- **部署:** 服務將被容器化 (e.g., using Docker)，以便於在任何雲端環境中進行標準化部署。

## 3. 資料管理策略 (Data Management Strategy)

為了實現高效能的讀取操作，本服務將採用記憶體快取 (In-memory) 的資料管理策略。

- **資料載入 (Data Loading):** 在服務啟動時，將執行一個初始化腳本。該腳本會遞迴地讀取 `data/` 目錄下的所有 `.yaml` 檔案，解析其內容，並將所有雪場的資料載入到服務的記憶體中。
- **資料結構 (Data Structure):** 為了實現 O(1) 時間複雜度的快速查詢，所有雪場物件將儲存在一個以 `resort_id` 為鍵 (key) 的字典 (dictionary/hash map) 中。同時，會維護一個包含所有雪場物件的列表 (list)，用於支援篩選和搜尋等迭代操作。
- **資料更新:** 當雪場的 YAML 檔案發生變更時，需要重新啟動服務以載入最新資料。在更成熟的系統中，可引入檔案監控 (file watching) 或 Webhook 機制來觸發熱重載 (hot-reloading)，但在初期版本中，重啟服務是可接受的方案。

## 4. API 實作細節 (API Implementation Details)

- **技術棧 (Tech Stack):** 建議使用 **Python** 搭配 **FastAPI** 框架。FastAPI 以其高效能、與 OpenAPI 的原生整合以及基於 Pydantic 的自動資料驗證而聞名，非常適合快速開發符合我們規格的 API。

- **端點邏輯 (Endpoint Logic):**
  - **`GET /resorts`:**
    1. 從記憶體中的雪場列表開始。
    2. 依次應用請求中提供的篩選條件 (如 `region`, `country_code`, `amenities`)。
    3. 若提供 `q` 參數，則對雪場的 `names`、`description.tagline` 等文字欄位進行不區分大小寫的包含性搜尋。
    4. 對篩選後的結果進行分頁處理，並回傳 `ResortSummary` 物件列表。
  - **`GET /resorts/{resort_id}`:**
    1. 直接從記憶體中的雪場字典中，使用傳入的 `resort_id` 進行查詢。
    2. 若找到，回傳完整的 `Resort` 物件。
    3. 若未找到，回傳 HTTP 404 錯誤。

## 5. 快取策略 (Caching Strategy)

由於雪場資料相對靜態 (不常變動)，引入快取能顯著提升效能並降低伺服器負載。

- **策略:** 採用基於時間的 TTL (Time-To-Live) 快取。
- **實作:**
  - 對於 `GET /resorts` 端點，可以將不同篩選條件組合的結果進行快取。例如，使用像 `memcached` 或 `Redis` 這樣的外部快取服務。
  - 對於 `GET /resorts/{resort_id}` 端點，由於是高頻率的單一物件查詢，非常適合進行快取。可以設定一個較長的 TTL (例如 1 小時或更長)。
  - 在服務的初期版本，也可以使用簡單的記憶體內快取 (in-memory cache) 函式庫 (如 `cachetools` in Python) 來實現。

## 6. 外部服務整合計畫 (Integration Plan)

本服務需要與 `user-core` 服務進行互動，以實現使用者滑雪足跡的紀錄。

- **FR3.1: 紀錄滑雪足跡 (`POST /users/{user_id}/ski-history`)**
  - 此端點在接收到請求後，**不會** 在 `resort-services` 自己的資料庫中儲存任何資訊。
  - 其唯一職責是作為一個轉發器 (forwarder) 和事件產生器。
  - 它將根據請求內容 (包含 `user_id`, `resort_id`, `date`)，建構一個符合 `user-core` API 規格的 `BehaviorEventCreate` 物件。
  - 該物件的 `source_project` 將設為 `resort-services`，`event_type` 設為 `resort.visited`。
  - 最後，它將向 `user-core` 服務的 `/events` 端點發起一個 `POST` 請求，將此行為事件提交給 `user-core` 進行統一紀錄。
  - 這種設計遵循了專案的事件驅動架構，確保了服務之間的低耦合性。

## 7. 特色功能實作方案 (Feature Implementation)

- **FR4.1: 分享圖卡生成 (`GET /resorts/{resort_id}/share-card`)**
  - **技術選型:** 使用 Python 的 **Pillow** (PIL Fork) 函式庫來進行圖片處理與生成。
  - **實作流程:**
    1. 設計一個或多個分享圖卡的背景範本 (template image)，可以是包含專案 Logo 和設計元素的 PNG 檔案。
    2. 當此 API 被呼叫時，服務會先根據 `resort_id` 獲取雪場的詳細資料。
    3. 載入背景範本圖片。
    4. 使用 Pillow 的繪圖功能，將雪場名稱、一句亮點描述 (如「最長滑道：8km！」)、以及個人化資訊 (如果 API 提供了 `user_id` 和 `date`) 等文字內容，繪製到背景圖片的指定位置上。
    5. 將合成後的圖片以 `image/png` 或 `image/jpeg` 的格式作為 HTTP 回應直接回傳。
  - 此功能模組應設計為可獨立測試的單元。
