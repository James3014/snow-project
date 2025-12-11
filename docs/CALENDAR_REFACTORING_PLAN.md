# Calendar 系統重構計劃

> 建立日期：2024-12-11
> 狀態：待執行
> 目標：將 Calendar 系統從重複的行程管理應用重構為共享的行事曆基礎設施

## 一、背景與問題

### 1.1 原始設計目標

根據 `UNIFIED_SCHEMA_DESIGN.md`，原始設計的目標是創建一個**共享的行事曆基礎設施**，讓各個應用（Trip、Tour、Snowbuddy Matching 等）都能使用同一套日期時間系統。

### 1.2 當前問題

1. **功能重複**：Calendar 系統重新實現了完整的行程管理應用，與 Trip Planning 系統有重複功能
2. **違反單一責任原則**：Calendar 系統同時處理行程管理和行事曆基礎設施
3. **耦合過緊**：各系統直接依賴具體實現而不是抽象接口
4. **前端未整合**：前端仍然使用舊的 Trip Planning API，沒有使用共享行事曆

### 1.3 違反的原則

**Clean Code 原則**：
- 重複代碼（Trip Planning 和 Calendar 系統有重複的行程管理功能）
- 過大的模塊（Calendar API 試圖做太多事情）
- 緊密耦合（各系統直接依賴具體實現）
- 關注點混淆（Calendar 系統同時處理行程管理和行事曆基礎設施）

**Linus 原則**：
- 過度設計（Calendar 系統實現了完整的行程管理應用，而不是共享基礎設施）
- 缺乏模塊化（各系統沒有明確的邊界和責任分離）
- 耦合過緊（各系統直接調用彼此的 API 而不是使用共享接口）

## 二、目標架構

```
┌───────────────────────────────────────────────────┐
│                 共享行事曆基礎設施                 │
│  ┌─────────────────────────────────────────────┐  │
│  │               Calendar Service              │  │
│  │  - 統一日期時間處理                        │  │
│  │  - 行事曆事件存儲                          │  │
│  │  - 提醒系統                                │  │
│  │  - 事件查詢和過濾                          │  │
│  └─────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
                            ▲
                            │
                            │
┌───────────────────────────────────────────────────┐
│                 各應用系統                        │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │ Trip Planning│  │    Tour     │  │ Matching  │  │
│  │  - 行程管理  │  │  - 行程管理  │  │  - 匹配   │  │
│  │  - 雪季管理  │  │  - 日程管理  │  │  - 可用性 │  │
│  └─────────────┘  └─────────────┘  └───────────┘  │
└───────────────────────────────────────────────────┘
```

## 三、漸進式重構清單

### 3.0 TDD 方法指南

**所有重構任務必須遵循 TDD 方法**：

1. **紅色階段**：先寫失敗的測試
2. **綠色階段**：實現最簡單的代碼使測試通過
3. **重構階段**：優化代碼同時保持測試通過

**測試覆蓋要求**：
- 所有新功能必須有單元測試覆蓋
- 所有整合點必須有整合測試
- 所有 API 端點必須有 API 測試
- 測試覆蓋率目標：90%+

**測試類型**：
1. **單元測試**：測試個別函數和方法
2. **服務測試**：測試服務層邏輯
3. **倉庫測試**：測試資料存取層
4. **API 測試**：測試 API 端點
5. **整合測試**：測試系統間整合

### 3.1 立即行動（優先級：最高）

#### 任務 1：精簡 Calendar 系統
**目標**：移除重複的行程管理功能，只保留行事曆基礎設施

**具體步驟**：
1. 刪除 `CalendarTrip`, `CalendarDay`, `CalendarItem` 模型
2. 刪除相關的 API 端點（`/trips`, `/days`, `/items`）
3. 刪除相關的服務和倉庫（`TripService`, `DayService`, `ItemService`）
4. 保留 `CalendarEvent` 模型和相關功能
5. 更新 `models/calendar.py`，只保留 `CalendarEvent`
6. 更新 `api/calendar.py`，只保留事件相關端點
7. 更新 `services/calendar_service.py`，只保留事件服務

