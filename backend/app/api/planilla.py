from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.planilla import DescuentoTardanzaResponse
from app.services.planilla_service import PlanillaService

router = APIRouter(prefix="/planilla", tags=["Planilla"])


@router.get("/simular-descuento", response_model=DescuentoTardanzaResponse)
def simular_descuento(
    tarifa_hora: float = Query(..., ge=0, description="Tarifa por hora del trabajador"),
    minutos_tardanza: int = Query(..., ge=0, description="Minutos acumulados de tardanza"),
):
    return PlanillaService.calcular_descuento_tardanza(tarifa_hora, minutos_tardanza)


@router.get("/cierre-mensual", response_model=List[DescuentoTardanzaResponse])
def cierre_mensual_descuentos(
    anio: int = Query(..., ge=2020, le=2100),
    mes: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
):
    return PlanillaService.ejecutar_cierre_mensual(db, anio, mes)