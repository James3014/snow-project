"""
Trip planning service - business logic for seasons, trips, buddy matching, and sharing.
"""
from datetime import datetime, UTC, date
from typing import List, Optional, Dict, Tuple
import uuid
import secrets

from sqlalchemy import func, and_, or_, desc
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from models.trip_planning import Season, Trip, TripBuddy, TripShare
from models.course_tracking import CourseVisit
from models.user_profile import UserProfile
from models.enums import (
    SeasonStatus, TripStatus, TripVisibility, BuddyRole, BuddyStatus,
    TripFlexibility
)
from schemas.trip_planning import (
    SeasonCreate, SeasonUpdate, TripCreate, TripUpdate, TripBase,
    BuddyRequest, BuddyResponse, TripShareCreate, TripExploreFilters,
    MatchScore, UserLevel
)


class TripPlanningError(Exception):
    """Base exception for trip planning errors."""
    pass


class SeasonNotFoundError(TripPlanningError):
    """Raised when season is not found."""
    pass


class TripNotFoundError(TripPlanningError):
    """Raised when trip is not found."""
    pass


class BuddyRequestError(TripPlanningError):
    """Raised when buddy request fails."""
    pass


class UnauthorizedError(TripPlanningError):
    """Raised when user is not authorized."""
    pass


# ==================== Season Operations ====================

def create_season(
    db: Session,
    user_id: uuid.UUID,
    season_data: SeasonCreate
) -> Season:
    """Create a new ski season for a user."""
    season = Season(
        user_id=user_id,
        title=season_data.title,
        description=season_data.description,
        start_date=season_data.start_date,
        end_date=season_data.end_date,
        goal_trips=season_data.goal_trips,
        goal_resorts=season_data.goal_resorts,
        goal_courses=season_data.goal_courses,
        status=SeasonStatus.ACTIVE
    )

    db.add(season)
    db.commit()
    db.refresh(season)
    return season


def get_user_seasons(
    db: Session,
    user_id: uuid.UUID,
    status: Optional[SeasonStatus] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Season]:
    """Get all seasons for a user."""
    query = db.query(Season).filter(Season.user_id == user_id)

    if status:
        query = query.filter(Season.status == status)

    return query.order_by(desc(Season.start_date)).offset(skip).limit(limit).all()


def get_season(
    db: Session,
    season_id: uuid.UUID,
    user_id: uuid.UUID
) -> Season:
    """Get a specific season by ID."""
    season = db.query(Season).filter(
        Season.season_id == season_id,
        Season.user_id == user_id
    ).first()

    if not season:
        raise SeasonNotFoundError(f"Season {season_id} not found")

    return season


def update_season(
    db: Session,
    season_id: uuid.UUID,
    user_id: uuid.UUID,
    updates: SeasonUpdate
) -> Season:
    """Update a season."""
    season = get_season(db, season_id, user_id)

    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(season, field, value)

    season.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(season)
    return season


def delete_season(
    db: Session,
    season_id: uuid.UUID,
    user_id: uuid.UUID
) -> bool:
    """Delete a season and all its trips."""
    season = get_season(db, season_id, user_id)
    db.delete(season)
    db.commit()
    return True


def get_season_stats(
    db: Session,
    season_id: uuid.UUID,
    user_id: uuid.UUID
) -> Dict:
    """Get statistics for a season."""
    season = get_season(db, season_id, user_id)

    trips = db.query(Trip).filter(Trip.season_id == season_id).all()

    completed_trips = sum(1 for t in trips if t.trip_status == TripStatus.COMPLETED)
    unique_resorts = len(set(t.resort_id for t in trips))
    total_buddies = sum(t.current_buddies for t in trips)

    return {
        "season_id": season_id,
        "trip_count": len(trips),
        "completed_trips": completed_trips,
        "unique_resorts": unique_resorts,
        "total_buddies": total_buddies,
        "goal_progress": {
            "trips": {"goal": season.goal_trips, "actual": len(trips)},
            "resorts": {"goal": season.goal_resorts, "actual": unique_resorts},
            "courses": {"goal": season.goal_courses, "actual": 0}  # TODO: Link to CourseVisits
        }
    }


