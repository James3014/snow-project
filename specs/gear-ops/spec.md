# Feature Specification: Gear Operations & Maintenance

**Feature Branch**: `004-gear-ops`  
**Created**: 2025-10-14  
**Status**: Draft  
**Input**: mindmap.md（裝備檢查紀錄、雪具買賣）、`PROJECTS.md`, `specs/user-core/spec.md`

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 裝備檢查與提醒 (Priority: P1)

使用者可建立裝備檢查清單，紀錄每次檢查結果並設定提醒；系統根據 user-core 偏好發送通知。

**Why this priority**: 裝備安全直接影響滑雪體驗與責任，必須先建立檢查流程。

**Independent Test**: 建立裝備清單與檢查紀錄，確認提醒按照偏好送出並記錄 `gear.check.completed` 事件。

**Acceptance Scenarios**:

1. **Given** 使用者建立裝備清單，**When** 完成檢查並提交結果，**Then** 系統儲存檢查紀錄與下一次提醒時間，並寫入 user-core 事件。
2. **Given** 裝備檢查結果為「需要維修」，**When** 指定時間前，**Then** 系統依通知偏好提醒使用者，並在提醒中心顯示待辦。

---

### User Story 2 - 雪具買賣與交易管理 (Priority: P2)

使用者可刊登、搜尋、交易二手雪具，系統管理交易狀態並提供行為事件供分析。

**Why this priority**: 買賣功能增加社群互動與裝備循環，但為避免影響安全，放在 P2。

**Independent Test**: 刊登雪具 → 匹配買家 → 完成交易，檢查狀態流程與通知是否正確。

**Acceptance Scenarios**:

1. **Given** 使用者刊登裝備出售，**When** 發布，**Then** 系統產生清單條目並通知訂閱者。
2. **Given** 買家提出交易請求，**When** 雙方確認，**Then** 系統將交易狀態更新為 `completed`，並記錄 `gear.trade.completed` 事件。

---

### User Story 3 - 裝備保養與推薦 (Priority: P3)

系統依照檢查紀錄與使用者角色提供保養建議、提醒更換耗材，並整合 gear-ops 與雪伴/教練需求。

**Why this priority**: 增加價值與粘性，且需累積足夠資料才能準確建議。

**Independent Test**: 模擬多次檢查與交易後，檢查推薦資料是否合乎規則並遵守通知偏好。

**Acceptance Scenarios**:

1. **Given** 裝備多次檢查顯示磨損，**When** 系統分析，**Then** 給予保養建議或更換提醒。
2. **Given** 使用者為教練且裝備為教學用，**When** 到達預設保養里程碑，**Then** 系統通知 gear-ops 團隊安排保養。

### Edge Cases

- 使用者同時擁有自用與教學裝備，需要分開提醒頻率。  
- 二手交易涉及不同地區，需處理貨幣、物流、稅金資訊。  
- 檢查結果為「危險」時，應立即通知並銀行備份記錄。  
- 買賣單未完成，需允許取消並釋放裝備狀態。  
- 裝備資訊缺失（例如照片或序號），需設定最小資料門檻。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-301**: 系統必須允許使用者建立裝備清單（類別、品牌、用途、狀態、角色標記）。  
- **FR-302**: 系統必須提供裝備檢查紀錄管理，支援檢查項目、結果、備註、照片證據。  
- **FR-303**: 系統必須根據檢查結果與提醒設定觸發通知，並尊重 NotificationPreference。  
- **FR-304**: 系統必須提供雪具買賣刊登、搜尋、交易流程；含價格、貨幣、交易狀態。  
- **FR-305**: 系統必須寫入 user-core 行為事件（`gear.check.completed`, `gear.trade.posted`, `gear.trade.completed`, `gear.recommendation.sent`）。  
- **FR-306**: 系統必須支援裝備保養建議與耗材更換提醒，並提供教練/學生不同建議。  
- **FR-307**: 系統必須提供安全審查（危險裝備、交易糾紛）與客服介面。  
- **FR-308**: 系統必須支援跨國貨幣與稅金標記（至少台灣、香港、中國、日本）。  
- **FR-309**: 系統必須提供審計紀錄與合規檢查（含交易金額、提醒記錄）。

### Key Entities *(include if feature involves data)*

- **GearItem**: 裝備主檔（類別、品牌、用途、自用/教學、照片、狀態）。  
- **GearInspection**: 裝備檢查記錄（項目、結果、責任人、提醒設定）。  
- **GearReminder**: 通知排程（頻率、啟用狀態、下一次提醒時間）。  
- **GearListing**: 買賣刊登資訊（價格、貨幣、所在地、交易條件、狀態）。  
- **GearTrade**: 買賣交易（買家、賣家、金額、付款方式、狀態）。  
- **GearRecommendation**: 系統建議（保養、升級、耗材更換）。  
- **GearSafetyFlag**: 安全警示（危險裝備、交易糾紛）。

## Success Criteria *(mandatory)*

- **SC-301**: 裝備檢查與提醒成功率 ≥ 98%，提醒延遲 p95 < 10 分鐘。  
- **SC-302**: 買賣交易成功率 ≥ 70%，糾紛率 < 5%。  
- **SC-303**: 危險裝備警示回報時間 < 1 小時，100% 交付客服。  
- **SC-304**: 交易通知與保養建議遵守偏好設定，無未授權通知投訴。  
- **SC-305**: 舊裝備資料遷移後無重複或遺失，交易狀態和提醒保持一致（Never Break Userspace）。
