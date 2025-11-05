# Feature Specification: Knowledge Engagement & Skill Growth

**Feature Branch**: `006-knowledge-engagement`  
**Created**: 2025-10-14  
**Status**: Draft  
**Input**: mindmap.md（滑雪知識測驗紀錄、累積分數、知識主題）、`PROJECTS.md`, `specs/user-core/spec.md`

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 知識測驗與題庫管理 (Priority: P1)

使用者可以參加滑雪知識測驗，題庫依主題分類，系統記錄分數與錯題；教練或營運可維護題目。

**Why this priority**: 知識測驗是 engagement 的核心，需先有題庫與測驗流程。

**Independent Test**: 建立題目 → 使用者測驗 → 儲存結果，確認題庫與成績紀錄一致。

**Acceptance Scenarios**:

1. **Given** 題庫完成設定，**When** 使用者進行測驗，**Then** 系統隨機出題並記錄答題結果（正確/錯誤）。  
2. **Given** 教練更新題目，**When** 發布，**Then** 系統產生題庫版本並通知測驗編輯者。

---

### User Story 2 - 技能分數與成就系統 (Priority: P1)

使用者的測驗成績與旅程資料結合，生成「技能評分」、「弱項主題」，提供個人化建議。

**Why this priority**: 成績只是過程，技能與建議才能激勵行為。

**Independent Test**: 多次測驗後檢查分數變化與建議是否更新。

**Acceptance Scenarios**:

1. **Given** 使用者完成測驗，**When** 系統更新技能分數，**Then** 使用者可在儀表板看到最新成績與弱項。  
2. **Given** 使用者達成成就條件（連續高分），**When** 系統判定，**Then** 發送成就通知並寫入 user-core 事件。

---

### User Story 3 - 教練/營運指派練習任務 (Priority: P2)

教練可根據學員分數指派練習或補課任務，學員完成後回報成果，系統追蹤進度。

**Why this priority**: 支援教練與營運介入，提高 engagement 成效。

**Independent Test**: 教練指派任務 → 學員完成 → 成績更新，確認流程完整。

**Acceptance Scenarios**:

1. **Given** 教練指派補課任務，**When** 學員接受，**Then** 系統建立任務紀錄並排程提醒。  
2. **Given** 學員提交成果，**When** 教練確認，**Then** 系統將任務標記完成並更新技能分數。

### Edge Cases

- 題庫版本升級需保持測驗紀錄對應舊版題目。  
- 使用者合併帳號時需合併成績與成就。  
- 練習任務可跨國、跨教練，需要權限控管。  
- 測驗中斷或網路問題需支援恢復。  
- 多語題庫需提供翻譯與一致性檢查。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-501**: 系統必須提供題庫 CRUD、版本管理與主題分類。  
- **FR-502**: 系統必須提供測驗流程（計時、隨機出題、立即或事後批改）。  
- **FR-503**: 系統必須記錄測驗結果（題目、答案、分數、耗時）並寫入 user-core 事件。  
- **FR-504**: 系統必須計算技能評分、弱項主題、成就標籤，並提供 API/報表。  
- **FR-505**: 系統必須允許教練指派練習任務，支援提醒與成果回報。  
- **FR-506**: 系統必須支援通知（測驗提醒、成就達成、任務提醒），需尊重 NotificationPreference。  
- **FR-507**: 系統必須提供教練/營運儀表板（學員分布、主題熱度）。  
- **FR-508**: 系統必須支援多語題庫與顯示（至少中文/英文/日文）。  
- **FR-509**: 系統必須提供題目審核與品質檢查流程；任何題目下架需提供遷移方案。

### Key Entities *(include if feature involves data)*

- **QuizQuestion**: 題庫（題幹、選項、答案、主題、難度、語言）。  
- **QuizSession**: 測驗會話（使用者、版本、得分、耗時）。  
- **QuizAnswer**: 單題作答紀錄（題目 ID、答案、正確與否）。  
- **SkillProfile**: 使用者技能評分（主題分數、等級、成就標籤）。  
- **PracticeAssignment**: 任務（指派者、接受者、主題、截止日、狀態）。  
- **PracticeSubmission**: 任務回報（內容、附件、教練評語）。  
- **AchievementLog**: 成就達成紀錄（條件、日期、通知狀態）。  
- **QuestionReview**: 題目審核（狀態、審核者、原因）。

## Success Criteria *(mandatory)*

- **SC-501**: 測驗流程穩定性：題庫版本升級後歷史測驗無錯誤，測驗成功率 ≥ 99%。  
- **SC-502**: 技能評分更新延遲 < 1 分鐘；弱項主題準確度（教練滿意度）≥ 80%。  
- **SC-503**: 任務完成率 ≥ 60%，提醒成功率 ≥ 98%。  
- **SC-504**: 成就通知延遲 < 1 分鐘；通知失敗率 < 1%。  
- **SC-505**: 舊資料匯入（若有）保持無重複或遺失，合併帳號後成績一致（Never Break Userspace）。  
