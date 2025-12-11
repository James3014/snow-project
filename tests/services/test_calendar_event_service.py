"""
CalendarService Tests - Shared Calendar Infrastructure
Tests for CalendarService use cases.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../platform/user_core'))

import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import Mock
from uuid import UUID

import pytest

from services.calendar_service import CalendarService
from domain.calendar.calendar_event import CalendarEvent
from domain.calendar.enums import EventType


@pytest.fixture
def user_id():
    return uuid.uuid4()


@pytest.fixture
def mock_repo():
    return Mock()


@pytest.fixture
def service(mock_repo):
    return CalendarService(mock_repo)


class TestCalendarServiceCreateEvent:
    """Test create_event use case."""

    def test_create_event_calls_repo_add(self, service, mock_repo, user_id):
        mock_repo.add.return_value = Mock(id=uuid.uuid4())
        start = datetime.now(timezone.utc) + timedelta(days=30)
        end = start + timedelta(days=5)

        service.create_event(
            user_id=user_id,
            event_type=EventType.TRIP,
            title="苗場滑雪",
            start_date=start,
            end_date=end,
            source_app="trip_planning",
            source_id="trip_123",
        )

        mock_repo.add.assert_called_once()
        event_arg = mock_repo.add.call_args[0][0]
        assert event_arg.title == "苗場滑雪"
        assert event_arg.type == EventType.TRIP

    def test_create_all_day_event(self, service, mock_repo, user_id):
        mock_repo.add.return_value = Mock()
        start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=30)
        end = start + timedelta(days=5)

        service.create_event(
            user_id=user_id,
            event_type=EventType.TRIP,
            title="滑雪行程",
            start_date=start,
            end_date=end,
            source_app="trip_planning",
            source_id="trip_456",
            all_day=True,
        )

        event_arg = mock_repo.add.call_args[0][0]
        assert event_arg.all_day is True


class TestCalendarServiceListEvents:
    """Test list_events use case."""

    def test_list_events_calls_repo(self, service, mock_repo, user_id):
        mock_repo.list_for_user.return_value = []

        result = service.list_events(user_id=user_id)

        mock_repo.list_for_user.assert_called_once()
        assert result == []

    def test_list_events_for_source(self, service, mock_repo):
        mock_repo.list_for_source.return_value = []

        result = service.list_events_for_source(
            source_app="trip_planning",
            source_id="trip_123",
        )

        mock_repo.list_for_source.assert_called_once_with(
            source_app="trip_planning",
            source_id="trip_123",
        )
        assert result == []


class TestCalendarServiceUpdateEvent:
    """Test update_event use case."""

    def test_update_event_success(self, service, mock_repo, user_id):
        event_id = uuid.uuid4()
        start = datetime.now(timezone.utc) + timedelta(days=30)
        end = start + timedelta(days=5)
        mock_event = CalendarEvent.create(
            user_id=user_id,
            type=EventType.TRIP,
            title="原標題",
            start_date=start,
            end_date=end,
            source_app="trip_planning",
            source_id="trip_123",
        )
        mock_repo.get.return_value = mock_event
        mock_repo.update.return_value = Mock(title="新標題")

        result = service.update_event(event_id, title="新標題")

        mock_repo.update.assert_called_once()

    def test_update_event_not_found_raises(self, service, mock_repo):
        mock_repo.get.return_value = None

        with pytest.raises(ValueError, match="Event not found"):
            service.update_event(uuid.uuid4(), title="新標題")


class TestCalendarServiceDeleteEvent:
    """Test delete_event use case."""

    def test_delete_event_calls_repo(self, service, mock_repo):
        event_id = uuid.uuid4()
        mock_repo.delete.return_value = True

        result = service.delete_event(event_id)

        mock_repo.delete.assert_called_once_with(event_id)
        assert result is True

    def test_delete_events_for_source(self, service, mock_repo):
        mock_repo.delete_by_source.return_value = 3

        result = service.delete_events_for_source(
            source_app="trip_planning",
            source_id="trip_123",
        )

        mock_repo.delete_by_source.assert_called_once_with("trip_planning", "trip_123")
        assert result == 3
