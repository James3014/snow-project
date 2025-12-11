import datetime as dt
import uuid

from fastapi.testclient import TestClient

from platform.user_core.api.main import app
from platform.user_core.api.calendar import get_trip_service
from platform.user_core.services.calendar_service import TripService
from platform.user_core.domain.calendar.trip import Trip
from platform.user_core.services.auth_dependencies import get_current_user as real_get_current_user


class FakeTripRepo:
    def __init__(self):
        self.storage = []

    def add(self, trip: Trip) -> Trip:
        self.storage.append(trip)
        return trip

    def list_for_user(self, user_id: uuid.UUID):
        return [t for t in self.storage if t.user_id == user_id]


fake_repo = FakeTripRepo()
fake_service = TripService(fake_repo)
fake_user_id = uuid.uuid4()


def override_service():
    return fake_service


def fake_user():
    class User:
        user_id = fake_user_id
    return User()


app.dependency_overrides[get_trip_service] = override_service
app.dependency_overrides[real_get_current_user] = fake_user

client = TestClient(app)


def test_create_trip_api():
    payload = {
        "title": "API Trip",
        "start_date": dt.datetime(2025, 1, 1, tzinfo=dt.timezone.utc).isoformat(),
        "end_date": dt.datetime(2025, 1, 2, tzinfo=dt.timezone.utc).isoformat(),
    }
    response = client.post("/calendar/trips", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "API Trip"


def test_list_trips_api():
    response = client.get("/calendar/trips")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
