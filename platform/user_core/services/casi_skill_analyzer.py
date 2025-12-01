"""
CASI Skill Analyzer service for analyzing user's CASI skill mastery.

This service analyzes user's practice events from the snowboard teaching system
to infer their proficiency in the five CASI core skills.
"""
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timedelta, UTC
from typing import Dict, List, Optional
import uuid
import logging
from collections import defaultdict
import math

from models.buddy_matching import CASISkillProfile
from schemas.buddy_matching import CASISkillProfile as CASISkillProfileSchema
from schemas.behavior_event import BehaviorEvent
from services.user_core_client import UserCoreClient


logger = logging.getLogger(__name__)


class CASISkillAnalyzer:
    """CASI 技能分析器
    
    Analyzes user's practice events to determine their mastery level
    in the five CASI (Canadian Association of Snowboard Instructors) core skills:
    1. Stance & Balance (站姿與平衡)
    2. Rotation (旋轉)
    3. Edging (用刃)
    4. Pressure (壓力)
    5. Timing & Coordination (時機與協調性)
    """
    
    # CASI 五項核心技能
    CASI_SKILLS = [
        "stance_balance",      # 站姿與平衡
        "rotation",            # 旋轉
        "edging",              # 用刃
        "pressure",            # 壓力
        "timing_coordination"  # 時機與協調性
    ]
    
    # 課程到技能的映射
    # 這個映射基於單板教學系統的課程結構
    # 每個課程可以關聯多個技能，並有不同的權重
    LESSON_SKILL_MAPPING = {
        # 基礎課程 - 主要關注站姿和平衡
        "basic_stance": {
            "stance_balance": 1.0,
            "timing_coordination": 0.3,
        },
        "falling_leaf": {
            "stance_balance": 0.7,
            "edging": 0.8,
            "pressure": 0.5,
        },
        
        # 轉彎課程 - 關注旋轉和用刃
        "j_turn": {
            "rotation": 0.8,
            "edging": 0.7,
            "stance_balance": 0.5,
            "timing_coordination": 0.6,
        },
        "linked_turns": {
            "rotation": 1.0,
            "edging": 0.9,
            "pressure": 0.7,
            "timing_coordination": 0.8,
        },
        
        # 進階課程 - 綜合技能
        "carving": {
            "edging": 1.0,
            "pressure": 0.9,
            "stance_balance": 0.7,
            "timing_coordination": 0.8,
        },
        "switch_riding": {
            "stance_balance": 0.9,
            "rotation": 0.7,
            "timing_coordination": 0.8,
        },
        
        # 默認映射 - 如果課程未在映射中，使用均勻分布
        "_default": {
            "stance_balance": 0.5,
            "rotation": 0.5,
            "edging": 0.5,
            "pressure": 0.5,
            "timing_coordination": 0.5,
        }
    }
    
    def __init__(self, user_core_client: Optional[UserCoreClient] = None):
        """
        Initialize the CASI Skill Analyzer.
        
        Args:
            user_core_client: Optional UserCoreClient for fetching events.
                            If not provided, will create a new one.
        """
        self.user_core_client = user_core_client or UserCoreClient()
    
    def get_skill_profile(
        self,
        db: Session,
        user_id: uuid.UUID,
        refresh: bool = False
    ) -> CASISkillProfileSchema:
        """獲取使用者的 CASI 技能掌握度
        
        First checks the database for an existing profile.
        If not found or refresh=True, analyzes recent events to compute profile.
        
        Args:
            db: Database session
            user_id: User ID
            refresh: If True, recompute profile from events even if cached
            
        Returns:
            CASISkillProfile with skill mastery levels (0.0-1.0)
        """
        # Check if profile exists in database
        if not refresh:
            stmt = select(CASISkillProfile).where(
                CASISkillProfile.user_id == user_id
            )
            result = db.execute(stmt)
            profile = result.scalar_one_or_none()
            
            if profile:
                logger.debug(f"Found cached CASI profile for user {user_id}")
                return CASISkillProfileSchema.model_validate(profile)
        
        # Profile not found or refresh requested - compute from events
        logger.info(f"Computing CASI profile from events for user {user_id}")
        return self.update_skill_profile_from_events(db, user_id)
    
    def update_skill_profile_from_events(
        self,
        db: Session,
        user_id: uuid.UUID,
        days: int = 90
    ) -> CASISkillProfileSchema:
        """從練習事件推斷技能掌握度
        
        Analyzes user's practice events from the snowboard teaching system
        to infer their skill mastery levels.
        
        Args:
            db: Database session
            user_id: User ID
            days: Number of days to look back for events (default: 90)
            
        Returns:
            Updated CASISkillProfile
        """
        # Fetch practice events from user-core
        try:
            events = self.user_core_client.get_user_events(
                user_id=user_id,
                source_projects=["單板教學"],
                limit=500  # Analyze up to 500 recent events
            )
            
            logger.info(f"Fetched {len(events)} practice events for user {user_id}")
        except Exception as e:
            logger.error(f"Error fetching events for user {user_id}: {e}")
            # Return default profile if we can't fetch events
            events = []
        
        # Filter events to only include practice-related events
        practice_events = [
            e for e in events
            if e.event_type in ["lesson_completed", "practice_session", "drill_completed"]
        ]
        
        # Compute skill mastery from events
        skill_scores = self._compute_skill_scores_from_events(practice_events)
        
        # Ensure all scores are in valid range [0.0, 1.0]
        skill_scores = {
            skill: max(0.0, min(1.0, score))
            for skill, score in skill_scores.items()
        }
        
        # Update or create profile in database
        stmt = select(CASISkillProfile).where(
            CASISkillProfile.user_id == user_id
        )
        result = db.execute(stmt)
        profile = result.scalar_one_or_none()
        
        if profile:
            # Update existing profile
            profile.stance_balance = skill_scores["stance_balance"]
            profile.rotation = skill_scores["rotation"]
            profile.edging = skill_scores["edging"]
            profile.pressure = skill_scores["pressure"]
            profile.timing_coordination = skill_scores["timing_coordination"]
            profile.updated_at = datetime.now(UTC)
        else:
            # Create new profile
            profile = CASISkillProfile(
                user_id=user_id,
                stance_balance=skill_scores["stance_balance"],
                rotation=skill_scores["rotation"],
                edging=skill_scores["edging"],
                pressure=skill_scores["pressure"],
                timing_coordination=skill_scores["timing_coordination"],
                updated_at=datetime.now(UTC)
            )
            db.add(profile)
        
        db.commit()
        db.refresh(profile)
        
        logger.info(f"Updated CASI profile for user {user_id}: {skill_scores}")
        
        return CASISkillProfileSchema.model_validate(profile)
    
    def calculate_skill_similarity(
        self,
        profile_a: CASISkillProfileSchema,
        profile_b: CASISkillProfileSchema
    ) -> float:
        """計算兩個技能檔案的相似度
        
        Uses cosine similarity to measure how similar two skill profiles are.
        Returns a value between 0.0 (completely different) and 1.0 (identical).
        
        Args:
            profile_a: First user's skill profile
            profile_b: Second user's skill profile
            
        Returns:
            Similarity score between 0.0 and 1.0
        """
        # Special case: comparing with self always gives perfect similarity
        if profile_a.user_id == profile_b.user_id:
            return 1.0
        
        # Extract skill vectors
        skills_a = [
            profile_a.stance_balance,
            profile_a.rotation,
            profile_a.edging,
            profile_a.pressure,
            profile_a.timing_coordination,
        ]
        
        skills_b = [
            profile_b.stance_balance,
            profile_b.rotation,
            profile_b.edging,
            profile_b.pressure,
            profile_b.timing_coordination,
        ]
        
        # Calculate cosine similarity
        dot_product = sum(a * b for a, b in zip(skills_a, skills_b))
        magnitude_a = math.sqrt(sum(a * a for a in skills_a))
        magnitude_b = math.sqrt(sum(b * b for b in skills_b))
        
        # Handle edge case where one or both profiles have zero magnitude
        if magnitude_a == 0.0 or magnitude_b == 0.0:
            # If both are zero, they're identical (both have no skills)
            if magnitude_a == 0.0 and magnitude_b == 0.0:
                return 1.0
            # If only one is zero, they're completely different
            return 0.0
        
        similarity = dot_product / (magnitude_a * magnitude_b)
        
        # Ensure result is in valid range [0.0, 1.0]
        return max(0.0, min(1.0, similarity))
    
    def _compute_skill_scores_from_events(
        self,
        events: List[BehaviorEvent]
    ) -> Dict[str, float]:
        """從事件計算技能分數
        
        Analyzes practice events to compute skill mastery scores.
        
        Algorithm:
        1. For each event, extract lesson ID and rating (if available)
        2. Map lesson to CASI skills using LESSON_SKILL_MAPPING
        3. Accumulate weighted scores for each skill
        4. Normalize scores to [0.0, 1.0] range
        
        Args:
            events: List of practice events
            
        Returns:
            Dict mapping skill name to mastery score (0.0-1.0)
        """
        # Initialize skill accumulators
        skill_weights = defaultdict(float)
        skill_counts = defaultdict(int)
        
        for event in events:
            # Extract lesson ID from event payload
            lesson_id = event.payload.get("lesson_id") or event.payload.get("drill_id")
            if not lesson_id:
                continue
            
            # Extract rating/score if available (0-5 scale typically)
            rating = event.payload.get("rating", 3.0)  # Default to 3.0 if not provided
            rating = float(rating)
            
            # Normalize rating to 0.0-1.0 scale
            normalized_rating = min(1.0, max(0.0, rating / 5.0))
            
            # Get skill mapping for this lesson
            skill_mapping = self._get_lesson_skill_mapping(lesson_id)
            
            # Accumulate weighted scores
            for skill, weight in skill_mapping.items():
                skill_weights[skill] += normalized_rating * weight
                skill_counts[skill] += 1
        
        # Compute average scores for each skill
        skill_scores = {}
        for skill in self.CASI_SKILLS:
            if skill_counts[skill] > 0:
                # Average the accumulated scores
                avg_score = skill_weights[skill] / skill_counts[skill]
                skill_scores[skill] = avg_score
            else:
                # No data for this skill - default to 0.0
                skill_scores[skill] = 0.0
        
        return skill_scores
    
    def _get_lesson_skill_mapping(self, lesson_id: str) -> Dict[str, float]:
        """獲取課程的技能映射
        
        Maps a lesson ID to its associated CASI skills and weights.
        
        Args:
            lesson_id: Lesson or drill ID
            
        Returns:
            Dict mapping skill name to weight (0.0-1.0)
        """
        # Try to find exact match
        if lesson_id in self.LESSON_SKILL_MAPPING:
            return self.LESSON_SKILL_MAPPING[lesson_id]
        
        # Try to find partial match (e.g., lesson_id contains key)
        for key, mapping in self.LESSON_SKILL_MAPPING.items():
            if key != "_default" and key in lesson_id.lower():
                return mapping
        
        # No match found - use default mapping
        return self.LESSON_SKILL_MAPPING["_default"]
