"""
Share Card API endpoints.

Generate beautiful share card images for social media.
"""
import time
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, Response, Request, Header
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, UUID4
from datetime import date
import uuid
import io

from services import db
from services.imagen_service import get_imagen_service
from models.course_tracking import CourseVisit
from models.user_profile import UserProfile
from services.auth_dependencies import get_current_user
from config.settings import settings
from services.bot_protection import verify_captcha

try:
    import redis
    _redis_client = redis.Redis.from_url(settings.redis_url, decode_responses=True)
    _redis_available = True
except Exception:
    _redis_client = None
    _redis_available = False

# Simple in-memory rate limiter to prevent abuse of costly image generation endpoints
_REQUEST_HISTORY = defaultdict(list)
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 10


def _check_rate_limit(key: str) -> None:
    """Enforce a sliding-window rate limit by key (user or IP)."""
    if _redis_available:
        now_ms = int(time.time() * 1000)
        window_ms = RATE_LIMIT_WINDOW_SECONDS * 1000
        key_name = f"sharecard:rl:{key}"
        try:
            pipeline = _redis_client.pipeline()
            pipeline.zremrangebyscore(key_name, 0, now_ms - window_ms)
            pipeline.zcard(key_name)
            pipeline.zadd(key_name, {str(now_ms): now_ms})
            pipeline.expire(key_name, RATE_LIMIT_WINDOW_SECONDS)
            _, count, _, _ = pipeline.execute()
            if count >= RATE_LIMIT_MAX_REQUESTS:
                raise HTTPException(
                    status_code=429,
                    detail="Rate limit exceeded for share card generation"
                )
            return
        except Exception:
            # Fallback to in-memory on Redis errors
            pass

    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW_SECONDS
    recent = _REQUEST_HISTORY[key]
    while recent and recent[0] < window_start:
        recent.pop(0)
    if len(recent) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded for share card generation"
        )
    recent.append(now)


def _guard_request(request: Request, user: Optional[UserProfile], api_key: Optional[str]) -> None:
    """Apply auth-aware rate limit keyed by user ID, fallback to client IP, and enforce API key if configured."""
    if settings.user_core_api_key:
        if not api_key or api_key != settings.user_core_api_key:
            raise HTTPException(
                status_code=401,
                detail="Invalid or missing API key"
            )

    key = f"user:{user.user_id}" if user else f"ip:{request.client.host if request.client else 'unknown'}"
    _check_rate_limit(key)

router = APIRouter()


# ==================== Request Schemas ====================

class CourseCompletionCardRequest(BaseModel):
    """Request to generate course completion share card."""
    visit_id: UUID4
    include_stats: bool = True


class AchievementCardRequest(BaseModel):
    """Request to generate achievement unlock share card."""
    achievement_id: UUID4


class ProgressMilestoneCardRequest(BaseModel):
    """Request to generate progress milestone share card."""
    user_id: UUID4
    resort_id: str


# ==================== API Endpoints ====================

@router.post(
    "/share-cards/course-completion",
    summary="Generate course completion share card",
    responses={
        200: {
            "content": {"image/png": {}},
            "description": "PNG image of share card"
        }
    }
)
async def generate_course_completion_card(
    request: CourseCompletionCardRequest,
    http_request: Request,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    captcha_token: Optional[str] = Header(None, alias="X-Captcha-Token"),
    current_user: UserProfile = Depends(get_current_user),
    db_session: Session = Depends(db.get_db)
):
    """
    Generate a beautiful share card image for completing a course.

    Returns PNG image that can be shared on social media.
    """
    _guard_request(http_request, current_user, x_api_key)
    await verify_captcha(captcha_token, client_ip=http_request.client.host if http_request.client else None)
    # Get visit details
    visit = db_session.query(CourseVisit).filter(
        CourseVisit.id == request.visit_id
    ).first()

    if not visit:
        raise HTTPException(status_code=404, detail="Course visit not found")

    # Get resort name (you'll need to fetch from resort API or cache)
    # For now, use resort_id as name
    resort_name_zh = visit.resort_id.replace('_', ' ').title()
    resort_name_en = visit.resort_id.replace('_', ' ').title()

    # Get user stats if requested
    user_stats = None
    if request.include_stats:
        total_courses = db_session.query(CourseVisit).filter(
            CourseVisit.user_id == visit.user_id
        ).count()

        total_resorts = db_session.query(CourseVisit.resort_id).filter(
            CourseVisit.user_id == visit.user_id
        ).distinct().count()

        user_stats = {
            "total_courses": total_courses,
            "total_resorts": total_resorts
        }

    # Generate image
    imagen = get_imagen_service()
    try:
        image_bytes = await imagen.generate_course_completion_card(
            resort_name_zh=resort_name_zh,
            resort_name_en=resort_name_en,
            course_name=visit.course_name,
            difficulty="intermediate",  # TODO: Get from course data
            date_completed=visit.visited_date.strftime("%Y年%m月%d日"),
            user_stats=user_stats
        )

        return Response(
            content=image_bytes,
            media_type="image/png",
            headers={
                "Content-Disposition": f"inline; filename=course_completion_{visit.id}.png"
            }
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate image"
        )


