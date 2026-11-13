import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db

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


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def limpiar_bd():
    Base.metadata.drop_all(bind=engine_test)
    Base.metadata.create_all(bind=engine_test)
    yield


def test_registrar_empleado_valido():
    payload = {
        "dni": "71234567",
        "nombres": "Juan Pérez",
        "cargo": "Grifero",
        "tarifa_hora": 12.5,
    }
    res = client.post("/api/empleados/", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["dni"] == "71234567"
    assert data["codigo_qr"].startswith("EESH-71234567-")
    assert data["activo"] is True


def test_registrar_dni_duplicado():
    payload = {
        "dni": "71234567",
        "nombres": "Juan Pérez",
        "cargo": "Grifero",
        "tarifa_hora": 12.5,
    }
    client.post("/api/empleados/", json=payload)
    res_dup = client.post("/api/empleados/", json=payload)
    assert res_dup.status_code == 400
    assert res_dup.json()["detail"] == "El DNI ya se encuentra registrado"


def test_registrar_dni_invalido_y_tarifa_negativa():
    res_dni = client.post(
        "/api/empleados/",
        json={"dni": "123", "nombres": "Ana", "cargo": "Cajera", "tarifa_hora": 10},
    )
    assert res_dni.status_code == 422

    res_tarifa = client.post(
        "/api/empleados/",
        json={"dni": "87654321", "nombres": "Ana", "cargo": "Cajera", "tarifa_hora": -5},
    )
    assert res_tarifa.status_code == 422


def test_actualizar_empleado():
    creado = client.post(
        "/api/empleados/",
        json={
            "dni": "44556677",
            "nombres": "Carlos Ruiz",
            "cargo": "Grifero",
            "tarifa_hora": 11.0,
        },
    ).json()

    res = client.put(
        f"/api/empleados/{creado['id']}",
        json={"cargo": "Supervisor", "tarifa_hora": 15.0},
    )
    assert res.status_code == 200
    assert res.json()["cargo"] == "Supervisor"
    assert res.json()["tarifa_hora"] == 15.0

