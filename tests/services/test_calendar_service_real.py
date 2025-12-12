"""
T1.8-T1.9: Calendar Service 測試 (使用真實實作)
"""
import pytest
import uuid
from datetime import datetime, date
import sys
from pathlib import Path

# 添加 calendar-service 到 Python 路徑
CALENDAR_SERVICE_ROOT = Path(__file__).resolve().parents[2] / "services" / "calendar-service"
sys.path.insert(0, str(CALENDAR_SERVICE_ROOT))

from calendar_service import CalendarEvent, CalendarServiceInterface, create_calendar_service

@pytest.fixture
def calendar_service():
    """Calendar Service fixture"""
    return create_calendar_service()

@pytest.fixture
def sample_event():
    """範例事件"""
    return CalendarEvent(
        user_id=str(uuid.uuid4()),
        title="Test Event",
        description="Test Description",
        start_date=date(2025, 1, 15),
        end_date=date(2025, 1, 16),
        event_type="trip"
    )

class TestCalendarServiceInterface:
    """測試 Calendar Service 介面契約"""
    
    @pytest.mark.asyncio
    async def test_create_event(self, calendar_service: CalendarServiceInterface, sample_event: CalendarEvent):
        """測試建立事件"""
        # Act
        created_event = await calendar_service.create_event(sample_event)
        
        # Assert
        assert created_event.id is not None
        assert created_event.user_id == sample_event.user_id
        assert created_event.title == sample_event.title
        assert created_event.start_date == sample_event.start_date
        assert created_event.end_date == sample_event.end_date
        assert created_event.created_at is not None
    
    @pytest.mark.asyncio
    async def test_get_events_by_user(self, calendar_service: CalendarServiceInterface, sample_event: CalendarEvent):
        """測試取得用戶事件"""
        # Arrange
        created_event = await calendar_service.create_event(sample_event)
        
        # Act
        events = await calendar_service.get_events(sample_event.user_id)
        
        # Assert
        assert len(events) == 1
        assert events[0].id == created_event.id
        assert events[0].title == sample_event.title
    
    @pytest.mark.asyncio
    async def test_date_validation(self, calendar_service: CalendarServiceInterface):
        """測試日期驗證 - 結束日期不能早於開始日期"""
        # 現在驗證在 Pydantic 模型層執行，所以在建立模型時就會拋出異常
        with pytest.raises(ValueError, match="End date cannot be before start date"):
            CalendarEvent(
                user_id=str(uuid.uuid4()),
                title="Invalid Date Event",
                start_date=date(2025, 1, 20),
                end_date=date(2025, 1, 15),  # 結束日期早於開始日期
                event_type="general"
            )

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
