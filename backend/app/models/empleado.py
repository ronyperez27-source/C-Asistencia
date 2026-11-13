from sqlalchemy import Column, Integer, String, Float, Boolean
from app.core.database import Base

class EmpleadoModel(Base):
    __tablename__ = "empleados"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    dni = Column(String(8), unique=True, index=True, nullable=False)
    nombres = Column(String(100), nullable=False)
    cargo = Column(String(50), nullable=False)
    tarifa_hora = Column(Float, nullable=False)
    codigo_qr = Column(String(100), unique=True, index=True, nullable=False)
    
    # Campo extra de buenas prácticas: en lugar de borrar empleados, los desactivamos
    activo = Column(Boolean, default=True)