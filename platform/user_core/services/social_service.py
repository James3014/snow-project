"""
Social service - business logic for follows, feed, likes, and comments.
"""
from datetime import datetime, UTC
from typing import List, Optional, Tuple
import uuid

from sqlalchemy import func, and_, or_, desc
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from models.social import UserFollow, ActivityFeedItem, ActivityLike, ActivityComment
from models.user_profile import UserProfile
from models.course_tracking import CourseVisit, UserAchievement
from schemas.social import (
    ActivityFeedItemCreate, UserInfo
)


# ==================== Follow Operations ====================

def follow_user(db: Session, follower_id: uuid.UUID, following_id: uuid.UUID) -> UserFollow:
    """
    Create a follow relationship.

    Args:
        db: Database session
        follower_id: User who is following
        following_id: User being followed

    Returns:
        UserFollow object

    Raises:
        ValueError: If users are the same or following_id doesn't exist
        IntegrityError: If already following
    """
    if follower_id == following_id:
        raise ValueError("Cannot follow yourself")

    # Check if target user exists
    target_user = db.query(UserProfile).filter(UserProfile.user_id == following_id).first()
    if not target_user:
        raise ValueError("User not found")

    # Check if already following
    existing = db.query(UserFollow).filter(
        UserFollow.follower_id == follower_id,
        UserFollow.following_id == following_id
    ).first()

    if existing:
        return existing  # Already following, return existing

    # Create follow relationship
    follow = UserFollow(
        follower_id=follower_id,
        following_id=following_id
    )

    db.add(follow)
    db.commit()
    db.refresh(follow)

    return follow


def unfollow_user(db: Session, follower_id: uuid.UUID, following_id: uuid.UUID) -> bool:
    """
    Remove a follow relationship.

    Returns:
        bool: True if unfollowed, False if wasn't following
    """
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


def get_followers(
    db: Session,
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 50
) -> Tuple[List[UserProfile], int]:
    """Get users who follow this user."""
    query = db.query(UserProfile).join(
        UserFollow, UserProfile.user_id == UserFollow.follower_id
    ).filter(
        UserFollow.following_id == user_id
    )

    total = query.count()
    followers = query.offset(skip).limit(limit).all()

    return followers, total


def get_following(
    db: Session,
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 50
) -> Tuple[List[UserProfile], int]:
    """Get users that this user follows."""
    query = db.query(UserProfile).join(
        UserFollow, UserProfile.user_id == UserFollow.following_id
    ).filter(
        UserFollow.follower_id == user_id
    )

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


# ==================== Activity Feed Operations ====================

def create_feed_item(
    db: Session,
    user_id: uuid.UUID,
    item: ActivityFeedItemCreate
) -> ActivityFeedItem:
    """Create a new activity feed item."""
    feed_item = ActivityFeedItem(
        user_id=user_id,
        activity_type=item.activity_type,
        entity_type=item.entity_type,
        entity_id=item.entity_id,
        content_json=item.content_json,
        visibility=item.visibility
    )

    db.add(feed_item)
    db.commit()
    db.refresh(feed_item)

    return feed_item


def create_feed_item_from_course_visit(db: Session, course_visit: CourseVisit) -> ActivityFeedItem:
    """
    Automatically create a feed item when a course visit is recorded.

    This should be called from course_tracking_service after recording a visit.
    """
    # Get user's default visibility setting
    user = db.query(UserProfile).filter(UserProfile.user_id == course_visit.user_id).first()
    visibility = user.default_post_visibility if user and user.default_post_visibility else 'public'

    content = {
        "resort_id": course_visit.resort_id,
        "course_name": course_visit.course_name,
        "visited_date": course_visit.visited_date.isoformat(),
        "rating": course_visit.rating,
        "snow_condition": course_visit.snow_condition,
        "weather": course_visit.weather
    }

    feed_item = ActivityFeedItem(
        user_id=course_visit.user_id,
        activity_type='course_visit',
        entity_type='course_visit',
        entity_id=course_visit.id,
        content_json=content,
        visibility=visibility
    )

    db.add(feed_item)
    db.commit()
    db.refresh(feed_item)

    return feed_item


def create_feed_item_from_achievement(db: Session, achievement: UserAchievement) -> ActivityFeedItem:
    """Automatically create a feed item when an achievement is earned."""
    user = db.query(UserProfile).filter(UserProfile.user_id == achievement.user_id).first()
    visibility = user.default_post_visibility if user and user.default_post_visibility else 'public'

    content = {
        "achievement_type": achievement.achievement_type,
        "points": achievement.points,
        "achievement_data": achievement.achievement_data
    }

    feed_item = ActivityFeedItem(
        user_id=achievement.user_id,
        activity_type='achievement_earned',
        entity_type='achievement',
        entity_id=achievement.id,
        content_json=content,
        visibility=visibility
    )

    db.add(feed_item)
    db.commit()
    db.refresh(feed_item)

    return feed_item


