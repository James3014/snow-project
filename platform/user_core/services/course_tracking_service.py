"""
Course tracking service - facade for backward compatibility.

This module re-exports functions from specialized services:
- course_visit_service: Course visit operations
- recommendation_service: Course recommendations
- achievement_service: Achievement system
- leaderboard_service: Leaderboard rankings
"""
from typing import List, Optional, Dict
import uuid

from sqlalchemy import func
from sqlalchemy.orm import Session

from models.course_tracking import (
    CourseVisit, CourseRecommendation, UserAchievement, AchievementDefinition
)
from schemas.course_tracking import (
    CourseVisitCreate, CourseRecommendationCreate, CourseRecommendationUpdate,
    ResortProgress, CourseRanking, LeaderboardEntry
)

# Import from specialized services
from services import (
    course_visit_service,
    recommendation_service,
    achievement_service,
    leaderboard_service
)

# Re-export exceptions for backward compatibility
from exceptions.domain import DuplicateCourseVisitError, RecommendationLimitError


# ==================== Course Visit Operations ====================

def record_course_visit(db: Session, user_id: uuid.UUID, visit: CourseVisitCreate) -> CourseVisit:
    """Record a new course visit for a user."""
    db_visit = course_visit_service.record_visit(db, user_id, visit)
    
    # Check and award achievements after recording visit
    achievement_service.check_and_award(db, user_id)
    
    # Auto-generate activity feed item
    try:
        from services import social_service
        social_service.create_feed_item_from_course_visit(db, db_visit)
    except Exception as e:
        print(f"Failed to create feed item: {e}")
    
    return db_visit


