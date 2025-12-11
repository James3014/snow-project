import datetime as dt
import uuid

from platform.user_core.domain.calendar.trip import Trip
from platform.user_core.services.calendar_service import TripService


class FakeTripRepo:
    def __init__(self):
        self.storage: dict[uuid.UUID, Trip] = {}

    def add(self, trip: Trip) -> Trip:
        self.storage[trip.id] = trip
        return trip

    def list_for_user(self, user_id: uuid.UUID):
        return [t for t in self.storage.values() if t.user_id == user_id]


def test_trip_service_creates_trip():
    repo = FakeTripRepo()
    service = TripService(repo)
    user_id = uuid.uuid4()
    trip = service.create_trip(
        user_id=user_id,
        title="My Trip",
        start_date=dt.datetime(2025, 1, 1, tzinfo=dt.timezone.utc),
        end_date=dt.datetime(2025, 1, 2, tzinfo=dt.timezone.utc),
    )
    assert trip in repo.storage.values()
    assert trip.user_id == user_id


def test_trip_service_lists_trips():
    repo = FakeTripRepo()
    service = TripService(repo)
    user_id = uuid.uuid4()
    service.create_trip(
        user_id=user_id,
        title="Trip1",
        start_date=dt.datetime(2025, 1, 1, tzinfo=dt.timezone.utc),
        end_date=dt.datetime(2025, 1, 2, tzinfo=dt.timezone.utc),
    )
    trips = service.list_trips(user_id=user_id)
    assert len(trips) == 1
