"""
TODO-CAL-008: TripService Tests
Tests for TripService use cases.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../platform/user_core'))

import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import Mock, MagicMock

import pytest

from services.calendar_service import TripService
from domain.calendar.trip import Trip
from domain.calendar.enums import TripVisibility, TripStatus


@pytest.fixture
def user_id():
    return uuid.uuid4()


@pytest.fixture
def mock_repo():
    return Mock()


@pytest.fixture
def service(mock_repo):
    return TripService(mock_repo)


class TestTripServiceCreateTrip:
    """Test create_trip use case."""

    def test_create_trip_calls_repo_add(self, service, mock_repo, user_id):
        mock_repo.add.return_value = Mock(id=uuid.uuid4())
        start = datetime.now(timezone.utc) + timedelta(days=30)
        end = start + timedelta(days=5)

        service.create_trip(
            user_id=user_id,
            title="苗場滑雪",
            start_date=start,
            end_date=end,
        )

        mock_repo.add.assert_called_once()
        trip_arg = mock_repo.add.call_args[0][0]
        assert trip_arg.title == "苗場滑雪"
        assert trip_arg.user_id == user_id

    def test_create_trip_with_resort_info(self, service, mock_repo, user_id):
        mock_repo.add.return_value = Mock()
        start = datetime.now(timezone.utc) + timedelta(days=30)
        end = start + timedelta(days=5)

        service.create_trip(
            user_id=user_id,
            title="苗場滑雪",
            start_date=start,
            end_date=end,
            resort_id="naeba",
            resort_name="苗場滑雪場",
        )

        trip_arg = mock_repo.add.call_args[0][0]
        assert trip_arg.resort_id == "naeba"
        assert trip_arg.resort_name == "苗場滑雪場"


class TestTripServiceListTrips:
    """Test list_trips use case."""

    def test_list_trips_calls_repo(self, service, mock_repo, user_id):
        mock_repo.list_for_user.return_value = []
        
        result = service.list_trips(user_id=user_id)
        
        mock_repo.list_for_user.assert_called_once_with(user_id)
        assert result == []


class TestTripServiceGetTrip:
    """Test get_trip use case."""

    def test_get_trip_returns_trip(self, service, mock_repo):
        trip_id = uuid.uuid4()
        mock_trip = Mock(id=trip_id)
        mock_repo.get.return_value = mock_trip

        result = service.get_trip(trip_id)

        mock_repo.get.assert_called_with(trip_id)
        assert result == mock_trip

    def test_get_trip_returns_none_when_not_found(self, service, mock_repo):
        mock_repo.get.return_value = None

        result = service.get_trip(uuid.uuid4())

        assert result is None


class TestTripServiceUpdateTrip:
    """Test update_trip use case."""

    def test_update_trip_calls_repo_update(self, service, mock_repo, user_id):
        start = datetime.now(timezone.utc) + timedelta(days=30)
        end = start + timedelta(days=5)
        trip = Trip.create(
            user_id=user_id,
            title="原標題",
            start_date=start,
            end_date=end,
        )
        mock_repo.update.return_value = Mock(title="新標題")

        result = service.update_trip(trip, title="新標題")

        mock_repo.update.assert_called_once()
        updated_arg = mock_repo.update.call_args[0][0]
        assert updated_arg.title == "新標題"
