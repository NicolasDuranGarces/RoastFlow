from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

import json


class Settings(BaseSettings):
    project_name: str = "RoastSync API"
    api_v1_prefix: str = "/api/v1"
    secret_key: str = "change-me"  # override in production
    access_token_expire_minutes: int = 60 * 24
    algorithm: str = "HS256"
    database_url: str = "postgresql://postgres:postgres@db:5432/tuestecafe"
    first_superuser_email: str | None = None
    first_superuser_password: str | None = None
    root_path: str | None = ""
    backend_cors_origins: list[str] | str | None = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    @staticmethod
    def _normalize_cors(value: list[str] | str | None) -> list[str]:
        if value is None:
            return []
        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                return []
            if stripped.startswith("["):
                try:
                    parsed = json.loads(stripped)
                except json.JSONDecodeError:
                    parsed = None
                else:
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
            return [origin.strip() for origin in stripped.split(",") if origin.strip()]
        return [str(origin).strip() for origin in value if str(origin).strip()]

    @property
    def cors_origins(self) -> list[str]:
        return self._normalize_cors(self.backend_cors_origins)

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
