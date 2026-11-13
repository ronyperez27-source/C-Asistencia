from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str = "clave_secreta_grifo_cambiar_en_produccion_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    DATABASE_URL: str = "mssql+pyodbc://sa:TuPassword@localhost/GrifoDB?driver=ODBC+Driver+17+for+SQL+Server"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings() 