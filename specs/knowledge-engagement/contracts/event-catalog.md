# Knowledge Engagement Event Catalog

**Version**: 0.1.0 (Draft)  \n**Integrations**: user-core change feed, notification gateway, analytics, coach dashboards

## Events

| Event | Description | Primary Consumers |
|-------|-------------|-------------------|
| `knowledge.quiz.completed` | 測驗完成，包含分數與主題分佈 | user-core, analytics, coach portals |
| `knowledge.skill.updated` | 技能檔案更新（總分與弱項） | snowbuddy, gear-ops, dashboards |
| `knowledge.assignment.assigned` | 教練指派任務 | notification gateway, coach apps |
| `knowledge.assignment.completed` | 任務完成或審核 | analytics, coach dashboards |
| `knowledge.achievement.unlocked` | 成就達成 | notification gateway, marketing |

## Envelope

```json
{
  "id": "uuid",
  "type": "knowledge.quiz.completed",
  "version": 1,
  "emitted_at": "2025-10-14T06:00:00Z",
  "data": { "...": "..." },
  "metadata": {
    "initiator": "system:knowledge",
    "trace_id": "optional",
    "user_id": "uuid"
  }
}
```

## Payload Schemas

### `knowledge.quiz.completed`

```json
{
  "session_id": "uuid",
  "user_id": "uuid",
  "score": 85,
  "max_score": 100,
  "subject_scores": {"safety": 90, "gear": 70},
  "duration_seconds": 420
}
```

### `knowledge.skill.updated`

```json
{
  "user_id": "uuid",
  "overall_score": 88,
  "level": "advanced",
  "weak_topics": ["gear", "history"],
  "achievement_badges": ["consistent_learner"]
}
```

### `knowledge.assignment.assigned`

```json
{
  "assignment_id": "uuid",
  "assigned_by": "uuid",
  "assigned_to": "uuid",
  "subject": "safety",
  "due_at": "2025-12-15T00:00:00Z"
}
```

### `knowledge.assignment.completed`

```json
{
  "assignment_id": "uuid",
  "user_id": "uuid",
  "status": "approved",
  "coach_rating": 4,
  "completed_at": "2025-12-10T10:00:00Z"
}
```

### `knowledge.achievement.unlocked`

```json
{
  "achievement_id": "uuid",
  "user_id": "uuid",
  "badge_code": "gear_master",
  "unlocked_at": "2025-12-05T12:00:00Z"
}
```

## Publishing Rules

- 測驗完成、技能更新、成就達成需同步到 user-core change feed。  
- 任務事件需觸發通知並更新任務狀態。  
- 若通知失敗需標記並重新排程。  
- 成就與技能事件不可曝露敏感答案內容，僅提供摘要。  
- 更新 schema 時需同步 `specs/shared/event_catalog.yaml`。

## Outstanding Items

- 是否需要 `knowledge.quiz.started` 事件以追蹤未完成的測驗。  
- 是否需要紀錄 `knowledge.assignment.reminder` 以顯示提醒狀況。  
- 決定成就多語名稱與圖像存放策略。
