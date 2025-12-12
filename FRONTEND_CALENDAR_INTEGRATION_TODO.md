# 前端行事曆整合 TODO

## 🎯 總覽
整合前端各應用與後端 Calendar Service，實現統一行事曆基礎設施。

## 📋 Phase 1: Ski Platform 行事曆整合

### 🎿 Trip Planning 整合
- [ ] **修改 `useSeasonDetail.ts`**
  - [ ] 替換本地資料為 `calendarApi.getSharedCalendar()`
  - [ ] 整合 User Core 統一行事曆事件
  - [ ] 事件類型篩選 (TRIP, GEAR, MATCHING)

- [ ] **修改 `TripCreateModal.tsx`**
  - [ ] 行程建立成功後調用 `calendarApi.createEvent()`
  - [ ] 創建 `EventType.TRIP` 事件
  - [ ] 錯誤處理不影響行程建立

- [ ] **修改 `TripDetail.tsx`**
  - [ ] 行程更新時同步更新行事曆事件
  - [ ] 行程刪除時清理相關行事曆事件
  - [ ] 顯示該行程的行事曆事件

- [ ] **修改 `SeasonCalendarView.tsx`**
  - [ ] 顯示來自 User Core 的統一事件
  - [ ] 支援多種事件類型顯示
  - [ ] 事件點擊跳轉到對應功能

### 🛠️ Gear Management 整合
- [ ] **創建 `GearReminders.tsx` 組件**
  - [ ] 顯示 `gearApi.getMyReminders()` 結果
  - [ ] 提醒卡片設計 (檢查、維護、交易)
  - [ ] 取消提醒功能 `gearApi.cancelReminder()`
  - [ ] 提醒狀態管理

- [ ] **修改 `MyGear.tsx`**
  - [ ] 新增「提醒」標籤頁
  - [ ] 整合 `GearReminders` 組件
  - [ ] 裝備狀態與提醒關聯顯示
  - [ ] 提醒數量徽章顯示

- [ ] **創建 `GearInspection.tsx` 組件**
  - [ ] 檢查表單 UI (安全性、功能性、外觀)
  - [ ] 檢查結果記錄和評分
  - [ ] 完成檢查後自動創建下次提醒
  - [ ] 調用後端 `complete_inspection_with_calendar()`

- [ ] **創建 `TradeMeeting.tsx` 組件**
  - [ ] 交易會面時間選擇器
  - [ ] 地點輸入和確認
  - [ ] 雙方行事曆事件創建
  - [ ] 會面提醒設定

### 🤝 Snowbuddy Matching 整合
- [ ] **修改 `SmartMatchingPage.tsx`**
  - [ ] 媒合成功後顯示約定時間選擇
  - [ ] 調用 `calendarApi.createEvent()` 創建約定
  - [ ] 創建 `EventType.MATCHING` 事件
  - [ ] 約定確認流程

- [ ] **修改 `SnowbuddyBoard.tsx`**
  - [ ] 申請接受後的會面安排功能
  - [ ] 時間衝突檢查和提示
  - [ ] `calendar_synced` 狀態顯示
  - [ ] 約定狀態管理

- [ ] **創建 `MeetingScheduler.tsx` 組件**
  - [ ] 約定時間選擇器 (日期、時間)
  - [ ] 雪場地點選擇
  - [ ] 備註和特殊需求輸入
  - [ ] 雙方行事曆事件創建

## 📋 Phase 2: Tour 專案整合

### 🎨 Frontend Components
- [ ] **創建 `components/CalendarView.tsx`**
  - [ ] 月曆視圖組件
  - [ ] 顯示行程相關事件
  - [ ] 事件點擊詳情彈窗
  - [ ] 響應式設計 (桌面/行動)

- [ ] **創建 `components/EventCard.tsx`**
  - [ ] 事件卡片組件
  - [ ] 支援不同事件類型樣式
  - [ ] 事件狀態顯示
  - [ ] 快速操作按鈕

- [ ] **修改 `app/trips/[id]/page.tsx`**
  - [ ] 整合 `CalendarView` 組件
  - [ ] 顯示該行程的行事曆事件
  - [ ] 事件管理功能

### 🔧 API Integration
- [ ] **修改 `app/api/trips/route.ts`**
  - [ ] POST 時調用 `CalendarService.onTripCreated()`
  - [ ] 確保行事曆事件創建成功
  - [ ] 錯誤處理和回滾機制

- [ ] **修改 `app/api/trips/[id]/route.ts`**
  - [ ] PUT 時調用 `CalendarService.onTripUpdated()`
  - [ ] DELETE 時調用 `CalendarService.onTripDeleted()`
  - [ ] 事件同步狀態追蹤

- [ ] **實現 `lib/services/calendar.ts` TODO**
  - [ ] `getCalendarEventsForTrip()` 實際實現
  - [ ] 與 User Core Calendar API 整合
  - [ ] 事件快取和同步機制

