"""
Course tracking models for ski resort course visits, recommendations, and achievements.
"""
from sqlalchemy import (
    Column, String, DateTime, JSON, Integer, Text, Date, Boolean,
    UniqueConstraint, CheckConstraint, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, UTC

from .user_profile import Base


class CourseVisit(Base):
    """Records when a user visits/completes a ski course at a resort."""
    __tablename__ = 'course_visits'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.user_id'), nullable=False)
    resort_id = Column(String(100), nullable=False)
    course_name = Column(String(200), nullable=False)
    visited_date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)

    # 新增：增強紀錄體驗欄位
    snow_condition = Column(String(50), nullable=True)  # 粉雪/壓雪/冰面/融雪
    weather = Column(String(50), nullable=True)  # 晴天/陰天/下雪/暴風雪
    difficulty_feeling = Column(String(50), nullable=True)  # 比預期簡單/適中/困難
    rating = Column(Integer, nullable=True)  # 1-5 星評分
    mood_tags = Column(JSON, nullable=True)  # ["爽快", "累爆", "初體驗"]

    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    # Relationships
    user = relationship("UserProfile", backref="course_visits")

    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'resort_id', 'course_name', 'visited_date',
                        name='uq_user_resort_course_date'),
        Index('idx_course_visits_user', 'user_id'),
        Index('idx_course_visits_resort', 'resort_id'),
        Index('idx_course_visits_user_resort', 'user_id', 'resort_id'),
    )

    def __repr__(self):
        return f"<CourseVisit(user_id={self.user_id}, resort={self.resort_id}, course={self.course_name})>"


class CourseRecommendation(Base):
    """User recommendations for ski courses with ranking and reasons."""
    __tablename__ = 'course_recommendations'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.user_id'), nullable=False)
    resort_id = Column(String(100), nullable=False)
    course_name = Column(String(200), nullable=False)
    rank = Column(Integer, nullable=False)  # 1, 2, or 3 for top 3
    reason = Column(Text, nullable=True)
    status = Column(String(20), default='pending_review', nullable=False)  # pending_review, approved, rejected
    reviewed_by = Column(UUID(as_uuid=True), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC),
                       onupdate=lambda: datetime.now(UTC), nullable=False)

    # Relationships
    user = relationship("UserProfile", backref="course_recommendations")

    # Constraints
    __table_args__ = (
        CheckConstraint('rank >= 1 AND rank <= 3', name='check_rank_range'),
        UniqueConstraint('user_id', 'resort_id', 'rank',
                        name='uq_user_resort_rank'),
        UniqueConstraint('user_id', 'resort_id', 'course_name',
                        name='uq_user_resort_course'),
        Index('idx_recommendations_user', 'user_id'),
        Index('idx_recommendations_resort', 'resort_id'),
        Index('idx_recommendations_status', 'status'),
        Index('idx_recommendations_resort_status', 'resort_id', 'status'),
    )

    def __repr__(self):
        return f"<CourseRecommendation(user_id={self.user_id}, resort={self.resort_id}, rank={self.rank})>"


class UserAchievement(Base):
    """User achievements/badges earned through various activities."""
    __tablename__ = 'user_achievements'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.user_id'), nullable=False)
    achievement_type = Column(String(50), nullable=False)  # e.g., 'course_collector_level_2'
    achievement_data = Column(JSON, nullable=True)  # Additional context data
    points = Column(Integer, default=0, nullable=False)  # Achievement points
    earned_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    # Relationships
    user = relationship("UserProfile", backref="achievements")

    # Constraints
    __table_args__ = (
        Index('idx_achievements_user', 'user_id'),
        Index('idx_achievements_type', 'achievement_type'),
        Index('idx_achievements_user_type', 'user_id', 'achievement_type'),
    )

    def __repr__(self):
        return f"<UserAchievement(user_id={self.user_id}, type={self.achievement_type}, points={self.points})>"


class AchievementDefinition(Base):
    """Defines available achievements and their requirements."""
    __tablename__ = 'achievement_definitions'

    achievement_type = Column(String(50), primary_key=True)
    name_zh = Column(String(100), nullable=False)
    name_en = Column(String(100), nullable=False)
    description_zh = Column(Text, nullable=True)
    description_en = Column(Text, nullable=True)
    icon = Column(String(20), nullable=False)  # Emoji or icon identifier
    category = Column(String(30), nullable=False)  # basic, advanced, expert, special
    points = Column(Integer, default=0, nullable=False)
    requirements = Column(JSON, nullable=False)  # Conditions to earn this achievement
    is_hidden = Column(Boolean, default=False, nullable=False)  # Hidden achievements (surprises)
    display_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    def __repr__(self):
        return f"<AchievementDefinition(type={self.achievement_type}, name={self.name_zh})>"