def get_user_course_visits(
    db: Session,
    user_id: uuid.UUID,
    resort_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[CourseVisit]:
    """Get all course visits for a user."""
    return course_visit_service.get_user_visits(db, user_id, resort_id, skip, limit)


def delete_course_visit(db: Session, visit_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    """Delete a course visit."""
    return course_visit_service.delete_visit(db, visit_id, user_id)


def update_course_visit(db: Session, visit_id: uuid.UUID, user_id: uuid.UUID, update) -> Optional[CourseVisit]:
    """Update an existing course visit."""
    return course_visit_service.update_visit(db, visit_id, user_id, update)


# ==================== Progress Calculation ====================

def calculate_resort_progress(
    db: Session,
    user_id: uuid.UUID,
    resort_id: str,
    total_courses: int
) -> ResortProgress:
    """Calculate user's completion progress at a specific resort."""
    completed = db.query(CourseVisit.course_name).filter(
        CourseVisit.user_id == user_id,
        CourseVisit.resort_id == resort_id
    ).distinct().all()
    
    completed_courses = [row.course_name for row in completed]
    completed_count = len(completed_courses)
    percentage = (completed_count / total_courses * 100) if total_courses > 0 else 0.0
    recommendations = get_user_recommendations(db, user_id, resort_id)
    
    return ResortProgress(
        resort_id=resort_id,
        completed_courses=completed_courses,
        total_courses=total_courses,
        completion_percentage=round(percentage, 2),
        recommendations=recommendations
    )


# ==================== Course Recommendations ====================

def create_recommendation(db: Session, user_id: uuid.UUID, recommendation: CourseRecommendationCreate) -> CourseRecommendation:
    """Create a new course recommendation."""
    return recommendation_service.create(db, user_id, recommendation)


def update_recommendation(
    db: Session,
    recommendation_id: uuid.UUID,
    user_id: uuid.UUID,
    update: CourseRecommendationUpdate
) -> Optional[CourseRecommendation]:
    """Update an existing recommendation."""
    return recommendation_service.update(db, recommendation_id, user_id, update)


def delete_recommendation(db: Session, recommendation_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    """Delete a recommendation."""
    return recommendation_service.delete(db, recommendation_id, user_id)


def get_user_recommendations(
    db: Session,
    user_id: uuid.UUID,
    resort_id: Optional[str] = None
) -> List[CourseRecommendation]:
    """Get all recommendations for a user."""
    return recommendation_service.get_user_recommendations(db, user_id, resort_id)


def moderate_recommendation(
    db: Session,
    recommendation_id: uuid.UUID,
    reviewer_id: uuid.UUID,
    new_status: str
) -> Optional[CourseRecommendation]:
    """Moderate a recommendation."""
    return recommendation_service.moderate(db, recommendation_id, reviewer_id, new_status)


# ==================== Course Rankings ====================

def get_course_rankings(db: Session, resort_id: str, limit: int = 50) -> List[CourseRanking]:
    """Get popularity rankings for courses at a resort."""
    visit_counts = db.query(
        CourseVisit.course_name,
        func.count(func.distinct(CourseVisit.user_id)).label('visit_count')
    ).filter(CourseVisit.resort_id == resort_id).group_by(CourseVisit.course_name).subquery()
    
    rec_counts = db.query(
        CourseRecommendation.course_name,
        func.count(CourseRecommendation.id).label('recommendation_count')
    ).filter(
        CourseRecommendation.resort_id == resort_id,
        CourseRecommendation.status == 'approved'
    ).group_by(CourseRecommendation.course_name).subquery()
    
    results = db.query(
        visit_counts.c.course_name,
        func.coalesce(visit_counts.c.visit_count, 0).label('visit_count'),
        func.coalesce(rec_counts.c.recommendation_count, 0).label('recommendation_count')
    ).outerjoin(rec_counts, visit_counts.c.course_name == rec_counts.c.course_name).all()
    
    rankings = []
    for row in results:
        score = row.visit_count + (row.recommendation_count * 3)
        rankings.append(CourseRanking(
            course_name=row.course_name,
            visit_count=row.visit_count,
            recommendation_count=row.recommendation_count,
            popularity_score=score
        ))
    
    rankings.sort(key=lambda x: x.popularity_score, reverse=True)
    for idx, ranking in enumerate(rankings[:limit], start=1):
        ranking.rank = idx
    
    return rankings[:limit]


# ==================== Achievement System ====================

def load_achievement_definitions(db: Session, yaml_path: str) -> int:
    """Load achievement definitions from YAML file."""
    return achievement_service.load_definitions(db, yaml_path)


def _check_and_award_achievements(db: Session, user_id: uuid.UUID) -> List[UserAchievement]:
    """Check and award new achievements."""
    newly_awarded = achievement_service.check_and_award(db, user_id)
    
    # Auto-generate activity feed items
    for ach in newly_awarded:
        try:
            from services import social_service
            social_service.create_feed_item_from_achievement(db, ach)
        except Exception as e:
            print(f"Failed to create feed item for achievement: {e}")
    
    return newly_awarded


def get_user_achievements(db: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[UserAchievement]:
    """Get all achievements earned by a user."""
    return achievement_service.get_user_achievements(db, user_id, skip, limit)


def get_achievement_definitions(
    db: Session,
    include_hidden: bool = False,
    category: Optional[str] = None
) -> List[AchievementDefinition]:
    """Get all achievement definitions."""
    return achievement_service.get_definitions(db, include_hidden, category)


def get_user_achievement_summary(db: Session, user_id: uuid.UUID) -> Dict:
    """Get summary of user's achievement progress."""
    return achievement_service.get_user_summary(db, user_id)


# ==================== Leaderboard ====================

def get_leaderboard(db: Session, limit: int = 100, skip: int = 0) -> List[LeaderboardEntry]:
    """Get global achievement leaderboard."""
    return leaderboard_service.get_leaderboard(db, limit, skip)


def get_user_leaderboard_rank(db: Session, user_id: uuid.UUID) -> Optional[int]:
    """Get a specific user's rank on the leaderboard."""
    return leaderboard_service.get_user_rank(db, user_id)
