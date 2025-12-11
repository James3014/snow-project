"""
Calendar-related SQLAlchemy models (new unified date system).
"""
from datetime import datetime, UTC
import uuid

from sqlalchemy import (
    Column,
    String,
    DateTime,
    Integer,
    Text,
    Boolean,
    ForeignKey,
    JSON,
    Index,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
from sqlalchemy import Enum as SQLAlchemyEnum

from .user_profile import Base
from domain.calendar.enums import (
    TripVisibility,
    TripStatus,
    EventType,
    BuddyStatus,
    BuddyRole,
    MatchingStatus,
)


def tznow() -> datetime:
    return datetime.now(UTC)


class CalendarTrip(Base):
    __tablename__ = "calendar_trips"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("user_profiles.user_id"), nullable=False)
    title = Column(String(200), nullable=False)
    template_id = Column(String(100), nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    timezone = Column(String(64), nullable=False, default="Asia/Taipei")
    visibility = Column(SQLAlchemyEnum(TripVisibility, native_enum=False), nullable=False, default=TripVisibility.PRIVATE)
    status = Column(SQLAlchemyEnum(TripStatus, native_enum=False), nullable=False, default=TripStatus.PLANNING)
    resort_id = Column(String(100), nullable=True)
    resort_name = Column(String(200), nullable=True)
    region = Column(String(100), nullable=True)
    people_count = Column(Integer, nullable=True)
    note = Column(Text, nullable=True)
    max_buddies = Column(Integer, nullable=False, default=1)
    current_buddies = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=tznow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=tznow, onupdate=tznow, nullable=False)

    days = relationship("CalendarDay", back_populates="trip", cascade="all, delete-orphan")
    items = relationship("CalendarItem", back_populates="trip", cascade="all, delete-orphan")
    buddies = relationship("CalendarTripBuddy", back_populates="trip", cascade="all, delete-orphan")
    events = relationship("CalendarEvent", back_populates="trip")
    matching_requests = relationship("CalendarMatchingRequest", back_populates="trip")

    __table_args__ = (
        Index("idx_calendar_trips_user", "user_id"),
        Index("idx_calendar_trips_date", "start_date", "end_date"),
    )


class CalendarDay(Base):
    __tablename__ = "calendar_days"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(PGUUID(as_uuid=True), ForeignKey("calendar_trips.id", ondelete="CASCADE"), nullable=False)
    day_index = Column(Integer, nullable=False)
    label = Column(String(100), nullable=False)
    city = Column(String(100), nullable=True)
    resort_id = Column(String(100), nullable=True)
    resort_name = Column(String(200), nullable=True)
    region = Column(String(100), nullable=True)
    is_ski_day = Column(Boolean, nullable=False, default=False)

    trip = relationship("CalendarTrip", back_populates="days")
    items = relationship("CalendarItem", back_populates="day", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_calendar_days_trip", "trip_id"),
        UniqueConstraint("trip_id", "day_index", name="uq_calendar_trip_day_index"),
    )


class CalendarItem(Base):
    __tablename__ = "calendar_items"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(PGUUID(as_uuid=True), ForeignKey("calendar_trips.id", ondelete="CASCADE"), nullable=False)
    day_id = Column(PGUUID(as_uuid=True), ForeignKey("calendar_days.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    time_hint = Column(String(50), nullable=True)
    location = Column(String(200), nullable=True)
    resort_id = Column(String(100), nullable=True)
    resort_name = Column(String(200), nullable=True)
    note = Column(Text, nullable=True)

    day = relationship("CalendarDay", back_populates="items")
    trip = relationship("CalendarTrip", back_populates="items")

    __table_args__ = (
        Index("idx_calendar_items_day", "day_id"),
    )


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("user_profiles.user_id"), nullable=False)
    type = Column(SQLAlchemyEnum(EventType, native_enum=False), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    all_day = Column(Boolean, nullable=False, default=False)
    timezone = Column(String(64), nullable=False, default="Asia/Taipei")
    trip_id = Column(PGUUID(as_uuid=True), ForeignKey("calendar_trips.id"), nullable=True)
    resort_id = Column(String(100), nullable=True)
    google_event_id = Column(String(128), nullable=True)
    outlook_event_id = Column(String(128), nullable=True)
    matching_id = Column(PGUUID(as_uuid=True), nullable=True)
    participants = Column(JSON, nullable=True)
    reminders = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=tznow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=tznow, onupdate=tznow, nullable=False)

    trip = relationship("CalendarTrip", back_populates="events")

    __table_args__ = (
        Index("idx_calendar_events_user_date", "user_id", "start_date"),
        Index("idx_calendar_events_type", "type", "start_date"),
    )


class CalendarTripBuddy(Base):
    __tablename__ = "calendar_trip_buddies"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(PGUUID(as_uuid=True), ForeignKey("calendar_trips.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("user_profiles.user_id"), nullable=False)
    inviter_id = Column(PGUUID(as_uuid=True), ForeignKey("user_profiles.user_id"), nullable=False)
    status = Column(SQLAlchemyEnum(BuddyStatus, native_enum=False), nullable=False, default=BuddyStatus.PENDING)
    role = Column(SQLAlchemyEnum(BuddyRole, native_enum=False), nullable=False, default=BuddyRole.BUDDY)
    request_message = Column(Text, nullable=True)
    response_message = Column(Text, nullable=True)
    requested_at = Column(DateTime(timezone=True), default=tznow, nullable=False)
    responded_at = Column(DateTime(timezone=True), nullable=True)
    joined_at = Column(DateTime(timezone=True), nullable=True)

    trip = relationship("CalendarTrip", back_populates="buddies")
    user = relationship("UserProfile", foreign_keys=[user_id])
    inviter = relationship("UserProfile", foreign_keys=[inviter_id])

    __table_args__ = (
        UniqueConstraint("trip_id", "user_id", name="uq_calendar_trip_user"),
        Index("idx_calendar_trip_buddies_trip", "trip_id"),
        Index("idx_calendar_trip_buddies_user", "user_id"),
    )


class CalendarMatchingRequest(Base):
    __tablename__ = "calendar_matching_requests"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(PGUUID(as_uuid=True), ForeignKey("calendar_trips.id", ondelete="CASCADE"), nullable=False)
    requester_id = Column(PGUUID(as_uuid=True), ForeignKey("user_profiles.user_id"), nullable=False)
    preferences = Column(JSON, nullable=False)
    status = Column(SQLAlchemyEnum(MatchingStatus, native_enum=False), nullable=False, default=MatchingStatus.PENDING)
    results = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=tznow, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    trip = relationship("CalendarTrip", back_populates="matching_requests")
    requester = relationship("UserProfile", foreign_keys=[requester_id])

    __table_args__ = (
        Index("idx_calendar_matching_requests_trip", "trip_id"),
        Index("idx_calendar_matching_requests_requester", "requester_id"),
    )
