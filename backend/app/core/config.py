import os
from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str = "clave_secreta_grifo_cambiar_en_produccion_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    DB_SERVER: Optional[str] = None
    DB_NAME: Optional[str] = None
    DB_USER: Optional[str] = None
    DB_PASSWORD: Optional[str] = None
    DATABASE_URL: Optional[str] = None

    class Config:
        env_file = (".env", "backend/.env")
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
