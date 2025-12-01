"""Interaction service - business logic for likes and comments."""
from typing import List, Optional, Tuple
import uuid

from sqlalchemy.orm import Session
from models.social import ActivityFeedItem, ActivityLike, ActivityComment
from models.user_profile import UserProfile


def like_activity(db: Session, activity_id: uuid.UUID, user_id: uuid.UUID) -> Tuple[bool, int]:
    """Like an activity. Returns (already_liked, new_likes_count)."""
    activity = db.query(ActivityFeedItem).filter(ActivityFeedItem.id == activity_id).first()
    if not activity:
        raise ValueError("Activity not found")

    existing_like = db.query(ActivityLike).filter(
        ActivityLike.activity_id == activity_id,
        ActivityLike.user_id == user_id
    ).first()

    if existing_like:
        return True, activity.likes_count

    like = ActivityLike(activity_id=activity_id, user_id=user_id)
    db.add(like)
    activity.likes_count += 1
    db.commit()
    db.refresh(activity)
    return False, activity.likes_count


def unlike_activity(db: Session, activity_id: uuid.UUID, user_id: uuid.UUID) -> Tuple[bool, int]:
    """Unlike an activity. Returns (was_liked, new_likes_count)."""
    like = db.query(ActivityLike).filter(
        ActivityLike.activity_id == activity_id,
        ActivityLike.user_id == user_id
    ).first()

    if not like:
        activity = db.query(ActivityFeedItem).filter(ActivityFeedItem.id == activity_id).first()
        return False, activity.likes_count if activity else 0

    activity = db.query(ActivityFeedItem).filter(ActivityFeedItem.id == activity_id).first()
    db.delete(like)
    if activity:
        activity.likes_count = max(0, activity.likes_count - 1)
    db.commit()
    return True, activity.likes_count if activity else 0


def create_comment(db: Session, activity_id: uuid.UUID, user_id: uuid.UUID,
                   content: str, parent_comment_id: Optional[uuid.UUID] = None) -> ActivityComment:
    """Create a comment on an activity."""
    activity = db.query(ActivityFeedItem).filter(ActivityFeedItem.id == activity_id).first()
    if not activity:
        raise ValueError("Activity not found")

    if parent_comment_id:
        parent = db.query(ActivityComment).filter(ActivityComment.id == parent_comment_id).first()
        if not parent or parent.activity_id != activity_id:
            raise ValueError("Parent comment not found or doesn't belong to this activity")

    comment = ActivityComment(
        activity_id=activity_id,
        user_id=user_id,
        content=content.strip(),
        parent_comment_id=parent_comment_id
    )
    db.add(comment)
    activity.comments_count += 1
    db.commit()
    db.refresh(comment)
    return comment


def get_comments(db: Session, activity_id: uuid.UUID, skip: int = 0, limit: int = 50) -> Tuple[List[ActivityComment], int]:
    """Get comments for an activity."""
    query = db.query(ActivityComment).filter(
        ActivityComment.activity_id == activity_id,
        ActivityComment.parent_comment_id == None
    ).order_by(ActivityComment.created_at.asc())

    total = query.count()
    comments = query.offset(skip).limit(limit).all()
    return comments, total


def delete_comment(db: Session, comment_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    """Delete a comment. Only the author can delete."""
    comment = db.query(ActivityComment).filter(
        ActivityComment.id == comment_id,
        ActivityComment.user_id == user_id
    ).first()

    if not comment:
        return False

    activity = db.query(ActivityFeedItem).filter(ActivityFeedItem.id == comment.activity_id).first()
    db.delete(comment)
    if activity:
        activity.comments_count = max(0, activity.comments_count - 1)
    db.commit()
    return True


def enrich_comments(db: Session, comments: List[ActivityComment]) -> List[dict]:
    """Enrich comments with user information."""
    if not comments:
        return []

    user_ids = list(set([comment.user_id for comment in comments]))
    users = db.query(UserProfile).filter(UserProfile.user_id.in_(user_ids)).all()
    user_map = {user.user_id: user for user in users}

    enriched = []
    for comment in comments:
        user = user_map.get(comment.user_id)
        enriched.append({
            "id": comment.id, "activity_id": comment.activity_id, "user_id": comment.user_id,
            "content": comment.content, "parent_comment_id": comment.parent_comment_id,
            "created_at": comment.created_at, "updated_at": comment.updated_at,
            "user": {"user_id": user.user_id, "display_name": user.display_name,
                     "avatar_url": user.avatar_url, "experience_level": user.experience_level} if user else None
        })
    return enriched
