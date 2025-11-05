# Change Feed Contract: Unified Rider Identity Core

**Version**: 0.2.0 (2025-10-19)  
**Scope**: 針對 `UserProfile` 與 `NotificationPreference` 的變更事件

## 1. Transport

- **Channel**: HTTPS webhook gateway（Phase 1 預設）；保留升級至 Kafka / SNS / 其他 MQ 的擴充點  
- **Format**: JSON（UTF-8）  
- **Delivery Semantics**: At least once（Subscriber 必須可 idempotent 處理）  
- **Ordering**: 同一 `entity_id` 的事件保證順序；跨 entity 不保證順序

## 2. Message Envelope

```json
{
  "id": "de305d54-75b4-431b-adb2-eb6b9e546014",
  "entity_type": "UserProfile",
  "entity_id": "9b9a67cf-5036-4d53-8064-1472e6a54f3a",
  "change_type": "updated",
  "published_at": "2025-10-19T01:23:46Z",
  "payload": {
    "actor": "user:ops-001",
    "before": {
      "roles": ["student"],
      "status": "active"
    },
    "after": {
      "roles": ["student", "coach"],
      "status": "active"
    },
    "diff": {
      "roles": {"before": ["student"], "after": ["student", "coach"]}
    },
    "recorded_at": "2025-10-19T01:23:45Z"
  }
}
```

- `payload.actor`: 觸發此次變更的操作者（來自 `X-Actor-Id`，預設 `system`）。  
- `payload.before` / `payload.after`: 變更前後的資料快照。  
- `payload.diff`: 欄位層級的差異，格式為 `{欄位: {before, after}}`。  
- `payload.recorded_at`: 事件在 user-core 中記錄的時間戳。

## 3. Payload Schema

### 3.1 UserProfile Payload

```json
{
  "actor": "user:ops-001",
  "before": {
    "user_id": "uuid",
    "roles": ["student"],
    "status": "active"
  },
  "after": {
    "user_id": "uuid",
    "roles": ["student", "coach"],
    "status": "active"
  },
  "diff": {
    "roles": {"before": ["student"], "after": ["student", "coach"]}
  },
  "recorded_at": "2025-10-19T01:23:45Z"
}
```

必備欄位：`actor`, `diff`, `recorded_at`。`before` / `after` 至少擇一存在，以利重建資料狀態。

### 3.2 NotificationPreference Payload

```json
{
  "actor": "system:coach-scheduling",
  "before": {
    "status": "opt-out",
    "frequency": "weekly"
  },
  "after": {
    "status": "opt-in",
    "frequency": "daily"
  },
  "diff": {
    "status": {"before": "opt-out", "after": "opt-in"},
    "frequency": {"before": "weekly", "after": "daily"}
  },
  "recorded_at": "2025-10-19T02:00:00Z"
}
```

必備欄位：`actor`, `diff`, `recorded_at`。subscriber 可透過 `after` 還原通知偏好最新狀態。

## 4. Change Types

| change_type | Meaning | Notes |
|-------------|---------|-------|
| `created` | 新增資料 | Snapshot 為完整資料 |
| `updated` | 資料更新 | Snapshot 為更新後資料，可附 diff |
| `deleted` | 資料刪除/停用 | payload.after 記錄停用後狀態（如 `status` = `inactive`） |
| `merged` | 帳號合併 | payload.after 包含 `status = merged`；subscriber 須更新引用 |

**Merged Snapshot Example**

```json
{
  "actor": "system:migration-tool",
  "before": {
    "status": "active"
  },
  "after": {
    "status": "merged",
    "merged_into": "a3e1d7a6-5f2c-4d3e-9b2a-8888b42ad560"
  },
  "diff": {
    "status": {"before": "active", "after": "merged"},
    "merged_into": {"before": null, "after": "a3e1d7a6-5f2c-4d3e-9b2a-8888b42ad560"}
  },
  "recorded_at": "2025-10-19T03:10:00Z"
}
```

## 5. Subscriber Responsibilities

1. **Idempotency**: 以 `id` 確認事件是否重複處理。  
2. **Payload Diff**: 依 `payload.diff` 更新欄位，未列出的欄位可視情保留。  
3. **Merge Handling**: 遇到 `change_type=merged`，需將本地資料指向 `payload.after.merged_into`。  
4. **Failure Recovery**: 失敗時須回傳錯誤並可重新拉取。建議設計 dead-letter queue。

## 6. Publishing Rules

- 改動 `UserProfile` 或 `NotificationPreference`，在交易提交後必須立刻發布對應的 change feed。  
- Change feed 不應包含敏感資訊（如密碼、token）；若需，需額外加密或避免放入 `payload`。  
- Change feed 訊息需保留至少 30 天，以便重播或災難復原。  
- 若外部系統需確認處理狀態，可使用自訂欄位記錄 ACK（可由 subscriber 回寫）。

## 7. Outstanding Items

- 決定實際傳輸渠道（Kafka, SQS, webhook）。  
- 釐清訂閱者身份管理（是否需 API key 或 OAuth 供每個專案使用）。  
- 確定 `version` 升級流程（變更審查會議、公告流程）。
