"""Season service - business logic for ski seasons."""
from datetime import datetime, UTC
from typing import List, Optional, Dict
import uuid

from sqlalchemy import desc
from sqlalchemy.orm import Session
from models.trip_planning import Season, Trip
from models.enums import SeasonStatus, TripStatus
from schemas.trip_planning import SeasonCreate, SeasonUpdate


class SeasonNotFoundError(Exception):
    """Raised when season is not found."""
    pass


def create_season(db: Session, user_id: uuid.UUID, season_data: SeasonCreate) -> Season:
    """Create a new ski season for a user."""
    season = Season(
        user_id=user_id, title=season_data.title, description=season_data.description,
        start_date=season_data.start_date, end_date=season_data.end_date,
        goal_trips=season_data.goal_trips, goal_resorts=season_data.goal_resorts,
        goal_courses=season_data.goal_courses, status=SeasonStatus.ACTIVE
    )
    db.add(season)
    db.commit()
    db.refresh(season)
    return season


def get_user_seasons(db: Session, user_id: uuid.UUID, status: Optional[SeasonStatus] = None,
                     skip: int = 0, limit: int = 100) -> List[Season]:
    """Get all seasons for a user."""
    query = db.query(Season).filter(Season.user_id == user_id)
    if status:
        query = query.filter(Season.status == status)
    return query.order_by(desc(Season.start_date)).offset(skip).limit(limit).all()


def get_season(db: Session, season_id: uuid.UUID, user_id: uuid.UUID) -> Season:
    """Get a specific season by ID."""
    season = db.query(Season).filter(Season.season_id == season_id, Season.user_id == user_id).first()
    if not season:
        raise SeasonNotFoundError(f"Season {season_id} not found")
    return season


def update_season(db: Session, season_id: uuid.UUID, user_id: uuid.UUID, updates: SeasonUpdate) -> Season:
    """Update a season."""
    season = get_season(db, season_id, user_id)
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(season, field, value)
    season.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(season)
    return season


def delete_season(db: Session, season_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    """Delete a season and all its trips."""
    season = get_season(db, season_id, user_id)
    db.delete(season)
    db.commit()
    return True


def get_season_stats(db: Session, season_id: uuid.UUID, user_id: uuid.UUID) -> Dict:
    """Get statistics for a season."""
    season = get_season(db, season_id, user_id)
    trips = db.query(Trip).filter(Trip.season_id == season_id).all()
    completed_trips = sum(1 for t in trips if t.trip_status == TripStatus.COMPLETED)
    unique_resorts = len(set(t.resort_id for t in trips))
    total_buddies = sum(t.current_buddies for t in trips)

    return {
        "season_id": season_id, "trip_count": len(trips), "completed_trips": completed_trips,
        "unique_resorts": unique_resorts, "total_buddies": total_buddies,
        "goal_progress": {
            "trips": {"goal": season.goal_trips, "actual": len(trips)},
            "resorts": {"goal": season.goal_resorts, "actual": unique_resorts},
            "courses": {"goal": season.goal_courses, "actual": 0}
        }
    }
