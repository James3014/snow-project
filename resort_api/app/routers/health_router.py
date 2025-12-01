"""
Health check routes.
"""
from fastapi import APIRouter, Depends

from ..services import ResortService
from ..db import get_resorts_db

router = APIRouter(tags=["health"])


def get_resort_service() -> ResortService:
    return ResortService(get_resorts_db())


@router.get("/health", summary="Health Check")
def health_check(service: ResortService = Depends(get_resort_service)):
    """Simple health check endpoint."""
    return {"status": "ok", "resort_count": service.count()}
