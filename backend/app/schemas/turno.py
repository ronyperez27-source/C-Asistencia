from datetime import time
from pydantic import BaseModel, Field


class TurnoUpdate(BaseModel):
    hora_inicio: time
    hora_fin: time
    tolerancia_minutos: int = Field(default=5, ge=0, le=60)


class TurnoResponse(BaseModel):
    id: int
    nombre: str
    hora_inicio: time
    hora_fin: time
    tolerancia_minutos: int
    hora_limite: time

    class Config:
        from_attributes = True