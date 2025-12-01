"""Follow service - business logic for follow relationships."""
from typing import List, Optional, Tuple
import uuid

from sqlalchemy.orm import Session
from models.social import UserFollow
from models.user_profile import UserProfile


def follow_user(db: Session, follower_id: uuid.UUID, following_id: uuid.UUID) -> UserFollow:
    """Create a follow relationship."""
    if follower_id == following_id:
        raise ValueError("Cannot follow yourself")

    target_user = db.query(UserProfile).filter(UserProfile.user_id == following_id).first()
    if not target_user:
        raise ValueError("User not found")

    existing = db.query(UserFollow).filter(
        UserFollow.follower_id == follower_id,
        UserFollow.following_id == following_id
    ).first()

    if existing:
        return existing

    follow = UserFollow(follower_id=follower_id, following_id=following_id)
    db.add(follow)
    db.commit()
    db.refresh(follow)
    return follow


def unfollow_user(db: Session, follower_id: uuid.UUID, following_id: uuid.UUID) -> bool:
    """Remove a follow relationship."""
    follow = db.query(UserFollow).filter(
        UserFollow.follower_id == follower_id,
        UserFollow.following_id == following_id
    ).first()

    if not follow:
        return False

    db.delete(follow)
    db.commit()
    return True


def is_following(db: Session, follower_id: uuid.UUID, following_id: uuid.UUID) -> bool:
    """Check if follower_id is following following_id."""
    return db.query(UserFollow).filter(
        UserFollow.follower_id == follower_id,
        UserFollow.following_id == following_id
    ).first() is not None


def get_followers(db: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 50) -> Tuple[List[UserProfile], int]:
    """Get users who follow this user."""
    query = db.query(UserProfile).join(
        UserFollow, UserProfile.user_id == UserFollow.follower_id
    ).filter(UserFollow.following_id == user_id)

    total = query.count()
    followers = query.offset(skip).limit(limit).all()
    return followers, total


def get_following(db: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 50) -> Tuple[List[UserProfile], int]:
    """Get users that this user follows."""
    query = db.query(UserProfile).join(
        UserFollow, UserProfile.user_id == UserFollow.following_id
    ).filter(UserFollow.follower_id == user_id)

    total = query.count()
    following = query.offset(skip).limit(limit).all()
    return following, total


def get_follow_stats(db: Session, user_id: uuid.UUID, current_user_id: Optional[uuid.UUID] = None) -> dict:
    """Get follow statistics for a user."""
    followers_count = db.query(UserFollow).filter(UserFollow.following_id == user_id).count()
    following_count = db.query(UserFollow).filter(UserFollow.follower_id == user_id).count()

    is_following_user = False
    if current_user_id and current_user_id != user_id:
        is_following_user = is_following(db, current_user_id, user_id)

    return {
        "followers_count": followers_count,
        "following_count": following_count,
        "is_following": is_following_user
    }
