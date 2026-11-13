from abc import ABC, abstractmethod
from typing import Optional
from sqlalchemy.orm import Session
from app.models.usuario import Usuario

class IUsuarioRepository(ABC):
    @abstractmethod
    def get_by_username(self, username: str) -> Optional[Usuario]:
        pass

class SQLServerUsuarioRepository(IUsuarioRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_username(self, username: str) -> Optional[Usuario]:
        return self.db.query(Usuario).filter(
            Usuario.username == username,
            Usuario.activo == True
        ).first()