"""Course repository for course tracking operations."""
from typing import Optional, List
from datetime import date
import uuid

from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from repositories.base import BaseRepository
from models.course_tracking import CourseVisit, CourseRecommendation, UserAchievement


class CourseVisitRepository(BaseRepository[CourseVisit]):
    """Repository for CourseVisit operations."""
    
    def __init__(self, db: Session):
        super().__init__(CourseVisit, db)
    
    def get_by_user(self, user_id: uuid.UUID, resort_id: Optional[str] = None, 
                    skip: int = 0, limit: int = 100) -> List[CourseVisit]:
        """Get visits by user, optionally filtered by resort."""
        query = self.db.query(CourseVisit).filter(CourseVisit.user_id == user_id)
        if resort_id:
            query = query.filter(CourseVisit.resort_id == resort_id)
        return query.order_by(desc(CourseVisit.visited_date)).offset(skip).limit(limit).all()
    
    def get_by_user_and_id(self, visit_id: uuid.UUID, user_id: uuid.UUID) -> Optional[CourseVisit]:
        """Get visit by ID and user ID."""
        return self.db.query(CourseVisit).filter(
            CourseVisit.id == visit_id,
            CourseVisit.user_id == user_id
        ).first()
    
    def get_distinct_courses(self, user_id: uuid.UUID, resort_id: str) -> List[str]:
        """Get distinct course names visited by user at resort."""
        result = self.db.query(CourseVisit.course_name).filter(
            CourseVisit.user_id == user_id,
            CourseVisit.resort_id == resort_id
        ).distinct().all()
        return [row.course_name for row in result]
    
    def count_distinct_courses(self, user_id: uuid.UUID) -> int:
        """Count distinct courses visited by user."""
        return self.db.query(func.count(func.distinct(CourseVisit.course_name))).filter(
            CourseVisit.user_id == user_id
        ).scalar() or 0
    
    def count_distinct_resorts(self, user_id: uuid.UUID) -> int:
        """Count distinct resorts visited by user."""
        return self.db.query(func.count(func.distinct(CourseVisit.resort_id))).filter(
            CourseVisit.user_id == user_id
        ).scalar() or 0


class RecommendationRepository(BaseRepository[CourseRecommendation]):
    """Repository for CourseRecommendation operations."""
    
    def __init__(self, db: Session):
        super().__init__(CourseRecommendation, db)
    
    def get_by_user(self, user_id: uuid.UUID, resort_id: Optional[str] = None) -> List[CourseRecommendation]:
        """Get recommendations by user."""
        query = self.db.query(CourseRecommendation).filter(CourseRecommendation.user_id == user_id)
        if resort_id:
            query = query.filter(CourseRecommendation.resort_id == resort_id)
        return query.order_by(CourseRecommendation.rank).all()
    
    def count_by_user_resort(self, user_id: uuid.UUID, resort_id: str) -> int:
        """Count recommendations by user for a resort."""
        return self.db.query(func.count(CourseRecommendation.id)).filter(
            CourseRecommendation.user_id == user_id,
            CourseRecommendation.resort_id == resort_id
        ).scalar() or 0
    
    def get_by_user_and_id(self, rec_id: uuid.UUID, user_id: uuid.UUID) -> Optional[CourseRecommendation]:
        """Get recommendation by ID and user ID."""
        return self.db.query(CourseRecommendation).filter(
            CourseRecommendation.id == rec_id,
            CourseRecommendation.user_id == user_id
        ).first()


class AchievementRepository(BaseRepository[UserAchievement]):
    """Repository for UserAchievement operations."""
    
    def __init__(self, db: Session):
        super().__init__(UserAchievement, db)
    
    def get_by_user(self, user_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[UserAchievement]:
        """Get achievements by user."""
        return self.db.query(UserAchievement).filter(
            UserAchievement.user_id == user_id
        ).order_by(desc(UserAchievement.earned_at)).offset(skip).limit(limit).all()
    
    def get_user_achievement_types(self, user_id: uuid.UUID) -> set:
        """Get set of achievement types earned by user."""
        result = self.db.query(UserAchievement.achievement_type).filter(
            UserAchievement.user_id == user_id
        ).all()
        return {row.achievement_type for row in result}
    
    def get_total_points(self, user_id: uuid.UUID) -> int:
        """Get total points for user."""
        return self.db.query(func.sum(UserAchievement.points)).filter(
            UserAchievement.user_id == user_id
        ).scalar() or 0
