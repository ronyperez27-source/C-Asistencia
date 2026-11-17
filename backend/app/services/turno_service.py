from datetime import time
from fastapi import HTTPException, status
from app.models.turno import TurnoDB, TOLERANCIA_FIJA_MINUTOS
from app.repositories.turno_repository import TurnoRepository

TURNOS_INICIALES = [
    {"nombre": "Mañana", "hora_inicio": time(6, 0), "hora_fin": time(14, 0)},
    {"nombre": "Tarde", "hora_inicio": time(14, 0), "hora_fin": time(22, 0)},
    {"nombre": "Noche", "hora_inicio": time(22, 0), "hora_fin": time(6, 0)},
]


class TurnoService:
    def __init__(self, repository: TurnoRepository):
        self.repository = repository

    def listar_turnos(self):
        turnos = self.repository.obtener_todos()
        if not turnos:
            for item in TURNOS_INICIALES:
                nuevo = TurnoDB(
                    nombre=item["nombre"],
                    hora_inicio=item["hora_inicio"],
                    hora_fin=item["hora_fin"],
                    tolerancia_minutos=TOLERANCIA_FIJA_MINUTOS,
                )
                self.repository.db.add(nuevo)
            self.repository.db.commit()
            turnos = self.repository.obtener_todos()
        return turnos

    def configurar_turno(self, turno_id: int, hora_inicio: time, hora_fin: time):
        turno = self.repository.obtener_por_id(turno_id)
        if not turno:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No se encontró el turno con ID {turno_id}.",
            )
        return self.repository.actualizar_horario(turno, hora_inicio, hora_fin)