**影響範圍**：
- `platform/user_core/models/calendar.py`
- `platform/user_core/api/calendar.py`
- `platform/user_core/services/calendar_service.py`
- `platform/user_core/repositories/calendar_repository.py`

**預估時間**：2-4 小時

**TDD 步驟**：
1. 先寫測試，驗證現有事件功能
2. 逐步移除行程管理功能，同時保持測試通過
3. 確保所有測試通過後再刪除代碼

**驗證方法**：
- 運行現有測試，確保事件功能正常
- 確認行程管理功能已移除
- 確認 API 端點只剩事件相關
- 確認測試覆蓋率維持在 90%+

#### 任務 2：定義共享接口
**目標**：定義明確的 Calendar Service 接口，確保各系統依賴抽象而不是具體實現

**具體步驟**：
1. 創建 `services/interfaces/calendar_service_interface.py`
2. 定義事件創建、查詢、更新、刪除接口
3. 定義事件類型和狀態枚舉
4. 實現具體的 `CalendarService` 類
5. 更新 `domain/calendar/enums.py`，加入 `EventSource` 枚舉
6. 文檔化接口合約

**影響範圍**：
- `platform/user_core/services/interfaces/calendar_service_interface.py` (新建)
- `platform/user_core/domain/calendar/enums.py`
- `platform/user_core/services/calendar_service.py`

**預估時間**：2-3 小時

**TDD 步驟**：
1. 先定義接口和寫測試
2. 實現具體服務使測試通過
3. 確保所有接口方法都有測試覆蓋

**驗證方法**：
- 確認所有方法都有明確的接口定義
- 確認具體實現遵循接口合約
- 確認文檔完整
- 確認測試覆蓋率達到 100%

### 3.2 短期目標（優先級：高）

#### 任務 3：Trip Planning 整合共享行事曆
**目標**：更新 Trip Planning 系統使用共享行事曆，將行程事件與共享行事曆同步

**具體步驟**：
1. 更新 `services/trip_planning_service.py` 加入行事曆整合
2. 修改 `create_trip` 方法，創建行程時同時創建行事曆事件
3. 修改 `update_trip` 方法，更新行程時同時更新行事曆事件
4. 修改 `get_trip` 方法，返回行程時同時返回行事曆事件
5. 更新 `api/trip_planning.py`，確保 API 響應包含事件資訊
6. 更新 `schemas/trip_planning.py`，加入事件資訊

**影響範圍**：
- `platform/user_core/services/trip_planning_service.py`
- `platform/user_core/api/trip_planning.py`
- `platform/user_core/schemas/trip_planning.py`

**預估時間**：4-6 小時

**驗證方法**：
- 創建行程時，確認行事曆事件被創建
- 更新行程時，確認行事曆事件被更新
- 查詢行程時，確認事件資訊被返回
- 運行 Trip Planning 測試

#### 任務 4：更新前端 API 調用
**目標**：更新前端使用共享行事曆 API，確保前端顯示來自不同應用的行事曆事件

**具體步驟**：
1. 創建 `group/lib/api/calendarApi.ts` 共享行事曆 API
2. 更新 `group/lib/api/tripPlanningApi.ts` 使用共享行事曆
3. 更新前端狀態管理適應新的 API 響應
4. 更新 UI 組件顯示來自不同應用的事件
5. 測試前端功能

**影響範圍**：
- `group/lib/api/calendarApi.ts` (新建)
- `group/lib/api/tripPlanningApi.ts`
- 前端狀態管理代碼
- 前端 UI 組件

**預估時間**：6-8 小時

**驗證方法**：
- 確認前端可以創建和查詢行事曆事件
- 確認前端顯示來自不同應用的事件
- 確認用戶體驗一致

