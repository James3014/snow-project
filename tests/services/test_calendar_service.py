"""
T1.8: Calendar Service 獨立測試 (TDD Red Phase)
測試 calendar-service 作為獨立服務的功能
"""
import pytest
import uuid
from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel
from abc import ABC, abstractmethod

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
    async def test_get_events_with_date_filter(self, calendar_service: CalendarServiceInterface, sample_event: CalendarEvent):
        """測試日期篩選"""
        # Arrange
        await calendar_service.create_event(sample_event)
        
        # Act - 在日期範圍內
        events_in_range = await calendar_service.get_events(
            sample_event.user_id,
            start_date=date(2025, 1, 1),
            end_date=date(2025, 1, 31)
        )
        
        # Act - 在日期範圍外
        events_out_range = await calendar_service.get_events(
            sample_event.user_id,
            start_date=date(2025, 2, 1),
            end_date=date(2025, 2, 28)
        )
        
        # Assert
        assert len(events_in_range) == 1
        assert len(events_out_range) == 0
    
    @pytest.mark.asyncio
    async def test_update_event(self, calendar_service: CalendarServiceInterface, sample_event: CalendarEvent):
        """測試更新事件"""
        # Arrange
        created_event = await calendar_service.create_event(sample_event)
        
        # Act
        updated_data = CalendarEvent(
            user_id=sample_event.user_id,
            title="Updated Title",
            description="Updated Description",
            start_date=date(2025, 1, 20),
            end_date=date(2025, 1, 21),
            event_type="meeting"
        )
        updated_event = await calendar_service.update_event(created_event.id, updated_data)
        
        # Assert
        assert updated_event.id == created_event.id
        assert updated_event.title == "Updated Title"
        assert updated_event.description == "Updated Description"
        assert updated_event.start_date == date(2025, 1, 20)
        assert updated_event.updated_at > created_event.created_at
    
    @pytest.mark.asyncio
    async def test_delete_event(self, calendar_service: CalendarServiceInterface, sample_event: CalendarEvent):
        """測試刪除事件"""
        # Arrange
        created_event = await calendar_service.create_event(sample_event)
        
        # Act
        deleted = await calendar_service.delete_event(created_event.id, sample_event.user_id)
        
        # Assert
        assert deleted is True
        
        # Verify event is deleted
        events = await calendar_service.get_events(sample_event.user_id)
        assert len(events) == 0
    
    @pytest.mark.asyncio
    async def test_delete_nonexistent_event(self, calendar_service: CalendarServiceInterface):
        """測試刪除不存在的事件"""
        # Act
        deleted = await calendar_service.delete_event("nonexistent", "user123")
        
        # Assert
        assert deleted is False
    
    @pytest.mark.asyncio
    async def test_user_isolation(self, calendar_service: CalendarServiceInterface):
        """測試用戶隔離 - 用戶只能看到自己的事件"""
        # Arrange
        user1_id = str(uuid.uuid4())
        user2_id = str(uuid.uuid4())
        
        event1 = CalendarEvent(
            user_id=user1_id,
            title="User 1 Event",
            start_date=date(2025, 1, 15),
            end_date=date(2025, 1, 16)
        )
        
        event2 = CalendarEvent(
            user_id=user2_id,
            title="User 2 Event",
            start_date=date(2025, 1, 15),
            end_date=date(2025, 1, 16)
        )
        
        # Act
        await calendar_service.create_event(event1)
        await calendar_service.create_event(event2)
        
        user1_events = await calendar_service.get_events(user1_id)
        user2_events = await calendar_service.get_events(user2_id)
        
        # Assert
        assert len(user1_events) == 1
        assert len(user2_events) == 1
        assert user1_events[0].title == "User 1 Event"
        assert user2_events[0].title == "User 2 Event"

class TestCalendarServiceBusinessLogic:
    """測試 Calendar Service 業務邏輯"""
    
    @pytest.mark.asyncio
    async def test_event_type_validation(self, calendar_service: CalendarServiceInterface):
        """測試事件類型驗證"""
        valid_types = ["trip", "gear_check", "social", "general"]
        
        for event_type in valid_types:
            event = CalendarEvent(
                user_id=str(uuid.uuid4()),
                title=f"Test {event_type}",
                start_date=date(2025, 1, 15),
                end_date=date(2025, 1, 16),
                event_type=event_type
            )
            
            created_event = await calendar_service.create_event(event)
            assert created_event.event_type == event_type
    
    @pytest.mark.asyncio
    async def test_date_validation(self, calendar_service: CalendarServiceInterface):
        """測試日期驗證 - 結束日期不能早於開始日期"""
        # 這個測試預期會失敗，因為我們還沒實作驗證邏輯
        # 這是 TDD 的 Red 階段
        
        invalid_event = CalendarEvent(
            user_id=str(uuid.uuid4()),
            title="Invalid Date Event",
            start_date=date(2025, 1, 20),
            end_date=date(2025, 1, 15),  # 結束日期早於開始日期
            event_type="general"
        )
        
        # 目前的 Mock 實作不會驗證這個，所以測試會通過
        # 但真實實作應該要拋出異常
        with pytest.raises(ValueError, match="End date cannot be before start date"):
            await calendar_service.create_event(invalid_event)

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
