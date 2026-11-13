from pydantic import BaseModel, Field, field_validator


class EmpleadoBase(BaseModel):
    dni: str = Field(..., min_length=8, max_length=8, description="DNI de 8 dígitos")
    nombres: str = Field(..., min_length=2, max_length=100)
    cargo: str = Field(..., min_length=2, max_length=50)
    tarifa_hora: float = Field(..., gt=0, description="Tarifa por hora mayor a 0")

    @field_validator("dni")
    @classmethod
    def validar_dni_numerico(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("El DNI debe contener exactamente 8 dígitos numéricos")
        return v


class EmpleadoCreate(EmpleadoBase):
    pass


class EmpleadoUpdate(BaseModel):
    nombres: str | None = Field(default=None, min_length=2, max_length=100)
    cargo: str | None = Field(default=None, min_length=2, max_length=50)
    tarifa_hora: float | None = Field(default=None, gt=0)
    activo: bool | None = None


class EmpleadoResponse(EmpleadoBase):
    id: int
    codigo_qr: str
    activo: bool

    class Config:
        from_attributes = True