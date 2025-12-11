import datetime as dt
import uuid

from platform.user_core.domain.calendar.trip import Trip
from platform.user_core.domain.calendar.day import Day
from platform.user_core.domain.calendar.item import Item
from platform.user_core.services.calendar_service import TripService


class FakeTripRepo:
    def __init__(self):
        self.storage: dict[uuid.UUID, Trip] = {}

    def add(self, trip: Trip) -> Trip:
        self.storage[trip.id] = trip
        return trip

    def list_for_user(self, user_id: uuid.UUID):
        return [t for t in self.storage.values() if t.user_id == user_id]


class FakeDayRepo:
    def __init__(self):
        self.storage: list[Day] = []

    def add(self, day: Day) -> Day:
        self.storage.append(day)
        return day

    def list_for_trip(self, trip_id: uuid.UUID):
        return [d for d in self.storage if d.trip_id == trip_id]


class FakeItemRepo:
    def __init__(self):
        self.storage: list[Item] = []

    def add(self, item: Item) -> Item:
        self.storage.append(item)
        return item

    def list_for_day(self, day_id: uuid.UUID):
        return [i for i in self.storage if i.day_id == day_id]


def create_service():
    repo = FakeTripRepo()
    day_repo = FakeDayRepo()
    item_repo = FakeItemRepo()
    service = TripService(repo, day_repo=day_repo, item_repo=item_repo)
    return service, repo, day_repo, item_repo


def test_trip_service_creates_trip():
    service, repo, _, _ = create_service()
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
    service, repo, _, _ = create_service()
    user_id = uuid.uuid4()
    service.create_trip(
        user_id=user_id,
        title="Trip1",
        start_date=dt.datetime(2025, 1, 1, tzinfo=dt.timezone.utc),
        end_date=dt.datetime(2025, 1, 2, tzinfo=dt.timezone.utc),
    )
    trips = service.list_trips(user_id=user_id)
    assert len(trips) == 1


def test_trip_service_adds_day_and_item():
    service, repo, day_repo, item_repo = create_service()
    user_id = uuid.uuid4()
    trip = service.create_trip(
        user_id=user_id,
        title="Trip1",
        start_date=dt.datetime(2025, 1, 1, tzinfo=dt.timezone.utc),
        end_date=dt.datetime(2025, 1, 2, tzinfo=dt.timezone.utc),
    )
    day = service.add_day(trip_id=trip.id, day_index=0, label="Day 1")
    assert day in day_repo.storage
    item = service.add_item(trip_id=trip.id, day_id=day.id, type="ski", title="Morning ski")
    assert item in item_repo.storage
