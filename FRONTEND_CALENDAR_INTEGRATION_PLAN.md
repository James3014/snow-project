# 前端行事曆整合計劃

## 📋 概述
整合前端各應用與後端 Calendar Service，實現統一的行事曆基礎設施使用。

## 🎯 目標
- 前端各應用完整使用後端 Calendar Service
- 統一的行事曆事件顯示和管理
- Tour 專案行事曆整合
- 跨應用行事曆事件同步

## 📊 現狀分析

### ✅ 後端已完成
- User Core Calendar Service (完整)
- EventType: TRIP, GEAR, MATCHING, REMINDER
- Tour CalendarService 整合 (完整)
- Gear Service 行事曆整合 (完整)

### ❌ 前端缺失
- Ski Platform 各應用未使用 calendarApi
- 裝備提醒沒有 UI 顯示
- 雪伴約定沒有行事曆整合
- Tour 專案需要獨立整合

## 🚀 實施計劃

### Phase 1: Ski Platform 行事曆整合

#### 1.1 行程規劃 (Trip Planning)
- [ ] 修改 `useSeasonDetail` 使用 `calendarApi.getSharedCalendar()`
- [ ] `SeasonCalendarView` 顯示來自 User Core 的統一事件
- [ ] 行程建立時調用 Calendar API 創建事件
- [ ] 行程更新/刪除時同步更新行事曆

#### 1.2 裝備管理 (Gear)
- [ ] 新增 `GearReminders` 組件顯示維護提醒
- [ ] 整合 `gearApi.getMyReminders()` 到行事曆視圖
- [ ] 裝備檢查完成後創建下次提醒事件
- [ ] 交易會面安排的行事曆整合

#### 1.3 雪伴功能 (Snowbuddy)
- [ ] 媒合成功後創建約定時間事件
- [ ] 雪伴申請接受後的會面安排
- [ ] `calendar_synced` 狀態管理
- [ ] 約定時間衝突檢查

### Phase 2: Tour 專案整合

#### 2.1 前端行事曆組件
- [ ] 創建 `CalendarView` 組件
- [ ] 整合 Tour CalendarService API
- [ ] 行程建立時自動創建行事曆事件
- [ ] 行程編輯時同步更新事件

#### 2.2 API 整合
- [ ] 修改 Trip CRUD API 調用 CalendarService
- [ ] 實現 `getCalendarEventsForTrip()`
- [ ] 行程刪除時清理行事曆事件

### Phase 3: 統一行事曆視圖

#### 3.1 共享組件
- [ ] 創建 `UnifiedCalendarView` 組件
- [ ] 支援多種事件類型顯示
- [ ] 事件篩選和搜尋功能
- [ ] 響應式設計

#### 3.2 跨應用整合
- [ ] 統一的事件顏色和圖示系統
- [ ] 事件點擊跳轉到對應應用
- [ ] 通知和提醒系統整合

## 📝 詳細 TODO

### Ski Platform TODO

#### Trip Planning
```typescript
// 1. 修改 useSeasonDetail.ts
- 使用 calendarApi.getSharedCalendar() 替代本地資料
- 整合 User Core 行事曆事件

// 2. 修改 TripCreateModal.tsx  
- 行程建立成功後調用 calendarApi.createEvent()
- EventType.TRIP 事件創建

// 3. 修改 TripDetail.tsx
- 行程更新時同步更新行事曆
- 行程刪除時清理行事曆事件
```

#### Gear Management
```typescript
// 1. 創建 GearReminders.tsx 組件
- 顯示 gearApi.getMyReminders() 結果
- 提醒卡片設計 (檢查、維護、交易)
- 取消提醒功能

// 2. 修改 MyGear.tsx
- 新增「提醒」標籤頁
- 整合 GearReminders 組件
- 裝備狀態與提醒關聯顯示

// 3. 創建 GearInspection.tsx 組件  
- 檢查表單和結果記錄
- 完成檢查後自動創建下次提醒
- 調用後端 complete_inspection_with_calendar()
```

