from typing import List
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.planilla import CierreMensualItemResponse, DescuentoTardanzaResponse
from app.services.planilla_service import PlanillaService

router = APIRouter(prefix="/planilla", tags=["Planilla"])

MEDIA_TYPE_EXCEL = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
MEDIA_TYPE_PDF = "application/pdf"


@router.get("/simular-descuento", response_model=DescuentoTardanzaResponse)
def simular_descuento(
    tarifa_hora: float = Query(..., ge=0, description="Tarifa por hora del trabajador"),
    minutos_tardanza: int = Query(..., ge=0, description="Minutos acumulados de tardanza"),
):
    return PlanillaService.calcular_descuento_tardanza(tarifa_hora, minutos_tardanza)


@router.get("/cierre-mensual", response_model=List[CierreMensualItemResponse])
def cierre_mensual_descuentos(
    anio: int = Query(..., ge=2020, le=2100),
    mes: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
    _usuario_actual: dict = Depends(get_current_user),
):
    return PlanillaService.ejecutar_cierre_mensual(db, anio, mes)


@router.get("/exportar/excel")
def exportar_excel(
    anio: int = Query(..., ge=2020, le=2100),
    mes: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
    _usuario_actual: dict = Depends(get_current_user),
):
    datos = PlanillaService.ejecutar_cierre_mensual(db, anio, mes)
    archivo = PlanillaService.generar_excel_cierre_mensual(datos, anio, mes)
    return Response(
        content=archivo.getvalue(),
        media_type=MEDIA_TYPE_EXCEL,
        headers={
            "Content-Disposition": f'attachment; filename="planilla_{anio}_{mes:02d}.xlsx"'
        },
    )


@router.get("/exportar/pdf")
def exportar_pdf(
    anio: int = Query(..., ge=2020, le=2100),
    mes: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
    _usuario_actual: dict = Depends(get_current_user),
):
    datos = PlanillaService.ejecutar_cierre_mensual(db, anio, mes)
    archivo = PlanillaService.generar_pdf_cierre_mensual(datos, anio, mes)
    return Response(
        content=archivo.getvalue(),
        media_type=MEDIA_TYPE_PDF,
        headers={
            "Content-Disposition": f'attachment; filename="planilla_{anio}_{mes:02d}.pdf"'
        },
    )
