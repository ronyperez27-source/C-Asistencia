from datetime import datetime, date, time, timedelta
from sqlalchemy import Column, Integer, String, Time
from app.core.database import Base


class Turno(Base):
    __tablename__ = "turnos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(30), unique=True, nullable=False)  # Mañana, Tarde, Noche
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    tolerancia_minutos = Column(Integer, default=5, nullable=False)

    def obtener_hora_limite(self) -> time:
        """Calcula la hora límite de ingreso sin penalización (hora_inicio + tolerancia)."""
        tolerancia = self.tolerancia_minutos if self.tolerancia_minutos is not None else 5
        dt_base = datetime.combine(date.today(), self.hora_inicio)
        dt_limite = dt_base + timedelta(minutes=tolerancia)
        return dt_limite.time()

    def evaluar_puntualidad(self, hora_marcaje: time) -> str:
        """Retorna 'A tiempo' si marca hasta la hora límite exacta, o 'Tardanza' si la supera."""
        limite = self.obtener_hora_limite()
        marcaje_sin_seg = hora_marcaje.replace(second=0, microsecond=0)
        return "A tiempo" if marcaje_sin_seg <= limite else "Tardanza"