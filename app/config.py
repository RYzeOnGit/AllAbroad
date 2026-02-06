from typing import Optional

from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    database_url: str
    environment: str
    log_level: str
    admin_email: Optional[str] = None  # Set in .env for admin seeding on startup
    admin_password: Optional[str] = None
    jwt_secret: str
    jwt_algorithm: str
    access_token_expire_minutes: int

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()