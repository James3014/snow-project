"""Buddy service - business logic for buddy matching."""
from datetime import datetime, UTC
from typing import List, Optional
import uuid

from sqlalchemy.orm import Session
from models.trip_planning import Trip, TripBuddy
from models.user_profile import UserProfile
from models.enums import TripVisibility, BuddyRole, BuddyStatus, TripFlexibility
from schemas.trip_planning import MatchScore
from .trip_service import get_trip, UnauthorizedError


class BuddyRequestError(Exception):
    """Raised when buddy request fails."""
    pass


def request_to_join_trip(db: Session, trip_id: uuid.UUID, user_id: uuid.UUID,
                         request_message: Optional[str] = None) -> TripBuddy:
    """Request to join a trip as buddy."""
    trip = get_trip(db, trip_id)
    if trip.visibility == TripVisibility.PRIVATE:
        raise BuddyRequestError("This trip is private")
    if trip.current_buddies >= trip.max_buddies:
        raise BuddyRequestError("This trip is full")

    existing = db.query(TripBuddy).filter(TripBuddy.trip_id == trip_id, TripBuddy.user_id == user_id).first()
    if existing:
        raise BuddyRequestError("You already have a pending or active request for this trip")

    buddy = TripBuddy(
        trip_id=trip_id, user_id=user_id, role=BuddyRole.BUDDY,
        status=BuddyStatus.PENDING, request_message=request_message, requested_at=datetime.now(UTC)
    )
    db.add(buddy)
    db.commit()
    db.refresh(buddy)
    return buddy


def respond_to_buddy_request(db: Session, trip_id: uuid.UUID, buddy_id: uuid.UUID, owner_id: uuid.UUID,
                             status: BuddyStatus, response_message: Optional[str] = None) -> TripBuddy:
    """Respond to a buddy request (accept/decline)."""
    trip = get_trip(db, trip_id)
    if trip.user_id != owner_id:
        raise UnauthorizedError("Only trip owner can respond to buddy requests")

    buddy = db.query(TripBuddy).filter(TripBuddy.buddy_id == buddy_id, TripBuddy.trip_id == trip_id).first()
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


def get_trip_buddies(db: Session, trip_id: uuid.UUID) -> List[TripBuddy]:
    """Get all buddies for a trip."""
    return db.query(TripBuddy).filter(TripBuddy.trip_id == trip_id).all()


def calculate_match_score(trip_a: Trip, trip_b: Trip, user_a: UserProfile, user_b: UserProfile, db: Session) -> MatchScore:
    """Calculate match score between two trips/users."""
    score = 0
    reasons = []

    # Time matching (max 40)
    if trip_a.start_date == trip_b.start_date and trip_a.end_date == trip_b.end_date:
        score += 40
        reasons.append("完全相同日期")
    elif _has_date_overlap(trip_a, trip_b):
        overlap_days = _calculate_overlap_days(trip_a, trip_b)
        score += min(30, overlap_days * 10)
        reasons.append(f"日期重疊 {overlap_days} 天")
    elif _is_flexibility_compatible(trip_a, trip_b):
        score += 20
        reasons.append("靈活度可配合")

    # Location matching (max 30)
    if trip_a.resort_id == trip_b.resort_id:
        score += 30
        reasons.append("相同雪場")

    return MatchScore(
        total_score=min(100, score), time_score=min(40, score),
        location_score=30 if trip_a.resort_id == trip_b.resort_id else 0,
        experience_score=0, social_score=0, bonus_score=0, reasons=reasons
    )


def _has_date_overlap(trip_a: Trip, trip_b: Trip) -> bool:
    return trip_a.start_date <= trip_b.end_date and trip_a.end_date >= trip_b.start_date


def _calculate_overlap_days(trip_a: Trip, trip_b: Trip) -> int:
    overlap_start = max(trip_a.start_date, trip_b.start_date)
    overlap_end = min(trip_a.end_date, trip_b.end_date)
    return (overlap_end - overlap_start).days + 1


def _is_flexibility_compatible(trip_a: Trip, trip_b: Trip) -> bool:
    return trip_a.flexibility != TripFlexibility.FIXED or trip_b.flexibility != TripFlexibility.FIXED
