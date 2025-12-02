"""
Pydantic schemas for course tracking (visits, recommendations, achievements).
"""
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, UUID4, Field, field_validator
import enum


class RecommendationStatus(str, enum.Enum):
    """Status of course recommendation review."""
    pending_review = "pending_review"
    approved = "approved"
    rejected = "rejected"


class AchievementCategory(str, enum.Enum):
    """Achievement categories."""
    basic = "basic"
    advanced = "advanced"
    expert = "expert"
    special = "special"


# ===== Course Visit Schemas =====

class CourseVisitBase(BaseModel):
    """Base schema for course visit."""
    resort_id: str = Field(..., max_length=100)
    course_name: str = Field(..., max_length=200)
    visited_date: date
    notes: Optional[str] = Field(None, max_length=200, description="心得筆記（最多200字）")

    # 新增：增強紀錄體驗欄位
    snow_condition: Optional[str] = Field(None, max_length=50, description="雪況（粉雪/壓雪/冰面/融雪）")
    weather: Optional[str] = Field(None, max_length=50, description="天氣（晴天/陰天/下雪/暴風雪）")
    difficulty_feeling: Optional[str] = Field(None, max_length=50, description="難度感受（比預期簡單/適中/困難）")
    rating: Optional[int] = Field(None, ge=1, le=5, description="評分（1-5星）")
    mood_tags: Optional[List[str]] = Field(None, description="心情標籤（如：爽快、累爆、初體驗）")


class CourseVisitCreate(BaseModel):
    """Schema for creating a course visit."""
    resort_id: str = Field(..., max_length=100)
    course_name: str = Field(..., max_length=200)
    visited_date: Optional[date] = None
    notes: Optional[str] = Field(None, max_length=200, description="心得筆記（最多200字）")

    # 新增：增強紀錄體驗欄位（創建時都是選填）
    snow_condition: Optional[str] = Field(None, max_length=50)
    weather: Optional[str] = Field(None, max_length=50)
    difficulty_feeling: Optional[str] = Field(None, max_length=50)
    rating: Optional[int] = Field(None, ge=1, le=5)
    mood_tags: Optional[List[str]] = None


class CourseVisitUpdate(BaseModel):
    """Schema for updating an existing course visit. All fields are optional."""
    visited_date: Optional[date] = None
    notes: Optional[str] = Field(None, max_length=200)
    snow_condition: Optional[str] = Field(None, max_length=50)
    weather: Optional[str] = Field(None, max_length=50)
    difficulty_feeling: Optional[str] = Field(None, max_length=50)
    rating: Optional[int] = Field(None, ge=1, le=5)
    mood_tags: Optional[List[str]] = None


class CourseVisit(CourseVisitBase):
    """Schema for course visit response."""
    id: UUID4
    user_id: UUID4
    created_at: datetime

    model_config = {"from_attributes": True}


# ===== Course Recommendation Schemas =====

class CourseRecommendationBase(BaseModel):
    """Base schema for course recommendation."""
    resort_id: str = Field(..., max_length=100)
    course_name: str = Field(..., max_length=200)
    rank: int = Field(..., ge=1, le=3, description="Rank 1-3 (1 is highest)")
    reason: Optional[str] = Field(None, max_length=500, description="Why you recommend this course")

    @field_validator('reason')
    @classmethod
    def validate_reason_length(cls, v):
        if v and len(v) > 500:
            raise ValueError('Recommendation reason must be 500 characters or less')
        return v


class CourseRecommendationCreate(CourseRecommendationBase):
    """Schema for creating a course recommendation."""
    pass


class CourseRecommendationUpdate(BaseModel):
    """Schema for updating a course recommendation."""
    course_name: Optional[str] = Field(None, max_length=200)
    rank: Optional[int] = Field(None, ge=1, le=3)
    reason: Optional[str] = Field(None, max_length=500)


class CourseRecommendation(CourseRecommendationBase):
    """Schema for course recommendation response."""
    id: UUID4
    user_id: UUID4
    status: RecommendationStatus
    reviewed_by: Optional[UUID4] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CourseRecommendationWithUser(CourseRecommendation):
    """Course recommendation with user display name."""
    user_display_name: str


