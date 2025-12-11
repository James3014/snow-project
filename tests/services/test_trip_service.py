"""
Trip Service Tests - Trip Planning with Calendar Integration
Tests for trip_service.py functions.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../platform/user_core'))

import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock, patch, MagicMock

import pytest

from services import trip_service
from services.trip_service import TripNotFoundError, UnauthorizedError
from schemas.trip_planning import TripCreate, TripUpdate
from models.enums import TripStatus, TripVisibility
from domain.calendar.enums import EventType


@pytest.fixture
def user_id():
    return uuid.uuid4()


@pytest.fixture
def season_id():
    return uuid.uuid4()


@pytest.fixture
def trip_id():
    return uuid.uuid4()


@pytest.fixture
def mock_db():
    return Mock()


@pytest.fixture
def trip_create_data():
    from models.enums import TripFlexibility, FlightStatus, AccommodationStatus
    from datetime import date
    
    return TripCreate(
        season_id=uuid.uuid4(),
        resort_id="naeba",
        title="苗場滑雪",
        start_date=date.today() + timedelta(days=30),
        end_date=date.today() + timedelta(days=35),
        flexibility=TripFlexibility.FIXED,
        flight_status=FlightStatus.NOT_PLANNED,
        accommodation_status=AccommodationStatus.NOT_PLANNED,
        visibility=TripVisibility.PUBLIC,
        max_buddies=4,
        notes="測試行程"
    )


class TestCreateTrip:
    """Test create_trip function."""

    @patch('services.season_service.get_season')
    @patch('services.trip_service.CalendarService')
    @patch('services.trip_service.CalendarEventRepository')
    def test_create_trip_success(self, mock_calendar_repo, mock_calendar_service, mock_get_season, 
                                mock_db, user_id, trip_create_data):
        """Test successful trip creation with calendar event."""
        # Setup mocks
        mock_get_season.return_value = Mock()
        mock_calendar_service_instance = Mock()
        mock_calendar_service.return_value = mock_calendar_service_instance
        
        # Mock database operations
        mock_db.add = Mock()
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        # Create mock trip with trip_id
        mock_trip = Mock()
        mock_trip.trip_id = uuid.uuid4()
        mock_trip.user_id = user_id
        mock_trip.title = trip_create_data.title
        mock_trip.resort_id = trip_create_data.resort_id
        mock_trip.start_date = trip_create_data.start_date
        mock_trip.end_date = trip_create_data.end_date
        mock_trip.notes = trip_create_data.notes
        
        # Mock Trip constructor to return our mock
        with patch('services.trip_service.Trip', return_value=mock_trip):
            result = trip_service.create_trip(mock_db, user_id, trip_create_data)
        
        # Verify trip creation
        assert result == mock_trip
        mock_db.add.assert_called_once_with(mock_trip)
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once_with(mock_trip)
        
        # Verify calendar event creation
        mock_calendar_service_instance.create_event.assert_called_once()
        call_args = mock_calendar_service_instance.create_event.call_args
        assert call_args.kwargs['user_id'] == user_id
        assert call_args.kwargs['event_type'] == EventType.TRIP
        assert call_args.kwargs['title'] == trip_create_data.title
        assert call_args.kwargs['source_app'] == "trip_planning"
        assert call_args.kwargs['source_id'] == str(mock_trip.trip_id)

    @patch('services.season_service.get_season')
    def test_create_trip_invalid_season_raises(self, mock_get_season, mock_db, user_id, trip_create_data):
        """Test trip creation with invalid season raises error."""
        mock_get_season.side_effect = ValueError("Season not found")
        
        with pytest.raises(ValueError, match="Season not found"):
            trip_service.create_trip(mock_db, user_id, trip_create_data)


class TestGetTrip:
    """Test get_trip function."""

    @patch('services.trip_service.CalendarService')
    @patch('services.trip_service.CalendarEventRepository')
    def test_get_trip_success(self, mock_calendar_repo, mock_calendar_service, 
                             mock_db, trip_id, user_id):
        """Test successful trip retrieval with calendar events."""
        # Setup mock trip
        mock_trip = Mock()
        mock_trip.trip_id = trip_id
        mock_trip.user_id = user_id
        mock_trip.visibility = TripVisibility.PUBLIC
        
        # Setup mock query
        mock_query = Mock()
        mock_query.filter.return_value.first.return_value = mock_trip
        mock_db.query.return_value = mock_query
        
        # Setup mock calendar service
        mock_calendar_service_instance = Mock()
        mock_calendar_service.return_value = mock_calendar_service_instance
        mock_event = Mock()
        mock_event.id = uuid.uuid4()
        mock_event.type = EventType.TRIP
        mock_event.title = "Test Event"
        mock_event.start_date = datetime.now(timezone.utc)
        mock_event.end_date = datetime.now(timezone.utc)
        mock_event.all_day = False
        mock_event.timezone = "Asia/Taipei"
        mock_event.source_app = "trip_planning"
        mock_event.source_id = str(trip_id)
        mock_event.related_trip_id = str(trip_id)
        mock_event.resort_id = "naeba"
        mock_event.description = "Test description"
        mock_calendar_service_instance.list_events_for_source.return_value = [mock_event]
        
        result_trip, result_events = trip_service.get_trip(mock_db, trip_id, user_id)
        
        # Verify results
        assert result_trip == mock_trip
        assert len(result_events) == 1
        assert result_events[0]["title"] == "Test Event"
        assert result_events[0]["source_app"] == "trip_planning"
        
        # Verify calendar service was called
        mock_calendar_service_instance.list_events_for_source.assert_called_once_with(
            source_app="trip_planning",
            source_id=str(trip_id)
        )

    def test_get_trip_not_found_raises(self, mock_db, trip_id):
        """Test get_trip with non-existent trip raises TripNotFoundError."""
        mock_query = Mock()
        mock_query.filter.return_value.first.return_value = None
        mock_db.query.return_value = mock_query
        
        with pytest.raises(TripNotFoundError, match=f"Trip {trip_id} not found"):
            trip_service.get_trip(mock_db, trip_id)

    def test_get_trip_unauthorized_raises(self, mock_db, trip_id, user_id):
        """Test get_trip with unauthorized access raises UnauthorizedError."""
        other_user_id = uuid.uuid4()
        mock_trip = Mock()
        mock_trip.user_id = other_user_id
        mock_trip.visibility = TripVisibility.PRIVATE
        
        mock_query = Mock()
        mock_query.filter.return_value.first.return_value = mock_trip
        mock_db.query.return_value = mock_query
        
        with pytest.raises(UnauthorizedError, match="You don't have permission to view this trip"):
            trip_service.get_trip(mock_db, trip_id, user_id)


class TestUpdateTrip:
    """Test update_trip function."""

    @patch('services.trip_service.get_trip')
    @patch('services.trip_service.CalendarService')
    @patch('services.trip_service.CalendarEventRepository')
    def test_update_trip_success(self, mock_calendar_repo, mock_calendar_service, mock_get_trip,
                                mock_db, trip_id, user_id):
        """Test successful trip update with calendar event update."""
        # Setup mock trip
        mock_trip = Mock()
        mock_trip.trip_id = trip_id
        mock_trip.user_id = user_id
        mock_trip.title = "原標題"
        mock_trip.notes = "原備註"
        
        # Setup mock events
        mock_event = {
            "id": str(uuid.uuid4()),
            "title": "原標題"
        }
        mock_get_trip.side_effect = [
            (mock_trip, [mock_event]),  # First call in update_trip
            (mock_trip, [mock_event])   # Second call at the end
        ]
        
        # Setup mock calendar service
        mock_calendar_service_instance = Mock()
        mock_calendar_service.return_value = mock_calendar_service_instance
        
        # Setup update data
        updates = TripUpdate(title="新標題", notes="新備註")
        
        result_trip, result_events = trip_service.update_trip(mock_db, trip_id, user_id, updates)
        
        # Verify trip was updated
        assert mock_trip.title == "新標題"
        assert mock_trip.notes == "新備註"
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once_with(mock_trip)
        
        # Verify calendar event was updated
        mock_calendar_service_instance.update_event.assert_called_once()

    @patch('services.trip_service.get_trip')
    def test_update_trip_unauthorized_raises(self, mock_get_trip, mock_db, trip_id, user_id):
        """Test update_trip with unauthorized access raises UnauthorizedError."""
        other_user_id = uuid.uuid4()
        mock_trip = Mock()
        mock_trip.user_id = other_user_id
        mock_get_trip.return_value = (mock_trip, [])
        
        updates = TripUpdate(title="新標題")
        
        with pytest.raises(UnauthorizedError, match="You don't have permission to update this trip"):
            trip_service.update_trip(mock_db, trip_id, user_id, updates)


class TestDeleteTrip:
    """Test delete_trip function."""

    @patch('services.trip_service.get_trip')
    @patch('services.trip_service.CalendarService')
    @patch('services.trip_service.CalendarEventRepository')
    def test_delete_trip_success(self, mock_calendar_repo, mock_calendar_service, mock_get_trip,
                                mock_db, trip_id, user_id):
        """Test successful trip deletion with calendar events."""
        # Setup mock trip
        mock_trip = Mock()
        mock_trip.trip_id = trip_id
        mock_trip.user_id = user_id
        mock_get_trip.return_value = (mock_trip, [])
        
        # Setup mock calendar service
        mock_calendar_service_instance = Mock()
        mock_calendar_service.return_value = mock_calendar_service_instance
        mock_calendar_service_instance.delete_events_for_source.return_value = 1
        
        result = trip_service.delete_trip(mock_db, trip_id, user_id)
        
        # Verify deletion
        assert result is True
        mock_calendar_service_instance.delete_events_for_source.assert_called_once_with(
            "trip_planning", str(trip_id)
        )
        mock_db.delete.assert_called_once_with(mock_trip)
        mock_db.commit.assert_called_once()

    @patch('services.trip_service.get_trip')
    def test_delete_trip_unauthorized_raises(self, mock_get_trip, mock_db, trip_id, user_id):
        """Test delete_trip with unauthorized access raises UnauthorizedError."""
        other_user_id = uuid.uuid4()
        mock_trip = Mock()
        mock_trip.user_id = other_user_id
        mock_get_trip.return_value = (mock_trip, [])
        
        with pytest.raises(UnauthorizedError, match="You don't have permission to delete this trip"):
            trip_service.delete_trip(mock_db, trip_id, user_id)


class TestGetUserTrips:
    """Test get_user_trips function."""

    def test_get_user_trips_success(self, mock_db, user_id):
        """Test successful retrieval of user trips."""
        mock_trips = [Mock(), Mock()]
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = mock_trips
        mock_db.query.return_value = mock_query
        
        result = trip_service.get_user_trips(mock_db, user_id)
        
        assert result == mock_trips
        mock_db.query.assert_called_once()


class TestGetPublicTrips:
    """Test get_public_trips function."""

    def test_get_public_trips_success(self, mock_db):
        """Test successful retrieval of public trips."""
        mock_trips = [Mock(), Mock()]
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = mock_trips
        mock_db.query.return_value = mock_query
        
        result = trip_service.get_public_trips(mock_db)
        
        assert result == mock_trips
        mock_db.query.assert_called_once()
