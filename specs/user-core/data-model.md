# Phase 1 Data Model: Unified Rider Identity Core

**Date**: 2025-10-14  
**Source Spec**: `specs/user-core/spec.md`

## 1. Entity Overview

### 1.1 UserProfile
| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `user_id` | UUID (string) | 平台唯一識別碼；可沿用現有 `_id`（如 `members-utf8.csv`）或遷移產生的新 UUID | Primary Key |
| `legacy_ids` | JSONB | 用來存放 email、phone、第三方 ID 等歷史識別碼（陣列） | 供遷移比對 |
| `preferred_language` | Enum(`zh-TW`, `zh-CN`, `en`, …) | 使用者偏好的交流語言 | Nullable |
| `experience_level` | Enum(`beginner`, `intermediate`, `advanced`, `coach`) | 滑雪經驗 | 基礎資料 |
| `roles` | Enum array(`student`, `coach`) | 支援多重身份 | constraint: 至少一個 |
| `coach_cert_level` | String | 教練認證等級 | Nullable |
| `preferred_resorts` | JSONB | 常去雪場列表（含 resort_id, note） | |
| `teaching_languages` | JSONB | 教學語言與熟練度 | 針對教練 |
| `bio` | Text | 簡短自我介紹（可支援 UI） | Optional |
| `created_at` | Timestamp | 建立時間 | Default now |
| `updated_at` | Timestamp | 更新時間 | On update |
| `status` | Enum(`active`, `inactive`, `merged`) | 主檔狀態 | `merged` 表示合併至其他帳號 |
| `audit_log` | JSONB | 最近變更摘要（操作者、原因） | 用於審計 |

### 1.2 BehaviorEvent
| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `event_id` | UUID | 行為事件唯一識別碼 | Primary Key |
| `user_id` | UUID | 關聯的使用者 | FK → `UserProfile.user_id` |
| `source_project` | Enum(`coach-scheduling`, `snowbuddy-matching`, `gear-ops`, `resort-services`, `knowledge-engagement`, `user-core`) | 發送事件的專案 | |
| `event_type` | String | 事件型別（依型錄定義，如 `lesson_booked`, `gear_check_completed`） | 與 catalog 對應 |
| `occurred_at` | Timestamp | 事件發生時間 | |
| `recorded_at` | Timestamp | 寫入 user-core 時間 | |
| `payload` | JSONB | 事件詳細內容，依 schema 驗證 | |
| `version` | Integer | 事件 schema 版本 | 支援演進 |

### 1.3 NotificationPreference
| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `user_id` | UUID | 使用者識別碼 | PK with channel |
| `channel` | Enum(`email`, `line`, `sms`, `app`) | 通知渠道 | |
| `topic` | Enum(`lesson-reminder`, `snowbuddy-match`, `gear-check`, `traffic-alert`, `knowledge-survey`, `marketing`) | 通知主題 | |
| `status` | Enum(`opt-in`, `opt-out`, `paused`) | 使用者授權狀態 | 預設 `opt-out` |
| `frequency` | Enum(`immediate`, `daily`, `weekly`, `monthly`) | 傳送頻率設定 | 預設 `immediate` |
| `last_updated_at` | Timestamp | 更新時間 | |
| `audited_by` | String | 最後更新者（系統/手動） | |
| `consent_source` | String | 授權來源（如 `web_form`, `line_opt_in`, `import_default`） | |
| `consent_recorded_at` | Timestamp | 授權紀錄時間 | |

### 1.4 ChangeFeed
| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `id` | UUID | 變更事件識別碼 | Primary Key |
| `entity_type` | Enum(`UserProfile`, `NotificationPreference`) | 來源實體 | |
| `entity_id` | UUID | 關聯實體 ID | FK |
| `change_type` | Enum(`created`, `updated`, `deleted`, `merged`) | 變更類型 | |
| `snapshot` | JSONB | 變更後的資料快照（可只包含 diff） | |
| `published_at` | Timestamp | 發布時間 | |
| `processed_by` | JSONB | 訂閱服務處理狀態（選填） | |

### 1.5 LegacyMapping (支援遷移)
| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `legacy_system` | String | 舊系統名稱或國別代號（如 `csv_members`, `sqlite_orders`, `tw_nid`, `hk_hkid`, `cn_id`, `jp_my_number`, `intl_passport`） | PK component |
| `legacy_key` | String | 舊系統主鍵或身份識別碼（可儲存雜湊） | PK component |
| `user_id` | UUID | 映射的 user-core ID | FK |
| `notes` | Text | 遷移補充說明與驗證結果 | |
| `created_at` | Timestamp | 建立時間 | |

### 1.6 UserLocaleProfile（延伸表）
| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `user_id` | UUID | 關聯使用者 | PK, FK → `UserProfile` |
| `country_code` | String(2) | ISO-3166-1 alpha-2（如 `TW`, `HK`, `CN`, `JP`, `US`） | |
| `local_identifier` | String | 當地身份號碼（需遮罩或加密） | Nullable |
| `verification_status` | Enum(`unverified`, `pending`, `verified`) | 身分驗證狀態 | |
| `metadata` | JSONB | 國別特有欄位（住址格式、稅務需求等） | |
| `updated_at` | Timestamp | 更新時間 | |

