"""
Buddy matching models for CASI skill profiles and match search cache.
"""
from sqlalchemy import (
    Column, String, DateTime, JSON, Float, Text,
    CheckConstraint, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, UTC, timedelta

from .user_profile import Base


class CASISkillProfile(Base):
    """
    Stores user's CASI (Canadian Association of Snowboard Instructors) skill mastery.
    Tracks proficiency in five core snowboarding skills.
    """
    __tablename__ = 'casi_skill_profiles'

    user_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.user_id'),
                    primary_key=True)

    # CASI Five Core Skills (0.0 - 1.0 range)
    stance_balance = Column(Float, nullable=False, default=0.0)      # 站姿與平衡
    rotation = Column(Float, nullable=False, default=0.0)            # 旋轉
    edging = Column(Float, nullable=False, default=0.0)              # 用刃
    pressure = Column(Float, nullable=False, default=0.0)            # 壓力
    timing_coordination = Column(Float, nullable=False, default=0.0) # 時機與協調性

    updated_at = Column(DateTime, default=lambda: datetime.now(UTC),
                       onupdate=lambda: datetime.now(UTC), nullable=False)

    # Relationships
    user = relationship("UserProfile", backref="casi_skill_profile")

    # Constraints
    __table_args__ = (
        CheckConstraint(
            'stance_balance >= 0 AND stance_balance <= 1',
            name='check_stance_balance_range'
        ),
        CheckConstraint(
            'rotation >= 0 AND rotation <= 1',
            name='check_rotation_range'
        ),
        CheckConstraint(
            'edging >= 0 AND edging <= 1',
            name='check_edging_range'
        ),
        CheckConstraint(
            'pressure >= 0 AND pressure <= 1',
            name='check_pressure_range'
        ),
        CheckConstraint(
            'timing_coordination >= 0 AND timing_coordination <= 1',
            name='check_timing_coordination_range'
        ),
    )

    def __repr__(self):
        return f"<CASISkillProfile(user_id={self.user_id})>"


class MatchSearchCache(Base):
    """
    Caches buddy matching search results to improve performance.
    Results expire after a configurable time period.
    """
    __tablename__ = 'match_search_cache'

    search_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(UUID(as_uuid=True), ForeignKey('trips.trip_id', ondelete='CASCADE'),
                    nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.user_id'),
                    nullable=False)

    # Cached results stored as JSON
    results = Column(JSON, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    expires_at = Column(DateTime,
                       default=lambda: datetime.now(UTC) + timedelta(hours=1),
                       nullable=False)

    # Relationships
    trip = relationship("Trip", backref="match_cache")
    user = relationship("UserProfile", backref="match_searches")

    # Constraints
    __table_args__ = (
        Index('idx_match_cache_trip', 'trip_id'),
        Index('idx_match_cache_user', 'user_id'),
        Index('idx_match_cache_expires', 'expires_at'),
    )

    def __repr__(self):
        return f"<MatchSearchCache(search_id={self.search_id}, trip_id={self.trip_id})>"
