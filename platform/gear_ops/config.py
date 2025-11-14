"""
Configuration for Gear Operations

使用環境變數配置，簡單直接
"""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Gear Operations Settings"""

    # Database
    gear_db_url: str = os.environ.get('GEAR_DB_URL', os.environ.get('DB_URL', 'postgresql://user:password@localhost/gear_ops'))

    # User Core Integration
    user_core_base_url: str = os.environ.get('USER_CORE_BASE_URL', 'http://localhost:8000')

    # Notification Gateway
    notification_gateway_url: str = os.environ.get('NOTIFICATION_GATEWAY_URL', 'http://localhost:8001')

    # Redis (for caching, if needed later)
    redis_url: str = os.environ.get('GEAR_REDIS_URL', 'redis://localhost:6379/1')

    # JWT Secret (should match user_core)
    jwt_secret: str = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')

    # API
    api_prefix: str = '/api/gear'

    class Config:
        env_file = ".env"


settings = Settings()
