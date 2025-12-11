"""
Calendar Service Tests - GEAR Event Support
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../platform/user_core'))

import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock

import pytest

from services.calendar_service import CalendarService
from domain.calendar.enums import EventType


@pytest.fixture
def user_id():
    return uuid.uuid4()


@pytest.fixture
def mock_repo():
    return Mock()


@pytest.fixture
def calendar_service(mock_repo):
    return CalendarService(mock_repo)


class TestCalendarServiceGearSupport:
    """Test CalendarService supports GEAR event type."""

    def test_create_gear_inspection_event(self, calendar_service, mock_repo, user_id):
        """Test creating a gear inspection reminder event."""
        mock_event = Mock()
        mock_event.id = uuid.uuid4()
        mock_event.type = EventType.GEAR
        mock_event.title = "裝備檢查提醒"
        mock_event.source_app = "gear_ops"
        mock_repo.add.return_value = mock_event

        event = calendar_service.create_event(
            user_id=user_id,
            event_type=EventType.GEAR,
            title="裝備檢查提醒",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc) + timedelta(hours=1),
            source_app="gear_ops",
            source_id="gear_123",
            description="單板檢查"
        )

        assert event.type == EventType.GEAR
        assert event.source_app == "gear_ops"
        mock_repo.add.assert_called_once()

    def test_create_gear_maintenance_event(self, calendar_service, mock_repo, user_id):
        """Test creating a gear maintenance event."""
        mock_event = Mock()
        mock_event.id = uuid.uuid4()
        mock_event.type = EventType.GEAR
        mock_event.title = "裝備保養"
        mock_event.source_app = "gear_ops"
        mock_repo.add.return_value = mock_event

        event = calendar_service.create_event(
            user_id=user_id,
            event_type=EventType.GEAR,
            title="裝備保養",
            start_date=datetime.now(timezone.utc) + timedelta(days=7),
            end_date=datetime.now(timezone.utc) + timedelta(days=7, hours=2),
            source_app="gear_ops",
            source_id="maintenance_456",
            description="雪板打蠟"
        )

        assert event.type == EventType.GEAR
        assert event.title == "裝備保養"
        mock_repo.add.assert_called_once()

    def test_create_gear_trade_meeting_event(self, calendar_service, mock_repo, user_id):
        """Test creating a gear trade meeting event."""
        mock_event = Mock()
        mock_event.id = uuid.uuid4()
        mock_event.type = EventType.GEAR
        mock_event.title = "裝備交易會面"
        mock_event.source_app = "gear_ops"
        mock_repo.add.return_value = mock_event

        event = calendar_service.create_event(
            user_id=user_id,
            event_type=EventType.GEAR,
            title="裝備交易會面",
            start_date=datetime.now(timezone.utc) + timedelta(days=3),
            end_date=datetime.now(timezone.utc) + timedelta(days=3, hours=1),
            source_app="gear_ops",
            source_id="trade_789",
            description="台北車站交易雪板"
        )

        assert event.type == EventType.GEAR
        assert event.title == "裝備交易會面"
        mock_repo.add.assert_called_once()

    def test_list_gear_events_by_source(self, calendar_service, mock_repo, user_id):
        """Test listing gear events by source app."""
        mock_events = [
            Mock(type=EventType.GEAR, source_app="gear_ops", source_id="gear_1"),
            Mock(type=EventType.GEAR, source_app="gear_ops", source_id="gear_2")
        ]
        mock_repo.list_for_source.return_value = mock_events

        events = calendar_service.list_events_for_source(
            source_app="gear_ops",
            source_id="gear_1"
        )

        mock_repo.list_for_source.assert_called_once_with(
            source_app="gear_ops",
            source_id="gear_1"
        )
        assert len(events) == 2
