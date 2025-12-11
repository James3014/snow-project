"""
TDD: CalendarEvent Domain Tests
TODO-CAL-002
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../platform/user_core'))

import pytest
import uuid
from datetime import datetime, timezone, timedelta, time

from domain.calendar.calendar_event import CalendarEvent
from domain.calendar.enums import EventType


class TestCalendarEventCreate:
    """測試 CalendarEvent.create()"""

    def test_create_trip_event(self):
        """建立行程事件"""
        user_id = uuid.uuid4()
        start = datetime.now(timezone.utc)
        end = start + timedelta(hours=2)

        event = CalendarEvent.create(
            user_id=user_id,
            type=EventType.TRIP,
            title="苗場滑雪",
            start_date=start,
            end_date=end,
        )

        assert event.user_id == user_id
        assert event.type == EventType.TRIP
        assert event.title == "苗場滑雪"
        assert event.all_day is False

    def test_create_all_day_event(self):
        """建立全天事件"""
        user_id = uuid.uuid4()
        start = datetime(2025, 2, 15, 0, 0, tzinfo=timezone.utc)
        end = datetime(2025, 2, 15, 23, 59, tzinfo=timezone.utc)

        event = CalendarEvent.create(
            user_id=user_id,
            type=EventType.REMINDER,
            title="裝備檢查日",
            start_date=start,
            end_date=end,
            all_day=True,
        )

        assert event.all_day is True

    def test_create_with_participants(self):
        """建立有參與者的事件"""
        user_id = uuid.uuid4()
        participant1 = uuid.uuid4()
        participant2 = uuid.uuid4()
        start = datetime.now(timezone.utc)
        end = start + timedelta(hours=3)

        event = CalendarEvent.create(
            user_id=user_id,
            type=EventType.MATCHING,
            title="雪伴媒合",
            start_date=start,
            end_date=end,
            participants=[participant1, participant2],
        )

        assert len(event.participants) == 2
        assert participant1 in event.participants

    def test_create_with_reminders(self):
        """建立有提醒的事件"""
        user_id = uuid.uuid4()
        start = datetime.now(timezone.utc)
        end = start + timedelta(days=1)

        event = CalendarEvent.create(
            user_id=user_id,
            type=EventType.GEAR,
            title="裝備保養",
            start_date=start,
            end_date=end,
            reminders=[{"type": "email", "minutes": 1440}],
        )

        assert len(event.reminders) == 1
        assert event.reminders[0]["type"] == "email"

    def test_create_fails_without_timezone(self):
        """日期必須有時區"""
        user_id = uuid.uuid4()
        start = datetime.now()  # naive
        end = start + timedelta(hours=2)

        with pytest.raises(ValueError, match="timezone-aware"):
            CalendarEvent.create(
                user_id=user_id,
                type=EventType.TRIP,
                title="錯誤事件",
                start_date=start,
                end_date=end,
            )

    def test_create_fails_when_end_before_start(self):
        """結束時間早於開始時間應失敗"""
        user_id = uuid.uuid4()
        start = datetime.now(timezone.utc)
        end = start - timedelta(hours=1)

        with pytest.raises(ValueError, match="end_date must be >= start_date"):
            CalendarEvent.create(
                user_id=user_id,
                type=EventType.TRIP,
                title="錯誤事件",
                start_date=start,
                end_date=end,
            )

    def test_create_all_day_fails_when_not_midnight(self):
        """全天事件必須從 00:00 開始"""
        user_id = uuid.uuid4()
        start = datetime(2025, 2, 15, 10, 30, tzinfo=timezone.utc)  # 不是 00:00
        end = datetime(2025, 2, 15, 23, 59, tzinfo=timezone.utc)

        with pytest.raises(ValueError, match="all-day events must start at 00:00"):
            CalendarEvent.create(
                user_id=user_id,
                type=EventType.REMINDER,
                title="錯誤全天事件",
                start_date=start,
                end_date=end,
                all_day=True,
            )


class TestCalendarEventUpdate:
    """測試 CalendarEvent.update()"""

    def _create_event(self):
        return CalendarEvent.create(
            user_id=uuid.uuid4(),
            type=EventType.TRIP,
            title="原始事件",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc) + timedelta(hours=2),
        )

    def test_update_title(self):
        """更新標題"""
        event = self._create_event()
        updated = event.update(title="新標題")

        assert updated.title == "新標題"
        assert updated.id == event.id

    def test_update_reminders(self):
        """更新提醒"""
        event = self._create_event()
        new_reminders = ({"type": "push", "minutes": 30},)
        updated = event.update(reminders=new_reminders)

        assert updated.reminders == new_reminders

    def test_update_fails_when_end_before_start(self):
        """更新後結束時間早於開始時間應失敗"""
        event = self._create_event()
        new_end = event.start_date - timedelta(hours=1)

        with pytest.raises(ValueError, match="end_date must be >= start_date"):
            event.update(end_date=new_end)
