# Tour Calendar 整合 TODO

> 建立日期：2025-12-11
> 狀態：**已完成** ✅
> 方法：TDD (Test-Driven Development)

## 🎯 整合範圍

### 現有系統
- ✅ **Tour 系統** (完整的 Trip/Day/Item CRUD)
- ✅ **Mock Calendar Service** (框架已存在但未實際整合)
- ✅ **共享 Calendar 基礎設施** (user-core 已完成)

### 待整合系統
- ❌ **Tour Calendar 整合** (需要真實 API 整合) ← **本次目標**

---

## 📋 待完成任務

### Phase 1: 確認 Calendar API 支援
- ✅ **TODO-TOUR-001**: 檢查 user-core EventType.TRIP 支援
  - 確認 `EventType.TRIP` 是否已存在
  - 如果不存在，需要在 user-core 中新增

- ✅ **TODO-TOUR-002**: 測試 Calendar API 可用性
  - 測試 `POST /calendar/events` API
  - 確認認證機制和請求格式

### Phase 2: 替換 Mock 實現
- ✅ **TODO-TOUR-003**: 實現真實 Calendar API 調用
  - 替換 `tour/lib/services/calendar.ts` 中的 mock 實現
  - 實現 `createCalendarEvent()` 真實 API 調用
  - 實現 `updateCalendarEvent()` 和 `deleteCalendarEvent()`

- ✅ **TODO-TOUR-004**: 新增環境變數配置
  - 新增 `USER_CORE_API_URL` 環境變數
  - 新增 `USER_CORE_AUTH_TOKEN` 配置
  - 建立 config 管理模組

### Phase 3: 整合 Trip 生命週期
- ✅ **TODO-TOUR-005**: 整合 Trip 建立流程
  - 修改 `tour/app/api/trips/route.ts` POST 方法
  - Trip 建立成功後自動建立 Calendar 事件
  - 新增錯誤處理，不影響 Trip 建立

- ✅ **TODO-TOUR-006**: 整合 Trip 更新流程
  - 修改 `tour/app/api/trips/[id]/route.ts` PUT 方法
  - Trip 更新時同步更新 Calendar 事件
  - 處理日期、標題、描述變更

- ✅ **TODO-TOUR-007**: 整合 Trip 刪除流程
  - 修改 `tour/app/api/trips/[id]/route.ts` DELETE 方法
  - Trip 刪除時清理對應的 Calendar 事件

### Phase 4: 錯誤處理和測試
- ✅ **TODO-TOUR-008**: 實現錯誤處理機制
  - Calendar API 調用失敗不影響 Trip 操作
  - 實現重試機制 (最多 3 次)
  - 新增詳細的錯誤日誌

- ✅ **TODO-TOUR-009**: 建立測試覆蓋
  - 單元測試：Calendar API 調用
  - 整合測試：Trip 與 Calendar 同步
  - 端到端測試：完整使用者流程

---

## 🧪 測試策略

### 單元測試
- Calendar API 調用函數測試
- 錯誤處理和重試機制測試
- 環境變數配置測試

### 整合測試
- Trip 建立 → Calendar 事件建立
- Trip 更新 → Calendar 事件更新
- Trip 刪除 → Calendar 事件刪除

### 端到端測試
- 完整的 Trip 生命週期測試
- Calendar 事件在 user-core 中的驗證
- 跨服務資料同步驗證

---

## 🚀 執行順序

### 立即執行 (本週)
1. **TODO-TOUR-001**: 檢查 EventType.TRIP 支援
2. **TODO-TOUR-002**: 測試 Calendar API 可用性
3. **TODO-TOUR-003**: 實現真實 Calendar API 調用

### 短期執行 (下週)
4. **TODO-TOUR-004**: 新增環境變數配置
5. **TODO-TOUR-005**: 整合 Trip 建立流程
6. **TODO-TOUR-006**: 整合 Trip 更新流程

### 中期執行 (未來 2 週)
7. **TODO-TOUR-007**: 整合 Trip 刪除流程
8. **TODO-TOUR-008**: 實現錯誤處理機制
9. **TODO-TOUR-009**: 建立測試覆蓋

---

## 📊 成功指標

- ✅ 所有 Trip 建立都自動建立對應的 Calendar 事件
- ✅ Trip 更新能同步更新 Calendar 事件
- ✅ Trip 刪除能清理 Calendar 事件
- ✅ Calendar API 調用失敗不影響 Trip 操作
- ✅ 使用者可以在統一的行事曆中查看所有 Trip
- ✅ 測試覆蓋率達到 90%+

---

## 🔧 技術細節

### API 調用格式
```typescript
// 建立 Calendar 事件
POST /calendar/events
{
  "user_id": "user123",
  "event_type": "TRIP", 
  "title": "北海道滑雪之旅",
  "start_date": "2025-01-15T00:00:00Z",
  "end_date": "2025-01-20T23:59:59Z",
  "source_app": "tour",
  "source_id": "trip_456",
  "description": "5天4夜北海道滑雪行程"
}
```

### 環境變數
```env
USER_CORE_API_URL=http://localhost:8001
USER_CORE_AUTH_TOKEN=service_token_here
```

### 錯誤處理
```typescript
try {
  await CalendarService.onTripCreated(trip);
} catch (error) {
  console.error('Calendar integration failed:', error);
  // 繼續執行，不影響 Trip 建立
}
```

---

**🎯 核心目標：將 Tour 系統完全整合到共享 Calendar 基礎設施，實現統一的行程管理體驗！**

*預估工時：8-12 小時*  
*優先級：中等 (功能完整性提升)*
