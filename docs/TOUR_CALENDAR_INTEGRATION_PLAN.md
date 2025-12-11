# Tour (Trip Planner) Calendar 整合計劃

> 建立日期：2025-12-11
> 狀態：待執行
> 目標：將 Tour 系統整合到 user-core 的共享 Calendar 基礎設施

## 📋 現況分析

### ✅ 已完成
- **Tour 系統**：完整的 Trip/Day/Item CRUD 功能
- **Mock Calendar Service**：已有 CalendarService 框架但未實際整合
- **共享 Calendar 基礎設施**：user-core 已完成 Calendar 系統

### ❌ 待整合
- **真實 Calendar API 調用**：目前只是 mock 實現
- **EventType.TRIP 支援**：需要在 user-core 中確認支援
- **Trip 生命週期整合**：建立/更新/刪除時的 Calendar 事件同步

## 🎯 整合目標

### 1. Trip 建立 → Calendar 事件
- Trip 建立時自動建立 `EventType.TRIP` 事件
- 事件時間：`start_date` 到 `end_date`
- 來源：`source_app="tour"`

### 2. Trip 更新 → Calendar 事件更新
- Trip 資訊變更時同步更新 Calendar 事件
- 支援日期、標題、描述變更

### 3. Trip 刪除 → Calendar 事件刪除
- Trip 刪除時清理對應的 Calendar 事件

## 📝 TDD 實施計劃

### Phase 1: 確認 user-core Calendar 支援 (Red → Green → Refactor)

#### Task 1.1: 檢查 EventType.TRIP 支援
**Red**: 測試 `EventType.TRIP` 是否存在
```typescript
// 檢查 user-core 是否支援 TRIP 事件類型
```

**Green**: 如果不存在，在 user-core 中新增
```python
# platform/user_core/domain/calendar/enums.py
class EventType(str, Enum):
    TRIP = "TRIP"
    REMINDER = "REMINDER" 
    MATCHING = "MATCHING"
    GEAR = "GEAR"
    # ...
```

#### Task 1.2: 測試 Calendar API 可用性
**Red**: 測試從 tour 調用 user-core Calendar API
```typescript
// 測試 POST /calendar/events API 調用
```

### Phase 2: 實現真實 Calendar 整合 (Red → Green → Refactor)

#### Task 2.1: 替換 Mock CalendarService
**Red**: 測試真實 API 調用失敗
```typescript
// tour/lib/services/calendar.ts
// 測試調用 user-core Calendar API
```

**Green**: 實現真實 API 調用
```typescript
export async function createCalendarEvent(
  eventData: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>
): Promise<CalendarEvent> {
  const response = await fetch(`${USER_CORE_API_URL}/calendar/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      user_id: eventData.user_id,
      event_type: 'TRIP',
      title: eventData.title,
      start_date: eventData.start_date,
      end_date: eventData.end_date,
      source_app: 'tour',
      source_id: eventData.source_id,
      description: eventData.description,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Calendar API error: ${response.statusText}`);
  }
  
  return response.json();
}
```

#### Task 2.2: 整合 Trip 建立流程
**Red**: 測試 Trip 建立時 Calendar 事件未建立
```typescript
// 測試建立 Trip 時自動建立 Calendar 事件
```

**Green**: 修改 Trip API 整合 Calendar
```typescript
// tour/app/api/trips/route.ts
export async function POST(request: NextRequest) {
  // ... 建立 Trip 邏輯
  
  // 建立 Calendar 事件
  try {
    await CalendarService.onTripCreated(trip);
  } catch (error) {
    console.error('Failed to create calendar event:', error);
    // 不影響 Trip 建立，只記錄錯誤
  }
  
  return NextResponse.json(trip);
}
```

#### Task 2.3: 整合 Trip 更新流程
**Red**: 測試 Trip 更新時 Calendar 事件未同步
```typescript
// 測試更新 Trip 時同步更新 Calendar 事件
```

