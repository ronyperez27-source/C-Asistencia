from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
from app.models.empleado import EmpleadoModel
from app.models.usuario import Usuario
from app.models.asistencia import AsistenciaModel
from app.models.turno import Turno

from app.api.auth_router import router as auth_router
from app.api.empleados import router as empleados_router
from app.api.asistencia import router as asistencia_router
from app.api.turnos import router as turnos_router
from app.api.planilla import router as planilla_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as exc:
        print(f"Advertencia al inicializar tablas en BD: {exc}")
    yield


app = FastAPI(
    title="Sistema de Asistencia - El Huamanguino",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(empleados_router, prefix="/api/v1")
app.include_router(asistencia_router, prefix="/api/v1")
app.include_router(turnos_router, prefix="/api/v1")
app.include_router(planilla_router, prefix="/api/v1")


@app.get("/")
def inicio():
    return {"mensaje": "API conectada a SQL Server correctamente"}