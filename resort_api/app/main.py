from fastapi import FastAPI, HTTPException, Query, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict
from datetime import date, datetime, time, UTC
import httpx
import os
import io
import inspect
from cachetools import TTLCache, cached
from cachetools.keys import hashkey

from .db import get_resorts_db
from .models import (
    Resort, ResortSummary, ResortList, SkiHistoryCreate,
    BehaviorEventCreate, BehaviorEventPayload
)
from .card_generator import generate_resort_card
from .auth_utils import get_current_user_id, get_optional_user_id

app = FastAPI(
    title="SkiDIY Resort Services API",
    version="0.1.0",
    description="Provides comprehensive information about ski resorts."
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local development
        "http://localhost:3000",  # Local production build
        "https://ski-platform.zeabur.app",  # Production frontend
        "https://*.zeabur.app",  # All Zeabur subdomains
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory cache for resort list results, holds 128 items for 5 minutes
resort_list_cache = TTLCache(maxsize=128, ttl=300)

# In a real application, this would come from a config file or environment variables
USER_CORE_API_URL = os.getenv("USER_CORE_API_URL", "http://user-core-api/events")

# Dependency to get the resort database
resorts_db_instance = get_resorts_db()

@cached(cache=resort_list_cache, key=lambda _, region, country_code, q, amenities, limit, offset: hashkey(region, country_code, q, amenities, limit, offset))
def _get_cached_resorts(
    resorts_db: Dict[str, Resort], # Pass DB to make function pure
    region: Optional[str],
    country_code: Optional[str],
    q: Optional[str],
    amenities: Optional[str], # Comma-separated string
    limit: int,
    offset: int
) -> ResortList:
    """This function contains the core logic and its results are cached."""
    results = list(resorts_db.values())

    if region:
        results = [r for r in results if r.region and region.lower() in r.region.lower()]

    if country_code:
        results = [r for r in results if r.country_code and r.country_code.upper() == country_code.upper()]

    if amenities:
        required_amenities = {a.strip().lower() for a in amenities.split(',') if a.strip()}
        results = [r for r in results if r.amenities and required_amenities.issubset(set(a.lower() for a in r.amenities))]

    if q:
        query_lower = q.lower()
        filtered_results = []
        for r in results:
            if (r.names.en and query_lower in r.names.en.lower()) or \
               (r.names.ja and query_lower in r.names.ja.lower()) or \
               (r.names.zh and query_lower in r.names.zh.lower()):
                filtered_results.append(r)
                continue
            if r.description and r.description.tagline and query_lower in r.description.tagline.lower():
                filtered_results.append(r)
                continue
        results = filtered_results
    
    total_count = len(results)
    paginated_results = results[offset : offset + limit]

    summaries = [
        ResortSummary(
            resort_id=r.resort_id,
            names=r.names,
            region=r.region,
            country_code=r.country_code,
            tagline=r.description.tagline if r.description else None
        ) for r in paginated_results
    ]

    return ResortList(
        total=total_count,
        limit=limit,
        offset=offset,
        items=summaries
    )


@app.get("/resorts", response_model=ResortList)
def list_resorts(
    region: Optional[str] = Query(None, description="Filter resorts by region (e.g., 'Niigata Prefecture')."),
    country_code: Optional[str] = Query(None, description="Filter by ISO 3166-1 alpha-2 country code.", pattern="^[A-Z]{2}$"),
    q: Optional[str] = Query(None, description="Full-text search on names and descriptions."),
    amenities: Optional[str] = Query(None, description="Filter by comma-separated amenities (e.g., 'night_ski,onsen')."),
    limit: int = Query(20, ge=1, le=100, description="Number of items to return."),
    offset: int = Query(0, ge=0, description="Offset for pagination.")
) -> ResortList:
    """Lists and searches for ski resorts with pagination and caching."""
    return _get_cached_resorts(resorts_db_instance, region, country_code, q, amenities, limit, offset)

@app.get("/resorts/{resort_id}", response_model=Resort)
def get_resort_by_id(resort_id: str) -> Resort:
    """Gets detailed information for a single ski resort."""
    resort = resorts_db_instance.get(resort_id)
    if not resort:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Resort with id '{resort_id}' not found.")
    return resort

@app.post("/users/{user_id}/ski-history", status_code=status.HTTP_202_ACCEPTED)
async def create_ski_history(
    user_id: str,
    history_item: SkiHistoryCreate,
    authenticated_user_id: str = Depends(get_current_user_id)
):
    """
    Receives a ski history record and forwards it to the user-core service as a behavior event.

    Requires authentication. Users can only create ski history for themselves.
    """
    # Verify user can only create history for themselves
    if user_id != authenticated_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create ski history for yourself"
        )

    if history_item.resort_id not in resorts_db_instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resort with id '{history_item.resort_id}' not found."
        )

    event_payload = BehaviorEventCreate(
        user_id=user_id,
        payload=BehaviorEventPayload(
            resort_id=history_item.resort_id,
            date=history_item.date
        ),
        occurred_at=datetime.combine(history_item.date, time.min, tzinfo=UTC),
    )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                USER_CORE_API_URL,
                json=event_payload.model_dump(mode="json")
            )
            maybe_awaitable = response.raise_for_status()
            if inspect.isawaitable(maybe_awaitable):
                await maybe_awaitable
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"User-core service returned error {e.response.status_code}: {e.response.text}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to communicate with user-core service: {e}"
        )

    return {"status": "accepted"}

@app.get("/resorts/{resort_id}/share-card",
         response_class=StreamingResponse,
         responses={
             200: {
                 "content": {"image/png": {}}
             },
             404: {
                 "description": "Resort not found"
             }
         })
async def get_share_card(
    resort_id: str,
    user_name: Optional[str] = Query(None),
    activity_date: Optional[date] = Query(None),
    authenticated_user_id: Optional[str] = Depends(get_optional_user_id)
):
    """
    Generates and returns a shareable image card for a resort.

    Authentication is optional. If authenticated, the user's ID is available for personalization.
    """
    resort = resorts_db_instance.get(resort_id)
    if not resort:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Resort with id '{resort_id}' not found.")

    image_bytes = generate_resort_card(resort, user_name, activity_date)

    return StreamingResponse(io.BytesIO(image_bytes), media_type="image/png")


@app.get("/health", summary="Health Check")
def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "resort_count": len(resorts_db_instance)}
