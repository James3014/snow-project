import uuid

from platform.user_core.domain.calendar.matching_request import MatchingRequest
from platform.user_core.services.calendar_service import MatchingService


class FakeMatchingRepo:
    def __init__(self):
        self.storage: dict[uuid.UUID, MatchingRequest] = {}

    def add(self, req: MatchingRequest) -> MatchingRequest:
        self.storage[req.id] = req
        return req

    def update(self, req: MatchingRequest) -> MatchingRequest:
        self.storage[req.id] = req
        return req

    def get(self, request_id: uuid.UUID):
        return self.storage.get(request_id)

    def list_for_trip(self, trip_id: uuid.UUID):
        return [r for r in self.storage.values() if r.trip_id == trip_id]


def test_matching_service_create_and_complete():
    repo = FakeMatchingRepo()
    service = MatchingService(repo)
    trip_id = uuid.uuid4()
    requester_id = uuid.uuid4()
    req = service.create_request(trip_id=trip_id, requester_id=requester_id, preferences={"level": "intermediate"})
    assert req in repo.storage.values()

    completed = service.complete_request(req.id, results=[{"user_id": "buddy"}])
    assert completed.results == [{"user_id": "buddy"}]


def test_matching_service_list():
    repo = FakeMatchingRepo()
    service = MatchingService(repo)
    trip_id = uuid.uuid4()
    service.create_request(trip_id=trip_id, requester_id=uuid.uuid4(), preferences={})
    assert len(service.list_requests(trip_id)) == 1
