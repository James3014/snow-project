# Project: snowbuddy-matching (雪伴媒合與社群連結)

## Scope Snapshot
- 依滑雪等級、地點、角色偏好媒合滑友或學員
- 讀取 `user-core` 的身份、偏好與行為紀錄；串接 `resort-services` 的地點/時間資料
- 寫回媒合事件，確保行為紀錄與推播偏好一致

## Immediate Next Steps
1. `/speckit.specify`：界定媒合流程、成功/失敗條件、通知節點。
2. `/speckit.plan`：設計配對演算法資料來源、快取與回寫政策。
3. `/speckit.tasks`：拆分配對引擎、通知整合、使用者設定管理等工作。

必要時新增共用模組請同步更新 `PROJECTS.md` 與 Shared Infrastructure 區段。
