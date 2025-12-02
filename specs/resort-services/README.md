# Project: resort-services (雪場紀錄與交通資訊)

## Scope Snapshot
- 紀錄滑雪足跡、交通查詢與分享圖卡資料，支援後續分析與推薦
- 向 `user-core` 取得身份與偏好；向其他專案提供地理與時序資料
- 定義快取、同步與資料一致性策略，避免破壞既有紀錄

## Immediate Next Steps
1. `/speckit.specify`：描述使用者紀錄流程、查詢情境、分享需求。
2. `/speckit.plan`：設計資料表結構、快取層、與媒合/排課整合的介面。
3. `/speckit.tasks`：拆解資料匯入、交通 API 整合、分享圖卡產生等任務。

若產生新的地理標準或 API，請同步更新 `PROJECTS.md` 之 Shared Infrastructure。
