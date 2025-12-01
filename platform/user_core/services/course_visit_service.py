"""Course visit service - handles course visit operations."""
from datetime import date
from typing import List, Optional
import uuid

from sqlalchemy import desc
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from models.course_tracking import CourseVisit
from schemas.course_tracking import CourseVisitCreate
from utils.user_utils import get_or_create_user
from exceptions.domain import DuplicateCourseVisitError


def record_visit(db: Session, user_id: uuid.UUID, visit: CourseVisitCreate) -> CourseVisit:
    """Record a new course visit for a user."""
    get_or_create_user(db, user_id)
    
    db_visit = CourseVisit(
        user_id=user_id,
        resort_id=visit.resort_id,
        course_name=visit.course_name,
        visited_date=visit.visited_date or date.today(),
        notes=visit.notes,
        snow_condition=visit.snow_condition,
        weather=visit.weather,
        difficulty_feeling=visit.difficulty_feeling,
        rating=visit.rating,
        mood_tags=visit.mood_tags
    )

    try:
        db.add(db_visit)
        db.commit()
        db.refresh(db_visit)
        return db_visit
    except IntegrityError as e:
        db.rollback()
        if 'uq_user_resort_course_date' in str(e):
            raise DuplicateCourseVisitError(
                str(user_id), visit.course_name, str(visit.visited_date)
            )
        raise


def get_user_visits(
    db: Session,
    user_id: uuid.UUID,
    resort_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[CourseVisit]:
    """Get all course visits for a user."""
    query = db.query(CourseVisit).filter(CourseVisit.user_id == user_id)
    if resort_id:
        query = query.filter(CourseVisit.resort_id == resort_id)
    return query.order_by(desc(CourseVisit.visited_date)).offset(skip).limit(limit).all()


def delete_visit(db: Session, visit_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    """Delete a course visit."""
    visit = db.query(CourseVisit).filter(
        CourseVisit.id == visit_id,
        CourseVisit.user_id == user_id
    ).first()
    if not visit:
        return False
    db.delete(visit)
    db.commit()
    return True


def update_visit(db: Session, visit_id: uuid.UUID, user_id: uuid.UUID, update) -> Optional[CourseVisit]:
    """Update an existing course visit."""
    visit = db.query(CourseVisit).filter(
        CourseVisit.id == visit_id,
        CourseVisit.user_id == user_id
    ).first()
    if not visit:
        return None
    
    update_data = update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(visit, field, value)
    
    db.commit()
    db.refresh(visit)
    return visit