### 3.3 中期目標（優先級：中）

#### 任務 5：Snowbuddy Matching 整合
**目標**：更新 Matching 系統使用共享行事曆，將匹配結果與行事曆事件關聯

**具體步驟**：
1. 更新 `snowbuddy_matching/app/clients/user_core_client.py` 使用共享行事曆
2. 更新 `snowbuddy_matching/app/services/matching_service.py` 加入行事曆整合
3. 當創建匹配請求時，查詢共享行事曆可用性
4. 將匹配結果存儲為行事曆事件
5. 更新 Matching API 使用共享行事曆

**影響範圍**：
- `snowbuddy_matching/app/clients/user_core_client.py`
- `snowbuddy_matching/app/services/matching_service.py`
- `snowbuddy_matching/app/routers/*_router.py`

**預估時間**：4-6 小時

**驗證方法**：
- 確認匹配請求時查詢行事曆可用性
- 確認匹配結果被存儲為行事曆事件
- 運行 Matching 測試

#### 任務 6：Tour 系統整合
**目標**：更新 Tour 系統使用共享行事曆，將行程事件與共享行事曆同步

**具體步驟**：
1. 更新 Tour 系統後端使用共享行事曆 API
2. 當創建行程時，同時創建行事曆事件
3. 當更新行程時，同時更新行事曆事件
4. 查詢行程時，同時返回行事曆事件
5. 更新 Tour 系統前端顯示行事曆事件

**影響範圍**：
- Tour 系統後端 API
- Tour 系統前端代碼

**預估時間**：6-8 小時

**驗證方法**：
- 確認 Tour 系統可以創建和查詢行事曆事件
- 確認 Tour 系統顯示行事曆事件
- 測試 Tour 系統功能

### 3.4 長期目標（優先級：低）

#### 任務 7：完善共享行事曆功能
**目標**：加入外部行事曆同步和高級功能

**具體步驟**：
1. 實現 Google Calendar 同步
2. 實現 Outlook Calendar 同步
3. 實現高級提醒系統（電子郵件、推送通知）
4. 實現行事曆共享和協作功能

**影響範圍**：
- `platform/user_core/services/calendar_service.py`
- `platform/user_core/api/calendar.py`
- 新的外部服務整合

**預估時間**：8-12 小時

**驗證方法**：
- 測試外部行事曆同步
- 測試提醒系統
- 測試共享和協作功能

#### 任務 8：性能優化和監控
**目標**：加入快取機制和性能監控

**具體步驟**：
1. 實現 Redis 快取
2. 加入 Prometheus 監控
3. 優化資料庫索引和查詢
4. 加入性能測試

**影響範圍**：
- `platform/user_core/services/calendar_service.py`
- `platform/user_core/api/calendar.py`
- 新的監控和快取服務

**預估時間**：6-8 小時

**驗證方法**：
- 測試快取性能
- 測試監控功能
- 測試資料庫查詢優化

## 四、具體代碼重構建議

### 4.1 精簡 Calendar 系統

**當前問題**：
- Calendar 系統實現了完整的行程管理應用
- 與 Trip Planning 系統有重複功能
- 違反了單一責任原則

**重構建議**：

```python
# 保留的功能：
class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("user_profiles.user_id"), nullable=False)
    type = Column(SQLAlchemyEnum(EventType, native_enum=False), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    all_day = Column(Boolean, nullable=False, default=False)
    timezone = Column(String(64), nullable=False, default="Asia/Taipei")
    source_app = Column(String(50))  # 來源應用
    source_id = Column(String(100))  # 來源應用中的 ID
    related_trip_id = Column(String(100))  # 關聯的行程 ID
    reminders = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=tznow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=tznow, onupdate=tznow, nullable=False)

# 移除的功能：
# - CalendarTrip
# - CalendarDay
# - CalendarItem
# - CalendarTripBuddy
# - CalendarMatchingRequest
```

