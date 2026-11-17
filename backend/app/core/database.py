import urllib.parse
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import get_settings

settings = get_settings()

if settings.DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
elif (
    settings.DB_SERVER
    and settings.DB_NAME
    and settings.DB_USER
    and settings.DB_PASSWORD
):
    odbc_str = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={settings.DB_SERVER};"
        f"DATABASE={settings.DB_NAME};"
        f"UID={settings.DB_USER};"
        f"PWD={settings.DB_PASSWORD};"
        f"TrustServerCertificate=yes;"
    )
    params = urllib.parse.quote_plus(odbc_str)
    SQLALCHEMY_DATABASE_URL = f"mssql+pyodbc:///?odbc_connect={params}"
else:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(SQLALCHEMY_DATABASE_URL, echo=False, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
