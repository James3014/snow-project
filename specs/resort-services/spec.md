# `resort-services` 功能規格書 (Specification)

## 1. 專案願景與範疇 (Vision & Scope)

`resort-services` 專案的核心目標是成為 SnowTrace 平台中所有雪場資訊的權威來源 (Single Source of Truth)。它負責管理、提供全球滑雪場的地理、設施、雪道、交通等詳細資料，並以此為基礎，支援使用者紀錄個人滑雪足跡、查詢交通方式，以及生成可用於社群分享的個人化圖卡。

此服務是平台地理與時序資料的基礎，將為 `snowbuddy-matching` (雪伴媒合)、`coach-scheduling` (教練排課) 等其他專案提供必要的雪場資料支援。

## 2. 使用者故事 (User Stories)

### 作為一名滑雪愛好者 (Rider):

- **探索與規劃:**
  - `AS A` Rider, `I WANT TO` 瀏覽和搜尋所有可用的滑雪場，`SO THAT` 我可以規劃我接下來的滑雪旅行。
  - `AS A` Rider, `I WANT TO` 根據地區 (如「新潟縣」)、國家 (如「JP」) 或設施 (如「有夜滑」、「有兒童公園」) 來篩選雪場，`SO THAT` 我能快速找到符合我需求的雪場。
  - `AS A` Rider, `I WANT TO` 查看特定雪場的詳細資訊，包含雪道數量、難易度比例、最長滑道、交通方式、票價等，`SO THAT` 我能做出最充分的行前準備。

- **紀錄與分享:**
  - `AS A` Rider, `I WANT TO` 標記我去過某個雪場，並紀錄下日期，`SO THAT` 我可以建立我的個人滑雪地圖和歷史足跡。
  - `AS A` Rider, `I WANT TO` 將我喜歡的雪場資訊，生成一張包含重點資訊 (如雪場名稱、代表性雪道、我的滑行日期) 的精美圖卡，`SO THAT` 我可以方便地在社群媒體上分享我的滑雪體驗。

- **交通與決策:**
  - `AS A` Rider, `I WANT TO` 查詢從我所在地或主要交通樞紐 (如「東京車站」) 前往目標雪場的建議交通方式與預估時間，`SO THAT` 我可以更輕鬆地規劃我的交通行程。

### 作為其他專案的開發者 (Developer):

- `AS A` Developer of `snowbuddy-matching`, `I WANT TO` 透過 API 查詢雪場列表及其基本資料 (如地點、規模)，`SO THAT` 我可以在媒合雪伴時，提供使用者選擇滑雪地點的功能。
- `AS A` Developer of `user-core`, `I WANT TO` 接收來自 `resort-services` 的滑雪足跡紀錄請求，`SO THAT` 我能將其作為一個標準化的「行為事件」儲存在使用者的歷史紀錄中。

## 3. 功能性需求 (Functional Requirements)

### 3.1 雪場資料庫 (Resort Database)

- **FR1.1:** 系統必須能夠儲存並管理結構化的雪場資料，其綱要 (Schema) 必須遵循 `resort_schema_v_2.md` 的定義。
- **FR1.2:** 所有雪場資料應以獨立檔案 (YAML 格式) 的形式進行管理，並根據「國家/地區」進行目錄分類，以確保資料的可維護性與擴展性。

### 3.2 雪場資訊 API (Resort Information API)

系統必須提供一組 RESTful API，以供前端或其他後端服務查詢雪場資料。API 規格需遵循已建立的 `api-openapi.yaml` 文件。

- **FR2.1: 查詢雪場列表 (`GET /resorts`)**
  - 必須支援分頁 (Pagination) 功能。
  - 必須支援依 `region` (地區)、`country_code` (國家代碼) 進行篩選。
  - 必須支援依 `amenities` (設施) 進行篩選 (例如 `amenities=night_ski,onsen`)。
  - 必須支援關鍵字 `q` 進行名稱、描述的全文檢索。
  - 回傳的結果應為雪場的摘要資訊 (`ResortSummary`)。

- **FR2.2: 查詢雪場詳細資料 (`GET /resorts/{resort_id}`)**
  - 必須能根據唯一的 `resort_id` 回傳單一雪場的完整詳細資料 (`Resort`)。
  - 若找不到對應的 `resort_id`，應回傳 `404 Not Found`。

### 3.3 使用者滑雪足跡 (User Ski History)

- **FR3.1: 紀錄滑雪足跡 (與 `user-core` 整合)**
  - 系統需提供一個端點 (如 `POST /users/{user_id}/ski-history`)，允許使用者新增一筆滑雪紀錄。
  - 請求中必須包含 `resort_id` 和 `date` (滑雪日期)。
  - 此操作成功後，應觸發一個標準化的行為事件 (例如 `event_type: "resort.visited"`)，並將其傳送至 `user-core` 服務進行紀錄。

### 3.4 分享圖卡生成 (Share Card Generation)

- **FR4.1: 圖卡生成 API (`GET /resorts/{resort_id}/share-card`)**
  - 系統需提供一個 API 端點，能根據指定的 `resort_id` 動態生成一張圖片 (Image)。
  - 圖卡上應包含雪場的關鍵視覺元素 (如 Logo 或代表性照片)、名稱、以及一句吸引人的標語 (tagline) 或一項亮點數據 (如最長滑道)。
  - API 可接受額外參數，如 `user_id` 和 `date`，以便在圖卡上客製化地顯示「James Chen 於 2025-01-20 在此滑雪」等個人化資訊。