**Green**: 修改 Trip 更新 API
```typescript
// tour/app/api/trips/[id]/route.ts
export async function PUT(request: NextRequest) {
  // ... 更新 Trip 邏輯
  
  // 更新 Calendar 事件
  try {
    await CalendarService.onTripUpdated(updatedTrip);
  } catch (error) {
    console.error('Failed to update calendar event:', error);
  }
  
  return NextResponse.json(updatedTrip);
}
```

#### Task 2.4: 整合 Trip 刪除流程
**Red**: 測試 Trip 刪除時 Calendar 事件未清理
```typescript
// 測試刪除 Trip 時清理 Calendar 事件
```

**Green**: 修改 Trip 刪除 API
```typescript
// tour/app/api/trips/[id]/route.ts
export async function DELETE(request: NextRequest) {
  // ... 刪除 Trip 邏輯
  
  // 刪除 Calendar 事件
  try {
    await CalendarService.onTripDeleted(tripId);
  } catch (error) {
    console.error('Failed to delete calendar events:', error);
  }
  
  return NextResponse.json({ success: true });
}
```

### Phase 3: 環境變數和配置 (Red → Green → Refactor)

#### Task 3.1: 新增環境變數
```env
# tour/.env
USER_CORE_API_URL=http://localhost:8001
USER_CORE_AUTH_TOKEN=your_service_token
```

#### Task 3.2: 新增配置管理
```typescript
// tour/lib/config.ts
export const config = {
  userCoreApiUrl: process.env.USER_CORE_API_URL || 'http://localhost:8001',
  userCoreAuthToken: process.env.USER_CORE_AUTH_TOKEN,
};
```

### Phase 4: 錯誤處理和重試機制 (Red → Green → Refactor)

#### Task 4.1: 實現錯誤處理
```typescript
// tour/lib/services/calendar.ts
export async function createCalendarEventWithRetry(
  eventData: CalendarEventData,
  maxRetries: number = 3
): Promise<CalendarEvent | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await createCalendarEvent(eventData);
    } catch (error) {
      console.error(`Calendar API attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) {
        // 最後一次失敗，記錄但不拋出錯誤
        console.error('All calendar API attempts failed, continuing without calendar integration');
        return null;
      }
      // 等待後重試
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return null;
}
```

## 🔧 實施步驟

### Step 1: 檢查 user-core Calendar API
1. 確認 `EventType.TRIP` 支援
2. 測試 Calendar API 端點
3. 確認認證機制

### Step 2: 替換 Mock 實現
1. 實現真實的 Calendar API 調用
2. 新增錯誤處理和重試機制
3. 更新環境變數配置

### Step 3: 整合 Trip 生命週期
1. 修改 Trip 建立 API
2. 修改 Trip 更新 API  
3. 修改 Trip 刪除 API

### Step 4: 測試和驗證
1. 單元測試：Calendar API 調用
2. 整合測試：Trip 與 Calendar 同步
3. 端到端測試：完整使用者流程

## 📊 預期成果

### 功能整合
- ✅ Trip 建立自動建立 Calendar 事件
- ✅ Trip 更新同步更新 Calendar 事件
- ✅ Trip 刪除清理 Calendar 事件
- ✅ 統一的行事曆檢視所有 Trip

### 使用者體驗
- 📅 在共享行事曆中查看所有 Trip
- 🔔 一致的提醒通知體驗
- 📱 跨應用的事件同步
- 🎯 減少重複的時間管理

### 技術優勢
- 🏗️ 使用共享 Calendar 基礎設施
- 🧪 TDD 方法確保品質
- 🔄 一致的事件處理流程
- 📈 易於維護和擴展

## 🚀 後續擴展

### 短期
- Day/Item 級別的 Calendar 事件
- 行程提醒自動排程
- 外部行事曆同步 (Google Calendar)

### 中期
- 團體行程 Calendar 分享
- 行程衝突檢測
- 智能行程建議

### 長期
- AI 行程優化建議
- 動態行程調整
- 社群行程分享平台

---

**🎯 核心目標：透過 TDD 方法將 Tour 系統安全整合到共享 Calendar 基礎設施，提供統一的行程管理體驗。**
