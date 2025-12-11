"""Trip management service with calendar integration."""
from datetime import datetime, UTC
from typing import List, Optional, Tuple
import uuid
from uuid import UUID

from sqlalchemy import desc
from sqlalchemy.orm import Session

from models.trip_planning import Trip, Season
from models.course_tracking import CourseVisit
from models.user_profile import UserProfile
from models.enums import TripStatus, TripVisibility
from schemas.trip_planning import TripCreate, TripUpdate, TripBase, TripSummary, UserInfo
from domain.calendar.enums import EventType
from services.calendar_service import CalendarService
from repositories.calendar_repository import CalendarEventRepository


class TripNotFoundError(Exception):
    """Raised when trip is not found."""
    pass


class UnauthorizedError(Exception):
    """Raised when user is not authorized."""
    pass


def create_trip(db: Session, user_id: uuid.UUID, trip_data: TripCreate) -> Trip:
    """Create a new trip and corresponding calendar event."""
    from services.season_service import get_season
    get_season(db, trip_data.season_id, user_id)
    
    # Create trip
    trip = Trip(
        season_id=trip_data.season_id,
        user_id=user_id,
        resort_id=trip_data.resort_id,
        title=trip_data.title,
        start_date=trip_data.start_date,
        end_date=trip_data.end_date,
        flexibility=trip_data.flexibility,
        flight_status=trip_data.flight_status,
        accommodation_status=trip_data.accommodation_status,
        trip_status=TripStatus.PLANNING,
        visibility=trip_data.visibility,
        max_buddies=trip_data.max_buddies,
        notes=trip_data.notes
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    
    # Create calendar event
    calendar_repo = CalendarEventRepository(db)
    calendar_service = CalendarService(calendar_repo)
    
    calendar_service.create_event(
        user_id=user_id,
        event_type=EventType.TRIP,
        title=trip_data.title or f"Trip to {trip_data.resort_id}",
        start_date=trip_data.start_date,
        end_date=trip_data.end_date,
        source_app="trip_planning",
        source_id=str(trip.trip_id),
        description=trip_data.notes,
        related_trip_id=str(trip.trip_id),
        resort_id=trip_data.resort_id,
    )
    
    return trip


def create_trips_batch(
    db: Session,
    user_id: uuid.UUID,
    season_id: uuid.UUID,
    trips_data: List[TripBase]
) -> List[Trip]:
    """Create multiple trips at once."""
    from services.season_service import get_season
    get_season(db, season_id, user_id)
    
    trips = []
    for trip_data in trips_data:
        trip = Trip(
            season_id=season_id,
            user_id=user_id,
            resort_id=trip_data.resort_id,
            title=trip_data.title,
            start_date=trip_data.start_date,
            end_date=trip_data.end_date,
            flexibility=trip_data.flexibility,
            flight_status=trip_data.flight_status,
            accommodation_status=trip_data.accommodation_status,
            trip_status=TripStatus.PLANNING,
            visibility=trip_data.visibility,
            max_buddies=trip_data.max_buddies,
            notes=trip_data.notes
        )
        trips.append(trip)
    
    db.add_all(trips)
    db.commit()
    for trip in trips:
        db.refresh(trip)
    return trips


def get_user_trips(
    db: Session,
    user_id: uuid.UUID,
    season_id: Optional[uuid.UUID] = None,
    status: Optional[TripStatus] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Trip]:
    """Get all trips for a user."""
    query = db.query(Trip).filter(Trip.user_id == user_id)
    if season_id:
        query = query.filter(Trip.season_id == season_id)
    if status:
        query = query.filter(Trip.trip_status == status)
    return query.order_by(desc(Trip.start_date)).offset(skip).limit(limit).all()


def get_public_trips(db: Session, skip: int = 0, limit: int = 100) -> List[Trip]:
    """Get all public trips for the Snowbuddy Board."""
    return (
        db.query(Trip)
        .filter(Trip.visibility == 'public')
        .order_by(desc(Trip.start_date))
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_public_trips_with_owner_info(
    db: Session,
    skip: int = 0,
    limit: int = 100
) -> List[dict]:
    """Get all public trips with owner information for the Snowbuddy Board."""
    trips_with_users = (
        db.query(Trip, UserProfile)
        .join(UserProfile, Trip.user_id == UserProfile.user_id)
        .filter(Trip.visibility == 'public')
        .order_by(desc(Trip.start_date))
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    result = []
    for trip, user_profile in trips_with_users:
        owner_info = UserInfo(
            user_id=user_profile.user_id,
            display_name=user_profile.display_name or "匿名用戶",
            avatar_url=user_profile.avatar_url,
            experience_level=None
        )
        trip_summary = TripSummary(
            trip_id=trip.trip_id,
            resort_id=trip.resort_id,
            title=trip.title,
            start_date=trip.start_date,
            end_date=trip.end_date,
            flexibility=trip.flexibility,
            trip_status=trip.trip_status,
            max_buddies=trip.max_buddies,
            current_buddies=trip.current_buddies,
            owner_info=owner_info
        )
        result.append(trip_summary)
    return result


def get_trip(db: Session, trip_id: uuid.UUID, user_id: Optional[uuid.UUID] = None) -> Tuple[Trip, List[dict]]:
    """Get a specific trip by ID with its calendar events."""
    trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
    if not trip:
        raise TripNotFoundError(f"Trip {trip_id} not found")
    if user_id and trip.user_id != user_id and trip.visibility == TripVisibility.PRIVATE:
        raise UnauthorizedError("You don't have permission to view this trip")
    
    # Get calendar events
    calendar_repo = CalendarEventRepository(db)
    calendar_service = CalendarService(calendar_repo)
    
    events = calendar_service.list_events_for_source(
        source_app="trip_planning",
        source_id=str(trip.trip_id)
    )
    
    # Convert events to dict for JSON serialization
    event_list = []
    for event in events:
        event_list.append({
            "id": str(event.id),
            "type": event.type.value,
            "title": event.title,
            "start_date": event.start_date.isoformat(),
            "end_date": event.end_date.isoformat(),
            "all_day": event.all_day,
            "timezone": event.timezone,
            "source_app": event.source_app,
            "source_id": event.source_id,
            "related_trip_id": event.related_trip_id,
            "resort_id": event.resort_id,
            "description": event.description,
        })
    
    return trip, event_list


def update_trip(
    db: Session,
    trip_id: uuid.UUID,
    user_id: uuid.UUID,
    updates: TripUpdate
) -> Tuple[Trip, List[dict]]:
    """Update a trip and its corresponding calendar event."""
    trip, events = get_trip(db, trip_id)
    if trip.user_id != user_id:
        raise UnauthorizedError("You don't have permission to update this trip")
    
    # Update trip fields
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(trip, field, value)
    trip.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(trip)
    
    # Update calendar event if it exists
    if events:
        calendar_repo = CalendarEventRepository(db)
        calendar_service = CalendarService(calendar_repo)
        
        for event in events:
            calendar_service.update_event(
                event_id=UUID(event["id"]),
                title=updates.title if updates.title else trip.title,
                start_date=updates.start_date if updates.start_date else trip.start_date,
                end_date=updates.end_date if updates.end_date else trip.end_date,
                description=updates.notes if updates.notes else trip.notes,
            )
    
    # Get updated events
    updated_trip, updated_events = get_trip(db, trip_id)
    return updated_trip, updated_events


def delete_trip(db: Session, trip_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    """Delete a trip and its corresponding calendar events."""
    trip, events = get_trip(db, trip_id)
    if trip.user_id != user_id:
        raise UnauthorizedError("You don't have permission to delete this trip")
    
    # Delete calendar events
    calendar_repo = CalendarEventRepository(db)
    calendar_service = CalendarService(calendar_repo)
    calendar_service.delete_events_for_source("trip_planning", str(trip.trip_id))
    
    # Delete trip
    db.delete(trip)
    db.commit()
    return True


def complete_trip(
    db: Session,
    trip_id: uuid.UUID,
    user_id: uuid.UUID,
    create_course_visit: bool = True
) -> Tuple[Trip, Optional[CourseVisit]]:
    """Mark a trip as completed and optionally create CourseVisit."""
    trip = get_trip(db, trip_id)
    if trip.user_id != user_id:
        raise UnauthorizedError("You don't have permission to complete this trip")
    
    trip.trip_status = TripStatus.COMPLETED
    trip.completed_at = datetime.now(UTC)
    
    course_visit = None
    if create_course_visit:
        course_visit = CourseVisit(
            user_id=user_id,
            resort_id=trip.resort_id,
            course_name="整體體驗",
            visited_date=trip.end_date,
            notes=f"自動從行程轉換: {trip.title or trip.resort_id}"
        )
        db.add(course_visit)
        db.flush()
        trip.course_visit_id = course_visit.id
    
    db.commit()
    db.refresh(trip)
    if course_visit:
        db.refresh(course_visit)
    return trip, course_visit


def generate_share_link(db: Session, trip_id: uuid.UUID, user_id: uuid.UUID) -> str:
    """Generate a share link for a trip."""
    trip = get_trip(db, trip_id)
    if trip.user_id != user_id:
        raise UnauthorizedError("Only trip owner can generate share links")
    if not trip.share_token:
        trip.generate_share_token()
        db.commit()
        db.refresh(trip)
    return trip.share_token


def get_trip_by_share_token(db: Session, share_token: str) -> Trip:
    """Get a trip by its share token."""
    trip = db.query(Trip).filter(Trip.share_token == share_token).first()
    if not trip:
        raise TripNotFoundError("Invalid share link")
    return trip
