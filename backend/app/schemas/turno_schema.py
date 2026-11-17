from datetime import time
from pydantic import BaseModel, Field


class TurnoActualizarRequest(BaseModel):
    hora_inicio: time
    hora_fin: time


class TurnoResponse(BaseModel):
    id: int
    nombre: str
    hora_inicio: time
    hora_fin: time
    tolerancia_minutos: int = Field(default=5)

    class Config:
        from_attributes = True