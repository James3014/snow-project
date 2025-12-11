"""Application settings using pydantic-settings."""
from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """Application configuration from environment variables."""
    
    # App
    app_name: str = "SnowTrace User Core Service"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Database
    database_url: str = "sqlite:///./test.db"
    
    # CORS
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "https://ski-platform.zeabur.app",
    ]
    cors_origin_regex: str = r"https://.*\.zeabur\.app"
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # JWT
    jwt_secret_key: str = "dev-secret-key"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 30
    jwt_fallback_secret: str = ""

    # Bot protection
    turnstile_secret: str = ""
    recaptcha_secret: str = ""
    
    # Changefeed
    user_core_changefeed_url: str = ""
    
    # API Key
    user_core_api_key: str = ""

    # Workflow Endpoints
    casi_workflow_url: str = ""
    casi_workflow_api_key: str = ""
    tripbuddy_workflow_url: str = ""
    tripbuddy_workflow_api_key: str = ""
    course_recommendation_workflow_url: str = ""
    course_recommendation_workflow_api_key: str = ""
    gear_reminder_workflow_url: str = ""
    gear_reminder_workflow_api_key: str = ""
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
