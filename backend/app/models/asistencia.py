from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.core.database import Base

class AsistenciaModel(Base):
    __tablename__ = "asistencias"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    empleado_id = Column(Integer, ForeignKey("empleados.id"), nullable=False, index=True)
    fecha_hora = Column(DateTime, nullable=False)
    tipo_evento = Column(String(20), nullable=False)  # "ENTRADA" o "SALIDA"
    estado = Column(String(30), nullable=False)       # "A tiempo", "Tardanza", "Completado"