### 4.2 定義共享接口

**當前問題**：
- 各系統直接依賴具體實現
- 沒有明確的接口定義
- 耦合過緊

**重構建議**：

```python
# calendar_service_interface.py
from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime
from domain.calendar.enums import EventType

class CalendarServiceInterface(ABC):
    """共享行事曆服務接口"""

    @abstractmethod
    def create_event(
        self,
        user_id: str,
        event_type: EventType,
        title: str,
        start_date: datetime,
        end_date: datetime,
        all_day: bool = False,
        description: Optional[str] = None,
        source_app: Optional[str] = None,
        source_id: Optional[str] = None,
        related_trip_id: Optional[str] = None,
        reminders: Optional[List[dict]] = None,
    ) -> 'CalendarEvent':
        """創建行事曆事件"""
        pass

    @abstractmethod
    def get_event(self, event_id: str) -> Optional['CalendarEvent']:
        """獲取單個行事曆事件"""
        pass

    @abstractmethod
    def list_events(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        event_type: Optional[EventType] = None,
        source_app: Optional[str] = None,
    ) -> List['CalendarEvent']:
        """列出行事曆事件"""
        pass

    @abstractmethod
    def update_event(
        self,
        event_id: str,
        **kwargs
    ) -> 'CalendarEvent':
        """更新行事曆事件"""
        pass

    @abstractmethod
    def delete_event(self, event_id: str) -> bool:
        """刪除行事曆事件"""
        pass
```

### 4.3 Trip Planning 整合共享行事曆

**當前問題**：
- Trip Planning 系統使用自己的行事曆管理
- 沒有與共享行事曆整合
- 導致資料不一致

**重構建議**：

```python
# trip_planning_service.py - 整合共享行事曆
from services.calendar_service import CalendarService
from domain.calendar.enums import EventType

class TripPlanningService:
    def __init__(self, trip_repository, calendar_service: CalendarService):
        self.trip_repository = trip_repository
        self.calendar_service = calendar_service

    def create_trip(self, **kwargs):
        # 1. 創建行程
        trip = self.trip_repository.create(**kwargs)

        # 2. 創建行事曆事件
        self.calendar_service.create_event(
            user_id=trip.user_id,
            event_type=EventType.TRIP_PLANNING,
            title=trip.title or f"Trip to {trip.resort_name}",
            start_date=trip.start_date,
            end_date=trip.end_date,
            source_app="trip_planning",
            source_id=str(trip.trip_id),
            related_trip_id=str(trip.trip_id),
            description=trip.note,
        )

        return trip

    def get_trip(self, trip_id):
        # 1. 获取行程
        trip = self.trip_repository.get(trip_id)

        # 2. 获取關聯的行事曆事件
        events = self.calendar_service.list_events(
            user_id=trip.user_id,
            source_app="trip_planning",
            source_id=str(trip.trip_id),
        )

        # 3. 返回行程和事件
        return {
            "trip": trip,
            "events": events,
        }
```

## 五、TDD 實現細節

### 5.1 測試驅動開發流程

**所有重構任務必須遵循以下 TDD 流程**：

```
┌───────────────────────────────────────────────────┐
│                 紅色階段 (Red)                    │
│  1. 先寫失敗的測試                                │
│  2. 驗證測試失敗（確認測試正確）                  │
└───────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────┐
│                 綠色階段 (Green)                  │
│  1. 實現最簡單的代碼使測試通過                    │
│  2. 不要過度設計，只實現測試需要的功能            │
└───────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────┐
│                 重構階段 (Refactor)              │
│  1. 優化代碼同時保持測試通過                      │
│  2. 移除重複代碼                                  │
│  3. 改進代碼結構                                  │
│  4. 確保所有測試仍然通過                          │
└───────────────────────────────────────────────────┘
```

### 5.2 測試金字塔

