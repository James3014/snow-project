"""
Centralized configuration for resort-services.
"""
import os
from functools import lru_cache
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    """Application settings loaded from environment variables."""
    
    # API Settings
    app_title: str = "SkiDIY Resort Services API"
    app_version: str = "0.1.0"
    
    # External Services
    user_core_api_url: str = ""
    
    # CORS Settings
    cors_origins: tuple = (
        "http://localhost:5173",
        "http://localhost:3000",
        "https://ski-platform.zeabur.app",
    )
    cors_origin_regex: str = r"https://.*\.zeabur\.app"
    
    # Cache Settings
    cache_maxsize: int = 128
    cache_ttl: int = 300  # seconds


@lru_cache
def get_settings() -> Settings:
    """Returns cached settings instance with env overrides."""
    return Settings(
        user_core_api_url=os.getenv("USER_CORE_API_URL", "http://user-core-api/events"),
        cache_maxsize=int(os.getenv("RESORT_API_CACHE_MAXSIZE", "128")),
        cache_ttl=int(os.getenv("RESORT_API_CACHE_TTL", "300")),
    )