### 1.7 NotificationPreferenceTemplate（Seed）
| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `topic` | Enum | 與 `NotificationPreference.topic` 對應 | PK component |
| `channel` | Enum | 與 `NotificationPreference.channel` 對應 | PK component |
| `default_status` | Enum | 初始狀態（建議 `opt-out`） | |
| `default_frequency` | Enum | 預設頻率 | |
| `requires_consent` | Boolean | 是否需顯式同意 | |
| `locale_overrides` | JSONB | 針對不同國家/語言的預設值 | |

## 2. Relationships

```
UserProfile (1) ────< BehaviorEvent
      │
      ├───< NotificationPreference
      │
      ├───< LegacyMapping
      │
      └───< UserLocaleProfile

NotificationPreferenceTemplate ─── seeds ──> NotificationPreference

ChangeFeed ─── references ──> (UserProfile | NotificationPreference)
```

- `BehaviorEvent.user_id` 依賴 `UserProfile.user_id`；若使用者被合併，事件保留原 `user_id`，並於 `UserProfile.status=merged` 時透過應用層遷移或保留。
- `NotificationPreference` 以 `(user_id, channel, topic)` 作複合主鍵，確保單一偏好設定唯一。
- `LegacyMapping` 允許多個 legacy key 指向同一 `user_id`，以支援資料清洗與追蹤。
- `ChangeFeed` 對 `UserProfile`/`NotificationPreference` 做事件式同步，供外部服務訂閱。

## 3. Event Schema (Draft)

### 3.1 Event Catalog

| event_type | Source Project | Core Payload Fields |
|------------|----------------|---------------------|
| `user.profile.updated` | user-core | `changed_fields[]`, `actor`, `reason` |
| `lesson.slot.created` | coach-scheduling | `slot_id`, `resort_id`, `coach_id`, `starts_at`, `status` |
| `lesson.slot.booked` | coach-scheduling | `booking_id`, `student_id`, `slot_id`, `status` |
| `snowbuddy.match.proposed` | snowbuddy-matching | `match_id`, `participants[]`, `criteria` |
| `gear.check.completed` | gear-ops | `check_id`, `items[]`, `status` |
| `resort.visit.logged` | resort-services | `visit_id`, `resort_id`, `days`, `conditions` |
| `knowledge.quiz.finished` | knowledge-engagement | `quiz_id`, `score`, `category`, `attempts` |

### 3.2 Payload Schema Example (`lesson.slot.booked`)

```json
{
  "booking_id": "b123-...",
  "slot_id": "s456-...",
  "coach_id": "u-coach",
  "student_id": "u-student",
  "status": "confirmed",
  "booking_channel": "web",
  "price": 5000,
  "currency": "TWD",
  "metadata": {
    "notes": "Bring own gear",
    "language": "zh-TW"
  }
}
```

- `event_type` 與 `version` 共同決定 payload schema；需在 `contracts/change-feed.md` 中正式定義。
- 所有事件必須包含 `source_project`, `occurred_at`, `user_id`，並遵循 `Never Break Userspace`（版本升級需支援舊版解讀）。

## 4. Migration Strategy Outline

1. **Identify Unique Key**: 先以 `_id`（CSV）或 email/phone 做初始映射，若缺失則生成新 UUID。  
2. **Populate UserProfile**: 將 `members-utf8.csv` 等主要資料匯入到 `UserProfile`，記錄 `legacy_ids` 與 `LegacyMapping`。  
3. **Backfill Events**: 針對已存在的課程、媒合、裝備紀錄，建立對應事件（必要時建立批次腳本）。  
4. **Import Preferences**: 若尚無偏好資料，依 `NotificationPreferenceTemplate` 建立預設（預設 `opt-out`），並在 `consent_source` 記錄 `import_default`。  
5. **Dual Write Phase**: 調整既有腳本在寫入舊資料的同時呼叫 user-core API，保持同步直到正式切換。  
6. **Cutover & Validation**: 在回報無誤後停用舊流程；保留 LegacyMapping 以便稽核。

## 5. Outstanding Decisions

- 是否沿用現有 `_id` 作為 `user_id`：需確認唯一性與格式；若不採用，必須定義 `_id → UUID` 的映射規則。  
- UserLocaleProfile 欄位最終清單：各國是否需要額外欄位（例如日本假名、香港中文地址）。  
- NotificationPreferenceTemplate 預設值：各國是否需要不同的預設狀態或頻率，及 consent 取得流程。  
- 事件 catalog 維護流程：各專案負責人如何提案、審查與版本管理。  
- Change feed 升級門檻：何時從 webhook 遷移至 Kafka/SNS，需要哪些基礎建設。  
- 審計資料儲存格式是否足夠（JSONB vs. 專用 audit 表）。  
- 服務語言/框架最終選定（Python/FastAPI 為建議方案，待確認團隊技能）。

## 6. Next Deliverables

- `contracts/api-openapi.yaml`: 定義 UserProfile/BehaviorEvent/NotificationPreference REST API。  
- `contracts/change-feed.md`: 定義 change feed 事件格式及訂閱規範。  
- `quickstart.md`: 建立本地開發與資料遷移流程指南。  
- `tasks.md`: 由 `/speckit.tasks` 拆解實作與遷移工作。
