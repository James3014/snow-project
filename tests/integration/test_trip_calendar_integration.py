"""
Integration Tests - Trip Planning with Calendar Integration
Tests the integration between trip_service and calendar_service.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../platform/user_core'))

import uuid
from datetime import date, datetime, timezone, timedelta
from unittest.mock import Mock, patch

import pytest

from services import trip_service
from services.calendar_service import CalendarService
from repositories.calendar_repository import CalendarEventRepository
from schemas.trip_planning import TripCreate, TripUpdate
from models.enums import TripFlexibility, FlightStatus, AccommodationStatus, TripVisibility
from domain.calendar.enums import EventType


@pytest.fixture
def user_id():
    return uuid.uuid4()


@pytest.fixture
def season_id():
    return uuid.uuid4()


@pytest.fixture
def mock_db():
    return Mock()


@pytest.fixture
def trip_create_data(season_id):
    return TripCreate(
        season_id=season_id,
        resort_id="naeba",
        title="苗場滑雪整合測試",
        start_date=date.today() + timedelta(days=30),
        end_date=date.today() + timedelta(days=35),
        flexibility=TripFlexibility.FIXED,
        flight_status=FlightStatus.NOT_PLANNED,
        accommodation_status=AccommodationStatus.NOT_PLANNED,
        visibility=TripVisibility.PUBLIC,
        max_buddies=4,
        notes="整合測試行程"
    )


class TestTripCalendarIntegration:
    """Test integration between trip service and calendar service."""

    @patch('services.season_service.get_season')
    def test_create_trip_creates_calendar_event_integration(self, mock_get_season, 
                                                          mock_db, user_id, trip_create_data):
        """Integration test: Creating a trip should create a corresponding calendar event."""
        # Setup season validation
        mock_get_season.return_value = Mock()
        
        # Setup database mocks
        mock_db.add = Mock()
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        # Create mock trip
        mock_trip = Mock()
        mock_trip.trip_id = uuid.uuid4()
        mock_trip.user_id = user_id
        mock_trip.title = trip_create_data.title
        mock_trip.resort_id = trip_create_data.resort_id
        mock_trip.start_date = trip_create_data.start_date
        mock_trip.end_date = trip_create_data.end_date
        mock_trip.notes = trip_create_data.notes
        
        # Setup calendar repository and service mocks
        mock_calendar_repo = Mock(spec=CalendarEventRepository)
        mock_calendar_event = Mock()
        mock_calendar_event.id = uuid.uuid4()
        mock_calendar_event.title = trip_create_data.title
        mock_calendar_event.type = EventType.TRIP
        mock_calendar_repo.add.return_value = mock_calendar_event
        
        with patch('services.trip_service.Trip', return_value=mock_trip), \
             patch('services.trip_service.CalendarEventRepository', return_value=mock_calendar_repo), \
             patch('services.trip_service.CalendarService') as mock_calendar_service_class:
            
            # Setup calendar service mock
            mock_calendar_service = Mock(spec=CalendarService)
            mock_calendar_service.create_event.return_value = mock_calendar_event
            mock_calendar_service_class.return_value = mock_calendar_service
            
            # Execute the function
            result = trip_service.create_trip(mock_db, user_id, trip_create_data)
            
            # Verify trip creation
            assert result == mock_trip
            mock_db.add.assert_called_once_with(mock_trip)
            mock_db.commit.assert_called_once()
            mock_db.refresh.assert_called_once_with(mock_trip)
            
            # Verify calendar service was instantiated with correct repository
            mock_calendar_service_class.assert_called_once_with(mock_calendar_repo)
            
            # Verify calendar event creation
            mock_calendar_service.create_event.assert_called_once()
            call_kwargs = mock_calendar_service.create_event.call_args.kwargs
            
            assert call_kwargs['user_id'] == user_id
            assert call_kwargs['event_type'] == EventType.TRIP
            assert call_kwargs['title'] == trip_create_data.title
            assert call_kwargs['start_date'] == trip_create_data.start_date
            assert call_kwargs['end_date'] == trip_create_data.end_date
            assert call_kwargs['source_app'] == "trip_planning"
            assert call_kwargs['source_id'] == str(mock_trip.trip_id)
            assert call_kwargs['description'] == trip_create_data.notes
            assert call_kwargs['related_trip_id'] == str(mock_trip.trip_id)
            assert call_kwargs['resort_id'] == trip_create_data.resort_id

    def test_get_trip_returns_calendar_events_integration(self, mock_db, user_id):
        """Integration test: Getting a trip should return associated calendar events."""
        trip_id = uuid.uuid4()
        
        # Setup mock trip
        mock_trip = Mock()
        mock_trip.trip_id = trip_id
        mock_trip.user_id = user_id
        mock_trip.visibility = TripVisibility.PUBLIC
        
        # Setup database query mock
        mock_query = Mock()
        mock_query.filter.return_value.first.return_value = mock_trip
        mock_db.query.return_value = mock_query
        
        # Setup calendar event mock
        mock_calendar_event = Mock()
        mock_calendar_event.id = uuid.uuid4()
        mock_calendar_event.type = EventType.TRIP
        mock_calendar_event.title = "整合測試事件"
        mock_calendar_event.start_date = date.today() + timedelta(days=30)
        mock_calendar_event.end_date = date.today() + timedelta(days=35)
        mock_calendar_event.all_day = False
        mock_calendar_event.timezone = "Asia/Taipei"
        mock_calendar_event.source_app = "trip_planning"
        mock_calendar_event.source_id = str(trip_id)
        mock_calendar_event.related_trip_id = str(trip_id)
        mock_calendar_event.resort_id = "naeba"
        mock_calendar_event.description = "整合測試描述"
        
        # Setup calendar service mock
        mock_calendar_repo = Mock(spec=CalendarEventRepository)
        mock_calendar_service = Mock(spec=CalendarService)
        mock_calendar_service.list_events_for_source.return_value = [mock_calendar_event]
        
        with patch('services.trip_service.CalendarEventRepository', return_value=mock_calendar_repo), \
             patch('services.trip_service.CalendarService', return_value=mock_calendar_service):
            
            # Execute the function
            result_trip, result_events = trip_service.get_trip(mock_db, trip_id, user_id)
            
            # Verify trip retrieval
            assert result_trip == mock_trip
            
            # Verify calendar events retrieval
            assert len(result_events) == 1
            event = result_events[0]
            assert event["title"] == "整合測試事件"
            assert event["source_app"] == "trip_planning"
            assert event["source_id"] == str(trip_id)
            assert event["related_trip_id"] == str(trip_id)
            assert event["resort_id"] == "naeba"
            assert event["description"] == "整合測試描述"
            
            # Verify calendar service was called correctly
            mock_calendar_service.list_events_for_source.assert_called_once_with(
                source_app="trip_planning",
                source_id=str(trip_id)
            )

    def test_update_trip_updates_calendar_events_integration(self, mock_db, user_id):
        """Integration test: Updating a trip should update associated calendar events."""
        trip_id = uuid.uuid4()
        
        # Setup mock trip
        mock_trip = Mock()
        mock_trip.trip_id = trip_id
        mock_trip.user_id = user_id
        mock_trip.title = "原標題"
        mock_trip.notes = "原備註"
        mock_trip.start_date = date.today() + timedelta(days=30)
        mock_trip.end_date = date.today() + timedelta(days=35)
        
        # Setup mock calendar event
        mock_event_dict = {
            "id": str(uuid.uuid4()),
            "title": "原標題"
        }
        
        # Setup calendar service mock
        mock_calendar_service = Mock(spec=CalendarService)
        mock_calendar_service.update_event.return_value = Mock()
        
        with patch('services.trip_service.get_trip') as mock_get_trip, \
             patch('services.trip_service.CalendarEventRepository'), \
             patch('services.trip_service.CalendarService', return_value=mock_calendar_service):
            
            # Setup get_trip mock to return trip and events
            mock_get_trip.side_effect = [
                (mock_trip, [mock_event_dict]),  # First call in update_trip
                (mock_trip, [mock_event_dict])   # Second call at the end
            ]
            
            # Setup update data
            updates = TripUpdate(title="新標題", notes="新備註")
            
            # Execute the function
            result_trip, result_events = trip_service.update_trip(mock_db, trip_id, user_id, updates)
            
            # Verify trip was updated
            assert mock_trip.title == "新標題"
            assert mock_trip.notes == "新備註"
            mock_db.commit.assert_called_once()
            mock_db.refresh.assert_called_once_with(mock_trip)
            
            # Verify calendar event was updated
            mock_calendar_service.update_event.assert_called_once()
            call_kwargs = mock_calendar_service.update_event.call_args.kwargs
            assert call_kwargs['title'] == "新標題"
            assert call_kwargs['description'] == "新備註"

    def test_delete_trip_deletes_calendar_events_integration(self, mock_db, user_id):
        """Integration test: Deleting a trip should delete associated calendar events."""
        trip_id = uuid.uuid4()
        
        # Setup mock trip
        mock_trip = Mock()
        mock_trip.trip_id = trip_id
        mock_trip.user_id = user_id
        
        # Setup calendar service mock
        mock_calendar_service = Mock(spec=CalendarService)
        mock_calendar_service.delete_events_for_source.return_value = 1
        
        with patch('services.trip_service.get_trip', return_value=(mock_trip, [])), \
             patch('services.trip_service.CalendarEventRepository'), \
             patch('services.trip_service.CalendarService', return_value=mock_calendar_service):
            
            # Execute the function
            result = trip_service.delete_trip(mock_db, trip_id, user_id)
            
            # Verify deletion
            assert result is True
            
            # Verify calendar events were deleted
            mock_calendar_service.delete_events_for_source.assert_called_once_with(
                "trip_planning", str(trip_id)
            )
            
            # Verify trip was deleted
            mock_db.delete.assert_called_once_with(mock_trip)
            mock_db.commit.assert_called_once()


class TestCalendarServiceIntegration:
    """Test calendar service integration scenarios."""

    def test_calendar_service_with_real_repository_interface(self):
        """Integration test: Calendar service should work with repository interface."""
        # Setup mock repository
        mock_repo = Mock(spec=CalendarEventRepository)
        mock_event = Mock()
        mock_event.id = uuid.uuid4()
        mock_event.title = "測試事件"
        mock_repo.add.return_value = mock_event
        
        # Create calendar service
        calendar_service = CalendarService(mock_repo)
        
        # Test event creation
        result = calendar_service.create_event(
            user_id=uuid.uuid4(),
            event_type=EventType.TRIP,
            title="測試事件",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc) + timedelta(days=1),
            source_app="trip_planning",
            source_id="test_trip_123"
        )
        
        # Verify repository was called
        mock_repo.add.assert_called_once()
        assert result == mock_event
        
        # Verify the event passed to repository has correct attributes
        event_arg = mock_repo.add.call_args[0][0]
        assert event_arg.title == "測試事件"
        assert event_arg.type == EventType.TRIP
        assert event_arg.source_app == "trip_planning"
        assert event_arg.source_id == "test_trip_123"

    def test_multiple_calendar_operations_integration(self):
        """Integration test: Multiple calendar operations should work together."""
        # Setup mock repository
        mock_repo = Mock(spec=CalendarEventRepository)
        
        # Setup different return values for different operations
        event_id = uuid.uuid4()
        mock_event = Mock()
        mock_event.id = event_id
        mock_event.title = "測試事件"
        
        mock_repo.add.return_value = mock_event
        mock_repo.get.return_value = mock_event
        mock_repo.list_for_source.return_value = [mock_event]
        mock_repo.delete_by_source.return_value = 1
        
        # Create calendar service
        calendar_service = CalendarService(mock_repo)
        
        # Test create
        created_event = calendar_service.create_event(
            user_id=uuid.uuid4(),
            event_type=EventType.TRIP,
            title="測試事件",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc) + timedelta(days=1),
            source_app="trip_planning",
            source_id="test_trip_123"
        )
        assert created_event == mock_event
        
        # Test get
        retrieved_event = calendar_service.get_event(event_id)
        assert retrieved_event == mock_event
        
        # Test list for source
        events = calendar_service.list_events_for_source("trip_planning", "test_trip_123")
        assert len(events) == 1
        assert events[0] == mock_event
        
        # Test delete by source
        deleted_count = calendar_service.delete_events_for_source("trip_planning", "test_trip_123")
        assert deleted_count == 1
        
        # Verify all repository methods were called
        mock_repo.add.assert_called_once()
        mock_repo.get.assert_called_once_with(event_id)
        mock_repo.list_for_source.assert_called_once_with(source_app="trip_planning", source_id="test_trip_123")
        mock_repo.delete_by_source.assert_called_once_with("trip_planning", "test_trip_123")
