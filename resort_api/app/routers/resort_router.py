"""
Resort routes - listing, detail, and share card endpoints.
"""
import io
import time
from collections import defaultdict
from typing import Optional
from datetime import date

from fastapi import APIRouter, Query, Depends, Header, HTTPException
from fastapi.responses import StreamingResponse

from ..models import Resort, ResortList
from ..services import ResortService
from ..db import get_resorts_db
from ..card_generator import generate_resort_card
from ..exceptions import ResortNotFoundError
from ..auth_utils import get_optional_user_id
from ..config import get_settings
from ..bot_protection import verify_captcha

settings = get_settings()
_REQUEST_HISTORY = defaultdict(list)
try:
    import redis
    _redis_client = redis.Redis.from_url(settings.redis_url, decode_responses=True) if settings.redis_url else None
except Exception:
    _redis_client = None


def _rate_limit(key: str) -> None:
    now = time.time()
    window_start = now - settings.rate_limit_window
    if _redis_client:
        try:
            key_name = f"resort:rl:{key}"
            pipeline = _redis_client.pipeline()
            pipeline.zremrangebyscore(key_name, 0, int((now - settings.rate_limit_window) * 1000))
            pipeline.zcard(key_name)
            pipeline.zadd(key_name, {str(int(now * 1000)): int(now * 1000)})
            pipeline.expire(key_name, settings.rate_limit_window)
            _, count, _, _ = pipeline.execute()
            if count >= settings.rate_limit_max_requests:
                raise HTTPException(status_code=429, detail="Rate limit exceeded")
            return
        except Exception:
            pass

    recent = _REQUEST_HISTORY[key]
    while recent and recent[0] < window_start:
        recent.pop(0)
    if len(recent) >= settings.rate_limit_max_requests:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    recent.append(now)

router = APIRouter(prefix="/resorts", tags=["resorts"])


def get_resort_service() -> ResortService:
    """Dependency to get resort service."""
    return ResortService(get_resorts_db())


@router.get("", response_model=ResortList)
def list_resorts(
    region: Optional[str] = Query(None, description="Filter by region"),
    country_code: Optional[str] = Query(None, pattern="^[A-Z]{2}$"),
    q: Optional[str] = Query(None, description="Full-text search"),
    amenities: Optional[str] = Query(None, description="Comma-separated amenities"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: ResortService = Depends(get_resort_service)
) -> ResortList:
    """List and search resorts with pagination."""
    return service.list_resorts(region, country_code, q, amenities, limit, offset)


@router.get("/{resort_id}", response_model=Resort)
def get_resort(
    resort_id: str,
    service: ResortService = Depends(get_resort_service)
) -> Resort:
    """Get detailed information for a single resort."""
    resort = service.get_by_id(resort_id)
    if not resort:
        raise ResortNotFoundError(resort_id)
    return resort


@router.get(
    "/{resort_id}/share-card",
    response_class=StreamingResponse,
    responses={200: {"content": {"image/png": {}}}, 404: {"description": "Resort not found"}}
)
async def get_share_card(
    resort_id: str,
    user_name: Optional[str] = Query(None),
    activity_date: Optional[date] = Query(None),
    service: ResortService = Depends(get_resort_service),
    authenticated_user_id: Optional[str] = Depends(get_optional_user_id),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    captcha_token: Optional[str] = Header(None, alias="X-Captcha-Token")
):
    """Generate a shareable image card for a resort."""
    if settings.require_api_key:
        if not settings.api_key:
            raise HTTPException(status_code=401, detail="API key not configured")
        if not x_api_key or x_api_key != settings.api_key:
            raise HTTPException(status_code=401, detail="Invalid or missing API key")

    caller = authenticated_user_id or "anon"
    _rate_limit(f"user:{caller}")
    await verify_captcha(captcha_token)

    resort = service.get_by_id(resort_id)
    if not resort:
        raise ResortNotFoundError(resort_id)
    
    image_bytes = generate_resort_card(resort, user_name, activity_date)
    return StreamingResponse(io.BytesIO(image_bytes), media_type="image/png")
