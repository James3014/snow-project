"""
Schemas for buddy matching functionality.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime
import uuid


class CASISkillProfile(BaseModel):
    """CASI 技能檔案"""
    model_config = {"from_attributes": True}
    
    user_id: uuid.UUID
    stance_balance: float = Field(ge=0.0, le=1.0)  # 站姿與平衡
    rotation: float = Field(ge=0.0, le=1.0)  # 旋轉
    edging: float = Field(ge=0.0, le=1.0)  # 用刃
    pressure: float = Field(ge=0.0, le=1.0)  # 壓力
    timing_coordination: float = Field(ge=0.0, le=1.0)  # 時機與協調性
    updated_at: datetime


class LearningFocus(BaseModel):
    """學習焦點"""
    user_id: uuid.UUID
    primary_skill: str  # CASI 技能
    recent_lessons: List[str]  # 最近練習的課程 ID
    skill_trend: Dict[str, str]  # "improving", "stable", "declining"
    focus_strength: float = Field(ge=0.0, le=1.0)  # 焦點強度 (0-1)


class MatchScore(BaseModel):
    """匹配分數"""
    total_score: int = Field(ge=0, le=100)  # 0-100
    time_score: int = Field(ge=0, le=40)  # 0-40
    location_score: int = Field(ge=0, le=30)  # 0-30
    skill_score: int = Field(ge=0, le=20)  # 0-20
    social_score: int = Field(ge=0, le=10)  # 0-10
    reasons: List[str]  # 人類可讀的原因


class TripSummary(BaseModel):
    """行程摘要"""
    trip_id: uuid.UUID
    resort_id: str
    start_date: datetime
    end_date: datetime
    visibility: str


class MatchResult(BaseModel):
    """匹配結果"""
    candidate_id: uuid.UUID
    candidate_name: str
    candidate_avatar: Optional[str] = None
    match_score: MatchScore
    candidate_trips: List[TripSummary]
    casi_skills: Dict[str, float]
    learning_focus: List[str]
    is_mutual_follower: bool
