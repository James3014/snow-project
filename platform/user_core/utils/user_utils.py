"""User-related utility functions."""
import uuid
from sqlalchemy.orm import Session

from models.user_profile import UserProfile
from models.enums import UserStatus


def get_or_create_user(db: Session, user_id: uuid.UUID) -> UserProfile:
    """
    Get existing user or create a new one with default settings.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        UserProfile instance
    """
    user = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not user:
        user = UserProfile(user_id=user_id, status=UserStatus.active)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def get_user_or_none(db: Session, user_id: uuid.UUID) -> UserProfile | None:
    """
    Get user by ID or return None.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        UserProfile or None
    """
    return db.query(UserProfile).filter(UserProfile.user_id == user_id).first()


def user_exists(db: Session, user_id: uuid.UUID) -> bool:
    """
    Check if user exists.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        True if user exists
    """
    return db.query(UserProfile).filter(UserProfile.user_id == user_id).first() is not None
