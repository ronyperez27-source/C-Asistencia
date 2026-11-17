import uuid
from typing import List
from fastapi import HTTPException, status

from app.models.empleado import EmpleadoModel
from app.repositories.empleado_repository import IEmpleadoRepository
from app.schemas.empleado import EmpleadoCreate, EmpleadoResponse, EmpleadoUpdate


class EmpleadoService:
    def __init__(self, repo: IEmpleadoRepository):
        self.repo = repo

    def generar_codigo_qr_unico(self, dni: str) -> str:
        sufijo = uuid.uuid4().hex[:6].upper()
        return f"EESH-{dni}-{sufijo}"

    def registrar_empleado(self, datos: EmpleadoCreate) -> EmpleadoResponse:
        existente = self.repo.obtener_por_dni(datos.dni)
        if existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El DNI ya se encuentra registrado",
            )

        nuevo_empleado = EmpleadoModel(
            dni=datos.dni,
            nombres=datos.nombres.strip(),
            cargo=datos.cargo.strip(),
            tarifa_hora=datos.tarifa_hora,
            codigo_qr=self.generar_codigo_qr_unico(datos.dni),
            activo=True,
        )
        guardado = self.repo.crear(nuevo_empleado)
        return EmpleadoResponse.model_validate(guardado)

    def listar_empleados(self) -> List[EmpleadoResponse]:
        empleados = self.repo.listar()
        return [EmpleadoResponse.model_validate(emp) for emp in empleados]

    def actualizar_empleado(
        self, empleado_id: int, datos: EmpleadoUpdate
    ) -> EmpleadoResponse:
        empleado = self.repo.obtener_por_id(empleado_id)
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

        actualizado = self.repo.actualizar(empleado)
        return EmpleadoResponse.model_validate(actualizado)
