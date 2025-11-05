# Phase 1 Data Model: Knowledge Engagement & Skill Growth

**Date**: 2025-10-14  
**Spec Source**: `specs/knowledge-engagement/spec.md`

## 1. Entity Overview

### 1.1 QuizQuestion
| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `question_id` | UUID | 題目 ID | Primary Key |
| `version` | Integer | 題庫版本 | 自動遞增 |
| `language` | String | 語言 | |
| `subject` | Enum(`gear`, `safety`, `technique`, `resort`, `history`, `other`) | 主題 | |
| `difficulty` | Enum(`beginner`, `intermediate`, `advanced`) | 難度 | |
| `question_type` | Enum(`single_choice`, `multiple_choice`, `true_false`, `open`) | 題型 | |
| `prompt` | Text | 題幹 | |
| `options` | JSONB | 選項（若適用） | |
| `correct_answer` | JSONB | 正確答案（支援多選） | |
| `explanation` | Text | 解說 | |
| `media` | JSONB | 圖片/影片 URL | |
| `status` | Enum(`draft`, `published`, `archived`) | 狀態 | |
| `tags` | JSONB | 標籤 | |
| `created_by` | UUID | 建立者 | |
| `created_at` | Timestamp | 建立時間 | |
| `updated_at` | Timestamp | 更新時間 | |

### 1.2 QuizSession
| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `session_id` | UUID | 測驗會話 ID | Primary Key |
| `user_id` | UUID | 使用者 | FK |
| `started_at` | Timestamp | 開始時間 | |
| `ended_at` | Timestamp | 結束時間 | Nullable |
| `status` | Enum(`in_progress`, `completed`, `cancelled`) | 狀態 | |
| `score` | Integer | 得分 | |
| `max_score` | Integer | 滿分 | |
| `time_spent_seconds` | Integer | 耗時 | |
| `question_version` | Integer | 使用的題庫版本 | |
| `metadata` | JSONB | 設定（題量、主題） | |

### 1.3 QuizAnswer
| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `answer_id` | UUID | 答題紀錄 ID | Primary Key |
| `session_id` | UUID | 測驗會話 | FK |
| `question_id` | UUID | 題目 | FK |
| `question_version` | Integer | 題目版本 | |
| `user_answer` | JSONB | 使用者回答 | |
| `is_correct` | Boolean | 是否正確 | |
| `score` | Integer | 該題得分 | |
| `time_spent_seconds` | Integer | 耗時 | |

### 1.4 SkillProfile
| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `profile_id` | UUID | Profile ID | Primary Key |
| `user_id` | UUID | 使用者 | Unique FK |
| `overall_score` | Integer | 總分（0-100 或自定） | |
| `level` | Enum(`novice`, `advanced`, `expert`, `coach`) | 等級 | |
| `subject_scores` | JSONB | 主題得分 map | |
| `weak_topics` | JSONB | 弱項主題 | |
| `achievement_badges` | JSONB | 成就徽章列表 | |
| `updated_at` | Timestamp | 更新時間 | |

### 1.5 PracticeAssignment
| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `assignment_id` | UUID | 任務 ID | Primary Key |
| `assigned_by` | UUID | 教練/營運 | FK |
| `assigned_to` | UUID | 學員 | FK |
| `subject` | String | 主題 | |
| `description` | Text | 任務內容 | |
| `due_at` | Timestamp | 截止時間 | Nullable |
| `status` | Enum(`pending`, `accepted`, `in_progress`, `submitted`, `approved`, `rejected`, `cancelled`) | 狀態 | |
| `reminder_id` | UUID | 對應提醒 | Nullable |
| `attachments` | JSONB | 資料（連結、檔案） | |
| `created_at` | Timestamp | 建立時間 | |
| `updated_at` | Timestamp | 更新時間 | |

