import datetime as dt
import uuid

import pytest

from platform.user_core.domain.calendar.calendar_event import CalendarEvent
from platform.user_core.domain.calendar.enums import EventType


def aware(year, month, day, hour=0):
    return dt.datetime(year, month, day, hour, tzinfo=dt.timezone.utc)


def test_calendar_event_defaults():
    event = CalendarEvent.create(
        user_id=uuid.uuid4(),
        type=EventType.TRIP,
        title="Trip Start",
        start_date=aware(2025, 1, 1),
        end_date=aware(2025, 1, 2),
    )
    assert event.timezone == "Asia/Taipei"
    assert event.participants == ()
    assert event.reminders == ()


def test_calendar_event_all_day_requires_midnight():
    with pytest.raises(ValueError):
        CalendarEvent.create(
            user_id=uuid.uuid4(),
            type=EventType.REMINDER,
            title="bad all day",
            start_date=dt.datetime(2025, 1, 1, 9, 0, tzinfo=dt.timezone.utc),
            end_date=dt.datetime(2025, 1, 2, 9, 0, tzinfo=dt.timezone.utc),
            all_day=True,
        )
