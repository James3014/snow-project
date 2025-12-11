import uuid

from fastapi.testclient import TestClient

from platform.user_core.api.main import app
from platform.user_core.api.calendar import get_buddy_service, get_matching_service
from platform.user_core.services.calendar_service import TripBuddyService, MatchingService
from platform.user_core.domain.calendar.trip_buddy import TripBuddy
from platform.user_core.domain.calendar.matching_request import MatchingRequest
from platform.user_core.services.auth_dependencies import get_current_user as real_get_current_user


class FakeBuddyRepo:
    def __init__(self):
        self.storage = {}

    def add(self, buddy: TripBuddy):
        self.storage[buddy.id] = buddy
        return buddy

    def update(self, buddy: TripBuddy):
        self.storage[buddy.id] = buddy
        return buddy

    def get(self, buddy_id: uuid.UUID):
        return self.storage.get(buddy_id)

    def list_for_trip(self, trip_id: uuid.UUID):
        return [b for b in self.storage.values() if b.trip_id == trip_id]


class FakeMatchingRepo:
    def __init__(self):
        self.storage = {}

    def add(self, req: MatchingRequest):
        self.storage[req.id] = req
        return req

    def update(self, req: MatchingRequest):
        self.storage[req.id] = req
        return req

    def get(self, req_id: uuid.UUID):
        return self.storage.get(req_id)

    def list_for_trip(self, trip_id: uuid.UUID):
        return [r for r in self.storage.values() if r.trip_id == trip_id]


fake_buddy_repo = FakeBuddyRepo()
fake_matching_repo = FakeMatchingRepo()
fake_buddy_service = TripBuddyService(fake_buddy_repo)
fake_matching_service = MatchingService(fake_matching_repo)
fake_user_id = uuid.uuid4()


def fake_user():
    class User:
        user_id = fake_user_id
    return User()


app.dependency_overrides[get_buddy_service] = lambda: fake_buddy_service
app.dependency_overrides[get_matching_service] = lambda: fake_matching_service
app.dependency_overrides[real_get_current_user] = fake_user

client = TestClient(app)


def test_buddy_invite_and_list():
    trip_id = uuid.uuid4()
    resp = client.post(f"/calendar/trips/{trip_id}/buddies", json={"user_id": str(uuid.uuid4())})
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"]
    resp = client.get(f"/calendar/trips/{trip_id}/buddies")
    assert resp.status_code == 200


def test_matching_create_and_list():
    trip_id = uuid.uuid4()
    resp = client.post(f"/calendar/trips/{trip_id}/matching", json={"preferences": {"level": "any"}})
    assert resp.status_code == 201
    resp = client.get(f"/calendar/trips/{trip_id}/matching")
    assert resp.status_code == 200
