"""
T1.16: Social Service 最小實作 (TDD Green Phase)
"""
import uuid
from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel
from abc import ABC, abstractmethod
from enum import Enum

class ActivityType(str, Enum):
    TRIP_CREATED = "trip_created"
    GEAR_ADDED = "gear_added"
    ACHIEVEMENT_UNLOCKED = "achievement_unlocked"
    FOLLOW = "follow"

class Activity(BaseModel):
    id: Optional[str] = None
    user_id: str
    activity_type: ActivityType
    title: str
    description: Optional[str] = None
    metadata: Optional[dict] = None
    created_at: Optional[datetime] = None

class Follow(BaseModel):
    id: Optional[str] = None
    follower_id: str
    following_id: str
    created_at: Optional[datetime] = None

class SocialServiceInterface(ABC):
    @abstractmethod
    async def create_activity(self, activity: Activity) -> Activity:
        pass
    
    @abstractmethod
    async def get_user_feed(self, user_id: str, limit: int = 20) -> List[Activity]:
        pass
    
    @abstractmethod
    async def follow_user(self, follower_id: str, following_id: str) -> Follow:
        pass
    
    @abstractmethod
    async def unfollow_user(self, follower_id: str, following_id: str) -> bool:
        pass
    
    @abstractmethod
    async def get_followers(self, user_id: str) -> List[Follow]:
        pass

class InMemorySocialService(SocialServiceInterface):
    def __init__(self):
        self.activities: Dict[str, Activity] = {}
        self.follows: Dict[str, Follow] = {}
    
    async def create_activity(self, activity: Activity) -> Activity:
        activity.id = str(uuid.uuid4())
        activity.created_at = datetime.now()
        self.activities[activity.id] = activity
        return activity
    
    async def get_user_feed(self, user_id: str, limit: int = 20) -> List[Activity]:
        # 獲取用戶關注的人的活動
        following_ids = [f.following_id for f in self.follows.values() if f.follower_id == user_id]
        following_ids.append(user_id)  # 包含自己的活動
        
        feed_activities = [
            a for a in self.activities.values() 
            if a.user_id in following_ids
        ]
        
        return sorted(feed_activities, key=lambda x: x.created_at or datetime.min, reverse=True)[:limit]
    
    async def follow_user(self, follower_id: str, following_id: str) -> Follow:
        if follower_id == following_id:
            raise ValueError("Cannot follow yourself")
        
        # 檢查是否已經關注
        existing_follow = next(
            (f for f in self.follows.values() 
             if f.follower_id == follower_id and f.following_id == following_id),
            None
        )
        
        if existing_follow:
            return existing_follow
        
        follow = Follow(
            id=str(uuid.uuid4()),
            follower_id=follower_id,
            following_id=following_id,
            created_at=datetime.now()
        )
        self.follows[follow.id] = follow
        return follow
    
    async def unfollow_user(self, follower_id: str, following_id: str) -> bool:
        for follow_id, follow in list(self.follows.items()):
            if follow.follower_id == follower_id and follow.following_id == following_id:
                del self.follows[follow_id]
                return True
        return False
    
    async def get_followers(self, user_id: str) -> List[Follow]:
        return [f for f in self.follows.values() if f.following_id == user_id]

def create_social_service() -> SocialServiceInterface:
    return InMemorySocialService()