# ==================== Trip Operations ====================

def create_trip(
    db: Session,
    user_id: uuid.UUID,
    trip_data: TripCreate
) -> Trip:
    """Create a new trip."""
    # Verify season exists and belongs to user
    season = get_season(db, trip_data.season_id, user_id)

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
    return trip


def create_trips_batch(
    db: Session,
    user_id: uuid.UUID,
    season_id: uuid.UUID,
    trips_data: List[TripBase]
) -> List[Trip]:
    """Create multiple trips at once."""
    # Verify season exists and belongs to user
    season = get_season(db, season_id, user_id)

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


def get_public_trips(
    db: Session,
    skip: int = 0,
    limit: int = 100
) -> List[Trip]:
    """Get all public trips for the Snowbuddy Board."""
    return (
        db.query(Trip)
        .filter(Trip.visibility == 'public')
        .order_by(desc(Trip.start_date))
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_trip(
    db: Session,
    trip_id: uuid.UUID,
    user_id: Optional[uuid.UUID] = None
) -> Trip:
    """Get a specific trip by ID."""
    query = db.query(Trip).filter(Trip.trip_id == trip_id)

    trip = query.first()

    if not trip:
        raise TripNotFoundError(f"Trip {trip_id} not found")

    # Check visibility if user_id provided
    if user_id and trip.user_id != user_id and trip.visibility == TripVisibility.PRIVATE:
        raise UnauthorizedError("You don't have permission to view this trip")

    return trip


def update_trip(
    db: Session,
    trip_id: uuid.UUID,
    user_id: uuid.UUID,
    updates: TripUpdate
) -> Trip:
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


def delete_trip(
    db: Session,
    trip_id: uuid.UUID,
    user_id: uuid.UUID
) -> bool:
    """Delete a trip."""
    trip = get_trip(db, trip_id)

    if trip.user_id != user_id:
        raise UnauthorizedError("You don't have permission to delete this trip")

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
        # Auto-create CourseVisit (user can edit later)
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


# ==================== Buddy Matching ====================

def request_to_join_trip(
    db: Session,
    trip_id: uuid.UUID,
    user_id: uuid.UUID,
    request_message: Optional[str] = None
) -> TripBuddy:
    """Request to join a trip as buddy."""
    trip = get_trip(db, trip_id)

    # Check if trip is open for buddies
    if trip.visibility == TripVisibility.PRIVATE:
        raise BuddyRequestError("This trip is private")

    if trip.current_buddies >= trip.max_buddies:
        raise BuddyRequestError("This trip is full")

    # Check if already requested or joined
    existing = db.query(TripBuddy).filter(
        TripBuddy.trip_id == trip_id,
        TripBuddy.user_id == user_id
    ).first()

    if existing:
        raise BuddyRequestError("You already have a pending or active request for this trip")

    buddy = TripBuddy(
        trip_id=trip_id,
        user_id=user_id,
        role=BuddyRole.BUDDY,
        status=BuddyStatus.PENDING,
        request_message=request_message,
        requested_at=datetime.now(UTC)
    )

    db.add(buddy)
    db.commit()
    db.refresh(buddy)
    return buddy


def respond_to_buddy_request(
    db: Session,
    trip_id: uuid.UUID,
    buddy_id: uuid.UUID,
    owner_id: uuid.UUID,
    status: BuddyStatus,
    response_message: Optional[str] = None
) -> TripBuddy:
    """Respond to a buddy request (accept/decline)."""
    trip = get_trip(db, trip_id)

    if trip.user_id != owner_id:
        raise UnauthorizedError("Only trip owner can respond to buddy requests")

    buddy = db.query(TripBuddy).filter(
        TripBuddy.buddy_id == buddy_id,
        TripBuddy.trip_id == trip_id
    ).first()

    if not buddy:
        raise BuddyRequestError("Buddy request not found")

    buddy.status = status
    buddy.response_message = response_message
    buddy.responded_at = datetime.now(UTC)

    if status == BuddyStatus.ACCEPTED:
        buddy.joined_at = datetime.now(UTC)
        trip.current_buddies += 1

    db.commit()
    db.refresh(buddy)
    db.refresh(trip)
    return buddy


def cancel_buddy_request(
    db: Session,
    trip_id: uuid.UUID,
    buddy_id: uuid.UUID,
    user_id: uuid.UUID
) -> None:
    """Cancel a buddy request by the requester."""
    buddy = db.query(TripBuddy).filter(
        TripBuddy.buddy_id == buddy_id,
        TripBuddy.trip_id == trip_id,
        TripBuddy.user_id == user_id
    ).first()

    if not buddy:
        raise BuddyRequestError("Buddy request not found")

    # 只能取消 pending 狀態的申請
    if buddy.status != BuddyStatus.PENDING:
        raise BuddyRequestError("Can only cancel pending requests")

    # 刪除申請記錄
    db.delete(buddy)
    db.commit()


def get_trip_buddies(
    db: Session,
    trip_id: uuid.UUID
) -> List[TripBuddy]:
    """Get all buddies for a trip."""
    return db.query(TripBuddy).filter(
        TripBuddy.trip_id == trip_id
    ).all()


# ==================== Smart Matching ====================

def calculate_match_score(
    trip_a: Trip,
    trip_b: Trip,
    user_a: UserProfile,
    user_b: UserProfile,
    db: Session
) -> MatchScore:
    """Calculate match score between two trips/users."""
    score = 0
    reasons = []

    # Time matching (max 40)
    if trip_a.start_date == trip_b.start_date and trip_a.end_date == trip_b.end_date:
        score += 40
        reasons.append("完全相同日期")
    elif _has_date_overlap(trip_a, trip_b):
        overlap_days = _calculate_overlap_days(trip_a, trip_b)
        time_score = min(30, overlap_days * 10)
        score += time_score
        reasons.append(f"日期重疊 {overlap_days} 天")
    elif _is_flexibility_compatible(trip_a, trip_b):
        score += 20
        reasons.append("靈活度可配合")

    # Location matching (max 30)
    if trip_a.resort_id == trip_b.resort_id:
        score += 30
        reasons.append("相同雪場")

    # Social factors (max 10)
    # TODO: Check if users follow each other

    return MatchScore(
        total_score=min(100, score),
        time_score=min(40, score),  # Simplified
        location_score=30 if trip_a.resort_id == trip_b.resort_id else 0,
        experience_score=0,  # TODO: Implement
        social_score=0,  # TODO: Implement
        bonus_score=0,
        reasons=reasons
    )


def _has_date_overlap(trip_a: Trip, trip_b: Trip) -> bool:
    """Check if two trips have overlapping dates."""
    return (trip_a.start_date <= trip_b.end_date and
            trip_a.end_date >= trip_b.start_date)


def _calculate_overlap_days(trip_a: Trip, trip_b: Trip) -> int:
    """Calculate number of overlapping days."""
    overlap_start = max(trip_a.start_date, trip_b.start_date)
    overlap_end = min(trip_a.end_date, trip_b.end_date)
    return (overlap_end - overlap_start).days + 1


def _is_flexibility_compatible(trip_a: Trip, trip_b: Trip) -> bool:
    """Check if trips have compatible flexibility."""
    return (trip_a.flexibility != TripFlexibility.FIXED or
            trip_b.flexibility != TripFlexibility.FIXED)


# ==================== Share Operations ====================

def generate_share_link(
    db: Session,
    trip_id: uuid.UUID,
    user_id: uuid.UUID
) -> str:
    """Generate a share link for a trip."""
    trip = get_trip(db, trip_id)

    if trip.user_id != user_id:
        raise UnauthorizedError("Only trip owner can generate share links")

    if not trip.share_token:
        trip.generate_share_token()
        db.commit()
        db.refresh(trip)

    return trip.share_token


def get_trip_by_share_token(
    db: Session,
    share_token: str
) -> Trip:
    """Get a trip by its share token."""
    trip = db.query(Trip).filter(Trip.share_token == share_token).first()

    if not trip:
        raise TripNotFoundError("Invalid share link")

    return trip
