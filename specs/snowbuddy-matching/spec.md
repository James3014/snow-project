# `snowbuddy-matching` 功能規格書 (Specification)

## 1. 專案願景與範疇 (Vision & Scope)

`snowbuddy-matching` 專案旨在建立一個智慧、友善的雪伴媒合引擎。它讓使用者可以根據個人的滑雪能力、偏好的滑雪地點、時間，以及期望的滑雪夥伴角色（如一起練習的雪友、想請教的教練、或想指導的學員），找到最適合的滑雪夥伴。

本專案將緊密依賴 `user-core` 提供的使用者資料與偏好設定，並串接 `resort-services` 的雪場資料庫作為地點選擇的基礎。所有成功的媒合與互動，都將作為標準化的行為事件回寫至 `user-core`，以豐富使用者畫像並優化未來的推薦。

## 2. 使用者故事 (User Stories)

### 作為一名想找雪伴的滑雪者 (Rider):

- **設定偏好:**
  - `AS A` Rider, `I WANT TO` 設定我的滑雪能力等級、常去的雪場、以及可以滑雪的日期，`SO THAT` 系統能為我找到背景相似的雪伴。
  - `AS A` Rider, `I WANT TO` 註明我正在尋找的夥伴類型（例如：程度相當的雪友、可以指導我的教練、或是我可以帶領的初學者），`SO THAT` 媒合的結果更符合我的社交期待。

- **發起與互動:**
  - `AS A` Rider, `I WANT TO` 根據我的偏好，主動搜尋潛在的雪伴，`SO THAT` 我可以發起連結。
  - `AS A` Rider, `I WANT TO` 瀏覽符合條件的雪伴列表，列表應包含對方的匿名化摘要資訊（如滑雪等級、常去地區、角色），`SO THAT` 我可以在保護雙方隱私的前提下做出初步判斷。
  - `AS A` Rider, `I WANT TO` 對感興趣的對象發送「雪伴請求」，`SO THAT` 我可以開啟一段新的雪上友誼。
  - `AS A` Rider, `I WANT TO` 在收到別人的雪伴請求時，能即時收到通知，`SO THAT` 我不會錯過任何潛在的媒合機會。
  - `AS A` Rider, `I WANT TO` 自由地接受或拒絕收到的請求，`SO THAT` 我對自己的社交連結有完全的控制權。

- **媒合成功後:**
  - `AS A` Rider, `I WANT TO` 在雙方都同意媒合後，能夠被引導至一個安全的管道與對方開始對話（具體通訊功能由其他模組實現），`SO THAT` 我們可以討論具體的滑雪計畫。

### 作為一名想找學生的教練 (Coach):

- `AS A` Coach, `I WANT TO` 設定我的可授課時間、地點、教學等級範圍，`SO THAT` 系統能幫我找到符合條件的潛在學生。
- `AS A` Coach, `I WANT TO` 收到對我有興趣的學生的媒合請求，`SO THAT` 我可以擴展我的教學業務。

## 3. 功能性需求 (Functional Requirements)

### 3.1 偏好管理 (Preference Management)

- **FR1.1:** 使用者必須能夠建立、讀取、更新和刪除自己的雪伴媒合偏好設定。
- **FR1.2:** 媒合偏好資料結構將包含：
  - `skill_level_min`, `skill_level_max`: 可接受的雪伴能力等級範圍。
  - `preferred_resorts`: 偏好的雪場 ID 列表 (資料源為 `resort-services`)。
  - `preferred_regions`: 偏好的地區 (如 `Niigata Prefecture`)。
  - `availability`: 可滑雪的日期或時段範圍。
  - `seeking_role`: 期望的夥伴角色 (`buddy`, `student`, `coach`)。
- **FR1.3:** 這些偏好設定的儲存與管理將由 `user-core` 服務負責，本服務僅定義其所需的資料欄位。

### 3.2 媒合核心邏輯 (Matching Engine)

- **FR2.1:** 系統需提供一個核心的媒合演算法。
- **FR2.2:** 演算法的輸入為發起搜尋的 `user_id` 及其媒合偏好。
- **FR2.3:** 演算法將：
  1. 查詢 `user-core` 服務，獲取其他符合基本條件（如活躍狀態）的使用者列表。
  2. 根據地點偏好，查詢 `resort-services` 服務，驗證雪場資訊的有效性。
  3. 根據技能等級、地點、時間、尋找角色等多維度，計算每個潛在對象的「匹配分數」。
  4. 回傳一個經過排序的、匿名的潛在匹配對象列表。
- **FR2.4 (New):** 演算法必須支援一個**可選**的篩選條件，允許將 `knowledge-engagement` 服務提供的「知識分數」納入匹配分數的計算中，以找到知識水平相當的雪伴。

### 3.3 媒合生命週期與通知 (Matching Lifecycle & Notifications)

- **FR3.1 (請求):** 使用者 A 向使用者 B 發送媒合請求。系統需記錄此「請求中」狀態。
- **FR3.2 (通知):** 系統需觸發一個通知事件，透過 `user-core` 的通知系統，告知使用者 B 收到了新的請求。
- **FR3.3 (回應):** 使用者 B 可以接受或拒絕該請求。系統需更新請求狀態為「已接受」或「已拒絕」。
- **FR3.4 (確認):** 若請求被接受，系統需再次觸發通知事件，告知使用者 A 媒合成功，並提供後續聯繫的指引。
- **FR3.5 (事件回寫):** 所有媒合生命週期中的關鍵動作 (發送請求、接受、拒絕) 都必須作為 `BehaviorEvent` 回寫至 `user-core` 服務。

### 3.4 API 端點 (High-Level API Endpoints)

- `POST /searches`: 根據當前使用者的偏好，發起一次新的雪伴搜尋，並回傳一個 `search_id`。
- `GET /searches/{search_id}`: 根據 `search_id` 獲取媒合結果列表。
- `POST /requests`: 向指定的 `target_user_id` 發送一個媒合請求。
- `PUT /requests/{request_id}`: 對一個收到的媒合請求，進行接受 (`accept`) 或拒絕 (`decline`) 操作。
