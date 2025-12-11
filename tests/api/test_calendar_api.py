import datetime as dt
import uuid

from fastapi.testclient import TestClient

from platform.user_core.api.main import app
from platform.user_core.api.calendar import get_trip_service
from platform.user_core.services.calendar_service import TripService
from platform.user_core.domain.calendar.trip import Trip
from platform.user_core.domain.calendar.day import Day
from platform.user_core.domain.calendar.item import Item
from platform.user_core.services.auth_dependencies import get_current_user as real_get_current_user


class FakeTripRepo:
    def __init__(self):
        self.storage = []

    def add(self, trip: Trip) -> Trip:
        self.storage.append(trip)
        return trip

    def list_for_user(self, user_id: uuid.UUID):
        return [t for t in self.storage if t.user_id == user_id]


class FakeDayRepo:
    def __init__(self):
        self.storage = []

    def add(self, day: Day) -> Day:
        self.storage.append(day)
        return day

    def list_for_trip(self, trip_id: uuid.UUID):
        return [d for d in self.storage if d.trip_id == trip_id]


class FakeItemRepo:
    def __init__(self):
        self.storage = []

    def add(self, item: Item) -> Item:
        self.storage.append(item)
        return item

    def list_for_day(self, day_id: uuid.UUID):
        return [i for i in self.storage if i.day_id == day_id]


fake_repo = FakeTripRepo()
fake_day_repo = FakeDayRepo()
fake_item_repo = FakeItemRepo()
fake_service = TripService(fake_repo, day_repo=fake_day_repo, item_repo=fake_item_repo)
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


def test_add_day_api():
    trip_response = client.post(
        "/calendar/trips",
        json={
            "title": "Trip",
            "start_date": dt.datetime(2025, 2, 1, tzinfo=dt.timezone.utc).isoformat(),
            "end_date": dt.datetime(2025, 2, 2, tzinfo=dt.timezone.utc).isoformat(),
        },
    ).json()
    trip_id = trip_response["id"]
    response = client.post(f"/calendar/trips/{trip_id}/days", json={"day_index": 0, "label": "Day 1"})
    assert response.status_code == 201
    assert response.json()["label"] == "Day 1"


def test_add_item_api():
    trip_resp = client.post(
        "/calendar/trips",
        json={
            "title": "Trip2",
            "start_date": dt.datetime(2025, 3, 1, tzinfo=dt.timezone.utc).isoformat(),
            "end_date": dt.datetime(2025, 3, 2, tzinfo=dt.timezone.utc).isoformat(),
        },
    ).json()
    trip_id = trip_resp["id"]
    day_resp = client.post(f"/calendar/trips/{trip_id}/days", json={"day_index": 0, "label": "Day 1"}).json()
    payload = {
        "trip_id": trip_id,
        "day_id": day_resp["id"],
        "type": "ski",
        "title": "Day item",
    }
    response = client.post("/calendar/items", json=payload)
    assert response.status_code == 201
    items_resp = client.get(f"/calendar/days/{day_resp['id']}/items")
    assert items_resp.status_code == 200
