# LDF 導入 TODO（依優先序）

## 1. Snowbuddy Matching Workflow（P0）
- [x] 盤點 `snowbuddy_matching/app/routers/search_router.py` 現有 BackgroundTasks 呼叫 `MatchingService.run_matching`
- [x] 設計 `MatchingSearchOrchestrator`，activity 區分：`fetch_users`、`fetch_resorts`、`fetch_knowledge_profile`、`calculate_scores`
- [x] 重新定義搜尋狀態儲存方式（改用 workflow state / durable entity 取代 Redis）
- [x] 對接通知/前端：完成時觸發事件或 SSE，淘汰輪詢

## 2. CASI Skill Sync Workflow（P1）
- [x] 取代 `platform/user_core/api/behavior_events.py` 內的 `BackgroundTasks.add_task(update_casi_profile_task, ...)`
- [x] 建立 `CasiSkillSyncWorkflow`：收到行為事件 → `callActivity(analyze_skill)` → `callActivity(upsert_profile)`
- [x] 設定節流/重試策略（防止外部 API 錯誤造成遺漏）
- [x] 對接觀測：記錄每次同步耗時 + 失敗告警

## 3. TripBuddy Request Workflow（P1）
- [x] 盤點 `platform/user_core/services/buddy_service.py` 內 `request_to_join_trip/ respond_to_buddy_request` 邏輯
- [x] 設計 `TripBuddyRequestWorkflow`：`submit_request → wait_for_owner_response → auto_expire/notify`
- [x] 定義 owner 回覆/取消/逾時的 external events 與補償邏輯（例如 trip 已滿、自動撤回）
- [x] 整合通知層：與 `notification_preferences` 協同推播

## 4. Course Recommendation Review Workflow（P2）
- [x] 盤點 `platform/user_core/services/recommendation_service.py` 目前單機審核流程
- [x] 設計 `CourseRecommendationWorkflow`：`submit → queue reviewer → wait_for_review → finalize`
- [x] 支援逾時自動處理（例如過期自動拒絕或指派下一位 reviewer）
- [x] 完成後觸發 leaderboard 更新與 feed 項目

## 5. Gear Reminder Workflow（P2）
- [x] 盤點 `platform/user_core/models/gear.py` 的 `GearReminder` 狀態（pending/sent/cancelled）及缺失的 job
- [x] 實作 `GearReminderWorkflow`：建立提醒後 `wait_until(scheduled_at)` → `send_notification` → `mark_sent`
- [x] 支援提醒取消/延期（透過 external event 更新 workflow）
- [x] 建立監控：逾期未送或大量失敗時告警