# ===== Course Rankings Schemas =====

class CourseRankingItem(BaseModel):
    """Single course in the rankings."""
    course_name: str
    recommendation_count: int
    average_rank: float
    top_reasons: List[str] = []
    recent_recommendations: List[Dict[str, Any]] = []


class CourseRankings(BaseModel):
    """Rankings of courses at a resort."""
    resort_id: str
    total_recommendations: int
    rankings: List[CourseRankingItem]


# ===== User Achievement Schemas =====

class UserAchievementBase(BaseModel):
    """Base schema for user achievement."""
    achievement_type: str = Field(..., max_length=50)
    achievement_data: Optional[Dict[str, Any]] = None
    points: int = 0


class UserAchievement(UserAchievementBase):
    """Schema for user achievement response."""
    id: UUID4
    user_id: UUID4
    earned_at: datetime

    model_config = {"from_attributes": True}


class UserAchievementWithDefinition(UserAchievement):
    """User achievement with definition details."""
    name_zh: str
    name_en: str
    description_zh: Optional[str] = None
    description_en: Optional[str] = None
    icon: str
    category: AchievementCategory


# ===== Achievement Definition Schemas =====

class AchievementDefinitionBase(BaseModel):
    """Base schema for achievement definition."""
    achievement_type: str = Field(..., max_length=50)
    name_zh: str = Field(..., max_length=100)
    name_en: str = Field(..., max_length=100)
    description_zh: Optional[str] = None
    description_en: Optional[str] = None
    icon: str = Field(..., max_length=20)
    category: AchievementCategory
    points: int = 0
    requirements: Dict[str, Any]
    is_hidden: bool = False
    display_order: int = 0


class AchievementDefinitionCreate(AchievementDefinitionBase):
    """Schema for creating achievement definition."""
    pass


class AchievementDefinition(AchievementDefinitionBase):
    """Schema for achievement definition response."""
    created_at: datetime

    model_config = {"from_attributes": True}


# ===== Progress & Stats Schemas =====

class ResortProgress(BaseModel):
    """User's progress at a specific resort."""
    resort_id: str
    completed_courses: List[str]
    total_courses: int
    completion_percentage: float
    recommendations: List[CourseRecommendation] = []
    last_visit: Optional[date] = None


class UserStats(BaseModel):
    """Overall user statistics."""
    total_resorts_visited: int
    total_courses_completed: int
    total_achievements: int
    total_points: int
    rank: Optional[int] = None
    beginner_courses: int = 0
    intermediate_courses: int = 0
    advanced_courses: int = 0


class CourseVisitResponse(BaseModel):
    """Response after recording a course visit."""
    message: str
    visit: CourseVisit
    new_achievements: List[UserAchievementWithDefinition] = []
    completion: Optional[Dict[str, Any]] = None


# ===== Leaderboard Schemas =====

class LeaderboardEntry(BaseModel):
    """Single entry in the leaderboard."""
    rank: int
    user_id: UUID4
    user_display_name: str
    total_points: int
    resorts_count: int
    courses_count: int


class Leaderboard(BaseModel):
    """Achievement leaderboard."""
    leaderboard: List[LeaderboardEntry]
    total_users: int
    current_user: Optional[LeaderboardEntry] = None


# ===== Admin Schemas =====

class RecommendationReview(BaseModel):
    """Schema for reviewing a recommendation."""
    status: RecommendationStatus
    reviewer_notes: Optional[str] = None


# ===== Additional Schemas for API =====

class CourseRanking(BaseModel):
    """Course popularity ranking."""
    rank: Optional[int] = None
    course_name: str
    visit_count: int
    recommendation_count: int
    popularity_score: int


class UserAchievementWithDetails(UserAchievement):
    """User achievement with full definition details (simplified version)."""
    name_zh: str
    name_en: str
    icon: str
    category: str


class AchievementSummary(BaseModel):
    """Summary of user's achievement progress."""
    total_points: int
    achievement_count: int
    total_available: int
    completion_percentage: float
    category_breakdown: Dict[str, int]


class UserRank(BaseModel):
    """User's rank on leaderboard."""
    user_id: UUID4
    rank: Optional[int] = None
