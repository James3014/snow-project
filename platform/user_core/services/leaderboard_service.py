"""Leaderboard service - handles achievement rankings."""
from typing import List, Optional
import uuid

from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from models.course_tracking import CourseVisit, UserAchievement
from models.user_profile import UserProfile
from schemas.course_tracking import LeaderboardEntry


def get_leaderboard(db: Session, limit: int = 100, skip: int = 0) -> List[LeaderboardEntry]:
    """Get global achievement leaderboard."""
    user_stats = db.query(
        UserAchievement.user_id,
        func.sum(UserAchievement.points).label('total_points'),
        func.count(UserAchievement.id).label('achievement_count')
    ).group_by(UserAchievement.user_id).subquery()
    
    results = db.query(
        user_stats.c.user_id,
        user_stats.c.total_points,
        user_stats.c.achievement_count,
        UserProfile.preferred_language
    ).join(
        UserProfile, UserProfile.user_id == user_stats.c.user_id
    ).order_by(desc(user_stats.c.total_points)).offset(skip).limit(limit).all()
    
    leaderboard = []
    for idx, row in enumerate(results, start=skip + 1):
        resorts_count = db.query(func.count(func.distinct(CourseVisit.resort_id))).filter(
            CourseVisit.user_id == row.user_id
        ).scalar() or 0
        
        courses_count = db.query(func.count(func.distinct(CourseVisit.course_name))).filter(
            CourseVisit.user_id == row.user_id
        ).scalar() or 0
        
        entry = LeaderboardEntry(
            rank=idx,
            user_id=row.user_id,
            user_display_name=f"User {str(row.user_id)[:8]}",
            total_points=row.total_points or 0,
            resorts_count=resorts_count,
            courses_count=courses_count
        )
        leaderboard.append(entry)
    
    return leaderboard


def get_user_rank(db: Session, user_id: uuid.UUID) -> Optional[int]:
    """Get a specific user's rank on the leaderboard."""
    user_stats = db.query(
        UserAchievement.user_id,
        func.sum(UserAchievement.points).label('total_points')
    ).group_by(UserAchievement.user_id).subquery()
    
    user_points = db.query(user_stats.c.total_points).filter(
        user_stats.c.user_id == user_id
    ).scalar()
    
    if user_points is None:
        return None
    
    rank = db.query(func.count(user_stats.c.user_id)).filter(
        user_stats.c.total_points > user_points
    ).scalar() + 1
    
    return rank