def get_feed(
    db: Session,
    current_user_id: uuid.UUID,
    feed_type: str = 'all',
    cursor: Optional[str] = None,
    limit: int = 20
) -> Tuple[List[ActivityFeedItem], Optional[str], bool]:
    """
    Get activity feed items.

    Args:
        db: Database session
        current_user_id: Current user's ID
        feed_type: 'all', 'following', or 'popular'
        cursor: Cursor for pagination (last item's ID)
        limit: Number of items to return

    Returns:
        Tuple of (items, next_cursor, has_more)
    """
    query = db.query(ActivityFeedItem)

    if feed_type == 'following':
        # Get IDs of users that current user follows
        following_ids_query = db.query(UserFollow.following_id).filter(
            UserFollow.follower_id == current_user_id
        )
        following_ids = [row[0] for row in following_ids_query.all()]

        if not following_ids:
            return [], None, False

        # Show feed items from followed users that are public or followers-only
        query = query.filter(
            ActivityFeedItem.user_id.in_(following_ids),
            ActivityFeedItem.visibility.in_(['public', 'followers'])
        )

    elif feed_type == 'popular':
        # Show popular public posts from last 7 days
        from datetime import timedelta
        week_ago = datetime.now(UTC) - timedelta(days=7)

        query = query.filter(
            ActivityFeedItem.visibility == 'public',
            ActivityFeedItem.created_at >= week_ago
        ).order_by(
            desc(ActivityFeedItem.likes_count),
            desc(ActivityFeedItem.created_at)
        )

    else:  # 'all'
        # Show all public posts
        query = query.filter(ActivityFeedItem.visibility == 'public')

    # Apply cursor pagination
    if cursor:
        cursor_item = db.query(ActivityFeedItem).filter(ActivityFeedItem.id == uuid.UUID(cursor)).first()
        if cursor_item:
            query = query.filter(ActivityFeedItem.created_at < cursor_item.created_at)

    # Default sort by created_at desc (unless popular)
    if feed_type != 'popular':
        query = query.order_by(desc(ActivityFeedItem.created_at))

    # Fetch one more than limit to determine if there are more items
    items = query.limit(limit + 1).all()

    has_more = len(items) > limit
    if has_more:
        items = items[:limit]

    next_cursor = str(items[-1].id) if items and has_more else None

    return items, next_cursor, has_more


def get_user_feed(
    db: Session,
    user_id: uuid.UUID,
    current_user_id: uuid.UUID,
    cursor: Optional[str] = None,
    limit: int = 20
) -> Tuple[List[ActivityFeedItem], Optional[str], bool]:
    """Get activity feed for a specific user."""
    # Determine which visibility levels current user can see
    if user_id == current_user_id:
        # User can see their own posts (all visibility levels)
        visibility_filter = ['public', 'followers', 'private']
    elif is_following(db, current_user_id, user_id):
        # Followers can see public and followers-only posts
        visibility_filter = ['public', 'followers']
    else:
        # Others can only see public posts
        visibility_filter = ['public']

    query = db.query(ActivityFeedItem).filter(
        ActivityFeedItem.user_id == user_id,
        ActivityFeedItem.visibility.in_(visibility_filter)
    )

    # Apply cursor pagination
    if cursor:
        cursor_item = db.query(ActivityFeedItem).filter(ActivityFeedItem.id == uuid.UUID(cursor)).first()
        if cursor_item:
            query = query.filter(ActivityFeedItem.created_at < cursor_item.created_at)

    query = query.order_by(desc(ActivityFeedItem.created_at))

    items = query.limit(limit + 1).all()

    has_more = len(items) > limit
    if has_more:
        items = items[:limit]

    next_cursor = str(items[-1].id) if items and has_more else None

    return items, next_cursor, has_more


