"""
Custom exceptions and global exception handlers.
"""
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class ResortAPIException(Exception):
    """Base exception for resort API."""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class ResortNotFoundError(ResortAPIException):
    """Raised when a resort is not found."""
    def __init__(self, resort_id: str):
        super().__init__(
            message=f"Resort with id '{resort_id}' not found.",
            status_code=status.HTTP_404_NOT_FOUND
        )


class ForbiddenError(ResortAPIException):
    """Raised when user lacks permission."""
    def __init__(self, message: str = "Permission denied"):
        super().__init__(message=message, status_code=status.HTTP_403_FORBIDDEN)


class ExternalServiceError(ResortAPIException):
    """Raised when external service call fails."""
    def __init__(self, service: str, detail: str):
        super().__init__(
            message=f"Failed to communicate with {service}: {detail}",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )


def register_exception_handlers(app: FastAPI) -> None:
    """Register global exception handlers."""
    
    @app.exception_handler(ResortAPIException)
    async def resort_api_exception_handler(request: Request, exc: ResortAPIException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )
