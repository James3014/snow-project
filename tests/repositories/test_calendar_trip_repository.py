"""
TODO-CAL-005: CalendarTripRepository Tests
Tests for CalendarTripRepository CRUD operations.
"""
import uuid
from datetime import datetime, timedelta, UTC

import pytest

from repositories.calendar_repository import CalendarTripRepository
from domain.calendar.trip import Trip
from domain.calendar.enums import TripVisibility, TripStatus


@pytest.fixture
def user_id():
    return uuid.uuid4()


@pytest.fixture
def repo(db_session):
    return CalendarTripRepository(db_session)


@pytest.fixture
def sample_trip(user_id):
    return Trip.create(
        user_id=user_id,
        title="苗場滑雪行程",
        start_date=datetime.now(UTC) + timedelta(days=30),
        end_date=datetime.now(UTC) + timedelta(days=35),
        resort_id="naeba",
        resort_name="苗場滑雪場",
    )


class TestCalendarTripRepositoryAdd:
    """Test add operation."""

    def test_add_trip_returns_trip_with_id(self, repo, sample_trip):
        result = repo.add(sample_trip)
        assert result.id == sample_trip.id
        assert result.title == "苗場滑雪行程"

    def test_add_trip_persists_all_fields(self, repo, sample_trip):
        result = repo.add(sample_trip)
        assert result.user_id == sample_trip.user_id
        assert result.resort_id == "naeba"
        assert result.resort_name == "苗場滑雪場"
        assert result.visibility == TripVisibility.PRIVATE
        assert result.status == TripStatus.PLANNING


class TestCalendarTripRepositoryGet:
    """Test get operation."""

    def test_get_existing_trip(self, repo, sample_trip):
        repo.add(sample_trip)
        result = repo.get(sample_trip.id)
        assert result is not None
        assert result.id == sample_trip.id

    def test_get_nonexistent_trip_returns_none(self, repo):
        result = repo.get(uuid.uuid4())
        assert result is None


class TestCalendarTripRepositoryListForUser:
    """Test list_for_user operation."""

    def test_list_for_user_returns_user_trips(self, repo, user_id):
        trip1 = Trip.create(
            user_id=user_id,
            title="行程1",
            start_date=datetime.now(UTC) + timedelta(days=10),
            end_date=datetime.now(UTC) + timedelta(days=12),
        )
        trip2 = Trip.create(
            user_id=user_id,
            title="行程2",
            start_date=datetime.now(UTC) + timedelta(days=20),
            end_date=datetime.now(UTC) + timedelta(days=22),
        )
        repo.add(trip1)
        repo.add(trip2)

        results = repo.list_for_user(user_id)
        assert len(results) == 2

    def test_list_for_user_excludes_other_users(self, repo, user_id):
        other_user = uuid.uuid4()
        trip1 = Trip.create(
            user_id=user_id,
            title="我的行程",
            start_date=datetime.now(UTC) + timedelta(days=10),
            end_date=datetime.now(UTC) + timedelta(days=12),
        )
        trip2 = Trip.create(
            user_id=other_user,
            title="別人的行程",
            start_date=datetime.now(UTC) + timedelta(days=20),
            end_date=datetime.now(UTC) + timedelta(days=22),
        )
        repo.add(trip1)
        repo.add(trip2)

        results = repo.list_for_user(user_id)
        assert len(results) == 1
        assert results[0].title == "我的行程"

    def test_list_for_user_ordered_by_start_date(self, repo, user_id):
        trip_later = Trip.create(
            user_id=user_id,
            title="後面的行程",
            start_date=datetime.now(UTC) + timedelta(days=30),
            end_date=datetime.now(UTC) + timedelta(days=32),
        )
        trip_earlier = Trip.create(
            user_id=user_id,
            title="前面的行程",
            start_date=datetime.now(UTC) + timedelta(days=10),
            end_date=datetime.now(UTC) + timedelta(days=12),
        )
        repo.add(trip_later)
        repo.add(trip_earlier)

        results = repo.list_for_user(user_id)
        assert results[0].title == "前面的行程"
        assert results[1].title == "後面的行程"


class TestCalendarTripRepositoryUpdate:
    """Test update operation."""

    def test_update_trip_title(self, repo, sample_trip):
        repo.add(sample_trip)
        updated = sample_trip.update(title="更新後的標題")
        result = repo.update(updated)
        assert result.title == "更新後的標題"

    def test_update_trip_status(self, repo, sample_trip):
        repo.add(sample_trip)
        updated = sample_trip.update(status=TripStatus.CONFIRMED)
        result = repo.update(updated)
        assert result.status == TripStatus.CONFIRMED

    def test_update_nonexistent_trip_raises(self, repo, sample_trip):
        with pytest.raises(ValueError, match="Trip not found"):
            repo.update(sample_trip)
