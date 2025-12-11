# Calendar Schema TDD 計劃

基於 UNIFIED_SCHEMA_DESIGN.md，以 TDD 方式完成統一行事曆系統

## 當前狀態

### ✅ 已完成
- Domain: Trip, CalendarEvent, TripBuddy, Day, Item, MatchingRequest
- Model: CalendarTrip, CalendarDay, CalendarItem, CalendarEvent, CalendarTripBuddy, CalendarMatchingRequest
- Repository: 基本 CRUD
- Service: TripService, CalendarEventService, TripBuddyService, MatchingService
- Migration: 202502150001_add_calendar_tables.py
- **Phase 1 Domain 測試: 32 passed**
- **Phase 2 Repository 測試: 28 passed**
- **Phase 3 Service 測試: 12 passed**
- **總計: 72 tests passed**

---

## TDD TODO 清單

### Phase 1: Domain 測試 ✅ 完成

- [x] **TODO-CAL-001**: Trip Domain 測試 (12 tests)
- [x] **TODO-CAL-002**: CalendarEvent Domain 測試 (10 tests)
- [x] **TODO-CAL-003**: TripBuddy Domain 測試 (10 tests)
- [x] **TODO-CAL-004**: Day/Item Domain 測試 (已有基本實作)

### Phase 2: Repository 測試 ✅ 完成

- [x] **TODO-CAL-005**: CalendarTripRepository 測試 (10 tests)
- [x] **TODO-CAL-006**: CalendarEventRepository 測試 (9 tests)
- [x] **TODO-CAL-007**: CalendarTripBuddyRepository 測試 (9 tests)

### Phase 3: Service 層 ✅ 完成

- [x] **TODO-CAL-008**: TripService 測試 (6 tests)
- [x] **TODO-CAL-009**: CalendarEventService 測試 (6 tests)

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

#### Phase 2 完成
- 建立 tests/repositories/conftest.py（SQLite + ARRAY 類型 patch）
- 建立 tests/repositories/test_calendar_trip_repository.py (10 tests)
- 建立 tests/repositories/test_calendar_event_repository.py (9 tests)
- 建立 tests/repositories/test_calendar_buddy_repository.py (9 tests)
- **總計: 28 tests passed**

#### Phase 3 完成
- 建立 tests/services/test_trip_service.py (6 tests)
- 建立 tests/services/test_calendar_event_service.py (6 tests)
- 使用 Mock 測試 Service 層 use cases
- **總計: 12 tests passed**

---

## 測試執行命令

```bash
# 執行所有 Calendar 測試
cd /Users/jameschen/Downloads/diyski/project
source platform/user_core/venv/bin/activate
python3 -m pytest tests/domain/ tests/repositories/ tests/services/test_trip_service.py tests/services/test_calendar_event_service.py -v

# 只執行 Domain 測試
python3 -m pytest tests/domain/ -v

# 只執行 Repository 測試
python3 -m pytest tests/repositories/ -v

# 只執行 Service 測試
python3 -m pytest tests/services/test_trip_service.py tests/services/test_calendar_event_service.py -v
```
