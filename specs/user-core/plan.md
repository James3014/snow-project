# Implementation Plan: Unified Rider Identity Core

**Branch**: `001-user-core-identity` | **Date**: 2025-10-14 | **Spec**: `specs/user-core/spec.md`  
**Input**: Feature specification from `/speckit.specify`

## Summary

建立一個統一的 user-core 服務，提供以 UUIDv7 為主鍵的單一 `User ID` 主檔、全球身份延伸（UserLocaleProfile）、標準化行為事件與推播偏好管理。技術上需定義核心資料模型、事件 schema、通知授權介面，並確保向其他專案暴露的 API 一致、具備稽核與變更發布能力。

## Technical Context

**Language/Version**: Python 3.12（開發／測試環境）  
**Primary Dependencies**: FastAPI、Pydantic v2、SQLAlchemy 2.x、Alembic、httpx  
**Storage**: SQLite（開發環境）；PostgreSQL 為正式環境目標，透過 Alembic 遷移保持相容  
**Testing**: pytest（單元／整合）、schemathesis（API 契約）、Hypothesis（資料生成）  
**Target Platform**: Linux server（自動化部署/容器化預期）  
**Project Type**: 後端服務（API + 資料層）  
**Performance Goals**: API p95 < 200ms；事件寫入成功率 ≥ 99.5%  
**Constraints**: 必須維持既有資料的可讀性與相容性；部署前需完成資料遷移腳本  
**Scale/Scope**: 初期 10k 使用者、每日至多 50k 行為事件
**Change Feed Transport**: Phase 1 以 HTTPS webhook gateway 為主，長期預留升級 Kafka/SNS 的路線圖

## Constitution Check

- **I. Data-First Pragmatism**: PASS — 先締定 UserProfile/BehaviorEvent 模型，再討論 API。  
- **II. Zero Special-Case Thinking**: PASS — 以 schema 驗證與 payload 驗證避免自訂分支，計畫中以枚舉／驗證器處理。  
- **III. Never Break Userspace**: IN PROGRESS — `MIGRATION_PLAN.md` 已涵蓋 change_feed/schema_url 雙寫策略，角色／身分 hash 遷移待排程。  
- **IV. Ship Reality-Backed Value**: PASS — mindmap 顯示多專案皆依賴此資料，已有真實需求。  
- **V. Ruthless Simplicity**: PASS — 函數與模組劃分限制最多兩層嵌套、禁止過度抽象。

## Project Structure

### Documentation (this feature)

```
specs/user-core/
├── spec.md
├── plan.md
├── research.md          # Phase 0: 資料來源、既有系統盤點
├── data-model.md        # Phase 1: ERD、事件 schema、推播結構
├── quickstart.md        # Phase 1: 開發環境與 CLI 操作說明
└── contracts/
    ├── api-openapi.yaml # Phase 1: 行為事件/主檔/偏好 API 契約
    └── change-feed.md   # Phase 1: 變更通知協議
```

### Source Code (repository root)

```
platform/
└── user_core/
    ├── models/          # SQLAlchemy 或等效 ORM 模型
    ├── schemas/         # 輸入/輸出 Pydantic schema
    ├── services/        # 商務邏輯：主檔維護、事件寫入、偏好管理
    ├── api/             # FastAPI 路由或等效接口
    ├── audit/           # 審計記錄與 change-feed 發布
    └── __init__.py

tests/
├── unit/user_core/
│   ├── test_models.py
│   ├── test_services.py
│   └── test_schemas.py
├── contract/user_core/
│   └── test_api_contract.py
└── integration/user_core/
    └── test_event_flow.py

scripts/
└── migrations/
    └── user_core/       # Alembic 或等效的遷移腳本
```

**Structure Decision**: 採用單一後端服務（platform/user_core）搭配分層目錄（models/schemas/services/api/audit），將測試依類型分類（unit/contract/integration），並新增遷移腳本目錄以符合 Never Break Userspace 的回滾需求。

## Progress Snapshot（2025-10-19）

- ✅ 服務目錄、依賴與 Alembic 設定已完成並持續使用。
- ✅ User Profile／Behavior Event／Notification Preference API 與服務完成，整合 change feed 與審計。
- ✅ `change_feed` 轉為結構化 payload，publisher 以 webhook 發佈，並加上 SLA 計時。
- ✅ 全域 pytest（含整合測試）皆通過，覆蓋建立／合併／事件寫入／偏好更新。
- ✅ OpenAPI 與 change feed 契約已由自動化測試驗證，確保文件與實作同步。
- ⏳ Migration Plan 尚待執行：`user_roles` 正規化、`local_identifier_hash` 回填。
- ⏳ 契約測試與事件型錄文件待補，以支援跨專案協作。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| Constitution Gate III (Never Break Userspace) pending | 需要額外 Phase 1 遷移設計與影響分析 | 直接部署會破壞現有資料流程，違反核心原則；必須先補齊遷移策略 |
