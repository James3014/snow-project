"""
TODO-CAL-007: CalendarTripBuddyRepository Tests
Tests for CalendarTripBuddyRepository CRUD operations.
"""
import uuid
from datetime import datetime, timezone

import pytest

from repositories.calendar_repository import CalendarTripBuddyRepository
from domain.calendar.trip_buddy import TripBuddy
from domain.calendar.enums import BuddyStatus, BuddyRole


@pytest.fixture
def trip_id():
    return uuid.uuid4()


@pytest.fixture
def user_id():
    return uuid.uuid4()


@pytest.fixture
def inviter_id():
    return uuid.uuid4()


@pytest.fixture
def repo(db_session):
    return CalendarTripBuddyRepository(db_session)


@pytest.fixture
def sample_buddy(trip_id, user_id, inviter_id):
    return TripBuddy(
        trip_id=trip_id,
        user_id=user_id,
        inviter_id=inviter_id,
        request_message="想一起滑雪！",
    )


class TestCalendarTripBuddyRepositoryAdd:
    """Test add operation."""

    def test_add_buddy_returns_buddy_with_id(self, repo, sample_buddy):
        result = repo.add(sample_buddy)
        assert result.id == sample_buddy.id
        assert result.request_message == "想一起滑雪！"

    def test_add_buddy_persists_all_fields(self, repo, sample_buddy):
        result = repo.add(sample_buddy)
        assert result.trip_id == sample_buddy.trip_id
        assert result.user_id == sample_buddy.user_id
        assert result.inviter_id == sample_buddy.inviter_id
        assert result.status == BuddyStatus.PENDING
        assert result.role == BuddyRole.BUDDY


class TestCalendarTripBuddyRepositoryGet:
    """Test get operation."""

    def test_get_existing_buddy(self, repo, sample_buddy):
        repo.add(sample_buddy)
        result = repo.get(sample_buddy.id)
        assert result is not None
        assert result.id == sample_buddy.id

    def test_get_nonexistent_buddy_returns_none(self, repo):
        result = repo.get(uuid.uuid4())
        assert result is None


class TestCalendarTripBuddyRepositoryListForTrip:
    """Test list_for_trip operation."""

    def test_list_for_trip_returns_trip_buddies(self, repo, trip_id, inviter_id):
        buddy1 = TripBuddy(
            trip_id=trip_id,
            user_id=uuid.uuid4(),
            inviter_id=inviter_id,
        )
        buddy2 = TripBuddy(
            trip_id=trip_id,
            user_id=uuid.uuid4(),
            inviter_id=inviter_id,
        )
        repo.add(buddy1)
        repo.add(buddy2)

        results = repo.list_for_trip(trip_id)
        assert len(results) == 2

    def test_list_for_trip_excludes_other_trips(self, repo, trip_id, inviter_id):
        other_trip = uuid.uuid4()
        buddy1 = TripBuddy(
            trip_id=trip_id,
            user_id=uuid.uuid4(),
            inviter_id=inviter_id,
        )
        buddy2 = TripBuddy(
            trip_id=other_trip,
            user_id=uuid.uuid4(),
            inviter_id=inviter_id,
        )
        repo.add(buddy1)
        repo.add(buddy2)

        results = repo.list_for_trip(trip_id)
        assert len(results) == 1


class TestCalendarTripBuddyRepositoryUpdate:
    """Test update operation."""

    def test_update_buddy_status_to_accepted(self, repo, sample_buddy):
        repo.add(sample_buddy)
        accepted = sample_buddy.accept()
        result = repo.update(accepted)
        assert result.status == BuddyStatus.ACCEPTED
        assert result.joined_at is not None

    def test_update_buddy_status_to_declined(self, repo, sample_buddy):
        repo.add(sample_buddy)
        declined = sample_buddy.decline("人數已滿")
        result = repo.update(declined)
        assert result.status == BuddyStatus.DECLINED
        assert result.response_message == "人數已滿"

    def test_update_nonexistent_buddy_raises(self, repo, sample_buddy):
        with pytest.raises(ValueError, match="Buddy not found"):
            repo.update(sample_buddy)
