"""
Ski map API endpoints.

Visualizes user's ski resort conquests on a map.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from services import db, ski_map_service
from services.auth_service import get_current_user_id
from schemas.ski_map import SkiMapData

router = APIRouter()


@router.get(
    "/users/{user_id}/ski-map",
    response_model=SkiMapData,
    summary="Get user's ski map data"
)
def get_ski_map(
    user_id: uuid.UUID,
    current_user_id: uuid.UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """
    Get ski map data showing which resorts a user has visited.

    Returns:
    - List of visited resorts
    - Region-wise completion statistics
    - Overall completion percentage

    This data can be used to render:
    - Interactive map with markers
    - SVG region map
    - Progress bars by region
    """
    map_data = ski_map_service.get_ski_map_data(
        db=db_session,
        user_id=user_id
    )

    return map_data


@router.get(
    "/users/{user_id}/ski-map/regions/{region}",
    summary="Get region detail"
)
def get_region_detail(
    user_id: uuid.UUID,
    region: str,
    current_user_id: uuid.UUID = Depends(get_current_user_id),
    db_session: Session = Depends(db.get_db)
):
    """
    Get detailed information for a specific region.

    - **user_id**: User ID
    - **region**: Region name (e.g., "北海道", "長野県")
    """
    try:
        region_detail = ski_map_service.get_region_detail(
            db=db_session,
            user_id=user_id,
            region=region
        )
        return region_detail
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
