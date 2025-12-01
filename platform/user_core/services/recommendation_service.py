"""Recommendation service - handles course recommendations."""
from datetime import datetime, UTC
from typing import List, Optional
import uuid

from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from models.course_tracking import CourseRecommendation
from models.user_profile import UserProfile
from schemas.course_tracking import CourseRecommendationCreate, CourseRecommendationUpdate
from exceptions.domain import RecommendationLimitError, UserNotFoundError


MAX_RECOMMENDATIONS_PER_RESORT = 3


def create(db: Session, user_id: uuid.UUID, recommendation: CourseRecommendationCreate) -> CourseRecommendation:
    """Create a new course recommendation."""
    existing_count = db.query(func.count(CourseRecommendation.id)).filter(
        CourseRecommendation.user_id == user_id,
        CourseRecommendation.resort_id == recommendation.resort_id
    ).scalar()
    
    if existing_count >= MAX_RECOMMENDATIONS_PER_RESORT:
        raise RecommendationLimitError(MAX_RECOMMENDATIONS_PER_RESORT)
    
    user = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not user:
        raise UserNotFoundError(str(user_id))
    
    db_rec = CourseRecommendation(
        user_id=user_id,
        resort_id=recommendation.resort_id,
        course_name=recommendation.course_name,
        rank=recommendation.rank,
        reason=recommendation.reason,
        status='pending_review'
    )
    
    try:
        db.add(db_rec)
        db.commit()
        db.refresh(db_rec)
        return db_rec
    except IntegrityError as e:
        db.rollback()
        if 'uq_user_resort_rank' in str(e):
            raise ValueError(f"Rank {recommendation.rank} already used for resort {recommendation.resort_id}")
        elif 'uq_user_resort_course' in str(e):
            raise ValueError(f"Course {recommendation.course_name} already recommended")
        raise


def update(db: Session, recommendation_id: uuid.UUID, user_id: uuid.UUID, update: CourseRecommendationUpdate) -> Optional[CourseRecommendation]:
    """Update an existing recommendation."""
    rec = db.query(CourseRecommendation).filter(
        CourseRecommendation.id == recommendation_id,
        CourseRecommendation.user_id == user_id
    ).first()
    
    if not rec:
        return None
    
    if update.rank is not None:
        rec.rank = update.rank
    if update.reason is not None:
        rec.reason = update.reason
    if update.course_name is not None:
        rec.course_name = update.course_name
    
    rec.updated_at = datetime.now(UTC)
    
    try:
        db.commit()
        db.refresh(rec)
        return rec
    except IntegrityError:
        db.rollback()
        raise ValueError("Update violates unique constraints")


def delete(db: Session, recommendation_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    """Delete a recommendation."""
    rec = db.query(CourseRecommendation).filter(
        CourseRecommendation.id == recommendation_id,
        CourseRecommendation.user_id == user_id
    ).first()
    
    if not rec:
        return False
    
    db.delete(rec)
    db.commit()
    return True


def get_user_recommendations(db: Session, user_id: uuid.UUID, resort_id: Optional[str] = None) -> List[CourseRecommendation]:
    """Get all recommendations for a user."""
    query = db.query(CourseRecommendation).filter(CourseRecommendation.user_id == user_id)
    if resort_id:
        query = query.filter(CourseRecommendation.resort_id == resort_id)
    return query.order_by(CourseRecommendation.rank).all()


def moderate(db: Session, recommendation_id: uuid.UUID, reviewer_id: uuid.UUID, new_status: str) -> Optional[CourseRecommendation]:
    """Moderate a recommendation (admin function)."""
    if new_status not in ['approved', 'rejected']:
        raise ValueError("Status must be 'approved' or 'rejected'")
    
    rec = db.query(CourseRecommendation).filter(CourseRecommendation.id == recommendation_id).first()
    if not rec:
        return None
    
    rec.status = new_status
    rec.reviewed_by = reviewer_id
    rec.reviewed_at = datetime.now(UTC)
    
    db.commit()
    db.refresh(rec)
    return rec
