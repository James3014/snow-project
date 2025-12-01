from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import date

# Represents the preferences a user sets for finding a snowbuddy
class MatchingPreference(BaseModel):
    skill_level_min: int = Field(1, ge=1, le=10)
    skill_level_max: int = Field(10, ge=1, le=10)
    preferred_resorts: Optional[List[str]] = []
    preferred_regions: Optional[List[str]] = []
    availability: Optional[List[date]] = []
    seeking_role: Literal['buddy', 'student', 'coach'] = 'buddy'
    include_knowledge_score: bool = Field(False, description="Whether to include knowledge engagement score in matching")

# Represents the public-facing profile of a potential match (candidate)
class CandidateProfile(BaseModel):
    user_id: str
    nickname: str
    skill_level: int
    # The user's own stated role (what they see themselves as)
    self_role: Literal['buddy', 'student', 'coach'] = 'buddy'
    preferences: MatchingPreference

# Represents the final, anonymized summary returned to the user
class MatchSummary(BaseModel):
    user_id: str # Anonymized or temporary ID if needed in future
    nickname: str
    skill_level: int
    self_role: Literal['buddy', 'student', 'coach']
    match_score: float = Field(..., description="The calculated score for this match, from 0.0 to 1.0")
