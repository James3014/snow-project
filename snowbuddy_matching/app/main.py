"""
Snowbuddy Matching Service - Application Entry Point
"""
import logging
import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from .exceptions import register_exception_handlers
from .routers import search_router, requests_router, health_router, trip_requests_router

try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
except ImportError:
    sentry_sdk = None  # Optional dependency

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """添加安全標頭的中間件"""
    
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        
        # HSTS Header - Force HTTPS
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        
        # Content Security Policy - Prevent XSS
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; connect-src 'self' https://ski-platform.zeabur.app https://tour.zeabur.app; frame-ancestors 'none';"
        
        # Other security headers
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "no-referrer-when-downgrade"
        
        return response

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

# Security Headers
app.add_middleware(SecurityHeadersMiddleware)

# Exception handlers
register_exception_handlers(app)

# Routers
app.include_router(search_router)
app.include_router(requests_router)
app.include_router(trip_requests_router)
app.include_router(health_router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Return sanitized error responses and log details."""
    logger.exception("Unhandled error", extra={"path": request.url.path})
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )
