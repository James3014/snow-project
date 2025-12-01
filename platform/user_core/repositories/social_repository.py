"""Social repository for social features."""
from typing import Optional, List
import uuid

from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from repositories.base import BaseRepository
from models.social import Friendship, ActivityFeedItem


class FriendshipRepository(BaseRepository[Friendship]):
    """Repository for Friendship operations."""
    
    def __init__(self, db: Session):
        super().__init__(Friendship, db)
    
    def get_friendship(self, user_id: uuid.UUID, friend_id: uuid.UUID) -> Optional[Friendship]:
        """Get friendship between two users."""
        return self.db.query(Friendship).filter(
            or_(
                (Friendship.user_id == user_id) & (Friendship.friend_id == friend_id),
                (Friendship.user_id == friend_id) & (Friendship.friend_id == user_id)
            )
        ).first()
    
    def get_friends(self, user_id: uuid.UUID, status: str = 'accepted') -> List[Friendship]:
        """Get all friendships for a user."""
        return self.db.query(Friendship).filter(
            or_(Friendship.user_id == user_id, Friendship.friend_id == user_id),
            Friendship.status == status
        ).all()
    
    def get_pending_requests(self, user_id: uuid.UUID) -> List[Friendship]:
        """Get pending friend requests for user."""
        return self.db.query(Friendship).filter(
            Friendship.friend_id == user_id,
            Friendship.status == 'pending'
        ).all()
    
    def get_friend_ids(self, user_id: uuid.UUID) -> List[uuid.UUID]:
        """Get list of friend IDs for a user."""
        friendships = self.get_friends(user_id)
        friend_ids = []
        for f in friendships:
            friend_ids.append(f.friend_id if f.user_id == user_id else f.user_id)
        return friend_ids


class ActivityFeedRepository(BaseRepository[ActivityFeedItem]):
    """Repository for ActivityFeedItem operations."""
    
    def __init__(self, db: Session):
        super().__init__(ActivityFeedItem, db)
    
    def get_user_feed(self, user_id: uuid.UUID, skip: int = 0, limit: int = 50) -> List[ActivityFeedItem]:
        """Get activity feed for a user."""
        return self.db.query(ActivityFeedItem).filter(
            ActivityFeedItem.user_id == user_id
        ).order_by(desc(ActivityFeedItem.created_at)).offset(skip).limit(limit).all()
    
    def get_friends_feed(self, user_ids: List[uuid.UUID], skip: int = 0, limit: int = 50) -> List[ActivityFeedItem]:
        """Get activity feed for multiple users (friends)."""
        return self.db.query(ActivityFeedItem).filter(
            ActivityFeedItem.user_id.in_(user_ids)
        ).order_by(desc(ActivityFeedItem.created_at)).offset(skip).limit(limit).all()
