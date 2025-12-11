"""
Social features models: follows, activity feed, likes, and comments.
"""
from sqlalchemy import (
    Column, String, DateTime, JSON, Integer, Text,
    UniqueConstraint, CheckConstraint, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, UTC

from .user_profile import Base


class Friendship(Base):
    """Friendship relationships between users."""
    __tablename__ = 'friendships'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.user_id'), nullable=False)
    friend_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.user_id'), nullable=False)
    status = Column(String(20), default='pending', nullable=False)  # 'pending', 'accepted', 'declined'
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC),
                       onupdate=lambda: datetime.now(UTC), nullable=False)

    # Relationships
    user = relationship("UserProfile", foreign_keys=[user_id])
    friend = relationship("UserProfile", foreign_keys=[friend_id])

    __table_args__ = (
        UniqueConstraint('user_id', 'friend_id', name='uq_user_friend'),
        CheckConstraint('user_id != friend_id', name='check_no_self_friend'),
        Index('idx_friendship_user', 'user_id'),
        Index('idx_friendship_friend', 'friend_id'),
        Index('idx_friendship_status', 'status'),
    )


class UserFollow(Base):
    """User follow relationships."""
    __tablename__ = 'user_follows'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    follower_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.user_id'), nullable=False)
    following_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.user_id'), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    # Relationships
    follower = relationship("UserProfile", foreign_keys=[follower_id], backref="following")
    following = relationship("UserProfile", foreign_keys=[following_id], backref="followers")

    # Constraints
    __table_args__ = (
        UniqueConstraint('follower_id', 'following_id', name='uq_follower_following'),
        CheckConstraint('follower_id != following_id', name='check_no_self_follow'),
        Index('idx_follows_follower', 'follower_id'),
        Index('idx_follows_following', 'following_id'),
        Index('idx_follows_created', 'created_at'),
    )

    def __repr__(self):
        return f"<UserFollow(follower={self.follower_id}, following={self.following_id})>"


class ActivityFeedItem(Base):
    """Activity feed items - posts from users."""
    __tablename__ = 'activity_feed_items'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.user_id'), nullable=False)
    activity_type = Column(String(50), nullable=False)  # 'course_visit', 'achievement_earned', etc.
    entity_type = Column(String(50), nullable=True)  # Type of related entity
    entity_id = Column(UUID(as_uuid=True), nullable=True)  # ID of related entity
    content_json = Column(JSON, nullable=False)  # Flexible content storage
    visibility = Column(String(20), default='public', nullable=False)  # 'public', 'followers', 'private'

    # Denormalized counts for performance
    likes_count = Column(Integer, default=0, nullable=False)
    comments_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC),
                       onupdate=lambda: datetime.now(UTC), nullable=False)

    # Relationships
    user = relationship("UserProfile", backref="feed_items")

    # Constraints
    __table_args__ = (
        Index('idx_feed_user_id', 'user_id'),
        Index('idx_feed_created_at', 'created_at'),
        Index('idx_feed_visibility', 'visibility'),
        Index('idx_feed_type', 'activity_type'),
        Index('idx_feed_user_created', 'user_id', 'created_at'),
        Index('idx_feed_visibility_created', 'visibility', 'created_at'),
    )

    def __repr__(self):
        return f"<ActivityFeedItem(user_id={self.user_id}, type={self.activity_type})>"


class ActivityLike(Base):
    """Likes on activity feed items."""
    __tablename__ = 'activity_likes'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    activity_id = Column(UUID(as_uuid=True), ForeignKey('activity_feed_items.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.user_id'), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    # Relationships
    activity = relationship("ActivityFeedItem", backref="likes")
    user = relationship("UserProfile", backref="likes")

    # Constraints
    __table_args__ = (
        UniqueConstraint('activity_id', 'user_id', name='uq_activity_user_like'),
        Index('idx_likes_activity', 'activity_id'),
        Index('idx_likes_user', 'user_id'),
        Index('idx_likes_created', 'created_at'),
    )

    def __repr__(self):
        return f"<ActivityLike(activity_id={self.activity_id}, user_id={self.user_id})>"


class ActivityComment(Base):
    """Comments on activity feed items."""
    __tablename__ = 'activity_comments'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    activity_id = Column(UUID(as_uuid=True), ForeignKey('activity_feed_items.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.user_id'), nullable=False)
    content = Column(Text, nullable=False)
    parent_comment_id = Column(UUID(as_uuid=True), ForeignKey('activity_comments.id', ondelete='CASCADE'), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC),
                       onupdate=lambda: datetime.now(UTC), nullable=False)

    # Relationships
    activity = relationship("ActivityFeedItem", backref="comments")
    user = relationship("UserProfile", backref="comments")
    parent = relationship("ActivityComment", remote_side=[id], backref="replies")

    # Constraints
    __table_args__ = (
        Index('idx_comments_activity', 'activity_id', 'created_at'),
        Index('idx_comments_user', 'user_id'),
        Index('idx_comments_parent', 'parent_comment_id'),
    )

    def __repr__(self):
        return f"<ActivityComment(activity_id={self.activity_id}, user_id={self.user_id})>"