### 🎣 Hooks and Utils
- [ ] **創建 `hooks/useCalendar.ts`**
  - [ ] 封裝 CalendarService API 調用
  - [ ] 事件 CRUD 操作
  - [ ] 錯誤處理和重試邏輯
  - [ ] 載入狀態管理

- [ ] **創建 `utils/calendarHelpers.ts`**
  - [ ] 日期格式化工具
  - [ ] 事件類型配置
  - [ ] 時區處理
  - [ ] 衝突檢測邏輯

## 📋 Phase 3: 統一行事曆視圖

### 🎨 Shared Components
- [ ] **創建 `UnifiedCalendarView.tsx`**
  - [ ] 跨應用統一行事曆視圖
  - [ ] 支援多種事件類型顯示
  - [ ] 事件篩選和搜尋功能
  - [ ] 月/週/日視圖切換

- [ ] **創建 `EventTypeFilter.tsx`**
  - [ ] 事件類型篩選器
  - [ ] 多選支援
  - [ ] 快速篩選預設
  - [ ] 篩選狀態持久化

- [ ] **創建 `CalendarEventModal.tsx`**
  - [ ] 事件詳情彈窗
  - [ ] 事件編輯功能
  - [ ] 刪除確認
  - [ ] 跳轉到來源應用

### 🔗 Cross-App Integration
- [ ] **統一事件配置**
  - [ ] 事件顏色和圖示系統
  - [ ] 事件優先級定義
  - [ ] 狀態映射規則
  - [ ] 通知設定

- [ ] **路由整合**
  - [ ] 事件點擊跳轉邏輯
  - [ ] 深度連結支援
  - [ ] 返回導航處理
  - [ ] 狀態同步

## 🔧 技術實施細節

### API 整合模式
```typescript
// 1. 統一的行事曆事件創建
const createCalendarEvent = async (eventData: CalendarEventCreate) => {
  try {
    const event = await calendarApi.createEvent(eventData);
    return { success: true, event };
  } catch (error) {
    console.error('Calendar event creation failed:', error);
    return { success: false, error };
  }
};

// 2. 事件同步狀態管理
interface EventSyncState {
  syncing: boolean;
  lastSync: Date | null;
  errors: string[];
}
```

### 事件類型配置
```typescript
const EVENT_TYPE_CONFIG = {
  TRIP: { 
    color: '#3B82F6', 
    icon: '🎿', 
    label: '滑雪行程',
    priority: 1 
  },
  GEAR: { 
    color: '#10B981', 
    icon: '🛠️', 
    label: '裝備提醒',
    priority: 2 
  },
  MATCHING: { 
    color: '#F59E0B', 
    icon: '🤝', 
    label: '雪伴約定',
    priority: 3 
  },
  REMINDER: { 
    color: '#EF4444', 
    icon: '⏰', 
    label: '提醒事項',
    priority: 4 
  }
};
```

### 響應式設計
```typescript
// 行事曆組件響應式適配
const useResponsiveCalendar = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  
  return {
    viewMode: isMobile ? 'day' : isTablet ? 'week' : 'month',
    eventLimit: isMobile ? 2 : isTablet ? 4 : 6,
    showSidebar: !isMobile
  };
};
```

## 📝 實施檢查清單

### Ski Platform
- [ ] Trip Planning 行事曆整合完成
- [ ] Gear Management 提醒功能完成  
- [ ] Snowbuddy 約定功能完成
- [ ] 統一行事曆視圖完成
- [ ] 跨應用事件同步測試通過

### Tour 專案
- [ ] 前端行事曆組件完成
- [ ] API 行事曆整合完成
- [ ] 事件 CRUD 功能完成
- [ ] 與 User Core 同步測試通過

### 整合測試
- [ ] 行程建立自動創建行事曆事件
- [ ] 裝備檢查完成自動設定提醒
- [ ] 雪伴媒合成功可安排約定時間
- [ ] Tour 行程與 Ski Platform 事件同步
- [ ] 所有事件在統一視圖中正確顯示

## 🚀 部署和驗收

### 功能驗收
- [ ] 所有行事曆功能正常運作
- [ ] 事件創建、更新、刪除同步
- [ ] 跨應用事件顯示正確
- [ ] 錯誤處理機制有效

### 效能驗收
- [ ] 行事曆載入時間 < 2 秒
- [ ] 事件同步延遲 < 1 秒
- [ ] 大量事件渲染流暢
- [ ] 記憶體使用合理

### 使用者體驗驗收
- [ ] 操作流程直觀易用
- [ ] 錯誤訊息友善清楚
- [ ] 響應式設計適配良好
- [ ] 無障礙功能支援

## 📚 文檔更新
- [ ] API 文檔更新
- [ ] 組件使用說明
- [ ] 整合指南
- [ ] 故障排除指南
