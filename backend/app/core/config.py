"""Application settings, read from environment variables or ``backend/.env``."""

from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Runtime configuration. Secrets have no defaults so a missing value fails loudly."""

    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    # Browser origins allowed to call the API (the Vite dev server by default).
    cors_origins: list[str] = ["http://localhost:5173"]
    # One-click demo access for evaluators: off unless the server sets DEMO_ACCESS_ENABLED=true.
    # The accounts are created with scripts.create_demo_accounts; the passwords never leave
    # the server.
    demo_access_enabled: bool = False
    demo_buyer_email: str | None = None
    demo_buyer_password: SecretStr | None = None
    demo_admin_email: str | None = None
    demo_admin_password: SecretStr | None = None


@lru_cache
def get_settings() -> Settings:
    """Return the process-wide settings, loaded once."""
    return Settings()


def reveal(value: SecretStr | str | None) -> str | None:
    """The plain text of a secret setting, for the code that must use it."""
    return value.get_secret_value() if isinstance(value, SecretStr) else value
