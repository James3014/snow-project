"""
Course tracking API endpoints.

Provides REST APIs for:
- Recording course visits
- Managing recommendations
- Viewing achievement progress
- Accessing leaderboards
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from services import course_tracking_service, db
from schemas import course_tracking as ct_schemas

router = APIRouter()


# ==================== Course Visit Endpoints ====================

@router.post(
    "/{user_id}/course-visits",
    response_model=ct_schemas.CourseVisit,
    summary="Record a course visit",
    status_code=201
)
def create_course_visit(
    user_id: uuid.UUID,
    visit: ct_schemas.CourseVisitCreate,
    db_session: Session = Depends(db.get_db)
):
    """
    Record that a user has visited/completed a specific course.

    - **user_id**: User's UUID
    - **resort_id**: Resort identifier
    - **course_name**: Name of the course
    - **visited_date**: Date of visit (defaults to today if not provided)
    - **notes**: Optional notes about the visit
    """
    try:
        return course_tracking_service.record_course_visit(
            db=db_session,
            user_id=user_id,
            visit=visit
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except course_tracking_service.DuplicateCourseVisitError as e:
        raise HTTPException(status_code=409, detail=str(e)) from e


@router.get(
    "/{user_id}/course-visits",
    response_model=List[ct_schemas.CourseVisit],
    summary="Get user's course visits"
)
def get_course_visits(
    user_id: uuid.UUID,
    resort_id: Optional[str] = Query(None, description="Filter by resort"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db_session: Session = Depends(db.get_db)
):
    """
    Get all course visits for a user.

    Can be filtered by resort_id to see visits at a specific resort.
    """
    return course_tracking_service.get_user_course_visits(
        db=db_session,
        user_id=user_id,
        resort_id=resort_id,
        skip=skip,
        limit=limit
    )


@router.delete(
    "/{user_id}/course-visits/{visit_id}",
    status_code=204,
    summary="Delete a course visit"
)
def delete_course_visit(
    user_id: uuid.UUID,
    visit_id: uuid.UUID,
    db_session: Session = Depends(db.get_db)
):
    """
    Delete a course visit record.

    Only the owning user can delete their own visits.
    """
    success = course_tracking_service.delete_course_visit(
        db=db_session,
        visit_id=visit_id,
        user_id=user_id
    )

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Course visit not found or not owned by this user"
        )


# ==================== Progress Endpoints ====================

@router.get(
    "/{user_id}/resorts/{resort_id}/progress",
    response_model=ct_schemas.ResortProgress,
    summary="Get user's progress at a resort"
)
def get_resort_progress(
    user_id: uuid.UUID,
    resort_id: str,
    total_courses: int = Query(..., description="Total number of courses at this resort"),
    db_session: Session = Depends(db.get_db)
):
    """
    Get user's completion progress at a specific resort.

    Returns:
    - List of completed courses
    - Total course count
    - Completion percentage
    - User's recommendations for this resort
    """
    return course_tracking_service.calculate_resort_progress(
        db=db_session,
        user_id=user_id,
        resort_id=resort_id,
        total_courses=total_courses
    )


# ==================== Recommendation Endpoints ====================

@router.post(
    "/{user_id}/recommendations",
    response_model=ct_schemas.CourseRecommendation,
    summary="Create a course recommendation",
    status_code=201
)
def create_recommendation(
    user_id: uuid.UUID,
    recommendation: ct_schemas.CourseRecommendationCreate,
    db_session: Session = Depends(db.get_db)
):
    """
    Create a new course recommendation.

    Users can recommend up to 3 courses per resort, ranked 1-3.
    Each course can only be recommended once per resort.

    - **rank**: 1 (highest), 2, or 3
    - **reason**: Why you recommend this course (max 500 chars)
    - **status**: Automatically set to 'pending_review'
    """
    try:
        return course_tracking_service.create_recommendation(
            db=db_session,
            user_id=user_id,
            recommendation=recommendation
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except course_tracking_service.RecommendationLimitError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get(
    "/{user_id}/recommendations",
    response_model=List[ct_schemas.CourseRecommendation],
    summary="Get user's recommendations"
)
def get_recommendations(
    user_id: uuid.UUID,
    resort_id: Optional[str] = Query(None, description="Filter by resort"),
    db_session: Session = Depends(db.get_db)
):
    """
    Get all course recommendations made by a user.

    Can be filtered by resort_id.
    """
    return course_tracking_service.get_user_recommendations(
        db=db_session,
        user_id=user_id,
        resort_id=resort_id
    )


@router.patch(
    "/{user_id}/recommendations/{recommendation_id}",
    response_model=ct_schemas.CourseRecommendation,
    summary="Update a recommendation"
)
def update_recommendation(
    user_id: uuid.UUID,
    recommendation_id: uuid.UUID,
    update: ct_schemas.CourseRecommendationUpdate,
    db_session: Session = Depends(db.get_db)
):
    """
    Update an existing recommendation.

    Only the owning user can update their recommendations.
    """
    rec = course_tracking_service.update_recommendation(
        db=db_session,
        recommendation_id=recommendation_id,
        user_id=user_id,
        update=update
    )

    if not rec:
        raise HTTPException(
            status_code=404,
            detail="Recommendation not found or not owned by this user"
        )

    return rec


@router.delete(
    "/{user_id}/recommendations/{recommendation_id}",
    status_code=204,
    summary="Delete a recommendation"
)
def delete_recommendation(
    user_id: uuid.UUID,
    recommendation_id: uuid.UUID,
    db_session: Session = Depends(db.get_db)
):
    """
    Delete a course recommendation.

    Only the owning user can delete their recommendations.
    """
    success = course_tracking_service.delete_recommendation(
        db=db_session,
        recommendation_id=recommendation_id,
        user_id=user_id
    )

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Recommendation not found or not owned by this user"
        )


@router.patch(
    "/recommendations/{recommendation_id}/moderate",
    response_model=ct_schemas.CourseRecommendation,
    summary="Moderate a recommendation (admin only)"
)
def moderate_recommendation(
    recommendation_id: uuid.UUID,
    status: str = Query(..., regex="^(approved|rejected)$"),
    reviewer_id: uuid.UUID = Query(..., description="Reviewer's user ID"),
    db_session: Session = Depends(db.get_db)
):
    """
    Moderate a recommendation - approve or reject.

    This is an admin/moderator endpoint.

    - **status**: Either 'approved' or 'rejected'
    - **reviewer_id**: UUID of the moderator
    """
    rec = course_tracking_service.moderate_recommendation(
        db=db_session,
        recommendation_id=recommendation_id,
        reviewer_id=reviewer_id,
        new_status=status
    )

    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    return rec


# ==================== Course Rankings Endpoints ====================

@router.get(
    "/resorts/{resort_id}/courses/rankings",
    response_model=List[ct_schemas.CourseRanking],
    summary="Get course popularity rankings for a resort"
)
def get_course_rankings(
    resort_id: str,
    limit: int = Query(50, ge=1, le=200),
    db_session: Session = Depends(db.get_db)
):
    """
    Get popularity rankings for courses at a specific resort.

    Rankings are based on:
    - Number of user visits
    - Number of approved recommendations (weighted 3x)

    Returns courses sorted by popularity score.
    """
    return course_tracking_service.get_course_rankings(
        db=db_session,
        resort_id=resort_id,
        limit=limit
    )


# ==================== Achievement Endpoints ====================

@router.get(
    "/{user_id}/achievements",
    response_model=List[ct_schemas.UserAchievementWithDetails],
    summary="Get user's earned achievements"
)
def get_user_achievements(
    user_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db_session: Session = Depends(db.get_db)
):
    """
    Get all achievements earned by a user.

    Returns achievements sorted by earned date (most recent first).
    """
    achievements = course_tracking_service.get_user_achievements(
        db=db_session,
        user_id=user_id,
        skip=skip,
        limit=limit
    )

    # Enrich with definition details
    result = []
    for ach in achievements:
        defn = db_session.query(course_tracking_service.AchievementDefinition).filter(
            course_tracking_service.AchievementDefinition.achievement_type == ach.achievement_type
        ).first()

        result.append(ct_schemas.UserAchievementWithDetails(
            id=ach.id,
            user_id=ach.user_id,
            achievement_type=ach.achievement_type,
            achievement_data=ach.achievement_data,
            points=ach.points,
            earned_at=ach.earned_at,
            name_zh=defn.name_zh if defn else "",
            name_en=defn.name_en if defn else "",
            icon=defn.icon if defn else "🎿",
            category=defn.category if defn else "basic"
        ))

    return result


@router.get(
    "/{user_id}/achievements/summary",
    response_model=ct_schemas.AchievementSummary,
    summary="Get user's achievement summary"
)
def get_achievement_summary(
    user_id: uuid.UUID,
    db_session: Session = Depends(db.get_db)
):
    """
    Get summary statistics for a user's achievements.

    Returns:
    - Total points
    - Achievement count
    - Completion percentage
    - Category breakdown
    """
    summary_data = course_tracking_service.get_user_achievement_summary(
        db=db_session,
        user_id=user_id
    )

    return ct_schemas.AchievementSummary(**summary_data)


@router.get(
    "/achievements/definitions",
    response_model=List[ct_schemas.AchievementDefinition],
    summary="Get all achievement definitions"
)
def get_achievement_definitions(
    include_hidden: bool = Query(False, description="Include hidden achievements"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db_session: Session = Depends(db.get_db)
):
    """
    Get all available achievement definitions.

    By default, hidden achievements are not included.
    Can be filtered by category: basic, advanced, expert, special.
    """
    return course_tracking_service.get_achievement_definitions(
        db=db_session,
        include_hidden=include_hidden,
        category=category
    )


# ==================== Leaderboard Endpoints ====================

@router.get(
    "/achievements/leaderboard",
    response_model=List[ct_schemas.LeaderboardEntry],
    summary="Get global achievement leaderboard"
)
def get_leaderboard(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db_session: Session = Depends(db.get_db)
):
    """
    Get the global achievement leaderboard.

    Users are ranked by total achievement points.
    Displays semi-anonymous usernames for privacy.
    """
    return course_tracking_service.get_leaderboard(
        db=db_session,
        skip=skip,
        limit=limit
    )


@router.get(
    "/{user_id}/leaderboard-rank",
    response_model=ct_schemas.UserRank,
    summary="Get user's leaderboard rank"
)
def get_user_rank(
    user_id: uuid.UUID,
    db_session: Session = Depends(db.get_db)
):
    """
    Get a specific user's rank on the leaderboard.

    Returns null rank if user has no achievements yet.
    """
    rank = course_tracking_service.get_user_leaderboard_rank(
        db=db_session,
        user_id=user_id
    )

    return ct_schemas.UserRank(
        user_id=user_id,
        rank=rank
    )
