# Project: user-core (Rider Identity & History)

## Scope Snapshot
- 維護單一 `User ID` 來源與基本資料欄位（語言、經驗、角色標記等）
- 定義跨專案共用的行為事件 schema 與推播偏好來源
- 驗證資料變更對其他專案（排課、媒合、裝備、雪場、知識）的影響

## Immediate Next Steps
1. `/speckit.specify`：描述身分與歷史模組的需求邊界。
2. `/speckit.plan`：敲定資料模型、事件格式、API 或匯出方式。
3. `/speckit.tasks`：拆出資料遷移、效能監控、測試策略等工作項目。

所有成果請同步更新 `PROJECTS.md` 與 `.specify/memory/constitution.md` 相關段落。

## 規格檔與測試約定（繁體中文檔名）
- 本模組的 Gherkin 規格檔採用繁體中文檔名，位於 `specs/user-core/features/`。
- 測試或 CI 不應硬編碼檔名，請以目錄掃描方式載入所有 `.feature`：
  - 例如使用測試工具的目錄遞迴與副檔名比對（`*.feature`）。
- 目前檔案（示例）：
  - `specs/user-core/features/使用者主檔管理.feature`
  - `specs/user-core/features/行為事件.feature`
  - `specs/user-core/features/推播偏好.feature`
