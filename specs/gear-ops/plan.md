# Implementation Plan: Gear Operations & Maintenance

**Branch**: `004-gear-ops` | **Date**: 2025-10-14 | **Spec**: `specs/gear-ops/spec.md`  
**Input**: Feature specification from `/speckit.specify`

## Summary

建立一個整合裝備檢查、提醒、二手交易與保養建議的服務。以 user-core 的身份/偏好為基礎，提供 GearItem/Inspection/Listing/Trade 等核心資料模型，並發佈對應行為事件。必須支援跨國貨幣、安全審計、通知授權與回滾策略，確保裝備安全與交易體驗。

## Technical Context

**Language/Version**: NEEDS CLARIFICATION（建議 Python 3.11，與 user-core/snowbuddy 共用棧）  
**Primary Dependencies**: FastAPI、SQLAlchemy、Pydantic、Celery/APS（提醒排程）、redis、httpx、pytest、schemathesis  
**Storage**: PostgreSQL（gear schema）；需支援 JSONB、貨幣/匯率欄位  
**Testing**: pytest、schemathesis、property-based testing for reminder scheduling  
**Target Platform**: Linux server / containers  
**Project Type**: 後端 API + background jobs  
**Performance Goals**: 提醒排程處理 5k 裝備/日；交易 API p95 < 250ms  
**Constraints**: 遵守 NotificationPreference、跨國合規（貨幣、稅金、資安）、資料可回滾  
**Scale/Scope**: 初期 3k 使用者，裝備清單 10k 件，日交易 200 件  
**Change Feed Transport**: Phase 1 採用 HTTPS webhook，後續視交易量升級到 Kafka/SNS

## Constitution Check

- **I. Data-First Pragmatism**: PASS — GearItem/Inspection/Trade 等模型已先定義。  
- **II. Zero Special-Case Thinking**: PASS — 檢查與提醒透過資料驅動（模板 + 排程），不依賴手寫條件。  
- **III. Never Break Userspace**: PENDING — 舊裝備資料與提醒需雙寫並提供回滾。  
- **IV. Ship Reality-Backed Value**: PASS — mindmap 顯示裝備檢查與買賣需求明確。  
- **V. Ruthless Simplicity**: PASS — 初期循序重點在檢查/提醒，買賣與保養後續擴充。

## Project Structure

### Documentation

```
specs/gear-ops/
├── spec.md
├── plan.md
├── research.md            # Phase 0: 現況、法規、流程
├── data-model.md          # Phase 1: ERD、提醒/交易流程
├── quickstart.md          # Phase 1: 開發環境與排程指引
└── contracts/
    ├── api-openapi.yaml   # 裝備、檢查、交易、提醒 API
    └── event-catalog.md   # gear 相關事件 schema
```

### Source Code

```
platform/
└── gear_ops/
    ├── models/
    │   ├── gear_item.py
    │   ├── gear_inspection.py
    │   ├── gear_listing.py
    │   ├── gear_trade.py
    │   ├── gear_reminder.py
    │   └── gear_flag.py
    ├── schemas/
    ├── services/
    │   ├── inventory.py
    │   ├── inspections.py
    │   ├── reminders.py
    │   ├── marketplace.py
    │   └── recommendations.py
    ├── api/
    │   ├── items.py
    │   ├── inspections.py
    │   ├── listings.py
    │   ├── trades.py
    │   └── recommendations.py
    ├── jobs/
    │   ├── reminder_runner.py
    │   └── maintenance_suggester.py
    ├── integrations/
    │   ├── user_core_client.py
    │   ├── notification_client.py
    │   └── payment_provider.py (stub)
    ├── audit/
    │   └── logger.py
    ├── config.py
    └── __init__.py

tests/
├── unit/gear_ops/
├── integration/gear_ops/
└── contract/gear_ops/

scripts/
└── migrations/gear_ops/
```

**Structure Decision**: 獨立服務 `gear_ops`, 與 user-core 共享身份與通知機制。`jobs/` 處理提醒與保養建議；`integrations/` 管理外部支付/通知；`audit/` 紀錄交易與安全事件；測試依層分離。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| Gate III pending | 需要遷移現有裝備資料與提醒 | 直接切換會漏掉安全檢查，破壞現有流程 |
| Background jobs | 檢查提醒需排程處理 | 同步計算會阻塞 API，無法滿足即時提醒需求 |
| Marketplace payment stub | 需預留支付整合 | 若不預留將來擴充會重新設計交易流程 |
