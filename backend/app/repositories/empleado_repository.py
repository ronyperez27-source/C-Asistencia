from abc import ABC, abstractmethod
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.empleado import EmpleadoModel


class IEmpleadoRepository(ABC):
    @abstractmethod
    def crear(self, empleado: EmpleadoModel) -> EmpleadoModel:
        pass

    @abstractmethod
    def obtener_por_dni(self, dni: str) -> Optional[EmpleadoModel]:
        pass

    @abstractmethod
    def obtener_por_id(self, empleado_id: int) -> Optional[EmpleadoModel]:
        pass

    @abstractmethod
    def listar(self) -> List[EmpleadoModel]:
        pass

    @abstractmethod
    def actualizar(self, empleado: EmpleadoModel) -> EmpleadoModel:
        pass


class SQLServerEmpleadoRepository(IEmpleadoRepository):
    def __init__(self, db: Session):
        self.db = db

    def crear(self, empleado: EmpleadoModel) -> EmpleadoModel:
        self.db.add(empleado)
        self.db.commit()
        self.db.refresh(empleado)
        return empleado

    def obtener_por_dni(self, dni: str) -> Optional[EmpleadoModel]:
        return self.db.query(EmpleadoModel).filter(EmpleadoModel.dni == dni).first()

    def obtener_por_id(self, empleado_id: int) -> Optional[EmpleadoModel]:
        return self.db.query(EmpleadoModel).filter(EmpleadoModel.id == empleado_id).first()

    def listar(self) -> List[EmpleadoModel]:
        return self.db.query(EmpleadoModel).all()

    def actualizar(self, empleado: EmpleadoModel) -> EmpleadoModel:
        self.db.commit()
        self.db.refresh(empleado)
        return empleado
