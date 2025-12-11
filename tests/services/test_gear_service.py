"""
Gear Service Tests - Calendar Integration
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../platform/user_core'))

import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock, patch

import pytest

from services.gear_service import GearService
from services.calendar_service import CalendarService
from domain.calendar.enums import EventType


@pytest.fixture
def user_id():
    return uuid.uuid4()


@pytest.fixture
def gear_id():
    return uuid.uuid4()


@pytest.fixture
def mock_gear_repo():
    return Mock()


@pytest.fixture
def mock_calendar_service():
    return Mock(spec=CalendarService)


@pytest.fixture
def gear_service(mock_gear_repo, mock_calendar_service):
    return GearService(mock_gear_repo, mock_calendar_service)


class TestGearService:
    """Test GearService calendar integration."""

    def test_gear_service_initialization(self, mock_gear_repo, mock_calendar_service):
        """Test GearService can be initialized with dependencies."""
        service = GearService(mock_gear_repo, mock_calendar_service)
        
        assert service.gear_repo == mock_gear_repo
        assert service.calendar_service == mock_calendar_service

    def test_create_reminder_with_calendar(self, gear_service, mock_gear_repo, mock_calendar_service, user_id, gear_id):
        """Test creating reminder creates both GearReminder and CalendarEvent."""
        # Setup mock gear item
        mock_gear_item = Mock()
        mock_gear_item.id = gear_id
        mock_gear_item.user_id = user_id
        mock_gear_item.name = "測試雪板"
        mock_gear_repo.get_gear_item.return_value = mock_gear_item
        
        # Setup mock reminder
        mock_reminder = Mock()
        mock_reminder.id = uuid.uuid4()
        mock_reminder.gear_item_id = gear_id
        mock_reminder.reminder_type = "inspection"
        mock_gear_repo.create_reminder.return_value = mock_reminder
        
        # Setup mock calendar event
        mock_event = Mock()
        mock_event.id = uuid.uuid4()
        mock_event.type = EventType.GEAR
        mock_calendar_service.create_event.return_value = mock_event
        
        # Execute
        scheduled_at = datetime.now(timezone.utc) + timedelta(days=7)
        result = gear_service.create_reminder_with_calendar(
            gear_item_id=gear_id,
            reminder_type="inspection",
            scheduled_at=scheduled_at,
            message="定期檢查提醒"
        )
        
        # Verify
        assert result == mock_reminder
        mock_gear_repo.get_gear_item.assert_called_once_with(gear_id)
        mock_gear_repo.create_reminder.assert_called_once()
        mock_calendar_service.create_event.assert_called_once()
        
        # Verify calendar event parameters
        call_kwargs = mock_calendar_service.create_event.call_args.kwargs
        assert call_kwargs['user_id'] == user_id
        assert call_kwargs['event_type'] == EventType.GEAR
        assert call_kwargs['source_app'] == "gear_ops"
    def test_complete_inspection_with_calendar(self, gear_service, mock_gear_repo, mock_calendar_service, user_id, gear_id):
        """Test completing inspection creates next inspection reminder."""
        # Setup mock gear item
        mock_gear_item = Mock()
        mock_gear_item.id = gear_id
        mock_gear_item.user_id = user_id
        mock_gear_item.name = "測試雪板"
        mock_gear_repo.get_gear_item.return_value = mock_gear_item
        
        # Setup mock inspection
        mock_inspection = Mock()
        mock_inspection.id = uuid.uuid4()
        mock_gear_repo.create_inspection.return_value = mock_inspection
        
        # Setup mock reminder
        mock_reminder = Mock()
        mock_reminder.id = uuid.uuid4()
        mock_gear_repo.create_reminder.return_value = mock_reminder
        
        # Setup mock calendar event
        mock_event = Mock()
        mock_calendar_service.create_event.return_value = mock_event
        
        # Execute
        result = gear_service.complete_inspection_with_calendar(
            gear_item_id=gear_id,
            inspector_user_id=user_id,
            checklist={"edge": "good", "base": "needs_wax"},
            overall_status="needs_attention",
            notes="需要打蠟"
        )
        
        # Verify
        assert result == mock_inspection
        mock_gear_repo.create_inspection.assert_called_once()
        mock_gear_repo.create_reminder.assert_called_once()
        mock_calendar_service.create_event.assert_called_once()

    def test_schedule_trade_meeting(self, gear_service, mock_gear_repo, mock_calendar_service, user_id, gear_id):
        """Test scheduling trade meeting creates calendar events for both parties."""
        buyer_id = uuid.uuid4()
        
        # Setup mock gear item
        mock_gear_item = Mock()
        mock_gear_item.id = gear_id
        mock_gear_item.user_id = user_id  # seller
        mock_gear_item.name = "測試雪板"
        mock_gear_repo.get_gear_item.return_value = mock_gear_item
        
        # Setup mock meeting
        mock_meeting = Mock()
        mock_meeting.id = uuid.uuid4()
        mock_gear_repo.create_trade_meeting.return_value = mock_meeting
        
        # Setup mock calendar events
        mock_seller_event = Mock()
        mock_buyer_event = Mock()
        mock_calendar_service.create_event.side_effect = [mock_seller_event, mock_buyer_event]
        
        # Execute
        meeting_time = datetime.now(timezone.utc) + timedelta(days=3)
        result = gear_service.schedule_trade_meeting(
            gear_item_id=gear_id,
            buyer_id=buyer_id,
            meeting_time=meeting_time,
            location="台北車站",
            notes="請帶現金"
        )
        
        # Verify
        assert result["meeting"] == mock_meeting
        assert result["seller_event"] == mock_seller_event
        assert result["buyer_event"] == mock_buyer_event
        
        mock_gear_repo.create_trade_meeting.assert_called_once()
        assert mock_calendar_service.create_event.call_count == 2
        
        # Verify both events created with correct user_ids
        calls = mock_calendar_service.create_event.call_args_list
        seller_call = calls[0].kwargs
        buyer_call = calls[1].kwargs
        
        assert seller_call['user_id'] == user_id  # seller
        assert buyer_call['user_id'] == buyer_id  # buyer
        assert seller_call['event_type'] == EventType.GEAR
        assert buyer_call['event_type'] == EventType.GEAR
