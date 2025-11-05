# CHANGELOG - user-core spec

## 2025-10-19

### 落地成果
- 行為事件 API 支援 `schema_url`、強制排序與來源過濾，並導入版本化 schema registry。
- `/events` 寫入與查詢新增 SLA 記錄，未達門檻會輸出 WARN。
- 新增 `/users/{user_id}/merge` 端點與服務層合併流程：角色、 legacy ID、變更事件一次處理。
- 所有 User Profile／Notification Preference 變更都會寫入帶 diff 的 change_feed.payload，並透過 webhook 發佈。
- API 接受 `X-Actor-Id`，落地審計與 diff 的操作者欄位。
- Alembic 版本 `6c0a6e77f5a2`（behavior_events.schema_url）、`a1b2c3d4e5f6`（change_feed.payload）已產出。

### 契約／文件
- `spec.md` 新增落地狀態表，標記 FR-001~FR-009 的實作情形與備註。
- `MIGRATION_PLAN.md` 以核取方塊標示已完成的 change_feed 與 behavior_events 變更。

## 2025-10-17（規劃草稿）

### 資料模型（ERM）
- 〔規劃中〕新增 `user_roles(user_id, role)`，並移除 `user_profiles.roles` JSON；建立 `(user_id, role)` 唯一索引。
- 〔規劃中〕`user_locale_profiles` 新增 `local_identifier_hash`，建立 `(country_code, local_identifier_hash)` 唯一索引；`local_identifier` 僅存遮罩。
- 〔規劃中〕`change_feed` 欄位 `snapshot` 更名為 `payload`；新增 `audit_summary json`（`actor_type`、`actor_id`、`reason`、`at`）。

### 功能規格（spec.md）
- 新增「事件 schema 治理（混合模式）」：核心事件由 user-core 維護並於寫入驗證；自定義事件由子專案自管。
- 新增「事件查詢（排序與過濾）」：呼叫端必須指定 `sort_by ∈ {occurred_at, recorded_at}` 與 `order ∈ {asc, desc}`，支援 `source_project` 過濾。
- 「撤回授權之排程取消責任」：user-core 僅發布變更事件，取消動作由通知系統（消費者）執行。
- `NotificationPreference` 術語統一：使用 `status ∈ {opt-in, opt-out, paused}`，取代 `toggle`。
