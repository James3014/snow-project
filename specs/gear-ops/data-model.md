# Phase 1 Data Model: Gear Operations & Maintenance

**Date**: 2025-10-14  \n**Spec Source**: `specs/gear-ops/spec.md`

## 1. Entity Overview

### 1.1 GearItem
| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `gear_id` | UUID | 裝備識別碼 | Primary Key |
| `user_id` | UUID | 擁有者（user-core） | FK |
| `name` | String | 裝備名稱 | |
| `category` | Enum(`ski`, `snowboard`, `helmet`, `goggles`, `protective`, `other`) | 類別 | |
| `brand` | String | 品牌 | |
| `model` | String | 型號 | |
| `usage_type` | Enum(`personal`, `teaching`, `rental`) | 用途 | |
| `condition_status` | Enum(`excellent`, `good`, `needs_attention`, `unsafe`) | 當前狀態 | |
| `photos` | JSONB | 照片 URL | |
| `purchase_date` | Date | 購買日期 | Nullable |
| `purchase_price` | Numeric | 購入價 | Nullable |
| `currency` | Enum(`TWD`, `HKD`, `CNY`, `JPY`, `USD`) | 貨幣 | |
| `notes` | Text | 備註 | |
| `created_at` | Timestamp | 建立時間 | |
| `updated_at` | Timestamp | 更新時間 | |
| `status` | Enum(`active`, `archived`) | 狀態 | |

### 1.2 GearInspection
| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `inspection_id` | UUID | 檢查紀錄 ID | Primary Key |
| `gear_id` | UUID | 關聯裝備 | FK |
| `performed_by` | UUID | 操作者（可為教練/系統） | FK |
| `performed_at` | Timestamp | 檢查時間 | |
| `checklist` | JSONB | 檢查項目與結果（`item`, `status`, `notes`, `photo_url`） | |
| `overall_result` | Enum(`pass`, `attention`, `fail`) | 總結結果 | |
| `next_inspection_date` | Date | 下次檢查日期 | Nullable |
| `reminder_id` | UUID | 對應提醒 | Nullable |
| `attachments` | JSONB | 附件（維修單、收據） | |
| `created_at` | Timestamp | 建立時間 | |

### 1.3 GearReminder
| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `reminder_id` | UUID | 提醒 ID | Primary Key |
| `gear_id` | UUID | 裝備 ID | FK |
| `type` | Enum(`inspection`, `maintenance`, `replacement`, `trade_followup`) | 提醒類型 | |
| `frequency_days` | Integer | 頻率（天） | |
| `next_trigger_at` | Timestamp | 下一次提醒時間 | |
| `status` | Enum(`scheduled`, `paused`, `completed`) | 狀態 | |
| `last_triggered_at` | Timestamp | 上次提醒 | Nullable |
| `notification_channels` | JSONB | 使用者允許的管道 | |
| `metadata` | JSONB | 其他資訊（對應檢查 ID 等） | |

### 1.4 GearListing
| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `listing_id` | UUID | 刊登 ID | Primary Key |
| `gear_id` | UUID | 裝備 ID | FK |
| `seller_user_id` | UUID | 賣家 | FK |
| `title` | String | 刊登標題 | |
| `description` | Text | 描述 | |
| `price` | Numeric | 價格 | |
| `currency` | Enum | 貨幣 | |
| `location` | String | 所在地 | |
| `trade_options` | JSONB | 交易方式（面交、郵寄等） | |
| `status` | Enum(`draft`, `published`, `reserved`, `sold`, `cancelled`) | 狀態 | |
| `published_at` | Timestamp | 發布時間 | Nullable |
| `expires_at` | Timestamp | 下架時間 | Nullable |
| `created_at` | Timestamp | 建立時間 | |

### 1.5 GearTrade
| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `trade_id` | UUID | 交易 ID | Primary Key |
| `listing_id` | UUID | 刊登 ID | FK |
| `buyer_user_id` | UUID | 買家 | FK |
| `seller_user_id` | UUID | 賣家 | FK |
| `agreed_price` | Numeric | 成交價 | |
| `currency` | Enum | 貨幣 | |
| `payment_method` | Enum(`cash`, `transfer`, `escrow`, `other`) | 支付方式 | |
| `status` | Enum(`in_progress`, `completed`, `cancelled`, `disputed`) | 狀態 | |
| `completed_at` | Timestamp | 完成時間 | Nullable |
| `dispute_notes` | Text | 糾紛說明 | |
| `safety_flag_id` | UUID | 若有問題對應安全旗標 | Nullable |

