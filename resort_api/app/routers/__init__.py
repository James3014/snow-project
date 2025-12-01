"""API routers."""
from .resort_router import router as resort_router
from .history_router import router as history_router
from .health_router import router as health_router

__all__ = ['resort_router', 'history_router', 'health_router']
