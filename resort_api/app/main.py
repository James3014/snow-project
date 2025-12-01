"""
Resort Services API - Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .exceptions import register_exception_handlers
from .routers import resort_router, history_router, health_router

settings = get_settings()

app = FastAPI(
    title=settings.app_title,
    version=settings.app_version,
    description="Provides comprehensive information about ski resorts."
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
register_exception_handlers(app)

# Routers
app.include_router(resort_router)
app.include_router(history_router)
app.include_router(health_router)
