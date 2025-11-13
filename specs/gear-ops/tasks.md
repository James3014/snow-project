# Tasks: Gear Operations & Maintenance

**Input**: `specs/gear-ops/spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

## Linus 原則重寫說明

**原有問題**：
- 38個任務解決3個核心功能 → 過度設計
- 為10k裝備設計分布式架構 → 規模不匹配
- MVP階段考慮跨國貨幣、稅金 → 臆想問題

**重寫原則**：
1. **數據結構優先** - 先設計好表結構，其他都是增刪改查
2. **消除特殊情況** - 統一處理，不要為邊界情況寫特殊邏輯
3. **實用主義** - 只解決真實存在的問題
4. **零破壞性** - 新系統不影響現有功能
5. **簡單粗暴** - 能用 cron job 就不用消息隊列

---

## Phase 1: 數據層 (Data First)

**目標**: 建立清晰的數據模型，一切功能基於此。

### GO-T101 [P][數據] 設計並實作核心資料表

**輸出**: Alembic migration + ORM models

```sql
-- 核心三表，不要更多
CREATE TABLE gear_items (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),  -- board, binding, boots, etc.
  brand VARCHAR(50),
  purchase_date DATE,
  status VARCHAR(20),    -- active, retired, for_sale
  role VARCHAR(20),      -- personal, teaching
  -- 買賣欄位（不需要獨立表）
  sale_price DECIMAL(10,2),
  sale_currency VARCHAR(3) DEFAULT 'TWD',
  -- 元數據
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE gear_inspections (
  id UUID PRIMARY KEY,
  gear_item_id UUID NOT NULL REFERENCES gear_items(id),
  inspector_user_id UUID NOT NULL,
  inspection_date TIMESTAMP NOT NULL,
  checklist JSONB NOT NULL,  -- {edge: "good", bindings: "worn", ...}
  overall_status VARCHAR(20), -- good, needs_attention, unsafe
  notes TEXT,
  next_inspection_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_gear_inspections_item ON gear_inspections(gear_item_id);
CREATE INDEX idx_gear_inspections_date ON gear_inspections(inspection_date);

CREATE TABLE gear_reminders (
  id UUID PRIMARY KEY,
  gear_item_id UUID NOT NULL REFERENCES gear_items(id),
  reminder_type VARCHAR(50), -- inspection, maintenance, general
  scheduled_at TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, cancelled
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_gear_reminders_schedule ON gear_reminders(scheduled_at, status);
```

**為什麼這樣設計**：
- 只有3個表，覆蓋所有核心需求
- `for_sale` 是 gear_items 的狀態，不需要獨立的 GearListing 表
- `overall_status = 'unsafe'` 就是安全標記，不需要獨立的 GearSafetyFlag 表
- checklist 用 JSONB，未來可以靈活擴展
- 索引只加在真正需要查詢的欄位上

**驗收標準**：
- [ ] migration 可以執行且可回滾
- [ ] 寫10個單元測試驗證外鍵約束、狀態轉換
- [ ] 可以在 psql 裡手動插入完整的裝備-檢查-提醒流程

**時間估計**: 1天

---

### GO-T102 [P][數據] 實作 ORM models + Pydantic schemas

**輸出**:
- `platform/gear_ops/models.py` (SQLAlchemy models)
- `platform/gear_ops/schemas.py` (Pydantic schemas for API)

**為什麼合併**：
- models 和 schemas 是一對一關係，分開寫重複代碼
- 一個檔案不超過500行，可讀性沒問題

**驗收標準**：
- [ ] 每個 model 都有對應的 Create/Read/Update schema
- [ ] 20個 pytest 測試驗證序列化/反序列化
- [ ] 用 Pydantic 的 validator 檢查 status, role 等枚舉值

**時間估計**: 0.5天

---

## Phase 2: 基礎 API (CRUD, Nothing Fancy)

**目標**: 提供基本的增刪改查接口，不要過度設計。

### GO-T201 [P][API] 裝備管理 API

**輸出**: `platform/gear_ops/api/items.py`

```python
POST   /api/gear/items          # 建立裝備
GET    /api/gear/items          # 列出我的裝備（可過濾 status, role）
GET    /api/gear/items/:id      # 單一裝備詳情
PATCH  /api/gear/items/:id      # 更新裝備（含標記 for_sale）
DELETE /api/gear/items/:id      # 刪除裝備
```

**實作要求**：
- 用 FastAPI dependency 驗證 `user_id`（從 JWT token）
- 所有查詢必須加 `WHERE user_id = current_user` 防止越權
- DELETE 是軟刪除（更新 status = 'deleted'），保留審計記錄

**驗收標準**：
- [ ] 10個 API 測試覆蓋正常流程
- [ ] 5個測試驗證越權保護（不能查看/修改別人的裝備）
- [ ] 用 schemathesis 跑 property-based testing

**時間估計**: 1天

---

### GO-T202 [P][API] 檢查記錄 API

**輸出**: `platform/gear_ops/api/inspections.py`

```python
POST   /api/gear/items/:id/inspections     # 建立檢查記錄
GET    /api/gear/items/:id/inspections     # 該裝備的檢查歷史
GET    /api/gear/inspections/:id           # 單一檢查詳情
```

**實作要求**：
- POST 時自動根據 `overall_status` 決定 `next_inspection_date`
  - good → +90 days
  - needs_attention → +30 days
  - unsafe → 不設置（需要維修後才能再檢查）
- 自動建立 gear_reminder（如果設置了 next_inspection_date）

**驗收標準**：
- [ ] 建立檢查時自動產生提醒
- [ ] 測試 checklist JSONB 可以存任意結構
- [ ] 查詢性能：1000筆記錄 < 100ms

**時間估計**: 1天

---

### GO-T203 [API] 提醒管理 API

**輸出**: `platform/gear_ops/api/reminders.py`

```python
GET    /api/gear/reminders              # 我的所有提醒
POST   /api/gear/reminders              # 手動建立提醒
PATCH  /api/gear/reminders/:id/cancel   # 取消提醒
```

**為什麼需要這個 API**：
- 用戶可能想手動設置提醒（如「下次去雪場前一天提醒我」）
- 提供取消功能讓用戶有掌控感

**驗收標準**：
- [ ] 取消提醒不會刪除記錄，只更新 status
- [ ] 提醒列表按 scheduled_at 排序

**時間估計**: 0.5天

---

## Phase 3: 提醒系統 (Keep It Simple, Stupid)

**目標**: 用最簡單的方式實現定時提醒，不要用消息隊列、不要用複雜的調度框架。

### GO-T301 [P][提醒] 實作提醒發送器

**輸出**: `platform/gear_ops/jobs/send_reminders.py`

```python
# 一個簡單的 Python 腳本，用 cron 每小時跑一次

def send_pending_reminders():
    """
    1. SELECT * FROM gear_reminders
       WHERE status='pending' AND scheduled_at <= NOW()
    2. 對每個提醒：
       - 調用通知 API（HTTP POST）
       - 更新 sent_at, status='sent'
    3. 記錄失敗的提醒（但不要重試超過3次）
    """
    pass
```

**為什麼不用 Celery/APS**：
- 3k 用戶，10k 裝備 → 每小時頂多幾十個提醒
- cron job 夠用了，不要為了「可擴展性」增加複雜度
- 如果將來真的需要，再遷移也不晚

**驗收標準**：
- [ ] 模擬1000個待發送提醒，執行時間 < 5秒
- [ ] 通知 API 失敗時不會崩潰
- [ ] 有日誌記錄發送成功/失敗

**時間估計**: 0.5天

---

### GO-T302 [提醒] 通知系統集成

**輸出**: `platform/gear_ops/integrations/notification.py`

```python
def send_notification(user_id: str, message: str, notification_type: str):
    """
    調用現有的通知系統 API
    如果沒有，先寫個 stub 印到 console
    """
    pass
```

**實用主義**：
- 如果 user-core 已經有通知系統，直接用
- 如果沒有，先印 log，不要阻塞開發
- 不要過早設計複雜的 NotificationPreference 集成

**驗收標準**：
- [ ] 有 mock 測試驗證調用邏輯
- [ ] 有 retry 機制（失敗後等待 2^n 秒重試）

**時間估計**: 0.5天

---

## Phase 4: 買賣功能 (最簡可行方案)

**目標**: 讓用戶可以標記裝備出售、搜尋二手裝備，不做支付、不做複雜交易流程。

### GO-T401 [買賣] 實作買賣 API

**輸出**: 擴展 `platform/gear_ops/api/items.py`

```python
# 新增接口
GET    /api/gear/marketplace    # 搜尋待售裝備（不需登入）
POST   /api/gear/items/:id/contact-seller  # 聯繫賣家（發站內信）
```

**為什麼這樣設計**：
- 不需要獨立的 GearListing 表，用 `status='for_sale'` 過濾即可
- 不做站內交易，讓買賣雙方自己談（微信、站內信）
- 沒有交易狀態機、沒有糾紛處理 → 這些是10萬用戶的問題

**實作要求**：
- marketplace 接口支援過濾：category, price_min, price_max, currency
- 預設只顯示 `status='for_sale' AND user_id != current_user`
- contact-seller 調用站內信系統（或先用 email）

**驗收標準**：
- [ ] 搜尋性能：1000件裝備 < 200ms
- [ ] 不會洩漏賣家的敏感資訊（email, phone）

**時間估計**: 1天

---

## Phase 5: 測試與部署

**目標**: 確保質量，但不要過度測試。

### GO-T501 [測試] 整合測試

**輸出**: `tests/integration/gear_ops/test_flows.py`

**測試場景**（3個就夠）：
1. **完整裝備生命週期**：建立裝備 → 檢查 → 收到提醒 → 標記出售 → 完成交易
2. **安全情境**：檢查發現 unsafe → 不產生提醒 → 維修後重新檢查
3. **多用戶隔離**：用戶A不能看到用戶B的裝備

**驗收標準**：
- [ ] 3個測試都通過
- [ ] 每個測試 < 5秒

**時間估計**: 1天

---

### GO-T502 [P][部署] 建立開發環境設定

**輸出**:
- `scripts/dev/setup_gear.sh` - 一鍵啟動開發環境
- `Makefile` - 常用命令快捷方式
- `.env.gear.example` - 環境變數範例

```bash
# Makefile 範例
.PHONY: test
test:
	pytest tests/unit/gear_ops tests/integration/gear_ops

.PHONY: migrate
migrate:
	alembic upgrade head

.PHONY: send-reminders
send-reminders:
	python platform/gear_ops/jobs/send_reminders.py
```

**驗收標準**：
- [ ] 新開發者可以在10分鐘內跑起來
- [ ] 所有依賴在 requirements.txt 中

**時間估計**: 0.5天

---

### GO-T503 [部署] 撰寫遷移計劃

**輸出**: `docs/gear-ops/migration-plan.md`

**內容要求**：
1. **現狀分析**：現有系統有什麼數據？在哪裡？
2. **遷移策略**：
   - Phase 1: 新系統上線，雙寫模式（新數據同時寫兩邊）
   - Phase 2: 歷史數據遷移（寫腳本驗證數據一致性）
   - Phase 3: 切流量到新系統
   - Phase 4: 關閉舊系統
3. **回滾方案**：每個 phase 都要有回滾步驟
4. **驗證清單**：如何確保沒有數據丟失

**為什麼重要**：
- 這是 "Never Break Userspace" 的體現
- 遷移失敗可以回滾是最基本的要求

**驗收標準**：
- [ ] 方案經過技術評審
- [ ] 有明確的回滾觸發條件（如錯誤率 > 1%）

**時間估計**: 0.5天

---

## Phase 6: 可選優化（只在真正需要時做）

這些任務**不應該**在 MVP 階段做：

- ~~GO-T601 OpenTelemetry 指標~~ → 等有性能問題再說
- ~~GO-T602 性能測試~~ → 5k 裝備/天不需要
- ~~GO-T603 Kafka/SNS 升級~~ → webhook 夠用了
- ~~GO-T604 支付系統集成~~ → 先驗證有人願意站內交易
- ~~GO-T605 保養建議演算法~~ → 需要大量數據才能做好
- ~~GO-T606 跨國貨幣/稅金~~ → 等有國際用戶再說

**何時做這些優化**：
- 用戶數 > 10k 且有明確的性能瓶頸
- 交易量 > 1000/天 且用戶要求站內支付
- 有超過100個國際用戶且主動要求多貨幣

---

## 任務總結

| Phase | 任務數 | P0任務 | 預估時間 |
|-------|--------|--------|----------|
| Phase 1: 數據層 | 2 | 2 | 1.5天 |
| Phase 2: 基礎API | 3 | 2 | 2.5天 |
| Phase 3: 提醒系統 | 2 | 1 | 1天 |
| Phase 4: 買賣功能 | 1 | 0 | 1天 |
| Phase 5: 測試與部署 | 3 | 1 | 2天 |
| **總計** | **11** | **6** | **8天** |

對比原方案：
- 任務數：38 → 11（減少71%）
- 資料表：7 → 3（減少57%）
- 預估時間：未知 → 8天（可執行）

---

## Constitution Check (Linus 原則驗證)

### ✅ I. Data-First Pragmatism
- 從3個核心表開始，結構清晰
- JSONB 提供靈活性但不失約束

### ✅ II. Zero Special-Case Thinking
- 不區分「自用」vs「教學」裝備，統一用 role 欄位處理
- 不為「危險」裝備建立特殊表，用 status 欄位即可

### ✅ III. Never Break Userspace
- GO-T503 明確規劃雙寫、驗證、回滾
- 新系統不影響現有功能

### ✅ IV. Ship Reality-Backed Value
- 只解決明確存在的問題（檢查、提醒、買賣）
- 去掉所有臆想需求（跨國貨幣、性能監控）

### ✅ V. Ruthless Simplicity
- 11個任務 vs 38個任務
- cron job vs Celery
- 3個表 vs 7個表

---

## 開發檢查清單

在開始寫代碼前，確認：

- [ ] 是否真的需要這個功能？（用戶有明確需求？）
- [ ] 是否可以用現有的表/接口實現？
- [ ] 是否為將來可能不存在的問題過度設計？
- [ ] 是否會破壞現有用戶的工作流程？
- [ ] 能否在1週內完成並上線給真實用戶測試？

如果有任何一個答案是「不確定」，先問清楚再動手。

---

**"Talk is cheap. Show me the code."** - Linus Torvalds

先把這11個任務完成，上線給用戶用。根據真實反饋再迭代，而不是在會議室裡臆想需求。
