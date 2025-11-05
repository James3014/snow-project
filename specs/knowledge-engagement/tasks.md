# Tasks: Knowledge Engagement & Skill Growth

**Input**: `specs/knowledge-engagement/spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

## Phase 1: Setup

- [ ] KE-T101 [P][Setup] 建立 `platform/knowledge/` 目錄與子模組。  
- [ ] KE-T102 [P][Setup] 建立 `requirements-knowledge.txt`，列出 FastAPI、SQLAlchemy、Pydantic、redis、celery/apscheduler、pillow、numpy/pandas、pytest、schemathesis。  
- [ ] KE-T103 [Setup] 建立 `.env.knowledge.example`，含 DB/Redis/API 變數。  
- [ ] KE-T104 [P][Setup] 初始化 `scripts/migrations/knowledge/` 與 Alembic。  
- [ ] KE-T105 [Setup] 建立 `tests/unit|integration|contract/knowledge` 目錄與 pytest 設定。  

## Phase 2: Foundational

- [ ] KE-T201 設計 Alembic migration 建立 `quiz_questions`, `quiz_sessions`, `quiz_answers`, `skill_profiles`, `practice_assignments`, `practice_submissions`, `achievement_logs`, `question_reviews`。  
- [ ] KE-T202 實作 ORM 模型與 Pydantic schema。  
- [ ] KE-T203 建立 `integrations/user_core_client.py`, `resort_services_client.py`, `gear_ops_client.py`, `notification_client.py` stub。  
- [ ] KE-T204 建立 `api/__init__.py` 與全域 middleware。  
- [ ] KE-T205 建立 `audit/logger.py` 與 `changefeed/publisher.py`。  
- [ ] KE-T206 撰寫 `tests/unit/knowledge/test_models_schema.py`。  
- [ ] KE-T207 準備 `data/question_bank_seed.yaml`（從 FAQ/教材整理）。  
- [ ] KE-T208 撰寫 `docs/knowledge/migration-plan.md`（題庫匯入、成績匯入、帳號合併策略）。  

**Checkpoint**: 基礎資料層與 API 骨架完成。

## Phase 3: User Story 1 - 題庫與測驗 (P1)

- [ ] KE-T301 實作 `services/question_bank.py`（CRUD、版本管理、審核流程）。  
- [ ] KE-T302 建立 `api/questions.py`。  
- [ ] KE-T303 實作 `services/quiz_engine.py`（題目抽取、測驗狀態）。  
- [ ] KE-T304 建立 `api/quizzes.py`，支援開始/回答/完成。  
- [ ] KE-T305 建立 `tests/integration/knowledge/test_quiz_flow.py`。  
- [ ] KE-T306 更新 change feed `knowledge.quiz.completed`。  
- [ ] KE-T307 撰寫 `scripts/tools/import_question_bank.py`。  

**Checkpoint**: 測驗流程可運作。

## Phase 4: User Story 2 - 技能分數與成就 (P1)

- [ ] KE-T401 實作 `services/scoring.py`，計算 subject scores、成就條件。  
- [ ] KE-T402 建立 `jobs/scoring_worker.py` 處理非同步計算。  
- [ ] KE-T403 實作 `services/achievement_service.py`，發佈 `knowledge.skill.updated`、`knowledge.achievement.unlocked`。  
- [ ] KE-T404 建立 `api/skills.py`、`api/achievements.py`。  
- [ ] KE-T405 建立 `tests/unit/knowledge/test_scoring_logic.py`（包含 property-based tests）。  
- [ ] KE-T406 設計成就模板並載入 `assets/achievements/`。  

**Checkpoint**: 技能評分與成就通知可運作。

## Phase 5: User Story 3 - 練習任務 (P2)

- [ ] KE-T501 實作 `services/assignment_manager.py`（指派、狀態管理）。  
- [ ] KE-T502 建立 `api/assignments.py` 與 `api/submissions.py`。  
- [ ] KE-T503 建立 `jobs/reminder_worker.py`（任務提醒）。  
- [ ] KE-T504 整合 `knowledge.assignment.*` 事件。  
- [ ] KE-T505 建立 `tests/integration/knowledge/test_assignment_flow.py`。  
- [ ] KE-T506 撰寫教練指南 `docs/knowledge/assignment-playbook.md`。  

**Checkpoint**: 任務指派/完成流程可運作。

## Phase 6: Polish & Cross-Cutting

- [ ] KE-T601 建立 `Makefile` / `scripts/dev/setup_knowledge.sh`。  
- [ ] KE-T602 整合 OpenTelemetry 指標（測驗成功率、任務完成率）。  
- [ ] KE-T603 建立 `tests/perf/knowledge/test_quiz_throughput.py`。  
- [ ] KE-T604 更新 `PROJECTS.md` Shared Infrastructure，記錄 knowledge API 與事件。  
- [ ] KE-T605 撰寫 `docs/knowledge/changefeed-upgrade.md`（webhook → Kafka）。  
- [ ] KE-T606 完成發佈 Checklist：題庫審核、通知 SLA、資料備援、帳號合併驗證。  
