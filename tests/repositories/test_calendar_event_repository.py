"""
TODO-CAL-006: CalendarEventRepository Tests
Tests for CalendarEventRepository CRUD operations.
"""
import uuid
from datetime import datetime, timedelta, timezone, time

import pytest

from repositories.calendar_repository import CalendarEventRepository
from domain.calendar.calendar_event import CalendarEvent
from domain.calendar.enums import EventType


@pytest.fixture
def user_id():
    return uuid.uuid4()


@pytest.fixture
def repo(db_session):
    return CalendarEventRepository(db_session)


@pytest.fixture
def sample_event(user_id):
    start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=30)
    end = start + timedelta(days=5)
    return CalendarEvent.create(
        user_id=user_id,
        type=EventType.TRIP,
        title="苗場滑雪",
        start_date=start,
        end_date=end,
        all_day=True,
        trip_id=uuid.uuid4(),
        resort_id="naeba",
    )


class TestCalendarEventRepositoryAdd:
    """Test add operation."""

    def test_add_event_returns_event_with_id(self, repo, sample_event):
        result = repo.add(sample_event)
        assert result.id == sample_event.id
        assert result.title == "苗場滑雪"

    def test_add_event_persists_all_fields(self, repo, sample_event):
        result = repo.add(sample_event)
        assert result.user_id == sample_event.user_id
        assert result.type == EventType.TRIP
        assert result.resort_id == "naeba"
        assert result.all_day is True


class TestCalendarEventRepositoryGet:
    """Test get operation."""

    def test_get_existing_event(self, repo, sample_event):
        repo.add(sample_event)
        result = repo.get(sample_event.id)
        assert result is not None
        assert result.id == sample_event.id

    def test_get_nonexistent_event_returns_none(self, repo):
        result = repo.get(uuid.uuid4())
        assert result is None


class TestCalendarEventRepositoryListForUser:
    """Test list_for_user operation."""

    def test_list_for_user_returns_user_events(self, repo, user_id):
        start1 = datetime.now(timezone.utc) + timedelta(days=10)
        start2 = datetime.now(timezone.utc) + timedelta(days=20)
        event1 = CalendarEvent.create(
            user_id=user_id,
            type=EventType.REMINDER,
            title="提醒1",
            start_date=start1,
            end_date=start1 + timedelta(hours=1),
        )
        event2 = CalendarEvent.create(
            user_id=user_id,
            type=EventType.REMINDER,
            title="提醒2",
            start_date=start2,
            end_date=start2 + timedelta(hours=1),
        )
        repo.add(event1)
        repo.add(event2)

        results = repo.list_for_user(user_id)
        assert len(results) == 2

    def test_list_for_user_excludes_other_users(self, repo, user_id):
        other_user = uuid.uuid4()
        start1 = datetime.now(timezone.utc) + timedelta(days=10)
        start2 = datetime.now(timezone.utc) + timedelta(days=20)
        event1 = CalendarEvent.create(
            user_id=user_id,
            type=EventType.REMINDER,
            title="我的提醒",
            start_date=start1,
            end_date=start1 + timedelta(hours=1),
        )
        event2 = CalendarEvent.create(
            user_id=other_user,
            type=EventType.REMINDER,
            title="別人的提醒",
            start_date=start2,
            end_date=start2 + timedelta(hours=1),
        )
        repo.add(event1)
        repo.add(event2)

        results = repo.list_for_user(user_id)
        assert len(results) == 1
        assert results[0].title == "我的提醒"


class TestCalendarEventRepositoryUpdate:
    """Test update operation."""

    def test_update_event_title(self, repo, sample_event):
        repo.add(sample_event)
        updated = sample_event.update(title="更新後的標題")
        result = repo.update(updated)
        assert result.title == "更新後的標題"

    def test_update_event_reminders(self, repo, sample_event):
        repo.add(sample_event)
        updated = sample_event.update(reminders=({"type": "1d"},))
        result = repo.update(updated)
        assert len(result.reminders) == 1

    def test_update_nonexistent_event_raises(self, repo, sample_event):
        with pytest.raises(ValueError, match="Event not found"):
            repo.update(sample_event)
