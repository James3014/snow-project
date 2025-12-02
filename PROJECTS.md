# SnowTrace Platform Project Registry

| Key | Project Name | Primary Outcome | Core Data Domains | Depends On | Notes |
|-----|--------------|-----------------|-------------------|------------|-------|
| user-core | Rider Identity & History | 可靠維護單一 `User ID` 主檔、角色、語言、滑雪經驗 | `User ID`、基本資料、行為紀錄 | — | 其他專案的資料授權與資料一致性的唯一來源 |
| coach-scheduling | 教練排課與空堂管理 | 讓教練維護空堂、課程狀態與提醒流程 | 行為紀錄（排課事件）、行事曆、推播偏好 | user-core | 需保證學生體驗不受影響，所有改動遵循「Never break userspace」 |
| snowbuddy-matching | 雪伴媒合與社群連結 | 依滑雪等級、地點與角色偏好媒合滑友 | 雪伴偏好、雪場紀錄、推播設定 | user-core, resort-services | 與教練/學生角色標記需同步；匹配結果寫回行為紀錄；使用 `resort-services` 的 `/resorts` API 進行地點篩選。 |
| gear-ops | 裝備檢查與買賣 | 管理裝備檢查紀錄、交易流程與推播提醒 | 裝備檢查、買賣紀錄、推播設定 | user-core | 要標記用途（自用/教學）以支援未來推薦；與 snowbuddy-matching 共用通知機制 |
| resort-services | 雪場紀錄與交通資訊 | 紀錄滑雪足跡、交通查詢並生成分享圖卡 | 雪場紀錄、交通查詢紀錄、分享圖卡 | user-core | 為其他專案提供地理與時序資料 (例如，供 `snowbuddy-matching` 查詢雪場)；需保障資料一致性與快取策略 |
| knowledge-engagement | 知識測驗與學習激勵 | 維護測驗題庫、分數累積與學習進展 | 知識測驗紀錄、行為事件 | user-core | 可與推播服務整合，提供技能提升建議 |

## Shared Infrastructure

- **事件紀錄格式**：所有子專案寫入的行為事件需遵守 `user-core` 定義的統一 schema（時間戳、事件類型、來源專案、payload）。
- **推播服務**：`user-core` 暫管使用者偏好，各專案透過共用介面建立提醒；不得直接繞過偏好設定。
- **身份標記**：教練／學生／雙重身份的標記由 `user-core` 維護，使用該標記時須引用同一來源避免分叉。

## Activation Checklist

1. 釐清專案對應的核心資料表與 schema；若需新增欄位，先評估對其他專案的影響。
2. 建立 `/speckit.specify`、`/speckit.plan`、`/speckit.tasks` 文件前，先在此登錄專案狀態與負責人。
3. 任何會跨專案共用的模組或 API，需回寫到這份 Registry 的「Shared Infrastructure」區塊，保持最新。

## Ownership

- Registry 維護者：平台技術負責人（預設同 `.specify/memory/constitution.md` 指定的維護者）
- 更新流程：提出異動 → 核對各專案影響 → 廣播給相關成員 → 更新 registry 與相關檔案
