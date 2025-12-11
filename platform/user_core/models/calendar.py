"""
Calendar-related SQLAlchemy models (shared calendar infrastructure).
"""
from datetime import datetime, UTC
import uuid

from sqlalchemy import (
    Column,
    String,
    DateTime,
    Text,
    Boolean,
    ForeignKey,
    JSON,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
from sqlalchemy import Enum as SQLAlchemyEnum

from .user_profile import Base
from domain.calendar.enums import EventType


def tznow() -> datetime:
    return datetime.now(UTC)


class CalendarEvent(Base):
    """
    Shared calendar event model.
    
    This is the core model for the shared calendar infrastructure.
    All applications (Trip Planning, Tour, Matching) create and query events through this model.
    """
    __tablename__ = "calendar_events"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("user_profiles.user_id"), nullable=False)
    
    # Event basic information
    type = Column(SQLAlchemyEnum(EventType, native_enum=False), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Time information
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    all_day = Column(Boolean, nullable=False, default=False)
    timezone = Column(String(64), nullable=False, default="Asia/Taipei")
    
    # Source tracking - which application created this event
    source_app = Column(String(50), nullable=False, comment="Source application (trip_planning, tour, matching, etc.)")
    source_id = Column(String(100), nullable=False, comment="Source application's ID for this event")
    
    # Optional relations
    related_trip_id = Column(String(100), nullable=True, comment="Related trip ID if applicable")
    resort_id = Column(String(100), nullable=True)
    
    # External calendar sync
    google_event_id = Column(String(128), nullable=True)
    outlook_event_id = Column(String(128), nullable=True)
    
    # Matching related
    matching_id = Column(PGUUID(as_uuid=True), nullable=True)
    participants = Column(JSON, nullable=True)
    
    # Reminders system
    reminders = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=tznow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=tznow, onupdate=tznow, nullable=False)

    __table_args__ = (
        Index("idx_calendar_events_user_date", "user_id", "start_date"),
        Index("idx_calendar_events_type", "type", "start_date"),
        Index("idx_calendar_events_source", "source_app", "source_id"),
    )
