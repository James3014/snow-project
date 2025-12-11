import datetime as dt
import uuid

from fastapi.testclient import TestClient

from platform.user_core.api.main import app
from platform.user_core.api.calendar import get_event_service
from platform.user_core.services.calendar_service import CalendarEventService
from platform.user_core.domain.calendar.calendar_event import CalendarEvent
from platform.user_core.domain.calendar.enums import EventType
from platform.user_core.services.auth_dependencies import get_current_user as real_get_current_user


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


fake_repo = FakeEventRepo()
fake_service = CalendarEventService(fake_repo)
fake_user_id = uuid.uuid4()


def override_event_service():
    return fake_service


def fake_user():
    class User:
        user_id = fake_user_id
    return User()


app.dependency_overrides[get_event_service] = override_event_service
app.dependency_overrides[real_get_current_user] = fake_user

client = TestClient(app)


def aware_str(year, month, day):
    return dt.datetime(year, month, day, tzinfo=dt.timezone.utc).isoformat()


def test_event_create_and_update_api():
    payload = {
        "type": EventType.TRIP.value,
        "title": "Event",
        "start_date": aware_str(2025, 4, 1),
        "end_date": aware_str(2025, 4, 2),
    }
    resp = client.post("/calendar/events", json=payload)
    assert resp.status_code == 201
    event_id = resp.json()["id"]

    resp = client.patch(f"/calendar/events/{event_id}", json={"title": "Updated", "reminders": [{"type": "email"}]})
    assert resp.status_code == 200
