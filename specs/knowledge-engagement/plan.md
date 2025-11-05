# Implementation Plan: Knowledge Engagement & Skill Growth

**Branch**: `006-knowledge-engagement` | **Date**: 2025-10-14 | **Spec**: `specs/knowledge-engagement/spec.md`  
**Input**: Feature specification from `/speckit.specify`

## Summary

打造知識測驗與技能成長平台，包含題庫管理、測驗流程、技能分數、成就、教練任務與通知。需整合 user-core（身份、偏好、事件）、resort-services（旅程資料）與 gear-ops（裝備狀態）以提供全面建議。

## Technical Context

**Language/Version**: NEEDS CLARIFICATION（建議 Python 3.11）  
**Primary Dependencies**: FastAPI、SQLAlchemy、Pydantic、Celery/APS（任務提醒）、redis、Pillow/Matplotlib（成就圖像）、pytest、schemathesis  
**Storage**: PostgreSQL（knowledge schema）；需支援 JSONB、版本管理  
**Testing**: pytest、schemathesis、property-based tests for scoring  
**Target Platform**: Linux server / containers  
**Project Type**: 後端 API + background jobs +（可選）報表  
**Performance Goals**: 測驗 API p95 < 200ms；技能分數更新 < 1 分鐘；成就通知延遲 < 1 分鐘  
**Constraints**: 題庫版本控制、合併帳號一致性、通知授權  
**Scale/Scope**: 初期 5k 使用者、每日 500 測驗、任務 200 筆  
**Change Feed Transport**: Phase 1 webhook，後續評估 Kafka/SNS

## Constitution Check

- **I. Data-First Pragmatism**: PASS — Question/Session/SkillProfile/Assignment 等模型先行。  
- **II. Zero Special-Case Thinking**: PASS — 題庫版本與評分以資料驅動，避免硬編碼。  
- **III. Never Break Userspace**: PENDING — 舊成績匯入與帳號合併需計畫。  
- **IV. Ship Reality-Backed Value**: PASS — mindmap 有知識測驗與任務需求。  
- **V. Ruthless Simplicity**: PASS — 初期採權重與規則計算技能分數，避免過早導入 ML。

## Project Structure

### Documentation

```
specs/knowledge-engagement/
├── spec.md
├── plan.md
├── research.md            # Phase 0: 題庫來源、流程調查
├── data-model.md          # Phase 1: ERD、評分邏輯、任務流程
├── quickstart.md          # Phase 1: 開發環境、測驗流程說明
└── contracts/
    ├── api-openapi.yaml   # 題庫/測驗/技能/任務 API
    └── event-catalog.md   # knowledge.* 事件
```

### Source Code

```
platform/
└── knowledge/
    ├── models/
    │   ├── quiz_question.py
    │   ├── quiz_session.py
    │   ├── quiz_answer.py
    │   ├── skill_profile.py
    │   ├── practice_assignment.py
    │   ├── practice_submission.py
    │   ├── achievement_log.py
    │   └── question_review.py
    ├── schemas/
    ├── services/
    │   ├── question_bank.py
    │   ├── quiz_engine.py
    │   ├── scoring.py
    │   ├── assignment_manager.py
    │   ├── achievement_service.py
    │   └── notification_bridge.py
    ├── api/
    │   ├── questions.py
    │   ├── quizzes.py
    │   ├── skills.py
    │   ├── assignments.py
    │   └── achievements.py
    ├── jobs/
    │   ├── reminder_worker.py
    │   └── scoring_worker.py
    ├── integrations/
    │   ├── user_core_client.py
    │   ├── resort_services_client.py
    │   └── gear_ops_client.py
    ├── templates/
    │   └── achievement_badges/
    ├── audit/
    │   └── logger.py
    ├── config.py
    └── __init__.py

tests/
├── unit/knowledge/
├── integration/knowledge/
└── contract/knowledge/

scripts/
└── migrations/knowledge/
```

**Structure Decision**: 題庫、測驗、評分、任務分層處理，jobs 負責計分與提醒；integrations 與 user-core 等服務溝通。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| Gate III pending | 舊成績資料需匯入並維持一致 | 直接重置會破壞使用者信任與向後相容 |
| 題庫版本管理 | 防止更新導致測驗錯誤 | 若不版本化，歷史結果無法還原 |
| Scoring jobs | 技能計算與成就需非同步 | 同步計算會阻塞測驗流程並影響體驗 |
