from datetime import time
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.turno import Turno
from app.schemas.turno import TurnoResponse, TurnoUpdate

router = APIRouter(prefix="/turnos", tags=["Turnos"])


def asegurar_turnos_base(db: Session):
    if db.query(Turno).count() == 0:
        turnos_iniciales = [
            Turno(nombre="Mañana", hora_inicio=time(6, 0), hora_fin=time(14, 0), tolerancia_minutos=5),
            Turno(nombre="Tarde", hora_inicio=time(14, 0), hora_fin=time(22, 0), tolerancia_minutos=5),
            Turno(nombre="Noche", hora_inicio=time(22, 0), hora_fin=time(6, 0), tolerancia_minutos=5),
        ]
        db.add_all(turnos_iniciales)
        db.commit()


def serializar_turno(turno: Turno) -> TurnoResponse:
    return TurnoResponse(
        id=turno.id,
        nombre=turno.nombre,
        hora_inicio=turno.hora_inicio,
        hora_fin=turno.hora_fin,
        tolerancia_minutos=turno.tolerancia_minutos,
        hora_limite=turno.obtener_hora_limite(),
    )


@router.get("/", response_model=List[TurnoResponse])
def listar_turnos(db: Session = Depends(get_db)):
    asegurar_turnos_base(db)
    turnos = db.query(Turno).order_by(Turno.id).all()
    return [serializar_turno(t) for t in turnos]


@router.put("/{turno_id}", response_model=TurnoResponse)
def actualizar_turno(turno_id: int, datos: TurnoUpdate, db: Session = Depends(get_db)):
    turno = db.query(Turno).filter(Turno.id == turno_id).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    turno.hora_inicio = datos.hora_inicio
    turno.hora_fin = datos.hora_fin
    turno.tolerancia_minutos = datos.tolerancia_minutos
    db.commit()
    db.refresh(turno)
    return serializar_turno(turno)