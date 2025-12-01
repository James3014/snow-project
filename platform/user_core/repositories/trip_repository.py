"""Trip repository for trip planning operations."""
from typing import Optional, List
from datetime import date
import uuid

from sqlalchemy.orm import Session
from sqlalchemy import desc, and_

from repositories.base import BaseRepository
from models.trip_planning import Season, Trip
from models.enums import SeasonStatus, TripStatus


class SeasonRepository(BaseRepository[Season]):
    """Repository for Season operations."""
    
    def __init__(self, db: Session):
        super().__init__(Season, db)
    
    def get_by_user(self, user_id: uuid.UUID, status: Optional[SeasonStatus] = None,
                    skip: int = 0, limit: int = 100) -> List[Season]:
        """Get seasons by user."""
        query = self.db.query(Season).filter(Season.user_id == user_id)
        if status:
            query = query.filter(Season.status == status)
        return query.order_by(desc(Season.start_date)).offset(skip).limit(limit).all()
    
    def get_by_user_and_id(self, season_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Season]:
        """Get season by ID and user ID."""
        return self.db.query(Season).filter(
            Season.id == season_id,
            Season.user_id == user_id
        ).first()


class TripRepository(BaseRepository[Trip]):
    """Repository for Trip operations."""
    
    def __init__(self, db: Session):
        super().__init__(Trip, db)
    
    def get_by_season(self, season_id: uuid.UUID, status: Optional[TripStatus] = None,
                      skip: int = 0, limit: int = 100) -> List[Trip]:
        """Get trips by season."""
        query = self.db.query(Trip).filter(Trip.season_id == season_id)
        if status:
            query = query.filter(Trip.status == status)
        return query.order_by(Trip.start_date).offset(skip).limit(limit).all()
    
    def get_by_user(self, user_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Trip]:
        """Get all trips by user across all seasons."""
        return self.db.query(Trip).join(Season).filter(
            Season.user_id == user_id
        ).order_by(desc(Trip.start_date)).offset(skip).limit(limit).all()
    
    def get_by_id_and_user(self, trip_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Trip]:
        """Get trip by ID and verify user ownership."""
        return self.db.query(Trip).join(Season).filter(
            Trip.id == trip_id,
            Season.user_id == user_id
        ).first()
    
    def get_upcoming(self, user_id: uuid.UUID, limit: int = 10) -> List[Trip]:
        """Get upcoming trips for user."""
        today = date.today()
        return self.db.query(Trip).join(Season).filter(
            Season.user_id == user_id,
            Trip.start_date >= today,
            Trip.status == TripStatus.planned
        ).order_by(Trip.start_date).limit(limit).all()