@router.post(
    "/share-cards/achievement",
    summary="Generate achievement unlock share card",
    responses={
        200: {
            "content": {"image/png": {}},
            "description": "PNG image of share card"
        }
    }
)
async def generate_achievement_card(
    request: AchievementCardRequest,
    http_request: Request,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    captcha_token: Optional[str] = Header(None, alias="X-Captcha-Token"),
    current_user: UserProfile = Depends(get_current_user),
    db_session: Session = Depends(db.get_db)
):
    """
    Generate a beautiful share card image for unlocking an achievement.

    Returns PNG image that can be shared on social media.
    """
    from models.course_tracking import UserAchievement, AchievementDefinition

    _guard_request(http_request, current_user, x_api_key)
    await verify_captcha(captcha_token, client_ip=http_request.client.host if http_request.client else None)

    # Get achievement details
    achievement = db_session.query(
        UserAchievement, AchievementDefinition
    ).join(
        AchievementDefinition,
        UserAchievement.achievement_type == AchievementDefinition.achievement_type
    ).filter(
        UserAchievement.id == request.achievement_id
    ).first()

    if not achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")

    user_ach, ach_def = achievement

    # Generate image
    imagen = get_imagen_service()
    try:
        image_bytes = await imagen.generate_achievement_card(
            achievement_name_zh=ach_def.name_zh,
            achievement_name_en=ach_def.name_en,
            achievement_icon=ach_def.icon,
            points=ach_def.points,
            description=ach_def.description_zh
        )

        return Response(
            content=image_bytes,
            media_type="image/png",
            headers={
                "Content-Disposition": f"inline; filename=achievement_{user_ach.id}.png"
            }
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate image"
        )


@router.post(
    "/share-cards/progress-milestone",
    summary="Generate progress milestone share card",
    responses={
        200: {
            "content": {"image/png": {}},
            "description": "PNG image of share card"
        }
    }
)
async def generate_progress_milestone_card(
    request: ProgressMilestoneCardRequest,
    http_request: Request,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    captcha_token: Optional[str] = Header(None, alias="X-Captcha-Token"),
    current_user: UserProfile = Depends(get_current_user),
    db_session: Session = Depends(db.get_db)
):
    """
    Generate a beautiful share card image for reaching a progress milestone.

    Returns PNG image that can be shared on social media.
    """
    _guard_request(http_request, current_user, x_api_key)
    await verify_captcha(captcha_token, client_ip=http_request.client.host if http_request.client else None)

    # Calculate progress
    completed_courses = db_session.query(CourseVisit).filter(
        CourseVisit.user_id == request.user_id,
        CourseVisit.resort_id == request.resort_id
    ).count()

    # TODO: Get total courses from resort API
    total_courses = 50  # Placeholder

    if completed_courses == 0:
        raise HTTPException(status_code=404, detail="No progress found for this resort")

    completion_percentage = int((completed_courses / total_courses) * 100)

    # Determine milestone type
    if completion_percentage >= 100:
        milestone_type = "100%"
    elif completion_percentage >= 75:
        milestone_type = "75%"
    elif completion_percentage >= 50:
        milestone_type = "50%"
    else:
        milestone_type = "25%"

    # Get resort name
    resort_name_zh = request.resort_id.replace('_', ' ').title()
    resort_name_en = request.resort_id.replace('_', ' ').title()

    # Generate image
    imagen = get_imagen_service()
    try:
        image_bytes = await imagen.generate_progress_milestone_card(
            resort_name_zh=resort_name_zh,
            resort_name_en=resort_name_en,
            completion_percentage=completion_percentage,
            completed_courses=completed_courses,
            total_courses=total_courses,
            milestone_type=milestone_type
        )

        return Response(
            content=image_bytes,
            media_type="image/png",
            headers={
                "Content-Disposition": f"inline; filename=progress_{request.resort_id}.png"
            }
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate image"
        )
