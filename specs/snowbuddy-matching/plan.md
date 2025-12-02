# `snowbuddy-matching` 技術計畫書 (Plan)

## 1. 簡介 (Introduction)

本文件為 `snowbuddy-matching` 服務的技術實現提供詳細規劃。它將基於 `spec.md` 中定義的功能需求，闡述系統架構、資料流、核心演算法設計、API 實作策略以及與外部服務的整合方式，作為開發團隊的執行藍圖。

## 2. 系統架構 (System Architecture)

`snowbuddy-matching` 將被設計為一個**無狀態 (stateless) 的微服務**。其核心職責是處理媒合邏輯的運算，而不負責使用者資料或偏好的持久化儲存。這種設計確保了服務的輕量化、易於擴展和維護。

- **核心邏輯:** 接收媒合請求，向依賴的服務查詢所需資料，執行配對演算法，並回傳結果。
- **資料儲存:** 本服務**不會**建立自己的使用者資料庫。所有與使用者相關的資訊 (Profile, Preferences) 都將即時從 `user-core` 服務獲取。

## 3. 資料來源與依賴關係 (Data Sources & Dependencies)

本服務的運作高度依賴於平台內其他核心服務所提供的 API。

- **`user-core` (主要資料來源):**
  - **`GET /users`**: 用於獲取符合基本條件 (如：活躍、同意被媒合) 的潛在候選人列表。
  - **`GET /users/{user_id}`**: 用於獲取特定使用者的詳細公開資料 (如暱稱、滑雪等級)。
  - **`GET /users/{user_id}/preferences`**: 用於獲取使用者的媒合偏好設定。
  - **`POST /events`**: 用於回寫媒合生命週期中的所有關鍵行為事件 (如 `matching.request.sent`, `matching.request.accepted`)，實現行為紀錄的統一管理。

- **`resort-services` (地理資料來源):**
  - **`GET /resorts`**: 在處理以地點為基礎的媒合時，呼叫此 API 來驗證雪場 ID 的有效性，或獲取地區內的雪場列表。

- **`knowledge-engagement` (技能資料來源 - New):**
  - **`GET /users/{user_id}/skill-profile`**: 用於獲取使用者的知識測驗分數與技能評分。

## 4. 核心邏輯：媒合演算法 (Matching Algorithm)

媒合演算法是本服務的心臟。為了兼顧效能與準確性，建議採用一個分階段的計分模型。

1.  **階段一：候選人過濾 (Candidate Filtering)**
    - 根據搜尋者的基本條件 (如地理區域、可滑雪日期範圍)，向 `user-core` 的 `/users` 端點發起一個帶有篩選條件的請求，獲取一份廣泛的候選人名單，以縮小運算範圍。

2.  **階段二：多維度計分 (Multi-dimensional Scoring)**
    - 遍歷候選人名單，為每位候選人計算一個綜合「匹配分數」。該分數由多個加權因子組成：
      - **技能分數 (`skill_score`):** 計算雙方滑雪等級的接近程度。等級完全相同或在對方可接受範圍內，得分較高。
      - **知識分數 (`knowledge_score` - New):** (可選) 根據雙方在 `knowledge-engagement` 中的測驗分數計算相似度。
      - **地點分數 (`location_score`):** 計算雙方偏好雪場 (`preferred_resorts`) 的重疊程度。若有直接重疊，分數最高；若無，則計算偏好地區 (`preferred_regions`) 的重疊性。
      - **時間分數 (`availability_score`):** 計算雙方可滑雪日期的交集大小。
      - **角色分數 (`role_score`):** 根據「尋找角色」與「自身角色」的互補性給分。例如，尋找 `coach` 的 `student` 與 `coach` 身份的使用者匹配，得分最高。

3.  **階段三：排序與回傳 (Ranking & Return)**
    - 根據加權後的總分對所有候選人進行降序排序。
    - 回傳一個匿名的、分頁的 (`paginated`) 潛在雪伴列表，其中僅包含用於初步判斷的摘要資訊 (如暱稱、等級、地區)。

## 5. API 實作細節 (API Implementation Details)

- **技術棧:** 建議繼續使用 **Python** 與 **FastAPI** 框架，以保持技術棧的統一性，並利用其高效能與 OpenAPI 的無縫整合。

- **端點邏輯:**
  - **`POST /matching/searches`:**
    - 此端點接收到請求後，應將媒合運算作為一個**非同步的背景任務**來執行 (e.g., using FastAPI's `BackgroundTasks`)，以避免長時間的 HTTP 等待。
    - 立即回傳一個 `search_id`，供客戶端後續查詢結果。
  - **`GET /matching/searches/{search_id}`:**
    - 根據 `search_id` 查詢對應背景任務的狀態。若已完成，則回傳排序後的結果列表；若仍在運算中，則回傳處理中狀態。
  - **`POST /requests` & `PUT /requests/{request_id}`:**
    - 這兩個端點的核心職責是產生對應的行為事件 (`BehaviorEvent`)，並透過 `POST /events` 請求將其發送至 `user-core` 服務。它們本身不處理複雜的狀態管理，以維持服務的無狀態特性。

## 6. 行程驅動的媒合整合 (Trip-driven Matching Integration)

現有的 trip planning 工具與行程模型提供了 rich metadata（`resort_id`、`date range`、`max_buddies`、`visibility`），可作為自然的媒合觸發器。建議採取以下做法：

- **行程→偏好橋接**：每當 `Trip`（或 `CreateMultipleTripsTool`）建立成功後，就將該行程的 `resort_id`、`start_date`/`end_date`、`visibility` 等欄位轉換成 `MatchingPreference`，呼叫 `POST /matching/searches`，取得 `search_id`，並存回 `Trip` 的 metadata/notes（或新增 `trip_matching_id` 欄位）。
- **TripBuddy 回寫**：`snowbuddy-matching` 對候選人排序後，可自動建立 `TripBuddy` request（預設 pending），並透過 `POST /events` 把 `matching.request.sent` 等事件寫進 `user-core`，使 `Trip` 与 `TripBuddy` 形成有向關聯。
- **行程結果呈現**：`GET /matching/searches/{search_id}` 的返回資料可直接由 trip view 呼叫，顯示與該行程匹配的 snowbuddies / coaches；若使用者接受某候選人，可再觸發 `PUT /matching/requests/{request_id}` 將狀態更新並寫 `TripBuddy`。

此整合務求保持任何時候都不會干擾現有 trip CRUD API，同時讓行程本身變成媒合的觸發器與 persistable 資料來源，符合「Never break userspace」與可觀察性要求。

## 6. 快取策略 (Caching Strategy)

- **媒合結果快取:** `GET /matching/searches/{search_id}` 的查詢結果可以被快取一段較短的時間 (例如 5-10 分鐘)，以應對使用者在短時間內的重複查詢。
- **外部資料快取:** 在單次媒合運算過程中，從 `user-core` 和 `resort-services` 獲取的資料（如使用者偏好、雪場資訊）應在記憶體中進行快取，避免在計分階段對同一資源發起重複的 API 呼叫。
