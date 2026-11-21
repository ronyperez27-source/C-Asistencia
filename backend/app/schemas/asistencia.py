from pydantic import BaseModel, Field
from datetime import datetime

class MarcacionRequest(BaseModel):
    codigo_qr: str = Field(..., description="Código QR del fotocheck o DNI escaneado")

class MarcacionResponse(BaseModel):
    mensaje: str
    empleado_nombres: str
    cargo: str
    tipo_evento: str
    fecha_hora: datetime
    minutos_tardanza: int = Field(
        default=0,
        ge=0,
        description="Minutos de tardanza acumulados en la entrada (0 si es salida o llegó a tiempo)",
    )