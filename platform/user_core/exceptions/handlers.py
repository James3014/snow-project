"""Exception handlers for FastAPI."""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from exceptions.base import AppException


def register_exception_handlers(app: FastAPI) -> None:
    """Register global exception handlers."""
    
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        """Handle application exceptions."""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.error_code,
                    "message": exc.message,
                    "details": exc.details
                }
            }
        )
    
    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        """Handle unexpected exceptions."""
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred",
                    "details": {}
                }
            }
        )
