"""Base exception classes."""
from typing import Optional, Dict, Any


class AppException(Exception):
    """Base exception for all application errors."""
    
    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"
    
    def __init__(
        self, 
        message: str, 
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.details = details or {}
        super().__init__(message)


class NotFoundError(AppException):
    """Resource not found."""
    status_code = 404
    error_code = "NOT_FOUND"


class ValidationError(AppException):
    """Validation failed."""
    status_code = 400
    error_code = "VALIDATION_ERROR"


class ConflictError(AppException):
    """Resource conflict (e.g., duplicate)."""
    status_code = 409
    error_code = "CONFLICT"


class UnauthorizedError(AppException):
    """Authentication required."""
    status_code = 401
    error_code = "UNAUTHORIZED"


class ForbiddenError(AppException):
    """Permission denied."""
    status_code = 403
    error_code = "FORBIDDEN"


class RateLimitError(AppException):
    """Rate limit exceeded."""
    status_code = 429
    error_code = "RATE_LIMIT_EXCEEDED"