### 1.6 PracticeSubmission
| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `submission_id` | UUID | 提交 ID | Primary Key |
| `assignment_id` | UUID | 任務 | FK |
| `submitted_at` | Timestamp | 提交時間 | |
| `content` | Text | 回報內容 | |
| `media` | JSONB | 附件/影片 | |
| `coach_feedback` | Text | 教練回饋 | |
| `coach_rating` | Integer | 教練評分 | |
| `status` | Enum(`under_review`, `approved`, `needs_revision`) | 審核狀態 | |

### 1.7 AchievementLog
| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `achievement_id` | UUID | 成就紀錄 ID | Primary Key |
| `user_id` | UUID | 使用者 | FK |
| `badge_code` | String | 成就編碼 | |
| `unlocked_at` | Timestamp | 達成時間 | |
| `source` | Enum(`quiz`, `mission`, `visit`, `manual`) | 來源 | |
| `metadata` | JSONB | 詳細資訊 | |
| `notified_at` | Timestamp | 通知時間 | Nullable |

### 1.8 QuestionReview
| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `review_id` | UUID | 審核 ID | Primary Key |
| `question_id` | UUID | 題目 | FK |
| `version` | Integer | 題目版本 | |
| `reviewer_id` | UUID | 審核者 | FK |
| `status` | Enum(`pending`, `approved`, `changes_requested`, `rejected`) | 審核狀態 | |
| `comments` | Text | 審核意見 | |
| `created_at` | Timestamp | 建立時間 | |
| `updated_at` | Timestamp | 更新時間 | |

## 2. Relationships

```
QuizQuestion ──< QuestionReview
       │
       └── versioned ──> QuizAnswer (via question_version)

QuizSession (1) ──< QuizAnswer
      │
      └── updates ──> SkillProfile ──> AchievementLog

PracticeAssignment (1) ──< PracticeSubmission
      │
      └── reminder ──> NotificationPreference (user-core)
```

- `QuizQuestion` 使用版本控制；新的修改會產生新版本，舊測驗引用舊版本。  
- `SkillProfile` 結合 `QuizSession`、`PracticeSubmission` 與外部資料（旅程、裝備）。  
- `AchievementLog` 用於發送成就通知和顯示在個人檔案。  
- `PracticeAssignment` 可產生提醒，與 user-core 偏好結合。

## 3. Event Catalog (Knowledge)

| event_type | Highlights |
|------------|------------|
| `knowledge.quiz.completed` | `session_id`, `user_id`, `score`, `subject_breakdown` |
| `knowledge.skill.updated` | `user_id`, `overall_score`, `weak_topics` |
| `knowledge.assignment.assigned` | `assignment_id`, `assigned_to`, `due_at` |
| `knowledge.assignment.completed` | `assignment_id`, `status` |
| `knowledge.achievement.unlocked` | `badge_code`, `user_id` |

## 4. Scoring Flow (Outline)

1. 使用者完成 `QuizSession`，儲存 `QuizAnswer`。  
2. `scoring_worker` 根據答案計算分數、主題得分，更新 `SkillProfile`。  
3. 若成就達成，寫入 `AchievementLog` 並發送通知（尊重偏好）。  
4. 教練可根據 `SkillProfile` 指派 `PracticeAssignment`，提醒透過 `reminder_worker` 發送。  
5. `PracticeSubmission` 成功後重新計算弱項與建議。

## 5. Migration Strategy Outline

1. 收集現有題庫（若有），轉換成 `QuizQuestion` 表格式。  
2. 若有歷史測驗資料，設計匯入腳本並維持版本對應。  
3. 匯入初始成就與徽章 mapping。  
4. 建立初期 `PracticeAssignment` 模板。  
5. 與 user-core 事件同步：測驗/成就需寫入 change feed。  
6. 設定雙寫策略（若之後從外部系統匯入成績）。  

## 6. Outstanding Decisions

- 題庫維護流程與權限：誰可發佈、誰審核？  
- 評分模型細節：每主題權重、難度計分方式。  
- 成就清單與條件（需設計/產品合作）。  
- 任務類型與附件支援（影片、檔案上傳存放位置）。  
- 是否需要前端 UI 產生測驗，或由 API 提供 JSON 給現有平台。  
- 資料保留政策（成績是否可刪除或匿名化）。  
