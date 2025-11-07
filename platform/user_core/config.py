from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    # 優先使用 DATABASE_URL（Zeabur PostgreSQL），否則使用本地 SQLite
    USER_CORE_DB_URL: str = os.getenv("DATABASE_URL", "sqlite:///./user_core.db")

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
