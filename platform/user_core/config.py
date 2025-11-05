from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    USER_CORE_DB_URL: str = "sqlite:///./user_core.db"

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
