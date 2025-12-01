"""
Custom exceptions and global exception handlers.
"""
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class MatchingServiceException(Exception):
    """Base exception for matching service."""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class SearchNotFoundError(MatchingServiceException):
    """Raised when a search is not found."""
    def __init__(self, search_id: str):
        super().__init__(
            message=f"Search ID '{search_id}' not found or expired.",
            status_code=status.HTTP_404_NOT_FOUND
        )


class ExternalServiceError(MatchingServiceException):
    """Raised when external service call fails."""
    def __init__(self, service: str, detail: str = ""):
        super().__init__(
            message=f"Failed to communicate with {service} service. {detail}".strip(),
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )


def register_exception_handlers(app: FastAPI) -> None:
    """Register global exception handlers."""
    
    @app.exception_handler(MatchingServiceException)
    async def matching_exception_handler(request: Request, exc: MatchingServiceException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )
