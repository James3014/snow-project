"""Logging middleware for FastAPI."""
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from .config import set_request_id, get_logger

logger = get_logger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log requests and set request ID."""
    
    async def dispatch(self, request: Request, call_next):
        # Set request ID from header or generate new one
        request_id = request.headers.get("X-Request-ID")
        set_request_id(request_id)
        
        start_time = time.time()
        
        # Log request
        logger.info(f"Request: {request.method} {request.url.path}")
        
        # Process request
        response = await call_next(request)
        
        # Log response
        duration = time.time() - start_time
        logger.info(f"Response: {response.status_code} ({duration:.3f}s)")
        
        return response
