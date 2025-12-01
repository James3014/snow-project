"""
Health check routes.
"""
from typing import Dict
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health", summary="Health Check")
def health_check() -> Dict[str, str]:
    """Simple endpoint to verify service availability."""
    return {"status": "ok"}
