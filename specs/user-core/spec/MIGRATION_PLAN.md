# Migration Plan - user-core

## Scope
- [ ] 角色正規化：新增 `user_roles`，移除 `user_profiles.roles`
- [ ] 在地身分去重：新增 `user_locale_profiles.local_identifier_hash` 與唯一索引
- [x] 變更匯流：`change_feed.snapshot` → `payload`
- [x] 行為事件擴充：`behavior_events.schema_url`、核心事件版本治理

## Alembic/SQL Steps（2025-10-19 更新）

1. user_roles（待排程）
   - CREATE TABLE `user_roles` (
     - `user_id` uuid NOT NULL REFERENCES `user_profiles`(`user_id`),
     - `role` varchar NOT NULL,
     - UNIQUE (`user_id`, `role`)
     );
   - Backfill（從舊 `user_profiles.roles` JSON 展開寫入 `user_roles`）
   - 可選：在完成回填與驗證後，DROP COLUMN `user_profiles.roles`

2. user_locale_profiles.local_identifier_hash（待排程）
   - ALTER TABLE `user_locale_profiles` ADD COLUMN `local_identifier_hash` varchar;
   - Backfill：以 `sha256(country_code || ':' || normalize(local_identifier) || ':' || salt)` 計算並填入（salt 由環境機密提供）；
     - normalize：去空白/符號、統一大小寫、應用各地格式規則
   - ALTER TABLE `user_locale_profiles` ALTER COLUMN `local_identifier_hash` SET NOT NULL;
   - CREATE UNIQUE INDEX `uq_locale_hash` ON `user_locale_profiles` (`country_code`, `local_identifier_hash`);

3. change_feed payload（已完成，Alembic `a1b2c3d4e5f6`）
   - ALTER TABLE `change_feed` ADD COLUMN `payload` json;
   - UPDATE `change_feed` SET `payload` = `snapshot` WHERE `payload` IS NULL;
   - （後續）在所有消費者完成改版後，DROP COLUMN `snapshot`

4. behavior_events.schema_url（已完成，Alembic `6c0a6e77f5a2`）
   - ALTER TABLE `behavior_events` ADD COLUMN `schema_url` varchar;
   - 更新 API 將自訂事件的 `schema_url` 寫入資料庫；
   - 消費端以 `schema_url` 追蹤外部 schema 版本。

## Rollout Strategy
- 雙寫/雙讀期（可選）：
  - 行為：新事件同時寫 `payload` 與 `snapshot`；讀者優先讀 `payload`，回退讀 `snapshot`
  - 截止：全部服務升級完成後，移除 `snapshot`
- 版本旗標：以環境變數控制是否啟用新查詢排序參數強制規則
- 風險控管：
- 角色遷移：若 `roles` 存在非預期值，落入 `user_roles` 需有白名單/告警
- 在地身分：Hash 回填需先在影子環境比對重複率，避免誤封鎖
- 事件：消費者需更新以支援 `schema_url` 與排序參數

## Validation Checklist
- 比對 `user_roles` 回填筆數 ≈ 展開後期望筆數；抽樣核對
- `user_locale_profiles` 的唯一索引建立成功；抽樣異動查詢
- `change_feed` 新欄位寫入成功；消費者能讀取 `payload` 與 `audit_summary`
- 指標：事件寫入成功率、查詢延遲、錯誤率無異常
