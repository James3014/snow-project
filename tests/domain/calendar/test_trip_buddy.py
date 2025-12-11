import uuid

from platform.user_core.domain.calendar.trip_buddy import TripBuddy
from platform.user_core.domain.calendar.enums import BuddyStatus


def test_accept_updates_status_and_joined_at():
    buddy = TripBuddy(trip_id=uuid.uuid4(), user_id=uuid.uuid4(), inviter_id=uuid.uuid4())
    accepted = buddy.accept()
    assert accepted.status == BuddyStatus.ACCEPTED
    assert accepted.joined_at is not None
    assert accepted.responded_at is not None


def test_decline_sets_status_and_message():
    buddy = TripBuddy(trip_id=uuid.uuid4(), user_id=uuid.uuid4(), inviter_id=uuid.uuid4())
    declined = buddy.decline("busy")
    assert declined.status == BuddyStatus.DECLINED
    assert declined.response_message == "busy"
