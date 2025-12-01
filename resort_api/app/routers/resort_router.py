"""
Resort routes - listing, detail, and share card endpoints.
"""
import io
from typing import Optional
from datetime import date

from fastapi import APIRouter, Query, Depends
from fastapi.responses import StreamingResponse

from ..models import Resort, ResortList
from ..services import ResortService
from ..db import get_resorts_db
from ..card_generator import generate_resort_card
from ..exceptions import ResortNotFoundError
from ..auth_utils import get_optional_user_id

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
    authenticated_user_id: Optional[str] = Depends(get_optional_user_id)
):
    """Generate a shareable image card for a resort."""
    resort = service.get_by_id(resort_id)
    if not resort:
        raise ResortNotFoundError(resort_id)
    
    image_bytes = generate_resort_card(resort, user_name, activity_date)
    return StreamingResponse(io.BytesIO(image_bytes), media_type="image/png")
