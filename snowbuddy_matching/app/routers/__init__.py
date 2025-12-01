"""API routers."""
from .search_router import router as search_router
from .requests_router import router as requests_router
from .health_router import router as health_router

__all__ = ['search_router', 'requests_router', 'health_router']
