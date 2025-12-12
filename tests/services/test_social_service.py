"""
T1.15: Social Service 獨立測試 (TDD Red Phase)
"""
import pytest
import uuid
from datetime import datetime
from typing import List, Optional
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

class MockSocialService(SocialServiceInterface):
    def __init__(self):
        self.activities = {}
        self.follows = {}
    
    async def create_activity(self, activity: Activity) -> Activity:
        activity.id = str(uuid.uuid4())
        activity.created_at = datetime.now()
        self.activities[activity.id] = activity
        return activity
    
    async def get_user_feed(self, user_id: str, limit: int = 20) -> List[Activity]:
        # 簡化：返回用戶自己的活動
        user_activities = [a for a in self.activities.values() if a.user_id == user_id]
        return sorted(user_activities, key=lambda x: x.created_at or datetime.min, reverse=True)[:limit]
    
    async def follow_user(self, follower_id: str, following_id: str) -> Follow:
        if follower_id == following_id:
            raise ValueError("Cannot follow yourself")
        
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

@pytest.fixture
def social_service():
    return MockSocialService()

@pytest.fixture
def sample_activity():
    return Activity(
        user_id=str(uuid.uuid4()),
        activity_type=ActivityType.TRIP_CREATED,
        title="Created new trip to Niseko",
        description="Planning a 3-day trip"
    )

class TestSocialServiceInterface:
    @pytest.mark.asyncio
    async def test_create_activity(self, social_service: SocialServiceInterface, sample_activity: Activity):
        created_activity = await social_service.create_activity(sample_activity)
        
        assert created_activity.id is not None
        assert created_activity.title == sample_activity.title
        assert created_activity.activity_type == sample_activity.activity_type
        assert created_activity.created_at is not None
    
    @pytest.mark.asyncio
    async def test_get_user_feed(self, social_service: SocialServiceInterface, sample_activity: Activity):
        created_activity = await social_service.create_activity(sample_activity)
        
        feed = await social_service.get_user_feed(sample_activity.user_id)
        
        assert len(feed) == 1
        assert feed[0].id == created_activity.id
    
    @pytest.mark.asyncio
    async def test_follow_user(self, social_service: SocialServiceInterface):
        follower_id = str(uuid.uuid4())
        following_id = str(uuid.uuid4())
        
        follow = await social_service.follow_user(follower_id, following_id)
        
        assert follow.id is not None
        assert follow.follower_id == follower_id
        assert follow.following_id == following_id
    
    @pytest.mark.asyncio
    async def test_cannot_follow_self(self, social_service: SocialServiceInterface):
        user_id = str(uuid.uuid4())
        
        with pytest.raises(ValueError, match="Cannot follow yourself"):
            await social_service.follow_user(user_id, user_id)
    
    @pytest.mark.asyncio
    async def test_unfollow_user(self, social_service: SocialServiceInterface):
        follower_id = str(uuid.uuid4())
        following_id = str(uuid.uuid4())
        
        await social_service.follow_user(follower_id, following_id)
        unfollowed = await social_service.unfollow_user(follower_id, following_id)
        
        assert unfollowed is True
        
        followers = await social_service.get_followers(following_id)
        assert len(followers) == 0

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
