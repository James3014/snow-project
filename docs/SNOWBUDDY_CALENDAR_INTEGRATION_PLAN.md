# Snowbuddy Matching Calendar 整合計劃 (修正版)

> 建立日期：2025-12-11
> 狀態：待執行
> 目標：基於 Trip 發佈模式的 Snowbuddy Calendar 整合

## 📋 現況分析 (重新理解)

### ✅ 已完成
- **Snowbuddy 系統運作模式**：
  1. 使用者發佈 Trip (透過 Trip Planner)
  2. 其他人在雪伴公佈欄看到 Trip
  3. 申請加入 Trip → 媒合成功
- **前端整合**：TripBoardCard, SnowbuddyBoard 完成
- **BehaviorEvent 整合**：申請/接受已回寫到 user-core
- **共享 Calendar 基礎設施**：user-core 已完成

### 🔍 系統聯動關係
```
Trip Planner → 發佈 Trip → Calendar 事件 (已有，但 Tour 未真實整合)
     ↓
Snowbuddy Board → 顯示公開 Trip
     ↓  
申請加入 Trip → 媒合成功 → 需要 Calendar 整合
     ↓
參與 Trip → 雪場紀錄 (Resort Services)
```

### ❌ 待整合
- **Trip 發佈者的 Calendar 事件**：Trip Planner 的 Calendar 整合 (Mock 狀態)
- **參與者的 Calendar 事件**：加入 Trip 成功後沒有 Calendar 事件
- **Trip 參與者管理**：缺少參與者的 Calendar 同步

## 🎯 修正後的整合目標

### 1. Trip 參與者 Calendar 同步
- 當使用者成功加入 Trip 後，自動建立 Calendar 事件
- 事件與原 Trip 的 Calendar 事件相同 (時間、地點)
- 來源：`source_app="snowbuddy-matching"`

### 2. Trip 參與者管理
- 支援查看 Trip 的所有參與者
- 參與者退出時清理 Calendar 事件
- Trip 取消時通知所有參與者

### 3. 與 Trip Planner 的聯動
- 依賴 Trip Planner 的 Calendar 整合完成
- Snowbuddy 參與者事件參考原 Trip 事件

## 📝 TDD 實施計劃

### Phase 1: 確認依賴和前置條件 (Red → Green → Refactor)

#### Task 1.1: 確認 Trip Planner Calendar 整合
**前置條件**: Trip Planner 必須先完成真實 Calendar 整合
```python
# 依賴：Tour Calendar 整合完成
# 確保 Trip 建立時已有 Calendar 事件
```

#### Task 1.2: 確認 EventType.MATCHING 支援
**Red**: 測試 `EventType.MATCHING` 是否存在
```python
def test_matching_event_type_exists():
    assert EventType.MATCHING == "MATCHING"
```

### Phase 2: 擴展 Trip 參與者模型 (Red → Green → Refactor)

#### Task 2.1: 新增 Trip 參與者追蹤
**Red**: 測試 Trip 參與者資料不存在
```python
def test_trip_participant_tracking():
    participant = TripParticipant(
        trip_id="trip_123",
        user_id="user_456", 
        joined_at=datetime.now(),
        status="confirmed"
    )
    assert participant.trip_id == "trip_123"
```

**Green**: 實現參與者追蹤模型
```python
# snowbuddy_matching/app/models/trip_participant.py
class TripParticipant(BaseModel):
    trip_id: str
    user_id: str
    joined_at: datetime
    status: Literal["pending", "confirmed", "cancelled"]
    calendar_event_id: Optional[str] = None  # 關聯的 Calendar 事件 ID
```

### Phase 3: 實現參與者 Calendar 整合 (Red → Green → Refactor)

#### Task 3.1: 實現加入 Trip 的 Calendar 事件建立
**Red**: 測試加入 Trip 時 Calendar 事件未建立
```python
def test_join_trip_creates_calendar_event():
    # 使用者成功加入 Trip
    result = client.post(f"/trips/{trip_id}/join", json={
        "user_id": "user_456"
    })
    
    # 驗證 Calendar 事件被建立
    # (需要先獲取原 Trip 的 Calendar 事件資訊)
```

**Green**: 實現參與者 Calendar 事件建立
```python
# snowbuddy_matching/app/services/trip_participant_service.py
async def join_trip_with_calendar(
    trip_id: str,
    user_id: str
) -> TripParticipant:
    """使用者加入 Trip 並建立 Calendar 事件"""
    
    # 1. 獲取原 Trip 資訊 (從 Trip Planner)
    trip_info = await get_trip_info(trip_id)
    
    # 2. 獲取原 Trip 的 Calendar 事件
    original_event = await get_trip_calendar_event(trip_id)
    
    # 3. 為參與者建立相同的 Calendar 事件
    participant_event = await create_calendar_event_for_user(
        user_id=user_id,
        event_data={
            "event_type": "MATCHING",
            "title": f"參與行程 - {trip_info.title}",
            "start_date": original_event.start_date,
            "end_date": original_event.end_date,
            "source_app": "snowbuddy-matching",
            "source_id": f"participant_{trip_id}_{user_id}",
            "description": f"加入 {trip_info.title} 行程\n雪場: {trip_info.resort_name}",
            "related_trip_id": trip_id
        }
    )
    
    # 4. 記錄參與者資訊
    participant = TripParticipant(
        trip_id=trip_id,
        user_id=user_id,
        joined_at=datetime.now(),
        status="confirmed",
        calendar_event_id=participant_event.id
    )
    
    return participant

async def get_trip_info(trip_id: str) -> dict:
    """從 Trip Planner 獲取 Trip 資訊"""
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{settings.trip_planner_api_url}/api/trips/{trip_id}")
        response.raise_for_status()
        return response.json()

async def get_trip_calendar_event(trip_id: str) -> dict:
    """從 user-core 獲取 Trip 的 Calendar 事件"""
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.user_core_api_url}/calendar/events",
            params={"source_app": "tour", "source_id": trip_id}
        )
        response.raise_for_status()
        events = response.json()
        return events[0] if events else None
```

