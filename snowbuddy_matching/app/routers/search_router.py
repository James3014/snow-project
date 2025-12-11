"""
Search routes - matching search endpoints.
"""
import uuid
import time
import os
from collections import defaultdict
from fastapi import APIRouter, BackgroundTasks, Depends, status, HTTPException, Header

from ..models.matching import MatchingPreference
from ..services import (
    MatchingWorkflowOrchestrator,
    get_matching_workflow_orchestrator,
    MatchingService,
    get_matching_service,
)
from ..exceptions import SearchNotFoundError
from ..auth_utils import get_current_user_id
from ..bot_protection import verify_captcha
from ..config import get_settings

router = APIRouter(prefix="/matching", tags=["matching"])
_REQUEST_HISTORY = defaultdict(list)
RATE_LIMIT_WINDOW = 60
RATE_LIMIT_MAX_REQUESTS = 15
settings = get_settings()
try:
    import redis
    _redis_client = redis.Redis.from_url(settings.redis_url, decode_responses=True) if settings.redis_url else None
except Exception:
    _redis_client = None


def _rate_limit(user_id: str) -> None:
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW
    if _redis_client:
        try:
            key_name = f"matching:rl:{user_id}"
            pipeline = _redis_client.pipeline()
            pipeline.zremrangebyscore(key_name, 0, int((now - RATE_LIMIT_WINDOW) * 1000))
            pipeline.zcard(key_name)
            pipeline.zadd(key_name, {str(int(now * 1000)): int(now * 1000)})
            pipeline.expire(key_name, RATE_LIMIT_WINDOW)
            _, count, _, _ = pipeline.execute()
            if count >= RATE_LIMIT_MAX_REQUESTS:
                raise HTTPException(status_code=429, detail="Rate limit exceeded")
            return
        except Exception:
            pass

    recent = _REQUEST_HISTORY[user_id]
    while recent and recent[0] < window_start:
        recent.pop(0)
    if len(recent) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    recent.append(now)


@router.post("/searches", status_code=status.HTTP_202_ACCEPTED)
async def start_search(
    seeker_prefs: MatchingPreference,
    background_tasks: BackgroundTasks,
    seeker_id: str = Depends(get_current_user_id),
    orchestrator: MatchingWorkflowOrchestrator = Depends(get_matching_workflow_orchestrator),
    x_api_key: str | None = Header(None, alias="X-API-Key"),
    captcha_token: str | None = Header(None, alias="X-Captcha-Token"),
):
    """Initiate a new snowbuddy search. Runs matching in background."""
    expected = os.getenv("SNOWBUDDY_API_KEY", "")
    require_key = os.getenv("SNOWBUDDY_REQUIRE_API_KEY", "true").lower() == "true"
    if require_key:
        if not expected:
            raise HTTPException(status_code=401, detail="API key not configured")
        if not x_api_key or x_api_key != expected:
            raise HTTPException(status_code=401, detail="Invalid API key")
    elif expected and x_api_key and x_api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid API key")

    _rate_limit(seeker_id)
    await verify_captcha(captcha_token)
    search_id = str(uuid.uuid4())
    await orchestrator.start_matching(
        search_id=search_id,
        seeker_id=seeker_id,
        seeker_preferences=seeker_prefs,
        background_tasks=background_tasks,
    )
    return {"search_id": search_id}


@router.get("/searches/{search_id}")
async def get_search_results(
    search_id: str,
    authenticated_user_id: str = Depends(get_current_user_id),
    service: MatchingService = Depends(get_matching_service)
):
    """Retrieve status and results of a snowbuddy search."""
    result = await service.get_results(search_id)
    if not result:
        raise SearchNotFoundError(search_id)
    return result
