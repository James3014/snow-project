"""Feed service - business logic for activity feed."""
from datetime import datetime, UTC, timedelta
from typing import List, Optional, Tuple
import uuid

from sqlalchemy import desc
from sqlalchemy.orm import Session
from models.social import UserFollow, ActivityFeedItem, ActivityLike
from models.user_profile import UserProfile
from models.course_tracking import CourseVisit, UserAchievement
from schemas.social import ActivityFeedItemCreate
from .follow_service import is_following


def create_feed_item(db: Session, user_id: uuid.UUID, item: ActivityFeedItemCreate) -> ActivityFeedItem:
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
    """Create a feed item when a course visit is recorded."""
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
    """Create a feed item when an achievement is earned."""
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


def get_feed(db: Session, current_user_id: uuid.UUID, feed_type: str = 'all',
             cursor: Optional[str] = None, limit: int = 20) -> Tuple[List[ActivityFeedItem], Optional[str], bool]:
    """Get activity feed items."""
    query = db.query(ActivityFeedItem)

    if feed_type == 'following':
        following_ids = [row[0] for row in db.query(UserFollow.following_id).filter(
            UserFollow.follower_id == current_user_id).all()]
        if not following_ids:
            return [], None, False
        query = query.filter(
            ActivityFeedItem.user_id.in_(following_ids),
            ActivityFeedItem.visibility.in_(['public', 'followers'])
        )
    elif feed_type == 'popular':
        week_ago = datetime.now(UTC) - timedelta(days=7)
        query = query.filter(
            ActivityFeedItem.visibility == 'public',
            ActivityFeedItem.created_at >= week_ago
        ).order_by(desc(ActivityFeedItem.likes_count), desc(ActivityFeedItem.created_at))
    else:
        query = query.filter(ActivityFeedItem.visibility == 'public')

    if cursor:
        cursor_item = db.query(ActivityFeedItem).filter(ActivityFeedItem.id == uuid.UUID(cursor)).first()
        if cursor_item:
            query = query.filter(ActivityFeedItem.created_at < cursor_item.created_at)

    if feed_type != 'popular':
        query = query.order_by(desc(ActivityFeedItem.created_at))

    items = query.limit(limit + 1).all()
    has_more = len(items) > limit
    if has_more:
        items = items[:limit]
    next_cursor = str(items[-1].id) if items and has_more else None
    return items, next_cursor, has_more


def get_user_feed(db: Session, user_id: uuid.UUID, current_user_id: uuid.UUID,
                  cursor: Optional[str] = None, limit: int = 20) -> Tuple[List[ActivityFeedItem], Optional[str], bool]:
    """Get activity feed for a specific user."""
    if user_id == current_user_id:
        visibility_filter = ['public', 'followers', 'private']
    elif is_following(db, current_user_id, user_id):
        visibility_filter = ['public', 'followers']
    else:
        visibility_filter = ['public']

    query = db.query(ActivityFeedItem).filter(
        ActivityFeedItem.user_id == user_id,
        ActivityFeedItem.visibility.in_(visibility_filter)
    )

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


def enrich_feed_items(db: Session, items: List[ActivityFeedItem], current_user_id: uuid.UUID) -> List[dict]:
    """Enrich feed items with additional data."""
    if not items:
        return []

    user_ids = list(set([item.user_id for item in items]))
    users = db.query(UserProfile).filter(UserProfile.user_id.in_(user_ids)).all()
    user_map = {user.user_id: user for user in users}

    activity_ids = [item.id for item in items]
    liked_activity_ids = set()
    if current_user_id:
        likes = db.query(ActivityLike.activity_id).filter(
            ActivityLike.activity_id.in_(activity_ids),
            ActivityLike.user_id == current_user_id
        ).all()
        liked_activity_ids = set([like[0] for like in likes])

    enriched = []
    for item in items:
        user = user_map.get(item.user_id)
        enriched.append({
            "id": item.id, "user_id": item.user_id, "activity_type": item.activity_type,
            "entity_type": item.entity_type, "entity_id": item.entity_id,
            "content_json": item.content_json, "visibility": item.visibility,
            "likes_count": item.likes_count, "comments_count": item.comments_count,
            "created_at": item.created_at, "updated_at": item.updated_at,
            "is_liked": item.id in liked_activity_ids,
            "user": {"user_id": user.user_id, "display_name": user.display_name,
                     "avatar_url": user.avatar_url, "experience_level": user.experience_level} if user else None
        })
    return enriched
