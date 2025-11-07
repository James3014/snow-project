"""
Trip planning models for ski trip seasons, trips, buddy matching, and sharing.
"""
from sqlalchemy import (
    Column, String, DateTime, JSON, Integer, Text, Date,
    UniqueConstraint, CheckConstraint, ForeignKey, Index, Boolean
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Enum as SQLAlchemyEnum
import uuid
from datetime import datetime, UTC
import secrets

from .user_profile import Base
from .enums import (
    TripFlexibility, FlightStatus, AccommodationStatus, TripStatus,
    TripVisibility, BuddyRole, BuddyStatus, SeasonStatus
)


class Season(Base):
    """
    A ski season (e.g., "2024-2025 冬季", "北海道粉雪季")
    Groups multiple trips together with optional goals.
    """
    __tablename__ = 'seasons'

    season_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.user_id'), nullable=False)

    # Basic info
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    # Goals (optional targets for the season)
    goal_trips = Column(Integer, nullable=True)  # Target number of trips
    goal_resorts = Column(Integer, nullable=True)  # Target number of unique resorts
    goal_courses = Column(Integer, nullable=True)  # Target number of courses

    status = Column(SQLAlchemyEnum(SeasonStatus, native_enum=False),
                   default=SeasonStatus.ACTIVE, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC),
                       onupdate=lambda: datetime.now(UTC), nullable=False)

    # Relationships
    user = relationship("UserProfile", backref="seasons")
    trips = relationship("Trip", back_populates="season", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        Index('idx_seasons_user', 'user_id'),
        Index('idx_seasons_user_status', 'user_id', 'status'),
        CheckConstraint('start_date <= end_date', name='check_season_date_range'),
    )

    def __repr__(self):
        return f"<Season(season_id={self.season_id}, title={self.title})>"


class Trip(Base):
    """
    A single ski trip within a season.
    Can be private or shared with buddies.
    """
    __tablename__ = 'trips'

    trip_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    season_id = Column(UUID(as_uuid=True), ForeignKey('seasons.season_id'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.user_id'), nullable=False)

    # Trip details
    resort_id = Column(String(100), nullable=False)  # References resort API
    title = Column(String(200), nullable=True)  # Optional custom title
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    # Flexibility & booking status
    flexibility = Column(SQLAlchemyEnum(TripFlexibility, native_enum=False),
                        default=TripFlexibility.FIXED, nullable=False)
    flight_status = Column(SQLAlchemyEnum(FlightStatus, native_enum=False),
                          default=FlightStatus.NOT_PLANNED, nullable=False)
    accommodation_status = Column(SQLAlchemyEnum(AccommodationStatus, native_enum=False),
                                 default=AccommodationStatus.NOT_PLANNED, nullable=False)

    # Trip status
    trip_status = Column(SQLAlchemyEnum(TripStatus, native_enum=False),
                        default=TripStatus.PLANNING, nullable=False)

    # Sharing & buddies
    visibility = Column(SQLAlchemyEnum(TripVisibility, native_enum=False),
                       default=TripVisibility.PRIVATE, nullable=False)
    share_token = Column(String(64), unique=True, nullable=True)  # For share links
    max_buddies = Column(Integer, default=0, nullable=False)  # 0 = solo trip
    current_buddies = Column(Integer, default=0, nullable=False)  # Count of accepted buddies

    # Additional info
    notes = Column(Text, nullable=True)

    # Completion tracking
    completed_at = Column(DateTime, nullable=True)
    course_visit_id = Column(UUID(as_uuid=True), nullable=True)  # Auto-created CourseVisit after completion

    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC),
                       onupdate=lambda: datetime.now(UTC), nullable=False)

    # Relationships
    season = relationship("Season", back_populates="trips")
    user = relationship("UserProfile", backref="trips")
    buddies = relationship("TripBuddy", back_populates="trip", cascade="all, delete-orphan")
    shares = relationship("TripShare", back_populates="trip", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        Index('idx_trips_user', 'user_id'),
        Index('idx_trips_season', 'season_id'),
        Index('idx_trips_resort', 'resort_id'),
        Index('idx_trips_user_status', 'user_id', 'trip_status'),
        Index('idx_trips_visibility', 'visibility'),
        Index('idx_trips_date_range', 'start_date', 'end_date'),
        CheckConstraint('start_date <= end_date', name='check_trip_date_range'),
        CheckConstraint('max_buddies >= 0', name='check_max_buddies'),
        CheckConstraint('current_buddies >= 0', name='check_current_buddies'),
    )

    def __repr__(self):
        return f"<Trip(trip_id={self.trip_id}, resort={self.resort_id}, status={self.trip_status})>"

    def generate_share_token(self):
        """Generate a unique share token for this trip."""
        if not self.share_token:
            self.share_token = secrets.token_urlsafe(32)
        return self.share_token


class TripBuddy(Base):
    """
    Links users to trips as buddies (many-to-many relationship).
    Tracks buddy request status and role.
    """
    __tablename__ = 'trip_buddies'

    buddy_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(UUID(as_uuid=True), ForeignKey('trips.trip_id'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.user_id'), nullable=False)

    role = Column(SQLAlchemyEnum(BuddyRole, native_enum=False),
                 default=BuddyRole.BUDDY, nullable=False)
    status = Column(SQLAlchemyEnum(BuddyStatus, native_enum=False),
                   default=BuddyStatus.PENDING, nullable=False)

    request_message = Column(Text, nullable=True)  # Message when requesting to join
    response_message = Column(Text, nullable=True)  # Owner's response message

    requested_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    responded_at = Column(DateTime, nullable=True)
    joined_at = Column(DateTime, nullable=True)  # When status became CONFIRMED

    # Relationships
    trip = relationship("Trip", back_populates="buddies")
    user = relationship("UserProfile", backref="trip_buddies")

    # Constraints
    __table_args__ = (
        UniqueConstraint('trip_id', 'user_id', name='uq_trip_user_buddy'),
        Index('idx_trip_buddies_trip', 'trip_id'),
        Index('idx_trip_buddies_user', 'user_id'),
        Index('idx_trip_buddies_status', 'status'),
    )

    def __repr__(self):
        return f"<TripBuddy(trip_id={self.trip_id}, user_id={self.user_id}, status={self.status})>"


class TripShare(Base):
    """
    Custom sharing settings for trips.
    Allows trip owner to share with specific users or emails.
    """
    __tablename__ = 'trip_shares'

    share_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(UUID(as_uuid=True), ForeignKey('trips.trip_id'), nullable=False)

    # Can share with registered user OR by email (for non-registered users)
    shared_with_user_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.user_id'), nullable=True)
    shared_with_email = Column(String(255), nullable=True)

    # Permissions
    can_edit = Column(Boolean, default=False, nullable=False)
    can_invite_buddies = Column(Boolean, default=False, nullable=False)

    # Expiry
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    expires_at = Column(DateTime, nullable=True)  # Optional expiration

    # Relationships
    trip = relationship("Trip", back_populates="shares")
    shared_with_user = relationship("UserProfile", backref="shared_trips")

    # Constraints
    __table_args__ = (
        Index('idx_trip_shares_trip', 'trip_id'),
        Index('idx_trip_shares_user', 'shared_with_user_id'),
        Index('idx_trip_shares_email', 'shared_with_email'),
        CheckConstraint(
            '(shared_with_user_id IS NOT NULL OR shared_with_email IS NOT NULL)',
            name='check_share_recipient'
        ),
    )

    def __repr__(self):
        recipient = self.shared_with_user_id or self.shared_with_email
        return f"<TripShare(trip_id={self.trip_id}, recipient={recipient})>"
