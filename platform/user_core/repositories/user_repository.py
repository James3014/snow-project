"""User repository for user profile operations."""
from typing import Optional, List
import uuid

from sqlalchemy.orm import Session

from repositories.base import BaseRepository
from models.user_profile import UserProfile
from models.enums import UserStatus


class UserRepository(BaseRepository[UserProfile]):
    """Repository for UserProfile operations."""
    
    def __init__(self, db: Session):
        super().__init__(UserProfile, db)
    
    def get_by_user_id(self, user_id: uuid.UUID) -> Optional[UserProfile]:
        """Get user by user_id."""
        return self.db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    
    def get_or_create(self, user_id: uuid.UUID) -> UserProfile:
        """Get existing user or create new one."""
        user = self.get_by_user_id(user_id)
        if not user:
            user = UserProfile(user_id=user_id, status=UserStatus.active)
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
        return user
    
    def exists(self, user_id: uuid.UUID) -> bool:
        """Check if user exists."""
        return self.get_by_user_id(user_id) is not None
    
    def get_active_users(self, skip: int = 0, limit: int = 100) -> List[UserProfile]:
        """Get all active users."""
        return self.db.query(UserProfile).filter(
            UserProfile.status == UserStatus.active
        ).offset(skip).limit(limit).all()
    
    def update_status(self, user_id: uuid.UUID, status: UserStatus) -> Optional[UserProfile]:
        """Update user status."""
        user = self.get_by_user_id(user_id)
        if user:
            user.status = status
            self.db.commit()
            self.db.refresh(user)
        return user
