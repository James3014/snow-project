"""
Centralized configuration for snowbuddy-matching service.
"""
import os
from dataclasses import dataclass
from functools import lru_cache


@dataclass(frozen=True)
class Settings:
    """Application settings loaded from environment variables."""
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    redis_ttl: int = 3600  # 1 hour
    
    # External Services
    user_core_api_url: str = "http://localhost:8001"
    resort_services_api_url: str = "http://localhost:8000"
    knowledge_engagement_api_url: str = "http://localhost:8003"


@lru_cache
def get_settings() -> Settings:
    """Returns cached settings instance with env overrides."""
    return Settings(
        redis_url=os.getenv("REDIS_URL", "redis://localhost:6379"),
        redis_ttl=int(os.getenv("REDIS_TTL", "3600")),
        user_core_api_url=os.getenv("USER_CORE_API_URL", "http://localhost:8001"),
        resort_services_api_url=os.getenv("RESORT_SERVICES_API_URL", "http://localhost:8000"),
        knowledge_engagement_api_url=os.getenv("KNOWLEDGE_ENGAGEMENT_API_URL", "http://localhost:8003"),
    )