```
                            /\
                           /  \
                          /    \
                         /      \
                        /        \
                       /          \
                      /            \
                     /              \
                    /                \
                   /                  \
                  /                    \
                 /                      \
                /                        \
               /                          \
              /                            \
             /                              \
            /                                \
           /                                  \
          /                                    \
         /                                      \
        /                                        \
       /                                          \
      /                                            \
     /                                              \
    /                                                \
   /                                                  \
  /                                                    \
 /                                                      \
┌───────────────────────────────────────────────────┐
│                 端到端測試 (E2E)                  │
│                 10-15%                            │
└───────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────┐
│                 整合測試                          │
│                 20-25%                            │
└───────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────┐
│                 服務測試                          │
│                 30-35%                            │
└───────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────┐
│                 單元測試                          │
│                 30-35%                            │
└───────────────────────────────────────────────────┘
```

### 5.3 測試命名規範

**單元測試**：
- `test_<function_name>_<scenario>_<expected_result>`
- 例子：`test_create_event_with_valid_data_returns_event`

**服務測試**：
- `test_<service_name>_<method>_<scenario>_<expected_result>`
- 例子：`test_calendar_service_create_event_with_valid_data_creates_event`

**API 測試**：
- `test_<endpoint>_<method>_<scenario>_<expected_status>`
- 例子：`test_post_events_with_valid_data_returns_201`

**整合測試**：
- `test_<system1>_<system2>_<scenario>_<expected_result>`
- 例子：`test_trip_planning_calendar_integration_create_trip_creates_event`

## 七、具體測試範例

### 7.1 精簡 Calendar 系統測試範例

**測試文件**：`tests/services/test_calendar_service_refactoring.py`

```python
import pytest
from datetime import datetime, timezone
from domain.calendar.enums import EventType
from services.calendar_service import CalendarService
from repositories.calendar_repository import CalendarEventRepository

@pytest.fixture
def calendar_service():
    repo = CalendarEventRepository()
    return CalendarService(repo)

class TestCalendarServiceRefactoring:
    """測試精簡後的 Calendar 服務"""

    def test_create_event_with_valid_data(self, calendar_service):
        """測試創建事件功能"""
        event = calendar_service.create_event(
            user_id="user-123",
            event_type=EventType.TRIP_PLANNING,
            title="Test Trip",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc),
            source_app="trip_planning",
            source_id="trip-123",
        )
        
        assert event is not None
        assert event.id is not None
        assert event.title == "Test Trip"
        assert event.source_app == "trip_planning"
        assert event.source_id == "trip-123"

    def test_list_events_by_user(self, calendar_service):
        """測試列出用戶事件功能"""
        # 創建測試數據
        calendar_service.create_event(
            user_id="user-123",
            event_type=EventType.TRIP_PLANNING,
            title="Trip 1",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc),
            source_app="trip_planning",
            source_id="trip-1",
        )
        
        calendar_service.create_event(
            user_id="user-123",
            event_type=EventType.SKI_SESSION,
            title="Ski Session 1",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc),
            source_app="tour",
            source_id="session-1",
        )
        
        # 查詢事件
        events = calendar_service.list_events(user_id="user-123")
        
        assert len(events) == 2
        assert all(e.user_id == "user-123" for e in events)

    def test_list_events_by_source_app(self, calendar_service):
        """測試列出特定來源應用的事件"""
        # 創建測試數據
        calendar_service.create_event(
            user_id="user-123",
            event_type=EventType.TRIP_PLANNING,
            title="Trip 1",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc),
            source_app="trip_planning",
            source_id="trip-1",
        )
        
        calendar_service.create_event(
            user_id="user-123",
            event_type=EventType.SKI_SESSION,
            title="Ski Session 1",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc),
            source_app="tour",
            source_id="session-1",
        )
        
        # 查詢特定來源應用的事件
        events = calendar_service.list_events(
            user_id="user-123",
            source_app="trip_planning"
        )
        
        assert len(events) == 1
        assert events[0].source_app == "trip_planning"

    def test_update_event(self, calendar_service):
        """測試更新事件功能"""
        # 創建事件
        event = calendar_service.create_event(
            user_id="user-123",
            event_type=EventType.TRIP_PLANNING,
            title="Original Title",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc),
            source_app="trip_planning",
            source_id="trip-1",
        )
        
        # 更新事件
        updated = calendar_service.update_event(
            event_id=event.id,
            title="Updated Title",
            description="Updated description"
        )
        
        assert updated.title == "Updated Title"
        assert updated.description == "Updated description"

    def test_delete_event(self, calendar_service):
        """測試刪除事件功能"""
        # 創建事件
        event = calendar_service.create_event(
            user_id="user-123",
            event_type=EventType.TRIP_PLANNING,
            title="Test Event",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc),
            source_app="trip_planning",
            source_id="trip-1",
        )
        
        # 刪除事件
        result = calendar_service.delete_event(event.id)
        
        assert result is True
        
        # 驗證事件已刪除
        deleted = calendar_service.get_event(event.id)
        assert deleted is None
```

