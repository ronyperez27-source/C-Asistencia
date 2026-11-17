from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.time_utils import obtener_timestamp_servidor
from app.schemas.asistencia import MarcacionRequest, MarcacionResponse
from app.services.asistencia_service import registrar_marca

router = APIRouter(prefix="/asistencia", tags=["Asistencia"])

@router.post("/marcar", response_model=MarcacionResponse)
def marcar_asistencia(payload: MarcacionRequest, db: Session = Depends(get_db)):
    timestamp_servidor = obtener_timestamp_servidor()
    return registrar_marca(db=db, codigo_qr=payload.codigo_qr, timestamp_servidor=timestamp_servidor)