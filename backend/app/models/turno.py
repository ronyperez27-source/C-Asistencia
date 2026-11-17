from dataclasses import dataclass
from datetime import datetime, time, timedelta
from sqlalchemy import Column, Integer, String, Time
from app.core.database import Base

TOLERANCIA_FIJA_MINUTOS = 5


@dataclass
class Turno:
    nombre: str
    hora_inicio: time
    hora_fin: time
    tolerancia_minutos: int = TOLERANCIA_FIJA_MINUTOS

    def evaluar_marcaje(self, hora_marcaje: time) -> dict[str, str | int]:
        fecha_base = datetime(2026, 1, 1)
        dt_inicio = datetime.combine(fecha_base, self.hora_inicio)
        dt_marcaje = datetime.combine(fecha_base, hora_marcaje)

        if self._cruza_medianoche() and hora_marcaje < time(12, 0):
            dt_marcaje += timedelta(days=1)

        dt_limite_puntual = dt_inicio + timedelta(
            minutes=self.tolerancia_minutos, seconds=59
        )

        if dt_marcaje <= dt_limite_puntual:
            return {"estado": "Puntual", "minutos_tardanza": 0}

        minutos_tardanza = int((dt_marcaje - dt_inicio).total_seconds() // 60)
        return {"estado": "Tardanza", "minutos_tardanza": minutos_tardanza}

    def _cruza_medianoche(self) -> bool:
        return self.hora_inicio > self.hora_fin


class TurnoDB(Base):
    __tablename__ = "turnos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    tolerancia_minutos = Column(Integer, default=TOLERANCIA_FIJA_MINUTOS, nullable=False)