#### Task 3.2: 實現退出 Trip 的 Calendar 事件清理
**Red**: 測試退出 Trip 時 Calendar 事件未清理
```python
def test_leave_trip_removes_calendar_event():
    # 使用者退出 Trip
    result = client.delete(f"/trips/{trip_id}/participants/{user_id}")
    
    # 驗證 Calendar 事件被刪除
```

**Green**: 實現退出 Trip 邏輯
```python
async def leave_trip_with_calendar(
    trip_id: str,
    user_id: str
) -> bool:
    """使用者退出 Trip 並清理 Calendar 事件"""
    
    # 1. 獲取參與者資訊
    participant = await get_trip_participant(trip_id, user_id)
    
    # 2. 刪除 Calendar 事件
    if participant.calendar_event_id:
        await delete_calendar_event(participant.calendar_event_id)
    
    # 3. 移除參與者記錄
    await remove_trip_participant(trip_id, user_id)
    
    return True
```

### Phase 4: 整合現有 Snowbuddy 流程 (Red → Green → Refactor)

#### Task 4.1: 修改申請接受流程
**Red**: 測試接受申請時沒有建立 Calendar 事件
```python
def test_accept_buddy_request_creates_calendar_event():
    # 接受雪伴申請
    response = client.put(f"/requests/{request_id}", json={
        "action": "accept"
    })
    
    # 驗證申請者的 Calendar 事件被建立
```

**Green**: 修改申請接受邏輯
```python
# snowbuddy_matching/app/routers/requests_router.py
@router.put("/requests/{request_id}")
async def respond_to_request(
    request_id: str,
    response_data: RequestResponse,
    current_user: dict = Depends(get_current_user)
):
    # ... 現有邏輯
    
    if response_data.action == "accept":
        # 獲取申請相關的 Trip 資訊
        request_info = await get_buddy_request_info(request_id)
        
        if request_info.trip_id:
            # 為申請者建立 Calendar 事件
            await join_trip_with_calendar(
                trip_id=request_info.trip_id,
                user_id=request_info.requester_id
            )
```

## 🔧 實施步驟

### Step 1: 確認前置條件
1. **等待 Trip Planner Calendar 整合完成**
2. 確認 `EventType.MATCHING` 支援
3. 測試跨服務 API 調用

### Step 2: 建立參與者追蹤系統
1. 新增 `TripParticipant` 模型
2. 實現參與者 CRUD 操作
3. 建立參與者與 Calendar 事件的關聯

### Step 3: 實現 Calendar 整合服務
1. 實現 `join_trip_with_calendar` 服務
2. 實現 `leave_trip_with_calendar` 服務
3. 新增跨服務 API 調用 (Trip Planner, user-core)

### Step 4: 整合現有申請流程
1. 修改申請接受邏輯
2. 修改申請拒絕邏輯
3. 新增 Trip 取消通知

### Step 5: 測試和驗證
1. 單元測試：參與者 Calendar 整合
2. 整合測試：完整的 Trip 參與流程
3. 端到端測試：Trip 發佈 → 申請 → 參與 → Calendar 同步

## 📊 預期成果

### 功能整合
- ✅ Trip 發佈者有 Calendar 事件 (依賴 Trip Planner 整合)
- ✅ Trip 參與者自動獲得相同的 Calendar 事件
- ✅ 參與者退出時自動清理 Calendar 事件
- ✅ 統一的行事曆檢視所有 Trip (發佈 + 參與)

### 使用者體驗
- 📅 發佈和參與的 Trip 都在同一個行事曆
- 🔔 參與 Trip 後自動獲得提醒
- 📍 清楚的 Trip 時間和地點資訊
- 🎯 減少手動管理行程的負擔

### 系統聯動
- 🔄 Trip Planner → Snowbuddy → Calendar 完整聯動
- 📊 Trip 參與者統計和管理
- 🏗️ 使用共享 Calendar 基礎設施

## 🚀 後續擴展

### 短期
- Trip 參與者變更通知
- Trip 時間變更同步所有參與者
- 參與者 Calendar 事件自訂化

### 中期
- 群組 Trip 管理
- Trip 參與者聊天功能
- Trip 完成後的雪場紀錄自動化

### 長期
- AI Trip 推薦基於 Calendar 可用時間
- 動態 Trip 調整和重新安排
- 社群 Trip 分享和評價

---

## 🔗 依賴關係

### 必要前置條件
1. **Trip Planner Calendar 整合完成** (TODO-TOUR-001 到 TODO-TOUR-009)
2. user-core EventType.MATCHING 支援
3. 跨服務 API 認證機制

### 環境變數
```env
TRIP_PLANNER_API_URL=http://localhost:3000
USER_CORE_API_URL=http://localhost:8001
SERVICE_AUTH_TOKEN=your_service_token
```

---

**🎯 核心目標：基於 Trip 發佈模式，實現完整的 Trip 參與者 Calendar 同步，讓所有參與同一個 Trip 的使用者都能在行事曆中看到相同的事件。**