### 7.2 Trip Planning 整合測試範例

**測試文件**：`tests/services/test_trip_planning_integration.py`

```python
import pytest
from datetime import datetime, timezone
from services.trip_planning_service import TripPlanningService
from services.calendar_service import CalendarService
from repositories.trip_repository import TripRepository
from repositories.calendar_repository import CalendarEventRepository

@pytest.fixture
def trip_planning_service():
    trip_repo = TripRepository()
    calendar_repo = CalendarEventRepository()
    calendar_service = CalendarService(calendar_repo)
    return TripPlanningService(trip_repo, calendar_service)

class TestTripPlanningCalendarIntegration:
    """測試 Trip Planning 和 Calendar 整合"""

    def test_create_trip_creates_calendar_event(self, trip_planning_service):
        """測試創建行程時自動創建行事曆事件"""
        trip = trip_planning_service.create_trip(
            user_id="user-123",
            resort_id="resort-1",
            resort_name="Test Resort",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc),
            title="Test Trip",
            note="Test note"
        )
        
        # 驗證行程被創建
        assert trip is not None
        assert trip.trip_id is not None
        
        # 驗證行事曆事件被創建
        events = trip_planning_service.calendar_service.list_events(
            user_id="user-123",
            source_app="trip_planning",
            source_id=str(trip.trip_id)
        )
        
        assert len(events) == 1
        assert events[0].title == "Test Trip"
        assert events[0].description == "Test note"
        assert events[0].source_app == "trip_planning"
        assert events[0].source_id == str(trip.trip_id)

    def test_update_trip_updates_calendar_event(self, trip_planning_service):
        """測試更新行程時自動更新行事曆事件"""
        # 創建行程
        trip = trip_planning_service.create_trip(
            user_id="user-123",
            resort_id="resort-1",
            resort_name="Test Resort",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc),
            title="Original Title",
            note="Original note"
        )
        
        # 更新行程
        updated_trip = trip_planning_service.update_trip(
            trip_id=trip.trip_id,
            title="Updated Title",
            note="Updated note"
        )
        
        # 驗證行程被更新
        assert updated_trip.title == "Updated Title"
        assert updated_trip.note == "Updated note"
        
        # 驗證行事曆事件被更新
        events = trip_planning_service.calendar_service.list_events(
            user_id="user-123",
            source_app="trip_planning",
            source_id=str(trip.trip_id)
        )
        
        assert len(events) == 1
        assert events[0].title == "Updated Title"
        assert events[0].description == "Updated note"

    def test_get_trip_returns_events(self, trip_planning_service):
        """測試獲取行程時返回關聯的行事曆事件"""
        # 創建行程
        trip = trip_planning_service.create_trip(
            user_id="user-123",
            resort_id="resort-1",
            resort_name="Test Resort",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc),
            title="Test Trip",
            note="Test note"
        )
        
        # 获取行程
        result = trip_planning_service.get_trip(trip.trip_id)
        
        # 驗證返回行程和事件
        assert "trip" in result
        assert "events" in result
        assert result["trip"] is not None
        assert len(result["events"]) == 1
        assert result["events"][0].title == "Test Trip"
```

