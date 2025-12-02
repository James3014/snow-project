"""
Learning Focus Tracker service for analyzing user's recent learning patterns.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta, UTC
from typing import Dict, List
import uuid
from collections import Counter

from schemas.buddy_matching import LearningFocus


class LearningFocusTracker:
    """學習焦點追蹤器
    
    Analyzes user's recent practice logs and favorites to determine their
    current learning focus and skill development trends.
    """
    
    # CASI 五項核心技能
    CASI_SKILLS = [
        "stance_balance",      # 站姿與平衡
        "rotation",            # 旋轉
        "edging",              # 用刃
        "pressure",            # 壓力
        "timing_coordination"  # 時機與協調性
    ]
    
    # 課程到技能的映射 (簡化版本，實際應該從課程元數據獲取)
    # 這個映射應該基於課程的 CASI 技能標籤
    LESSON_SKILL_MAPPING = {
        # 這裡應該從實際的課程數據庫中動態獲取
        # 暫時使用一個簡化的映射作為示例
    }
    
    def get_recent_focus(
        self,
        db: Session,
        user_id: uuid.UUID,
        days: int = 30
    ) -> LearningFocus:
        """獲取使用者最近的學習焦點
        
        分析最近 N 天的練習紀錄和收藏，推斷使用者當前的學習焦點。
        
        Args:
            db: Database session
            user_id: User ID
            days: Number of days to look back (default: 30)
            
        Returns:
            LearningFocus object containing primary skill, recent lessons, and trends
        """
        cutoff_date = datetime.now(UTC) - timedelta(days=days)
        
        # 注意：這裡假設 practice_logs 表在同一個數據庫中
        # 如果在不同的數據庫（如 Supabase），需要通過 API 調用獲取
        # 目前先實現邏輯，實際部署時可能需要調整數據源
        
        # 獲取最近的練習紀錄
        # 由於 practice_logs 可能在外部系統（Supabase），這裡使用佔位符邏輯
        recent_lessons = self._get_recent_practice_lessons(db, user_id, cutoff_date)
        
        # 獲取收藏的課程
        favorite_lessons = self._get_favorite_lessons(db, user_id)
        
        # 分析技能焦點
        skill_focus = self._analyze_skill_focus(recent_lessons, favorite_lessons)
        
        # 分析技能趨勢
        skill_trend = self._analyze_skill_trend(db, user_id, cutoff_date)
        
        # 確定主要焦點技能
        primary_skill = max(skill_focus.items(), key=lambda x: x[1])[0] if skill_focus else "stance_balance"
        
        # 計算焦點強度（基於練習頻率和一致性）
        focus_strength = self._calculate_focus_strength(skill_focus, len(recent_lessons))
        
        return LearningFocus(
            user_id=user_id,
            primary_skill=primary_skill,
            recent_lessons=recent_lessons,
            skill_trend=skill_trend,
            focus_strength=focus_strength
        )
    
    def calculate_focus_similarity(
        self,
        focus_a: LearningFocus,
        focus_b: LearningFocus
    ) -> float:
        """計算兩個學習焦點的相似度
        
        考慮以下因素：
        1. 主要技能是否相同
        2. 最近練習的課程重疊度
        3. 技能趨勢的相似性
        
        Args:
            focus_a: First user's learning focus
            focus_b: Second user's learning focus
            
        Returns:
            Similarity score between 0.0 and 1.0
        """
        # Special case: comparing with self always gives perfect similarity
        if focus_a.user_id == focus_b.user_id:
            return 1.0
        
        similarity = 0.0
        
        # 1. 主要技能相同 (40% 權重)
        if focus_a.primary_skill == focus_b.primary_skill:
            similarity += 0.4
        
        # 2. 最近課程重疊度 (30% 權重)
        lessons_a = set(focus_a.recent_lessons)
        lessons_b = set(focus_b.recent_lessons)
        
        if lessons_a and lessons_b:
            overlap = len(lessons_a & lessons_b)
            union = len(lessons_a | lessons_b)
            lesson_similarity = overlap / union if union > 0 else 0.0
            similarity += 0.3 * lesson_similarity
        # If either or both are empty, no lesson similarity bonus (0.0)
        
        # 3. 技能趨勢相似性 (30% 權重)
        trend_similarity = self._calculate_trend_similarity(
            focus_a.skill_trend,
            focus_b.skill_trend
        )
        similarity += 0.3 * trend_similarity
        
        return min(1.0, similarity)
    
    def _get_recent_practice_lessons(
        self,
        db: Session,
        user_id: uuid.UUID,
        cutoff_date: datetime
    ) -> List[str]:
        """獲取最近練習的課程 ID 列表
        
        注意：這是一個佔位符實現。實際部署時，如果 practice_logs
        在外部系統（如 Supabase），需要通過 API 調用獲取。
        """
        # TODO: 實際實現需要連接到 Supabase 或其他外部數據源
        # 目前返回空列表作為佔位符
        return []
    
    def _get_favorite_lessons(
        self,
        db: Session,
        user_id: uuid.UUID
    ) -> List[str]:
        """獲取使用者收藏的課程 ID 列表
        
        注意：這是一個佔位符實現。實際部署時，如果 favorites
        在外部系統（如 Supabase），需要通過 API 調用獲取。
        """
        # TODO: 實際實現需要連接到 Supabase 或其他外部數據源
        # 目前返回空列表作為佔位符
        return []
    
    def _analyze_skill_focus(
        self,
        recent_lessons: List[str],
        favorite_lessons: List[str]
    ) -> Dict[str, float]:
        """分析技能焦點分布
        
        基於最近練習和收藏的課程，推斷使用者在各個 CASI 技能上的焦點。
        
        Returns:
            Dict mapping skill name to focus score (0.0-1.0)
        """
        skill_counts = Counter()
        
        # 分析最近練習的課程（權重 0.7）
        for lesson_id in recent_lessons:
            skills = self._get_lesson_skills(lesson_id)
            for skill in skills:
                skill_counts[skill] += 0.7
        
        # 分析收藏的課程（權重 0.3）
        for lesson_id in favorite_lessons:
            skills = self._get_lesson_skills(lesson_id)
            for skill in skills:
                skill_counts[skill] += 0.3
        
        # 正規化分數
        if skill_counts:
            max_count = max(skill_counts.values())
            return {skill: count / max_count for skill, count in skill_counts.items()}
        
        # 如果沒有數據，返回均勻分布
        return {skill: 0.2 for skill in self.CASI_SKILLS}
    
    def _get_lesson_skills(self, lesson_id: str) -> List[str]:
        """獲取課程關聯的 CASI 技能
        
        注意：這是一個佔位符實現。實際應該從課程元數據中獲取。
        """
        # TODO: 從課程數據庫或 API 獲取課程的技能標籤
        # 目前返回隨機技能作為佔位符
        return ["stance_balance"]  # 佔位符
    
    def _analyze_skill_trend(
        self,
        db: Session,
        user_id: uuid.UUID,
        cutoff_date: datetime
    ) -> Dict[str, str]:
        """分析技能趨勢
        
        基於練習紀錄中的評分變化，判斷各技能的發展趨勢。
        
        Returns:
            Dict mapping skill name to trend ("improving", "stable", "declining")
        """
        # TODO: 實際實現需要分析練習紀錄中的評分數據
        # 目前返回佔位符數據
        return {skill: "stable" for skill in self.CASI_SKILLS}
    
    def _calculate_focus_strength(
        self,
        skill_focus: Dict[str, float],
        practice_count: int
    ) -> float:
        """計算焦點強度
        
        基於技能焦點的集中度和練習頻率計算焦點強度。
        
        Args:
            skill_focus: Skill focus distribution
            practice_count: Number of recent practices
            
        Returns:
            Focus strength between 0.0 and 1.0
        """
        if not skill_focus:
            return 0.0
        
        # 計算焦點集中度（使用基尼係數的變體）
        values = list(skill_focus.values())
        if not values:
            return 0.0
        
        # 焦點越集中（某個技能分數越高），強度越大
        max_focus = max(values)
        avg_focus = sum(values) / len(values)
        concentration = (max_focus - avg_focus) / max_focus if max_focus > 0 else 0.0
        
        # 練習頻率因子（至少 5 次練習才算有明確焦點）
        frequency_factor = min(1.0, practice_count / 5.0)
        
        # 綜合計算焦點強度
        strength = (concentration * 0.7 + frequency_factor * 0.3)
        
        return min(1.0, max(0.0, strength))
    
    def _calculate_trend_similarity(
        self,
        trend_a: Dict[str, str],
        trend_b: Dict[str, str]
    ) -> float:
        """計算技能趨勢相似度
        
        比較兩個使用者在各技能上的發展趨勢。
        
        Returns:
            Similarity score between 0.0 and 1.0
        """
        # If either or both are empty, no trend data to compare
        if not trend_a or not trend_b:
            return 0.0
        
        # 計算相同趨勢的技能比例
        common_skills = set(trend_a.keys()) & set(trend_b.keys())
        if not common_skills:
            return 0.0
        
        matching_trends = sum(
            1 for skill in common_skills
            if trend_a[skill] == trend_b[skill]
        )
        
        return matching_trends / len(common_skills)
