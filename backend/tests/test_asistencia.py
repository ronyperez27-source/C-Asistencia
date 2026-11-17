import pytest
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.empleado import EmpleadoModel
from app.models.asistencia import AsistenciaModel
from app.services.asistencia_service import registrar_marca

# Base de datos SQLite en memoria solo para pruebas unitarias
SQLALCHEMY_TEST_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_registrar_marca_valida_a_tiempo(db_session):
    empleado = EmpleadoModel(
        dni="71234567",
        nombres="Carlos Mendoza",
        cargo="Grifero",
        tarifa_hora=12.5,
        codigo_qr="QR-GRIFO-001",
        activo=True
    )
    db_session.add(empleado)
    db_session.commit()

    # Criterio de aceptación CAH-5: marca válida a las 05:58 AM
    hora_servidor = datetime(2026, 11, 17, 5, 58, 0)
    resultado = registrar_marca(db_session, "QR-GRIFO-001", hora_servidor)

    assert resultado["mensaje"] == "Entrada Registrada - A tiempo"
    assert resultado["empleado_nombres"] == "Carlos Mendoza"
    assert resultado["tipo_evento"] == "ENTRADA"
    assert resultado["fecha_hora"] == hora_servidor
    assert db_session.query(AsistenciaModel).count() == 1

def test_registrar_marca_codigo_inexistente(db_session):
    hora_servidor = datetime(2026, 11, 17, 6, 0, 0)

    with pytest.raises(HTTPException) as exc:
        registrar_marca(db_session, "QR-INEXISTENTE", hora_servidor)

    assert exc.value.status_code == 404
    assert db_session.query(AsistenciaModel).count() == 0

def test_registrar_marca_codigo_ilegible(db_session):
    hora_servidor = datetime(2026, 11, 17, 6, 0, 0)

    with pytest.raises(HTTPException) as exc:
        registrar_marca(db_session, "   ", hora_servidor)

    assert exc.value.status_code == 400
    assert db_session.query(AsistenciaModel).count() == 0