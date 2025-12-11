import uuid

from platform.user_core.domain.calendar.matching_request import MatchingRequest
from platform.user_core.domain.calendar.enums import MatchingStatus


def test_matching_request_completion_sets_results():
    req = MatchingRequest(
        trip_id=uuid.uuid4(),
        requester_id=uuid.uuid4(),
        preferences={"level": "intermediate"},
    )
    result = req.mark_completed([{"user_id": "buddy"}])
    assert result.status == MatchingStatus.COMPLETED
    assert result.results == [{"user_id": "buddy"}]
    assert result.completed_at is not None
