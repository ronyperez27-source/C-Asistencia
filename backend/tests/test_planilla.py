from datetime import datetime, time
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from openpyxl import load_workbook
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import SecurityManager
from app.main import app
from app.models.asistencia import AsistenciaModel
from app.models.empleado import EmpleadoModel
from app.models.turno import Turno

SQLALCHEMY_TEST_URL = "sqlite://"
engine_test = create_engine(
    SQLALCHEMY_TEST_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


client = TestClient(app)


@pytest.fixture(autouse=True)
def preparar_bd():
    Base.metadata.drop_all(bind=engine_test)
    Base.metadata.create_all(bind=engine_test)

    override_anterior = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = override_get_db

    try:
        yield
    finally:
        if override_anterior is None:
            app.dependency_overrides.pop(get_db, None)
        else:
            app.dependency_overrides[get_db] = override_anterior


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def _headers_autenticados() -> dict[str, str]:
    token = SecurityManager.create_access_token({"sub": "admin", "rol": "ADMIN"})
    return {"Authorization": f"Bearer {token}"}


def _crear_empleado(
    db,
    dni: str,
    nombres: str,
    cargo: str = "Grifero",
    tarifa_hora: float = 12.0,
    activo: bool = True,
) -> EmpleadoModel:
    empleado = EmpleadoModel(
        dni=dni,
        nombres=nombres,
        cargo=cargo,
        tarifa_hora=tarifa_hora,
        codigo_qr=f"QR-{dni}",
        activo=activo,
    )
    db.add(empleado)
    db.commit()
    db.refresh(empleado)
    return empleado


def _crear_turno_manana(db) -> Turno:
    turno = Turno(
        nombre="Mañana",
        hora_inicio=time(6, 0),
        hora_fin=time(14, 0),
        tolerancia_minutos=5,
    )
    db.add(turno)
    db.commit()
    return turno


def _url_cierre(anio: int = 2026, mes: int = 11) -> str:
    return f"/api/v1/planilla/cierre-mensual?anio={anio}&mes={mes}"


def test_cierre_mensual_requiere_token():
    respuesta = client.get(_url_cierre())

    assert respuesta.status_code == 401
    assert respuesta.headers.get("www-authenticate") == "Bearer"


def test_cierre_mensual_rechaza_token_invalido():
    respuesta = client.get(
        _url_cierre(),
        headers={"Authorization": "Bearer token-invalido"},
    )

    assert respuesta.status_code == 401


def test_cierre_incluye_empleado_activo_sin_asistencias(db_session):
    empleado = _crear_empleado(
        db_session,
        dni="70000001",
        nombres="Sin Asistencias",
        tarifa_hora=15.0,
    )

    respuesta = client.get(_url_cierre(), headers=_headers_autenticados())

    assert respuesta.status_code == 200
    data = respuesta.json()
    assert len(data) == 1
    assert data[0] == {
        "empleado_id": empleado.id,
        "dni": "70000001",
        "nombres": "Sin Asistencias",
        "cargo": "Grifero",
        "horas_trabajadas": 0.0,
        "minutos_tardanza": 0,
        "monto_descuento": 0.0,
    }


def test_cierre_calcula_horas_de_jornada_completa(db_session):
    empleado = _crear_empleado(db_session, dni="70000002", nombres="Jornada Completa")
    _crear_turno_manana(db_session)

    db_session.add_all(
        [
            AsistenciaModel(
                empleado_id=empleado.id,
                fecha_hora=datetime(2026, 11, 10, 6, 0),
                tipo_evento="ENTRADA",
                estado="A tiempo",
            ),
            AsistenciaModel(
                empleado_id=empleado.id,
                fecha_hora=datetime(2026, 11, 10, 14, 0),
                tipo_evento="SALIDA",
                estado="Completado",
            ),
        ]
    )
    db_session.commit()

    respuesta = client.get(_url_cierre(), headers=_headers_autenticados())

    assert respuesta.status_code == 200
    data = respuesta.json()
    assert len(data) == 1
    assert data[0]["horas_trabajadas"] == 8.0
    assert data[0]["minutos_tardanza"] == 0
    assert data[0]["monto_descuento"] == 0.0


def test_cierre_calcula_tardanza_y_descuento(db_session):
    empleado = _crear_empleado(
        db_session,
        dni="70000003",
        nombres="Con Tardanza",
        tarifa_hora=12.0,
    )
    _crear_turno_manana(db_session)

    db_session.add_all(
        [
            AsistenciaModel(
                empleado_id=empleado.id,
                fecha_hora=datetime(2026, 11, 12, 6, 15),
                tipo_evento="ENTRADA",
                estado="Tardanza",
            ),
            AsistenciaModel(
                empleado_id=empleado.id,
                fecha_hora=datetime(2026, 11, 12, 14, 0),
                tipo_evento="SALIDA",
                estado="Completado",
            ),
        ]
    )
    db_session.commit()

    respuesta = client.get(_url_cierre(), headers=_headers_autenticados())

    assert respuesta.status_code == 200
    data = respuesta.json()
    assert len(data) == 1
    assert data[0]["horas_trabajadas"] == 7.75
    assert data[0]["minutos_tardanza"] == 15
    assert data[0]["monto_descuento"] == 3.0


def test_cierre_excluye_empleados_inactivos(db_session):
    _crear_empleado(
        db_session,
        dni="70000004",
        nombres="Empleado Inactivo",
        activo=False,
    )

    respuesta = client.get(_url_cierre(), headers=_headers_autenticados())

    assert respuesta.status_code == 200
    assert respuesta.json() == []


def test_simular_descuento_sigue_siendo_publico():
    respuesta = client.get(
        "/api/v1/planilla/simular-descuento",
        params={"tarifa_hora": 12.0, "minutos_tardanza": 30},
    )

    assert respuesta.status_code == 200
    assert respuesta.json()["monto_descuento"] == 6.0


@pytest.mark.parametrize(
    "ruta",
    [
        "/api/v1/planilla/exportar/excel",
        "/api/v1/planilla/exportar/pdf",
    ],
)
def test_exportaciones_requieren_token(ruta):
    respuesta = client.get(ruta, params={"anio": 2026, "mes": 11})

    assert respuesta.status_code == 401
    assert respuesta.headers.get("www-authenticate") == "Bearer"


def test_exportar_excel_con_token(db_session):
    empleado = _crear_empleado(
        db_session,
        dni="70000005",
        nombres="Exportación Excel",
        tarifa_hora=12.0,
    )
    _crear_turno_manana(db_session)
    db_session.add_all(
        [
            AsistenciaModel(
                empleado_id=empleado.id,
                fecha_hora=datetime(2026, 11, 13, 6, 15),
                tipo_evento="ENTRADA",
                estado="Tardanza",
            ),
            AsistenciaModel(
                empleado_id=empleado.id,
                fecha_hora=datetime(2026, 11, 13, 14, 0),
                tipo_evento="SALIDA",
                estado="Completado",
            ),
        ]
    )
    db_session.commit()

    respuesta = client.get(
        "/api/v1/planilla/exportar/excel",
        params={"anio": 2026, "mes": 11},
        headers=_headers_autenticados(),
    )

    assert respuesta.status_code == 200
    assert (
        respuesta.headers["content-type"]
        == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    assert (
        respuesta.headers["content-disposition"]
        == 'attachment; filename="planilla_2026_11.xlsx"'
    )
    assert len(respuesta.content) > 0

    libro = load_workbook(BytesIO(respuesta.content))
    hoja = libro.active

    assert hoja["A1"].value == (
        "Grifo El Huamanguino - Reporte de Planilla (11/2026)"
    )
    assert [hoja.cell(row=3, column=columna).value for columna in range(1, 7)] == [
        "DNI",
        "Empleado",
        "Cargo",
        "Horas Trabajadas",
        "Minutos Tardanza",
        "Descuento Monetario (S/)",
    ]
    assert hoja["A4"].value == "70000005"
    assert hoja["B4"].value == "Exportación Excel"
    assert hoja["C4"].value == "Grifero"
    assert hoja["D4"].value == 7.75
    assert hoja["E4"].value == 15
    assert hoja["F4"].value == 3.0
    assert hoja["A5"].value == "TOTAL"
    assert hoja["D5"].value == 7.75
    assert hoja["E5"].value == 15
    assert hoja["F5"].value == 3.0


def test_exportar_pdf_con_token(db_session):
    empleado = _crear_empleado(
        db_session,
        dni="70000006",
        nombres="Exportación PDF",
        tarifa_hora=12.0,
    )
    _crear_turno_manana(db_session)
    db_session.add_all(
        [
            AsistenciaModel(
                empleado_id=empleado.id,
                fecha_hora=datetime(2026, 11, 14, 6, 15),
                tipo_evento="ENTRADA",
                estado="Tardanza",
            ),
            AsistenciaModel(
                empleado_id=empleado.id,
                fecha_hora=datetime(2026, 11, 14, 14, 0),
                tipo_evento="SALIDA",
                estado="Completado",
            ),
        ]
    )
    db_session.commit()

    respuesta = client.get(
        "/api/v1/planilla/exportar/pdf",
        params={"anio": 2026, "mes": 11},
        headers=_headers_autenticados(),
    )

    assert respuesta.status_code == 200
    assert respuesta.headers["content-type"] == "application/pdf"
    assert (
        respuesta.headers["content-disposition"]
        == 'attachment; filename="planilla_2026_11.pdf"'
    )
    assert len(respuesta.content) > 0
    assert respuesta.content.startswith(b"%PDF")
