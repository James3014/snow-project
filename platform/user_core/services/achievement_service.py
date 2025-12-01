"""Achievement service - handles achievement definitions and awards."""
from datetime import datetime, UTC
from typing import List, Optional, Dict
import uuid

from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from models.course_tracking import (
    CourseVisit, CourseRecommendation, UserAchievement, AchievementDefinition
)


def load_definitions(db: Session, yaml_path: str) -> int:
    """Load achievement definitions from YAML file."""
    import yaml
    
    with open(yaml_path, 'r', encoding='utf-8') as f:
        definitions = yaml.safe_load(f)
    
    count = 0
    for defn in definitions:
        existing = db.query(AchievementDefinition).filter(
            AchievementDefinition.achievement_type == defn['achievement_type']
        ).first()
        
        if existing:
            existing.name_zh = defn['name_zh']
            existing.name_en = defn['name_en']
            existing.description_zh = defn.get('description_zh')
            existing.description_en = defn.get('description_en')
            existing.icon = defn['icon']
            existing.category = defn['category']
            existing.points = defn['points']
            existing.requirements = defn['requirements']
            existing.is_hidden = defn.get('is_hidden', False)
            existing.display_order = defn.get('display_order', 0)
        else:
            new_defn = AchievementDefinition(
                achievement_type=defn['achievement_type'],
                name_zh=defn['name_zh'],
                name_en=defn['name_en'],
                description_zh=defn.get('description_zh'),
                description_en=defn.get('description_en'),
                icon=defn['icon'],
                category=defn['category'],
                points=defn['points'],
                requirements=defn['requirements'],
                is_hidden=defn.get('is_hidden', False),
                display_order=defn.get('display_order', 0)
            )
            db.add(new_defn)
        count += 1
    
    db.commit()
    return count


def check_and_award(db: Session, user_id: uuid.UUID) -> List[UserAchievement]:
    """Check and award new achievements for a user."""
    definitions = db.query(AchievementDefinition).all()
    existing = {row.achievement_type for row in db.query(UserAchievement.achievement_type).filter(
        UserAchievement.user_id == user_id
    ).all()}
    
    newly_awarded = []
    for defn in definitions:
        if defn.achievement_type in existing:
            continue
        if _check_requirements(db, user_id, defn):
            achievement = UserAchievement(
                user_id=user_id,
                achievement_type=defn.achievement_type,
                points=defn.points,
                achievement_data={}
            )
            db.add(achievement)
            newly_awarded.append(achievement)
    
    if newly_awarded:
        db.commit()
        for ach in newly_awarded:
            db.refresh(ach)
    
    return newly_awarded


def _check_requirements(db: Session, user_id: uuid.UUID, definition: AchievementDefinition) -> bool:
    """Check if user meets achievement requirements."""
    req = definition.requirements
    req_type = req.get('type')
    
    if req_type == 'first_course':
        count = db.query(func.count(CourseVisit.id)).filter(CourseVisit.user_id == user_id).scalar()
        return count >= 1
    
    elif req_type == 'course_count':
        count = db.query(func.count(func.distinct(CourseVisit.course_name))).filter(
            CourseVisit.user_id == user_id
        ).scalar()
        return count >= req.get('count', 0)
    
    elif req_type == 'resort_count':
        count = db.query(func.count(func.distinct(CourseVisit.resort_id))).filter(
            CourseVisit.user_id == user_id
        ).scalar()
        return count >= req.get('count', 0)
    
    elif req_type == 'recommendation_count':
        count = db.query(func.count(CourseRecommendation.id)).filter(
            CourseRecommendation.user_id == user_id
        ).scalar()
        return count >= req.get('count', 0)
    
    elif req_type == 'points':
        total = db.query(func.sum(UserAchievement.points)).filter(
            UserAchievement.user_id == user_id
        ).scalar() or 0
        return total >= req.get('points', 0)
    
    return False


def get_user_achievements(db: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[UserAchievement]:
    """Get all achievements earned by a user."""
    return db.query(UserAchievement).filter(
        UserAchievement.user_id == user_id
    ).order_by(desc(UserAchievement.earned_at)).offset(skip).limit(limit).all()


def get_definitions(db: Session, include_hidden: bool = False, category: Optional[str] = None) -> List[AchievementDefinition]:
    """Get all achievement definitions."""
    query = db.query(AchievementDefinition)
    if not include_hidden:
        query = query.filter(AchievementDefinition.is_hidden == False)
    if category:
        query = query.filter(AchievementDefinition.category == category)
    return query.order_by(AchievementDefinition.category, AchievementDefinition.display_order).all()


def get_user_summary(db: Session, user_id: uuid.UUID) -> Dict:
    """Get summary of user's achievement progress."""
    achievements = get_user_achievements(db, user_id, limit=1000)
    total_points = sum(ach.points for ach in achievements)
    
    category_counts = {}
    for ach in achievements:
        defn = db.query(AchievementDefinition).filter(
            AchievementDefinition.achievement_type == ach.achievement_type
        ).first()
        if defn:
            category_counts[defn.category] = category_counts.get(defn.category, 0) + 1
    
    total_available = db.query(func.count(AchievementDefinition.achievement_type)).scalar()
    
    return {
        'total_points': total_points,
        'achievement_count': len(achievements),
        'total_available': total_available,
        'completion_percentage': round((len(achievements) / total_available * 100) if total_available > 0 else 0, 2),
        'category_breakdown': category_counts
    }