#### Snowbuddy Matching
```typescript
// 1. 修改 SmartMatchingPage.tsx
- 媒合成功後顯示約定時間選擇
- 調用 calendarApi.createEvent() 創建約定
- EventType.MATCHING 事件

// 2. 修改 SnowbuddyBoard.tsx  
- 申請接受後的會面安排功能
- 時間衝突檢查
- calendar_synced 狀態顯示

// 3. 創建 MeetingScheduler.tsx 組件
- 約定時間選擇器
- 地點輸入
- 雙方行事曆事件創建
```

### Tour 專案 TODO

#### Frontend Integration
```typescript
// 1. 創建 components/CalendarView.tsx
- 月曆視圖組件
- 顯示行程相關事件
- 事件點擊詳情

// 2. 修改 app/trips/[id]/page.tsx
- 整合 CalendarView 組件  
- 顯示該行程的行事曆事件

// 3. 創建 hooks/useCalendar.ts
- 封裝 CalendarService API 調用
- 事件 CRUD 操作
- 錯誤處理和重試
```

#### API Enhancement  
```typescript
// 1. 修改 app/api/trips/route.ts
- POST 時調用 CalendarService.onTripCreated()
- 確保行事曆事件創建成功

// 2. 修改 app/api/trips/[id]/route.ts  
- PUT 時調用 CalendarService.onTripUpdated()
- DELETE 時調用 CalendarService.onTripDeleted()

// 3. 實現 lib/services/calendar.ts 中的 TODO
- getCalendarEventsForTrip() 實際實現
- 與 User Core Calendar API 整合
```

## 🔧 技術實施細節

### 1. API 整合模式
```typescript
// 統一的行事曆事件創建
const createCalendarEvent = async (eventData: CalendarEventCreate) => {
  try {
    // 調用 User Core Calendar API
    const event = await calendarApi.createEvent(eventData);
    return event;
  } catch (error) {
    // 錯誤處理，不影響主要功能
    console.error('Calendar event creation failed:', error);
    return null;
  }
};
```

### 2. 事件類型映射
```typescript
const EVENT_TYPE_CONFIG = {
  TRIP: { color: '#3B82F6', icon: '🎿' },
  GEAR: { color: '#10B981', icon: '🛠️' },  
  MATCHING: { color: '#F59E0B', icon: '🤝' },
  REMINDER: { color: '#EF4444', icon: '⏰' }
};
```

### 3. 響應式設計
```typescript
// 行事曆組件響應式適配
const CalendarView = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return isMobile ? (
    <MobileCalendarView />
  ) : (
    <DesktopCalendarView />
  );
};
```

## 📅 時程規劃

### Week 1: Ski Platform 基礎整合
- Day 1-2: Trip Planning 行事曆整合
- Day 3-4: Gear Management 提醒功能
- Day 5: Snowbuddy 約定功能

### Week 2: Tour 專案整合  
- Day 1-2: Tour 前端行事曆組件
- Day 3-4: Tour API 行事曆整合
- Day 5: 測試和除錯

### Week 3: 統一視圖和優化
- Day 1-2: 統一行事曆視圖組件
- Day 3-4: 跨應用整合測試
- Day 5: 文檔和部署

## ✅ 驗收標準

### 功能驗收
- [ ] 行程建立自動創建行事曆事件
- [ ] 裝備檢查完成自動設定提醒
- [ ] 雪伴媒合成功可安排約定時間
- [ ] Tour 專案完整行事曆整合
- [ ] 統一行事曆視圖顯示所有事件

### 技術驗收  
- [ ] 所有 API 調用有錯誤處理
- [ ] 響應式設計支援行動裝置
- [ ] 行事曆事件 CRUD 完整實現
- [ ] 跨應用事件同步正常

### 使用者體驗驗收
- [ ] 行事曆載入速度 < 2 秒
- [ ] 事件創建即時反饋
- [ ] 錯誤訊息友善提示
- [ ] 操作流程直觀易用

## 🚀 後續擴展

### Phase 4: 進階功能
- [ ] 外部行事曆同步 (Google Calendar, Outlook)
- [ ] 行事曆事件提醒通知
- [ ] 重複事件支援
- [ ] 行事曆匯出功能

### Phase 5: 智能化
- [ ] AI 推薦最佳約定時間
- [ ] 自動衝突檢測和解決
- [ ] 個人化行事曆偏好
- [ ] 行事曆分析和洞察
