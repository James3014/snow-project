"""
Course tracking service - business logic for course visits, recommendations, and achievements.
"""
from datetime import datetime, UTC, date
from typing import List, Optional, Dict, Tuple
import uuid

from sqlalchemy import func, and_, or_, desc
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from models.course_tracking import (
    CourseVisit, CourseRecommendation, UserAchievement, AchievementDefinition
)
from models.user_profile import UserProfile
from models.enums import UserStatus
from schemas.course_tracking import (
    CourseVisitCreate, CourseRecommendationCreate, CourseRecommendationUpdate,
    ResortProgress, CourseRanking, LeaderboardEntry
)


class DuplicateCourseVisitError(Exception):
    """Raised when attempting to create a duplicate course visit."""
    pass


class RecommendationLimitError(Exception):
    """Raised when user tries to exceed the maximum number of recommendations."""
    pass


# ==================== Course Visit Operations ====================

def record_course_visit(
    db: Session,
    user_id: uuid.UUID,
    visit: CourseVisitCreate
) -> CourseVisit:
    """
    Record a new course visit for a user.

    Args:
        db: Database session
        user_id: User ID
        visit: Course visit data

    Returns:
        Created CourseVisit object

    Raises:
        DuplicateCourseVisitError: If the same course visit already exists
    """
    # Verify user exists, if not create a default user profile
    user = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not user:
        # Auto-create user profile if it doesn't exist
        user = UserProfile(
            user_id=user_id,
            status=UserStatus.active
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    db_visit = CourseVisit(
        user_id=user_id,
        resort_id=visit.resort_id,
        course_name=visit.course_name,
        visited_date=visit.visited_date or date.today(),
        notes=visit.notes
    )

    try:
        db.add(db_visit)
        db.commit()
        db.refresh(db_visit)

        # Check and award achievements after recording visit
        _check_and_award_achievements(db, user_id)

        return db_visit
    except IntegrityError as e:
        db.rollback()
        if 'uq_user_resort_course_date' in str(e):
            raise DuplicateCourseVisitError(
                f"Course visit already recorded: {visit.course_name} on {visit.visited_date}"
            ) from e
        raise


def get_user_course_visits(
    db: Session,
    user_id: uuid.UUID,
    resort_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[CourseVisit]:
    """Get all course visits for a user, optionally filtered by resort."""
    query = db.query(CourseVisit).filter(CourseVisit.user_id == user_id)

    if resort_id:
        query = query.filter(CourseVisit.resort_id == resort_id)

    return query.order_by(desc(CourseVisit.visited_date)).offset(skip).limit(limit).all()


def delete_course_visit(db: Session, visit_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    """Delete a course visit (only if it belongs to the user)."""
    visit = db.query(CourseVisit).filter(
        CourseVisit.id == visit_id,
        CourseVisit.user_id == user_id
    ).first()

    if not visit:
        return False

    db.delete(visit)
    db.commit()
    return True


# ==================== Progress Calculation ====================

def calculate_resort_progress(
    db: Session,
    user_id: uuid.UUID,
    resort_id: str,
    total_courses: int
) -> ResortProgress:
    """
    Calculate user's completion progress at a specific resort.

    Args:
        db: Database session
        user_id: User ID
        resort_id: Resort ID
        total_courses: Total number of courses at this resort

    Returns:
        ResortProgress object with completion stats
    """
    # Get distinct completed courses
    completed = db.query(CourseVisit.course_name).filter(
        CourseVisit.user_id == user_id,
        CourseVisit.resort_id == resort_id
    ).distinct().all()

    completed_courses = [row.course_name for row in completed]
    completed_count = len(completed_courses)

    # Calculate percentage
    percentage = (completed_count / total_courses * 100) if total_courses > 0 else 0.0

    # Get user's recommendations for this resort
    recommendations = get_user_recommendations(db, user_id, resort_id)

    return ResortProgress(
        resort_id=resort_id,
        completed_courses=completed_courses,
        total_courses=total_courses,
        completion_percentage=round(percentage, 2),
        recommendations=recommendations
    )


# ==================== Course Recommendations ====================

def create_recommendation(
    db: Session,
    user_id: uuid.UUID,
    recommendation: CourseRecommendationCreate
) -> CourseRecommendation:
    """
    Create a new course recommendation.

    Validates that:
    - User doesn't exceed 3 recommendations per resort
    - Rank is between 1-3
    - User owns the recommendation
    """
    # Check if user already has 3 recommendations for this resort
    existing_count = db.query(func.count(CourseRecommendation.id)).filter(
        CourseRecommendation.user_id == user_id,
        CourseRecommendation.resort_id == recommendation.resort_id
    ).scalar()

    if existing_count >= 3:
        raise RecommendationLimitError(
            f"Maximum 3 recommendations per resort. Current count: {existing_count}"
        )

    # Verify user exists
    user = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not user:
        raise ValueError(f"User {user_id} not found")

    db_rec = CourseRecommendation(
        user_id=user_id,
        resort_id=recommendation.resort_id,
        course_name=recommendation.course_name,
        rank=recommendation.rank,
        reason=recommendation.reason,
        status='pending_review'  # Default status
    )

    try:
        db.add(db_rec)
        db.commit()
        db.refresh(db_rec)
        return db_rec
    except IntegrityError as e:
        db.rollback()
        if 'uq_user_resort_rank' in str(e):
            raise ValueError(
                f"Rank {recommendation.rank} already used for resort {recommendation.resort_id}"
            ) from e
        elif 'uq_user_resort_course' in str(e):
            raise ValueError(
                f"Course {recommendation.course_name} already recommended for resort {recommendation.resort_id}"
            ) from e
        raise


def update_recommendation(
    db: Session,
    recommendation_id: uuid.UUID,
    user_id: uuid.UUID,
    update: CourseRecommendationUpdate
) -> Optional[CourseRecommendation]:
    """Update an existing recommendation (only if it belongs to the user)."""
    rec = db.query(CourseRecommendation).filter(
        CourseRecommendation.id == recommendation_id,
        CourseRecommendation.user_id == user_id
    ).first()

    if not rec:
        return None

    # Update fields
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
    except IntegrityError as e:
        db.rollback()
        raise ValueError("Update violates unique constraints") from e


def delete_recommendation(db: Session, recommendation_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    """Delete a recommendation (only if it belongs to the user)."""
    rec = db.query(CourseRecommendation).filter(
        CourseRecommendation.id == recommendation_id,
        CourseRecommendation.user_id == user_id
    ).first()

    if not rec:
        return False

    db.delete(rec)
    db.commit()
    return True


def get_user_recommendations(
    db: Session,
    user_id: uuid.UUID,
    resort_id: Optional[str] = None
) -> List[CourseRecommendation]:
    """Get all recommendations for a user, optionally filtered by resort."""
    query = db.query(CourseRecommendation).filter(
        CourseRecommendation.user_id == user_id
    )

    if resort_id:
        query = query.filter(CourseRecommendation.resort_id == resort_id)

    return query.order_by(CourseRecommendation.rank).all()


def moderate_recommendation(
    db: Session,
    recommendation_id: uuid.UUID,
    reviewer_id: uuid.UUID,
    new_status: str
) -> Optional[CourseRecommendation]:
    """
    Moderate a recommendation (admin/moderator function).

    Args:
        db: Database session
        recommendation_id: Recommendation ID
        reviewer_id: Reviewer's user ID
        new_status: New status ('approved' or 'rejected')
    """
    if new_status not in ['approved', 'rejected']:
        raise ValueError("Status must be 'approved' or 'rejected'")

    rec = db.query(CourseRecommendation).filter(
        CourseRecommendation.id == recommendation_id
    ).first()

    if not rec:
        return None

    rec.status = new_status
    rec.reviewed_by = reviewer_id
    rec.reviewed_at = datetime.now(UTC)

    db.commit()
    db.refresh(rec)
    return rec


# ==================== Course Rankings ====================

def get_course_rankings(
    db: Session,
    resort_id: str,
    limit: int = 50
) -> List[CourseRanking]:
    """
    Get popularity rankings for courses at a resort.

    Rankings are based on:
    1. Number of times visited (completion count)
    2. Number of recommendations (weighted higher)
    """
    # Get visit counts
    visit_counts = db.query(
        CourseVisit.course_name,
        func.count(func.distinct(CourseVisit.user_id)).label('visit_count')
    ).filter(
        CourseVisit.resort_id == resort_id
    ).group_by(
        CourseVisit.course_name
    ).subquery()

    # Get recommendation counts (only approved recommendations)
    rec_counts = db.query(
        CourseRecommendation.course_name,
        func.count(CourseRecommendation.id).label('recommendation_count')
    ).filter(
        CourseRecommendation.resort_id == resort_id,
        CourseRecommendation.status == 'approved'
    ).group_by(
        CourseRecommendation.course_name
    ).subquery()

    # Combine and calculate scores
    # Score = visit_count + (recommendation_count * 3)
    # Recommendations are weighted 3x more than visits
    results = db.query(
        visit_counts.c.course_name,
        func.coalesce(visit_counts.c.visit_count, 0).label('visit_count'),
        func.coalesce(rec_counts.c.recommendation_count, 0).label('recommendation_count')
    ).outerjoin(
        rec_counts,
        visit_counts.c.course_name == rec_counts.c.course_name
    ).all()

    # Calculate scores and create rankings
    rankings = []
    for row in results:
        score = row.visit_count + (row.recommendation_count * 3)
        rankings.append(CourseRanking(
            course_name=row.course_name,
            visit_count=row.visit_count,
            recommendation_count=row.recommendation_count,
            popularity_score=score
        ))

    # Sort by score descending
    rankings.sort(key=lambda x: x.popularity_score, reverse=True)

    # Add ranks
    for idx, ranking in enumerate(rankings[:limit], start=1):
        ranking.rank = idx

    return rankings[:limit]


# ==================== Achievement System ====================

def load_achievement_definitions(db: Session, yaml_path: str) -> int:
    """
    Load achievement definitions from YAML file into database.

    Returns:
        Number of definitions loaded/updated
    """
    import yaml

    with open(yaml_path, 'r', encoding='utf-8') as f:
        definitions = yaml.safe_load(f)

    count = 0
    for defn in definitions:
        # Check if already exists
        existing = db.query(AchievementDefinition).filter(
            AchievementDefinition.achievement_type == defn['achievement_type']
        ).first()

        if existing:
            # Update existing
            existing.name_zh = defn['name_zh']
            existing.name_en = defn['name_en']
            existing.description_zh = defn.get('description_zh')
            existing.description_en = defn.get('description_en')
            existing.icon = defn['icon']
            existing.category = defn['category']
            existing.points = defn['points']
            existing.requirements = defn['requirements']
            existing.is_hidden = defn.get('is_hidden', 0)
            existing.display_order = defn.get('display_order', 0)
        else:
            # Create new
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
                is_hidden=defn.get('is_hidden', 0),
                display_order=defn.get('display_order', 0)
            )
            db.add(new_defn)

        count += 1

    db.commit()
    return count


def _check_and_award_achievements(db: Session, user_id: uuid.UUID) -> List[UserAchievement]:
    """
    Check if user has earned any new achievements and award them.

    This is called after significant user actions (course visits, recommendations, etc.)

    Returns:
        List of newly awarded achievements
    """
    # Get all achievement definitions
    definitions = db.query(AchievementDefinition).all()

    # Get user's existing achievements
    existing = db.query(UserAchievement.achievement_type).filter(
        UserAchievement.user_id == user_id
    ).all()
    existing_types = {row.achievement_type for row in existing}

    newly_awarded = []

    for defn in definitions:
        # Skip if already earned
        if defn.achievement_type in existing_types:
            continue

        # Check if requirements are met
        if _check_achievement_requirements(db, user_id, defn):
            # Award achievement
            achievement = UserAchievement(
                user_id=user_id,
                achievement_type=defn.achievement_type,
                points=defn.points,
                achievement_data={}  # Can store additional context
            )
            db.add(achievement)
            newly_awarded.append(achievement)

    if newly_awarded:
        db.commit()
        for ach in newly_awarded:
            db.refresh(ach)

    return newly_awarded


def _check_achievement_requirements(
    db: Session,
    user_id: uuid.UUID,
    definition: AchievementDefinition
) -> bool:
    """
    Check if user meets the requirements for a specific achievement.

    Requirements format examples:
    - {"type": "first_course"} - Visit any course
    - {"type": "course_count", "count": 10} - Visit 10 distinct courses
    - {"type": "resort_completion", "percentage": 50} - Complete 50% of any resort
    - {"type": "recommendation_count", "count": 3} - Make 3 recommendations
    """
    req = definition.requirements
    req_type = req.get('type')

    if req_type == 'first_course':
        # Check if user has any course visit
        count = db.query(func.count(CourseVisit.id)).filter(
            CourseVisit.user_id == user_id
        ).scalar()
        return count >= 1

    elif req_type == 'course_count':
        # Check distinct courses visited
        count = db.query(func.count(func.distinct(CourseVisit.course_name))).filter(
            CourseVisit.user_id == user_id
        ).scalar()
        return count >= req.get('count', 0)

    elif req_type == 'resort_count':
        # Check distinct resorts visited
        count = db.query(func.count(func.distinct(CourseVisit.resort_id))).filter(
            CourseVisit.user_id == user_id
        ).scalar()
        return count >= req.get('count', 0)

    elif req_type == 'resort_completion':
        # Check if any resort is completed at given percentage
        # NOTE: This requires knowledge of total courses per resort
        # For now, we'll mark this as a manual check or future enhancement
        # TODO: Integrate with resort-services API to get total course counts
        return False

    elif req_type == 'recommendation_count':
        # Check recommendation count
        count = db.query(func.count(CourseRecommendation.id)).filter(
            CourseRecommendation.user_id == user_id
        ).scalar()
        return count >= req.get('count', 0)

    elif req_type == 'points':
        # Check total points (excluding this achievement)
        total_points = db.query(func.sum(UserAchievement.points)).filter(
            UserAchievement.user_id == user_id
        ).scalar() or 0
        return total_points >= req.get('points', 0)

    # Unknown requirement type
    return False


def get_user_achievements(
    db: Session,
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100
) -> List[UserAchievement]:
    """Get all achievements earned by a user."""
    return db.query(UserAchievement).filter(
        UserAchievement.user_id == user_id
    ).order_by(
        desc(UserAchievement.earned_at)
    ).offset(skip).limit(limit).all()


def get_achievement_definitions(
    db: Session,
    include_hidden: bool = False,
    category: Optional[str] = None
) -> List[AchievementDefinition]:
    """Get all achievement definitions."""
    query = db.query(AchievementDefinition)

    if not include_hidden:
        query = query.filter(AchievementDefinition.is_hidden == 0)

    if category:
        query = query.filter(AchievementDefinition.category == category)

    return query.order_by(
        AchievementDefinition.category,
        AchievementDefinition.display_order
    ).all()


def get_user_achievement_summary(db: Session, user_id: uuid.UUID) -> Dict:
    """
    Get summary of user's achievement progress.

    Returns:
        Dictionary with total points, achievement count, category breakdown, etc.
    """
    achievements = get_user_achievements(db, user_id, limit=1000)

    total_points = sum(ach.points for ach in achievements)
    achievement_count = len(achievements)

    # Category breakdown
    category_counts = {}
    for ach in achievements:
        # Get definition to find category
        defn = db.query(AchievementDefinition).filter(
            AchievementDefinition.achievement_type == ach.achievement_type
        ).first()

        if defn:
            category = defn.category
            category_counts[category] = category_counts.get(category, 0) + 1

    # Get total available achievements
    total_available = db.query(func.count(AchievementDefinition.achievement_type)).scalar()

    return {
        'total_points': total_points,
        'achievement_count': achievement_count,
        'total_available': total_available,
        'completion_percentage': round((achievement_count / total_available * 100) if total_available > 0 else 0, 2),
        'category_breakdown': category_counts
    }


# ==================== Leaderboard ====================

def get_leaderboard(
    db: Session,
    limit: int = 100,
    skip: int = 0
) -> List[LeaderboardEntry]:
    """
    Get global achievement leaderboard.

    Returns:
        List of LeaderboardEntry objects sorted by total points descending
    """
    # Aggregate user achievements
    user_stats = db.query(
        UserAchievement.user_id,
        func.sum(UserAchievement.points).label('total_points'),
        func.count(UserAchievement.id).label('achievement_count')
    ).group_by(
        UserAchievement.user_id
    ).subquery()

    # Join with user profiles to get display names
    results = db.query(
        user_stats.c.user_id,
        user_stats.c.total_points,
        user_stats.c.achievement_count,
        UserProfile.preferred_language
    ).join(
        UserProfile,
        UserProfile.user_id == user_stats.c.user_id
    ).order_by(
        desc(user_stats.c.total_points)
    ).offset(skip).limit(limit).all()

    # Get additional stats for each user
    leaderboard = []
    for idx, row in enumerate(results, start=skip + 1):
        # Count distinct resorts
        resorts_count = db.query(func.count(func.distinct(CourseVisit.resort_id))).filter(
            CourseVisit.user_id == row.user_id
        ).scalar() or 0

        # Count distinct courses
        courses_count = db.query(func.count(func.distinct(CourseVisit.course_name))).filter(
            CourseVisit.user_id == row.user_id
        ).scalar() or 0

        # Get semi-anonymous display name
        # TODO: Implement proper display name logic (e.g., "James C.")
        user_display_name = f"User {str(row.user_id)[:8]}"

        entry = LeaderboardEntry(
            rank=idx,
            user_id=row.user_id,
            user_display_name=user_display_name,
            total_points=row.total_points or 0,
            resorts_count=resorts_count,
            courses_count=courses_count
        )
        leaderboard.append(entry)

    return leaderboard


def get_user_leaderboard_rank(db: Session, user_id: uuid.UUID) -> Optional[int]:
    """Get a specific user's rank on the leaderboard."""
    # Get all user total points ordered
    all_users = db.query(
        UserAchievement.user_id,
        func.sum(UserAchievement.points).label('total_points')
    ).group_by(
        UserAchievement.user_id
    ).order_by(
        desc(func.sum(UserAchievement.points))
    ).all()

    for idx, row in enumerate(all_users, start=1):
        if row.user_id == user_id:
            return idx

    return None
