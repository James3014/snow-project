"""
Centralized configuration for snowbuddy-matching service.
"""
import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Optional


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
    matching_workflow_url: Optional[str] = None
    matching_workflow_api_key: Optional[str] = None
    matching_workflow_api_key_header: str = "X-API-Key"
    matching_workflow_auth_mode: str = "api_key"
    matching_workflow_sigv4_service: str = "execute-api"
    matching_workflow_callback_url: Optional[str] = None
    matching_workflow_timeout_seconds: int = 3600
    matching_notification_webhook_url: Optional[str] = None

    # AWS credentials (for SigV4 signing)
    aws_region: Optional[str] = None
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_session_token: Optional[str] = None


@lru_cache
def get_settings() -> Settings:
    """Returns cached settings instance with env overrides."""
    return Settings(
        redis_url=os.getenv("REDIS_URL", "redis://localhost:6379"),
        redis_ttl=int(os.getenv("REDIS_TTL", "3600")),
        user_core_api_url=os.getenv("USER_CORE_API_URL", "http://localhost:8001"),
        resort_services_api_url=os.getenv("RESORT_SERVICES_API_URL", "http://localhost:8000"),
        knowledge_engagement_api_url=os.getenv("KNOWLEDGE_ENGAGEMENT_API_URL", "http://localhost:8003"),
        matching_workflow_url=os.getenv("MATCHING_WORKFLOW_URL"),
        matching_workflow_api_key=os.getenv("MATCHING_WORKFLOW_API_KEY"),
        matching_workflow_api_key_header=os.getenv("MATCHING_WORKFLOW_API_KEY_HEADER", "X-API-Key"),
        matching_workflow_auth_mode=os.getenv("MATCHING_WORKFLOW_AUTH_MODE", "api_key"),
        matching_workflow_sigv4_service=os.getenv("MATCHING_WORKFLOW_SIGV4_SERVICE", "execute-api"),
        matching_workflow_callback_url=os.getenv("MATCHING_WORKFLOW_CALLBACK_URL"),
        matching_workflow_timeout_seconds=int(os.getenv("MATCHING_WORKFLOW_TIMEOUT_SECONDS", "3600")),
        matching_notification_webhook_url=os.getenv("MATCHING_NOTIFICATION_WEBHOOK_URL"),
        aws_region=os.getenv("AWS_REGION"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        aws_session_token=os.getenv("AWS_SESSION_TOKEN"),
    )
