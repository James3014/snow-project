"""
Social service - facade for social features.

Refactored into:
- follow_service.py - follow relationships
- feed_service.py - activity feed
- interaction_service.py - likes and comments
"""

# Re-export all functions for backward compatibility
from .follow_service import (
    follow_user,
    unfollow_user,
    is_following,
    get_followers,
    get_following,
    get_follow_stats,
)

from .feed_service import (
    create_feed_item,
    create_feed_item_from_course_visit,
    create_feed_item_from_achievement,
    get_feed,
    get_user_feed,
    enrich_feed_items,
)

from .interaction_service import (
    like_activity,
    unlike_activity,
    create_comment,
    get_comments,
    delete_comment,
    enrich_comments,
)

__all__ = [
    # Follow
    'follow_user', 'unfollow_user', 'is_following',
    'get_followers', 'get_following', 'get_follow_stats',
    # Feed
    'create_feed_item', 'create_feed_item_from_course_visit',
    'create_feed_item_from_achievement', 'get_feed', 'get_user_feed', 'enrich_feed_items',
    # Interaction
    'like_activity', 'unlike_activity', 'create_comment',
    'get_comments', 'delete_comment', 'enrich_comments',
]
