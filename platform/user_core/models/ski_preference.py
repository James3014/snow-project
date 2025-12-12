from sqlalchemy import Column, DateTime, String, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, UTC

from .user_profile import Base


class SkiPreference(Base):
    __tablename__ = 'user_ski_preferences'

    user_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.user_id'), primary_key=True)
    resort_ids = Column(JSON, nullable=False, default=list)
    source = Column(String(100), nullable=False, default='trip_planner')
    last_trip_id = Column(UUID(as_uuid=True), nullable=True)
    last_synced_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    def __repr__(self) -> str:
        return f"<SkiPreference user_id={self.user_id} resorts={len(self.resort_ids or [])}>"
