"""
Snowbuddy Matching Service - Application Entry Point
"""
import logging
import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from .exceptions import register_exception_handlers
from .routers import search_router, requests_router, health_router

try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
except ImportError:
    sentry_sdk = None  # Optional dependency

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("snowbuddy_matching")

if sentry_sdk and os.getenv("SENTRY_DSN"):
    sentry_sdk.init(
        dsn=os.getenv("SENTRY_DSN"),
        integrations=[FastApiIntegration()],
        traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.05")),
    )

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


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Return sanitized error responses and log details."""
    logger.exception("Unhandled error", extra={"path": request.url.path})
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )
