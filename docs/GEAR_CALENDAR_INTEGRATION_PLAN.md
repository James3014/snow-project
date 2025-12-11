# 裝備管理與 Calendar 整合計劃

> 建立日期：2025-12-11
> 狀態：待執行
> 目標：將裝備管理系統整合到共享 Calendar 基礎設施

## 📋 現況分析

### ✅ 已完成
- **裝備管理系統**：完整實現（`GearItem`, `GearInspection`, `GearReminder`）
- **共享 Calendar 基礎設施**：完整實現（`CalendarEvent`, `CalendarService`）
- **Trip Planning 整合**：已完成 Calendar 整合

### ❌ 待整合
- **裝備檢查提醒**：未使用 Calendar 系統
- **裝備維護排程**：未建立 Calendar 事件
- **二手交易約定**：未整合 Calendar

## 🎯 整合目標

### 1. 裝備檢查提醒 → Calendar 事件
- `GearReminder` 建立時自動建立 `CalendarEvent`
- 事件類型：`EventType.GEAR` (需新增)
- 來源：`source_app="gear_ops"`

### 2. 裝備維護排程 → Calendar 事件
- 根據檢查結果自動排程維護
- 整合到使用者個人行事曆
- 支援重複提醒

### 3. 二手交易約定 → Calendar 事件
- 買賣雙方約定時間
- 交易地點和時間管理
- 交易提醒通知

## 📝 TDD 實施計劃

### Phase 1: 擴展 Calendar 系統 (Red → Green → Refactor)

#### Task 1.1: 新增 GEAR 事件類型
**Red**: 測試 `EventType.GEAR` 不存在
```python
def test_gear_event_type_exists():
    assert EventType.GEAR == "GEAR"
```

**Green**: 實現最簡代碼
```python
# domain/calendar/enums.py
class EventType(str, Enum):
    TRIP = "TRIP"
    REMINDER = "REMINDER"
    MATCHING = "MATCHING"
    GEAR = "GEAR"  # 新增
    # ...
```

#### Task 1.2: 測試 Calendar 服務支援裝備事件
**Red**: 測試建立裝備相關事件
```python
def test_create_gear_inspection_event():
    event = calendar_service.create_event(
        user_id=user_id,
        event_type=EventType.GEAR,
        title="裝備檢查提醒",
        start_date=datetime.now(),
        end_date=datetime.now() + timedelta(hours=1),
        source_app="gear_ops",
        source_id="gear_123",
        description="單板檢查"
    )
    assert event.type == EventType.GEAR
```

### Phase 2: 整合 Gear Service (Red → Green → Refactor)

#### Task 2.1: 修改 GearReminder 建立流程
**Red**: 測試建立提醒時自動建立 Calendar 事件
```python
def test_create_gear_reminder_creates_calendar_event():
    # 建立裝備提醒
    reminder = gear_service.create_reminder(
        gear_item_id=gear_id,
        reminder_type="inspection",
        scheduled_at=datetime.now() + timedelta(days=7)
    )
    
    # 驗證 Calendar 事件被建立
    events = calendar_service.list_events_for_source(
        source_app="gear_ops",
        source_id=str(reminder.id)
    )
    assert len(events) == 1
    assert events[0].type == EventType.GEAR
```

**Green**: 實現整合代碼
```python
# services/gear_service.py
def create_reminder(self, gear_item_id, reminder_type, scheduled_at):
    # 建立 GearReminder
    reminder = GearReminder(...)
    self.repo.add(reminder)
    
    # 建立 Calendar 事件
    self.calendar_service.create_event(
        user_id=gear_item.user_id,
        event_type=EventType.GEAR,
        title=f"裝備{reminder_type}提醒",
        start_date=scheduled_at,
        end_date=scheduled_at + timedelta(hours=1),
        source_app="gear_ops",
        source_id=str(reminder.id)
    )
    
    return reminder
```