def enrich_feed_items(
    db: Session,
    items: List[ActivityFeedItem],
    current_user_id: uuid.UUID
) -> List[dict]:
    """
    Enrich feed items with additional data (user info, is_liked, etc.).

    Returns list of dicts suitable for conversion to Pydantic models.
    """
    if not items:
        return []

    # Get user IDs
    user_ids = list(set([item.user_id for item in items]))

    # Fetch all users at once
    users = db.query(UserProfile).filter(UserProfile.user_id.in_(user_ids)).all()
    user_map = {user.user_id: user for user in users}

    # Get activity IDs
    activity_ids = [item.id for item in items]

    # Fetch all likes by current user at once
    liked_activity_ids = set()
    if current_user_id:
        likes = db.query(ActivityLike.activity_id).filter(
            ActivityLike.activity_id.in_(activity_ids),
            ActivityLike.user_id == current_user_id
        ).all()
        liked_activity_ids = set([like[0] for like in likes])

    # Build enriched items
    enriched = []
    for item in items:
        user = user_map.get(item.user_id)

        enriched_item = {
            "id": item.id,
            "user_id": item.user_id,
            "activity_type": item.activity_type,
            "entity_type": item.entity_type,
            "entity_id": item.entity_id,
            "content_json": item.content_json,
            "visibility": item.visibility,
            "likes_count": item.likes_count,
            "comments_count": item.comments_count,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
            "is_liked": item.id in liked_activity_ids,
            "user": {
                "user_id": user.user_id,
                "display_name": user.display_name,
                "avatar_url": user.avatar_url,
                "experience_level": user.experience_level
            } if user else None
        }

        enriched.append(enriched_item)

    return enriched


# ==================== Like Operations ====================

def like_activity(db: Session, activity_id: uuid.UUID, user_id: uuid.UUID) -> Tuple[bool, int]:
    """
    Like an activity.

    Returns:
        Tuple of (already_liked, new_likes_count)
    """
    # Check if activity exists
    activity = db.query(ActivityFeedItem).filter(ActivityFeedItem.id == activity_id).first()
    if not activity:
        raise ValueError("Activity not found")

    # Check if already liked
    existing_like = db.query(ActivityLike).filter(
        ActivityLike.activity_id == activity_id,
        ActivityLike.user_id == user_id
    ).first()

    if existing_like:
        return True, activity.likes_count

    # Create like
    like = ActivityLike(
        activity_id=activity_id,
        user_id=user_id
    )
    db.add(like)

    # Increment count
    activity.likes_count += 1

    db.commit()
    db.refresh(activity)

    return False, activity.likes_count


def unlike_activity(db: Session, activity_id: uuid.UUID, user_id: uuid.UUID) -> Tuple[bool, int]:
    """
    Unlike an activity.

    Returns:
        Tuple of (was_liked, new_likes_count)
    """
    like = db.query(ActivityLike).filter(
        ActivityLike.activity_id == activity_id,
        ActivityLike.user_id == user_id
    ).first()

    if not like:
        # Wasn't liked
        activity = db.query(ActivityFeedItem).filter(ActivityFeedItem.id == activity_id).first()
        return False, activity.likes_count if activity else 0

    activity = db.query(ActivityFeedItem).filter(ActivityFeedItem.id == activity_id).first()

    db.delete(like)

    # Decrement count
    if activity:
        activity.likes_count = max(0, activity.likes_count - 1)

    db.commit()

    return True, activity.likes_count if activity else 0


# ==================== Comment Operations ====================

def create_comment(
    db: Session,
    activity_id: uuid.UUID,
    user_id: uuid.UUID,
    content: str,
    parent_comment_id: Optional[uuid.UUID] = None
) -> ActivityComment:
    """Create a comment on an activity."""
    # Check if activity exists
    activity = db.query(ActivityFeedItem).filter(ActivityFeedItem.id == activity_id).first()
    if not activity:
        raise ValueError("Activity not found")

    # Check if parent comment exists (if specified)
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

    # Increment comment count
    activity.comments_count += 1

    db.commit()
    db.refresh(comment)

    return comment


def get_comments(
    db: Session,
    activity_id: uuid.UUID,
    skip: int = 0,
    limit: int = 50
) -> Tuple[List[ActivityComment], int]:
    """Get comments for an activity."""
    # Only get top-level comments (parent_comment_id is None)
    query = db.query(ActivityComment).filter(
        ActivityComment.activity_id == activity_id,
        ActivityComment.parent_comment_id == None
    ).order_by(ActivityComment.created_at.asc())

    total = query.count()
    comments = query.offset(skip).limit(limit).all()

    return comments, total


def delete_comment(db: Session, comment_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    """
    Delete a comment.

    Only the comment author can delete their comment.
    """
    comment = db.query(ActivityComment).filter(
        ActivityComment.id == comment_id,
        ActivityComment.user_id == user_id
    ).first()

    if not comment:
        return False

    activity = db.query(ActivityFeedItem).filter(ActivityFeedItem.id == comment.activity_id).first()

    db.delete(comment)

    # Decrement count
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

        enriched_comment = {
            "id": comment.id,
            "activity_id": comment.activity_id,
            "user_id": comment.user_id,
            "content": comment.content,
            "parent_comment_id": comment.parent_comment_id,
            "created_at": comment.created_at,
            "updated_at": comment.updated_at,
            "user": {
                "user_id": user.user_id,
                "display_name": user.display_name,
                "avatar_url": user.avatar_url,
                "experience_level": user.experience_level
            } if user else None
        }

        enriched.append(enriched_comment)

    return enriched
