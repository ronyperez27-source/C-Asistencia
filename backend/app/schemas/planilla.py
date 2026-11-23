from pydantic import BaseModel


class DescuentoTardanzaResponse(BaseModel):
    empleado_id: int | None = None
    dni: str | None = None
    nombres: str | None = None
    tarifa_hora: float
    tarifa_minuto: float
    minutos_tardanza: int
    monto_descuento: float


class CierreMensualItemResponse(BaseModel):
    empleado_id: int
    dni: str
    nombres: str
    cargo: str
    horas_trabajadas: float
    minutos_tardanza: int
    monto_descuento: float
