"""
Gear Calendar Integration Tests
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../platform/user_core'))

import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock

import pytest

from services.gear_service import GearService
from services.calendar_service import CalendarService
from repositories.calendar_repository import CalendarEventRepository
from domain.calendar.enums import EventType


@pytest.fixture
def user_id():
    return uuid.uuid4()


@pytest.fixture
def gear_id():
    return uuid.uuid4()


class TestGearCalendarIntegration:
    """Test integration between Gear Service and Calendar Service."""

    def test_gear_reminder_creates_calendar_event_integration(self):
        """Integration test: Creating gear reminder should create calendar event."""
        # Setup mock repositories
        mock_gear_repo = Mock()
        mock_calendar_repo = Mock(spec=CalendarEventRepository)
        
        # Setup mock gear item
        mock_gear_item = Mock()
        mock_gear_item.id = uuid.uuid4()
        mock_gear_item.user_id = uuid.uuid4()
        mock_gear_item.name = "測試雪板"
        mock_gear_repo.get_gear_item.return_value = mock_gear_item
        
        # Setup mock reminder
        mock_reminder = Mock()
        mock_reminder.id = uuid.uuid4()
        mock_reminder.gear_item_id = mock_gear_item.id
        mock_reminder.reminder_type = "inspection"
        mock_gear_repo.create_reminder.return_value = mock_reminder
        
        # Setup mock calendar event
        mock_calendar_event = Mock()
        mock_calendar_event.id = uuid.uuid4()
        mock_calendar_event.type = EventType.GEAR
        mock_calendar_event.title = "裝備inspection提醒"
        mock_calendar_event.source_app = "gear_ops"
        mock_calendar_event.source_id = str(mock_reminder.id)
        mock_calendar_repo.add.return_value = mock_calendar_event
        
        # Create services
        calendar_service = CalendarService(mock_calendar_repo)
        gear_service = GearService(mock_gear_repo, calendar_service)
        
        # Execute
        scheduled_at = datetime.now(timezone.utc) + timedelta(days=7)
        result = gear_service.create_reminder_with_calendar(
            gear_item_id=mock_gear_item.id,
            reminder_type="inspection",
            scheduled_at=scheduled_at,
            message="定期檢查提醒"
        )
        
        # Verify gear reminder was created
        assert result == mock_reminder
        mock_gear_repo.get_gear_item.assert_called_once_with(mock_gear_item.id)
        mock_gear_repo.create_reminder.assert_called_once()
        
        # Verify calendar event was created
        mock_calendar_repo.add.assert_called_once()
        event_arg = mock_calendar_repo.add.call_args[0][0]
        assert event_arg.type == EventType.GEAR
        assert event_arg.source_app == "gear_ops"
        assert event_arg.source_id == str(mock_reminder.id)
        assert event_arg.user_id == mock_gear_item.user_id

    def test_multiple_gear_events_integration(self):
        """Integration test: Multiple gear operations create separate calendar events."""
        # Setup mock repositories
        mock_gear_repo = Mock()
        mock_calendar_repo = Mock(spec=CalendarEventRepository)
        
        # Setup mock gear items
        gear1 = Mock(id=uuid.uuid4(), user_id=uuid.uuid4(), name="雪板1")
        gear2 = Mock(id=uuid.uuid4(), user_id=uuid.uuid4(), name="雪板2")
        mock_gear_repo.get_gear_item.side_effect = [gear1, gear2]
        
        # Setup mock reminders
        reminder1 = Mock(id=uuid.uuid4(), gear_item_id=gear1.id, reminder_type="inspection")
        reminder2 = Mock(id=uuid.uuid4(), gear_item_id=gear2.id, reminder_type="maintenance")
        mock_gear_repo.create_reminder.side_effect = [reminder1, reminder2]
        
        # Setup mock calendar events
        event1 = Mock(id=uuid.uuid4(), type=EventType.GEAR, source_id=str(reminder1.id))
        event2 = Mock(id=uuid.uuid4(), type=EventType.GEAR, source_id=str(reminder2.id))
        mock_calendar_repo.add.side_effect = [event1, event2]
        
        # Create services
        calendar_service = CalendarService(mock_calendar_repo)
        gear_service = GearService(mock_gear_repo, calendar_service)
        
        # Execute multiple operations
        scheduled_at1 = datetime.now(timezone.utc) + timedelta(days=7)
        scheduled_at2 = datetime.now(timezone.utc) + timedelta(days=14)
        
        result1 = gear_service.create_reminder_with_calendar(
            gear_item_id=gear1.id,
            reminder_type="inspection",
            scheduled_at=scheduled_at1
        )
        
        result2 = gear_service.create_reminder_with_calendar(
            gear_item_id=gear2.id,
            reminder_type="maintenance",
            scheduled_at=scheduled_at2
        )
        
        # Verify both operations succeeded
        assert result1 == reminder1
        assert result2 == reminder2
        
        # Verify both calendar events were created
        assert mock_calendar_repo.add.call_count == 2
        
        # Verify event details
        event1_arg = mock_calendar_repo.add.call_args_list[0][0][0]
        event2_arg = mock_calendar_repo.add.call_args_list[1][0][0]
        
        assert event1_arg.type == EventType.GEAR
        assert event2_arg.type == EventType.GEAR
        assert event1_arg.source_id == str(reminder1.id)
        assert event2_arg.source_id == str(reminder2.id)