### 7.3 API 測試範例

**測試文件**：`tests/api/test_calendar_api.py`

```python
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone
from api.calendar import router
from services.calendar_service import CalendarService
from repositories.calendar_repository import CalendarEventRepository

@pytest.fixture
def client():
    from main import app
    app.include_router(router)
    return TestClient(app)

@pytest.fixture
def calendar_service():
    repo = CalendarEventRepository()
    return CalendarService(repo)

class TestCalendarAPI:
    """測試 Calendar API 端點"""

    def test_create_event(self, client):
        """測試創建事件 API"""
        response = client.post(
            "/calendar/events",
            json={
                "type": "TRIP_PLANNING",
                "title": "Test Event",
                "start_date": "2024-12-11T10:00:00+08:00",
                "end_date": "2024-12-11T12:00:00+08:00",
                "all_day": False,
                "description": "Test description",
                "source_app": "trip_planning",
                "source_id": "trip-123",
            },
            headers={"X-User-ID": "user-123"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["title"] == "Test Event"
        assert data["type"] == "TRIP_PLANNING"

    def test_list_events(self, client, calendar_service):
        """測試列出事件 API"""
        # 創建測試數據
        calendar_service.create_event(
            user_id="user-123",
            event_type="TRIP_PLANNING",
            title="Event 1",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc),
            source_app="trip_planning",
            source_id="trip-1",
        )
        
        calendar_service.create_event(
            user_id="user-123",
            event_type="SKI_SESSION",
            title="Event 2",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc),
            source_app="tour",
            source_id="session-1",
        )
        
        # 查詢事件
        response = client.get(
            "/calendar/events",
            headers={"X-User-ID": "user-123"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all(e["user_id"] == "user-123" for e in data)

    def test_get_event(self, client, calendar_service):
        """測試獲取單個事件 API"""
        # 創建測試數據
        event = calendar_service.create_event(
            user_id="user-123",
            event_type="TRIP_PLANNING",
            title="Test Event",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc),
            source_app="trip_planning",
            source_id="trip-1",
        )
        
        # 获取事件
        response = client.get(
            f"/calendar/events/{event.id}",
            headers={"X-User-ID": "user-123"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(event.id)
        assert data["title"] == "Test Event"

    def test_update_event(self, client, calendar_service):
        """測試更新事件 API"""
        # 創建測試數據
        event = calendar_service.create_event(
            user_id="user-123",
            event_type="TRIP_PLANNING",
            title="Original Title",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc),
            source_app="trip_planning",
            source_id="trip-1",
        )
        
        # 更新事件
        response = client.patch(
            f"/calendar/events/{event.id}",
            json={
                "title": "Updated Title",
                "description": "Updated description"
            },
            headers={"X-User-ID": "user-123"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["description"] == "Updated description"

    def test_delete_event(self, client, calendar_service):
        """測試刪除事件 API"""
        # 創建測試數據
        event = calendar_service.create_event(
            user_id="user-123",
            event_type="TRIP_PLANNING",
            title="Test Event",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc),
            source_app="trip_planning",
            source_id="trip-1",
        )
        
        # 刪除事件
        response = client.delete(
            f"/calendar/events/{event.id}",
            headers={"X-User-ID": "user-123"}
        )
        
        assert response.status_code == 204
n```

## 八、總結和建議

### 8.1 立即行動建議

1. **停止開發新功能**：首先停止在 Calendar 系統中開發新功能，避免問題擴大
2. **精簡 Calendar 系統**：立即開始精簡 Calendar 系統，移除重複功能
3. **定義共享接口**：明確定義共享行事曆的接口和合約
4. **更新文檔**：更新所有文檔，反映新的架構設計

