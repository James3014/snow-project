"""
Social features API endpoints.

Provides REST APIs for:
- Following/unfollowing users
- Activity feed
- Likes and comments
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid

from services import db, social_service
from services.auth_service import get_current_user_id
from schemas.social import (
    FollowResponse, FollowStats,
    ActivityFeedItemCreate, ActivityFeedItemResponse, FeedResponse,
    LikeResponse,
    CommentCreate, CommentResponse, CommentsListResponse,
    UserInfo
)

router = APIRouter()


# ==================== Follow Endpoints ====================

@router.post(
    "/users/{target_user_id}/follow",
    response_model=FollowResponse,
    summary="Follow a user",
    status_code=201
)
def follow_user(
    target_user_id: uuid.UUID,
    current_user_id: uuid.UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """
    Follow another user.

    - **target_user_id**: User ID to follow
    """
    try:
        follow = social_service.follow_user(
            db=db_session,
            follower_id=current_user_id,
            following_id=target_user_id
        )
        return follow
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.delete(
    "/users/{target_user_id}/follow",
    summary="Unfollow a user",
    status_code=204
)
def unfollow_user(
    target_user_id: uuid.UUID,
    current_user_id: uuid.UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """
    Unfollow a user.

    - **target_user_id**: User ID to unfollow
    """
    success = social_service.unfollow_user(
        db=db_session,
        follower_id=current_user_id,
        following_id=target_user_id
    )

    if not success:
        raise HTTPException(status_code=404, detail="Not following this user")

    return None


@router.get(
    "/users/{user_id}/followers",
    summary="Get user's followers"
)
def get_followers(
    user_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db_session: Session = Depends(db.get_db)
):
    """Get list of users who follow this user."""
    followers, total = social_service.get_followers(
        db=db_session,
        user_id=user_id,
        skip=skip,
        limit=limit
    )

    return {
        "followers": [
            UserInfo(
                user_id=user.user_id,
                display_name=user.display_name,
                avatar_url=user.avatar_url,
                experience_level=user.experience_level
            ) for user in followers
        ],
        "total": total
    }


@router.get(
    "/users/{user_id}/following",
    summary="Get users this user follows"
)
def get_following(
    user_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db_session: Session = Depends(db.get_db)
):
    """Get list of users that this user follows."""
    following, total = social_service.get_following(
        db=db_session,
        user_id=user_id,
        skip=skip,
        limit=limit
    )

    return {
        "following": [
            UserInfo(
                user_id=user.user_id,
                display_name=user.display_name,
                avatar_url=user.avatar_url,
                experience_level=user.experience_level
            ) for user in following
        ],
        "total": total
    }


@router.get(
    "/users/{user_id}/follow-stats",
    response_model=FollowStats,
    summary="Get follow statistics"
)
def get_follow_stats(
    user_id: uuid.UUID,
    current_user_id: uuid.UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """Get follow statistics for a user."""
    stats = social_service.get_follow_stats(
        db=db_session,
        user_id=user_id,
        current_user_id=current_user_id
    )
    return stats


# ==================== Activity Feed Endpoints ====================

@router.get(
    "/feed",
    response_model=FeedResponse,
    summary="Get activity feed"
)
def get_activity_feed(
    feed_type: str = Query("all", regex="^(all|following|popular)$"),
    cursor: Optional[str] = None,
    limit: int = Query(20, ge=1, le=50),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """
    Get activity feed.

    - **feed_type**: 'all' (public posts), 'following' (posts from followed users), 'popular' (trending)
    - **cursor**: Pagination cursor (last item's ID from previous page)
    - **limit**: Number of items to return (max 50)
    """
    items, next_cursor, has_more = social_service.get_feed(
        db=db_session,
        current_user_id=current_user_id,
        feed_type=feed_type,
        cursor=cursor,
        limit=limit
    )

    # Enrich items with user info and is_liked status
    enriched_items = social_service.enrich_feed_items(
        db=db_session,
        items=items,
        current_user_id=current_user_id
    )

    return {
        "items": enriched_items,
        "next_cursor": next_cursor,
        "has_more": has_more
    }


@router.get(
    "/users/{user_id}/feed",
    response_model=FeedResponse,
    summary="Get user's activity feed"
)
def get_user_activity_feed(
    user_id: uuid.UUID,
    cursor: Optional[str] = None,
    limit: int = Query(20, ge=1, le=50),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """
    Get activity feed for a specific user.

    Respects privacy settings:
    - Own posts: see all
    - Following: see public and followers-only
    - Others: see only public
    """
    items, next_cursor, has_more = social_service.get_user_feed(
        db=db_session,
        user_id=user_id,
        current_user_id=current_user_id,
        cursor=cursor,
        limit=limit
    )

    enriched_items = social_service.enrich_feed_items(
        db=db_session,
        items=items,
        current_user_id=current_user_id
    )

    return {
        "items": enriched_items,
        "next_cursor": next_cursor,
        "has_more": has_more
    }


@router.post(
    "/feed",
    response_model=ActivityFeedItemResponse,
    summary="Create a feed item",
    status_code=201
)
def create_feed_item(
    item: ActivityFeedItemCreate,
    current_user_id: uuid.UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """
    Create a new activity feed item.

    This is typically called automatically when users perform actions
    (like completing a course), but can also be used for manual posts.
    """
    feed_item = social_service.create_feed_item(
        db=db_session,
        user_id=current_user_id,
        item=item
    )

    # Enrich with user info
    enriched = social_service.enrich_feed_items(
        db=db_session,
        items=[feed_item],
        current_user_id=current_user_id
    )

    return enriched[0] if enriched else feed_item


# ==================== Like Endpoints ====================

@router.post(
    "/feed/{activity_id}/like",
    response_model=LikeResponse,
    summary="Like an activity",
    status_code=201
)
def like_activity(
    activity_id: uuid.UUID,
    current_user_id: uuid.UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """Like an activity feed item."""
    try:
        already_liked, likes_count = social_service.like_activity(
            db=db_session,
            activity_id=activity_id,
            user_id=current_user_id
        )

        return {
            "activity_id": activity_id,
            "liked": True,
            "likes_count": likes_count
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.delete(
    "/feed/{activity_id}/like",
    response_model=LikeResponse,
    summary="Unlike an activity"
)
def unlike_activity(
    activity_id: uuid.UUID,
    current_user_id: uuid.UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """Remove like from an activity feed item."""
    was_liked, likes_count = social_service.unlike_activity(
        db=db_session,
        activity_id=activity_id,
        user_id=current_user_id
    )

    return {
        "activity_id": activity_id,
        "liked": False,
        "likes_count": likes_count
    }


# ==================== Comment Endpoints ====================

@router.get(
    "/feed/{activity_id}/comments",
    response_model=CommentsListResponse,
    summary="Get comments"
)
def get_comments(
    activity_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db_session: Session = Depends(db.get_db)
):
    """Get comments for an activity."""
    comments, total = social_service.get_comments(
        db=db_session,
        activity_id=activity_id,
        skip=skip,
        limit=limit
    )

    enriched_comments = social_service.enrich_comments(db=db_session, comments=comments)

    return {
        "comments": enriched_comments,
        "total": total
    }


@router.post(
    "/feed/{activity_id}/comments",
    response_model=CommentResponse,
    summary="Create a comment",
    status_code=201
)
def create_comment(
    activity_id: uuid.UUID,
    comment: CommentCreate,
    current_user_id: uuid.UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """Post a comment on an activity."""
    try:
        new_comment = social_service.create_comment(
            db=db_session,
            activity_id=activity_id,
            user_id=current_user_id,
            content=comment.content,
            parent_comment_id=comment.parent_comment_id
        )

        enriched = social_service.enrich_comments(db=db_session, comments=[new_comment])
        return enriched[0] if enriched else new_comment

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.delete(
    "/feed/comments/{comment_id}",
    summary="Delete a comment",
    status_code=204
)
def delete_comment(
    comment_id: uuid.UUID,
    current_user_id: uuid.UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """
    Delete a comment.

    Only the comment author can delete their own comment.
    """
    success = social_service.delete_comment(
        db=db_session,
        comment_id=comment_id,
        user_id=current_user_id
    )

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Comment not found or you don't have permission to delete it"
        )

    return None