### 1.6 GearRecommendation
| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `recommendation_id` | UUID | 建議 ID | Primary Key |
| `gear_id` | UUID | 裝備 | FK |
| `type` | Enum(`maintenance`, `upgrade`, `replacement`, `offer`) | 提供的建議類型 | |
| `message` | Text | 建議內容 | |
| `trigger_source` | Enum(`inspection`, `usage`, `trade_history`, `manual`) | 來源 | |
| `generated_at` | Timestamp | 產生時間 | |
| `status` | Enum(`sent`, `acknowledged`, `dismissed`) | 狀態 | |
| `metadata` | JSONB | 相關資料（例如使用次數、磨損程度） | |

### 1.7 GearSafetyFlag
| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `flag_id` | UUID | 旗標 ID | Primary Key |
| `gear_id` | UUID | 裝備 | FK |
| `reported_by` | UUID | 提報者 | FK |
| `flag_type` | Enum(`unsafe`, `fraud`, `policy_violation`, `other`) | 類型 | |
| `details` | Text | 說明 | |
| `status` | Enum(`open`, `reviewing`, `resolved`) | 處理狀態 | |
| `created_at` | Timestamp | 建立時間 | |
| `resolved_at` | Timestamp | 結案時間 | Nullable |
| `resolution_notes` | Text | 處理結果 | |

## 2. Relationships

```
GearItem (1) ────< GearInspection ──> GearReminder
      │                      │
      │                      └──> GearRecommendation
      │
      ├───< GearListing ────< GearTrade
      │
      └───< GearSafetyFlag
\nGearReminder ──> NotificationPreference (user-core)
GearTrade ──> Payment / SafetyFlag (if disputed)
```

- 裝備檢查可能產生提醒與建議；GearReminder 與 NotificationPreference 結合決定通知管道。  
- GearListing 與 GearTrade 處理買賣流程；若交易有問題，建立 GearSafetyFlag。  
- GearRecommendation 由 inspections 或 usage 資料觸發。

## 3. Event Catalog (Gear)

| event_type | Payload Highlights | Notes |
|------------|--------------------|-------|
| `gear.check.completed` | `inspection_id`, `gear_id`, `overall_result`, `next_inspection` | 觸發提醒與保養建議 |
| `gear.reminder.sent` | `reminder_id`, `gear_id`, `channel` | 以 webhook 發佈 |
| `gear.trade.posted` | `listing_id`, `gear_id`, `price`, `status` | 通知感興趣的買家 |
| `gear.trade.completed` | `trade_id`, `listing_id`, `amount` | 回寫 user-core |
| `gear.recommendation.sent` | `recommendation_id`, `type` | 行為事件 |
| `gear.flag.raised` | `flag_id`, `gear_id`, `flag_type` | 通知客服 |

事件須註冊至 `specs/shared/event_catalog.yaml`，並透過 user-core change feed 分發。

## 4. Reminder Scheduling Outline

1. 建立 GearReminder 記錄（頻率或指定日期）。  
2. Celery/Apscheduler 每小時掃描 `next_trigger_at <= now`。  
3. 呼叫 NotificationPreference 查詢授權；若允許，發送通知並更新 `last_triggered_at`, `next_trigger_at`。  
4. 記錄 `gear.reminder.sent` 事件；若未授權，記錄 `skipped` 狀態。  
5. 危險裝備（overall_result=fail）立即觸發高優先級通知與 GearSafetyFlag。

## 5. Migration Strategy Outline

1. **資料收集**：尋找現有裝備與檢查資料（CSV/DB），整理欄位。  
2. **匯入 GearItem**：將歷史裝備資料匯入，設定 `legacy_ids`（參照 user-core 的 LegacyMapping）。  
3. **匯入檢查紀錄**：若有裝備檢查資料，轉換為 GearInspection + GearReminder。  
4. **交易資料**：如有歷史交易，建立 GearListing/GearTrade 歷史紀錄；若無則流程從零開始。  
5. **通知設定**：建立提醒模板，預設 `status=scheduled` 才會啟動。  
6. **雙寫期**：若有舊系統運作，需要同步輸入新系統或設定觀察期。  
7. **安全資料**：導入任何危險裝備/糾紛資訊至 GearSafetyFlag。

## 6. Outstanding Decisions

- 檢查 checklist 是否由營運提供模板（需放在 metadata 或獨立表）。  
- 交易支付流程採媒合或真正金流整合？  
- 是否需要多語系裝備描述支援？  
- 裝備推薦規則是否依據機械專家、AI 模型或簡單閾值？  
- 錯誤/危險通知是否需要人工審核 before 發送？  
- 交易糾紛的處理 SLA 與責任分工（客服或自動化）。  
- 是否與 snowbuddy 或 coach-scheduling 共享裝備可用狀態（例如課程需求）。
