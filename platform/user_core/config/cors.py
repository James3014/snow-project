"""CORS middleware configuration."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import settings


def configure_cors(app: FastAPI) -> None:
    """Configure CORS middleware."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_origin_regex=settings.cors_origin_regex,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
