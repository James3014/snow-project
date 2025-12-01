"""Trip service - business logic for trips."""
from datetime import datetime, UTC
from typing import List, Optional, Tuple
import uuid

from sqlalchemy import desc
from sqlalchemy.orm import Session
from models.trip_planning import Season, Trip
from models.course_tracking import CourseVisit
from models.enums import TripStatus, TripVisibility
from schemas.trip_planning import TripCreate, TripUpdate, TripBase
from .season_service import get_season, SeasonNotFoundError


class TripNotFoundError(Exception):
    """Raised when trip is not found."""
    pass


class UnauthorizedError(Exception):
    """Raised when user is not authorized."""
    pass


def create_trip(db: Session, user_id: uuid.UUID, trip_data: TripCreate) -> Trip:
    """Create a new trip."""
    get_season(db, trip_data.season_id, user_id)  # Verify season exists
    trip = Trip(
        season_id=trip_data.season_id, user_id=user_id, resort_id=trip_data.resort_id,
        title=trip_data.title, start_date=trip_data.start_date, end_date=trip_data.end_date,
        flexibility=trip_data.flexibility, flight_status=trip_data.flight_status,
        accommodation_status=trip_data.accommodation_status, trip_status=TripStatus.PLANNING,
        visibility=trip_data.visibility, max_buddies=trip_data.max_buddies, notes=trip_data.notes
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


def create_trips_batch(db: Session, user_id: uuid.UUID, season_id: uuid.UUID, trips_data: List[TripBase]) -> List[Trip]:
    """Create multiple trips at once."""
    get_season(db, season_id, user_id)
    trips = []
    for trip_data in trips_data:
        trip = Trip(
            season_id=season_id, user_id=user_id, resort_id=trip_data.resort_id,
            title=trip_data.title, start_date=trip_data.start_date, end_date=trip_data.end_date,
            flexibility=trip_data.flexibility, flight_status=trip_data.flight_status,
            accommodation_status=trip_data.accommodation_status, trip_status=TripStatus.PLANNING,
            visibility=trip_data.visibility, max_buddies=trip_data.max_buddies, notes=trip_data.notes
        )
        trips.append(trip)
    db.add_all(trips)
    db.commit()
    for trip in trips:
        db.refresh(trip)
    return trips


def get_user_trips(db: Session, user_id: uuid.UUID, season_id: Optional[uuid.UUID] = None,
                   status: Optional[TripStatus] = None, skip: int = 0, limit: int = 100) -> List[Trip]:
    """Get all trips for a user."""
    query = db.query(Trip).filter(Trip.user_id == user_id)
    if season_id:
        query = query.filter(Trip.season_id == season_id)
    if status:
        query = query.filter(Trip.trip_status == status)
    return query.order_by(desc(Trip.start_date)).offset(skip).limit(limit).all()


def get_trip(db: Session, trip_id: uuid.UUID, user_id: Optional[uuid.UUID] = None) -> Trip:
    """Get a specific trip by ID."""
    trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
    if not trip:
        raise TripNotFoundError(f"Trip {trip_id} not found")
    if user_id and trip.user_id != user_id and trip.visibility == TripVisibility.PRIVATE:
        raise UnauthorizedError("You don't have permission to view this trip")
    return trip


def update_trip(db: Session, trip_id: uuid.UUID, user_id: uuid.UUID, updates: TripUpdate) -> Trip:
    """Update a trip."""
    trip = get_trip(db, trip_id)
    if trip.user_id != user_id:
        raise UnauthorizedError("You don't have permission to update this trip")
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(trip, field, value)
    trip.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(trip)
    return trip


def delete_trip(db: Session, trip_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    """Delete a trip."""
    trip = get_trip(db, trip_id)
    if trip.user_id != user_id:
        raise UnauthorizedError("You don't have permission to delete this trip")
    db.delete(trip)
    db.commit()
    return True


def complete_trip(db: Session, trip_id: uuid.UUID, user_id: uuid.UUID,
                  create_course_visit: bool = True) -> Tuple[Trip, Optional[CourseVisit]]:
    """Mark a trip as completed."""
    trip = get_trip(db, trip_id)
    if trip.user_id != user_id:
        raise UnauthorizedError("You don't have permission to complete this trip")
    trip.trip_status = TripStatus.COMPLETED
    trip.completed_at = datetime.now(UTC)

    course_visit = None
    if create_course_visit:
        course_visit = CourseVisit(
            user_id=user_id, resort_id=trip.resort_id, course_name="整體體驗",
            visited_date=trip.end_date, notes=f"自動從行程轉換: {trip.title or trip.resort_id}"
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
