# Gear Operations Event Catalog

**Version**: 0.1.0 (Draft)  
**Integrations**: user-core change feed, notification gateway, analytics, safety team

## Events

| Event | Description | Primary Consumers |
|-------|-------------|-------------------|
| `gear.check.completed` | 裝備檢查完成，更新狀態與下一次提醒 | user-core analytics, safety ops |
| `gear.reminder.sent` | 提醒已送出，包含渠道、狀態 | Notification monitoring, reminders dashboard |
| `gear.trade.posted` | 買賣刊登發布 | Marketplace feed, interested buyers |
| `gear.trade.completed` | 交易完成或取消 | Finance, analytics |
| `gear.recommendation.sent` | 發送保養/升級建議 | Recommendation engine, marketing |
| `gear.flag.raised` | 安全或糾紛警示 | Safety team, customer support |

## Envelope

```json
{
  "id": "uuid",
  "type": "gear.check.completed",
  "version": 1,
  "emitted_at": "2025-10-14T03:00:00Z",
  "data": { "..." },
  "metadata": {
    "initiator": "system:gear-ops",
    "trace_id": "optional",
    "gear_id": "uuid"
  }
}
```

## Payload Schemas

### `gear.check.completed`

```json
{
  "inspection_id": "uuid",
  "gear_id": "uuid",
  "overall_result": "attention",
  "next_inspection_date": "2025-12-01",
  "performed_by": "uuid",
  "checklist_summary": [
    {"item": "bindings", "status": "ok"},
    {"item": "edges", "status": "needs_attention"}
  ]
}
```

### `gear.reminder.sent`

```json
{
  "reminder_id": "uuid",
  "gear_id": "uuid",
  "type": "inspection",
  "channel": "line",
  "status": "delivered",
  "triggered_at": "2025-11-01T01:00:00Z"
}
```

### `gear.trade.posted`

```json
{
  "listing_id": "uuid",
  "gear_id": "uuid",
  "seller_user_id": "uuid",
  "price": 12000,
  "currency": "TWD",
  "location": "Taichung",
  "status": "published"
}
```

### `gear.trade.completed`

```json
{
  "trade_id": "uuid",
  "listing_id": "uuid",
  "buyer_user_id": "uuid",
  "seller_user_id": "uuid",
  "agreed_price": 11000,
  "currency": "TWD",
  "status": "completed",
  "completed_at": "2025-11-05T15:30:00Z"
}
```

### `gear.recommendation.sent`

```json
{
  "recommendation_id": "uuid",
  "gear_id": "uuid",
  "type": "maintenance",
  "message": "Sharpen edges before next trip",
  "trigger_source": "inspection"
}
```

### `gear.flag.raised`

```json
{
  "flag_id": "uuid",
  "gear_id": "uuid",
  "flag_type": "unsafe",
  "details": "Cracked binding",
  "reported_by": "uuid",
  "status": "open"
}
```

## Publishing Rules

- 事件需在交易/檢查完成後即時發布至 user-core webhook；若安全事件，亦需通知客服。  
- 包含敏感資訊（個人聯絡方式）時需遮罩或省略。  
- 事件保留至少 30 天以供重播；`gear.flag.raised` 需持久保存以供稽核。  
- 升級事件 schema 時需更新 `specs/shared/event_catalog.yaml` 並公告。

## Outstanding Items

- 決定是否需要 `gear.trade.disputed` 事件。  
- 評估是否需為 `gear.reminder.failed` 另建事件以追蹤通知失敗。  
- 確認 SafetyFlag 與客服系統整合流程。
