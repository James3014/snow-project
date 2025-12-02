# Feature Specification: Coach Scheduling Backbone

**Feature Branch**: `002-coach-scheduling-backbone`  
**Created**: 2025-10-14  
**Status**: Draft  
**Input**: Mindmap (教練排課紀錄)、`PROJECTS.md`、`specs/user-core/spec.md`

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 教練維護空堂與排程 (Priority: P1)

教練可透過平台建立、更新、取消自己的可預約時段，並同步至行事曆與 user-core 行為事件。

**Why this priority**: 無空堂資料，學生無法預約，整體體驗中斷。

**Independent Test**: 以教練身份登入建立新時段，驗證該時段在 API/行事曆/事件紀錄中立即可見。

**Acceptance Scenarios**:

1. **Given** 教練設定新的空堂，**When** 提交，**Then** 系統儲存 slot（含日期、時段、地點、教練 ID）並產生 `lesson.slot.created` 事件。
2. **Given** 教練更新空堂或取消，**When** 執行更新，**Then** 系統同步更新資料並推送 change feed 給訂閱者。

---

### User Story 2 - 學生預約與狀態追蹤 (Priority: P1)

學生能看見可用空堂、預約課程，並收到狀態更新（待確認/確認/完成/取消），系統寫入行為事件。

**Why this priority**: 課程預約是核心價值；必須保持向後兼容且流程順暢。

**Independent Test**: 學生預約後，檢查 booking 狀態與通知流程（Email/LINE）是否符合偏好設定。

**Acceptance Scenarios**:

1. **Given** 學生瀏覽空堂，**When** 選擇時段預約，**Then** 系統建立 booking 紀錄並依偏好觸發通知。
2. **Given** 教練確認或取消預約，**When** 更新狀態，**Then** 系統更新 booking、寫入 `lesson.slot.booked` 或 `lesson.booking.cancelled` 事件，並通知學生。

---

### User Story 3 - 行事曆與提醒整合 (Priority: P2)

教練與學生可將排程同步到個人行事曆（Google/Apple），並在課程前收到提醒。

**Why this priority**: 降低 No-Show 風險、提升體驗；P2 因需整合外部服務。

**Independent Test**: 建立一筆預約，驗證行事曆同步與提醒在指定時間送出，若偏好拒收則不發送。

**Acceptance Scenarios**:

1. **Given** 偏好允許提醒，**When** 課前 24 小時，**Then** 系統發送提醒並紀錄通知事件。
2. **Given** 使用者取消同步，**When** 執行設定，**Then** 後續不再建立外部行事曆事件。

### Edge Cases

- 教練臨時取消時，有學生已預約 → 系統需強制通知並協助改期。  
- 學生在開課前最後一小時取消 → 需遵守政策（可能有費用）；需紀錄狀態。  
- 同時多人預約同一空堂 → 必須有鎖定機制避免重複。  
- 外部行事曆 API 失敗 → 需重試並發出警示，避免與主資料不一致。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-101**: 系統必須允許教練建立、更新、取消空堂；資料包含日期、開始/結束時間、地點、容量、備註。  
- **FR-102**: 系統必須提供學生檢視可用空堂並進行預約，支援容量與候補。  
- **FR-103**: 系統必須透過 user-core 發布 `lesson.slot.*` 和 `lesson.booking.*` 行為事件。  
- **FR-104**: 系統必須與 NotificationPreference 檢查提醒授權，依設定觸發通知。  
- **FR-105**: 系統必須支援外部行事曆同步（至少 Google Calendar），並管理授權 token。  
- **FR-106**: 系統必須在預約衝突時拒絕或排候補，確保不超額。  
- **FR-107**: 系統必須提供預約狀態管理流程（待確認、已確認、進行中、完成、取消、未出席）。  
- **FR-108**: 系統必須紀錄操作審計資訊（操作者、時間、原因），供 Linus 模式檢查。  
- **FR-109**: 系統必須保留歷史排程供報表與追蹤。

### Key Entities

- **ScheduleSlot**: 教練的空堂；包含時間、地點、教練 ID、容量、狀態（開放/關閉/取消）。  
- **Booking**: 學生預約紀錄；包含 student_id、slot_id、狀態、價格、付款資訊（外部），與審計欄位。  
- **CalendarSync**: 外部行事曆同步設定與事件 ID。  
- **NotificationJob**: Reminder 任務隊列，存取 user-core 偏好並排程通知。

## Success Criteria *(mandatory)*

- **SC-101**: 90% 空堂建立/更新 API p95 < 250ms；預約流程成功率 ≥ 99%。  
- **SC-102**: 預約衝突率 < 0.1%，且所有衝突在 1 分鐘內有告警。  
- **SC-103**: 行事曆同步與提醒失敗率 < 1%，失敗必須自動重試並紀錄。  
- **SC-104**: user-core 事件寫入成功率 ≥ 99.5%，如失敗需有補償機制。  
- **SC-105**: 部署後既有學生/教練流程無中斷（Never Break Userspace 驗證）。  
