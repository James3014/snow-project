"""
Snowbuddy Matching Service - Application Entry Point
"""
from fastapi import FastAPI

from .exceptions import register_exception_handlers
from .routers import search_router, requests_router, health_router

app = FastAPI(
    title="SnowTrace Snowbuddy Matching Service",
    version="0.1.0",
    description="Provides an intelligent matching engine to find snowbuddies."
)

# Exception handlers
register_exception_handlers(app)

# Routers
app.include_router(search_router)
app.include_router(requests_router)
app.include_router(health_router)
