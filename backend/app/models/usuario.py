from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(20), default="ADMIN", nullable=False)
    activo = Column(Boolean, default=True)