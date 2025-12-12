"""
Social Service 適配器
"""
import sys
from pathlib import Path
from typing import List

SOCIAL_SERVICE_ROOT = Path(__file__).resolve().parents[3] / "services" / "social-service"
sys.path.insert(0, str(SOCIAL_SERVICE_ROOT))

from social_service import create_social_service, Activity, ActivityType, Follow

class SocialServiceAdapter:
    def __init__(self):
        self._social_service = create_social_service()
    
    async def create_activity(self, user_id: str, activity_type: str, title: str, **kwargs) -> dict:
        activity = Activity(
            user_id=user_id,
            activity_type=ActivityType(activity_type),
            title=title,
            description=kwargs.get("description"),
            metadata=kwargs.get("metadata")
        )
        
        created_activity = await self._social_service.create_activity(activity)
        
        return {
            "id": created_activity.id,
            "user_id": created_activity.user_id,
            "activity_type": created_activity.activity_type.value,
            "title": created_activity.title,
            "description": created_activity.description,
            "metadata": created_activity.metadata,
            "created_at": created_activity.created_at.isoformat() if created_activity.created_at else None
        }
    
    async def get_user_feed(self, user_id: str, limit: int = 20) -> List[dict]:
        activities = await self._social_service.get_user_feed(user_id, limit)
        
        return [
            {
                "id": activity.id,
                "user_id": activity.user_id,
                "activity_type": activity.activity_type.value,
                "title": activity.title,
                "description": activity.description,
                "metadata": activity.metadata,
                "created_at": activity.created_at.isoformat() if activity.created_at else None
            }
            for activity in activities
        ]
    
    async def follow_user(self, follower_id: str, following_id: str) -> dict:
        follow = await self._social_service.follow_user(follower_id, following_id)
        
        return {
            "id": follow.id,
            "follower_id": follow.follower_id,
            "following_id": follow.following_id,
            "created_at": follow.created_at.isoformat() if follow.created_at else None
        }
    
    async def unfollow_user(self, follower_id: str, following_id: str) -> bool:
        return await self._social_service.unfollow_user(follower_id, following_id)

_social_adapter = None

def get_social_service() -> SocialServiceAdapter:
    global _social_adapter
    if _social_adapter is None:
        _social_adapter = SocialServiceAdapter()
    return _social_adapter
