# Project: coach-scheduling (教練排課與空堂管理)

## Scope Snapshot
- 讓教練維護空堂、課程狀態、提醒與行事曆同步
- 確保學生端體驗與既有課程紀錄不被破壞（遵守 Never Break Userspace）
- 與 `user-core` 對齊角色標記與推播偏好，避免重複資料來源

## Immediate Next Steps
1. `/speckit.specify`：釐清教練與學生的交互流程、通知流程、例外情境。
2. `/speckit.plan`：定義排課資料模型、狀態機、整合既有事件紀錄方式。
3. `/speckit.tasks`：拆解行事曆整合、提醒機制、遷移策略等工作。

更新時請回寫跨專案依賴到 `PROJECTS.md`，必要時擴充共享腳本或 API。
