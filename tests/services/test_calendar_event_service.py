import datetime as dt
import uuid

from platform.user_core.domain.calendar.calendar_event import CalendarEvent
from platform.user_core.domain.calendar.enums import EventType
from platform.user_core.services.calendar_service import CalendarEventService


class FakeEventRepo:
    def __init__(self):
        self.storage = {}

    def add(self, event: CalendarEvent) -> CalendarEvent:
        self.storage[event.id] = event
        return event

    def list_for_user(self, user_id: uuid.UUID):
        return [e for e in self.storage.values() if e.user_id == user_id]

    def get(self, event_id: uuid.UUID):
        return self.storage.get(event_id)

    def update(self, event: CalendarEvent):
        self.storage[event.id] = event
        return event


def aware(year, month, day):
    return dt.datetime(year, month, day, tzinfo=dt.timezone.utc)


def create_service():
    repo = FakeEventRepo()
    service = CalendarEventService(repo)
    return service, repo


def test_create_event_service():
    service, repo = create_service()
    user_id = uuid.uuid4()
    event = service.create_event(
        user_id=user_id,
        type=EventType.TRIP,
        title="Trip start",
        start_date=aware(2025, 1, 1),
        end_date=aware(2025, 1, 2),
    )
    assert event in repo.storage.values()


def test_update_event_service():
    service, repo = create_service()
    user_id = uuid.uuid4()
    event = service.create_event(
        user_id=user_id,
        type=EventType.REMINDER,
        title="Reminder",
        start_date=aware(2025, 2, 1),
        end_date=aware(2025, 2, 1, 1),
    )
    updated = service.update_event(
        event.id,
        user_id=user_id,
        title="Updated",
        reminders=[{"type": "email", "minutes": 30}],
    )
    assert updated.title == "Updated"
    assert updated.reminders == ({"type": "email", "minutes": 30},)
