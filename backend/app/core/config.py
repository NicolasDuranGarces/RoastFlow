from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    project_name: str = "RoastSync API"
    api_v1_prefix: str = "/api/v1"
    secret_key: str = "change-me"  # override in production
    access_token_expire_minutes: int = 60 * 24
    algorithm: str = "HS256"
    database_url: str = "postgresql://postgres:postgres@db:5432/tuestecafe"
    first_superuser_email: str | None = None
    first_superuser_password: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
