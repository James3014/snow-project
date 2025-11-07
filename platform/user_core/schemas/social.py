"""
Pydantic schemas for social features.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# ==================== Follow Schemas ====================

class FollowCreate(BaseModel):
    """Schema for creating a follow relationship."""
    pass  # No additional fields needed, user IDs come from path/auth


class FollowResponse(BaseModel):
    """Schema for follow relationship response."""
    id: UUID
    follower_id: UUID
    following_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FollowStats(BaseModel):
    """User follow statistics."""
    followers_count: int
    following_count: int
    is_following: bool = False  # Whether current user follows this user


# ==================== User Info (for embedding in responses) ====================

class UserInfo(BaseModel):
    """Basic user information for embedding in feed items."""
    user_id: UUID
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    experience_level: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ==================== Activity Feed Schemas ====================

class ActivityFeedItemCreate(BaseModel):
    """Schema for creating a feed item."""
    activity_type: str = Field(..., max_length=50)
    entity_type: Optional[str] = Field(None, max_length=50)
    entity_id: Optional[UUID] = None
    content_json: dict
    visibility: str = Field('public', pattern='^(public|followers|private)$')


class ActivityFeedItemResponse(BaseModel):
    """Schema for feed item response."""
    id: UUID
    user_id: UUID
    activity_type: str
    entity_type: Optional[str]
    entity_id: Optional[UUID]
    content_json: dict
    visibility: str
    likes_count: int
    comments_count: int
    created_at: datetime
    updated_at: datetime

    # Additional fields added by service layer
    is_liked: bool = False
    user: Optional[UserInfo] = None

    model_config = ConfigDict(from_attributes=True)


class FeedResponse(BaseModel):
    """Paginated feed response."""
    items: List[ActivityFeedItemResponse]
    next_cursor: Optional[str] = None
    has_more: bool = False


# ==================== Like Schemas ====================

class LikeResponse(BaseModel):
    """Response for like action."""
    activity_id: UUID
    liked: bool
    likes_count: int


# ==================== Comment Schemas ====================

class CommentCreate(BaseModel):
    """Schema for creating a comment."""
    content: str = Field(..., min_length=1, max_length=500)
    parent_comment_id: Optional[UUID] = None


class CommentResponse(BaseModel):
    """Schema for comment response."""
    id: UUID
    activity_id: UUID
    user_id: UUID
    content: str
    parent_comment_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    # Additional fields
    user: Optional[UserInfo] = None

    model_config = ConfigDict(from_attributes=True)


class CommentsListResponse(BaseModel):
    """Paginated comments list."""
    comments: List[CommentResponse]
    total: int
