"""
Advanced Gear-Calendar Integration Tests
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../platform/user_core'))

import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock

import pytest

from services.gear_service import GearService
from domain.calendar.enums import EventType


@pytest.fixture
def user_id():
    return uuid.uuid4()


@pytest.fixture
def gear_id():
    return uuid.uuid4()


@pytest.fixture
def buyer_id():
    return uuid.uuid4()


@pytest.fixture
def mock_gear_repo():
    return Mock()


@pytest.fixture
def mock_calendar_service():
    return Mock()


@pytest.fixture
def gear_service(mock_gear_repo, mock_calendar_service):
    return GearService(mock_gear_repo, mock_calendar_service)


class TestAdvancedGearCalendarIntegration:
    """Test advanced gear-calendar integration features."""

    def test_inspection_workflow_creates_next_reminder(self, gear_service, mock_gear_repo, mock_calendar_service, user_id, gear_id):
        """Test complete inspection workflow creates appropriate next reminder."""
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
        
        # Setup mock reminder for next inspection
        mock_reminder = Mock()
        mock_reminder.id = uuid.uuid4()
        mock_gear_repo.create_reminder.return_value = mock_reminder
        
        # Setup mock calendar event
        mock_event = Mock()
        mock_calendar_service.create_event.return_value = mock_event
        
        # Execute inspection with "needs_attention" status
        result = gear_service.complete_inspection_with_calendar(
            gear_item_id=gear_id,
            inspector_user_id=user_id,
            checklist={"edge": "good", "base": "needs_wax"},
            overall_status="needs_attention",
            notes="需要打蠟"
        )
        
        # Verify inspection was created
        assert result == mock_inspection
        mock_gear_repo.create_inspection.assert_called_once()
        
        # Verify next inspection reminder was created
        mock_gear_repo.create_reminder.assert_called_once()
        reminder_call = mock_gear_repo.create_reminder.call_args
        assert reminder_call.kwargs['reminder_type'] == "inspection"
        
        # Verify calendar event was created
        mock_calendar_service.create_event.assert_called_once()
        event_call = mock_calendar_service.create_event.call_args
        assert event_call.kwargs['event_type'] == EventType.GEAR
        assert event_call.kwargs['source_app'] == "gear_ops"

    def test_trade_meeting_creates_events_for_both_parties(self, gear_service, mock_gear_repo, mock_calendar_service, user_id, gear_id, buyer_id):
        """Test trade meeting creates calendar events for both seller and buyer."""
        # Setup mock gear item (seller owns it)
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
        
        # Execute trade meeting scheduling
        meeting_time = datetime.now(timezone.utc) + timedelta(days=3)
        result = gear_service.schedule_trade_meeting(
            gear_item_id=gear_id,
            buyer_id=buyer_id,
            meeting_time=meeting_time,
            location="台北車站",
            notes="請帶現金"
        )
        
        # Verify meeting was created
        assert result["meeting"] == mock_meeting
        mock_gear_repo.create_trade_meeting.assert_called_once()
        
        # Verify both calendar events were created
        assert mock_calendar_service.create_event.call_count == 2
        
        # Verify events are for correct users
        calls = mock_calendar_service.create_event.call_args_list
        seller_call = calls[0].kwargs
        buyer_call = calls[1].kwargs
        
        assert seller_call['user_id'] == user_id  # seller
        assert buyer_call['user_id'] == buyer_id  # buyer
        assert seller_call['event_type'] == EventType.GEAR
        assert buyer_call['event_type'] == EventType.GEAR
        
        # Verify event details
        assert "裝備交易會面" in seller_call['title']
        assert "裝備交易會面" in buyer_call['title']
        assert "台北車站" in seller_call['description']
        assert "台北車站" in buyer_call['description']

    def test_inspection_status_determines_next_reminder_timing(self, gear_service, mock_gear_repo, mock_calendar_service, user_id, gear_id):
        """Test different inspection statuses create reminders with appropriate timing."""
        # Setup mock gear item
        mock_gear_item = Mock()
        mock_gear_item.id = gear_id
        mock_gear_item.user_id = user_id
        mock_gear_item.name = "測試雪板"
        mock_gear_repo.get_gear_item.return_value = mock_gear_item
        
        # Setup mocks
        mock_inspection = Mock()
        mock_reminder = Mock()
        mock_event = Mock()
        mock_gear_repo.create_inspection.return_value = mock_inspection
        mock_gear_repo.create_reminder.return_value = mock_reminder
        mock_calendar_service.create_event.return_value = mock_event
        
        # Test "unsafe" status (should schedule in 1 day)
        gear_service.complete_inspection_with_calendar(
            gear_item_id=gear_id,
            inspector_user_id=user_id,
            checklist={"edge": "damaged"},
            overall_status="unsafe",
            notes="邊刃損壞"
        )
        
        # Verify reminder message mentions the status
        reminder_call = mock_gear_repo.create_reminder.call_args
        assert "unsafe" in reminder_call.kwargs['message']
        
        # Reset mocks for next test
        mock_gear_repo.reset_mock()
        mock_calendar_service.reset_mock()
        
        # Test "good" status (should schedule in 30 days)
        gear_service.complete_inspection_with_calendar(
            gear_item_id=gear_id,
            inspector_user_id=user_id,
            checklist={"edge": "excellent", "base": "good"},
            overall_status="good",
            notes="狀況良好"
        )
        
        # Verify reminder message mentions the status
        reminder_call = mock_gear_repo.create_reminder.call_args
        assert "good" in reminder_call.kwargs['message']
