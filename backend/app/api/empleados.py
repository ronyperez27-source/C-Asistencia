import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.empleado import EmpleadoModel
from app.schemas.empleado import EmpleadoCreate, EmpleadoResponse, EmpleadoUpdate

router = APIRouter(prefix="/api/empleados", tags=["Empleados"])


def generar_codigo_qr_unico(dni: str) -> str:
    sufijo = uuid.uuid4().hex[:6].upper()
    return f"EESH-{dni}-{sufijo}"


@router.post("/", response_model=EmpleadoResponse, status_code=status.HTTP_201_CREATED)
def registrar_empleado(empleado: EmpleadoCreate, db: Session = Depends(get_db)):
    existente = db.query(EmpleadoModel).filter(EmpleadoModel.dni == empleado.dni).first()
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El DNI ya se encuentra registrado",
        )

    nuevo_empleado = EmpleadoModel(
        dni=empleado.dni,
        nombres=empleado.nombres.strip(),
        cargo=empleado.cargo.strip(),
        tarifa_hora=empleado.tarifa_hora,
        codigo_qr=generar_codigo_qr_unico(empleado.dni),
        activo=True,
    )
    db.add(nuevo_empleado)
    db.commit()
    db.refresh(nuevo_empleado)
    return nuevo_empleado


@router.get("/", response_model=list[EmpleadoResponse])
def listar_empleados(db: Session = Depends(get_db)):
    return db.query(EmpleadoModel).all()


@router.put("/{empleado_id}", response_model=EmpleadoResponse)
def actualizar_empleado(
    empleado_id: int, datos: EmpleadoUpdate, db: Session = Depends(get_db)
):
    empleado = db.query(EmpleadoModel).filter(EmpleadoModel.id == empleado_id).first()
    if not empleado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empleado no encontrado",
        )

    if datos.nombres is not None:
        empleado.nombres = datos.nombres.strip()
    if datos.cargo is not None:
        empleado.cargo = datos.cargo.strip()
    if datos.tarifa_hora is not None:
        empleado.tarifa_hora = datos.tarifa_hora
    if datos.activo is not None:
        empleado.activo = datos.activo

    db.commit()
    db.refresh(empleado)
    return empleado