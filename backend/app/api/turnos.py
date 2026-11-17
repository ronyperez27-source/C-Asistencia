from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.repositories.turno_repository import TurnoRepository
from app.schemas.turno_schema import TurnoActualizarRequest, TurnoResponse
from app.services.turno_service import TurnoService

router = APIRouter(prefix="/turnos", tags=["Turnos"])


def get_turno_service(db: Session = Depends(get_db)) -> TurnoService:
    return TurnoService(TurnoRepository(db))


@router.get("/", response_model=List[TurnoResponse])
def listar_turnos(service: TurnoService = Depends(get_turno_service)):
    return service.listar_turnos()


@router.put("/{turno_id}", response_model=TurnoResponse)
def actualizar_turno(
    turno_id: int,
    datos: TurnoActualizarRequest,
    service: TurnoService = Depends(get_turno_service),
):
    return service.configurar_turno(turno_id, datos.hora_inicio, datos.hora_fin)