#### Task 2.2: 整合裝備檢查流程
**Red**: 測試檢查完成後更新 Calendar 事件
```python
def test_complete_inspection_updates_calendar():
    # 完成檢查
    inspection = gear_service.complete_inspection(
        gear_id=gear_id,
        checklist={"edge": "good"},
        overall_status="good"
    )
    
    # 驗證下次檢查事件被建立
    events = calendar_service.list_events_for_source(
        source_app="gear_ops",
        source_id=f"inspection_{inspection.id}"
    )
    assert len(events) == 1
```

#### Task 2.3: 整合二手交易約定
**Red**: 測試交易約定建立 Calendar 事件
```python
def test_schedule_trade_meeting_creates_event():
    # 安排交易會面
    meeting = gear_service.schedule_trade_meeting(
        gear_id=gear_id,
        buyer_id=buyer_id,
        meeting_time=datetime.now() + timedelta(days=3),
        location="台北車站"
    )
    
    # 驗證雙方都有 Calendar 事件
    seller_events = calendar_service.list_events(user_id=seller_id)
    buyer_events = calendar_service.list_events(user_id=buyer_id)
    
    assert any(e.title.contains("交易會面") for e in seller_events)
    assert any(e.title.contains("交易會面") for e in buyer_events)
```

### Phase 3: 建立整合測試 (Red → Green → Refactor)

#### Task 3.1: 端到端整合測試
```python
def test_gear_calendar_integration_e2e():
    # 建立裝備
    gear = gear_service.create_gear_item(...)
    
    # 建立檢查提醒
    reminder = gear_service.create_reminder(...)
    
    # 驗證 Calendar 事件存在
    events = calendar_service.list_events(user_id=user_id)
    gear_events = [e for e in events if e.source_app == "gear_ops"]
    
    assert len(gear_events) == 1
    assert gear_events[0].type == EventType.GEAR
```

## 🔧 實施步驟

### Step 1: 擴展 Calendar 系統
1. 新增 `EventType.GEAR`
2. 測試 Calendar 服務支援裝備事件
3. 更新相關 schema 和文檔

### Step 2: 修改 Gear Service
1. 注入 `CalendarService` 依賴
2. 修改 `create_reminder` 方法
3. 修改 `complete_inspection` 方法
4. 新增 `schedule_trade_meeting` 方法

### Step 3: 建立整合測試
1. 單元測試：各個方法的 Calendar 整合
2. 整合測試：Gear Service 與 Calendar Service 協作
3. 端到端測試：完整的使用者流程

### Step 4: 更新 API 端點
1. 修改 Gear API 返回 Calendar 事件資訊
2. 新增交易約定相關端點
3. 更新 API 文檔

## 📊 預期成果

### 功能整合
- ✅ 裝備檢查提醒自動建立 Calendar 事件
- ✅ 裝備維護排程整合到個人行事曆
- ✅ 二手交易約定時間管理
- ✅ 統一的事件查詢和管理

### 使用者體驗
- 📅 統一的行事曆檢視所有事件
- 🔔 一致的提醒通知體驗
- 📱 跨應用的事件同步
- 🎯 減少重複的時間管理

### 技術優勢
- 🏗️ 共享基礎設施減少重複代碼
- 🧪 完整的測試覆蓋保證品質
- 🔄 一致的事件處理流程
- 📈 易於擴展和維護

## 🚀 後續擴展

### 短期
- 裝備保養週期自動排程
- 裝備使用頻率統計
- 安全檢查強制提醒

### 中期
- 外部行事曆同步（Google Calendar）
- 團體裝備管理
- 裝備租借排程

### 長期
- AI 智能維護建議
- 裝備生命週期管理
- 社群裝備分享平台

---

**🎯 核心目標：透過 TDD 方法安全地將裝備管理整合到共享 Calendar 基礎設施，提供統一的時間管理體驗。**
