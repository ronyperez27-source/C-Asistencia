from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.empleado_repository import SQLServerEmpleadoRepository
from app.services.empleado_service import EmpleadoService
from app.schemas.empleado import EmpleadoCreate, EmpleadoResponse, EmpleadoUpdate

router = APIRouter(prefix="/empleados", tags=["Empleados"])


def get_empleado_service(db: Session = Depends(get_db)) -> EmpleadoService:
    repo = SQLServerEmpleadoRepository(db)
    return EmpleadoService(repo)


@router.post("/", response_model=EmpleadoResponse, status_code=status.HTTP_201_CREATED)
def registrar_empleado(
    empleado: EmpleadoCreate,
    service: EmpleadoService = Depends(get_empleado_service),
):
    return service.registrar_empleado(empleado)


@router.get("/", response_model=List[EmpleadoResponse])
def listar_empleados(service: EmpleadoService = Depends(get_empleado_service)):
    return service.listar_empleados()


@router.put("/{empleado_id}", response_model=EmpleadoResponse)
def actualizar_empleado(
    empleado_id: int,
    datos: EmpleadoUpdate,
    service: EmpleadoService = Depends(get_empleado_service),
):
    return service.actualizar_empleado(empleado_id, datos)
