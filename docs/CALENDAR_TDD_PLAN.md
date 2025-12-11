# Calendar Schema TDD 計劃

基於 UNIFIED_SCHEMA_DESIGN.md，以 TDD 方式完成統一行事曆系統

## 當前狀態

### ✅ 已完成
- Domain: Trip, CalendarEvent, TripBuddy, Day, Item, MatchingRequest
- Model: CalendarTrip, CalendarDay, CalendarItem, CalendarEvent, CalendarTripBuddy, CalendarMatchingRequest
- Repository: 基本 CRUD
- Migration: 202502150001_add_calendar_tables.py
- **Phase 1 Domain 測試: 32 passed**

---

## TDD TODO 清單

### Phase 1: Domain 測試 ✅ 完成

- [x] **TODO-CAL-001**: Trip Domain 測試 (12 tests)
- [x] **TODO-CAL-002**: CalendarEvent Domain 測試 (10 tests)
- [x] **TODO-CAL-003**: TripBuddy Domain 測試 (10 tests)
- [x] **TODO-CAL-004**: Day/Item Domain 測試 (已有基本實作)

### Phase 2: Repository 測試 (需要 DB)

- [ ] **TODO-CAL-005**: CalendarTripRepository 測試
- [ ] **TODO-CAL-006**: CalendarEventRepository 測試
- [ ] **TODO-CAL-007**: CalendarTripBuddyRepository 測試

### Phase 3: Service 層

- [ ] **TODO-CAL-008**: CalendarTripService
- [ ] **TODO-CAL-009**: CalendarEventService

### Phase 4: API Schema & Endpoints

- [ ] **TODO-CAL-010**: Pydantic Schemas
- [ ] **TODO-CAL-011**: API Endpoints

---

## 執行記錄

### 2024-12-11

#### Phase 1 完成
- 修改 domain/calendar/enums.py 獨立定義 enums（避免循環導入）
- 建立 tests/domain/test_calendar_trip.py (12 tests)
- 建立 tests/domain/test_calendar_event.py (10 tests)
- 建立 tests/domain/test_trip_buddy.py (10 tests)
- **總計: 32 tests passed**
