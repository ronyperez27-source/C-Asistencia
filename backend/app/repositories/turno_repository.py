from datetime import time
from sqlalchemy.orm import Session
from app.models.turno import TurnoDB, TOLERANCIA_FIJA_MINUTOS


class TurnoRepository:
    def __init__(self, db: Session):
        self.db = db

    def obtener_todos(self) -> list[TurnoDB]:
        return self.db.query(TurnoDB).all()

    def obtener_por_id(self, turno_id: int) -> TurnoDB | None:
        return self.db.query(TurnoDB).filter(TurnoDB.id == turno_id).first()

    def actualizar_horario(
        self, turno_db: TurnoDB, hora_inicio: time, hora_fin: time
    ) -> TurnoDB:
        turno_db.hora_inicio = hora_inicio
        turno_db.hora_fin = hora_fin
        turno_db.tolerancia_minutos = TOLERANCIA_FIJA_MINUTOS
        self.db.commit()
        self.db.refresh(turno_db)
        return turno_db