### 5.2 重構優先級

| 任務 | 優先級 | 預估時間 | 依賴 |
|------|--------|----------|------|
| 精簡 Calendar 系統 | 最高 | 2-4 小時 | 無 |
| 定義共享接口 | 最高 | 2-3 小時 | 無 |
| Trip Planning 整合 | 高 | 4-6 小時 | 精簡 Calendar |
| 更新前端 API | 高 | 6-8 小時 | 定義接口 |
| Matching 整合 | 中 | 4-6 小時 | 精簡 Calendar |
| Tour 整合 | 中 | 6-8 小時 | 定義接口 |
| 完善共享功能 | 低 | 8-12 小時 | 所有整合 |
| 性能優化 | 低 | 6-8 小時 | 所有整合 |

### 5.3 長期架構建議

1. **微服務架構**：考慮將各系統拆分為獨立的微服務，通過共享行事曆基礎設施通信
2. **事件驅動架構**：使用事件總線或消息隊列進行系統間通信
3. **API 網關**：使用 API 網關統一管理和路由請求
4. **服務網格**：使用服務網格管理服務間通信和安全

### 5.4 代碼質量建議

1. **單元測試**：確保所有重構後的代碼都有單元測試覆蓋
2. **整合測試**：確保各系統整合後功能正常
3. **代碼審查**：所有重構後的代碼都需要經過代碼審查
4. **文檔更新**：確保所有文檔與實際實現一致

## 九、參考文件

- [UNIFIED_SCHEMA_DESIGN.md](../UNIFIED_SCHEMA_DESIGN.md)
- [CALENDAR_API.md](./CALENDAR_API.md)
- [CALENDAR_TDD_PLAN.md](./CALENDAR_TDD_PLAN.md)
- [CALENDAR_TODO.md](./CALENDAR_TODO.md)
- [Clean Code: A Handbook of Agile Software Craftsmanship](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Test-Driven Development by Example](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)

## 十、測試工具和框架

### 後端測試
- `pytest`：Python 測試框架
- `pytest-cov`：測試覆蓋率
- `pytest-asyncio`：異步測試支援
- `httpx`：HTTP 測試客戶端
- `factory_boy`：測試資料生成
- `freezegun`：時間模擬

### 前端測試
- `jest`：JavaScript 測試框架
- `@testing-library/react`：React 組件測試
- `msw`：API mock
- `cypress`：端到端測試
- `react-test-renderer`：React 渲染器

## 十一、測試命令

```bash
# 運行所有測試
cd /Users/jameschen/Downloads/diyski/project
source platform/user_core/venv/bin/activate
python3 -m pytest tests/ -v --cov=platform/user_core --cov-report=term-missing

# 運行特定測試
python3 -m pytest tests/services/test_calendar_service.py -v

# 運行前端測試
cd /Users/jameschen/Downloads/diyski/project/group
npm test

# 運行端到端測試
npx cypress run

# 運行測試並生成報告
python3 -m pytest tests/ --cov=platform/user_core --cov-report=html
```

## 十二、測試覆蓋率目標

| 模塊 | 目標覆蓋率 | 當前覆蓋率 | 狀態 |
|------|------------|------------|------|
| 服務層 | 95% | 89% | ⚠️ 需要改進 |
| 倉庫層 | 90% | 85% | ⚠️ 需要改進 |
| API 層 | 90% | 80% | ⚠️ 需要改進 |
| 前端 | 85% | 75% | ⚠️ 需要改進 |
| 整合 | 85% | 70% | ⚠️ 需要改進 |

## 十三、變更歷史

- 2024-12-11：初始版本，加入 TDD 方法和詳細測試範例
- 2024-12-11：加入具體測試範例和測試策略
- 2024-12-11：加入測試工具和框架說明
